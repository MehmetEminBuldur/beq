"""
Calendar Integration Client for Orchestrator Service.

This module provides a client for the orchestrator to communicate with
the calendar integration service, enabling calendar synchronization,
conflict detection, and event management.
"""

import httpx
import structlog
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = structlog.get_logger(__name__)


class CalendarClient:
    """Client for interacting with the calendar integration service."""

    def __init__(self, base_url: str = "http://calendar-integration:8001"):
        """
        Initialize the calendar client.

        Args:
            base_url: Base URL of the calendar integration service
        """
        self.base_url = base_url.rstrip("/")
        self.client = None

    async def __aenter__(self):
        """Async context manager entry."""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(30.0, connect=10.0)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.client:
            await self.client.aclose()

    def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self.client is None:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(30.0, connect=10.0)
            )
        return self.client

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def get_calendar_auth_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get calendar authentication status for a user.

        Args:
            user_id: User ID

        Returns:
            Authentication status
        """
        client = self._get_client()
        try:
            response = await client.get(f"/api/v1/auth/status/{user_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(
                "Failed to get calendar auth status",
                user_id=user_id,
                error=str(e),
                exc_info=True
            )
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def sync_calendar(
        self,
        user_id: str,
        calendar_id: str = "primary",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        conflict_resolution: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sync calendar events for a user.

        Args:
            user_id: User ID
            calendar_id: Calendar ID to sync
            start_date: Start date for sync
            end_date: End date for sync
            conflict_resolution: Conflict resolution strategy

        Returns:
            Sync results including conflicts detected
        """
        client = self._get_client()
        params = {
            "calendar_id": calendar_id,
            "conflict_resolution": conflict_resolution
        }

        if start_date:
            params["start_date"] = start_date.isoformat()
        if end_date:
            params["end_date"] = end_date.isoformat()

        try:
            response = await client.post(
                f"/api/v1/calendar/sync/{user_id}",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(
                "Failed to sync calendar",
                user_id=user_id,
                calendar_id=calendar_id,
                error=str(e),
                exc_info=True
            )
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def get_calendar_events(
        self,
        user_id: str,
        calendar_id: str = "primary",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        max_results: int = 250
    ) -> List[Dict[str, Any]]:
        """
        Get calendar events for a user.

        Args:
            user_id: User ID
            calendar_id: Calendar ID
            start_date: Start date filter
            end_date: End date filter
            max_results: Maximum number of results

        Returns:
            List of calendar events
        """
        client = self._get_client()
        params = {
            "calendar_id": calendar_id,
            "max_results": max_results
        }

        if start_date:
            params["start_date"] = start_date.isoformat()
        if end_date:
            params["end_date"] = end_date.isoformat()

        try:
            response = await client.get(
                f"/api/v1/calendar/events/{user_id}",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get("events", [])
        except Exception as e:
            logger.error(
                "Failed to get calendar events",
                user_id=user_id,
                calendar_id=calendar_id,
                error=str(e),
                exc_info=True
            )
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def get_calendar_conflicts(
        self,
        user_id: str,
        calendar_id: str = "primary",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get calendar conflicts for a user.

        Args:
            user_id: User ID
            calendar_id: Calendar ID
            start_date: Start date filter
            end_date: End date filter

        Returns:
            Conflict information
        """
        client = self._get_client()
        params = {"calendar_id": calendar_id}

        if start_date:
            params["start_date"] = start_date.isoformat()
        if end_date:
            params["end_date"] = end_date.isoformat()

        try:
            response = await client.get(
                f"/api/v1/calendar/conflicts/{user_id}",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(
                "Failed to get calendar conflicts",
                user_id=user_id,
                calendar_id=calendar_id,
                error=str(e),
                exc_info=True
            )
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def resolve_calendar_conflicts(
        self,
        user_id: str,
        conflict_resolutions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Resolve calendar conflicts.

        Args:
            user_id: User ID
            conflict_resolutions: List of conflict resolution requests

        Returns:
            Resolution results
        """
        client = self._get_client()
        try:
            response = await client.post(
                f"/api/v1/calendar/conflicts/{user_id}/resolve",
                json=conflict_resolutions
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(
                "Failed to resolve calendar conflicts",
                user_id=user_id,
                error=str(e),
                exc_info=True
            )
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def create_calendar_event(
        self,
        user_id: str,
        event_data: Dict[str, Any],
        calendar_id: str = "primary"
    ) -> Dict[str, Any]:
        """
        Create a calendar event.

        Args:
            user_id: User ID
            event_data: Event data
            calendar_id: Calendar ID

        Returns:
            Created event information
        """
        client = self._get_client()
        params = {"calendar_id": calendar_id}

        try:
            response = await client.post(
                f"/api/v1/calendar/events/{user_id}",
                json=event_data,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(
                "Failed to create calendar event",
                user_id=user_id,
                calendar_id=calendar_id,
                error=str(e),
                exc_info=True
            )
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException))
    )
    async def update_calendar_event(
        self,
        user_id: str,
        event_id: str,
        event_data: Dict[str, Any],
        calendar_id: str = "primary"
    ) -> Dict[str, Any]:
        """
        Update a calendar event.

        Args:
            user_id: User ID
            event_id: Event ID
            event_data: Updated event data
            calendar_id: Calendar ID

        Returns:
            Updated event information
        """
        client = self._get_client()
        params = {"calendar_id": calendar_id}

        try:
            response = await client.put(
                f"/api/v1/calendar/events/{user_id}/{event_id}",
                json=event_data,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(
                "Failed to update calendar event",
                user_id=user_id,
                event_id=event_id,
                calendar_id=calendar_id,
                error=str(e),
                exc_info=True
            )
            raise

    async def close(self):
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None


# Global calendar client instance
_calendar_client: Optional[CalendarClient] = None


async def get_calendar_client() -> CalendarClient:
    """Get the global calendar client instance."""
    global _calendar_client
    if _calendar_client is None:
        _calendar_client = CalendarClient()
    return _calendar_client


async def cleanup_calendar_client():
    """Cleanup the global calendar client."""
    global _calendar_client
    if _calendar_client:
        await _calendar_client.close()
        _calendar_client = None
