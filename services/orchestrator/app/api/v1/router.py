"""
Main API v1 router for the BeQ Orchestrator Service.

This module aggregates all v1 API endpoints and provides
the main router for the FastAPI application.
"""

from fastapi import APIRouter

# Import endpoint routers
from .chat import router as chat_router
from .schedule import router as schedule_router
from .bricks import router as bricks_router
from .users import router as users_router

# Create main API v1 router
api_v1_router = APIRouter()

# Include all endpoint routers
api_v1_router.include_router(
    chat_router,
    prefix="/chat",
    tags=["chat", "ai"]
)

api_v1_router.include_router(
    schedule_router,
    prefix="/schedule",
    tags=["schedule", "optimization"]
)

api_v1_router.include_router(
    bricks_router,
    prefix="/bricks",
    tags=["bricks", "tasks"]
)

api_v1_router.include_router(
    users_router,
    prefix="/users",
    tags=["users", "profiles"]
)
