"""
Telemetry and metrics for the BeQ Orchestrator Service.

This module provides comprehensive telemetry collection including
metrics, tracing, and structured logging for monitoring feature usage.
"""

from prometheus_client import Counter, Histogram, Gauge, Info
import time
from typing import Dict, Any, Optional
import structlog

logger = structlog.get_logger(__name__)

# Schedule Optimization Metrics
SCHEDULE_GENERATION_REQUESTS = Counter(
    'beq_schedule_generation_requests_total',
    'Total schedule generation requests',
    ['user_id', 'status', 'has_existing_events']
)

SCHEDULE_GENERATION_DURATION = Histogram(
    'beq_schedule_generation_duration_seconds',
    'Schedule generation request duration',
    ['user_id', 'status']
)

SCHEDULE_OPTIMIZATION_REQUESTS = Counter(
    'beq_schedule_optimization_requests_total',
    'Total schedule optimization requests',
    ['user_id', 'status']
)

SCHEDULE_OPTIMIZATION_DURATION = Histogram(
    'beq_schedule_optimization_duration_seconds',
    'Schedule optimization request duration',
    ['user_id', 'status']
)

SCHEDULE_EVENTS_COUNT = Histogram(
    'beq_schedule_events_count',
    'Number of events in generated schedules',
    ['user_id', 'operation']
)

SCHEDULE_CONFIDENCE_SCORES = Histogram(
    'beq_schedule_confidence_scores',
    'Confidence scores for schedule operations',
    ['user_id', 'operation']
)

# Feature Usage Metrics
FEATURE_REQUESTS = Counter(
    'beq_feature_requests_total',
    'Total requests per feature',
    ['feature', 'user_id', 'status']
)

FEATURE_ERRORS = Counter(
    'beq_feature_errors_total',
    'Total errors per feature',
    ['feature', 'user_id', 'error_type']
)

# Service Health Metrics
SERVICE_INFO = Info('beq_orchestrator_info', 'Orchestrator service information')

ACTIVE_USERS = Gauge(
    'beq_active_users',
    'Number of active users in the last 24 hours'
)

# AI Model Metrics
AI_MODEL_REQUESTS = Counter(
    'beq_ai_model_requests_total',
    'Total AI model requests',
    ['model', 'operation', 'status']
)

AI_MODEL_LATENCY = Histogram(
    'beq_ai_model_latency_seconds',
    'AI model request latency',
    ['model', 'operation']
)

# Calendar Integration Metrics
CALENDAR_SYNC_REQUESTS = Counter(
    'beq_calendar_sync_requests_total',
    'Total calendar sync requests',
    ['user_id', 'status']
)

CALENDAR_SYNC_DURATION = Histogram(
    'beq_calendar_sync_duration_seconds',
    'Calendar sync request duration',
    ['user_id', 'status']
)

CALENDAR_EVENTS_SYNCED = Histogram(
    'beq_calendar_events_synced',
    'Number of events synced in calendar operations',
    ['user_id', 'operation']
)

CALENDAR_CONFLICTS_DETECTED = Histogram(
    'beq_calendar_conflicts_detected',
    'Number of conflicts detected in calendar sync',
    ['user_id', 'conflict_type']
)

CALENDAR_CONFLICTS_RESOLVED = Histogram(
    'beq_calendar_conflicts_resolved',
    'Number of conflicts resolved in calendar sync',
    ['user_id', 'resolution_strategy']
)

CALENDAR_CONFLICT_RESOLUTION_REQUESTS = Counter(
    'beq_calendar_conflict_resolution_requests_total',
    'Total calendar conflict resolution requests',
    ['user_id', 'status']
)


class TelemetryCollector:
    """Collects and manages telemetry data for the orchestrator service."""

    def __init__(self):
        self._service_start_time = time.time()

    def record_schedule_generation(
        self,
        user_id: str,
        duration: float,
        status: str,
        event_count: int,
        confidence_score: float,
        has_existing_events: bool = False
    ):
        """Record metrics for schedule generation operations."""
        try:
            SCHEDULE_GENERATION_REQUESTS.labels(
                user_id=user_id,
                status=status,
                has_existing_events=str(has_existing_events).lower()
            ).inc()

            SCHEDULE_GENERATION_DURATION.labels(
                user_id=user_id,
                status=status
            ).observe(duration)

            SCHEDULE_EVENTS_COUNT.labels(
                user_id=user_id,
                operation='generation'
            ).observe(event_count)

            SCHEDULE_CONFIDENCE_SCORES.labels(
                user_id=user_id,
                operation='generation'
            ).observe(confidence_score)

            logger.info(
                "Schedule generation metrics recorded",
                user_id=user_id,
                duration=duration,
                status=status,
                event_count=event_count,
                confidence_score=confidence_score,
                has_existing_events=has_existing_events
            )

        except Exception as e:
            logger.error(
                "Failed to record schedule generation metrics",
                user_id=user_id,
                error=str(e),
                exc_info=True
            )

    def record_schedule_optimization(
        self,
        user_id: str,
        duration: float,
        status: str,
        event_count: int,
        confidence_score: float,
        improvement_count: int
    ):
        """Record metrics for schedule optimization operations."""
        try:
            SCHEDULE_OPTIMIZATION_REQUESTS.labels(
                user_id=user_id,
                status=status
            ).inc()

            SCHEDULE_OPTIMIZATION_DURATION.labels(
                user_id=user_id,
                status=status
            ).observe(duration)

            SCHEDULE_EVENTS_COUNT.labels(
                user_id=user_id,
                operation='optimization'
            ).observe(event_count)

            SCHEDULE_CONFIDENCE_SCORES.labels(
                user_id=user_id,
                operation='optimization'
            ).observe(confidence_score)

            logger.info(
                "Schedule optimization metrics recorded",
                user_id=user_id,
                duration=duration,
                status=status,
                event_count=event_count,
                confidence_score=confidence_score,
                improvement_count=improvement_count
            )

        except Exception as e:
            logger.error(
                "Failed to record schedule optimization metrics",
                user_id=user_id,
                error=str(e),
                exc_info=True
            )

    def record_feature_usage(
        self,
        feature: str,
        user_id: str,
        status: str,
        duration: Optional[float] = None,
        error_type: Optional[str] = None
    ):
        """Record metrics for feature usage."""
        try:
            FEATURE_REQUESTS.labels(
                feature=feature,
                user_id=user_id,
                status=status
            ).inc()

            if error_type:
                FEATURE_ERRORS.labels(
                    feature=feature,
                    user_id=user_id,
                    error_type=error_type
                ).inc()

            if duration is not None:
                # Could add a histogram for feature duration if needed
                pass

            logger.info(
                "Feature usage recorded",
                feature=feature,
                user_id=user_id,
                status=status,
                duration=duration,
                error_type=error_type
            )

        except Exception as e:
            logger.error(
                "Failed to record feature usage metrics",
                feature=feature,
                user_id=user_id,
                error=str(e),
                exc_info=True
            )

    def record_ai_model_usage(
        self,
        model: str,
        operation: str,
        duration: float,
        status: str,
        tokens_used: Optional[int] = None
    ):
        """Record metrics for AI model usage."""
        try:
            AI_MODEL_REQUESTS.labels(
                model=model,
                operation=operation,
                status=status
            ).inc()

            AI_MODEL_LATENCY.labels(
                model=model,
                operation=operation
            ).observe(duration)

            logger.info(
                "AI model usage recorded",
                model=model,
                operation=operation,
                duration=duration,
                status=status,
                tokens_used=tokens_used
            )

        except Exception as e:
            logger.error(
                "Failed to record AI model metrics",
                model=model,
                operation=operation,
                error=str(e),
                exc_info=True
            )

    def record_calendar_sync(
        self,
        user_id: str,
        events_synced: int,
        conflicts_detected: int = 0,
        conflicts_resolved: int = 0,
        duration: Optional[float] = None,
        status: str = "success"
    ):
        """Record metrics for calendar sync operations."""
        try:
            CALENDAR_SYNC_REQUESTS.labels(
                user_id=user_id,
                status=status
            ).inc()

            if duration is not None:
                CALENDAR_SYNC_DURATION.labels(
                    user_id=user_id,
                    status=status
                ).observe(duration)

            CALENDAR_EVENTS_SYNCED.labels(
                user_id=user_id,
                operation='sync'
            ).observe(events_synced)

            if conflicts_detected > 0:
                CALENDAR_CONFLICTS_DETECTED.labels(
                    user_id=user_id,
                    conflict_type='total'
                ).observe(conflicts_detected)

            if conflicts_resolved > 0:
                CALENDAR_CONFLICTS_RESOLVED.labels(
                    user_id=user_id,
                    resolution_strategy='auto'
                ).observe(conflicts_resolved)

            logger.info(
                "Calendar sync metrics recorded",
                user_id=user_id,
                events_synced=events_synced,
                conflicts_detected=conflicts_detected,
                conflicts_resolved=conflicts_resolved,
                duration=duration,
                status=status
            )

        except Exception as e:
            logger.error(
                "Failed to record calendar sync metrics",
                user_id=user_id,
                error=str(e),
                exc_info=True
            )

    def record_conflict_resolution(
        self,
        user_id: str,
        conflicts_resolved: int,
        resolution_strategy: Optional[str] = None,
        status: str = "success"
    ):
        """Record metrics for conflict resolution operations."""
        try:
            CALENDAR_CONFLICT_RESOLUTION_REQUESTS.labels(
                user_id=user_id,
                status=status
            ).inc()

            if resolution_strategy and conflicts_resolved > 0:
                CALENDAR_CONFLICTS_RESOLVED.labels(
                    user_id=user_id,
                    resolution_strategy=resolution_strategy
                ).observe(conflicts_resolved)

            logger.info(
                "Conflict resolution metrics recorded",
                user_id=user_id,
                conflicts_resolved=conflicts_resolved,
                resolution_strategy=resolution_strategy,
                status=status
            )

        except Exception as e:
            logger.error(
                "Failed to record conflict resolution metrics",
                user_id=user_id,
                error=str(e),
                exc_info=True
            )

    def update_service_health(self, version: str, features: list):
        """Update service health information."""
        try:
            SERVICE_INFO.info({
                'version': version,
                'features': ','.join(features),
                'uptime_seconds': str(int(time.time() - self._service_start_time))
            })

        except Exception as e:
            logger.error(
                "Failed to update service health info",
                error=str(e),
                exc_info=True
            )

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of current metrics."""
        return {
            'service_uptime_seconds': int(time.time() - self._service_start_time),
            'features': {
                'schedule_generation_requests': SCHEDULE_GENERATION_REQUESTS._metrics,
                'schedule_optimization_requests': SCHEDULE_OPTIMIZATION_REQUESTS._metrics,
                'feature_requests': FEATURE_REQUESTS._metrics,
            }
        }


# Global telemetry collector instance
_telemetry_collector: Optional[TelemetryCollector] = None


def get_telemetry_collector() -> TelemetryCollector:
    """Get the global telemetry collector instance."""
    global _telemetry_collector

    if _telemetry_collector is None:
        _telemetry_collector = TelemetryCollector()

    return _telemetry_collector


def record_schedule_generation(*args, **kwargs):
    """Convenience function to record schedule generation metrics."""
    get_telemetry_collector().record_schedule_generation(*args, **kwargs)


def record_schedule_optimization(*args, **kwargs):
    """Convenience function to record schedule optimization metrics."""
    get_telemetry_collector().record_schedule_optimization(*args, **kwargs)


def record_feature_usage(*args, **kwargs):
    """Convenience function to record feature usage metrics."""
    get_telemetry_collector().record_feature_usage(*args, **kwargs)


def record_ai_model_usage(*args, **kwargs):
    """Convenience function to record AI model usage metrics."""
    get_telemetry_collector().record_ai_model_usage(*args, **kwargs)


def record_calendar_sync(*args, **kwargs):
    """Convenience function to record calendar sync metrics."""
    get_telemetry_collector().record_calendar_sync(*args, **kwargs)


def record_conflict_resolution(*args, **kwargs):
    """Convenience function to record conflict resolution metrics."""
    get_telemetry_collector().record_conflict_resolution(*args, **kwargs)
