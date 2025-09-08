"""
BeQ RAG Recommender Service

This service provides RAG (Retrieval-Augmented Generation) capabilities
and personalized resource recommendations for the BeQ system.
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
    logger.info("Starting BeQ RAG Recommender Service", version="0.1.0")
    
    # Initialize services here
    # TODO: Initialize vector database connections
    # TODO: Load embedding models
    # TODO: Initialize recommendation engines
    
    yield
    
    # Shutdown
    logger.info("Shutting down BeQ RAG Recommender Service")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="BeQ RAG Recommender Service",
        description="RAG and resource recommendation service for BeQ",
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
            "service": "beq-rag-recommender",
            "version": "0.1.0"
        }
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "service": "BeQ RAG Recommender Service",
            "version": "0.1.0",
            "status": "operational"
        }
    
    # TODO: Add API routes for:
    # - Resource search and recommendations
    # - Vector similarity search
    # - Content indexing
    # - Personalization features
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
    )
