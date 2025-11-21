"""Application lifespan management."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import settings
from app.db.session import create_db_and_tables
from app.books import BookService
from app.embed import EmbeddingService
from app.api import routes
import numpy as np


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    print(" Starting Book Recommendation API...")
    
    # Create tables
    create_db_and_tables()
    print(" Database tables ready")
    
    # Initialize services
    routes.book_service = BookService()
    routes.embedding_service = EmbeddingService(settings.MODEL_NAME)
    print(f" Loaded model: {settings.MODEL_NAME}")
    
    # Load or build FAISS index
    if not routes.embedding_service.load_index(
        settings.FAISS_INDEX_PATH,
        settings.EMBEDDINGS_PATH,
        settings.IDS_PATH
    ):
        print(" Building FAISS index...")
        books = routes.book_service.get_all_for_embeddings()
        
        if books:
            texts = [
                f"{b.title} {b.author} {b.genre} {b.subgenre} {b.keywords} {b.description}"
                for b in books
            ]
            ids = np.array([b.id for b in books])
            routes.embedding_service.build_index(texts, ids, settings.FAISS_INDEX_PATH)
        else:
            print("  No books found in database")
    else:
        print("Loaded existing FAISS index")
    
    print(" Application ready!")
    
    yield
    
    # Shutdown
    print(" Shutting down...")
