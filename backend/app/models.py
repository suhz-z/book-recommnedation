from sqlmodel import SQLModel, Field
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class Book(SQLModel, table=True):
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
    id: int
    title: str
    author: str
    genre: str
    subgenre: str
    rating: float
    cover_image_url: str
    similarity_score: float


class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now) 


# Request/Response schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
