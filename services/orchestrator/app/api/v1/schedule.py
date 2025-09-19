"""
Schedule API endpoints for the BeQ Orchestrator Service.

This module provides endpoints for schedule management,
optimization, and calendar operations.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...core.config import get_settings

router = APIRouter()
settings = get_settings()


class ScheduleOptimizeRequest(BaseModel):
    """Request model for schedule optimization."""
    
    user_id: UUID = Field(..., description="User ID")
    start_date: datetime = Field(..., description="Optimization start date")
    end_date: datetime = Field(..., description="Optimization end date")
    brick_ids: Optional[List[UUID]] = Field(None, description="Specific Bricks to optimize")


class TaskInput(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str = "work"
    priority: str = "medium"  # low, medium, high, urgent
    estimated_duration_minutes: int
    deadline: Optional[datetime] = None
    preferred_time: Optional[str] = None  # "morning", "afternoon", "evening"
    dependencies: List[str] = Field(default_factory=list)


class EventInput(BaseModel):
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    is_moveable: bool = False


class UserPreferences(BaseModel):
    timezone: str = "UTC"
    work_start_time: str = "09:00"
    work_end_time: str = "17:00"
    break_frequency_minutes: int = 90
    break_duration_minutes: int = 15
    lunch_time: str = "12:00"
    lunch_duration_minutes: int = 60
    preferred_task_duration_minutes: int = 90
    energy_peak_hours: List[str] = Field(default_factory=lambda: ["09:00-11:00", "14:00-16:00"])
    avoid_scheduling_after: str = "18:00"


class ConstraintInput(BaseModel):
    type: str  # "time_block", "no_meetings", "focus_time"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    description: str
    is_hard_constraint: bool = True


class ScheduleGenerateRequest(BaseModel):
    user_id: UUID
    tasks: List[TaskInput]
    existing_events: List[EventInput] = Field(default_factory=list)
    user_preferences: UserPreferences
    constraints: List[ConstraintInput] = Field(default_factory=list)
    planning_horizon_days: int = 7


class ScheduleGenerateResponse(BaseModel):
    success: bool
    scheduled_events: List[Dict[str, Any]]
    reasoning: str
    confidence_score: float
    alternative_suggestions: List[str]
    warnings: List[str]
    unscheduled_tasks: List[str] = Field(default_factory=list)
    processing_time_seconds: float
    error: Optional[str] = None


@router.post("/generate", response_model=ScheduleGenerateResponse)
async def generate_schedule(request: ScheduleGenerateRequest):
    """Proxy schedule generation to Scheduler service, normalizing the response for the web client."""
    scheduler_url = f"{settings.scheduler_service_url.rstrip('/')}/api/v1/schedule"

    # Prepare payload expected by the Scheduler service
    payload = {
        "user_id": str(request.user_id),
        "tasks": [task.model_dump() for task in request.tasks],
        "existing_events": [event.model_dump() for event in request.existing_events],
        "user_preferences": request.user_preferences.model_dump(),
        "constraints": [c.model_dump() for c in request.constraints],
        "planning_horizon_days": request.planning_horizon_days,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(scheduler_url, json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            detail = e.response.json() if e.response is not None else {"error": str(e)}
            raise HTTPException(status_code=e.response.status_code if e.response else 502, detail=detail)
        except Exception as e:
            raise HTTPException(status_code=502, detail={"error": f"Scheduler unavailable: {str(e)}"})

    # Return the scheduler response as-is (fields already match frontend expectations)
    return ScheduleGenerateResponse(**data)


@router.post("/optimize")
async def optimize_schedule(request: ScheduleOptimizeRequest):
    """Optimize user's schedule using AI and constraint solving."""
    # TODO: Implement schedule optimization
    return {"message": "Schedule optimization feature coming soon"}


@router.get("/{user_id}")
async def get_user_schedule(
    user_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get user's current schedule."""
    # TODO: Implement schedule retrieval
    return {"message": "Schedule retrieval feature coming soon"}


@router.post("/{user_id}/reschedule")
async def reschedule_tasks(user_id: UUID, updates: dict):
    """Reschedule tasks based on user changes."""
    # TODO: Implement task rescheduling
    return {"message": "Task rescheduling feature coming soon"}
