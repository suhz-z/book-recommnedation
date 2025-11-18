from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import random
from typing import List, Optional
import os

app = FastAPI(title="Book Recommendations API")

# Allow CORS for frontend (update origins as needed)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.getenv("DATA_DIR", "data")

# Load CSVs once (on startup)
books_path = os.path.join(DATA_DIR, "BX-Books.csv")
ratings_path = os.path.join(DATA_DIR, "BX-Book-Ratings-Subset.csv")
users_path = os.path.join(DATA_DIR, "BX-Users.csv")

df_books = pd.read_csv(books_path, sep=';', encoding='latin-1', dtype=str)
df_ratings = pd.read_csv(ratings_path, sep=';', encoding='latin-1', dtype={'User-ID': int, 'ISBN': str, 'Book-Rating': int})
df_users = pd.read_csv(users_path, sep=';', encoding='latin-1', dtype=str)

# Utility: ensure columns are present and types consistent
if 'ISBN' not in df_books.columns:
    raise RuntimeError("BX-Books.csv must contain 'ISBN' column")
if 'User-ID' not in df_ratings.columns:
    raise RuntimeError("BX-Book-Ratings-Subset.csv must contain 'User-ID' column")

# Build ISBN -> list(User-ID) mapping for Jaccard calculations
isbn_user_groups = df_ratings.groupby('ISBN')['User-ID'].apply(list).to_dict()

def jaccard_distance(user_ids_isbn_a: List[int], user_ids_isbn_b: List[int]) -> float:
    set_a = set(user_ids_isbn_a)
    set_b = set(user_ids_isbn_b)
    union = set_a.union(set_b)
    if not union:
        return 0.0
    intersection = set_a.intersection(set_b)
    return len(intersection) / float(len(union))

def book_to_dict(row: pd.Series):
    # safe retrieval with fallback keys used in your Streamlit app
    return {
        "ISBN": row.get("ISBN"),
        "Book-Title": row.get("Book-Title"),
        "Book-Author": row.get("Book-Author"),
        "Year-Of-Publication": row.get("Year-Of-Publication"),
        "Publisher": row.get("Publisher"),
        "Image-URL-L": row.get("Image-URL-L"),
        "Image-URL-M": row.get("Image-URL-M"),
        "Image-URL-S": row.get("Image-URL-S"),
    }

@app.get("/books/{isbn}")
def get_book(isbn: str):
    df = df_books[df_books['ISBN'] == isbn]
    if df.empty:
        raise HTTPException(status_code=404, detail="Book not found")
    row = df.iloc[0]
    return book_to_dict(row)

@app.get("/recommend/by_user/{user_id}")
def recommend_by_user(user_id: int, n: int = 10):
    """
    Recommend books based on user's favorite authors:
    - find authors the user has rated
    - return up to n other books by those authors not already read by user
    """
    # find what the user rated (from ratings)
    df_user_ratings = df_ratings[df_ratings['User-ID'] == user_id]
    if df_user_ratings.empty:
        # fallback: random sample of authors/books
        sample = df_books.sample(n=min(n, len(df_books)))
        return [book_to_dict(r) for _, r in sample.iterrows()]

    df_user_books = df_user_ratings.merge(df_books, on='ISBN', how='left')
    authors = df_user_books['Book-Author'].dropna().unique().tolist()
    read_titles = df_user_books['Book-Title'].dropna().tolist()
    # candidate books by these authors excluding already read titles
    candidates = df_books[df_books['Book-Author'].isin(authors)]
    candidates = candidates[~candidates['Book-Title'].isin(read_titles)]
    # sample (or head)
    if len(candidates) == 0:
        # fallback to random
        candidates = df_books.sample(n=min(n, len(df_books)))
    else:
        candidates = candidates.sample(n=min(n, len(candidates)))
    return [book_to_dict(r) for _, r in candidates.head(n).iterrows()]

@app.get("/recommend/trending")
def recommend_trending_among_friends(friends: Optional[str] = Query(None), n: int = 10):
    """
    friends query param: comma-separated user ids (e.g. ?friends=277427,278026)
    Returns books rated by friends (drop duplicates by title, sample up to n)
    """
    if not friends:
        raise HTTPException(status_code=400, detail="Please pass `friends` query parameter (comma-separated user ids).")
    try:
        friend_ids = [int(x) for x in friends.split(',') if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="friend ids must be integers")
    df = df_ratings[df_ratings['User-ID'].isin(friend_ids)].merge(df_books, on='ISBN', how='left')
    if df.empty:
        return []
    df_unique = df.drop_duplicates(subset=['Book-Title'])
    sample = df_unique.sample(n=min(n, len(df_unique)))
    return [book_to_dict(r) for _, r in sample.head(n).iterrows()]

@app.get("/recommend/similar/{isbn}")
def recommend_similar_books(isbn: str, n: int = 10):
    """
    Jaccard-based similarity: compute Jaccard between selected isbn's user set and other books' user sets.
    Returns up to n most similar ISBNs (excluding identical and extremes).
    """
    # handle cases for different editions: look for other ISBNs with same title
    title_series = df_books[df_books['ISBN'] == isbn]['Book-Title']
    if title_series.empty:
        # if ISBN not in books, fallback to random
        sample = df_books.sample(n=n)
        return [book_to_dict(r) for _, r in sample.iterrows()]

    title = title_series.iloc[0]
    diff_editions = df_books[(df_books['Book-Title'] == title) & (df_books['ISBN'] != isbn)]['ISBN'].values

    # find a valid isbn key in our isbn_user_groups that matches either isbn or editions
    valid_isbn = None
    if isbn in isbn_user_groups:
        valid_isbn = isbn
    else:
        for e in diff_editions:
            if e in isbn_user_groups:
                valid_isbn = e
                break
    if valid_isbn is None:
        # fallback: choose random ISBN from keys
        valid_isbn = random.choice(list(isbn_user_groups.keys()))

    base_users = isbn_user_groups.get(valid_isbn, [])
    # compute jaccard with other books
    lst = []
    for book_isbn, users in isbn_user_groups.items():
        if book_isbn == valid_isbn:
            continue
        d = jaccard_distance(base_users, users)
        # mirror your filters: require > 0 and < 0.8
        if d > 0.0 and d < 0.8:
            lst.append((book_isbn, d))
    # sort descending by jaccard (higher similarity first)
    lst_sorted = sorted(lst, key=lambda x: x[1], reverse=True)[:n]
    isbns = [x[0] for x in lst_sorted]
    df = df_books[df_books['ISBN'].isin(isbns)]
    # keep original order of isbns
    df['order'] = df['ISBN'].apply(lambda x: isbns.index(x) if x in isbns else -1)
    df = df.sort_values('order')
    return [book_to_dict(r) for _, r in df.head(n).iterrows()]

@app.get("/books/sample")
def sample_books(n: int = 10):
    sample = df_books.sample(n=min(n, len(df_books)))
    return [book_to_dict(r) for _, r in sample.iterrows()]

@app.get("/users/exists/{user_id}")
def user_exists(user_id: int):
    # returns true if user_id present in ratings or users CSV
    in_ratings = int(user_id) in df_ratings['User-ID'].unique()
    # df_users has different dtype, try to coerce
    in_users = False
    try:
        in_users = str(user_id) in df_users['User-ID'].astype(str).unique()
    except Exception:
        pass
    return {"exists_in_ratings": in_ratings, "exists_in_users": in_users}
