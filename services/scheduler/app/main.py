"""
BeQ LLM Scheduler Service

This service provides AI-powered scheduling optimization using
OpenAI models for intelligent task scheduling.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from uuid import UUID
import structlog
import asyncio

from .llm.openrouter_client import (
    OpenAIClient,
    SchedulingContext,
    SchedulingResult,
    get_openai_client,
    cleanup_openai_client
)

logger = structlog.get_logger(__name__)

# Pydantic models for API
class TaskInput(BaseModel):
    """Input model for a task to be scheduled."""
    id: str
    title: str
    description: Optional[str] = None
    category: str = "work"
    priority: str = "medium"  # low, medium, high, urgent
    estimated_duration_minutes: int
    deadline: Optional[datetime] = None
    preferred_time: Optional[str] = None  # "morning", "afternoon", "evening"
    dependencies: List[str] = Field(default_factory=list)

class EventInput(BaseModel):
    """Input model for existing events."""
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    is_moveable: bool = False

class UserPreferences(BaseModel):
    """User preferences for scheduling."""
    timezone: str = "UTC"
    work_start_time: str = "09:00"
    work_end_time: str = "17:00"
    break_frequency_minutes: int = 90
    break_duration_minutes: int = 15
    lunch_time: str = "12:00"
    lunch_duration_minutes: int = 60
    preferred_task_duration_minutes: int = 90
    energy_peak_hours: List[str] = Field(default_factory=lambda: ["09:00-11:00", "14:00-16:00"])
    avoid_scheduling_after: str = "18:00"

class ConstraintInput(BaseModel):
    """Input model for scheduling constraints."""
    type: str  # "time_block", "no_meetings", "focus_time"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    description: str
    is_hard_constraint: bool = True

class ScheduleRequest(BaseModel):
    """Request model for schedule generation."""
    user_id: str
    tasks: List[TaskInput]
    existing_events: List[EventInput] = Field(default_factory=list)
    user_preferences: UserPreferences
    constraints: List[ConstraintInput] = Field(default_factory=list)
    planning_horizon_days: int = 7

class ScheduleResponse(BaseModel):
    """Response model for generated schedule."""
    success: bool
    scheduled_events: List[Dict[str, Any]]
    reasoning: str
    confidence_score: float
    alternative_suggestions: List[str]
    warnings: List[str]
    unscheduled_tasks: List[str] = Field(default_factory=list)
    processing_time_seconds: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting BeQ LLM Scheduler Service", version="2.0.0", model="gemma-3-27b-it")
    
    # Initialize OpenAI client
    try:
        client = await get_openai_client()
        logger.info("OpenAI client initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize OpenAI client", exc_info=e)
    
    yield
    
    # Shutdown
    logger.info("Shutting down BeQ LLM Scheduler Service")
    await cleanup_openai_client()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="BeQ LLM Scheduler Service",
        description="AI-powered scheduling optimization using OpenAI models",
        version="2.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    
    # Middleware setup
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "beq-llm-scheduler",
            "version": "2.0.0",
            "ai_model": "gpt-4o-mini",
            "provider": "openai",
            "capabilities": [
                "llm_scheduling",
                "contextual_optimization",
                "natural_language_reasoning",
                "adaptive_scheduling"
            ]
        }
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "service": "BeQ LLM Scheduler Service",
            "version": "2.0.0",
            "status": "operational",
            "ai_model": "gpt-4o-mini",
            "provider": "OpenAI",
            "features": [
                "AI-powered schedule optimization",
                "Natural language reasoning",
                "Context-aware planning",
                "User preference learning",
                "Intelligent conflict resolution"
            ]
        }
    
    @app.post("/api/v1/schedule", response_model=ScheduleResponse)
    async def generate_schedule(request: ScheduleRequest):
        """Generate an optimized schedule using OpenAI."""
        
        start_time = datetime.now()
        
        try:
            logger.info(
                "Schedule generation request received",
                user_id=request.user_id,
                tasks_count=len(request.tasks),
                planning_horizon=request.planning_horizon_days
            )
            
            # Get OpenAI client
            client = await get_openai_client()
            
            # Prepare scheduling context
            context = SchedulingContext(
                user_preferences=request.user_preferences.dict(),
                existing_events=[event.dict() for event in request.existing_events],
                tasks_to_schedule=[task.dict() for task in request.tasks],
                constraints=[constraint.dict() for constraint in request.constraints],
                current_time=datetime.now(),
                planning_horizon_days=request.planning_horizon_days
            )
            
            # Generate schedule using LLM
            result = await client.generate_schedule(context)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Identify unscheduled tasks
            scheduled_task_ids = {event.get("task_id") for event in result.scheduled_events}
            unscheduled_tasks = [
                task.id for task in request.tasks 
                if task.id not in scheduled_task_ids
            ]
            
            logger.info(
                "Schedule generation completed",
                user_id=request.user_id,
                scheduled_count=len(result.scheduled_events),
                unscheduled_count=len(unscheduled_tasks),
                confidence=result.confidence_score,
                processing_time=processing_time
            )
            
            return ScheduleResponse(
                success=True,
                scheduled_events=result.scheduled_events,
                reasoning=result.reasoning,
                confidence_score=result.confidence_score,
                alternative_suggestions=result.alternative_suggestions,
                warnings=result.warnings,
                unscheduled_tasks=unscheduled_tasks,
                processing_time_seconds=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            
            logger.error(
                "Schedule generation failed",
                user_id=request.user_id,
                exc_info=e,
                processing_time=processing_time
            )
            
            raise HTTPException(
                status_code=500,
                detail=f"Schedule generation failed: {str(e)}"
            )
    
    @app.post("/api/v1/optimize")
    async def optimize_existing_schedule(
        user_id: str,
        existing_schedule: List[Dict[str, Any]],
        optimization_goals: List[str] = None
    ):
        """Optimize an existing schedule."""
        
        try:
            # TODO: Implement schedule optimization
            # For now, return the existing schedule
            return {
                "success": True,
                "optimized_schedule": existing_schedule,
                "improvements": [],
                "confidence_score": 0.8
            }
            
        except Exception as e:
            logger.error("Schedule optimization failed", exc_info=e)
            raise HTTPException(
                status_code=500,
                detail=f"Schedule optimization failed: {str(e)}"
            )
    
    @app.get("/api/v1/suggestions/{user_id}")
    async def get_scheduling_suggestions(user_id: str):
        """Get AI-powered scheduling suggestions for a user."""
        
        try:
            # TODO: Implement personalized suggestions
            suggestions = [
                "Consider scheduling your most important tasks during morning hours (9-11 AM)",
                "You have a gap between 2-3 PM that could be used for a focused work session",
                "Try batching similar tasks together to minimize context switching",
                "Schedule a 15-minute break after your 2-hour meeting block"
            ]
            
            return {
                "user_id": user_id,
                "suggestions": suggestions,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error("Failed to generate suggestions", exc_info=e)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate suggestions: {str(e)}"
            )
    
    @app.get("/api/v1/models/status")
    async def get_model_status():
        """Get the status of the AI model."""

        try:
            client = await get_openai_client()

            return {
                "model": "gpt-4o-mini",
                "provider": "OpenAI",
                "status": "operational",
                "max_tokens": client.max_tokens,
                "temperature": client.temperature,
                "capabilities": [
                    "Schedule generation",
                    "Natural language reasoning",
                    "Context understanding",
                    "Preference learning"
                ]
            }

        except Exception as e:
            logger.error("Failed to get model status", exc_info=e)
            return {
                "model": "gpt-4o-mini",
                "provider": "OpenAI",
                "status": "unavailable",
                "error": str(e)
            }
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )