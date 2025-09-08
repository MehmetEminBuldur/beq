"""
Scheduling tools for the BeQ AI agent.

These tools allow the agent to interact with the scheduler service
and perform scheduling-related operations.
"""

from typing import Dict, Any, Optional
from uuid import UUID

from langchain.tools import BaseTool
from pydantic import BaseModel, Field
import httpx
import structlog

from ..core.config import get_settings
from ..core.logging import LoggerMixin

settings = get_settings()
logger = structlog.get_logger(__name__)


class ScheduleBrickInput(BaseModel):
    """Input for scheduling a Brick."""
    brick_id: str = Field(description="ID of the Brick to schedule")
    user_id: str = Field(description="User ID")
    preferred_start_date: Optional[str] = Field(None, description="Preferred start date (ISO format)")
    deadline: Optional[str] = Field(None, description="Deadline for completion (ISO format)")


class ScheduleBrickTool(BaseTool, LoggerMixin):
    """Tool for scheduling individual Bricks."""
    
    name = "schedule_brick"
    description = "Schedule a specific Brick (main task) in the user's calendar"
    args_schema = ScheduleBrickInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.scheduler_service_url}/api/v1/schedule/brick",
                    json=kwargs,
                    timeout=30.0
                )
                
            if response.status_code == 200:
                result = response.json()
                return f"Successfully scheduled Brick. {result.get('message', '')}"
            else:
                return f"Failed to schedule Brick: {response.text}"
                
        except Exception as e:
            self.logger.error("Error scheduling Brick", exc_info=e)
            return f"Error scheduling Brick: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation (not used in async context)."""
        return "This tool requires async execution"


class OptimizeScheduleInput(BaseModel):
    """Input for schedule optimization."""
    user_id: str = Field(description="User ID")
    start_date: str = Field(description="Start date for optimization window (ISO format)")
    end_date: str = Field(description="End date for optimization window (ISO format)")
    optimization_goals: Optional[list] = Field(None, description="Specific optimization goals")


class OptimizeScheduleTool(BaseTool, LoggerMixin):
    """Tool for optimizing the entire schedule."""
    
    name = "optimize_schedule"
    description = "Optimize the user's entire schedule for a given time period"
    args_schema = OptimizeScheduleInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.scheduler_service_url}/api/v1/optimize",
                    json=kwargs,
                    timeout=60.0  # Longer timeout for optimization
                )
                
            if response.status_code == 200:
                result = response.json()
                return f"Schedule optimized successfully. {result.get('message', '')}"
            else:
                return f"Failed to optimize schedule: {response.text}"
                
        except Exception as e:
            self.logger.error("Error optimizing schedule", exc_info=e)
            return f"Error optimizing schedule: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation (not used in async context)."""
        return "This tool requires async execution"


class GetScheduleInput(BaseModel):
    """Input for getting schedule information."""
    user_id: str = Field(description="User ID")
    start_date: Optional[str] = Field(None, description="Start date (ISO format)")
    end_date: Optional[str] = Field(None, description="End date (ISO format)")
    include_details: bool = Field(True, description="Include detailed information")


class GetScheduleTool(BaseTool, LoggerMixin):
    """Tool for retrieving schedule information."""
    
    name = "get_schedule"
    description = "Get the user's current schedule for a specified time period"
    args_schema = GetScheduleInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.scheduler_service_url}/api/v1/schedule/{kwargs['user_id']}",
                    params={k: v for k, v in kwargs.items() if k != 'user_id' and v is not None},
                    timeout=30.0
                )
                
            if response.status_code == 200:
                result = response.json()
                # Format the schedule information for the AI
                schedule_summary = self._format_schedule_summary(result)
                return schedule_summary
            else:
                return f"Failed to retrieve schedule: {response.text}"
                
        except Exception as e:
            self.logger.error("Error retrieving schedule", exc_info=e)
            return f"Error retrieving schedule: {str(e)}"
    
    def _format_schedule_summary(self, schedule_data: Dict[str, Any]) -> str:
        """Format schedule data for AI consumption."""
        # TODO: Implement proper schedule formatting
        return f"Current schedule retrieved with {len(schedule_data.get('events', []))} events"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation (not used in async context)."""
        return "This tool requires async execution"
