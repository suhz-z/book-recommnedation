
import os
from pathlib import Path

# Directories
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
INDEX_DIR = Path(os.getenv("INDEX_DIR", BASE_DIR / "index_data"))
INDEX_DIR.mkdir(exist_ok=True)

# Files
BOOKS_CSV = DATA_DIR / "books_dataset_100.csv"
FAISS_INDEX_PATH = INDEX_DIR / "faiss_index.bin"
EMBEDDINGS_PATH = INDEX_DIR / "embeddings.npy"
IDS_PATH = INDEX_DIR / "ids.npy"

# Model
MODEL_NAME = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")

# CORS
APP_ORIGIN = os.getenv("APP_ORIGIN", "https://bookz-delta.vercel.app/")

# Text columns for embeddings
TEXT_COLUMNS = ['genre', 'subgenre', 'keywords', 'author', 'description']
