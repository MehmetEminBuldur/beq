"""
Google Calendar API client for event management and synchronization.

This module provides comprehensive integration with Google Calendar API
including event CRUD operations, synchronization, and conflict detection.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
import structlog

from ..config import get_settings
from ..oauth.google_oauth import GoogleOAuthClient
from ..conflicts.detector import ConflictDetector, Conflict, ResolutionStrategy

logger = structlog.get_logger(__name__)
settings = get_settings()


class GoogleCalendarClient:
    """Google Calendar API client for comprehensive calendar integration."""

    def __init__(self):
        self.google_oauth = GoogleOAuthClient()

    def _get_service(self, tokens: Dict[str, Any]):
        """Get authenticated Google Calendar service."""
        credentials = self.google_oauth.create_google_credentials(tokens)
        return build("calendar", "v3", credentials=credentials)

    async def list_calendars(self, tokens: Dict[str, Any]) -> List[Dict[str, Any]]:
        """List user's calendars."""

        try:
            service = self._get_service(tokens)

            calendar_list = service.calendarList().list().execute()
            calendars = calendar_list.get("items", [])

            # Transform to our format
            result = []
            for calendar in calendars:
                result.append({
                    "id": calendar["id"],
                    "name": calendar.get("summary", ""),
                    "description": calendar.get("description", ""),
                    "primary": calendar.get("primary", False),
                    "access_role": calendar.get("accessRole", ""),
                    "background_color": calendar.get("backgroundColor", ""),
                    "foreground_color": calendar.get("foregroundColor", ""),
                })

            return result

        except HttpError as e:
            logger.error(
                "Google Calendar API error listing calendars",
                error=str(e),
                status_code=e.resp.status if e.resp else None
            )
            raise
        except Exception as e:
            logger.error(
                "Failed to list calendars",
                error=str(e),
                exc_info=True
            )
            raise

    async def list_events(
        self,
        tokens: Dict[str, Any],
        calendar_id: str = "primary",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """List calendar events."""

        try:
            service = self._get_service(tokens)

            # Set default date range if not provided
            if not start_date:
                start_date = datetime.now()
            if not end_date:
                end_date = start_date + timedelta(days=30)

            # Get events
            events_result = service.events().list(
                calendarId=calendar_id,
                timeMin=start_date.isoformat() + "Z",
                timeMax=end_date.isoformat() + "Z",
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime"
            ).execute()

            events = events_result.get("items", [])

            # Transform to our format
            result = []
            for event in events:
                result.append(self._transform_event(event))

            return result

        except HttpError as e:
            logger.error(
                "Google Calendar API error listing events",
                calendar_id=calendar_id,
                error=str(e),
                status_code=e.resp.status if e.resp else None
            )
            raise
        except Exception as e:
            logger.error(
                "Failed to list events",
                calendar_id=calendar_id,
                error=str(e),
                exc_info=True
            )
            raise

    async def create_event(
        self,
        tokens: Dict[str, Any],
        calendar_id: str,
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new calendar event."""

        try:
            service = self._get_service(tokens)

            # Transform our format to Google Calendar format
            google_event = self._transform_to_google_event(event_data)

            created_event = service.events().insert(
                calendarId=calendar_id,
                body=google_event
            ).execute()

            return self._transform_event(created_event)

        except HttpError as e:
            logger.error(
                "Google Calendar API error creating event",
                calendar_id=calendar_id,
                event_title=event_data.get("title"),
                error=str(e),
                status_code=e.resp.status if e.resp else None
            )
            raise
        except Exception as e:
            logger.error(
                "Failed to create event",
                calendar_id=calendar_id,
                event_title=event_data.get("title"),
                error=str(e),
                exc_info=True
            )
            raise

    async def update_event(
        self,
        tokens: Dict[str, Any],
        calendar_id: str,
        event_id: str,
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing calendar event."""

        try:
            service = self._get_service(tokens)

            # Transform our format to Google Calendar format
            google_event = self._transform_to_google_event(event_data)

            updated_event = service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=google_event
            ).execute()

            return self._transform_event(updated_event)

        except HttpError as e:
            logger.error(
                "Google Calendar API error updating event",
                calendar_id=calendar_id,
                event_id=event_id,
                error=str(e),
                status_code=e.resp.status if e.resp else None
            )
            raise
        except Exception as e:
            logger.error(
                "Failed to update event",
                calendar_id=calendar_id,
                event_id=event_id,
                error=str(e),
                exc_info=True
            )
            raise

    async def delete_event(
        self,
        tokens: Dict[str, Any],
        calendar_id: str,
        event_id: str
    ) -> None:
        """Delete a calendar event."""

        try:
            service = self._get_service(tokens)

            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

        except HttpError as e:
            logger.error(
                "Google Calendar API error deleting event",
                calendar_id=calendar_id,
                event_id=event_id,
                error=str(e),
                status_code=e.resp.status if e.resp else None
            )
            raise
        except Exception as e:
            logger.error(
                "Failed to delete event",
                calendar_id=calendar_id,
                event_id=event_id,
                error=str(e),
                exc_info=True
            )
            raise

    async def sync_events(
        self,
        tokens: Dict[str, Any],
        calendar_id: str = "primary",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        force_full_sync: bool = False,
        conflict_resolution_strategy: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synchronize calendar events with conflict detection and resolution."""

        start_time = datetime.now()
        conflict_detector = ConflictDetector()

        try:
            # Get events from Google Calendar
            google_events = await self.list_events(
                tokens=tokens,
                calendar_id=calendar_id,
                start_date=start_date,
                end_date=end_date,
                max_results=1000  # Large limit for sync
            )

            # TODO: In a full implementation, you would:
            # 1. Fetch local events from database
            # 2. Compare with Google Calendar events
            # 3. Detect conflicts using ConflictDetector
            # 4. Apply conflict resolution strategies
            # 5. Sync changes bidirectionally

            # For now, simulate conflict detection on Google Calendar events
            conflicts = []
            if len(google_events) > 1:
                conflicts = conflict_detector.detect_conflicts(
                    google_events,
                    time_window_start=start_date,
                    time_window_end=end_date
                )

            # Auto-resolve conflicts if strategy provided
            conflicts_resolved = 0
            if conflicts and conflict_resolution_strategy:
                strategy_map = {
                    "keep_existing": ResolutionStrategy.KEEP_EXISTING,
                    "replace_new": ResolutionStrategy.REPLACE_WITH_NEW,
                    "user_decision": ResolutionStrategy.USER_DECISION,
                }

                strategy = strategy_map.get(conflict_resolution_strategy)
                if strategy:
                    resolutions = conflict_detector.auto_resolve_conflicts(conflicts)
                    conflicts_resolved = len(resolutions)

            # Get conflict statistics
            conflict_stats = conflict_detector.get_conflict_statistics()

            sync_duration = (datetime.now() - start_time).total_seconds()

            result = {
                "success": True,
                "events_synced": len(google_events),
                "events_created": 0,  # Would be calculated in full implementation
                "events_updated": 0,  # Would be calculated in full implementation
                "events_deleted": 0,  # Would be calculated in full implementation
                "conflicts_detected": len(conflicts),
                "conflicts_resolved": conflicts_resolved,
                "conflicts_unresolved": conflict_stats["unresolved_conflicts"],
                "conflict_details": {
                    "by_type": conflict_stats["conflict_types"],
                    "by_severity": conflict_stats["severities"]
                },
                "errors": [],
                "sync_duration_seconds": sync_duration,
            }

            # Add conflict information if any were detected
            if conflicts:
                result["detected_conflicts"] = [
                    {
                        "id": conflict.conflict_id,
                        "type": conflict.conflict_type.value,
                        "severity": conflict.severity.value,
                        "description": conflict.description,
                        "event_count": len(conflict.events),
                        "suggested_resolution": conflict.suggested_resolution.value,
                        "resolution_options": [opt.value for opt in conflict.resolution_options]
                    }
                    for conflict in conflicts[:10]  # Limit to first 10 for API response
                ]

            logger.info(
                "Calendar sync completed",
                calendar_id=calendar_id,
                events_synced=len(google_events),
                conflicts_detected=len(conflicts),
                conflicts_resolved=conflicts_resolved,
                sync_duration=sync_duration
            )

            return result

        except Exception as e:
            sync_duration = (datetime.now() - start_time).total_seconds()

            logger.error(
                "Calendar sync failed",
                calendar_id=calendar_id,
                error=str(e),
                sync_duration=sync_duration,
                exc_info=True
            )

            return {
                "success": False,
                "events_synced": 0,
                "events_created": 0,
                "events_updated": 0,
                "events_deleted": 0,
                "conflicts_detected": 0,
                "conflicts_resolved": 0,
                "errors": [str(e)],
                "sync_duration_seconds": sync_duration,
            }

    def _transform_event(self, google_event: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Google Calendar event to our internal format."""

        # Extract start and end times
        start = google_event.get("start", {})
        end = google_event.get("end", {})

        # Handle all-day events
        if start.get("date"):
            start_time = datetime.fromisoformat(start["date"])
            end_time = datetime.fromisoformat(end["date"]) - timedelta(days=1)  # Google end date is exclusive
            is_all_day = True
        else:
            start_time = datetime.fromisoformat(start["dateTime"])
            end_time = datetime.fromisoformat(end["dateTime"])
            is_all_day = False

        return {
            "id": google_event["id"],
            "title": google_event.get("summary", ""),
            "description": google_event.get("description", ""),
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "location": google_event.get("location"),
            "attendees": [
                attendee.get("email") for attendee in google_event.get("attendees", [])
                if attendee.get("email")
            ],
            "is_all_day": is_all_day,
            "recurrence": google_event.get("recurrence"),
            "status": google_event.get("status", "confirmed"),
            "visibility": google_event.get("visibility", "default"),
            "html_link": google_event.get("htmlLink"),
            "created": google_event.get("created"),
            "updated": google_event.get("updated"),
        }

    def _transform_to_google_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform our event format to Google Calendar format."""

        start_time = datetime.fromisoformat(event_data["start_time"])
        end_time = datetime.fromisoformat(event_data["end_time"])

        google_event = {
            "summary": event_data["title"],
            "description": event_data.get("description"),
            "location": event_data.get("location"),
        }

        # Handle all-day vs timed events
        if event_data.get("is_all_day", False):
            google_event["start"] = {"date": start_time.date().isoformat()}
            google_event["end"] = {"date": (end_time + timedelta(days=1)).date().isoformat()}
        else:
            google_event["start"] = {"dateTime": start_time.isoformat()}
            google_event["end"] = {"dateTime": end_time.isoformat()}

        # Add attendees if provided
        if event_data.get("attendees"):
            google_event["attendees"] = [
                {"email": email} for email in event_data["attendees"]
            ]

        # Add recurrence if provided
        if event_data.get("recurrence"):
            google_event["recurrence"] = [event_data["recurrence"]]

        # Add other properties
        if event_data.get("status"):
            google_event["status"] = event_data["status"]

        if event_data.get("visibility"):
            google_event["visibility"] = event_data["visibility"]

        return google_event
