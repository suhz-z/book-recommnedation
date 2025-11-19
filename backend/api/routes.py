"""API endpoint definitions."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import TypeAdapter

from models import Book, SimilarBook
from books import BookService
from embed import EmbeddingService


book_service: BookService = None
embedding_service: EmbeddingService = None

router = APIRouter()

# TypeAdapters 
book_list_adapter = TypeAdapter(List[Book])
similar_book_list_adapter = TypeAdapter(List[SimilarBook])


@router.get("/", tags=["Root"])
async def root():
    """API information and available endpoints."""
    return {
        "message": "Book Recommendation API (Embeddings + FAISS)",
        "version": "1.0.0",
        "endpoints": {
            "books": "/api/books",
            "book_detail": "/api/books/{book_id}",
            "similar_books": "/api/books/{book_id}/similar",
            "search": "/api/books/search",
            "top_rated": "/api/books/top-rated",
            "genres": "/api/genres",
            "authors": "/api/authors",
            "stats": "/api/stats"
        }
    }


@router.get("/api/books", tags=["Books"])
async def get_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    genre: Optional[str] = None,
    language: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5)
):
    """Get paginated list of books with optional filters."""
    filtered = book_service.get_all(genre, language, min_rating)
    total, page_df = book_service.paginate(filtered, page, page_size)
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "books": book_list_adapter.validate_python(page_df.to_dict('records'))
    }


@router.get("/api/books/{book_id}", response_model=Book, tags=["Books"])
async def get_book(book_id: int):
    """Get detailed information about a specific book."""
    book = book_service.get_by_id(book_id)
    if not book:
        raise HTTPException(404, f"Book with ID {book_id} not found")
    return book


@router.get("/api/books/{book_id}/similar", response_model=List[SimilarBook], tags=["Recommendations"])
async def get_similar_books(
    book_id: int, 
    limit: int = Query(10, ge=1, le=50)
):
    """Get books similar to the specified book."""
    if not book_service.get_by_id(book_id):
        raise HTTPException(404, f"Book with ID {book_id} not found")
    
    # Get similar book IDs and scores
    similar = embedding_service.search_similar(book_id, limit)
    if not similar:
        raise HTTPException(404, "No similar books found")
    
    # Enrich with book data
    results = []
    for book_id, score in similar:
        book = book_service.get_by_id(book_id)
        if book:
            results.append({
                "id": book['id'],
                "title": book['title'],
                "author": book['author'],
                "genre": book['genre'],
                "subgenre": book['subgenre'],
                "rating": float(book['rating']),
                "cover_image_url": book['cover_image_url'],
                "similarity_score": score
            })
    
    return similar_book_list_adapter.validate_python(results)


@router.get("/api/books/search/", tags=["Search"])
async def search_books(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """Search books by title, author, keywords, or description."""
    results = book_service.search(q)
    total, page_df = book_service.paginate(results, page, page_size)
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "books": book_list_adapter.validate_python(page_df.to_dict('records'))
    }


@router.get("/api/books/top-rated", tags=["Books"])
async def get_top_rated(limit: int = Query(20, ge=1, le=100)):
    """Get top rated books."""
    books = book_service.get_top_rated(limit)
    return book_list_adapter.validate_python(books.to_dict('records'))


@router.get("/api/genres", tags=["Metadata"])
async def get_genres():
    """Get all genres with book counts."""
    return {"genres": book_service.get_genres()}


@router.get("/api/authors", tags=["Metadata"])
async def get_authors(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    """Get all authors with book counts."""
    authors = book_service.get_authors()
    total, page_df = book_service.paginate(authors, page, page_size)
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "authors": page_df.to_dict('records')
    }


@router.get("/api/stats", tags=["Metadata"])
async def get_stats():
    """Get dataset statistics."""
    return book_service.get_stats()
