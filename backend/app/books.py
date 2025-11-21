from sqlmodel import select
from typing import Optional, List
from app.db.session import get_session
from app.models import Book

class BookService:
    
    def get_by_id(self, book_id: int) -> Optional[Book]:
        with next(get_session()) as session:
            return session.get(Book, book_id)
    
    def get_all(
        self,
        genre: Optional[str] = None,
        language: Optional[str] = None,
        min_rating: Optional[float] = None
    ) -> List[Book]:
        with next(get_session()) as session:
            stmt = select(Book)
            
            if genre:
                stmt = stmt.where(Book.genre.ilike(f"%{genre}%"))
            if language:
                stmt = stmt.where(Book.language.ilike(f"%{language}%"))
            if min_rating is not None:
                stmt = stmt.where(Book.rating >= min_rating)
            
            return list(session.exec(stmt).all())
    
    def search(self, query: str) -> List[Book]:
        with next(get_session()) as session:
            q = f"%{query.lower()}%"
            stmt = select(Book).where(
                (Book.title.ilike(q)) |
                (Book.author.ilike(q)) |
                (Book.keywords.ilike(q)) |
                (Book.description.ilike(q))
            )
            return list(session.exec(stmt).all())
    
    def get_top_rated(self, limit: int = 20) -> List[Book]:
        with next(get_session()) as session:
            stmt = select(Book).order_by(Book.rating.desc()).limit(limit)
            return list(session.exec(stmt).all())
    
    def get_all_for_embeddings(self) -> List[Book]:
        with next(get_session()) as session:
            stmt = select(Book)
            return list(session.exec(stmt).all())
