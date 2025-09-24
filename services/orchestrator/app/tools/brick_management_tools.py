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
    args_schema = CreateBrickInput
    
    async def _arun(self, title: str, description: str, user_id: str, 
                   category: str = "personal", priority: str = "medium", 
                   estimated_duration_minutes: int = 60, target_date: str = None, 
                   deadline: str = None) -> str:
        """Async implementation of the tool."""
        try:
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
    args_schema = CreateQuantaInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            # Generate UUID for the new quanta
            quanta_id = str(uuid.uuid4())
            
            # Prepare quanta data
            quanta_data = {
                'id': quanta_id,
                'brick_id': kwargs.get('brick_id'),
                'user_id': kwargs.get('user_id'),
                'title': kwargs.get('title'),
                'description': kwargs.get('description'),
                'priority': kwargs.get('priority', 'medium'),
                'status': 'pending',
                'estimated_duration_minutes': kwargs.get('estimated_duration_minutes', 30),
                'completion_percentage': 0.0,
                'order_index': kwargs.get('order_index', 0),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Insert into Supabase
            response = supabase.table('quantas').insert(quanta_data).execute()
            
            if response.data:
                self.logger.info(
                    "Quanta created successfully",
                    quanta_id=quanta_id,
                    brick_id=kwargs.get('brick_id'),
                    user_id=kwargs.get('user_id'),
                    title=kwargs.get('title')
                )
                return f"Successfully created Quanta '{kwargs.get('title')}' with ID {quanta_id}"
            else:
                self.logger.error("Failed to create quanta - no data returned")
                return f"Failed to create Quanta '{kwargs.get('title')}'"
                
        except Exception as e:
            self.logger.error("Error creating quanta", exc_info=e)
            return f"Error creating Quanta '{kwargs.get('title')}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class UpdateBrickInput(BaseModel):
    """Input for updating a Brick."""
    brick_id: str = Field(description="ID of the Brick to update")
    updates: dict = Field(description="Updates to apply")


class UpdateBrickTool(BaseTool, LoggerMixin):
    """Tool for updating existing Bricks."""
    
    name = "update_brick"
    description = "Update an existing Brick with new information"
    args_schema = UpdateBrickInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        # TODO: Implement Brick update
        return f"Updated Brick {kwargs.get('brick_id')}"
    
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
    args_schema = CreateQuantaInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            # Generate UUID for the new quanta
            quanta_id = str(uuid.uuid4())
            
            # Prepare quanta data
            quanta_data = {
                'id': quanta_id,
                'brick_id': kwargs.get('brick_id'),
                'user_id': kwargs.get('user_id'),
                'title': kwargs.get('title'),
                'description': kwargs.get('description'),
                'priority': kwargs.get('priority', 'medium'),
                'status': 'pending',
                'estimated_duration_minutes': kwargs.get('estimated_duration_minutes', 30),
                'completion_percentage': 0.0,
                'order_index': kwargs.get('order_index', 0),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Insert into Supabase
            response = supabase.table('quantas').insert(quanta_data).execute()
            
            if response.data:
                self.logger.info(
                    "Quanta created successfully",
                    quanta_id=quanta_id,
                    brick_id=kwargs.get('brick_id'),
                    user_id=kwargs.get('user_id'),
                    title=kwargs.get('title')
                )
                return f"Successfully created Quanta '{kwargs.get('title')}' with ID {quanta_id}"
            else:
                self.logger.error("Failed to create quanta - no data returned")
                return f"Failed to create Quanta '{kwargs.get('title')}'"
                
        except Exception as e:
            self.logger.error("Error creating quanta", exc_info=e)
            return f"Error creating Quanta '{kwargs.get('title')}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class GetBricksInput(BaseModel):
    """Input for getting Bricks."""
    user_id: str = Field(description="User ID")
    status: str = Field(None, description="Filter by status")


class GetBricksTool(BaseTool, LoggerMixin):
    """Tool for retrieving user's Bricks."""
    
    name = "get_bricks"
    description = "Get the user's Bricks with optional filtering"
    args_schema = GetBricksInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        # TODO: Implement Brick retrieval
        return f"Retrieved Bricks for user {kwargs.get('user_id')}"
    
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
    args_schema = CreateQuantaInput
    
    async def _arun(self, **kwargs) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            # Generate UUID for the new quanta
            quanta_id = str(uuid.uuid4())
            
            # Prepare quanta data
            quanta_data = {
                'id': quanta_id,
                'brick_id': kwargs.get('brick_id'),
                'user_id': kwargs.get('user_id'),
                'title': kwargs.get('title'),
                'description': kwargs.get('description'),
                'priority': kwargs.get('priority', 'medium'),
                'status': 'pending',
                'estimated_duration_minutes': kwargs.get('estimated_duration_minutes', 30),
                'completion_percentage': 0.0,
                'order_index': kwargs.get('order_index', 0),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Insert into Supabase
            response = supabase.table('quantas').insert(quanta_data).execute()
            
            if response.data:
                self.logger.info(
                    "Quanta created successfully",
                    quanta_id=quanta_id,
                    brick_id=kwargs.get('brick_id'),
                    user_id=kwargs.get('user_id'),
                    title=kwargs.get('title')
                )
                return f"Successfully created Quanta '{kwargs.get('title')}' with ID {quanta_id}"
            else:
                self.logger.error("Failed to create quanta - no data returned")
                return f"Failed to create Quanta '{kwargs.get('title')}'"
                
        except Exception as e:
            self.logger.error("Error creating quanta", exc_info=e)
            return f"Error creating Quanta '{kwargs.get('title')}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"
