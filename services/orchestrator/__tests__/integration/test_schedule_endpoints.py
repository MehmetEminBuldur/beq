"""
Integration tests for schedule endpoints in the orchestrator service.
Tests the full integration between orchestrator and scheduler services.
"""

import pytest
import httpx
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from ..app.main import create_app
from ..app.clients.scheduler_client import ScheduleRequest, ScheduleResponse


@pytest.fixture
def client():
    """Create test client for the FastAPI app."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def sample_schedule_request():
    """Sample schedule generation request."""
    return {
        "user_id": "test-user-123",
        "tasks": [
            {
                "id": "task-1",
                "title": "Complete project proposal",
                "description": "Write and review the Q1 project proposal document",
                "category": "work",
                "priority": "high",
                "estimated_duration_minutes": 120,
                "deadline": (datetime.now() + timedelta(days=3)).isoformat(),
                "preferred_time": "morning",
                "dependencies": []
            }
        ],
        "existing_events": [
            {
                "id": "meeting-1",
                "title": "Team Standup",
                "start_time": (datetime.now() + timedelta(days=1)).replace(hour=9, minute=0).isoformat(),
                "end_time": (datetime.now() + timedelta(days=1)).replace(hour=9, minute=30).isoformat(),
                "is_moveable": False
            }
        ],
        "user_preferences": {
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
        },
        "constraints": [
            {
                "type": "focus_time",
                "start_time": (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0).isoformat(),
                "end_time": (datetime.now() + timedelta(days=1)).replace(hour=12, minute=0).isoformat(),
                "description": "Deep work block for important project",
                "is_hard_constraint": True
            }
        ],
        "planning_horizon_days": 7
    }


@pytest.fixture
def sample_optimization_request():
    """Sample schedule optimization request."""
    return {
        "user_id": "test-user-123",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=7)).isoformat(),
        "brick_ids": ["brick-1", "brick-2"]
    }


class TestScheduleEndpoints:
    """Test suite for schedule endpoints."""

    @patch('httpx.AsyncClient.post')
    def test_generate_schedule_success(self, mock_post, client, sample_schedule_request):
        """Test successful schedule generation."""
        mock_response = {
            "success": True,
            "scheduled_events": [
                {
                    "id": "task-1",
                    "title": "Complete project proposal",
                    "start_time": (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0).isoformat(),
                    "end_time": (datetime.now() + timedelta(days=1)).replace(hour=12, minute=0).isoformat(),
                    "type": "task",
                    "priority": "high"
                }
            ],
            "reasoning": "Scheduled high-priority task during peak energy hours",
            "confidence_score": 0.85,
            "alternative_suggestions": ["Could schedule during 2-4 PM if preferred"],
            "warnings": ["Task duration exceeds preferred 90-minute limit"],
            "unscheduled_tasks": [],
            "processing_time_seconds": 1.23
        }

        mock_post.return_value.__aenter__.return_value = Mock()
        mock_post.return_value.__aenter__.return_value.status_code = 200
        mock_post.return_value.__aenter__.return_value.json = Mock(return_value=mock_response)

        response = client.post("/api/v1/schedule/generate", json=sample_schedule_request)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["scheduled_events"]) == 1
        assert data["confidence_score"] == 0.85
        assert "reasoning" in data

    @patch('httpx.AsyncClient.post')
    def test_generate_schedule_scheduler_error(self, mock_post, client, sample_schedule_request):
        """Test handling of scheduler service errors."""
        mock_post.return_value.__aenter__.return_value = Mock()
        mock_post.return_value.__aenter__.return_value.status_code = 500
        mock_post.return_value.__aenter__.return_value.json = Mock(return_value={"detail": "Internal server error"})

        response = client.post("/api/v1/schedule/generate", json=sample_schedule_request)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data

    @patch('httpx.AsyncClient.post')
    def test_generate_schedule_validation_error(self, client):
        """Test request validation errors."""
        invalid_request = {
            "user_id": "",  # Invalid: empty string
            "tasks": [],
            "existing_events": [],
            "user_preferences": {},
            "constraints": [],
            "planning_horizon_days": 7
        }

        response = client.post("/api/v1/schedule/generate", json=invalid_request)

        assert response.status_code == 422  # Validation error

    @patch('httpx.AsyncClient.post')
    def test_optimize_schedule_success(self, mock_post, client, sample_optimization_request):
        """Test successful schedule optimization."""
        mock_response = {
            "success": True,
            "optimized_schedule": [
                {
                    "id": "task-1",
                    "title": "Optimized Task",
                    "start_time": (datetime.now() + timedelta(days=1)).replace(hour=14, minute=0).isoformat(),
                    "end_time": (datetime.now() + timedelta(days=1)).replace(hour=15, minute=30).isoformat(),
                    "type": "task"
                }
            ],
            "improvements": [
                "Reduced task overlap by 45 minutes",
                "Scheduled during peak productivity hours"
            ],
            "confidence_score": 0.91,
            "processing_time_seconds": 0.87
        }

        mock_post.return_value.__aenter__.return_value = Mock()
        mock_post.return_value.__aenter__.return_value.status_code = 200
        mock_post.return_value.__aenter__.return_value.json = Mock(return_value=mock_response)

        response = client.post("/api/v1/schedule/optimize", json=sample_optimization_request)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["improvements"]) == 2
        assert data["confidence_score"] == 0.91

    @patch('httpx.AsyncClient.post')
    def test_optimize_schedule_no_improvements(self, mock_post, client, sample_optimization_request):
        """Test optimization when no improvements are found."""
        mock_response = {
            "success": False,
            "optimized_schedule": [],
            "improvements": [],
            "confidence_score": 0.0,
            "processing_time_seconds": 0.5,
            "error": "No optimization opportunities found"
        }

        mock_post.return_value.__aenter__.return_value = Mock()
        mock_post.return_value.__aenter__.return_value.status_code = 200
        mock_post.return_value.__aenter__.return_value.json = Mock(return_value=mock_response)

        response = client.post("/api/v1/schedule/optimize", json=sample_optimization_request)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert len(data["improvements"]) == 0
        assert "error" in data

    @patch('httpx.AsyncClient.get')
    def test_get_user_schedule_success(self, mock_get, client):
        """Test successful user schedule retrieval."""
        user_id = "test-user-123"
        mock_response = {
            "events": [
                {
                    "id": "event-1",
                    "title": "Team Meeting",
                    "start_time": (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0).isoformat(),
                    "end_time": (datetime.now() + timedelta(days=1)).replace(hour=11, minute=0).isoformat(),
                    "type": "meeting"
                }
            ],
            "last_updated": datetime.now().isoformat()
        }

        mock_get.return_value = Mock()
        mock_get.return_value.status_code = 200
        mock_get.return_value.json = Mock(return_value=mock_response)

        response = client.get(f"/api/v1/schedule/{user_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert len(data["events"]) == 1
        assert "last_updated" in data

    @patch('httpx.AsyncClient.get')
    def test_get_user_schedule_with_date_filters(self, mock_get, client):
        """Test user schedule retrieval with date filters."""
        user_id = "test-user-123"
        start_date = datetime.now().isoformat()
        end_date = (datetime.now() + timedelta(days=7)).isoformat()

        mock_response = {"events": [], "last_updated": datetime.now().isoformat()}

        mock_get.return_value = Mock()
        mock_get.return_value.status_code = 200
        mock_get.return_value.json = Mock(return_value=mock_response)

        response = client.get(f"/api/v1/schedule/{user_id}?start_date={start_date}&end_date={end_date}")

        assert response.status_code == 200
        # Verify the query parameters were passed correctly
        mock_get.assert_called_once()
        called_url = str(mock_get.call_args[0][0])
        assert start_date in called_url
        assert end_date in called_url

    @patch('httpx.AsyncClient.get')
    def test_get_user_schedule_not_found(self, mock_get, client):
        """Test user schedule retrieval when user not found."""
        user_id = "nonexistent-user"

        mock_get.return_value = Mock()
        mock_get.return_value.status_code = 404
        mock_get.return_value.json = Mock(return_value={"detail": "User not found"})

        response = client.get(f"/api/v1/schedule/{user_id}")

        assert response.status_code == 502  # Orchestrator error due to scheduler error
        data = response.json()
        assert "error" in data

    @patch('httpx.AsyncClient.post')
    def test_reschedule_tasks_success(self, mock_post, client):
        """Test successful task rescheduling."""
        user_id = "test-user-123"
        updates = {
            "task-1": {
                "new_start_time": (datetime.now() + timedelta(days=2)).replace(hour=15, minute=0).isoformat(),
                "new_end_time": (datetime.now() + timedelta(days=2)).replace(hour=16, minute=30).isoformat()
            }
        }

        mock_response = {
            "success": True,
            "message": "Tasks rescheduled successfully"
        }

        mock_post.return_value = Mock()
        mock_post.return_value.status_code = 200
        mock_post.return_value.json = Mock(return_value=mock_response)

        response = client.post(f"/api/v1/schedule/{user_id}/reschedule", json=updates)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "message" in data

    def test_invalid_user_id_format(self, client):
        """Test handling of invalid user ID formats."""
        invalid_user_id = "invalid-user-id-with-spaces and symbols!"

        response = client.get(f"/api/v1/schedule/{invalid_user_id}")

        # Should handle gracefully (may return 404 or validation error)
        assert response.status_code in [404, 422, 502]

    @patch('httpx.AsyncClient.post')
    def test_scheduler_service_timeout(self, mock_post, client, sample_schedule_request):
        """Test handling of scheduler service timeouts."""
        import asyncio

        async def timeout_side_effect(*args, **kwargs):
            await asyncio.sleep(35)  # Longer than our 30s timeout
            return Mock()

        mock_post.side_effect = timeout_side_effect

        response = client.post("/api/v1/schedule/generate", json=sample_schedule_request)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data


class TestErrorHandling:
    """Test error handling scenarios."""

    @patch('httpx.AsyncClient.post')
    def test_network_error_during_generation(self, mock_post, client, sample_schedule_request):
        """Test handling of network errors during schedule generation."""
        mock_post.side_effect = Exception("Network connection failed")

        response = client.post("/api/v1/schedule/generate", json=sample_schedule_request)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data

    @patch('httpx.AsyncClient.post')
    def test_malformed_response_from_scheduler(self, mock_post, client, sample_schedule_request):
        """Test handling of malformed responses from scheduler service."""
        mock_post.return_value.__aenter__.return_value = Mock()
        mock_post.return_value.__aenter__.return_value.status_code = 200
        mock_post.return_value.__aenter__.return_value.json = Mock(return_value="invalid json")

        response = client.post("/api/v1/schedule/generate", json=sample_schedule_request)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data

    def test_missing_required_fields(self, client):
        """Test validation of missing required fields."""
        incomplete_request = {
            "user_id": "test-user",
            # Missing tasks, existing_events, user_preferences, constraints
        }

        response = client.post("/api/v1/schedule/generate", json=incomplete_request)

        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    @patch('httpx.AsyncClient.post')
    def test_scheduler_service_unavailable(self, mock_post, client, sample_schedule_request):
        """Test handling when scheduler service is completely unavailable."""
        mock_post.side_effect = httpx.ConnectError("Connection refused")

        response = client.post("/api/v1/schedule/generate", json=sample_schedule_request)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data


if __name__ == "__main__":
    pytest.main([__file__])
