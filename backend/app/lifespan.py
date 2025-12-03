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

logger = logging.getLogger(__name__) 
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    logger.info(" Starting Book Recommendation API...")
    
    # Create tables
    create_db_and_tables()
    logger.info(" Database tables ready")
    logger.info(f"Type: {type(settings.SECRET_KEY)}")
    
    # Initialize services
    routes.book_service = BookService()
    routes.embedding_service = EmbeddingService(settings.MODEL_NAME)
    logger.info(f" Loaded model: {settings.MODEL_NAME}")
    
    # Load or build FAISS index
    if not routes.embedding_service.load_index(
        settings.FAISS_INDEX_PATH,
        settings.EMBEDDINGS_PATH,
        settings.IDS_PATH
    ):
        logger.info(" Building FAISS index...")
        books = routes.book_service.get_all_for_embeddings()
        
        if books:
            texts = [
                f"{b.title} {b.author} {b.genre} {b.subgenre} {b.keywords} {b.description}"
                for b in books
            ]
            ids = np.array([b.id for b in books])
            routes.embedding_service.build_index(texts, ids, settings.FAISS_INDEX_PATH)
        else:
            logger.info("  No books found in database")
    else:
        logger.info("Loaded existing FAISS index")

    logger.info(f"ENV: {settings.ENV}")
    logger.info(f"APP_ORIGIN: {settings.APP_ORIGIN}")
    logger.info(f"WEATHER_API_KEY configured: {bool(settings.WEATHER_API_KEY)}")
    
    logger.info(" Application ready!")
    
    yield
    
    # Shutdown
    logger.info(" Shutting down...")
