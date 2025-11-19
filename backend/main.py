"""
Refactored Book Recommendation FastAPI backend
Reduced LOC while preserving behavior and neatness.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pydantic import parse_obj_as

APP_ORIGIN = os.getenv("APP_ORIGIN", "http://localhost:3000")
DATA_DIR = os.getenv("DATA_DIR", "data")
BOOKS_CSV = os.path.join(DATA_DIR, "book_novels_dataset_500_latest.csv")

app = FastAPI(title="Book Recommendation API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[APP_ORIGIN], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Models ---
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

# --- Data loading & preprocessing ---
try:
    df = pd.read_csv(BOOKS_CSV)
except Exception as e:
    raise RuntimeError(f"Failed to read books CSV at {BOOKS_CSV}: {e}")

# coerce/clean relevant columns in a concise block
df = df.assign(
    isbn=lambda d: d['isbn'].astype(str),
    series_number=lambda d: d['series_number'].fillna(0).astype(int),
    series=lambda d: d['series'].fillna(''),
    awards=lambda d: d['awards'].fillna('')
)

# combined features used for TF-IDF similarity
_text_cols = ['genre', 'subgenre', 'keywords', 'author', 'description']
for c in _text_cols:
    if c not in df.columns:
        df[c] = ''

df['combined_features'] = df[_text_cols].fillna('').agg(' '.join, axis=1)

tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
_tf = tfidf.fit_transform(df['combined_features'])

# --- Helpers ---
def paginate(df_, page: int, page_size: int):
    total = len(df_)
    start = (page - 1) * page_size
    return total, df_.iloc[start:start + page_size]

def get_book_by_id(book_id: int):
    r = df.loc[df['id'] == book_id]
    return r.iloc[0].to_dict() if not r.empty else None

def calc_similarity(book_id: int, top_n: int = 10):
    idxs = df.index[df['id'] == book_id].tolist()
    if not idxs:
        return []
    idx = idxs[0]
    sims = cosine_similarity(_tf[idx:idx+1], _tf).flatten()
    ordered = sims.argsort()[::-1]
    chosen = [i for i in ordered if i != idx][:top_n]
    return [
        {
            'id': int(row['id']),
            'title': row['title'],
            'author': row['author'],
            'genre': row['genre'],
            'subgenre': row['subgenre'],
            'rating': float(row['rating']),
            'cover_image_url': row['cover_image_url'],
            'similarity_score': float(sims[i])
        }
        for i, row in zip(chosen, df.iloc[chosen].to_dict('records'))
    ]

# --- Routes (behavior preserved) ---
@app.get("/", tags=["Root"]) 
async def root():
    return {
        "message": "Book Recommendation API",
        "version": "1.0.0",
        "endpoints": {
            "books": "/api/books",
            "book_detail": "/api/books/{book_id}",
            "similar_books": "/api/books/{book_id}/similar",
            "search": "/api/books/search",
            "genres": "/api/genres",
            "authors": "/api/authors"
        }
    }

@app.get("/api/books", tags=["Books"]) 
async def get_books(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=1000), genre: Optional[str] = None, language: Optional[str] = None, min_rating: Optional[float] = Query(None, ge=0, le=5)):
    df_f = df
    if genre:
        df_f = df_f[df_f['genre'].str.lower() == genre.lower()]
    if language:
        df_f = df_f[df_f['language'].str.lower() == language.lower()]
    if min_rating is not None:
        df_f = df_f[df_f['rating'] >= min_rating]

    total, page_df = paginate(df_f, page, page_size)
    books = parse_obj_as(List[Book], page_df.to_dict('records'))
    return {"total": total, "page": page, "page_size": page_size, "books": books}

@app.get("/api/books/{book_id}", response_model=Book, tags=["Books"]) 
async def get_book_detail(book_id: int):
    book = get_book_by_id(book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    return Book(**book)

@app.get("/api/books/{book_id}/similar", response_model=List[SimilarBook], tags=["Recommendations"]) 
async def get_similar_books(book_id: int, limit: int = Query(10, ge=1, le=50)):
    if not get_book_by_id(book_id):
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    sims = calc_similarity(book_id, top_n=limit)
    if not sims:
        raise HTTPException(status_code=404, detail="No similar books found")
    return parse_obj_as(List[SimilarBook], sims)

@app.get("/api/books/search/", tags=["Search"]) 
async def search_books(q: str = Query(..., min_length=1), page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    ql = q.lower()
    mask = (
        df['title'].str.lower().str.contains(ql, na=False) |
        df['author'].str.lower().str.contains(ql, na=False) |
        df['keywords'].str.lower().str.contains(ql, na=False) |
        df['description'].str.lower().str.contains(ql, na=False)
    )
    total, page_df = paginate(df[mask], page, page_size)
    books = parse_obj_as(List[Book], page_df.to_dict('records'))
    return {"total": total, "page": page, "page_size": page_size, "books": books}

@app.get("/api/genres", tags=["Metadata"]) 
async def get_genres():
    return {"genres": [{"name": g, "count": int(c)} for g, c in df['genre'].value_counts().items()]}

@app.get("/api/authors", tags=["Metadata"]) 
async def get_authors(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200)):
    ad = df.groupby('author').agg({'id': 'count', 'author_nationality': 'first'}).reset_index()
    ad.columns = ['name', 'book_count', 'nationality']
    ad = ad.sort_values('book_count', ascending=False)
    total, page_df = paginate(ad, page, page_size)
    return {"total": total, "page": page, "page_size": page_size, "authors": page_df.to_dict('records')}

@app.get("/api/books/top-rated", tags=["Books"]) 
async def get_top_rated_books(limit: int = Query(20, ge=1, le=100)):
    top = df.nlargest(limit, 'rating')
    return parse_obj_as(List[Book], top.to_dict('records'))

@app.get("/api/stats", tags=["Metadata"]) 
async def get_statistics():
    return {
        "total_books": len(df),
        "total_authors": int(df['author'].nunique()),
        "total_genres": int(df['genre'].nunique()),
        "languages": df['language'].value_counts().to_dict(),
        "average_rating": float(df['rating'].mean()),
        "average_pages": int(df['pages'].mean()),
        "year_range": {"oldest": int(df['pub_year'].min()), "newest": int(df['pub_year'].max())}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
