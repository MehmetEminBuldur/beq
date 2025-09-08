"""
User-related data models for BeQ application.

This module contains Pydantic models for user profiles, preferences,
and authentication-related data structures.
"""

from datetime import datetime, time
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field, validator


class LifestyleGoal(str, Enum):
    """Enumeration of user lifestyle goals."""
    PRODUCTIVITY = "productivity"
    HEALTH_FITNESS = "health_fitness"
    SKILL_DEVELOPMENT = "skill_development"
    WORK_LIFE_BALANCE = "work_life_balance"
    PERSONAL_GROWTH = "personal_growth"
    SOCIAL_CONNECTIONS = "social_connections"


class ActivityLevel(str, Enum):
    """User's activity level for health recommendations."""
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTREMELY_ACTIVE = "extremely_active"


class WorkScheduleType(str, Enum):
    """Type of work schedule the user follows."""
    TRADITIONAL = "traditional"  # 9-5 style
    FLEXIBLE = "flexible"
    REMOTE = "remote"
    SHIFT_WORK = "shift_work"
    FREELANCE = "freelance"
    STUDENT = "student"
    UNEMPLOYED = "unemployed"


class Preferences(BaseModel):
    """User preferences for scheduling and recommendations."""
    
    # Sleep preferences
    preferred_bedtime: time = Field(..., description="Preferred bedtime")
    preferred_wake_time: time = Field(..., description="Preferred wake up time")
    minimum_sleep_hours: float = Field(7.0, ge=4.0, le=12.0, description="Minimum sleep hours needed")
    
    # Work preferences
    work_schedule_type: WorkScheduleType = Field(..., description="Type of work schedule")
    work_start_time: Optional[time] = Field(None, description="Work start time")
    work_end_time: Optional[time] = Field(None, description="Work end time")
    commute_duration_minutes: int = Field(0, ge=0, le=300, description="Commute time in minutes")
    
    # Activity preferences
    activity_level: ActivityLevel = Field(ActivityLevel.MODERATELY_ACTIVE, description="User activity level")
    preferred_workout_times: List[time] = Field(default_factory=list, description="Preferred workout times")
    workout_frequency_per_week: int = Field(3, ge=0, le=14, description="Desired workout frequency per week")
    
    # Learning and development
    daily_learning_minutes: int = Field(30, ge=0, le=480, description="Minutes per day for learning")
    preferred_learning_times: List[time] = Field(default_factory=list, description="Preferred learning times")
    
    # Lifestyle goals
    lifestyle_goals: List[LifestyleGoal] = Field(default_factory=list, description="User's lifestyle goals")
    
    # Break preferences
    break_frequency_minutes: int = Field(90, ge=30, le=240, description="Preferred break frequency")
    break_duration_minutes: int = Field(15, ge=5, le=60, description="Preferred break duration")
    
    # Diet and nutrition
    meal_times: Dict[str, time] = Field(
        default_factory=lambda: {
            "breakfast": time(8, 0),
            "lunch": time(12, 30), 
            "dinner": time(19, 0)
        },
        description="Preferred meal times"
    )
    
    # Notification preferences
    enable_reminders: bool = Field(True, description="Enable task reminders")
    reminder_advance_minutes: int = Field(15, ge=0, le=120, description="Minutes before task to remind")
    enable_daily_summary: bool = Field(True, description="Enable daily schedule summary")
    
    @validator('preferred_wake_time')
    def validate_sleep_schedule(cls, v, values):
        """Validate that wake time is after bedtime with minimum sleep."""
        if 'preferred_bedtime' in values and 'minimum_sleep_hours' in values:
            bedtime = values['preferred_bedtime']
            min_sleep = values['minimum_sleep_hours']
            
            # Calculate minimum wake time
            bedtime_minutes = bedtime.hour * 60 + bedtime.minute
            min_wake_minutes = bedtime_minutes + (min_sleep * 60)
            
            # Handle next day
            if min_wake_minutes >= 1440:  # 24 hours
                min_wake_minutes -= 1440
                
            wake_minutes = v.hour * 60 + v.minute
            
            # Allow for next day wake up
            if wake_minutes < bedtime_minutes:
                wake_minutes += 1440
                
            if wake_minutes - bedtime_minutes < min_sleep * 60:
                raise ValueError(f"Wake time must allow for at least {min_sleep} hours of sleep")
                
        return v


class Profile(BaseModel):
    """User profile information."""
    
    full_name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    date_of_birth: Optional[datetime] = Field(None, description="User's date of birth")
    timezone: str = Field("UTC", description="User's timezone")
    location: Optional[str] = Field(None, max_length=200, description="User's location")
    
    # Professional information
    occupation: Optional[str] = Field(None, max_length=100, description="User's occupation")
    industry: Optional[str] = Field(None, max_length=100, description="User's industry")
    experience_level: Optional[str] = Field(None, description="Professional experience level")
    
    # Health information
    height_cm: Optional[float] = Field(None, ge=100, le=300, description="Height in centimeters")
    weight_kg: Optional[float] = Field(None, ge=30, le=300, description="Weight in kilograms")
    health_conditions: List[str] = Field(default_factory=list, description="Health conditions to consider")
    
    # Interests and skills
    interests: List[str] = Field(default_factory=list, description="User's interests")
    skills_to_develop: List[str] = Field(default_factory=list, description="Skills user wants to develop")
    languages: List[str] = Field(default_factory=list, description="Languages spoken by user")
    
    # Calendar integrations
    connected_calendars: List[str] = Field(default_factory=list, description="Connected calendar providers")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Profile creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Profile last update timestamp")


class User(BaseModel):
    """Main user model."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique user identifier")
    email: EmailStr = Field(..., description="User's email address")
    username: Optional[str] = Field(None, min_length=3, max_length=30, description="Unique username")
    
    # Authentication
    is_active: bool = Field(True, description="Whether user account is active")
    is_verified: bool = Field(False, description="Whether user email is verified")
    
    # Related models
    profile: Optional[Profile] = Field(None, description="User profile information")
    preferences: Optional[Preferences] = Field(None, description="User preferences")
    
    # Subscription and features
    subscription_tier: str = Field("free", description="User's subscription tier")
    features_enabled: List[str] = Field(default_factory=list, description="Enabled features for user")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="User creation timestamp")
    last_login_at: Optional[datetime] = Field(None, description="Last login timestamp")
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            time: lambda v: v.isoformat(),
        }


class UserCreate(BaseModel):
    """Model for creating a new user."""
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Model for updating user information."""
    username: Optional[str] = None
    profile: Optional[Profile] = None
    preferences: Optional[Preferences] = None


class UserResponse(BaseModel):
    """Model for user response (without sensitive data)."""
    id: UUID
    email: EmailStr
    username: Optional[str]
    is_active: bool
    is_verified: bool
    profile: Optional[Profile]
    preferences: Optional[Preferences]
    subscription_tier: str
    features_enabled: List[str]
    created_at: datetime
    last_login_at: Optional[datetime]
