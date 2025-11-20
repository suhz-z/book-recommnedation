import json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from difflib import get_close_matches
import sys
import os

JSON_PATH = "data/Book.json" 

def load_data(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"books JSON not found at: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    return df

def prepare_text(df):
    # map fields from your JSON
    # use 'description' if present, else try combining genres and writer
    if 'description' in df.columns:
        text_col = 'description'
    else:
        # fallback
        fallback_cols = [c for c in ['genre_1', 'genre_2', 'writer', 'name'] if c in df.columns]
        df['description_fallback'] = df[fallback_cols].fillna('').astype(str).agg(' - '.join, axis=1)
        text_col = 'description_fallback'
    #clean
    df[text_col] = df[text_col].fillna('').astype(str)
    df['_text_clean'] = df[text_col].str.lower().str.replace(r'\s+', ' ', regex=True).str.strip()
    return df, text_col


#tfd

def build_tfidf(df):
    vectorizer = TfidfVectorizer(stop_words="english", min_df=1, max_df=0.9, ngram_range=(1,2))
    matrix = vectorizer.fit_transform(df['_text_clean'])
    return vectorizer, matrix

def find_by_name(df, query):
    # exact (case-insensitive)
    matches = df.index[df['name'].astype(str).str.lower() == query.lower()].tolist()
    if matches:
        return matches[0]
    # substring match
    contains = df.index[df['name'].astype(str).str.lower().str.contains(query.lower())].tolist()
    if contains:
        return contains[0]
    # fuzzy match
    choices = df['name'].astype(str).tolist()
    close = get_close_matches(query, choices, n=5, cutoff=0.55)
    if close:
        best = close[0]
        return int(df.index[df['name'] == best][0])
    return None

def recommend_by_name(df, matrix, name_query, top_k=5):
    idx = find_by_name(df, name_query)
    if idx is None:
        raise ValueError(f"Book '{name_query}' not found (no exact/substring/fuzzy match).")
    sim = linear_kernel(matrix[idx:idx+1], matrix).flatten()
    top_indices = np.argsort(-sim)[1:top_k+1]  # skip itself
    results = df.iloc[top_indices].copy()
    results['score'] = sim[top_indices]
    # return subset of useful columns
    out_cols = ['ID', 'name', 'writer', 'genre_1', 'genre_2', 'rating', 'score']
    available_cols = [c for c in out_cols if c in results.columns]
    return results[available_cols]

def interactive_loop(df, matrix):
    print(f"Loaded {len(df)} books.")
    print("Type a book name (or 'exit'). If the name isn't exact, script will try substring/fuzzy matching.")
    while True:
        try:
            q = input("\nEnter book name > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye.")
            return
        if not q or q.lower() in ('exit','quit'):
            print("Exiting.")
            return
        try:
            recs = recommend_by_name(df, matrix, q, top_k=6)
            print(f"\nRecommendations for '{q}':\n")
            for i, row in recs.iterrows():
                name = row.get('name', '')
                writer = row.get('writer', '')
                score = row.get('score', 0.0)
                rating = row.get('rating', None)
                genres = ", ".join([str(row[c]) for c in ['genre_1','genre_2'] if c in row and pd.notna(row[c]) and str(row[c])!='nan'])
                print(f"- {name}  | writer: {writer} | genres: {genres} | rating: {rating} | score: {score:.3f}")
        except Exception as e:
            print("Error:", e)
            # offer suggestions
            # try fuzzy suggestions
            choices = df['name'].astype(str).tolist()
            close = get_close_matches(q, choices, n=5, cutoff=0.4)
            if close:
                print("Did you mean:", "; ".join(close[:5]))

if __name__ == "__main__":
    try:
        df = load_data(JSON_PATH)
    except Exception as e:
        print("Failed to load JSON:", e)
        sys.exit(1)

    # ensure expected columns exist
    if 'name' not in df.columns:
        print("Warning: JSON items don't contain 'name' field. Available columns:", df.columns.tolist())

    df, text_col = prepare_text(df)
    vectorizer, matrix = build_tfidf(df)
    interactive_loop(df, matrix)