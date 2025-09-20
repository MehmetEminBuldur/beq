"""
OpenAI LLM Client for BeQ Scheduling.

This module provides integration with OpenAI API for
intelligent scheduling decisions.
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
from dataclasses import dataclass

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger(__name__)

@dataclass
class SchedulingContext:
    """Context information for LLM scheduling."""
    user_preferences: Dict[str, Any]
    existing_events: List[Dict[str, Any]]
    tasks_to_schedule: List[Dict[str, Any]]
    constraints: List[Dict[str, Any]]
    current_time: datetime
    planning_horizon_days: int = 7

@dataclass
class SchedulingResult:
    """Result from LLM scheduling."""
    scheduled_events: List[Dict[str, Any]]
    reasoning: str
    confidence_score: float
    alternative_suggestions: List[str]
    warnings: List[str]

class OpenAIClient:
    """Client for OpenAI API for scheduling."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.max_tokens = 4096
        self.temperature = 0.7

        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            timeout=60.0
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_schedule(self, context: SchedulingContext) -> SchedulingResult:
        """Generate an optimized schedule using OpenAI."""

        prompt = self._create_scheduling_prompt(context)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=0.9,
                frequency_penalty=0.1,
                presence_penalty=0.1
            )

            content = response.choices[0].message.content
            result = self._parse_scheduling_response({"choices": [{"message": {"content": content}}]})

            logger.info(
                "LLM scheduling completed",
                model=self.model,
                tasks_count=len(context.tasks_to_schedule),
                scheduled_count=len(result.scheduled_events),
                confidence=result.confidence_score
            )

            return result

        except Exception as e:
            logger.error("Error in LLM scheduling", exc_info=e)
            return self._create_fallback_schedule(context)
    
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for scheduling."""
        return """You are an expert AI scheduling assistant for BeQ, a life management application. Your task is to create optimal schedules that balance productivity, well-being, and personal preferences.

CORE PRINCIPLES:
1. Respect user preferences and constraints
2. Optimize for work-life balance 
3. Consider energy levels throughout the day
4. Allow adequate breaks and transitions
5. Batch similar tasks when beneficial
6. Respect deadlines and priorities
7. Ensure adequate sleep and recovery time

SCHEDULING STRATEGY:
- High-priority tasks in high-energy periods (typically mornings)
- Creative tasks when user is most creative
- Routine tasks in low-energy periods  
- Include buffer time between tasks
- Group similar tasks to minimize context switching
- Consider commute time and travel
- Schedule breaks every 90-120 minutes

OUTPUT FORMAT:
Provide a JSON response with:
{
  "scheduled_events": [
    {
      "task_id": "string",
      "title": "string", 
      "start_time": "YYYY-MM-DD HH:MM:SS",
      "end_time": "YYYY-MM-DD HH:MM:SS",
      "priority": "high|medium|low",
      "task_type": "work|personal|health|learning|social",
      "location": "string",
      "notes": "string"
    }
  ],
  "reasoning": "Detailed explanation of scheduling decisions",
  "confidence_score": 0.85,
  "alternative_suggestions": ["suggestion1", "suggestion2"],
  "warnings": ["warning1", "warning2"]
}

Be thoughtful, practical, and always prioritize the user's well-being and productivity."""

    def _create_scheduling_prompt(self, context: SchedulingContext) -> str:
        """Create a detailed prompt for the LLM."""
        
        current_time_str = context.current_time.strftime("%Y-%m-%d %H:%M:%S")
        end_time = context.current_time + timedelta(days=context.planning_horizon_days)
        end_time_str = end_time.strftime("%Y-%m-%d %H:%M:%S")
        
        prompt = f"""
SCHEDULING REQUEST

Current Time: {current_time_str}
Planning Period: {context.planning_horizon_days} days (until {end_time_str})

USER PREFERENCES:
{json.dumps(context.user_preferences, indent=2, default=str)}

EXISTING EVENTS (cannot be moved):
{json.dumps(context.existing_events, indent=2, default=str)}

TASKS TO SCHEDULE:
{json.dumps(context.tasks_to_schedule, indent=2, default=str)}

CONSTRAINTS:
{json.dumps(context.constraints, indent=2, default=str)}

INSTRUCTIONS:
1. Create an optimal schedule for the tasks within the planning period
2. Respect all existing events and constraints
3. Consider user preferences for timing and work style
4. Optimize for productivity and well-being
5. Provide clear reasoning for your decisions
6. Include confidence score (0.0 to 1.0)
7. Suggest alternatives if applicable
8. Flag any potential issues or warnings

Please generate the schedule now.
"""
        return prompt
    
    def _parse_scheduling_response(self, response: Dict[str, Any]) -> SchedulingResult:
        """Parse the LLM response into a SchedulingResult."""
        
        try:
            content = response["choices"][0]["message"]["content"]
            
            # Extract JSON from response (LLM might add extra text)
            start_json = content.find("{")
            end_json = content.rfind("}") + 1
            
            if start_json == -1 or end_json == 0:
                raise ValueError("No JSON found in response")
            
            json_str = content[start_json:end_json]
            parsed = json.loads(json_str)
            
            return SchedulingResult(
                scheduled_events=parsed.get("scheduled_events", []),
                reasoning=parsed.get("reasoning", ""),
                confidence_score=float(parsed.get("confidence_score", 0.5)),
                alternative_suggestions=parsed.get("alternative_suggestions", []),
                warnings=parsed.get("warnings", [])
            )
            
        except Exception as e:
            logger.error("Error parsing LLM response", exc_info=e)
            raise ValueError(f"Failed to parse LLM response: {e}")
    
    def _create_fallback_schedule(self, context: SchedulingContext) -> SchedulingResult:
        """Create a simple fallback schedule if LLM fails."""
        
        logger.warning("Using fallback scheduling due to LLM failure")
        
        # Simple fallback: schedule tasks in order during work hours
        scheduled_events = []
        current_time = context.current_time
        
        # Find next work day start
        while current_time.weekday() >= 5:  # Skip weekends
            current_time += timedelta(days=1)
        
        work_start = current_time.replace(hour=9, minute=0, second=0, microsecond=0)
        current_slot = work_start
        
        for task in context.tasks_to_schedule[:5]:  # Limit to 5 tasks
            if current_slot.hour >= 17:  # After work hours
                # Move to next day
                current_slot = (current_slot + timedelta(days=1)).replace(hour=9, minute=0)
                if current_slot.weekday() >= 5:
                    current_slot += timedelta(days=2)  # Skip weekend
            
            duration = timedelta(minutes=task.get("estimated_duration_minutes", 60))
            end_time = current_slot + duration
            
            scheduled_events.append({
                "task_id": task.get("id", ""),
                "title": task.get("title", "Untitled Task"),
                "start_time": current_slot.strftime("%Y-%m-%d %H:%M:%S"),
                "end_time": end_time.strftime("%Y-%m-%d %H:%M:%S"),
                "priority": task.get("priority", "medium"),
                "task_type": task.get("category", "work"),
                "location": "TBD",
                "notes": "Scheduled with fallback algorithm"
            })
            
            current_slot = end_time + timedelta(minutes=15)  # 15 min buffer
        
        return SchedulingResult(
            scheduled_events=scheduled_events,
            reasoning="Fallback scheduling used due to LLM unavailability. Tasks scheduled in simple sequential order during work hours.",
            confidence_score=0.3,
            alternative_suggestions=["Retry with LLM when available"],
            warnings=["Using fallback scheduling - results may not be optimal"]
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.close()


# Global client instance
_openai_client: Optional[OpenAIClient] = None

async def get_openai_client() -> OpenAIClient:
    """Get the global OpenAI client instance."""
    global _openai_client

    if _openai_client is None:
        _openai_client = OpenAIClient()

    return _openai_client

async def cleanup_openai_client():
    """Cleanup the global OpenAI client."""
    global _openai_client

    if _openai_client is not None:
        await _openai_client.close()
        _openai_client = None
