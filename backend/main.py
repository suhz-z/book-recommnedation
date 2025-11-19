"""
Book Recommendation with Sentence-Transformers + FAISS
Drop-in replacement for TF-IDF similarity.
"""

import os
from typing import List, Optional

import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, parse_obj_as

# ---------- Config ----------
APP_ORIGIN = os.getenv("APP_ORIGIN", "http://localhost:3000")
DATA_DIR = os.getenv("DATA_DIR", "data")
BOOKS_CSV = os.path.join(DATA_DIR, "books_dataset_100.csv")
INDEX_DIR = os.getenv("INDEX_DIR", "index_data")
os.makedirs(INDEX_DIR, exist_ok=True)

FAISS_INDEX_PATH = os.path.join(INDEX_DIR, "faiss_index.bin")
EMB_PATH = os.path.join(INDEX_DIR, "embeddings.npy")
IDS_PATH = os.path.join(INDEX_DIR, "ids.npy")
MODEL_NAME = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")  # good default: fast + accurate

# ---------- FastAPI app ----------
app = FastAPI(title="Book Recommendation (Embeddings+FAISS)", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[APP_ORIGIN], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ---------- Pydantic models ----------
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

# ---------- Globals to hold data, model, index ----------
df = None
model = None
faiss_index = None
embeddings = None   # numpy ndarray (n_items, dim)
ids = None          # numpy array of book ids aligned with embeddings rows

# ---------- Utils ----------
def combine_text_columns(d: pd.DataFrame, cols):
    return d[cols].fillna('').agg(' '.join, axis=1)

def l2_normalize(x: np.ndarray):
    norms = np.linalg.norm(x, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return x / norms

def build_and_persist_index(emb: np.ndarray, ids_arr: np.ndarray, faiss_path=FAISS_INDEX_PATH):
    """
    Build an inner-product FAISS index on L2-normalized embeddings and persist it.
    We use IP on normalized vectors = cosine similarity.
    """
    emb_norm = l2_normalize(emb).astype('float32')
    dim = emb_norm.shape[1]
    index = faiss.IndexFlatIP(dim)   # simple, exact index (fast for small/medium datasets)
    index.add(emb_norm)
    faiss.write_index(index, faiss_path)
    np.save(EMB_PATH, emb_norm)
    np.save(IDS_PATH, ids_arr.astype(np.int64))
    return index

def load_index_and_metadata():
    """
    Loads a persisted FAISS index, embeddings, and ids. Returns (index, embeddings, ids).
    """
    if not (os.path.exists(FAISS_INDEX_PATH) and os.path.exists(EMB_PATH) and os.path.exists(IDS_PATH)):
        return None, None, None
    index = faiss.read_index(FAISS_INDEX_PATH)
    emb = np.load(EMB_PATH)
    ids_arr = np.load(IDS_PATH)
    return index, emb, ids_arr

def get_book_by_id_local(book_id: int):
    r = df.loc[df['id'] == book_id]
    return r.iloc[0].to_dict() if not r.empty else None

def search_similar_by_book_id(book_id: int, top_k: int = 10):
    """Return top_k similar books using FAISS. Returns list of dicts with similarity scores."""
    global faiss_index, embeddings, ids
    book_row = df.loc[df['id'] == book_id]
    if book_row.empty:
        return []

    # find the row index in ids array
    matches = np.where(ids == book_id)[0]
    if len(matches) == 0:
        return []

    row_idx = int(matches[0])
    # query vector = embeddings[row_idx] (already L2-normalized when saved)
    q = embeddings[row_idx].reshape(1, -1).astype('float32')
    # Remove self-match from results: ask for top_k + 1 and filter out self
    k = min(len(ids), top_k + 1)
    D, I = faiss_index.search(q, k)
    D = D.flatten()
    I = I.flatten()

    results = []
    for score, idx in zip(D, I):
        if idx == -1:
            continue
        found_id = int(ids[idx])
        if found_id == book_id:
            continue  # skip itself
        b = get_book_by_id_local(found_id)
        if not b:
            continue
        results.append({
            "id": int(b['id']),
            "title": b['title'],
            "author": b['author'],
            "genre": b['genre'],
            "subgenre": b['subgenre'],
            "rating": float(b.get('rating', 0.0)),
            "cover_image_url": b.get('cover_image_url', ''),
            "similarity_score": float(score)  # dot product on normalized vectors = cosine
        })
        if len(results) >= top_k:
            break
    return results

# ---------- Startup: load CSV, model, index (build if needed) ----------
@app.on_event("startup")
def startup():
    global df, model, faiss_index, embeddings, ids
    # Load dataset
    if not os.path.exists(BOOKS_CSV):
        raise RuntimeError(f"Books CSV not found at {BOOKS_CSV}")
    df = pd.read_csv(BOOKS_CSV)

    # Ensure required columns exist and basic cleaning
    df['isbn'] = df.get('isbn', '').astype(str)
    df['series_number'] = df.get('series_number', 0).fillna(0).astype(int)
    df['series'] = df.get('series', '').fillna('')
    df['awards'] = df.get('awards', '').fillna('')
    # create combined features (same idea as before)
    text_cols = ['genre', 'subgenre', 'keywords', 'author', 'description']
    for c in text_cols:
        if c not in df.columns:
            df[c] = ''
    df['combined_features'] = combine_text_columns(df, text_cols)

    # Load sentence-transformers model
    model = SentenceTransformer(MODEL_NAME)

    # Try to load persisted index & metadata
    faiss_index, embeddings, ids = load_index_and_metadata()

    if faiss_index is None:
        # build embeddings (may take time on first run)
        texts = df['combined_features'].astype(str).tolist()
        # encode in batches (SentenceTransformer will handle batching)
        emb = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
        # normalize and persist with faiss
        ids_arr = df['id'].to_numpy(dtype=np.int64)
        faiss_index = build_and_persist_index(emb, ids_arr)
        # load the saved normalized embeddings (so we have the same matrix in memory)
        embeddings = np.load(EMB_PATH)
        ids = np.load(IDS_PATH)
    else:
        # ensure embeddings/ids are loaded
        embeddings = embeddings.astype('float32')
        ids = ids.astype(np.int64)

# ---------- Endpoints (unchanged signatures except underlying similarity impl) ----------
@app.get("/", tags=["Root"])
async def root_info():
    return {
        "message": "Book Recommendation API (Embeddings + FAISS)",
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

def paginate(df_, page: int, page_size: int):
    total = len(df_)
    start = (page - 1) * page_size
    return total, df_.iloc[start:start + page_size]

@app.get("/api/books", tags=["Books"])
async def get_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    genre: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5)
):
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
    book = get_book_by_id_local(book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    return Book(**book)

@app.get("/api/books/{book_id}/similar", response_model=List[SimilarBook], tags=["Recommendations"])
async def get_similar_books(book_id: int, limit: int = Query(10, ge=1, le=50)):
    # verify book exists
    if get_book_by_id_local(book_id) is None:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    sims = search_similar_by_book_id(book_id, top_k=limit)
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
