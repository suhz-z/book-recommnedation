
from typing import Optional
from pydantic import BaseModel


class Book(BaseModel):
    id: int
    title: str
    author: str
    author_nationality: str
    genre: str
    subgenre: str
    language: str
    pub_year: int
    pages: int
    publisher: str
    isbn: str
    series: Optional[str] = ""
    series_number: int = 0
    rating: float
    awards: Optional[str] = ""
    description: str
    keywords: str
    cover_image_url: str


class SimilarBook(BaseModel):
    id: int
    title: str
    author: str
    genre: str
    subgenre: str
    rating: float
    cover_image_url: str
    similarity_score: float
