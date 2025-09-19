"""
Calendar API endpoints for event management and synchronization.

This module provides endpoints for reading, creating, updating, and deleting
calendar events, as well as synchronization with external calendar providers.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
import structlog

from ...core.config import get_settings

router = APIRouter()
logger = structlog.get_logger(__name__)
settings = get_settings()


async def get_calendar_clients(request):
    """Dependency to get calendar clients from app state."""
    return {
        "google_oauth": request.app.state.google_oauth,
        "token_storage": request.app.state.token_storage,
        "google_calendar": request.app.state.google_calendar,
    }


class CalendarEvent(BaseModel):
    """Calendar event model."""

    id: Optional[str] = Field(None, description="Event ID (external provider ID)")
    title: str = Field(..., min_length=1, max_length=200, description="Event title")
    description: Optional[str] = Field(None, max_length=1000, description="Event description")
    start_time: datetime = Field(..., description="Event start time")
    end_time: datetime = Field(..., description="Event end time")
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    attendees: Optional[List[str]] = Field(None, description="Event attendees (email addresses)")
    is_all_day: bool = Field(default=False, description="Whether this is an all-day event")
    recurrence: Optional[str] = Field(None, description="Recurrence rule (RFC 5545)")
    status: str = Field(default="confirmed", description="Event status")
    visibility: str = Field(default="default", description="Event visibility")


class SyncRequest(BaseModel):
    """Calendar synchronization request."""

    user_id: UUID = Field(..., description="User ID")
    calendar_id: Optional[str] = Field(default="primary", description="Calendar ID to sync")
    start_date: datetime = Field(..., description="Sync start date")
    end_date: datetime = Field(..., description="Sync end date")
    force_full_sync: bool = Field(default=False, description="Force full synchronization")


class SyncResponse(BaseModel):
    """Calendar synchronization response."""

    success: bool
    events_synced: int
    events_created: int
    events_updated: int
    events_deleted: int
    conflicts_detected: int = 0
    conflicts_resolved: int = 0
    conflicts_unresolved: int = 0
    conflict_details: Optional[Dict[str, Any]] = None
    detected_conflicts: Optional[List[Dict[str, Any]]] = None
    errors: List[str]
    sync_duration_seconds: float


async def get_user_tokens(user_id: str, provider: str = "google", clients: dict = None):
    """Dependency to get user tokens."""
    if clients is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Internal server error"}
        )

    token_storage = clients["token_storage"]
    google_oauth = clients["google_oauth"]

    tokens = await token_storage.get_user_tokens(user_id, provider)
    if not tokens:
        raise HTTPException(
            status_code=401,
            detail={"error": f"No {provider} authentication found for user"}
        )

    # Validate tokens
    if not await google_oauth.validate_tokens(tokens):
        raise HTTPException(
            status_code=401,
            detail={"error": f"{provider} tokens expired. Please re-authenticate"}
        )

    return tokens


@router.get("/events/{user_id}")
async def list_events(
    user_id: str,
    calendar_id: str = Query("primary", description="Calendar ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    max_results: int = Query(100, description="Maximum number of events to return", le=1000),
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """List calendar events for a user."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        # Default to next 30 days if no dates provided
        if not start_date:
            start_date = datetime.now()
        if not end_date:
            end_date = start_date + timedelta(days=30)

        events = await google_calendar.list_events(
            tokens=tokens,
            calendar_id=calendar_id,
            start_date=start_date,
            end_date=end_date,
            max_results=max_results
        )

        logger.info(
            "Calendar events retrieved",
            user_id=user_id,
            calendar_id=calendar_id,
            event_count=len(events),
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat()
        )

        return {
            "events": events,
            "calendar_id": calendar_id,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

    except Exception as e:
        logger.error(
            "Failed to list calendar events",
            user_id=user_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve calendar events"}
        )


@router.post("/events/{user_id}")
async def create_event(
    user_id: str,
    event: CalendarEvent,
    calendar_id: str = Query("primary", description="Calendar ID"),
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """Create a new calendar event."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        created_event = await google_calendar.create_event(
            tokens=tokens,
            calendar_id=calendar_id,
            event_data={
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "location": event.location,
                "attendees": event.attendees,
                "is_all_day": event.is_all_day,
                "recurrence": event.recurrence,
                "status": event.status,
                "visibility": event.visibility,
            }
        )

        logger.info(
            "Calendar event created",
            user_id=user_id,
            calendar_id=calendar_id,
            event_id=created_event.get("id"),
            event_title=event.title
        )

        return {
            "success": True,
            "event": created_event,
            "message": "Event created successfully"
        }

    except Exception as e:
        logger.error(
            "Failed to create calendar event",
            user_id=user_id,
            calendar_id=calendar_id,
            event_title=event.title,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to create calendar event"}
        )


@router.put("/events/{user_id}/{event_id}")
async def update_event(
    user_id: str,
    event_id: str,
    event: CalendarEvent,
    calendar_id: str = Query("primary", description="Calendar ID"),
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """Update an existing calendar event."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        updated_event = await google_calendar.update_event(
            tokens=tokens,
            calendar_id=calendar_id,
            event_id=event_id,
            event_data={
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "location": event.location,
                "attendees": event.attendees,
                "is_all_day": event.is_all_day,
                "recurrence": event.recurrence,
                "status": event.status,
                "visibility": event.visibility,
            }
        )

        logger.info(
            "Calendar event updated",
            user_id=user_id,
            calendar_id=calendar_id,
            event_id=event_id,
            event_title=event.title
        )

        return {
            "success": True,
            "event": updated_event,
            "message": "Event updated successfully"
        }

    except Exception as e:
        logger.error(
            "Failed to update calendar event",
            user_id=user_id,
            calendar_id=calendar_id,
            event_id=event_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to update calendar event"}
        )


@router.delete("/events/{user_id}/{event_id}")
async def delete_event(
    user_id: str,
    event_id: str,
    calendar_id: str = Query("primary", description="Calendar ID"),
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """Delete a calendar event."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        await google_calendar.delete_event(
            tokens=tokens,
            calendar_id=calendar_id,
            event_id=event_id
        )

        logger.info(
            "Calendar event deleted",
            user_id=user_id,
            calendar_id=calendar_id,
            event_id=event_id
        )

        return {
            "success": True,
            "message": "Event deleted successfully"
        }

    except Exception as e:
        logger.error(
            "Failed to delete calendar event",
            user_id=user_id,
            calendar_id=calendar_id,
            event_id=event_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to delete calendar event"}
        )


@router.post("/sync/{user_id}")
async def sync_calendar(
    user_id: str,
    request: SyncRequest,
    conflict_resolution: Optional[str] = Query(
        None,
        description="Conflict resolution strategy: keep_existing, replace_new, user_decision"
    ),
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """Synchronize calendar events."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        sync_result = await google_calendar.sync_events(
            tokens=tokens,
            calendar_id=request.calendar_id,
            start_date=request.start_date,
            end_date=request.end_date,
            force_full_sync=request.force_full_sync,
            conflict_resolution_strategy=conflict_resolution
        )

        logger.info(
            "Calendar sync completed",
            user_id=user_id,
            calendar_id=request.calendar_id,
            events_synced=sync_result.get("events_synced", 0),
            conflicts_detected=sync_result.get("conflicts_detected", 0),
            conflicts_resolved=sync_result.get("conflicts_resolved", 0),
            sync_duration=sync_result.get("sync_duration_seconds", 0)
        )

        return SyncResponse(**sync_result)

    except Exception as e:
        logger.error(
            "Failed to sync calendar",
            user_id=user_id,
            calendar_id=request.calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to synchronize calendar"}
        )


@router.get("/calendars/{user_id}")
async def list_calendars(
    user_id: str,
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """List user's calendars."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        calendars = await google_calendar.list_calendars(tokens=tokens)

        logger.info(
            "User calendars retrieved",
            user_id=user_id,
            calendar_count=len(calendars)
        )

        return {
            "calendars": calendars,
            "total": len(calendars)
        }

    except Exception as e:
        logger.error(
            "Failed to list calendars",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve calendars"}
        )


@router.get("/conflicts/{user_id}")
async def get_conflicts(
    user_id: str,
    calendar_id: str = Query("primary", description="Calendar ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """Get potential conflicts for user's calendar events."""

    try:
        google_calendar = clients["google_calendar"]
        tokens = await get_user_tokens(user_id, "google", clients)

        # Get events for conflict detection
        events = await google_calendar.list_events(
            tokens=tokens,
            calendar_id=calendar_id,
            start_date=start_date,
            end_date=end_date,
            max_results=500
        )

        # Detect conflicts
        from ...core.conflicts.detector import ConflictDetector
        detector = ConflictDetector()
        conflicts = detector.detect_conflicts(events, start_date, end_date)

        conflict_data = []
        for conflict in conflicts:
            conflict_data.append({
                "id": conflict.conflict_id,
                "type": conflict.conflict_type.value,
                "severity": conflict.severity.value,
                "description": conflict.description,
                "events": [
                    {
                        "id": event.get("id"),
                        "title": event.get("title"),
                        "start_time": event.get("start_time"),
                        "end_time": event.get("end_time")
                    }
                    for event in conflict.events
                ],
                "suggested_resolution": conflict.suggested_resolution.value,
                "resolution_options": [opt.value for opt in conflict.resolution_options],
                "metadata": conflict.metadata
            })

        logger.info(
            "Conflicts retrieved",
            user_id=user_id,
            calendar_id=calendar_id,
            conflict_count=len(conflicts)
        )

        return {
            "conflicts": conflict_data,
            "total": len(conflicts),
            "calendar_id": calendar_id,
            "time_window": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            }
        }

    except Exception as e:
        logger.error(
            "Failed to get conflicts",
            user_id=user_id,
            calendar_id=calendar_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve conflicts"}
        )


@router.post("/conflicts/{user_id}/resolve")
async def resolve_conflicts(
    user_id: str,
    conflict_resolutions: List[Dict[str, Any]],
    clients: Dict[str, Any] = Depends(get_calendar_clients)
):
    """Resolve calendar conflicts with specified strategies."""

    try:
        # Get user's tokens to ensure access
        tokens = await get_user_tokens(user_id, "google", clients)

        from ...core.conflicts.detector import ConflictDetector, ResolutionStrategy

        detector = ConflictDetector()
        resolutions = []

        for resolution_data in conflict_resolutions:
            conflict_id = resolution_data["conflict_id"]
            strategy_str = resolution_data["strategy"]
            user_decision = resolution_data.get("user_decision")

            # Convert string to enum
            strategy_map = {
                "keep_existing": ResolutionStrategy.KEEP_EXISTING,
                "replace_with_new": ResolutionStrategy.REPLACE_WITH_NEW,
                "merge_events": ResolutionStrategy.MERGE_EVENTS,
                "move_to_alternative_time": ResolutionStrategy.MOVE_TO_ALTERNATIVE_TIME,
                "split_event": ResolutionStrategy.SPLIT_EVENT,
                "cancel_event": ResolutionStrategy.CANCEL_EVENT,
                "user_decision": ResolutionStrategy.USER_DECISION,
            }

            strategy = strategy_map.get(strategy_str)
            if not strategy:
                continue

            try:
                resolution = detector.resolve_conflict(conflict_id, strategy, user_decision)
                resolutions.append({
                    "conflict_id": resolution.conflict_id,
                    "strategy": resolution.strategy.value,
                    "resolved_events": len(resolution.resolved_events),
                    "discarded_events": len(resolution.discarded_events),
                    "notes": resolution.notes
                })
            except ValueError:
                # Conflict not found, skip
                continue

        logger.info(
            "Conflicts resolved",
            user_id=user_id,
            resolutions_count=len(resolutions)
        )

        return {
            "success": True,
            "resolutions": resolutions,
            "total_resolved": len(resolutions)
        }

    except Exception as e:
        logger.error(
            "Failed to resolve conflicts",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to resolve conflicts"}
        )
