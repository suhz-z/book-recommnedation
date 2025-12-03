from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.lifespan import lifespan
from app.api import routes
import logging
import time
from fastapi import Request
from pathlib import Path

Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler("logs/fastapi.log"),
        logging.StreamHandler()  # Also print to console
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Book Recommendation API",
    version="1.0.0",
    lifespan=lifespan
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {duration:.2f}ms"
    )
    return response




if settings.ENV == "development":
    # Development: Allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )
else:
    # Production: Restricted origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.APP_ORIGIN],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(routes.router)






if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
