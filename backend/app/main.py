import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.errors import register_error_handlers
from app.api import health, upload, chat, analytics, report, settings as api_settings

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
    description="Enterprise-grade AI data analyst agent backend platform."
)

# Set CORS origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Request Log and Process Duration calculation middleware
@app.middleware("http")
async def log_api_requests(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    
    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        formatted_duration = f"{duration_ms:.2f}ms"
        
        logger.info(
            f"API Request -> Method: {method} | Path: {path} | "
            f"Status: {response.status_code} | Duration: {formatted_duration}"
        )
        response.headers["X-Process-Time"] = formatted_duration
        return response
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        logger.error(
            f"API Exception -> Method: {method} | Path: {path} | "
            f"Exception: {str(e)} | Duration: {duration_ms:.2f}ms"
        )
        raise e

# Register central error handling
register_error_handlers(app)

# Include API Routers
app.include_router(health.router, prefix=settings.API_STR, tags=["Health & Diagnostics"])
app.include_router(upload.router, prefix=f"{settings.API_STR}/upload", tags=["Ingestion & Uploads"])
app.include_router(chat.router, prefix=f"{settings.API_STR}/chat", tags=["Chat & Agents"])
app.include_router(analytics.router, prefix=f"{settings.API_STR}/analytics", tags=["Analytics KPIs"])
app.include_router(report.router, prefix=f"{settings.API_STR}/report", tags=["Generated Reports"])
app.include_router(api_settings.router, prefix=f"{settings.API_STR}/settings", tags=["Application Settings"])

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    logger.info(f"Uploads Directory: {settings.UPLOAD_DIR}")
    logger.info(f"Reports Directory: {settings.REPORT_DIR}")
    logger.info(f"Logs Directory: {settings.LOG_DIR}")
    logger.info("=" * 60)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Access health metrics at /api/health"
    }
