"""
Chat API endpoints for conversational AI interactions.

This module provides endpoints for users to interact with the BeQ AI
for scheduling, task management, and life optimization.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram
import structlog

from ...agent.orchestrator_agent import OrchestratorAgent, get_orchestrator_agent
from ...core.logging import LoggerMixin

router = APIRouter()
logger = structlog.get_logger(__name__)

# Metrics
CHAT_REQUEST_COUNT = Counter(
    'beq_chat_requests_total',
    'Total chat requests processed',
    ['status']
)
CHAT_REQUEST_DURATION = Histogram(
    'beq_chat_request_duration_seconds',
    'Duration of chat request processing'
)

class ChatMessageRequest(BaseModel):
    """Request model for chat messages."""
    
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    user_id: UUID = Field(..., description="User ID")
    conversation_id: Optional[UUID] = Field(None, description="Conversation ID")
    context: Optional[dict] = Field(None, description="Additional context")


class ChatMessageResponse(BaseModel):
    """Response model for chat messages."""
    
    message_id: UUID = Field(..., description="Message ID")
    conversation_id: UUID = Field(..., description="Conversation ID")
    response: str = Field(..., description="AI response")
    
    # AI metadata
    model_used: str = Field(..., description="AI model used")
    confidence_score: Optional[float] = Field(None, description="AI confidence score")
    processing_time_ms: int = Field(..., description="Processing time")
    
    # Actions taken
    actions_taken: List[str] = Field(default_factory=list, description="Actions performed")
    suggestions: List[str] = Field(default_factory=list, description="AI suggestions")
    
    # Schedule updates
    schedule_updated: bool = Field(False, description="Whether schedule was updated")
    bricks_created: List[UUID] = Field(default_factory=list, description="Newly created Brick IDs")
    bricks_updated: List[UUID] = Field(default_factory=list, description="Updated Brick IDs")
    
    # Resources recommended
    resources_recommended: List[UUID] = Field(default_factory=list, description="Recommended resource IDs")
    
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""
    
    conversation_id: UUID = Field(..., description="Conversation ID")
    user_id: UUID = Field(..., description="User ID")
    messages: List[dict] = Field(..., description="Conversation messages")
    created_at: datetime = Field(..., description="Conversation creation time")
    updated_at: datetime = Field(..., description="Last update time")
    total_messages: int = Field(..., description="Total number of messages")


class ChatService(LoggerMixin):
    """Service for handling chat interactions."""
    
    def __init__(self, agent: OrchestratorAgent):
        self.agent = agent
    
    async def process_message(
        self, 
        message: str, 
        user_id: UUID, 
        conversation_id: Optional[UUID] = None
    ) -> ChatMessageResponse:
        """Process a user message and generate AI response."""
        
        start_time = datetime.utcnow()
        message_id = uuid4()
        
        if not conversation_id:
            conversation_id = uuid4()
        
        self.logger.info(
            "Processing chat message",
            user_id=str(user_id),
            conversation_id=str(conversation_id),
            message_id=str(message_id),
            message_length=len(message)
        )
        
        try:
            # Process message through AI agent
            agent_response = await self.agent.process_user_message(
                message=message,
                user_id=user_id,
                conversation_id=conversation_id
            )
            
            # Calculate processing time
            processing_time_ms = int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            )
            
            # Create response
            response = ChatMessageResponse(
                message_id=message_id,
                conversation_id=conversation_id,
                response=agent_response.response_text,
                model_used=agent_response.model_used,
                confidence_score=agent_response.confidence_score,
                processing_time_ms=processing_time_ms,
                actions_taken=agent_response.actions_taken,
                suggestions=agent_response.suggestions,
                schedule_updated=agent_response.schedule_updated,
                bricks_created=agent_response.bricks_created,
                bricks_updated=agent_response.bricks_updated,
                resources_recommended=agent_response.resources_recommended
            )
            
            # Metrics
            CHAT_REQUEST_COUNT.labels(status="success").inc()
            CHAT_REQUEST_DURATION.observe(processing_time_ms / 1000.0)

            self.logger.info(
                "Chat message processed successfully",
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                message_id=str(message_id),
                processing_time_ms=processing_time_ms,
                actions_count=len(agent_response.actions_taken)
            )
            
            return response
            
        except Exception as e:
            processing_time_ms = int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            )
            # Metrics
            CHAT_REQUEST_COUNT.labels(status="error").inc()
            CHAT_REQUEST_DURATION.observe(processing_time_ms / 1000.0)

            self.logger.error(
                "Error processing chat message",
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                message_id=str(message_id),
                processing_time_ms=processing_time_ms,
                error=str(e)
            )
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Failed to process message",
                    "message": "An error occurred while processing your message. Please try again.",
                    "processing_time_ms": processing_time_ms
                }
            )


# Dependency to get chat service
async def get_chat_service() -> ChatService:
    """Get chat service instance."""
    agent = await get_orchestrator_agent()
    return ChatService(agent)


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    """Send a message to the AI assistant."""
    
    return await chat_service.process_message(
        message=request.message,
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        context=request.context or {}
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: UUID,
    user_id: UUID,
    limit: int = 50,
    offset: int = 0
):
    """Get conversation history for a specific conversation."""
    
    # TODO: Implement conversation history retrieval from database
    # For now, return placeholder
    return ConversationHistoryResponse(
        conversation_id=conversation_id,
        user_id=user_id,
        messages=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        total_messages=0
    )


@router.get("/conversations", response_model=List[ConversationHistoryResponse])
async def get_user_conversations(
    user_id: UUID,
    limit: int = 10,
    offset: int = 0
):
    """Get all conversations for a user."""
    
    # TODO: Implement user conversations retrieval from database
    # For now, return empty list
    return []


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    user_id: UUID
):
    """Delete a conversation and all its messages."""
    
    # TODO: Implement conversation deletion
    return {"message": "Conversation deleted successfully"}


@router.post("/conversations/{conversation_id}/clear")
async def clear_conversation(
    conversation_id: UUID,
    user_id: UUID
):
    """Clear all messages from a conversation."""
    
    # TODO: Implement conversation clearing
    return {"message": "Conversation cleared successfully"}
