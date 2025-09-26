"""
Brick management tools for the BeQ AI agent.

These tools allow the agent to create, update, and manage Bricks and Quantas.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from ..core.logging import LoggerMixin
from ..core.supabase import get_supabase


class CreateBrickInput(BaseModel):
    """Input for creating a Brick."""
    title: str = Field(description="Title of the Brick")
    description: str = Field(description="Description of the Brick")
    user_id: str = Field(description="User ID")
    category: str = Field(default="personal", description="Category of the Brick (work, personal, health, learning, social, maintenance, recreation)")
    priority: str = Field(default="medium", description="Priority level (low, medium, high, urgent)")
    estimated_duration_minutes: int = Field(default=60, description="Estimated duration in minutes")
    target_date: Optional[str] = Field(None, description="Target completion date (ISO format)")
    deadline: Optional[str] = Field(None, description="Deadline date (ISO format)")


class CreateBrickTool(BaseTool, LoggerMixin):
    """Tool for creating new Bricks."""
    
    name = "create_brick"
    description = "Create a new Brick (main task) for the user"
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return CreateBrickInput
    
    async def _arun(self, 
                   tool_input=None, 
                   title=None, 
                   description=None, 
                   user_id=None, 
                   category="personal", 
                   priority="medium", 
                   estimated_duration_minutes=60, 
                   target_date=None, 
                   deadline=None, 
                   **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            # Handle both calling conventions: dict input or keyword args
            if tool_input is not None and isinstance(tool_input, dict):
                # Extract from dictionary
                title = tool_input.get('title', title)
                description = tool_input.get('description', description)
                user_id = tool_input.get('user_id', user_id)
                category = tool_input.get('category', category).lower() if tool_input.get('category') else category
                priority = tool_input.get('priority', priority).lower() if tool_input.get('priority') else priority
                estimated_duration_minutes = tool_input.get('estimated_duration_minutes', estimated_duration_minutes)
                target_date = tool_input.get('target_date', target_date)
                deadline = tool_input.get('deadline', deadline)
            # Otherwise use the keyword arguments passed directly
            
            # Normalize case for database constraints
            if category:
                category = category.lower()
            if priority:
                priority = priority.lower()
            
            supabase = get_supabase()
            
            # Generate UUID for the new brick
            brick_id = str(uuid.uuid4())
            
            # Prepare brick data
            brick_data = {
                'id': brick_id,
                'user_id': user_id,
                'title': title,
                'description': description,
                'category': category,
                'priority': priority,
                'status': 'not_started',
                'estimated_duration_minutes': estimated_duration_minutes
            }
            
            # Add optional dates if provided
            if target_date:
                brick_data['target_date'] = target_date
            if deadline:
                brick_data['deadline'] = deadline
            
            # Insert into Supabase
            response = supabase.table('bricks').insert(brick_data).execute()
            
            if response.data:
                self.logger.info(
                    "Brick created successfully",
                    brick_id=brick_id,
                    user_id=user_id,
                    title=title
                )
                return f"Successfully created Brick '{title}' with ID {brick_id}"
            else:
                self.logger.error("Failed to create brick - no data returned")
                return f"Failed to create Brick '{title}'"
                
        except Exception as e:
            self.logger.error("Error creating brick", exc_info=e)
            return f"Error creating Brick '{title}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class CreateQuantaInput(BaseModel):
    """Input for creating a Quanta."""
    title: str = Field(description="Title of the Quanta")
    description: str = Field(description="Description of the Quanta")
    brick_id: str = Field(description="ID of the parent Brick")
    user_id: str = Field(description="User ID")
    priority: str = Field(default="medium", description="Priority level (low, medium, high, urgent)")
    estimated_duration_minutes: int = Field(default=30, description="Estimated duration in minutes")
    order_index: int = Field(default=0, description="Order within the Brick")


class CreateQuantaTool(BaseTool, LoggerMixin):
    """Tool for creating new Quantas."""
    
    name = "create_quanta"
    description = "Create a new Quanta (sub-task) under a Brick"
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return CreateQuantaInput
    
    async def _arun(self, 
                   tool_input=None, 
                   title=None, 
                   description=None, 
                   brick_id=None, 
                   user_id=None, 
                   priority="medium", 
                   estimated_duration_minutes=30, 
                   order_index=0,
                   **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            # Handle both calling conventions: dict input or keyword args
            if tool_input is not None and isinstance(tool_input, dict):
                # Extract from dictionary
                title = tool_input.get('title', title)
                description = tool_input.get('description', description)
                brick_id = tool_input.get('brick_id', brick_id)
                user_id = tool_input.get('user_id', user_id)
                priority = tool_input.get('priority', priority).lower() if tool_input.get('priority') else priority
                estimated_duration_minutes = tool_input.get('estimated_duration_minutes', estimated_duration_minutes)
                order_index = tool_input.get('order_index', order_index)
            # Otherwise use the keyword arguments passed directly
            
            # Normalize case for database constraints
            if priority:
                priority = priority.lower()
            
            supabase = get_supabase()
            
            # Generate UUID for the new quanta
            quanta_id = str(uuid.uuid4())
            
            # Prepare quanta data
            quanta_data = {
                'id': quanta_id,
                'brick_id': brick_id,
                'user_id': user_id,
                'title': title,
                'description': description,
                'priority': priority,
                'status': 'pending',
                'estimated_duration_minutes': estimated_duration_minutes,
                'completion_percentage': 0.0,
                'order_index': order_index,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Insert into Supabase
            response = supabase.table('quantas').insert(quanta_data).execute()
            
            if response.data:
                self.logger.info(
                    "Quanta created successfully",
                    quanta_id=quanta_id,
                    brick_id=brick_id,
                    user_id=user_id,
                    title=title
                )
                return f"Successfully created Quanta '{title}' with ID {quanta_id}"
            else:
                self.logger.error("Failed to create quanta - no data returned")
                return f"Failed to create Quanta '{title}'"
                
        except Exception as e:
            self.logger.error("Error creating quanta", exc_info=e)
            return f"Error creating Quanta '{title}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class UpdateBrickInput(BaseModel):
    """Input for updating a Brick."""
    brick_id: str = Field(description="ID of the Brick to update")
    user_id: str = Field(description="User ID")
    title: Optional[str] = Field(None, description="New title")
    description: Optional[str] = Field(None, description="New description")
    status: Optional[str] = Field(None, description="New status")
    priority: Optional[str] = Field(None, description="New priority")


class UpdateBrickTool(BaseTool, LoggerMixin):
    """Tool for updating existing Bricks."""
    
    name = "update_brick"
    description = "Update an existing Brick"
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return UpdateBrickInput
    
    async def _arun(self, tool_input: dict) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            brick_id = tool_input.get('brick_id')
            user_id = tool_input.get('user_id')
            
            # Prepare update data
            update_data = {}
            for field in ['title', 'description', 'status', 'priority']:
                if tool_input.get(field):
                    update_data[field] = tool_input.get(field)
            
            if not update_data:
                return "No update fields provided"
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            # Update in Supabase
            response = supabase.table('bricks').update(update_data).eq('id', brick_id).eq('user_id', user_id).execute()
            
            if response.data:
                self.logger.info(
                    "Brick updated successfully",
                    brick_id=brick_id,
                    user_id=user_id,
                    updated_fields=list(update_data.keys())
                )
                return f"Successfully updated Brick {brick_id}"
            else:
                self.logger.error("Failed to update brick - no data returned")
                return f"Failed to update Brick {brick_id}"
                
        except Exception as e:
            self.logger.error("Error updating brick", exc_info=e)
            return f"Error updating Brick: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class GetBricksInput(BaseModel):
    """Input for getting user's Bricks."""
    user_id: str = Field(description="User ID")
    status: Optional[str] = Field(None, description="Filter by status")
    category: Optional[str] = Field(None, description="Filter by category")


class GetBricksTool(BaseTool, LoggerMixin):
    """Tool for retrieving user's Bricks."""
    
    name = "get_bricks"
    description = "Get user's Bricks, optionally filtered by status or category"
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return GetBricksInput
    
    async def _arun(self, tool_input: dict) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            user_id = tool_input.get('user_id')
            
            # Build query
            query = supabase.table('bricks').select('*').eq('user_id', user_id)
            
            if tool_input.get('status'):
                query = query.eq('status', tool_input.get('status'))
            if tool_input.get('category'):
                query = query.eq('category', tool_input.get('category'))
            
            response = query.execute()
            
            if response.data:
                bricks = response.data
                self.logger.info(
                    "Retrieved user bricks",
                    user_id=user_id,
                    count=len(bricks)
                )
                
                if not bricks:
                    return "No bricks found matching criteria"
                
                # Format the response
                result = f"Found {len(bricks)} brick(s):\n"
                for brick in bricks:
                    result += f"- {brick['title']} (ID: {brick['id']}, Status: {brick['status']}, Priority: {brick['priority']})\n"
                
                return result
            else:
                return "No bricks found"
                
        except Exception as e:
            self.logger.error("Error retrieving bricks", exc_info=e)
            return f"Error retrieving bricks: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"