"""
Bricks API endpoints for task management.

This module provides endpoints for creating, updating, and managing
Bricks (main tasks) and their associated Quantas (sub-tasks).
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class BrickCreateRequest(BaseModel):
    """Request model for creating a new Brick."""
    
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: str = Field(...)
    estimated_duration_minutes: int = Field(..., ge=1)
    priority: str = Field("medium")


@router.post("/")
async def create_brick(request: BrickCreateRequest, user_id: UUID):
    """Create a new Brick (main task)."""
    # TODO: Implement Brick creation
    return {"message": "Brick creation feature coming soon"}


@router.get("/{brick_id}")
async def get_brick(brick_id: UUID):
    """Get a specific Brick by ID."""
    # TODO: Implement Brick retrieval
    return {"message": "Brick retrieval feature coming soon"}


@router.put("/{brick_id}")
async def update_brick(brick_id: UUID, updates: dict):
    """Update a Brick."""
    # TODO: Implement Brick update
    return {"message": "Brick update feature coming soon"}


@router.delete("/{brick_id}")
async def delete_brick(brick_id: UUID):
    """Delete a Brick."""
    # TODO: Implement Brick deletion
    return {"message": "Brick deletion feature coming soon"}


@router.get("/")
async def list_user_bricks(
    user_id: UUID,
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """List user's Bricks with optional filtering."""
    # TODO: Implement Brick listing
    return {"message": "Brick listing feature coming soon"}
