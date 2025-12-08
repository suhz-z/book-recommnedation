"""Application lifespan management."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.db.session import create_db_and_tables
from app.books import BookService
from app.embed import EmbeddingService
from app.api import routes
import numpy as np
import logging
from app.services.monitor import Monitor


logger = logging.getLogger(__name__) 

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    logger.info("🚀 Starting Book Recommendation API...")
    
    try:
        # Create tables
        logger.info("Creating database tables...")
        create_db_and_tables()
        logger.info("✓ Database tables ready")
        logger.info(f"Type: {type(settings.SECRET_KEY)}")
        
        # Initialize monitor
        logger.info("Initializing monitor...")
        app.state.monitor = Monitor(app)
        app.state.monitor_task = app.state.monitor.start()
        logger.info("✓ Monitor started")
        
        # Initialize services
        logger.info("Initializing BookService...")
        routes.book_service = BookService()
        logger.info("✓ BookService initialized")
        
        logger.info("Initializing EmbeddingService...")
        routes.embedding_service = EmbeddingService(settings.MODEL_NAME)
        logger.info(f"✓ Loaded model: {settings.MODEL_NAME}")
        
        # Load or build FAISS index
        logger.info("Checking FAISS index...")
        if not routes.embedding_service.load_index(
            settings.FAISS_INDEX_PATH,
            settings.EMBEDDINGS_PATH,
            settings.IDS_PATH
        ):
            logger.info("🔨 Building FAISS index...")
            books = routes.book_service.get_all_for_embeddings()
            logger.info(f"Found {len(books)} books for indexing")
            
            if books:
                logger.info("Generating embeddings...")
                texts = [
                    f"{b.title} {b.author} {b.genre} {b.subgenre} {b.keywords} {b.description}"
                    for b in books
                ]
                ids = np.array([b.id for b in books])
                routes.embedding_service.build_index(texts, ids, settings.FAISS_INDEX_PATH)
                logger.info("✓ FAISS index built successfully")
            else:
                logger.warning("⚠ No books found in database")
        else:
            logger.info("✓ Loaded existing FAISS index")

        logger.info(f"ENV: {settings.ENV}")
        logger.info(f"APP_ORIGIN: {settings.APP_ORIGIN}")
        logger.info(f"WEATHER_API_KEY configured: {bool(settings.WEATHER_API_KEY)}")
        
        logger.info("✨ Application ready!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")
    
    # Stop monitor gracefully
    if hasattr(app.state, 'monitor'):
        app.state.monitor.stop()
        if hasattr(app.state, 'monitor_task') and app.state.monitor_task:
            try:
                app.state.monitor_task.cancel()
                await app.state.monitor_task
            except Exception:
                pass
    
    logger.info("✓ Shutdown complete")
