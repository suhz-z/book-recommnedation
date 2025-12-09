"""Application lifespan management."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.db.session import create_db_and_tables
from app.books import BookService
from app.embed import EmbeddingService
from app.api import routes
import numpy as np
import asyncio
from app.logging import logger  # Use centralized logger
from app.services.monitor import Monitor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    logger.info("Starting Book Recommendation API...")
    
    monitor_started = False  # Track if monitor was started
    
    try:
        # Create tables
        logger.info("Creating database tables...")
        create_db_and_tables()
        logger.info("Database tables ready")
        
        # Initialize monitor
        logger.info("Initializing monitor...")
        app.state.monitor = Monitor(app)
        app.state.monitor_task = app.state.monitor.start()
        monitor_started = True
        logger.info(f"Monitor started (interval: 60s)")
        
        # Initialize services
        logger.info("Initializing BookService...")
        routes.book_service = BookService()
        logger.info("BookService initialized")
        
        logger.info("Initializing EmbeddingService...")
        routes.embedding_service = EmbeddingService(settings.MODEL_NAME)
        logger.info(f"Loaded model: {settings.MODEL_NAME}")
        
        # Load or build FAISS index
        logger.info("Checking FAISS index...")
        if not routes.embedding_service.load_index(
            settings.FAISS_INDEX_PATH,
            settings.EMBEDDINGS_PATH,
            settings.IDS_PATH
        ):
            logger.info("Building FAISS index...")
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
                logger.info("FAISS index built successfully")
            else:
                logger.warning("No books found in database - index will be empty")
        else:
            logger.info("Loaded existing FAISS index")

        # Log configuration info
        logger.info(f"Environment: {settings.ENV}")
        logger.info(f"CORS Origin: {settings.APP_ORIGIN}")
        logger.info(f"Weather API: {'Configured' if settings.WEATHER_API_KEY else 'Not configured'}")
        logger.info(f"Debug Mode: {settings.DEBUG}")
        
        logger.info("Application ready")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}", exc_info=True)
        
        # Cleanup on startup failure
        if monitor_started and hasattr(app.state, 'monitor'):
            try:
                logger.info("Cleaning up monitor after startup failure...")
                app.state.monitor.stop()
                if hasattr(app.state, 'monitor_task') and app.state.monitor_task:
                    app.state.monitor_task.cancel()
            except Exception as cleanup_error:
                logger.error(f"Error during cleanup: {cleanup_error}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    # Stop monitor gracefully
    if hasattr(app.state, 'monitor'):
        logger.info("Stopping background monitor...")
        try:
            # Signal the monitor to stop
            app.state.monitor.stop()
            
            # Wait for monitor task to complete with timeout
            if hasattr(app.state, 'monitor_task') and app.state.monitor_task:
                try:
                    await asyncio.wait_for(app.state.monitor_task, timeout=5.0)
                    logger.info("Monitor stopped gracefully")
                except asyncio.TimeoutError:
                    logger.warning("Monitor shutdown timeout - forcing cancellation")
                    app.state.monitor_task.cancel()
                    try:
                        # Give it a moment to cancel
                        await asyncio.wait_for(app.state.monitor_task, timeout=1.0)
                    except (asyncio.CancelledError, asyncio.TimeoutError):
                        logger.info("Monitor task forcefully terminated")
                except asyncio.CancelledError:
                    logger.info("Monitor task cancelled")
                except Exception as e:
                    logger.error(f"Unexpected error stopping monitor: {e}")
        except Exception as e:
            logger.error(f"Error during monitor shutdown: {e}")
    else:
        logger.warning("Monitor was not initialized")
    
    # Cleanup services space
    
    logger.info("Shutdown complete")
