"""API routes."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import TypeAdapter
from app.models import Book, SimilarBook
from app.books import BookService
from app.embed import EmbeddingService
from app.api import AuthRoutes as auth
import httpx
from datetime import datetime, timedelta
from app.config import settings
from app.api import dashboard
from app.api import user_dashboard

router = APIRouter()


# Global services (initialized in lifespan)
book_service: Optional[BookService] = None
embedding_service: Optional[EmbeddingService] = None

# Type adapters
book_list_adapter = TypeAdapter(List[Book])
similar_book_list_adapter = TypeAdapter(List[SimilarBook])

router.include_router(auth.router)
router.include_router(dashboard.router, prefix="/admin")
router.include_router(user_dashboard.router, prefix="/user")

#cache
weather_cache = {}
CACHE_DURATION = timedelta(minutes=10)  # Cache for 10 minutes

def get_cache_key(lat: float, lon: float) -> str:
    """Generate cache key for coordinates (rounded to 2 decimals)."""
    return f"{round(lat, 2)}_{round(lon, 2)}"

def get_cached_weather(lat: float, lon: float):
    """Get weather from cache if available and not expired."""
    cache_key = get_cache_key(lat, lon)
    
    if cache_key in weather_cache:
        cached_data, cached_time = weather_cache[cache_key]
        if datetime.now() - cached_time < CACHE_DURATION:
            return cached_data
        else:
            # Remove expired cache entry
            del weather_cache[cache_key]
    
    return None

def set_cached_weather(lat: float, lon: float, data: dict):
    """Store weather data in cache."""
    cache_key = get_cache_key(lat, lon)
    weather_cache[cache_key] = (data, datetime.now())


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
    # Check if source book exists
    book = book_service.get_by_id(book_id)
    if not book:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Book {book_id} not found")
    
    # Get similar book IDs from FAISS
    similar = embedding_service.search_similar(book_id, limit)
    if not similar:
        return []
    
    # Extract IDs and fetch all books in ONE query
    similar_ids = [sim_id for sim_id, _ in similar]
    books_map = book_service.get_by_ids(similar_ids)  # ✅ Single DB query!
    
    # Build results maintaining FAISS order
    results = []
    for sim_id, score in similar:
        sim_book = books_map.get(sim_id)
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
    """Get current weather for given coordinates (with caching)."""
    
    # Check cache first
    cached_result = get_cached_weather(lat, lon)
    if cached_result:
        return {**cached_result, "cached": True}
    

    api_key = settings.WEATHER_API_KEY
    print(f"Using WEATHER_API_KEY of type: {bool(api_key)}")
    # If not in cache, fetch from API
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
            
            result = {
                "temp": round(data["main"]["temp"]),
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"],
                "city": data["name"],
                "cached": False
            }
            
            # Store in cache
            set_cached_weather(lat, lon, result)
            
            return result
            
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

                                
    
    
