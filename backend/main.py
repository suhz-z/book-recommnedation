"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import (
    APP_ORIGIN, MODEL_NAME, FAISS_INDEX_PATH, 
    EMBEDDINGS_PATH, IDS_PATH
)
from books import BookService
from embed import EmbeddingService
from api import routes


app = FastAPI(
    title="Book Recommendation API",
    description="read books similar",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[APP_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
async def startup():
    """Initialize services on application startup."""
    # Initialize
    routes.book_service = BookService()
    routes.embedding_service = EmbeddingService(MODEL_NAME)
    
    # Load or build FAISS index
    if not routes.embedding_service.load_index(
        FAISS_INDEX_PATH, EMBEDDINGS_PATH, IDS_PATH
    ):
        print("Building FAISS index (first run)...")
        texts = routes.book_service.df['combined_features'].tolist()
        ids = routes.book_service.df['id'].to_numpy()
        routes.embedding_service.build_index(texts, ids, FAISS_INDEX_PATH)
        print("Index built and saved!")
    else:
        print("Loaded existing FAISS index")


# Include routes
app.include_router(routes.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
