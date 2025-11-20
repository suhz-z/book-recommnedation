"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import (
    APP_ORIGIN, MODEL_NAME, FAISS_INDEX_PATH, 
    EMBEDDINGS_PATH, IDS_PATH
)
from books import BookService
from app.embed import EmbeddingService
from app.api import routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    
    print("Starting up...")
    

    routes.book_service = BookService()
    print(" Book service initialized")
    
    # Initialize embedding service
    routes.embedding_service = EmbeddingService(MODEL_NAME)
    print(f" Embedding model loaded: {MODEL_NAME}")
    
    # Load or build FAISS index
    if not routes.embedding_service.load_index(
        FAISS_INDEX_PATH, EMBEDDINGS_PATH, IDS_PATH
    ):
        print(" Building FAISS index (first run)...")
        texts = routes.book_service.df['combined_features'].tolist()
        ids = routes.book_service.df['id'].to_numpy()
        routes.embedding_service.build_index(texts, ids, FAISS_INDEX_PATH)
        print("Index built and saved!")
    else:
        print("Loaded existing FAISS index")
    
    print("Application ready!")
    
    # Yield control to the application
    yield
    
    # Shutdown: Cleanup (if needed)
    print(" Shutting down...")
    # Add cleanup code here if needed (close connections, save state, etc.)


# Create FastAPI app with lifespan
app = FastAPI(
    title="Book Recommendation API",
    description="AI-powered book recommendations using embeddings and FAISS",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[APP_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routes
app.include_router(routes.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
