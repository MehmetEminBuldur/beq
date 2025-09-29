"""
Brick management tools for the BeQ AI agent.

These tools allow the agent to create, update, and manage Bricks and Quantas.
"""

import uuid
import aiohttp
import json
from datetime import datetime
from typing import Optional, List
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from ..core.logging import LoggerMixin
from ..core.supabase import get_supabase
from ..core.config import get_settings


class CreateBrickInput(BaseModel):
    """Input for creating a Brick."""
    title: str = Field(description="Title of the Brick")
    description: str = Field(description="Description of the Brick")
    category: str = Field(default="personal", description="Category of the Brick (work, personal, health, learning, social, maintenance, recreation)")
    priority: str = Field(default="medium", description="Priority level (low, medium, high, urgent)")
    estimated_duration_minutes: int = Field(default=60, description="Estimated duration in minutes")
    target_date: Optional[str] = Field(None, description="Target completion date (ISO format)")
    deadline: Optional[str] = Field(None, description="Deadline date (ISO format)")


class CreateBrickTool(BaseTool, LoggerMixin):
    """Tool for creating new Bricks."""
    
    name = "create_brick"
    description = "Create a new Brick (main task) for the user. User authentication is handled automatically - do not ask for user ID."
    
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
        """Async implementation using the new API endpoint."""
        try:
            # Handle both calling conventions: dict input or keyword args
            if tool_input is not None and isinstance(tool_input, dict):
                title = tool_input.get('title', title)
                description = tool_input.get('description', description)
                user_id = tool_input.get('user_id', user_id)
                category = tool_input.get('category', category).lower() if tool_input.get('category') else category
                priority = tool_input.get('priority', priority).lower() if tool_input.get('priority') else priority
                estimated_duration_minutes = tool_input.get('estimated_duration_minutes', estimated_duration_minutes)
                target_date = tool_input.get('target_date', target_date)
                deadline = tool_input.get('deadline', deadline)
            
            # Normalize case for database constraints
            if category:
                category = category.lower()
            if priority:
                priority = priority.lower()
            
            # Use the web API endpoint (Docker-aware)
            settings = get_settings()
            api_url = f"{settings.web_api_url}/api/v1/bricks"
            
            payload = {
                "user_id": user_id,
                "brick": {
                    "title": title,
                    "description": description,
                    "category": category,
                    "priority": priority,
                    "estimated_duration_minutes": estimated_duration_minutes
                }
            }
            
            # Add optional dates if provided
            if target_date:
                payload["brick"]["target_date"] = target_date
            if deadline:
                payload["brick"]["deadline"] = deadline
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    api_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            brick_id = result["brick"]["id"]
                            self.logger.info(
                                "Brick created successfully via API",
                                brick_id=brick_id,
                                user_id=user_id,
                                title=title
                            )
                            return f"Successfully created Brick '{title}' with ID {brick_id}. You can now add Quantas (sub-tasks) to break it down further!"
                        else:
                            error_msg = result.get("error", "Unknown API error")
                            self.logger.error("API returned error", error=error_msg)
                            return f"Failed to create Brick '{title}': {error_msg}"
                    else:
                        error_text = await response.text()
                        self.logger.error("API request failed", status=response.status, error=error_text)
                        return f"Failed to create Brick '{title}': API error {response.status}"
                
        except Exception as e:
            self.logger.error("Error creating brick via API", exc_info=e)
            return f"Error creating Brick '{title}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class CreateQuantaInput(BaseModel):
    """Input for creating a Quanta."""
    title: str = Field(description="Title of the Quanta")
    description: str = Field(description="Description of the Quanta")
    brick_id: str = Field(description="ID of the parent Brick")
    estimated_duration_minutes: int = Field(default=30, description="Estimated duration in minutes")
    order_index: int = Field(default=0, description="Order within the Brick")


class CreateQuantaTool(BaseTool, LoggerMixin):
    """Tool for creating new Quantas."""
    
    name = "create_quanta"
    description = "Create a new Quanta (sub-task) under a Brick. User authentication is handled automatically - do not ask for user ID."
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return CreateQuantaInput
    
    async def _arun(self, 
                   tool_input=None, 
                   title=None, 
                   description=None, 
                   brick_id=None, 
                   user_id=None,
                   estimated_duration_minutes=30, 
                   order_index=0,
                   **kwargs) -> str:
        """Async implementation using the new API endpoint."""
        try:
            # Handle both calling conventions: dict input or keyword args
            if tool_input is not None and isinstance(tool_input, dict):
                title = tool_input.get('title', title)
                description = tool_input.get('description', description)
                brick_id = tool_input.get('brick_id', brick_id)
                user_id = tool_input.get('user_id', user_id)
                estimated_duration_minutes = tool_input.get('estimated_duration_minutes', estimated_duration_minutes)
                order_index = tool_input.get('order_index', order_index)
            
            # Basic validation
            if not title:
                return "Error: Missing required field 'title' for quanta creation"
            if not brick_id:
                return "Error: Missing required field 'brick_id' for quanta creation"
            if not user_id:
                return "Error: Missing user_id (should be auto-injected)"
            
            # Use the web API endpoint (Docker-aware)
            settings = get_settings()
            api_url = f"{settings.web_api_url}/api/v1/quantas"
            
            self.logger.info("Creating quanta via API", 
                           api_url=api_url, title=title, brick_id=brick_id, user_id=user_id)
            
            payload = {
                "user_id": user_id,
                "brick_id": brick_id,
                "title": title,
                "description": description or '',
                "estimated_duration_minutes": estimated_duration_minutes,
                "priority": "medium"  # Default priority
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    api_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            quanta_id = result["quanta"]["id"]
                            self.logger.info(
                                "Quanta created successfully via API",
                                quanta_id=quanta_id,
                                brick_id=brick_id,
                                title=title
                            )
                            return f"Successfully created Quanta '{title}' with ID {quanta_id}"
                        else:
                            error_msg = result.get("error", "Unknown API error")
                            self.logger.error("API returned error", error=error_msg)
                            return f"Failed to create Quanta '{title}': {error_msg}"
                    else:
                        error_text = await response.text()
                        self.logger.error("API request failed", status=response.status, error=error_text)
                        return f"Failed to create Quanta '{title}': API error {response.status}"
                
        except Exception as e:
            self.logger.error("Error creating quanta via API", exc_info=e)
            return f"Error creating Quanta '{title}': {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class UpdateBrickInput(BaseModel):
    """Input for updating a Brick."""
    brick_id: str = Field(description="ID of the Brick to update")
    title: Optional[str] = Field(None, description="New title")
    description: Optional[str] = Field(None, description="New description")
    status: Optional[str] = Field(None, description="New status")
    priority: Optional[str] = Field(None, description="New priority")


class UpdateBrickTool(BaseTool, LoggerMixin):
    """Tool for updating existing Bricks."""
    
    name = "update_brick"
    description = "Update an existing Brick. User authentication is handled automatically - do not ask for user ID."
    
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
    status: Optional[str] = Field(None, description="Filter by status")
    category: Optional[str] = Field(None, description="Filter by category")


class GetBricksTool(BaseTool, LoggerMixin):
    """Tool for retrieving user's Bricks."""
    
    name = "get_bricks"
    description = "Get user's Bricks, optionally filtered by status or category. User authentication is handled automatically - do not ask for user ID."
    
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


class UpdateQuantaInput(BaseModel):
    """Input for updating a Quanta."""
    quanta_id: str = Field(description="ID of the Quanta to update")
    title: Optional[str] = Field(None, description="New title")
    description: Optional[str] = Field(None, description="New description")
    status: Optional[str] = Field(None, description="New status (not_started, in_progress, completed, postponed)")
    estimated_duration_minutes: Optional[int] = Field(None, description="New estimated duration in minutes")
    order_index: Optional[int] = Field(None, description="New order within the Brick")
    target_date: Optional[str] = Field(None, description="New target completion date (ISO format)")
    deadline: Optional[str] = Field(None, description="New deadline date (ISO format)")


class UpdateQuantaTool(BaseTool, LoggerMixin):
    """Tool for updating existing Quantas."""
    
    name = "update_quanta"
    description = "Update an existing Quanta (sub-task). User authentication is handled automatically - do not ask for user ID."
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return UpdateQuantaInput
    
    async def _arun(self, tool_input: dict) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            quanta_id = tool_input.get('quanta_id')
            
            # Prepare update data
            update_data = {}
            for field in ['title', 'description', 'status', 'estimated_duration_minutes', 'order_index', 'target_date', 'deadline']:
                if tool_input.get(field) is not None:
                    update_data[field] = tool_input.get(field)
            
            if not update_data:
                return "No update fields provided"
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            # Update in Supabase
            response = supabase.table('quantas').update(update_data).eq('id', quanta_id).execute()
            
            if response.data:
                self.logger.info(
                    "Quanta updated successfully",
                    quanta_id=quanta_id,
                    updated_fields=list(update_data.keys())
                )
                return f"Successfully updated Quanta '{tool_input.get('title', quanta_id)}'"
            else:
                self.logger.error("Failed to update quanta - no data returned")
                return f"Failed to update Quanta {quanta_id}"
                
        except Exception as e:
            self.logger.error("Error updating quanta", exc_info=e)
            return f"Error updating Quanta: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class GetQuantasInput(BaseModel):
    """Input for getting Quantas."""
    brick_id: Optional[str] = Field(None, description="Brick ID to filter quantas by")
    status: Optional[str] = Field(None, description="Filter by status")


class GetQuantasTool(BaseTool, LoggerMixin):
    """Tool for retrieving Quantas."""
    
    name = "get_quantas"
    description = "Get Quantas, optionally filtered by brick or status. User authentication is handled automatically - do not ask for user ID."
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return GetQuantasInput
    
    async def _arun(self, tool_input: dict) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            # Build query
            query = supabase.table('quantas').select('*')
            
            if tool_input.get('brick_id'):
                query = query.eq('brick_id', tool_input.get('brick_id'))
            if tool_input.get('user_id'):
                # Join with bricks table to filter by user_id
                query = supabase.table('quantas').select('*, bricks!inner(user_id)').eq('bricks.user_id', tool_input.get('user_id'))
            if tool_input.get('status'):
                query = query.eq('status', tool_input.get('status'))
            
            response = query.execute()
            
            if response.data:
                quantas = response.data
                self.logger.info(
                    "Retrieved quantas",
                    count=len(quantas),
                    brick_id=tool_input.get('brick_id'),
                    user_id=tool_input.get('user_id')
                )
                
                result = f"Found {len(quantas)} quanta(s):\n"
                for quanta in quantas:
                    result += f"- {quanta['title']} (ID: {quanta['id']}, Status: {quanta['status']}, Duration: {quanta['estimated_duration_minutes']}min)\n"
                
                return result
            else:
                return "No quantas found"
                
        except Exception as e:
            self.logger.error("Error retrieving quantas", exc_info=e)
            return f"Error retrieving quantas: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class DeleteBrickInput(BaseModel):
    """Input for deleting a Brick."""
    brick_id: str = Field(description="ID of the Brick to delete")
    delete_quantas: bool = Field(default=True, description="Whether to also delete associated quantas")


class DeleteBrickTool(BaseTool, LoggerMixin):
    """Tool for deleting Bricks."""
    
    name = "delete_brick"
    description = "Delete a Brick and optionally its associated Quantas. User authentication is handled automatically - do not ask for user ID."
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return DeleteBrickInput
    
    async def _arun(self, tool_input: dict) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            brick_id = tool_input.get('brick_id')
            user_id = tool_input.get('user_id')
            delete_quantas = tool_input.get('delete_quantas', True)
            
            # First, delete associated quantas if requested
            if delete_quantas:
                quantas_response = supabase.table('quantas').delete().eq('brick_id', brick_id).execute()
                self.logger.info(f"Deleted {len(quantas_response.data) if quantas_response.data else 0} quantas for brick {brick_id}")
            
            # Delete the brick
            response = supabase.table('bricks').delete().eq('id', brick_id).eq('user_id', user_id).execute()
            
            if response.data:
                self.logger.info(
                    "Brick deleted successfully",
                    brick_id=brick_id,
                    user_id=user_id,
                    deleted_quantas=delete_quantas
                )
                return f"Successfully deleted Brick {brick_id}" + (" and its quantas" if delete_quantas else "")
            else:
                self.logger.error("Failed to delete brick - no data returned")
                return f"Failed to delete Brick {brick_id} (not found or access denied)"
                
        except Exception as e:
            self.logger.error("Error deleting brick", exc_info=e)
            return f"Error deleting Brick: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"


class DeleteQuantaInput(BaseModel):
    """Input for deleting a Quanta."""
    quanta_id: str = Field(description="ID of the Quanta to delete")


class DeleteQuantaTool(BaseTool, LoggerMixin):
    """Tool for deleting Quantas."""
    
    name = "delete_quanta"
    description = "Delete a Quanta (sub-task). User authentication is handled automatically - do not ask for user ID."
    
    def get_input_schema(self, config=None):
        """Return the input schema for this tool."""
        return DeleteQuantaInput
    
    async def _arun(self, tool_input: dict) -> str:
        """Async implementation of the tool."""
        try:
            supabase = get_supabase()
            
            quanta_id = tool_input.get('quanta_id')
            
            # Delete the quanta
            response = supabase.table('quantas').delete().eq('id', quanta_id).execute()
            
            if response.data:
                self.logger.info(
                    "Quanta deleted successfully",
                    quanta_id=quanta_id
                )
                return f"Successfully deleted Quanta {quanta_id}"
            else:
                self.logger.error("Failed to delete quanta - no data returned")
                return f"Failed to delete Quanta {quanta_id} (not found)"
                
        except Exception as e:
            self.logger.error("Error deleting quanta", exc_info=e)
            return f"Error deleting Quanta: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Sync implementation."""
        return "This tool requires async execution"