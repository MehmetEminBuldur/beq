"""
BeQ Orchestrator Service Main Application

This is the main FastAPI application for the orchestrator service,
which serves as the central coordination point for the BeQ system.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

from .core.config import get_settings
from .core.logging import setup_logging
from .core.telemetry import get_telemetry_collector
from .api.v1.router import api_v1_router
from .api.health import router as health_router
from .llm.openrouter_client import (
    get_openai_conversational_client,
    cleanup_openai_conversational_client,
)
from .clients.scheduler_client import (
    get_scheduler_client,
    cleanup_scheduler_client,
)
from .clients.calendar_client import (
    get_calendar_client,
    cleanup_calendar_client,
)

# Prometheus metrics
REQUEST_COUNT = Counter('beq_orchestrator_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('beq_orchestrator_request_duration_seconds', 'Request duration')

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting BeQ Orchestrator Service", version="0.1.0")
    
    # Initialize services here
    # TODO: Initialize database connections
    # TODO: Initialize Redis connections
    # Initialize AI clients
    try:
        llm_client = await get_openai_conversational_client()
        app.state.llm_client = llm_client
        logger.info(
            "OpenAI LLM client initialized",
            model=getattr(llm_client, "model", None),
        )
    except Exception as e:
        logger.error("Failed to initialize OpenAI LLM client", error=str(e))

    # Initialize service clients
    try:
        scheduler_client = await get_scheduler_client()
        app.state.scheduler_client = scheduler_client
        logger.info("Scheduler client initialized")
    except Exception as e:
        logger.error("Failed to initialize scheduler client", error=str(e))

    # Initialize calendar client
    try:
        calendar_client = await get_calendar_client()
        app.state.calendar_client = calendar_client
        logger.info("Calendar client initialized")
    except Exception as e:
        logger.error("Failed to initialize calendar client", error=str(e))

    # Initialize telemetry
    try:
        telemetry_collector = get_telemetry_collector()
        app.state.telemetry_collector = telemetry_collector
        logger.info("Telemetry collector initialized")
    except Exception as e:
        logger.error("Failed to initialize telemetry collector", error=str(e))
    # TODO: Load ML models if needed
    
    yield
    
    # Shutdown
    logger.info("Shutting down BeQ Orchestrator Service")
    
    # Cleanup resources here
    # TODO: Close database connections
    # TODO: Close Redis connections
    # Cleanup AI clients
    try:
        await cleanup_openai_conversational_client()
        logger.info("OpenAI LLM client closed")
    except Exception as e:
        logger.warning("Error closing OpenAI LLM client", error=str(e))

    # Cleanup service clients
    try:
        await cleanup_scheduler_client()
        logger.info("Scheduler client closed")
    except Exception as e:
        logger.warning("Error closing scheduler client", error=str(e))

    # Cleanup calendar client
    try:
        await cleanup_calendar_client()
        logger.info("Calendar client closed")
    except Exception as e:
        logger.warning("Error closing calendar client", error=str(e))


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    # Setup logging
    setup_logging()
    
    app = FastAPI(
        title="BeQ Orchestrator Service",
        description="Central coordination service for Bricks and Quantas life management",
        version="0.1.0",
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url="/redoc" if settings.environment == "development" else None,
        lifespan=lifespan,
    )
    
    # Middleware setup
    setup_middleware(app)
    
    # Router setup
    setup_routes(app)
    
    # Exception handlers
    setup_exception_handlers(app)
    
    return app


def setup_middleware(app: FastAPI) -> None:
    """Setup middleware for the application."""
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Trusted host middleware
    if settings.environment == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.allowed_hosts
        )
    
    # Request logging and metrics middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all requests and collect metrics."""
        start_time = time.time()
        
        # Log request
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            user_agent=request.headers.get("user-agent"),
            request_id=request.headers.get("x-request-id")
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Update metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        REQUEST_DURATION.observe(duration)
        
        # Log response
        logger.info(
            "Request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2),
            request_id=request.headers.get("x-request-id")
        )
        
        return response


def setup_routes(app: FastAPI) -> None:
    """Setup application routes."""
    
    # Health check routes
    app.include_router(health_router, prefix="/health", tags=["health"])
    
    # API v1 routes
    app.include_router(api_v1_router, prefix="/api/v1")
    
    # Metrics endpoint
    @app.get("/metrics")
    async def get_metrics():
        """Prometheus metrics endpoint."""
        return Response(
            content=generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with service information."""
        return {
            "service": "BeQ Orchestrator Service",
            "version": "0.1.0",
            "status": "healthy",
            "environment": settings.environment,
            "docs_url": "/docs" if settings.environment == "development" else None
        }


def setup_exception_handlers(app: FastAPI) -> None:
    """Setup global exception handlers."""
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Global exception handler."""
        logger.error(
            "Unhandled exception",
            exc_info=exc,
            method=request.method,
            url=str(request.url),
            request_id=request.headers.get("x-request-id")
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Internal server error",
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred"
                },
                "request_id": request.headers.get("x-request-id")
            }
        )


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_config=None,  # We handle logging ourselves
    )
