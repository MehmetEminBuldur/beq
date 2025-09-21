"""
Scheduler Service Client for BeQ Orchestrator.

This module provides a client for communicating with the BeQ Scheduler Service
to generate optimized schedules using AI-powered algorithms.
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

from ..core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


@dataclass
class TaskInput:
    """Input model for a task to be scheduled."""
    id: str
    title: str
    estimated_duration_minutes: int
    description: Optional[str] = None
    category: str = "work"
    priority: str = "medium"  # low, medium, high, urgent
    deadline: Optional[datetime] = None
    preferred_time: Optional[str] = None  # "morning", "afternoon", "evening"
    dependencies: Optional[List[str]] = None


@dataclass
class EventInput:
    """Input model for existing events."""
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    is_moveable: bool = False


@dataclass
class UserPreferences:
    """User preferences for scheduling."""
    timezone: str = "UTC"
    work_start_time: str = "09:00"
    work_end_time: str = "17:00"
    break_frequency_minutes: int = 90
    break_duration_minutes: int = 15
    lunch_time: str = "12:00"
    lunch_duration_minutes: int = 60
    preferred_task_duration_minutes: int = 90
    energy_peak_hours: Optional[List[str]] = None
    avoid_scheduling_after: str = "18:00"


@dataclass
class ConstraintInput:
    """Input model for scheduling constraints."""
    type: str  # "time_block", "no_meetings", "focus_time"
    description: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_hard_constraint: bool = True


@dataclass
class ScheduleRequest:
    """Request model for schedule generation."""
    user_id: str
    tasks: List[TaskInput]
    user_preferences: UserPreferences
    existing_events: Optional[List[EventInput]] = None
    constraints: Optional[List[ConstraintInput]] = None
    planning_horizon_days: int = 7


@dataclass
class ScheduleResponse:
    """Response model for generated schedule."""
    success: bool
    scheduled_events: List[Dict[str, Any]]
    reasoning: str
    confidence_score: float
    alternative_suggestions: List[str]
    warnings: List[str]
    unscheduled_tasks: List[str]
    processing_time_seconds: float


class SchedulerClient:
    """Client for communicating with the BeQ Scheduler Service."""

    def __init__(self):
        self.base_url = os.getenv("SCHEDULER_SERVICE_URL", "http://scheduler:8001")
        self.timeout = httpx.Timeout(30.0)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_schedule(self, request: ScheduleRequest) -> ScheduleResponse:
        """Generate an optimized schedule using the scheduler service."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.info(
                    "Sending schedule generation request to scheduler service",
                    user_id=request.user_id,
                    tasks_count=len(request.tasks),
                    base_url=self.base_url
                )

                # Convert dataclasses to dicts for JSON serialization
                request_data = {
                    "user_id": request.user_id,
                    "tasks": [self._task_to_dict(task) for task in request.tasks],
                    "existing_events": [
                        self._event_to_dict(event) for event in (request.existing_events or [])
                    ],
                    "user_preferences": self._preferences_to_dict(request.user_preferences),
                    "constraints": [
                        self._constraint_to_dict(constraint) for constraint in (request.constraints or [])
                    ],
                    "planning_horizon_days": request.planning_horizon_days
                }

                response = await client.post(
                    f"{self.base_url}/api/v1/schedule",
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code != 200:
                    logger.error(
                        "Scheduler service returned error",
                        status_code=response.status_code,
                        response_text=response.text
                    )
                    raise Exception(f"Scheduler service error: {response.status_code} - {response.text}")

                response_data = response.json()

                # Convert response to ScheduleResponse
                return ScheduleResponse(
                    success=response_data.get("success", False),
                    scheduled_events=response_data.get("scheduled_events", []),
                    reasoning=response_data.get("reasoning", ""),
                    confidence_score=response_data.get("confidence_score", 0.0),
                    alternative_suggestions=response_data.get("alternative_suggestions", []),
                    warnings=response_data.get("warnings", []),
                    unscheduled_tasks=response_data.get("unscheduled_tasks", []),
                    processing_time_seconds=response_data.get("processing_time_seconds", 0.0)
                )

            except Exception as e:
                logger.error(
                    "Failed to communicate with scheduler service",
                    exc_info=e,
                    base_url=self.base_url
                )
                raise

    async def optimize_schedule(
        self,
        user_id: str,
        existing_schedule: List[Dict[str, Any]],
        optimization_goals: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Optimize an existing schedule."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.info(
                    "Sending schedule optimization request",
                    user_id=user_id,
                    schedule_items=len(existing_schedule)
                )

                request_data = {
                    "user_id": user_id,
                    "existing_schedule": existing_schedule,
                    "optimization_goals": optimization_goals or []
                }

                response = await client.post(
                    f"{self.base_url}/api/v1/optimize",
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code != 200:
                    logger.error(
                        "Scheduler optimization returned error",
                        status_code=response.status_code,
                        response_text=response.text
                    )
                    raise Exception(f"Scheduler optimization error: {response.status_code} - {response.text}")

                return response.json()

            except Exception as e:
                logger.error(
                    "Failed to optimize schedule",
                    exc_info=e,
                    user_id=user_id
                )
                raise

    async def get_scheduling_suggestions(self, user_id: str) -> Dict[str, Any]:
        """Get AI-powered scheduling suggestions."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/api/v1/suggestions/{user_id}")

                if response.status_code != 200:
                    logger.error(
                        "Failed to get scheduling suggestions",
                        status_code=response.status_code,
                        response_text=response.text
                    )
                    raise Exception(f"Suggestions error: {response.status_code} - {response.text}")

                return response.json()

            except Exception as e:
                logger.error(
                    "Failed to get scheduling suggestions",
                    exc_info=e,
                    user_id=user_id
                )
                raise

    async def health_check(self) -> Dict[str, Any]:
        """Check the health of the scheduler service."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/health")

                if response.status_code != 200:
                    return {"status": "unhealthy", "error": f"HTTP {response.status_code}"}

                return response.json()

            except Exception as e:
                logger.error("Scheduler health check failed", exc_info=e)
                return {"status": "unhealthy", "error": str(e)}

    def _task_to_dict(self, task: TaskInput) -> Dict[str, Any]:
        """Convert TaskInput to dictionary."""
        result = {
            "id": task.id,
            "title": task.title,
            "category": task.category,
            "priority": task.priority,
            "estimated_duration_minutes": task.estimated_duration_minutes,
        }

        if task.description:
            result["description"] = task.description
        if task.deadline:
            result["deadline"] = task.deadline.isoformat()
        if task.preferred_time:
            result["preferred_time"] = task.preferred_time
        if task.dependencies:
            result["dependencies"] = task.dependencies

        return result

    def _event_to_dict(self, event: EventInput) -> Dict[str, Any]:
        """Convert EventInput to dictionary."""
        return {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat(),
            "is_moveable": event.is_moveable
        }

    def _preferences_to_dict(self, prefs: UserPreferences) -> Dict[str, Any]:
        """Convert UserPreferences to dictionary."""
        result = {
            "timezone": prefs.timezone,
            "work_start_time": prefs.work_start_time,
            "work_end_time": prefs.work_end_time,
            "break_frequency_minutes": prefs.break_frequency_minutes,
            "break_duration_minutes": prefs.break_duration_minutes,
            "lunch_time": prefs.lunch_time,
            "lunch_duration_minutes": prefs.lunch_duration_minutes,
            "preferred_task_duration_minutes": prefs.preferred_task_duration_minutes,
            "avoid_scheduling_after": prefs.avoid_scheduling_after
        }

        if prefs.energy_peak_hours:
            result["energy_peak_hours"] = prefs.energy_peak_hours

        return result

    def _constraint_to_dict(self, constraint: ConstraintInput) -> Dict[str, Any]:
        """Convert ConstraintInput to dictionary."""
        result = {
            "type": constraint.type,
            "description": constraint.description,
            "is_hard_constraint": constraint.is_hard_constraint
        }

        if constraint.start_time:
            result["start_time"] = constraint.start_time.isoformat()
        if constraint.end_time:
            result["end_time"] = constraint.end_time.isoformat()

        return result


# Global client instance
_scheduler_client: Optional[SchedulerClient] = None


async def get_scheduler_client() -> SchedulerClient:
    """Get the global scheduler client instance."""
    global _scheduler_client

    if _scheduler_client is None:
        _scheduler_client = SchedulerClient()

    return _scheduler_client


async def cleanup_scheduler_client():
    """Cleanup the scheduler client (no-op since it's stateless)."""
    global _scheduler_client
    _scheduler_client = None
    logger.info("Scheduler client cleaned up")
