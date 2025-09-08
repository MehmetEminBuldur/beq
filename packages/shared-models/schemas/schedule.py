"""
Schedule-related data models for BeQ application.

This module contains Pydantic models for Bricks, Quantas, Events, 
and other scheduling components.
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class Priority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    """Task completion status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class RecurrenceType(str, Enum):
    """Types of task recurrence."""
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class BrickCategory(str, Enum):
    """Categories for main tasks (Bricks)."""
    WORK = "work"
    PERSONAL = "personal"
    HEALTH = "health"
    LEARNING = "learning"
    SOCIAL = "social"
    MAINTENANCE = "maintenance"
    RECREATION = "recreation"


class QuantaType(str, Enum):
    """Types of sub-tasks (Quantas)."""
    PREPARATION = "preparation"
    EXECUTION = "execution"
    REVIEW = "review"
    BREAK = "break"
    TRAVEL = "travel"
    RESEARCH = "research"


class TimeSlot(BaseModel):
    """Represents a specific time slot in the calendar."""
    
    start_time: datetime = Field(..., description="Start time of the slot")
    end_time: datetime = Field(..., description="End time of the slot")
    is_available: bool = Field(True, description="Whether the slot is available for scheduling")
    
    @validator('end_time')
    def validate_end_after_start(cls, v, values):
        """Ensure end time is after start time."""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError("End time must be after start time")
        return v
    
    @property
    def duration_minutes(self) -> int:
        """Calculate duration in minutes."""
        return int((self.end_time - self.start_time).total_seconds() / 60)


class Constraint(BaseModel):
    """Represents scheduling constraints."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique constraint identifier")
    user_id: UUID = Field(..., description="User who owns this constraint")
    
    # Constraint definition
    name: str = Field(..., min_length=1, max_length=100, description="Constraint name")
    description: Optional[str] = Field(None, max_length=500, description="Constraint description")
    
    # Time constraints
    earliest_start: Optional[datetime] = Field(None, description="Earliest possible start time")
    latest_end: Optional[datetime] = Field(None, description="Latest possible end time")
    blocked_time_slots: List[TimeSlot] = Field(default_factory=list, description="Time slots that are unavailable")
    
    # Day/time patterns
    allowed_days: Optional[List[int]] = Field(None, description="Allowed days of week (0=Monday, 6=Sunday)")
    allowed_time_ranges: List[Dict[str, str]] = Field(
        default_factory=list, 
        description="Allowed time ranges per day"
    )
    
    # Duration constraints
    min_duration_minutes: Optional[int] = Field(None, ge=1, description="Minimum task duration")
    max_duration_minutes: Optional[int] = Field(None, ge=1, description="Maximum task duration")
    
    # Priority and flexibility
    is_hard_constraint: bool = Field(True, description="Whether this constraint is mandatory")
    flexibility_score: float = Field(0.5, ge=0.0, le=1.0, description="How flexible this constraint is")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Constraint creation time")


class Quanta(BaseModel):
    """Represents a sub-task within a Brick."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique Quanta identifier")
    brick_id: UUID = Field(..., description="Parent Brick identifier")
    user_id: UUID = Field(..., description="User who owns this Quanta")
    
    # Basic information
    title: str = Field(..., min_length=1, max_length=200, description="Quanta title")
    description: Optional[str] = Field(None, max_length=1000, description="Detailed description")
    quanta_type: QuantaType = Field(..., description="Type of Quanta")
    
    # Scheduling information
    estimated_duration_minutes: int = Field(..., ge=1, le=1440, description="Estimated duration in minutes")
    actual_duration_minutes: Optional[int] = Field(None, description="Actual duration when completed")
    
    # Priority and status
    priority: Priority = Field(Priority.MEDIUM, description="Quanta priority")
    status: TaskStatus = Field(TaskStatus.PENDING, description="Current status")
    
    # Timing
    scheduled_start: Optional[datetime] = Field(None, description="Scheduled start time")
    scheduled_end: Optional[datetime] = Field(None, description="Scheduled end time")
    actual_start: Optional[datetime] = Field(None, description="Actual start time")
    actual_end: Optional[datetime] = Field(None, description="Actual end time")
    
    # Dependencies
    depends_on_quantas: List[UUID] = Field(default_factory=list, description="Quanta IDs this depends on")
    prerequisite_resources: List[str] = Field(default_factory=list, description="Required resources")
    
    # Progress tracking
    completion_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Completion percentage")
    notes: Optional[str] = Field(None, description="User notes about this Quanta")
    
    # AI recommendations
    ai_suggestions: List[str] = Field(default_factory=list, description="AI-generated suggestions")
    resource_links: List[UUID] = Field(default_factory=list, description="Associated resource IDs")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Quanta creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")


class Brick(BaseModel):
    """Represents a main task or project in the BeQ system."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique Brick identifier")
    user_id: UUID = Field(..., description="User who owns this Brick")
    
    # Basic information
    title: str = Field(..., min_length=1, max_length=200, description="Brick title")
    description: Optional[str] = Field(None, max_length=2000, description="Detailed description")
    category: BrickCategory = Field(..., description="Brick category")
    
    # Timing and scheduling
    target_date: Optional[datetime] = Field(None, description="Target completion date")
    deadline: Optional[datetime] = Field(None, description="Hard deadline if any")
    estimated_total_duration_minutes: int = Field(..., ge=1, description="Total estimated duration")
    
    # Priority and status
    priority: Priority = Field(Priority.MEDIUM, description="Brick priority")
    status: TaskStatus = Field(TaskStatus.PENDING, description="Current status")
    
    # Recurrence
    recurrence_type: RecurrenceType = Field(RecurrenceType.NONE, description="Recurrence pattern")
    recurrence_interval: Optional[int] = Field(None, description="Recurrence interval")
    recurrence_end_date: Optional[datetime] = Field(None, description="When recurrence ends")
    
    # Sub-tasks
    quantas: List[Quanta] = Field(default_factory=list, description="Associated Quantas")
    
    # Constraints and preferences
    constraints: List[UUID] = Field(default_factory=list, description="Applied constraint IDs")
    preferred_time_of_day: Optional[str] = Field(None, description="Preferred time of day")
    energy_level_required: str = Field("medium", description="Energy level required")
    
    # Progress tracking
    completion_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Overall completion percentage")
    
    # AI and personalization
    ai_difficulty_rating: Optional[float] = Field(None, ge=1.0, le=10.0, description="AI-assessed difficulty")
    personalization_tags: List[str] = Field(default_factory=list, description="Tags for personalization")
    learning_objectives: List[str] = Field(default_factory=list, description="Learning objectives")
    
    # Tracking
    time_spent_minutes: int = Field(0, description="Total time spent on this Brick")
    sessions_count: int = Field(0, description="Number of work sessions")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Brick creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    
    @validator('quantas')
    def validate_quantas_belong_to_brick(cls, v, values):
        """Ensure all Quantas belong to this Brick."""
        if 'id' in values:
            brick_id = values['id']
            for quanta in v:
                if quanta.brick_id != brick_id:
                    raise ValueError(f"Quanta {quanta.id} does not belong to Brick {brick_id}")
        return v
    
    @property
    def total_estimated_duration(self) -> timedelta:
        """Get total estimated duration as timedelta."""
        return timedelta(minutes=self.estimated_total_duration_minutes)
    
    def calculate_completion_percentage(self) -> float:
        """Calculate completion percentage based on Quantas."""
        if not self.quantas:
            return 0.0
        
        total_completion = sum(q.completion_percentage for q in self.quantas)
        return total_completion / len(self.quantas)


class Event(BaseModel):
    """Represents a calendar event (from external calendars or BeQ-created)."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique event identifier")
    user_id: UUID = Field(..., description="User who owns this event")
    
    # Event details
    title: str = Field(..., min_length=1, max_length=200, description="Event title")
    description: Optional[str] = Field(None, max_length=2000, description="Event description")
    location: Optional[str] = Field(None, max_length=500, description="Event location")
    
    # Timing
    start_time: datetime = Field(..., description="Event start time")
    end_time: datetime = Field(..., description="Event end time")
    timezone: str = Field("UTC", description="Event timezone")
    is_all_day: bool = Field(False, description="Whether this is an all-day event")
    
    # Source and integration
    source_calendar: Optional[str] = Field(None, description="Source calendar (google, outlook, etc.)")
    external_id: Optional[str] = Field(None, description="External calendar event ID")
    is_beq_managed: bool = Field(False, description="Whether this event is managed by BeQ")
    
    # Related BeQ objects
    related_brick_id: Optional[UUID] = Field(None, description="Related Brick ID if applicable")
    related_quanta_id: Optional[UUID] = Field(None, description="Related Quanta ID if applicable")
    
    # Attendees and permissions
    attendees: List[str] = Field(default_factory=list, description="Event attendees")
    is_modifiable: bool = Field(True, description="Whether user can modify this event")
    
    # Recurrence
    recurrence_type: RecurrenceType = Field(RecurrenceType.NONE, description="Recurrence pattern")
    recurrence_rule: Optional[str] = Field(None, description="Recurrence rule (RRULE format)")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Event creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    
    @validator('end_time')
    def validate_end_after_start(cls, v, values):
        """Ensure end time is after start time."""
        if 'start_time' in values and not values.get('is_all_day', False):
            if v <= values['start_time']:
                raise ValueError("End time must be after start time")
        return v


class Calendar(BaseModel):
    """Represents a user's calendar with all events and tasks."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique calendar identifier")
    user_id: UUID = Field(..., description="Calendar owner")
    
    # Calendar metadata
    name: str = Field(..., min_length=1, max_length=100, description="Calendar name")
    description: Optional[str] = Field(None, max_length=500, description="Calendar description")
    timezone: str = Field("UTC", description="Calendar timezone")
    
    # Content
    bricks: List[Brick] = Field(default_factory=list, description="User's Bricks")
    events: List[Event] = Field(default_factory=list, description="Calendar events")
    constraints: List[Constraint] = Field(default_factory=list, description="User constraints")
    
    # Settings
    work_hours_start: Optional[str] = Field(None, description="Work hours start time")
    work_hours_end: Optional[str] = Field(None, description="Work hours end time")
    work_days: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4], description="Work days")
    
    # AI optimization settings
    auto_scheduling_enabled: bool = Field(True, description="Enable automatic scheduling")
    optimization_goals: List[str] = Field(default_factory=list, description="Optimization goals")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Calendar creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    last_optimized_at: Optional[datetime] = Field(None, description="Last optimization timestamp")


class ScheduleRequest(BaseModel):
    """Request model for scheduling operations."""
    
    user_id: UUID
    brick_ids: Optional[List[UUID]] = Field(None, description="Specific Bricks to schedule")
    start_date: datetime = Field(..., description="Scheduling window start")
    end_date: datetime = Field(..., description="Scheduling window end")
    
    # Optimization parameters
    prioritize_deadlines: bool = Field(True, description="Prioritize tasks with deadlines")
    respect_preferences: bool = Field(True, description="Respect user preferences")
    allow_overtime: bool = Field(False, description="Allow scheduling outside work hours")
    
    # AI parameters
    creativity_level: float = Field(0.5, ge=0.0, le=1.0, description="AI creativity in scheduling")
    health_optimization: bool = Field(True, description="Optimize for health and well-being")


class ScheduleResponse(BaseModel):
    """Response model for scheduling operations."""
    
    success: bool = Field(..., description="Whether scheduling was successful")
    message: str = Field(..., description="Status message")
    
    # Scheduled items
    scheduled_bricks: List[Brick] = Field(default_factory=list, description="Successfully scheduled Bricks")
    failed_bricks: List[Dict[str, Union[UUID, str]]] = Field(
        default_factory=list, 
        description="Bricks that couldn't be scheduled with reasons"
    )
    
    # Calendar updates
    updated_calendar: Optional[Calendar] = Field(None, description="Updated calendar")
    
    # AI insights
    optimization_score: Optional[float] = Field(None, description="Optimization quality score")
    ai_recommendations: List[str] = Field(default_factory=list, description="AI recommendations")
    alternative_schedules: List[Dict] = Field(default_factory=list, description="Alternative schedule options")
    
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
