"""Logging configuration for the Book Recommendation API."""
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from app.config import settings


def setup_logging():
    """Configure logging to write to both file and console."""
    
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure log format
    log_format = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Determine log level based on environment
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # File handler with rotation (max 10MB, keep 5 backup files)
    file_handler = RotatingFileHandler(
        "logs/fastapi.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    

    logging.basicConfig(
        level=log_level,
        handlers=[file_handler, console_handler]
    )
    
  
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
 
    logger = logging.getLogger("book_api")
    return logger


logger = setup_logging()
