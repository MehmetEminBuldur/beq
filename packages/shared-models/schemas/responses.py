"""
API response models for BeQ application.

This module contains Pydantic models for standardized API responses,
error handling, and success responses across all services.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field


class ResponseStatus(str, Enum):
    """Status codes for API responses."""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ErrorCode(str, Enum):
    """Standardized error codes across the BeQ system."""
    # Authentication and Authorization
    UNAUTHORIZED = "unauthorized"
    FORBIDDEN = "forbidden"
    TOKEN_EXPIRED = "token_expired"
    INVALID_CREDENTIALS = "invalid_credentials"
    
    # Validation Errors
    VALIDATION_ERROR = "validation_error"
    INVALID_INPUT = "invalid_input"
    MISSING_REQUIRED_FIELD = "missing_required_field"
    INVALID_FORMAT = "invalid_format"
    
    # Resource Errors
    RESOURCE_NOT_FOUND = "resource_not_found"
    RESOURCE_ALREADY_EXISTS = "resource_already_exists"
    RESOURCE_CONFLICT = "resource_conflict"
    RESOURCE_LOCKED = "resource_locked"
    
    # Business Logic Errors
    SCHEDULING_CONFLICT = "scheduling_conflict"
    INSUFFICIENT_TIME = "insufficient_time"
    CONSTRAINT_VIOLATION = "constraint_violation"
    DEADLINE_PASSED = "deadline_passed"
    
    # External Service Errors
    CALENDAR_INTEGRATION_ERROR = "calendar_integration_error"
    AI_SERVICE_ERROR = "ai_service_error"
    EXTERNAL_API_ERROR = "external_api_error"
    
    # System Errors
    INTERNAL_SERVER_ERROR = "internal_server_error"
    SERVICE_UNAVAILABLE = "service_unavailable"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    MAINTENANCE_MODE = "maintenance_mode"
    
    # Data Errors
    DATABASE_ERROR = "database_error"
    DATA_INTEGRITY_ERROR = "data_integrity_error"
    SERIALIZATION_ERROR = "serialization_error"


class ErrorDetail(BaseModel):
    """Detailed error information."""
    
    code: ErrorCode = Field(..., description="Specific error code")
    message: str = Field(..., description="Human-readable error message")
    field: Optional[str] = Field(None, description="Field that caused the error")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional error context")
    suggestion: Optional[str] = Field(None, description="Suggested fix for the error")


class Pagination(BaseModel):
    """Pagination information for list responses."""
    
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, le=100, description="Number of items per page")
    total_items: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_previous: bool = Field(..., description="Whether there is a previous page")


class APIResponse(BaseModel):
    """Base API response model."""
    
    status: ResponseStatus = Field(..., description="Response status")
    message: str = Field(..., description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    request_id: Optional[str] = Field(None, description="Unique request identifier")
    
    # Performance metrics
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional response metadata")


class SuccessResponse(APIResponse):
    """Success response with data."""
    
    status: ResponseStatus = Field(ResponseStatus.SUCCESS, description="Success status")
    data: Optional[Any] = Field(None, description="Response data")
    
    # Pagination for list responses
    pagination: Optional[Pagination] = Field(None, description="Pagination information")
    
    # Additional success metadata
    total_count: Optional[int] = Field(None, description="Total count for list responses")
    affected_items: Optional[int] = Field(None, description="Number of affected items")


class ErrorResponse(APIResponse):
    """Error response with detailed error information."""
    
    status: ResponseStatus = Field(ResponseStatus.ERROR, description="Error status")
    error: ErrorDetail = Field(..., description="Error details")
    errors: Optional[List[ErrorDetail]] = Field(None, description="Multiple errors if applicable")
    
    # Debug information (only in development)
    debug_info: Optional[Dict[str, Any]] = Field(None, description="Debug information")
    stack_trace: Optional[str] = Field(None, description="Stack trace for debugging")


class ValidationErrorResponse(ErrorResponse):
    """Specialized error response for validation errors."""
    
    error: ErrorDetail = Field(
        default_factory=lambda: ErrorDetail(
            code=ErrorCode.VALIDATION_ERROR,
            message="Validation failed"
        )
    )
    validation_errors: List[ErrorDetail] = Field(
        default_factory=list, 
        description="Detailed validation errors"
    )


class WarningResponse(APIResponse):
    """Warning response for non-critical issues."""
    
    status: ResponseStatus = Field(ResponseStatus.WARNING, description="Warning status")
    warning: ErrorDetail = Field(..., description="Warning details")
    warnings: Optional[List[ErrorDetail]] = Field(None, description="Multiple warnings if applicable")
    data: Optional[Any] = Field(None, description="Response data despite warnings")


# Specialized response models for different data types

class UserResponse(SuccessResponse):
    """Response containing user data."""
    
    def __init__(self, user_data: Any, **kwargs):
        super().__init__(data=user_data, **kwargs)


class ScheduleResponse(SuccessResponse):
    """Response containing schedule data."""
    
    def __init__(self, schedule_data: Any, **kwargs):
        super().__init__(data=schedule_data, **kwargs)


class ResourceResponse(SuccessResponse):
    """Response containing resource recommendations."""
    
    def __init__(self, resource_data: Any, **kwargs):
        super().__init__(data=resource_data, **kwargs)


class CalendarResponse(SuccessResponse):
    """Response containing calendar data."""
    
    def __init__(self, calendar_data: Any, **kwargs):
        super().__init__(data=calendar_data, **kwargs)


# Async operation responses

class AsyncOperationResponse(SuccessResponse):
    """Response for async operations."""
    
    operation_id: UUID = Field(..., description="Async operation identifier")
    status_url: str = Field(..., description="URL to check operation status")
    estimated_completion_time: Optional[datetime] = Field(
        None, 
        description="Estimated completion time"
    )


class OperationStatus(BaseModel):
    """Status of an async operation."""
    
    operation_id: UUID = Field(..., description="Operation identifier")
    status: str = Field(..., description="Current status")
    progress_percentage: float = Field(..., ge=0.0, le=100.0, description="Progress percentage")
    current_step: Optional[str] = Field(None, description="Current processing step")
    estimated_remaining_time: Optional[int] = Field(None, description="Estimated remaining time in seconds")
    
    # Results
    result: Optional[Any] = Field(None, description="Operation result if completed")
    error: Optional[ErrorDetail] = Field(None, description="Error if operation failed")
    
    created_at: datetime = Field(..., description="Operation start time")
    updated_at: datetime = Field(..., description="Last update time")
    completed_at: Optional[datetime] = Field(None, description="Completion time")


# Health check and system status responses

class HealthCheckResponse(BaseModel):
    """Health check response for services."""
    
    service_name: str = Field(..., description="Name of the service")
    status: str = Field(..., description="Service status (healthy, unhealthy, degraded)")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    
    # Service-specific health metrics
    uptime_seconds: int = Field(..., description="Service uptime in seconds")
    dependencies: Dict[str, str] = Field(
        default_factory=dict, 
        description="Status of service dependencies"
    )
    
    # Performance metrics
    response_time_ms: Optional[float] = Field(None, description="Average response time")
    cpu_usage_percent: Optional[float] = Field(None, description="CPU usage percentage")
    memory_usage_percent: Optional[float] = Field(None, description="Memory usage percentage")
    
    # Additional info
    environment: str = Field("production", description="Environment name")
    build_info: Optional[Dict[str, str]] = Field(None, description="Build information")


class SystemStatusResponse(BaseModel):
    """Overall system status response."""
    
    overall_status: str = Field(..., description="Overall system status")
    services: List[HealthCheckResponse] = Field(..., description="Individual service statuses")
    incident_count: int = Field(0, description="Number of active incidents")
    maintenance_mode: bool = Field(False, description="Whether system is in maintenance mode")
    
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Status check timestamp")


# Chat and AI interaction responses

class ChatMessage(BaseModel):
    """Chat message model."""
    
    id: UUID = Field(..., description="Message identifier")
    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    
    # AI-specific fields
    model_used: Optional[str] = Field(None, description="AI model used for response")
    confidence_score: Optional[float] = Field(None, description="AI confidence score")
    processing_time_ms: Optional[int] = Field(None, description="Processing time")
    
    # Context
    context_brick_id: Optional[UUID] = Field(None, description="Related Brick ID")
    context_quanta_id: Optional[UUID] = Field(None, description="Related Quanta ID")
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional message metadata")


class ChatResponse(SuccessResponse):
    """Response for chat interactions."""
    
    message: ChatMessage = Field(..., description="AI response message")
    suggested_actions: List[str] = Field(default_factory=list, description="Suggested follow-up actions")
    recommendations: List[str] = Field(default_factory=list, description="AI recommendations")
    
    # Context updates
    updated_bricks: Optional[List[UUID]] = Field(None, description="Updated Brick IDs")
    updated_schedule: bool = Field(False, description="Whether schedule was updated")
    
    def __init__(self, message: ChatMessage, **kwargs):
        super().__init__(data=message, message="Chat response generated", **kwargs)
        self.message = message


# Batch operation responses

class BatchOperationResult(BaseModel):
    """Result of a single operation in a batch."""
    
    item_id: str = Field(..., description="Identifier of the processed item")
    success: bool = Field(..., description="Whether operation succeeded")
    result: Optional[Any] = Field(None, description="Operation result if successful")
    error: Optional[ErrorDetail] = Field(None, description="Error if operation failed")


class BatchResponse(SuccessResponse):
    """Response for batch operations."""
    
    total_items: int = Field(..., description="Total number of items processed")
    successful_items: int = Field(..., description="Number of successful operations")
    failed_items: int = Field(..., description="Number of failed operations")
    
    results: List[BatchOperationResult] = Field(..., description="Individual operation results")
    
    # Summary
    success_rate: float = Field(..., description="Success rate as percentage")
    processing_summary: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Summary of processing"
    )
