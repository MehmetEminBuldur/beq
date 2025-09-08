"""
Logging configuration for the BeQ Orchestrator Service.

This module sets up structured logging using structlog for consistent
and machine-readable log output across the service.
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.typing import Processor

from .config import get_settings

settings = get_settings()


def setup_logging() -> None:
    """Configure structured logging for the application."""
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper())
    )
    
    # Configure structlog
    processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]
    
    # Add request ID processor
    processors.append(add_request_id)
    
    # Add service information
    processors.append(add_service_info)
    
    if settings.log_format == "json":
        # JSON formatter for production
        processors.extend([
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ])
    else:
        # Human-readable formatter for development
        processors.extend([
            structlog.dev.ConsoleRenderer(colors=True)
        ])
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper())
        ),
        logger_factory=structlog.WriteLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def add_request_id(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Add request ID to log entries if available."""
    import contextvars
    
    # Try to get request ID from context vars
    try:
        request_id = contextvars.ContextVar('request_id').get()
        if request_id:
            event_dict['request_id'] = request_id
    except LookupError:
        # No request ID in context
        pass
    
    return event_dict


def add_service_info(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Add service information to log entries."""
    event_dict.update({
        'service': 'beq-orchestrator',
        'version': '0.1.0',
        'environment': settings.environment
    })
    return event_dict


class LoggerMixin:
    """Mixin class to add structured logging to any class."""
    
    @property
    def logger(self) -> structlog.BoundLogger:
        """Get a bound logger for this class."""
        return structlog.get_logger(self.__class__.__name__)


def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a bound logger with optional name."""
    return structlog.get_logger(name)


# Pre-configured loggers for common use cases
api_logger = get_logger("api")
agent_logger = get_logger("agent")
scheduler_logger = get_logger("scheduler")
security_logger = get_logger("security")
performance_logger = get_logger("performance")
