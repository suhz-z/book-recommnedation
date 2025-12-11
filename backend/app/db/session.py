"""Database session management."""
from sqlmodel import create_engine, Session, SQLModel
from app.config import settings

# Optimized for Supabase - use smaller pool to avoid MaxClients error
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,  # Reduced from 10 - fewer permanent connections
    max_overflow=10,  # Reduced from 20 - fewer temporary connections
    pool_recycle=300,  # Recycle connections after 5 minutes
    pool_timeout=30,  # Timeout for getting connection from pool
    connect_args={
        "connect_timeout": 10,
    }
)

def create_db_and_tables():
    """Create database tables."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session - properly closes connection after use."""
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close()  # Explicitly close to return to pool
