"""Database models using SQLModel."""
from sqlmodel import SQLModel, Field
from typing import Optional
from pydantic import BaseModel

class Book(SQLModel, table=True):
    """Book database model."""
    __tablename__ = "books"
    
    id: int = Field(primary_key=True)
    title: str = Field(index=True)
    author: str = Field(index=True)
    author_nationality: str
    genre: str = Field(index=True)
    subgenre: str
    language: str
    pub_year: int
    pages: int
    publisher: str
    isbn: str
    series: Optional[str] = None
    series_number: Optional[int] = 0
    rating: float
    awards: Optional[str] = None
    description: str
    keywords: str
    cover_image_url: str


class SimilarBook(BaseModel):
    """Response model for similar books."""
    id: int
    title: str
    author: str
    genre: str
    subgenre: str
    rating: float
    cover_image_url: str
    similarity_score: float
