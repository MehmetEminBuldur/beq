"""
Resource-related data models for BeQ application.

This module contains Pydantic models for AI-curated resources,
recommendations, and learning materials.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, HttpUrl, validator


class ResourceType(str, Enum):
    """Types of resources that can be recommended."""
    ARTICLE = "article"
    VIDEO = "video"
    BOOK = "book"
    COURSE = "course"
    PODCAST = "podcast"
    TOOL = "tool"
    TEMPLATE = "template"
    CHECKLIST = "checklist"
    EXERCISE = "exercise"
    RECIPE = "recipe"
    MEDITATION = "meditation"
    WORKOUT = "workout"
    DOCUMENT = "document"
    WEBSITE = "website"


class ContentDifficulty(str, Enum):
    """Difficulty levels for learning content."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class ContentFormat(str, Enum):
    """Format of the content."""
    TEXT = "text"
    VIDEO = "video"
    AUDIO = "audio"
    INTERACTIVE = "interactive"
    PDF = "pdf"
    INFOGRAPHIC = "infographic"
    PRESENTATION = "presentation"


class RelevanceContext(str, Enum):
    """Context in which a resource is relevant."""
    BEFORE_TASK = "before_task"
    DURING_TASK = "during_task"
    AFTER_TASK = "after_task"
    PREPARATION = "preparation"
    SKILL_BUILDING = "skill_building"
    REFERENCE = "reference"
    MOTIVATION = "motivation"
    BREAK_TIME = "break_time"


class ResourceMetadata(BaseModel):
    """Metadata for a resource."""
    
    # Content details
    author: Optional[str] = Field(None, description="Content author or creator")
    publisher: Optional[str] = Field(None, description="Content publisher")
    publish_date: Optional[datetime] = Field(None, description="Publication date")
    language: str = Field("en", description="Content language")
    
    # Content characteristics
    duration_minutes: Optional[int] = Field(None, description="Duration in minutes (for videos, courses)")
    word_count: Optional[int] = Field(None, description="Word count (for articles, books)")
    page_count: Optional[int] = Field(None, description="Page count (for books, documents)")
    
    # Quality metrics
    rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="User rating (0-5)")
    review_count: Optional[int] = Field(None, ge=0, description="Number of reviews")
    credibility_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI-assessed credibility")
    
    # Access information
    is_free: bool = Field(True, description="Whether the resource is free")
    price: Optional[float] = Field(None, description="Price if not free")
    currency: str = Field("USD", description="Currency for price")
    requires_subscription: bool = Field(False, description="Whether requires subscription")
    
    # Technical metadata
    file_size_mb: Optional[float] = Field(None, description="File size in MB")
    supported_platforms: List[str] = Field(default_factory=list, description="Supported platforms")
    
    # SEO and discovery
    keywords: List[str] = Field(default_factory=list, description="Relevant keywords")
    categories: List[str] = Field(default_factory=list, description="Content categories")


class Resource(BaseModel):
    """Represents a curated resource or recommendation."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique resource identifier")
    
    # Basic information
    title: str = Field(..., min_length=1, max_length=300, description="Resource title")
    description: str = Field(..., min_length=1, max_length=2000, description="Resource description")
    summary: Optional[str] = Field(None, max_length=500, description="Brief summary")
    
    # Resource classification
    resource_type: ResourceType = Field(..., description="Type of resource")
    content_format: ContentFormat = Field(..., description="Format of the content")
    difficulty_level: ContentDifficulty = Field(..., description="Difficulty level")
    
    # Access information
    url: Optional[HttpUrl] = Field(None, description="Primary URL to access the resource")
    alternative_urls: List[HttpUrl] = Field(default_factory=list, description="Alternative access URLs")
    
    # Content metadata
    metadata: ResourceMetadata = Field(..., description="Resource metadata")
    
    # Relevance and context
    relevance_contexts: List[RelevanceContext] = Field(
        default_factory=list, 
        description="Contexts where this resource is relevant"
    )
    target_skills: List[str] = Field(default_factory=list, description="Skills this resource helps develop")
    target_goals: List[str] = Field(default_factory=list, description="Goals this resource supports")
    
    # AI recommendations
    ai_confidence_score: float = Field(..., ge=0.0, le=1.0, description="AI confidence in recommendation")
    personalization_score: float = Field(..., ge=0.0, le=1.0, description="How well personalized for user")
    
    # Usage tracking
    view_count: int = Field(0, description="Number of times viewed")
    click_count: int = Field(0, description="Number of times clicked")
    completion_rate: Optional[float] = Field(None, ge=0.0, le=1.0, description="Completion rate for this resource")
    
    # User feedback
    user_ratings: Dict[str, float] = Field(default_factory=dict, description="User ratings by user_id")
    user_feedback: List[str] = Field(default_factory=list, description="User feedback comments")
    
    # Tagging and categorization
    tags: List[str] = Field(default_factory=list, description="Resource tags")
    topics: List[str] = Field(default_factory=list, description="Related topics")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Resource creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    last_recommended_at: Optional[datetime] = Field(None, description="Last time recommended")
    
    # Source and curation
    source: str = Field(..., description="Source of the resource")
    curator: Optional[str] = Field(None, description="Who curated this resource")
    is_ai_curated: bool = Field(True, description="Whether this was AI-curated")
    
    @validator('ai_confidence_score', 'personalization_score')
    def validate_scores(cls, v):
        """Ensure scores are between 0 and 1."""
        if not 0.0 <= v <= 1.0:
            raise ValueError("Score must be between 0.0 and 1.0")
        return v


class ResourceRecommendation(BaseModel):
    """Represents a personalized resource recommendation."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique recommendation identifier")
    user_id: UUID = Field(..., description="User this recommendation is for")
    resource_id: UUID = Field(..., description="Recommended resource ID")
    
    # Recommendation context
    context_brick_id: Optional[UUID] = Field(None, description="Related Brick ID")
    context_quanta_id: Optional[UUID] = Field(None, description="Related Quanta ID")
    relevance_context: RelevanceContext = Field(..., description="When this is relevant")
    
    # Recommendation metadata
    recommendation_reason: str = Field(..., description="Why this was recommended")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in recommendation")
    priority_score: float = Field(..., ge=0.0, le=1.0, description="Priority of this recommendation")
    
    # Personalization factors
    matches_user_level: bool = Field(..., description="Matches user skill level")
    matches_user_interests: bool = Field(..., description="Matches user interests")
    matches_user_goals: bool = Field(..., description="Matches user goals")
    estimated_value: float = Field(..., ge=0.0, le=1.0, description="Estimated value for user")
    
    # Timing
    suggested_timing: Optional[datetime] = Field(None, description="When to consume this resource")
    expires_at: Optional[datetime] = Field(None, description="When recommendation expires")
    
    # User interaction
    viewed: bool = Field(False, description="Whether user has viewed this recommendation")
    clicked: bool = Field(False, description="Whether user has clicked the resource")
    dismissed: bool = Field(False, description="Whether user dismissed this recommendation")
    saved: bool = Field(False, description="Whether user saved this resource")
    
    # Feedback
    user_rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="User rating of recommendation")
    user_feedback: Optional[str] = Field(None, description="User feedback on recommendation")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Recommendation creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")


class ResourceCollection(BaseModel):
    """A curated collection of resources for a specific purpose."""
    
    id: UUID = Field(default_factory=uuid4, description="Unique collection identifier")
    
    # Collection details
    name: str = Field(..., min_length=1, max_length=200, description="Collection name")
    description: str = Field(..., max_length=1000, description="Collection description")
    purpose: str = Field(..., description="Purpose of this collection")
    
    # Resources
    resource_ids: List[UUID] = Field(..., description="IDs of resources in this collection")
    recommended_order: Optional[List[UUID]] = Field(None, description="Recommended consumption order")
    
    # Collection metadata
    difficulty_level: ContentDifficulty = Field(..., description="Overall difficulty level")
    estimated_time_minutes: Optional[int] = Field(None, description="Estimated time to complete")
    
    # Targeting
    target_skills: List[str] = Field(default_factory=list, description="Skills this collection develops")
    target_audience: List[str] = Field(default_factory=list, description="Target audience")
    prerequisites: List[str] = Field(default_factory=list, description="Prerequisites for this collection")
    
    # Curation
    curator: str = Field(..., description="Who curated this collection")
    is_ai_curated: bool = Field(False, description="Whether this was AI-curated")
    
    # Usage and feedback
    usage_count: int = Field(0, description="Number of times this collection was used")
    average_rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="Average user rating")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Collection creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")


class ResourceRequest(BaseModel):
    """Request model for resource recommendations."""
    
    user_id: UUID = Field(..., description="User requesting resources")
    
    # Context
    brick_id: Optional[UUID] = Field(None, description="Related Brick ID")
    quanta_id: Optional[UUID] = Field(None, description="Related Quanta ID")
    context: Optional[RelevanceContext] = Field(None, description="Context for recommendations")
    
    # Filters
    resource_types: Optional[List[ResourceType]] = Field(None, description="Desired resource types")
    difficulty_levels: Optional[List[ContentDifficulty]] = Field(None, description="Desired difficulty levels")
    max_duration_minutes: Optional[int] = Field(None, description="Maximum duration preference")
    free_only: bool = Field(False, description="Only return free resources")
    
    # Personalization
    topics: Optional[List[str]] = Field(None, description="Specific topics of interest")
    skills: Optional[List[str]] = Field(None, description="Skills to develop")
    goals: Optional[List[str]] = Field(None, description="Goals to achieve")
    
    # Response preferences
    limit: int = Field(10, ge=1, le=100, description="Maximum number of recommendations")
    include_metadata: bool = Field(True, description="Include detailed metadata")
    include_alternatives: bool = Field(False, description="Include alternative resources")


class ResourceResponse(BaseModel):
    """Response model for resource recommendations."""
    
    success: bool = Field(..., description="Whether request was successful")
    message: str = Field(..., description="Status message")
    
    # Recommendations
    resources: List[Resource] = Field(default_factory=list, description="Recommended resources")
    recommendations: List[ResourceRecommendation] = Field(
        default_factory=list, 
        description="Detailed recommendation data"
    )
    
    # Collections
    suggested_collections: List[ResourceCollection] = Field(
        default_factory=list, 
        description="Suggested resource collections"
    )
    
    # Metadata
    total_found: int = Field(..., description="Total resources found")
    personalization_score: float = Field(..., ge=0.0, le=1.0, description="Personalization quality")
    
    # AI insights
    ai_insights: List[str] = Field(default_factory=list, description="AI insights about recommendations")
    learning_path: Optional[List[UUID]] = Field(None, description="Suggested learning path")
    
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
