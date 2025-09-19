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
from ...core.feature_flags import FeatureFlag, is_feature_enabled
from ...core.telemetry import (
    record_schedule_generation,
    record_schedule_optimization,
    record_feature_usage,
    get_telemetry_collector
)
from ...clients.scheduler_client import get_scheduler_client
import structlog
import time

router = APIRouter()
settings = get_settings()
logger = structlog.get_logger(__name__)


class ScheduleOptimizeRequest(BaseModel):
    """Request model for schedule optimization.

    Example:
        {
            "user_id": "123e4567-e89b-12d3-a456-426614174000",
            "start_date": "2024-01-15T00:00:00Z",
            "end_date": "2024-01-21T23:59:59Z",
            "brick_ids": ["456e7890-e89b-12d3-a456-426614174001"]
        }
    """

    user_id: UUID = Field(
        ...,
        description="Unique identifier for the user requesting optimization",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )
    start_date: datetime = Field(
        ...,
        description="Start date for the optimization period (ISO 8601 format)",
        examples=["2024-01-15T00:00:00Z"]
    )
    end_date: datetime = Field(
        ...,
        description="End date for the optimization period (ISO 8601 format). Must be after start_date",
        examples=["2024-01-21T23:59:59Z"]
    )
    brick_ids: Optional[List[UUID]] = Field(
        default=None,
        description="Optional list of specific Brick IDs to optimize. If not provided, all user's bricks will be considered",
        examples=[["456e7890-e89b-12d3-a456-426614174001", "789e0123-e89b-12d3-a456-426614174002"]]
    )


class TaskInput(BaseModel):
    """Input model for a task to be scheduled.

    Example:
        {
            "id": "task-123",
            "title": "Complete project proposal",
            "description": "Write and review the Q1 project proposal document",
            "category": "work",
            "priority": "high",
            "estimated_duration_minutes": 120,
            "deadline": "2024-01-20T17:00:00Z",
            "preferred_time": "morning",
            "dependencies": ["task-122"]
        }
    """

    id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier for the task",
        examples=["task-123", "brick-456"]
    )
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Human-readable title for the task",
        examples=["Complete project proposal", "Review quarterly budget"]
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Detailed description of the task",
        examples=["Write and review the Q1 project proposal document"]
    )
    category: str = Field(
        default="work",
        description="Category of the task",
        examples=["work", "personal", "health", "learning"]
    )
    priority: str = Field(
        default="medium",
        description="Priority level of the task",
        examples=["low", "medium", "high", "urgent"]
    )
    estimated_duration_minutes: int = Field(
        ...,
        gt=0,
        le=1440,  # Max 24 hours
        description="Estimated duration in minutes",
        examples=[30, 60, 120, 240]
    )
    deadline: Optional[datetime] = Field(
        default=None,
        description="Optional deadline for the task (ISO 8601 format)",
        examples=["2024-01-20T17:00:00Z"]
    )
    preferred_time: Optional[str] = Field(
        default=None,
        description="Preferred time slot for the task",
        examples=["morning", "afternoon", "evening", "anytime"]
    )
    dependencies: List[str] = Field(
        default_factory=list,
        description="List of task IDs that must be completed before this task",
        examples=[["task-122"], ["brick-456", "task-789"]]
    )


class EventInput(BaseModel):
    """Input model for existing calendar events.

    Example:
        {
            "id": "event-456",
            "title": "Team Standup Meeting",
            "start_time": "2024-01-15T09:00:00Z",
            "end_time": "2024-01-15T09:30:00Z",
            "is_moveable": false
        }
    """

    id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier for the event",
        examples=["event-456", "meeting-789"]
    )
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Title of the calendar event",
        examples=["Team Standup Meeting", "Project Review Session"]
    )
    start_time: datetime = Field(
        ...,
        description="Start time of the event (ISO 8601 format)",
        examples=["2024-01-15T09:00:00Z"]
    )
    end_time: datetime = Field(
        ...,
        description="End time of the event (ISO 8601 format). Must be after start_time",
        examples=["2024-01-15T09:30:00Z"]
    )
    is_moveable: bool = Field(
        default=False,
        description="Whether the event can be moved during optimization",
        examples=[False, True]
    )


class UserPreferences(BaseModel):
    """User preferences for scheduling and optimization.

    Example:
        {
            "timezone": "America/New_York",
            "work_start_time": "09:00",
            "work_end_time": "17:00",
            "break_frequency_minutes": 90,
            "break_duration_minutes": 15,
            "lunch_time": "12:00",
            "lunch_duration_minutes": 60,
            "preferred_task_duration_minutes": 90,
            "energy_peak_hours": ["09:00-11:00", "14:00-16:00"],
            "avoid_scheduling_after": "18:00"
        }
    """

    timezone: str = Field(
        default="UTC",
        description="User's timezone in IANA format",
        examples=["UTC", "America/New_York", "Europe/London"]
    )
    work_start_time: str = Field(
        default="09:00",
        description="Work day start time in HH:MM format",
        examples=["09:00", "08:30", "10:00"]
    )
    work_end_time: str = Field(
        default="17:00",
        description="Work day end time in HH:MM format",
        examples=["17:00", "16:30", "18:00"]
    )
    break_frequency_minutes: int = Field(
        default=90,
        gt=0,
        le=480,  # Max 8 hours
        description="Frequency of breaks in minutes",
        examples=[90, 60, 120]
    )
    break_duration_minutes: int = Field(
        default=15,
        gt=0,
        le=120,  # Max 2 hours
        description="Duration of breaks in minutes",
        examples=[15, 10, 20]
    )
    lunch_time: str = Field(
        default="12:00",
        description="Lunch time in HH:MM format",
        examples=["12:00", "12:30", "13:00"]
    )
    lunch_duration_minutes: int = Field(
        default=60,
        gt=0,
        le=180,  # Max 3 hours
        description="Lunch duration in minutes",
        examples=[60, 45, 90]
    )
    preferred_task_duration_minutes: int = Field(
        default=90,
        gt=0,
        le=480,  # Max 8 hours
        description="Preferred duration for tasks in minutes",
        examples=[90, 60, 120, 180]
    )
    energy_peak_hours: List[str] = Field(
        default_factory=lambda: ["09:00-11:00", "14:00-16:00"],
        description="Time ranges when user has highest energy/productivity",
        examples=[["09:00-11:00", "14:00-16:00"], ["08:00-12:00", "13:00-17:00"]]
    )
    avoid_scheduling_after: str = Field(
        default="18:00",
        description="Time after which to avoid scheduling tasks in HH:MM format",
        examples=["18:00", "19:00", "20:00"]
    )


class ConstraintInput(BaseModel):
    """Input model for scheduling constraints.

    Example:
        {
            "type": "focus_time",
            "start_time": "2024-01-15T09:00:00Z",
            "end_time": "2024-01-15T11:00:00Z",
            "description": "Deep work block for important project",
            "is_hard_constraint": true
        }
    """

    type: str = Field(
        ...,
        description="Type of constraint",
        examples=["time_block", "no_meetings", "focus_time", "break", "lunch"]
    )
    start_time: Optional[datetime] = Field(
        default=None,
        description="Start time of the constraint (ISO 8601 format)",
        examples=["2024-01-15T09:00:00Z"]
    )
    end_time: Optional[datetime] = Field(
        default=None,
        description="End time of the constraint (ISO 8601 format)",
        examples=["2024-01-15T11:00:00Z"]
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Human-readable description of the constraint",
        examples=["Deep work block for important project", "No meetings during this time"]
    )
    is_hard_constraint: bool = Field(
        default=True,
        description="Whether this constraint must be strictly followed (hard) or can be violated if necessary (soft)",
        examples=[True, False]
    )


class ScheduleGenerateRequest(BaseModel):
    """Request model for generating a new schedule.

    Example:
        {
            "user_id": "123e4567-e89b-12d3-a456-426614174000",
            "tasks": [
                {
                    "id": "task-123",
                    "title": "Complete project proposal",
                    "estimated_duration_minutes": 120
                }
            ],
            "existing_events": [
                {
                    "id": "meeting-456",
                    "title": "Team Standup",
                    "start_time": "2024-01-15T09:00:00Z",
                    "end_time": "2024-01-15T09:30:00Z"
                }
            ],
            "user_preferences": {
                "timezone": "America/New_York",
                "work_start_time": "09:00"
            },
            "constraints": [
                {
                    "type": "focus_time",
                    "start_time": "2024-01-15T10:00:00Z",
                    "end_time": "2024-01-15T12:00:00Z",
                    "description": "Deep work block"
                }
            ],
            "planning_horizon_days": 7
        }
    """

    user_id: UUID = Field(
        ...,
        description="Unique identifier for the user",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )
    tasks: List[TaskInput] = Field(
        ...,
        description="List of tasks to be scheduled",
        examples=[[{"id": "task-123", "title": "Complete project proposal", "estimated_duration_minutes": 120}]]
    )
    existing_events: List[EventInput] = Field(
        default_factory=list,
        description="List of existing calendar events that cannot be moved",
        examples=[[{"id": "meeting-456", "title": "Team Standup", "start_time": "2024-01-15T09:00:00Z", "end_time": "2024-01-15T09:30:00Z"}]]
    )
    user_preferences: UserPreferences = Field(
        ...,
        description="User's scheduling preferences and constraints"
    )
    constraints: List[ConstraintInput] = Field(
        default_factory=list,
        description="Additional scheduling constraints beyond user preferences",
        examples=[[{"type": "focus_time", "start_time": "2024-01-15T10:00:00Z", "end_time": "2024-01-15T12:00:00Z", "description": "Deep work block"}]]
    )
    planning_horizon_days: int = Field(
        default=7,
        gt=0,
        le=90,  # Max 3 months
        description="Number of days to plan ahead",
        examples=[7, 14, 30]
    )


class ScheduleGenerateResponse(BaseModel):
    """Response model for schedule generation.

    Example:
        {
            "success": true,
            "scheduled_events": [
                {
                    "id": "task-123",
                    "title": "Complete project proposal",
                    "start_time": "2024-01-15T10:00:00Z",
                    "end_time": "2024-01-15T12:00:00Z",
                    "type": "task",
                    "priority": "high"
                }
            ],
            "reasoning": "Scheduled high-priority task during peak energy hours (10 AM - 12 PM)",
            "confidence_score": 0.85,
            "alternative_suggestions": [
                "Could schedule during 2-4 PM if preferred",
                "Consider breaking into smaller 1-hour sessions"
            ],
            "warnings": ["Task duration exceeds preferred 90-minute limit"],
            "unscheduled_tasks": [],
            "processing_time_seconds": 1.23
        }
    """

    success: bool = Field(
        ...,
        description="Whether the schedule generation was successful",
        examples=[True, False]
    )
    scheduled_events: List[Dict[str, Any]] = Field(
        ...,
        description="List of successfully scheduled events with timing and metadata",
        examples=[[{"id": "task-123", "title": "Complete project proposal", "start_time": "2024-01-15T10:00:00Z", "end_time": "2024-01-15T12:00:00Z", "type": "task", "priority": "high"}]]
    )
    reasoning: str = Field(
        ...,
        description="AI-generated explanation of the scheduling decisions",
        examples=["Scheduled high-priority task during peak energy hours (10 AM - 12 PM)"]
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence level in the scheduling solution (0.0 to 1.0)",
        examples=[0.85, 0.92, 0.78]
    )
    alternative_suggestions: List[str] = Field(
        default_factory=list,
        description="Alternative scheduling options or suggestions",
        examples=[["Could schedule during 2-4 PM if preferred", "Consider breaking into smaller 1-hour sessions"]]
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Warnings about scheduling constraints or potential issues",
        examples=[["Task duration exceeds preferred 90-minute limit", "Some tasks scheduled outside preferred hours"]]
    )
    unscheduled_tasks: List[str] = Field(
        default_factory=list,
        description="List of task IDs that could not be scheduled",
        examples=[["task-456"], ["task-789", "task-101"]]
    )
    processing_time_seconds: float = Field(
        ...,
        description="Time taken to generate the schedule in seconds",
        examples=[1.23, 0.85, 2.15]
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if schedule generation failed",
        examples=["Insufficient available time slots", "Conflicting hard constraints"]
    )


class ScheduleOptimizeResponse(BaseModel):
    """Response model for schedule optimization.

    Example:
        {
            "success": true,
            "optimized_schedule": [
                {
                    "id": "task-123",
                    "title": "Complete project proposal",
                    "start_time": "2024-01-15T14:00:00Z",
                    "end_time": "2024-01-15T15:30:00Z",
                    "type": "task",
                    "priority": "high"
                }
            ],
            "improvements": [
                "Reduced task overlap by 45 minutes",
                "Scheduled during peak productivity hours",
                "Eliminated conflicts with existing meetings"
            ],
            "confidence_score": 0.91,
            "processing_time_seconds": 0.87
        }
    """

    success: bool = Field(
        ...,
        description="Whether the schedule optimization was successful",
        examples=[True, False]
    )
    optimized_schedule: List[Dict[str, Any]] = Field(
        ...,
        description="The optimized schedule with improved timing",
        examples=[[{"id": "task-123", "title": "Complete project proposal", "start_time": "2024-01-15T14:00:00Z", "end_time": "2024-01-15T15:30:00Z", "type": "task", "priority": "high"}]]
    )
    improvements: List[str] = Field(
        default_factory=list,
        description="List of specific improvements made to the schedule",
        examples=[["Reduced task overlap by 45 minutes", "Scheduled during peak productivity hours", "Eliminated conflicts with existing meetings"]]
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence level in the optimization solution (0.0 to 1.0)",
        examples=[0.91, 0.87, 0.95]
    )
    processing_time_seconds: float = Field(
        ...,
        description="Time taken to optimize the schedule in seconds",
        examples=[0.87, 1.23, 0.45]
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if optimization failed",
        examples=["No optimization opportunities found", "Hard constraints prevent improvements"]
    )


@router.post("/generate", response_model=ScheduleGenerateResponse)
async def generate_schedule(request: ScheduleGenerateRequest):
    """Proxy schedule generation to Scheduler service, normalizing the response for the web client."""
    user_id = str(request.user_id)
    start_time = time.time()

    # Check feature flag
    if not is_feature_enabled(FeatureFlag.SCHEDULE_OPTIMIZATION, user_id):
        record_feature_usage("schedule_generation", user_id, "disabled")
        raise HTTPException(
            status_code=403,
            detail={"error": "Schedule optimization feature is not enabled for this user"}
        )

    try:
        record_feature_usage("schedule_generation", user_id, "started")

        scheduler_client = await get_scheduler_client()

        # Convert Pydantic models to scheduler client format
        from ...clients.scheduler_client import (
            ScheduleRequest,
            TaskInput as SchedulerTask,
            EventInput as SchedulerEvent,
            UserPreferences as SchedulerPreferences,
            ConstraintInput as SchedulerConstraint
        )

        # Build scheduler request
        scheduler_request = ScheduleRequest(
            user_id=user_id,
            tasks=[
                SchedulerTask(
                    id=task.id,
                    title=task.title,
                    description=task.description,
                    category=task.category,
                    priority=task.priority,
                    estimated_duration_minutes=task.estimated_duration_minutes,
                    deadline=task.deadline.isoformat() if task.deadline else None,
                    preferred_time=task.preferred_time,
                    dependencies=task.dependencies
                ) for task in request.tasks
            ],
            existing_events=[
                SchedulerEvent(
                    id=event.id,
                    title=event.title,
                    start_time=event.start_time,
                    end_time=event.end_time,
                    is_moveable=event.is_moveable
                ) for event in request.existing_events
            ] if request.existing_events else None,
            user_preferences=SchedulerPreferences(
                timezone=request.user_preferences.timezone,
                work_start_time=request.user_preferences.work_start_time,
                work_end_time=request.user_preferences.work_end_time,
                break_frequency_minutes=request.user_preferences.break_frequency_minutes,
                break_duration_minutes=request.user_preferences.break_duration_minutes,
                lunch_time=request.user_preferences.lunch_time,
                lunch_duration_minutes=request.user_preferences.lunch_duration_minutes,
                preferred_task_duration_minutes=request.user_preferences.preferred_task_duration_minutes,
                energy_peak_hours=request.user_preferences.energy_peak_hours,
                avoid_scheduling_after=request.user_preferences.avoid_scheduling_after
            ),
            constraints=[
                SchedulerConstraint(
                    type=constraint.type,
                    start_time=constraint.start_time,
                    end_time=constraint.end_time,
                    description=constraint.description,
                    is_hard_constraint=constraint.is_hard_constraint
                ) for constraint in request.constraints
            ] if request.constraints else None,
            planning_horizon_days=request.planning_horizon_days
        )

        # Generate schedule
        result = await scheduler_client.generate_schedule(scheduler_request)

        processing_time = time.time() - start_time

        # Record successful metrics
        record_schedule_generation(
            user_id=user_id,
            duration=processing_time,
            status="success",
            event_count=len(result.scheduled_events),
            confidence_score=result.confidence_score,
            has_existing_events=len(request.existing_events) > 0
        )

        record_feature_usage("schedule_generation", user_id, "success", processing_time)

        logger.info(
            "Schedule generation completed",
            user_id=user_id,
            event_count=len(result.scheduled_events),
            confidence_score=result.confidence_score,
            processing_time=processing_time
        )

        return ScheduleGenerateResponse(
            success=result.success,
            scheduled_events=result.scheduled_events,
            reasoning=result.reasoning,
            confidence_score=result.confidence_score,
            alternative_suggestions=result.alternative_suggestions,
            warnings=result.warnings,
            unscheduled_tasks=result.unscheduled_tasks,
            processing_time_seconds=result.processing_time_seconds
        )

    except Exception as e:
        processing_time = time.time() - start_time

        record_feature_usage("schedule_generation", user_id, "error", processing_time)

        logger.error(
            "Schedule generation failed",
            user_id=user_id,
            error=str(e),
            processing_time=processing_time,
            exc_info=True
        )

        return ScheduleGenerateResponse(
            success=False,
            scheduled_events=[],
            reasoning="",
            confidence_score=0.0,
            alternative_suggestions=[],
            warnings=["Schedule generation failed"],
            unscheduled_tasks=[],
            processing_time_seconds=processing_time,
            error=str(e)
        )


@router.post("/optimize", response_model=ScheduleOptimizeResponse)
async def optimize_schedule(request: ScheduleOptimizeRequest):
    """Optimize user's schedule using AI and constraint solving."""
    user_id = str(request.user_id)
    start_time = time.time()

    # Check feature flag
    if not is_feature_enabled(FeatureFlag.SCHEDULE_OPTIMIZATION, user_id):
        record_feature_usage("schedule_optimization", user_id, "disabled")
        raise HTTPException(
            status_code=403,
            detail={"error": "Schedule optimization feature is not enabled for this user"}
        )

    try:
        record_feature_usage("schedule_optimization", user_id, "started")

        logger.info(
            "Schedule optimization request received",
            user_id=user_id,
            brick_ids=[str(bid) for bid in (request.brick_ids or [])]
        )

        # Get scheduler client
        scheduler_client = await get_scheduler_client()

        # For now, we'll create a simple optimization request
        # In a full implementation, we'd fetch the user's existing schedule
        # and convert Bricks to tasks for optimization

        # Placeholder: Create a basic schedule for optimization
        # This would normally come from the database
        existing_schedule = [
            {
                "id": "task-1",
                "title": "Sample Task",
                "start_time": "2024-01-15T09:00:00",
                "end_time": "2024-01-15T10:00:00",
                "type": "task"
            }
        ]

        # Call scheduler service to optimize
        optimization_result = await scheduler_client.optimize_schedule(
            user_id=user_id,
            existing_schedule=existing_schedule,
            optimization_goals=["improve_efficiency", "reduce_conflicts", "balance_workload"]
        )

        processing_time = time.time() - start_time

        # Record successful metrics
        record_schedule_optimization(
            user_id=user_id,
            duration=processing_time,
            status="success",
            event_count=len(optimization_result.get("optimized_schedule", [])),
            confidence_score=optimization_result.get("confidence_score", 0.8),
            improvement_count=len(optimization_result.get("improvements", []))
        )

        record_feature_usage("schedule_optimization", user_id, "success", processing_time)

        logger.info(
            "Schedule optimization completed",
            user_id=user_id,
            improvements_count=len(optimization_result.get("improvements", [])),
            processing_time=processing_time
        )

        return ScheduleOptimizeResponse(
            success=optimization_result.get("success", True),
            optimized_schedule=optimization_result.get("optimized_schedule", []),
            improvements=optimization_result.get("improvements", []),
            confidence_score=optimization_result.get("confidence_score", 0.8),
            processing_time_seconds=processing_time
        )

    except Exception as e:
        processing_time = time.time() - start_time

        record_feature_usage("schedule_optimization", user_id, "error", processing_time)

        logger.error(
            "Schedule optimization failed",
            user_id=user_id,
            error=str(e),
            processing_time=processing_time,
            exc_info=True
        )

        return ScheduleOptimizeResponse(
            success=False,
            optimized_schedule=[],
            improvements=[],
            confidence_score=0.0,
            processing_time_seconds=processing_time,
            error=str(e)
        )


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
