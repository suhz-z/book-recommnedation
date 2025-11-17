"""
FastAPI app: TF-IDF content-based book recommender

Usage:
    # set DATASET_PATH to the folder where the Kaggle dataset lives, or pass file directly
    export DATASET_PATH="/home/you/.cache/kagglehub/datasets/cihanivit/book-data-set/versions/1"
    # or set BOOK_CSV to the full path of the CSV file
    export BOOK_CSV="$DATASET_PATH/books_data_set.csv"

    uvicorn app:app --reload --port 8000

Endpoints:
    GET  /health
    GET  /titles?query=...        -> fuzzy / substring title search (helps get exact title)
    GET  /recommend?title=...&k=... -> returns top-k recommendations for given title
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from difflib import get_close_matches
from typing import List, Optional

# -------------------------
# Config - adjust if needed
# -------------------------
BOOK_CSV = os.environ.get("BOOK_CSV")  # full path to CSV
DATASET_PATH = os.environ.get("DATASET_PATH")  # optional folder path
# If BOOK_CSV not set but DATASET_PATH is, try common file name
if not BOOK_CSV and DATASET_PATH:
    possible = ["books_data_set.csv", "books_with_year_and_ratings.csv", "books_data.csv", "books.csv"]
    for p in possible:
        candidate = os.path.join(DATASET_PATH, p)
        if os.path.exists(candidate):
            BOOK_CSV = candidate
            break

# Final fallback (will raise on startup if not provided)
if not BOOK_CSV:
    BOOK_CSV = "books_data_set.csv"  # user can place file next to app.py

# -------------------------
# FastAPI app & models
# -------------------------
app = FastAPI(title="Book Recommender (TF-IDF)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendItem(BaseModel):
    title: str
    authors: Optional[str] = None
    summary: Optional[str] = None
    score: float

class RecommendResponse(BaseModel):
    query_title: str
    results: List[RecommendItem]

# -------------------------
# Global variables filled on startup
# -------------------------
df = None
TEXT_COL = None
TITLE_COL = None
tfidf = None
tfidf_matrix = None

# -------------------------
# Helper functions
# -------------------------
def _clean_text(s: str) -> str:
    # simple cleaning; keep it fast and robust
    if not isinstance(s, str):
        s = "" if pd.isna(s) else str(s)
    s = s.lower().strip()
    # minimal cleaning: remove excessive whitespace
    s = " ".join(s.split())
    return s

def _find_title_index(title_query: str, return_candidates: bool = False):
    """Try exact match, substring, then fuzzy. Returns index or None.
       If return_candidates=True returns (index, candidates_list)"""
    # exact case-insensitive
    matches = df.index[df[TITLE_COL].astype(str).str.lower() == title_query.lower()].tolist()
    if matches:
        return (matches[0], None) if return_candidates else matches[0]
    # substring
    contains = df.index[df[TITLE_COL].astype(str).str.lower().str.contains(title_query.lower())].tolist()
    if contains:
        return (contains[0], [df.loc[i, TITLE_COL] for i in contains[:10]]) if return_candidates else contains[0]
    # fuzzy with difflib
    choices = df[TITLE_COL].astype(str).tolist()
    close = get_close_matches(title_query, choices, n=5, cutoff=0.55)
    if close:
        best = close[0]
        idx = int(df.index[df[TITLE_COL] == best][0])
        candidates = close
        return (idx, candidates) if return_candidates else idx
    return (None, []) if return_candidates else None

# -------------------------
# Startup: load data & vectorize
# -------------------------
@app.on_event("startup")
def startup_event():
    global df, TEXT_COL, TITLE_COL, tfidf, tfidf_matrix
    if not os.path.exists(BOOK_CSV):
        raise RuntimeError(f"BOOK_CSV not found: {BOOK_CSV}. Set BOOK_CSV or DATASET_PATH env var correctly.")
    print("Loading CSV:", BOOK_CSV)
    df = pd.read_csv(BOOK_CSV)
    print("Loaded df shape:", df.shape)

    # find best text column for summary
    preferred = ['desc', 'description', 'summary', 'about', 'excerpt', 'details']
    TEXT_COL = None
    for c in preferred:
        if c in df.columns:
            TEXT_COL = c
            break

    if TEXT_COL is None:
        # fallback create synthetic summary
        join_cols = [c for c in ['title', 'authors', 'genre'] if c in df.columns]
        if not join_cols:
            # fallback to first column
            df['summary_fallback'] = df.iloc[:, 0].astype(str)
        else:
            df['summary_fallback'] = df[join_cols].fillna('').astype(str).agg(' - '.join, axis=1)
        TEXT_COL = 'summary_fallback'

    # ensure title column
    TITLE_COL = 'title' if 'title' in df.columns else df.columns[0]

    # fillna and clean
    df[TEXT_COL] = df[TEXT_COL].fillna('').astype(str).map(_clean_text)
    df[TITLE_COL] = df[TITLE_COL].fillna('').astype(str)

    # drop rows with empty summaries to avoid bad vectors (optional)
    nonempty = df[df[TEXT_COL].str.strip() != ""].copy()
    if len(nonempty) < len(df):
        print(f"Dropping {len(df)-len(nonempty)} rows with empty {TEXT_COL}")
        df = nonempty.reset_index(drop=True)

    # build TF-IDF
    tfidf = TfidfVectorizer(stop_words='english', max_df=0.85, min_df=2, ngram_range=(1,2))
    tfidf_matrix = tfidf.fit_transform(df[TEXT_COL].tolist())
    print("TF-IDF matrix shape:", tfidf_matrix.shape)

# -------------------------
# Endpoints
# -------------------------
@app.get("/health")
def health():
    return {"status": "ok", "books_loaded": int(len(df) if df is not None else 0)}

@app.get("/titles")
def titles(query: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)):
    """Return title suggestions (substring + fuzzy)."""
    # substring matches
    subs = df[df[TITLE_COL].astype(str).str.lower().str.contains(query.lower())][TITLE_COL].unique().tolist()
    if len(subs) >= limit:
        return {"query": query, "matches": subs[:limit]}
    # fuzzy
    choices = df[TITLE_COL].astype(str).tolist()
    fuzzy = get_close_matches(query, choices, n=limit, cutoff=0.5)
    # merge, keep order and unique
    merged = subs + [f for f in fuzzy if f not in subs]
    return {"query": query, "matches": merged[:limit]}

@app.get("/recommend", response_model=RecommendResponse)
def recommend(title: str = Query(..., min_length=1), k: int = Query(10, ge=1, le=50), show_query: bool = False):
    """Return top-k recommendations for a given title (content-based TF-IDF)."""
    if tfidf_matrix is None:
        raise HTTPException(status_code=500, detail="Model not ready")

    res = _find_title_index(title, return_candidates=True)
    idx, candidates = res
    if idx is None:
        raise HTTPException(status_code=404, detail={
            "message": f"Title '{title}' not found",
            "candidates": candidates
        })

    # compute cosine similarities (fast for sparse tfidf)
    cosine_similarities = linear_kernel(tfidf_matrix[idx:idx+1], tfidf_matrix).flatten()
    # top indices excluding itself
    top_idx = np.argsort(-cosine_similarities)[1:k+1]
    items = []
    for i in top_idx:
        items.append({
            "title": str(df.loc[i, TITLE_COL]),
            "authors": str(df.loc[i, "authors"]) if "authors" in df.columns else None,
            "summary": str(df.loc[i, TEXT_COL])[:1000],  # truncate for safety
            "score": float(cosine_similarities[i])
        })
    return {"query_title": str(df.loc[idx, TITLE_COL]), "results": items}

# Optional endpoint to show top-n popular titles (for UI)
@app.get("/top_titles")
def top_titles(n: int = Query(20, ge=1, le=200)):
    return {"top_titles": df[TITLE_COL].head(n).astype(str).tolist()}
