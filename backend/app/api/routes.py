"""API routes."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import TypeAdapter
from app.models import Book, SimilarBook
from app.books import BookService
from app.embed import EmbeddingService
import httpx
import os

router = APIRouter()

# Global services (initialized in lifespan)
book_service: Optional[BookService] = None
embedding_service: Optional[EmbeddingService] = None

# Type adapters
book_list_adapter = TypeAdapter(List[Book])
similar_book_list_adapter = TypeAdapter(List[SimilarBook])


@router.get("/", tags=["Root"])
async def root():
    """API information."""
    return {
        "message": "Book Recommendation API",
        "version": "1.0.0",
        "status": "running"
    }


@router.get("/api/books", tags=["Books"])
async def get_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    genre: Optional[str] = None,
    language: Optional[str] = None,
    min_rating: Optional[float] = None
):
    """Get paginated books with optional filters."""
    filtered = book_service.get_all(genre, language, min_rating)
    total = len(filtered)
    start = (page - 1) * page_size
    paged = filtered[start:start + page_size]
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "books": book_list_adapter.validate_python([b.model_dump() for b in paged])
    }


@router.get("/api/books/{book_id}", response_model=Book, tags=["Books"])
async def get_book(book_id: int):
    """Get book details by ID."""
    book = book_service.get_by_id(book_id)
    if not book:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Book {book_id} not found")
    return book


@router.get("/api/books/{book_id}/similar", response_model=List[SimilarBook], tags=["Recommendations"])
async def get_similar_books(
    book_id: int,
    limit: int = Query(12, ge=1, le=50)
):
    """Get similar books."""
    book = book_service.get_by_id(book_id)
    if not book:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Book {book_id} not found")
    
    similar = embedding_service.search_similar(book_id, limit)
    if not similar:
        return []
    
    results = []
    for sim_id, score in similar:
        sim_book = book_service.get_by_id(sim_id)
        if sim_book:
            results.append({
                "id": sim_book.id,
                "title": sim_book.title,
                "author": sim_book.author,
                "genre": sim_book.genre,
                "subgenre": sim_book.subgenre,
                "rating": float(sim_book.rating),
                "cover_image_url": sim_book.cover_image_url,
                "similarity_score": round(score, 4)
            })
    
    return similar_book_list_adapter.validate_python(results)


@router.get("/api/books/search/", tags=["Search"])
async def search_books(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """Search books."""
    results = book_service.search(q)
    total = len(results)
    start = (page - 1) * page_size
    paged = results[start:start + page_size]
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "query": q,
        "books": book_list_adapter.validate_python([b.model_dump() for b in paged])
    }


@router.get("/api/weather", tags=["Weather"])
async def get_weather(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180)
):
    """Get current weather for given coordinates."""
    api_key = os.getenv("WEATHER_API_KEY")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Weather API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "metric"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "temp": round(data["main"]["temp"]),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "city": data["name"]
            }
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Weather service error: {e.response.status_code}"
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Weather service timeout"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch weather: {str(e)}"
        )

                                
    
    
