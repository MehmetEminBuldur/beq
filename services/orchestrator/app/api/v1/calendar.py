"""
Calendar Integration API Endpoints for Orchestrator.

This module provides calendar-related API endpoints in the orchestrator,
acting as a proxy to the calendar integration service while adding
orchestration logic for conflict detection and resolution.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
import structlog

from ...core.config import get_settings
from ...core.telemetry import record_calendar_sync, record_conflict_resolution

logger = structlog.get_logger(__name__)
settings = get_settings()

router = APIRouter()


async def get_calendar_client():
    """Dependency to get calendar client from app state."""
    from ...clients.calendar_client import get_calendar_client
    return await get_calendar_client()


@router.get("/auth/status/{user_id}")
async def get_calendar_auth_status(
    user_id: str,
    calendar_client=Depends(get_calendar_client)
):
    """Get calendar authentication status for a user."""
    try:
        status = await calendar_client.get_calendar_auth_status(user_id)
        return status
    except Exception as e:
        logger.error(
            "Failed to get calendar auth status",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to get calendar authentication status"}
        )


@router.post("/sync/{user_id}")
async def sync_calendar(
    user_id: str,
    calendar_id: str = Query("primary", description="Calendar ID to sync"),
    start_date: Optional[datetime] = Query(None, description="Sync start date"),
    end_date: Optional[datetime] = Query(None, description="Sync end date"),
    conflict_resolution: Optional[str] = Query(
        None,
        description="Conflict resolution strategy: keep_existing, replace_new, user_decision"
    ),
    calendar_client=Depends(get_calendar_client)
):
    """Synchronize calendar events with conflict detection."""
    try:
        sync_result = await calendar_client.sync_calendar(
            user_id=user_id,
            calendar_id=calendar_id,
            start_date=start_date,
            end_date=end_date,
            conflict_resolution=conflict_resolution
        )

        # Record telemetry
        record_calendar_sync(
            user_id=user_id,
            events_synced=sync_result.get("events_synced", 0),
            conflicts_detected=sync_result.get("conflicts_detected", 0),
            conflicts_resolved=sync_result.get("conflicts_resolved", 0)
        )

        logger.info(
            "Calendar sync completed via orchestrator",
            user_id=user_id,
            calendar_id=calendar_id,
            events_synced=sync_result.get("events_synced", 0),
            conflicts_detected=sync_result.get("conflicts_detected", 0),
            conflicts_resolved=sync_result.get("conflicts_resolved", 0)
        )

        return sync_result

    except Exception as e:
        logger.error(
            "Failed to sync calendar via orchestrator",
            user_id=user_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to synchronize calendar"}
        )


@router.get("/events/{user_id}")
async def get_calendar_events(
    user_id: str,
    calendar_id: str = Query("primary", description="Calendar ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    max_results: int = Query(250, description="Maximum number of results"),
    calendar_client=Depends(get_calendar_client)
):
    """Get calendar events for a user."""
    try:
        events = await calendar_client.get_calendar_events(
            user_id=user_id,
            calendar_id=calendar_id,
            start_date=start_date,
            end_date=end_date,
            max_results=max_results
        )

        return {"events": events, "total": len(events)}

    except Exception as e:
        logger.error(
            "Failed to get calendar events via orchestrator",
            user_id=user_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve calendar events"}
        )


@router.get("/conflicts/{user_id}")
async def get_calendar_conflicts(
    user_id: str,
    calendar_id: str = Query("primary", description="Calendar ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    calendar_client=Depends(get_calendar_client)
):
    """Get potential conflicts for user's calendar events."""
    try:
        conflicts_data = await calendar_client.get_calendar_conflicts(
            user_id=user_id,
            calendar_id=calendar_id,
            start_date=start_date,
            end_date=end_date
        )

        return conflicts_data

    except Exception as e:
        logger.error(
            "Failed to get calendar conflicts via orchestrator",
            user_id=user_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve calendar conflicts"}
        )


@router.post("/conflicts/{user_id}/resolve")
async def resolve_calendar_conflicts(
    user_id: str,
    conflict_resolutions: List[Dict[str, Any]],
    calendar_client=Depends(get_calendar_client)
):
    """Resolve calendar conflicts with specified strategies."""
    try:
        resolution_result = await calendar_client.resolve_calendar_conflicts(
            user_id=user_id,
            conflict_resolutions=conflict_resolutions
        )

        # Record telemetry
        record_conflict_resolution(
            user_id=user_id,
            conflicts_resolved=len(conflict_resolutions)
        )

        logger.info(
            "Calendar conflicts resolved via orchestrator",
            user_id=user_id,
            resolutions_count=len(conflict_resolutions)
        )

        return resolution_result

    except Exception as e:
        logger.error(
            "Failed to resolve calendar conflicts via orchestrator",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to resolve calendar conflicts"}
        )


@router.post("/events/{user_id}")
async def create_calendar_event(
    user_id: str,
    event_data: Dict[str, Any],
    calendar_id: str = Query("primary", description="Calendar ID"),
    calendar_client=Depends(get_calendar_client)
):
    """Create a new calendar event."""
    try:
        created_event = await calendar_client.create_calendar_event(
            user_id=user_id,
            event_data=event_data,
            calendar_id=calendar_id
        )

        return created_event

    except Exception as e:
        logger.error(
            "Failed to create calendar event via orchestrator",
            user_id=user_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to create calendar event"}
        )


@router.put("/events/{user_id}/{event_id}")
async def update_calendar_event(
    user_id: str,
    event_id: str,
    event_data: Dict[str, Any],
    calendar_id: str = Query("primary", description="Calendar ID"),
    calendar_client=Depends(get_calendar_client)
):
    """Update an existing calendar event."""
    try:
        updated_event = await calendar_client.update_calendar_event(
            user_id=user_id,
            event_id=event_id,
            event_data=event_data,
            calendar_id=calendar_id
        )

        return updated_event

    except Exception as e:
        logger.error(
            "Failed to update calendar event via orchestrator",
            user_id=user_id,
            event_id=event_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to update calendar event"}
        )


@router.get("/calendars/{user_id}")
async def list_calendars(
    user_id: str,
    calendar_client=Depends(get_calendar_client)
):
    """List user's calendars."""
    try:
        # For now, return a simple response since the calendar client
        # doesn't have a direct list_calendars method
        # This would need to be implemented in the calendar service
        return {
            "calendars": [
                {
                    "id": "primary",
                    "name": "Primary Calendar",
                    "primary": True,
                    "access_role": "owner"
                }
            ]
        }

    except Exception as e:
        logger.error(
            "Failed to list calendars via orchestrator",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve calendars"}
        )


@router.delete("/events/{user_id}/{event_id}")
async def delete_calendar_event(
    user_id: str,
    event_id: str,
    calendar_id: str = Query("primary", description="Calendar ID"),
    calendar_client=Depends(get_calendar_client)
):
    """Delete a calendar event."""
    try:
        # This would need to be implemented in the calendar client
        # For now, return a placeholder response
        return {"success": True, "message": "Event deletion not yet implemented"}

    except Exception as e:
        logger.error(
            "Failed to delete calendar event via orchestrator",
            user_id=user_id,
            event_id=event_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to delete calendar event"}
        )
