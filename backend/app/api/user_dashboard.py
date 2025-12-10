"""User dashboard routes - PROTECTED for regular users."""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select
from app.models import User, Book, UserBookFavorite, FavoriteBookResponse
from app.db.session import get_session
from app.auth import get_current_user
from datetime import datetime
from typing import List

router = APIRouter(tags=["User Dashboard"])
templates = Jinja2Templates(directory="app/templates")

# ==================== HTML Routes ====================

@router.get("/", response_class=HTMLResponse)
async def user_dashboard_home(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """User dashboard welcome page - authenticated users only."""
    context = {
        "request": request,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "user_id": current_user.id,
        "member_since": current_user.created_at.strftime("%B %Y")
    }
    
    return templates.TemplateResponse("user_dashboard.html", context)

# ==================== API Routes ====================

@router.get("/api/welcome")
async def get_welcome_message(
    current_user: User = Depends(get_current_user)
):
    """Simple welcome API endpoint - USER ONLY."""
    return {
        "message": f"Welcome back, {current_user.name}!",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat(),
            "is_admin": current_user.is_admin
        }
    }

# ==================== Favorites Routes ====================

@router.get("/api/favorites", response_model=List[FavoriteBookResponse])
async def get_favorite_books(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all favorite books for current user."""
    statement = (
        select(Book, UserBookFavorite.favorited_at)
        .join(UserBookFavorite, Book.id == UserBookFavorite.book_id)
        .where(UserBookFavorite.user_id == current_user.id)
        .order_by(UserBookFavorite.favorited_at.desc())
    )
    
    results = session.exec(statement).all()
    
    favorites = [
        FavoriteBookResponse(
            id=book.id,
            title=book.title,
            author=book.author,
            genre=book.genre,
            subgenre=book.subgenre,
            rating=book.rating,
            cover_image_url=book.cover_image_url,
            favorited_at=favorited_at.isoformat()
        )
        for book, favorited_at in results
    ]
    
    return favorites

@router.post("/api/favorites/{book_id}")
async def add_favorite_book(
    book_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Add a book to favorites."""
    # Check if book exists
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Check if already favorited
    existing = session.exec(
        select(UserBookFavorite)
        .where(UserBookFavorite.user_id == current_user.id)
        .where(UserBookFavorite.book_id == book_id)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book already in favorites"
        )
    
    # Add to favorites
    favorite = UserBookFavorite(
        user_id=current_user.id,
        book_id=book_id,
        favorited_at=datetime.now()
    )
    session.add(favorite)
    session.commit()
    
    return {
        "message": "Book added to favorites",
        "book_id": book_id,
        "success": True
    }

@router.delete("/api/favorites/{book_id}")
async def remove_favorite_book(
    book_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Remove a book from favorites."""
    favorite = session.exec(
        select(UserBookFavorite)
        .where(UserBookFavorite.user_id == current_user.id)
        .where(UserBookFavorite.book_id == book_id)
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not in favorites"
        )
    
    session.delete(favorite)
    session.commit()
    
    return {
        "message": "Book removed from favorites",
        "book_id": book_id,
        "success": True
    }

@router.get("/api/favorites/check/{book_id}")
async def check_if_favorite(
    book_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Check if a book is in user's favorites."""
    favorite = session.exec(
        select(UserBookFavorite)
        .where(UserBookFavorite.user_id == current_user.id)
        .where(UserBookFavorite.book_id == book_id)
    ).first()
    
    return {
        "is_favorite": favorite is not None,
        "book_id": book_id
    }

@router.get("/api/favorites/count")
async def get_favorites_count(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get total count of user's favorite books."""
    from sqlmodel import func
    
    count = session.exec(
        select(func.count(UserBookFavorite.book_id))
        .where(UserBookFavorite.user_id == current_user.id)
    ).first()
    
    return {
        "count": count or 0,
        "user_id": current_user.id
    }
