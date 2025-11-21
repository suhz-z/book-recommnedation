import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
from sqlmodel import Session, select
from app.models import Book
from app.db.session import engine, create_db_and_tables

def clear_database():
    print("Clearing existing books...")
    with Session(engine) as session:
        books = session.exec(select(Book)).all()
        for book in books:
            session.delete(book)
        session.commit()
    print(" Database cleared")

def load_data(csv_file: str = 'books_dataset_100.csv'):
    print("Loading data from CSV...")
    
    create_db_and_tables()
    print(" Tables created")
    
    clear_database()
    

    csv_path = Path(__file__).parent.parent / 'data' / csv_file
    if not csv_path.exists():
        print(f" CSV file not found: {csv_path}")
        return
    
    df = pd.read_csv(csv_path)
    print(f" Read {len(df)} books from CSV")
    
    records = df.to_dict('records')
    
    print(f"Inserting {len(records)} books...")
    with Session(engine) as session:
        for idx, record in enumerate(records, 1):
            # Convert NaN to None
            for key, value in record.items():
                if pd.isna(value):
                    if key in ['series', 'awards']:
                        record[key] = None
                    elif key == 'series_number':
                        record[key] = 0
                    else:
                        record[key] = ''
            
            book = Book(**record)
            session.add(book)
            
            if idx % 10 == 0:
                session.commit()
                print(f"  {idx}/{len(records)} books inserted")
        
        session.commit()
    
    print(f" Successfully loaded {len(records)} books!")

if __name__ == "__main__":
    import sys
    csv_file = sys.argv[1] if len(sys.argv) > 1 else 'books_dataset_100.csv'
    load_data(csv_file)
