"""
BeQ Calendar Integration Service

This service handles integration with external calendar providers
like Google Calendar, Microsoft Teams, and Outlook.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting BeQ Calendar Integration Service", version="0.1.0")
    
    # Initialize services here
    # TODO: Initialize OAuth clients for Google and Microsoft
    # TODO: Setup calendar sync background tasks
    # TODO: Initialize webhook handlers
    
    yield
    
    # Shutdown
    logger.info("Shutting down BeQ Calendar Integration Service")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="BeQ Calendar Integration Service",
        description="External calendar integration service for BeQ",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    
    # Middleware setup
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "beq-calendar-integration",
            "version": "0.1.0",
            "integrations": {
                "google_calendar": "available",
                "microsoft_graph": "available",
                "outlook": "available"
            }
        }
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "service": "BeQ Calendar Integration Service",
            "version": "0.1.0",
            "status": "operational",
            "supported_providers": [
                "google_calendar",
                "microsoft_teams",
                "outlook_calendar",
                "apple_calendar"
            ]
        }
    
    # TODO: Add API routes for:
    # - OAuth authentication flows
    # - Calendar event sync (bidirectional)
    # - Webhook receivers for real-time updates
    # - Calendar provider management
    # - Event conflict detection and resolution
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
    )
