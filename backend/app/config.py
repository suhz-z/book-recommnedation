"""Application configuration using pydantic-settings."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Environment
    ENV: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    
    # CORS
    APP_ORIGIN: str = "https://bookz-delta.vercel.app"

    WEATHER_API_KEY : str = None
    
    # Model
    MODEL_NAME: str = "all-MiniLM-L6-v2"
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent.resolve()
    INDEX_DIR: Path = BASE_DIR / "index_data"
    
    # FAISS paths
    FAISS_INDEX_PATH: Path = INDEX_DIR / "faiss_index.bin"
    EMBEDDINGS_PATH: Path = INDEX_DIR / "embeddings.npy"
    IDS_PATH: Path = INDEX_DIR / "ids.npy"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.INDEX_DIR.mkdir(exist_ok=True)

settings = Settings()


