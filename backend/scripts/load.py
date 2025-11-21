import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from sqlmodel import Session
from app.models import Book
from app.db.session import engine, create_db_and_tables

def load_data():
    print("Loading data from CSV...")
    
    create_db_and_tables()
    print(" Tables created")
    
    csv_path = Path(__file__).parent.parent / 'data' / 'books_dataset_100.csv'
    df = pd.read_csv(csv_path)
    print(f" Read {len(df)} books from CSV")
    
    # replace NaN with appropriate values
    df['series'] = df['series'].replace({np.nan: None})
    df['series_number'] = df['series_number'].fillna(0).astype(int)
    df['awards'] = df['awards'].replace({np.nan: None})
    
    # Ensure string fields are not NaN
    string_fields = ['title', 'author', 'author_nationality', 'genre', 'subgenre', 
                     'language', 'publisher', 'isbn', 'description', 'keywords', 'cover_image_url']
    for field in string_fields:
        df[field] = df[field].fillna('')
    
    print(" Data cleaned")
    
    print("Inserting books into database...")
    with Session(engine) as session:
        for idx, row in df.iterrows():
            book_data = row.to_dict()
            book = Book(**book_data)
            session.add(book)
            
            # Commit in batches for better performance
            if (idx + 1) % 10 == 0:
                session.commit()
                print(f"  Inserted {idx + 1}/{len(df)} books")
        
        # Commit any remaining
        session.commit()
    
    print(f" Successfully loaded {len(df)} books into database")

if __name__ == "__main__":
    load_data()
