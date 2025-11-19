
import pandas as pd
from typing import Optional
from config import BOOKS_CSV, TEXT_COLUMNS


class BookService:
    
    def __init__(self):
        self.df = self._load_data()
    
    def _load_data(self) -> pd.DataFrame:
        """Load and preprocess book dataset."""
        if not BOOKS_CSV.exists():
            raise FileNotFoundError(f"Books CSV not found at {BOOKS_CSV}")
        
        df = pd.read_csv(BOOKS_CSV)
        
        # Clean and standardize columns
        df['isbn'] = df.get('isbn', '').astype(str)
        df['series_number'] = df.get('series_number', 0).fillna(0).astype(int)
        df['series'] = df.get('series', '').fillna('')
        df['awards'] = df.get('awards', '').fillna('')
        
        # text columns exist
        for col in TEXT_COLUMNS:
            df[col] = df.get(col, '').fillna('')
        
        # Create combined text for embeddings
        df['combined_features'] = df[TEXT_COLUMNS].agg(' '.join, axis=1)
        
        return df
    
    def get_by_id(self, book_id: int) -> Optional[dict]:
        """Get book by ID."""
        result = self.df.loc[self.df['id'] == book_id]
        return result.iloc[0].to_dict() if not result.empty else None
    
    def get_all(
        self, 
        genre: Optional[str] = None,
        language: Optional[str] = None,
        min_rating: Optional[float] = None
    ) -> pd.DataFrame:
        """Get all books with optional filters."""
        filtered = self.df.copy()
        
        if genre:
            filtered = filtered[filtered['genre'].str.lower() == genre.lower()]
        if language:
            filtered = filtered[filtered['language'].str.lower() == language.lower()]
        if min_rating is not None:
            filtered = filtered[filtered['rating'] >= min_rating]
        
        return filtered
    
    def search(self, query: str) -> pd.DataFrame:
        """Search books by text query."""
        q = query.lower()
        mask = (
            self.df['title'].str.lower().str.contains(q, na=False) |
            self.df['author'].str.lower().str.contains(q, na=False) |
            self.df['keywords'].str.lower().str.contains(q, na=False) |
            self.df['description'].str.lower().str.contains(q, na=False)
        )
        return self.df[mask]
    
    def get_top_rated(self, limit: int = 20) -> pd.DataFrame:
        """Get top rated books."""
        return self.df.nlargest(limit, 'rating')
    
    def get_genres(self) -> list[dict]:
        """Get all genres with counts."""
        counts = self.df['genre'].value_counts()
        return [{"name": name, "count": int(count)} for name, count in counts.items()]
    
    def get_authors(self) -> pd.DataFrame:
        """Get all authors with book counts."""
        return (self.df.groupby('author')
                .agg({'id': 'count', 'author_nationality': 'first'})
                .rename(columns={'id': 'book_count', 'author_nationality': 'nationality'})
                .reset_index()
                .rename(columns={'author': 'name'})
                .sort_values('book_count', ascending=False))
    
    def get_stats(self) -> dict:
        """Get dataset statistics."""
        return {
            "total_books": len(self.df),
            "total_authors": int(self.df['author'].nunique()),
            "total_genres": int(self.df['genre'].nunique()),
            "languages": self.df['language'].value_counts().to_dict(),
            "average_rating": float(self.df['rating'].mean()),
            "average_pages": int(self.df['pages'].mean()),
            "year_range": {
                "oldest": int(self.df['pub_year'].min()), 
                "newest": int(self.df['pub_year'].max())
            }
        }
    
    @staticmethod
    def paginate(df: pd.DataFrame, page: int, page_size: int) -> tuple[int, pd.DataFrame]:
        """Paginate DataFrame."""
        total = len(df)
        start = (page - 1) * page_size
        return total, df.iloc[start:start + page_size]
