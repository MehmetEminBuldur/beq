"""
BeQ Shared Models Package

This package contains shared data models and schemas used across all BeQ services.
It provides Pydantic models for consistent data validation and serialization.
"""

from .user import User, Profile, Preferences
from .schedule import Brick, Quanta, Event, Constraint, Calendar, TimeSlot
from .resources import Resource, ResourceType, ResourceMetadata
from .responses import APIResponse, ErrorResponse, SuccessResponse

__version__ = "0.1.0"

__all__ = [
    # User models
    "User",
    "Profile", 
    "Preferences",
    # Schedule models
    "Brick",
    "Quanta", 
    "Event",
    "Constraint",
    "Calendar",
    "TimeSlot",
    # Resource models
    "Resource",
    "ResourceType", 
    "ResourceMetadata",
    # Response models
    "APIResponse",
    "ErrorResponse",
    "SuccessResponse",
]
