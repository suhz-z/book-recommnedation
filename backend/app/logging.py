"""Logging configuration for the Book Recommendation API."""
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
import os


def setup_logging():
    """Configure logging to write to both file and console."""
    
    # Hardcoded log directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Log file path - can override with env var
    log_file = Path(os.getenv("FASTAPI_LOG_FILE", "logs/fastapi.log"))
    
    # Configure log format - match monitor.py parsing format
    log_format = "%(asctime)s | %(levelname)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Determine log level from env
    debug = os.getenv("DEBUG", "False").lower() == "true"
    log_level = logging.DEBUG if debug else logging.INFO
    
    # File handler with rotation (max 10MB, keep 5 backup files)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()
    
    # Add our handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    # Get app logger
    app_logger = logging.getLogger("book_api")
    app_logger.info("Logging configured successfully")
    
    return app_logger


# Initialize logging when module is imported
logger = setup_logging()
