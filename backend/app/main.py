from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.lifespan import lifespan
from app.api import routes
from app.logging import logger 
import time
from fastapi import Request


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


# CORS Configuration
if settings.ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.APP_ORIGIN],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Set-Cookie"]
    )


app.include_router(routes.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_config=None  # Disable uvicorn's default logging, use ours
    )
