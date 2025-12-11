from sqlmodel import select
from typing import Optional, List
from app.db.session import get_session
from app.models import Book

class BookService:
    
    def get_by_id(self, book_id: int) -> Optional[Book]:
        """Get book by ID - properly manages session."""
        session = next(get_session())
        try:
            return session.get(Book, book_id)
        finally:
            session.close()
    
    def get_by_ids(self, book_ids: List[int]) -> dict[int, Book]:
        """Fetch multiple books by IDs in a single query.
        
        Returns:
            Dictionary mapping book_id -> Book for fast lookup
        """
        if not book_ids:
            return {}
        
        session = next(get_session())
        try:
            stmt = select(Book).where(Book.id.in_(book_ids))
            books = session.exec(stmt).all()
            return {book.id: book for book in books}
        finally:
            session.close()
    
    def get_all(
        self,
        genre: Optional[str] = None,
        language: Optional[str] = None,
        min_rating: Optional[float] = None
    ) -> List[Book]:
        session = next(get_session())
        try:
            stmt = select(Book)
            
            if genre:
                stmt = stmt.where(Book.genre.ilike(f"%{genre}%"))
            if language:
                stmt = stmt.where(Book.language.ilike(f"%{language}%"))
            if min_rating is not None:
                stmt = stmt.where(Book.rating >= min_rating)
            
            return list(session.exec(stmt).all())
        finally:
            session.close()
    
    def search(self, query: str) -> List[Book]:
        session = next(get_session())
        try:
            q = f"%{query.lower()}%"
            stmt = select(Book).where(
                (Book.title.ilike(q)) |
                (Book.author.ilike(q)) |
                (Book.keywords.ilike(q)) |
                (Book.description.ilike(q))
            )
            return list(session.exec(stmt).all())
        finally:
            session.close()
    
    def get_top_rated(self, limit: int = 20) -> List[Book]:
        session = next(get_session())
        try:
            stmt = select(Book).order_by(Book.rating.desc()).limit(limit)
            return list(session.exec(stmt).all())
        finally:
            session.close()
    
    def get_all_for_embeddings(self) -> List[Book]:
        session = next(get_session())
        try:
            stmt = select(Book)
            return list(session.exec(stmt).all())
        finally:
            session.close()
