"""
Main Orchestrator Agent for BeQ.

This module contains the core AI agent that orchestrates all user interactions,
manages conversations, and coordinates with other services to provide
intelligent life management assistance.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID
import json

from langchain.schema import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain.chat_models import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import BaseTool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel, Field
import structlog

from ..core.config import get_settings
from ..core.logging import LoggerMixin
from ..tools.scheduling_tools import (
    ScheduleBrickTool, 
    OptimizeScheduleTool,
    GetScheduleTool
)
from ..tools.brick_management_tools import (
    CreateBrickTool,
    UpdateBrickTool,
    GetBricksTool
)
from ..tools.resource_tools import (
    GetResourceRecommendationsTool,
    SearchResourcesTool
)
from ..tools.calendar_tools import (
    GetCalendarEventsTool,
    SyncCalendarTool
)

settings = get_settings()
logger = structlog.get_logger(__name__)


class AgentResponse(BaseModel):
    """Response from the orchestrator agent."""
    
    response_text: str = Field(..., description="AI response text")
    model_used: str = Field(..., description="AI model used")
    confidence_score: Optional[float] = Field(None, description="AI confidence score")
    
    # Actions taken
    actions_taken: List[str] = Field(default_factory=list, description="Actions performed")
    suggestions: List[str] = Field(default_factory=list, description="AI suggestions")
    
    # Schedule updates
    schedule_updated: bool = Field(False, description="Whether schedule was updated")
    bricks_created: List[UUID] = Field(default_factory=list, description="Newly created Brick IDs")
    bricks_updated: List[UUID] = Field(default_factory=list, description="Updated Brick IDs")
    
    # Resources recommended
    resources_recommended: List[UUID] = Field(default_factory=list, description="Recommended resource IDs")
    
    # Context and metadata
    context_updates: Dict[str, Any] = Field(default_factory=dict, description="Context updates")
    follow_up_questions: List[str] = Field(default_factory=list, description="Follow-up questions")


class ConversationContext(BaseModel):
    """Context for a conversation."""
    
    user_id: UUID
    conversation_id: UUID
    user_preferences: Optional[Dict[str, Any]] = None
    current_schedule: Optional[Dict[str, Any]] = None
    active_bricks: List[Dict[str, Any]] = Field(default_factory=list)
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    last_action: Optional[str] = None


class OrchestratorAgent(LoggerMixin):
    """Main orchestrator agent for BeQ conversations."""
    
    def __init__(self):
        self.llm = self._initialize_llm()
        self.tools = self._initialize_tools()
        self.memory = self._initialize_memory()
        self.agent_executor = self._create_agent_executor()
        self.conversations: Dict[UUID, ConversationContext] = {}
    
    def _initialize_llm(self):
        """Initialize the language model."""
        if settings.default_llm_provider == "openai":
            return ChatOpenAI(
                api_key=settings.openai_api_key,
                model=settings.default_model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens
            )
        else:
            # TODO: Add support for other LLM providers (Anthropic, etc.)
            raise ValueError(f"Unsupported LLM provider: {settings.default_llm_provider}")
    
    def _initialize_tools(self) -> List[BaseTool]:
        """Initialize all available tools for the agent."""
        tools = []
        
        # Scheduling tools
        tools.extend([
            ScheduleBrickTool(),
            OptimizeScheduleTool(),
            GetScheduleTool()
        ])
        
        # Brick management tools
        tools.extend([
            CreateBrickTool(),
            UpdateBrickTool(),
            GetBricksTool()
        ])
        
        # Resource recommendation tools
        tools.extend([
            GetResourceRecommendationsTool(),
            SearchResourcesTool()
        ])
        
        # Calendar integration tools
        tools.extend([
            GetCalendarEventsTool(),
            SyncCalendarTool()
        ])
        
        return tools
    
    def _initialize_memory(self):
        """Initialize conversation memory."""
        return ConversationBufferWindowMemory(
            k=settings.memory_max_messages,
            memory_key="chat_history",
            return_messages=True
        )
    
    def _create_agent_executor(self):
        """Create the agent executor with tools and prompts."""
        
        # Create the system prompt
        system_prompt = self._create_system_prompt()
        
        # Create the prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        # Create the agent
        agent = create_openai_functions_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        # Create the executor
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=settings.debug,
            max_iterations=settings.agent_max_iterations,
            max_execution_time=settings.agent_timeout_seconds
        )
    
    def _create_system_prompt(self) -> str:
        """Create the system prompt for the BeQ agent."""
        return """
You are BeQ, an AI-powered life management assistant that helps users organize their lives through the Bricks and Quantas system.

CORE CONCEPTS:
- Bricks: Main tasks or projects (e.g., "Learn Spanish", "Complete project presentation")
- Quantas: Sub-tasks within Bricks (e.g., "Study vocabulary", "Create slides")
- Your goal is to help users schedule, organize, and optimize their life activities

PERSONALITY & APPROACH:
- Be conversational, supportive, and proactive
- Ask clarifying questions to understand user needs
- Provide personalized recommendations based on user preferences
- Focus on holistic well-being, not just productivity
- Be encouraging and help users build sustainable habits

KEY CAPABILITIES:
1. Schedule Management: Create, update, and optimize schedules
2. Task Breakdown: Help break down complex goals into manageable Quantas
3. Resource Recommendations: Suggest articles, videos, tools, and learning materials
4. Calendar Integration: Work with existing calendars (Google, Outlook, etc.)
5. Health Optimization: Consider sleep, breaks, and well-being in scheduling
6. Habit Formation: Help establish and maintain positive routines

CONVERSATION FLOW:
1. Understand the user's request or goal
2. Ask relevant clarifying questions
3. Break down tasks into Bricks and Quantas if needed
4. Consider user preferences, constraints, and schedule
5. Provide actionable recommendations with reasoning
6. Offer resources and next steps
7. Schedule or reschedule as appropriate

WHEN INTERACTING:
- Always consider the user's existing schedule and preferences
- Be specific about time estimates and scheduling recommendations  
- Explain your reasoning for recommendations
- Offer alternatives when constraints exist
- Remember conversation context and previous interactions
- Proactively suggest improvements and optimizations

TOOLS AVAILABLE:
You have access to various tools for scheduling, task management, resource recommendations, and calendar integration. Use them appropriately based on user needs.

Remember: You're not just a scheduler, you're a life optimization partner. Help users build a more purposeful, organized, and fulfilling life.
"""
    
    async def process_user_message(
        self,
        message: str,
        user_id: UUID,
        conversation_id: UUID,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """Process a user message and generate a response."""
        
        self.logger.info(
            "Processing user message",
            user_id=str(user_id),
            conversation_id=str(conversation_id),
            message_length=len(message)
        )
        
        try:
            # Get or create conversation context
            conv_context = await self._get_conversation_context(
                user_id, conversation_id, context
            )
            
            # Update conversation memory if this is a new conversation
            if conversation_id not in self.conversations:
                await self._load_conversation_history(conv_context)
            
            # Process the message through the agent
            response = await self.agent_executor.ainvoke({
                "input": message,
                "user_id": str(user_id),
                "conversation_id": str(conversation_id),
                "user_context": json.dumps(conv_context.dict(), default=str)
            })
            
            # Extract information from the response
            agent_response = self._parse_agent_response(response)
            
            # Update conversation context
            await self._update_conversation_context(conv_context, message, agent_response)
            
            self.logger.info(
                "User message processed successfully",
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                actions_count=len(agent_response.actions_taken)
            )
            
            return agent_response
            
        except Exception as e:
            self.logger.error(
                "Error processing user message",
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                exc_info=e
            )
            
            # Return a fallback response
            return AgentResponse(
                response_text="I apologize, but I encountered an error processing your request. Please try again or rephrase your message.",
                model_used=settings.default_model,
                actions_taken=["error_handling"]
            )
    
    async def _get_conversation_context(
        self,
        user_id: UUID,
        conversation_id: UUID,
        context: Optional[Dict[str, Any]] = None
    ) -> ConversationContext:
        """Get or create conversation context."""
        
        if conversation_id in self.conversations:
            return self.conversations[conversation_id]
        
        # Create new conversation context
        conv_context = ConversationContext(
            user_id=user_id,
            conversation_id=conversation_id
        )
        
        # Load user preferences and current schedule
        # TODO: Implement actual data loading from databases/services
        conv_context.user_preferences = context or {}
        
        self.conversations[conversation_id] = conv_context
        return conv_context
    
    async def _load_conversation_history(self, context: ConversationContext):
        """Load conversation history into memory."""
        # TODO: Implement loading conversation history from database
        pass
    
    def _parse_agent_response(self, response: Dict[str, Any]) -> AgentResponse:
        """Parse the agent response and extract structured information."""
        
        # Extract the main response text
        response_text = response.get("output", "")
        
        # Initialize response object
        agent_response = AgentResponse(
            response_text=response_text,
            model_used=settings.default_model
        )
        
        # Extract intermediate steps to understand what tools were used
        intermediate_steps = response.get("intermediate_steps", [])
        
        for step in intermediate_steps:
            if len(step) >= 2:
                tool_action = step[0]
                tool_result = step[1]
                
                tool_name = tool_action.tool if hasattr(tool_action, 'tool') else "unknown"
                agent_response.actions_taken.append(f"Used {tool_name}")
                
                # Extract specific information based on tool used
                if "brick" in tool_name.lower():
                    if "create" in tool_name.lower():
                        # Extract created brick IDs from tool result
                        # TODO: Parse tool result to extract actual IDs
                        pass
                    elif "update" in tool_name.lower():
                        # Extract updated brick IDs
                        pass
                
                elif "schedule" in tool_name.lower():
                    agent_response.schedule_updated = True
                
                elif "resource" in tool_name.lower():
                    # Extract recommended resource IDs
                    # TODO: Parse tool result to extract actual resource IDs
                    pass
        
        return agent_response
    
    async def _update_conversation_context(
        self,
        context: ConversationContext,
        user_message: str,
        agent_response: AgentResponse
    ):
        """Update conversation context with new message and response."""
        
        # Add to conversation history
        context.conversation_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "user_message": user_message,
            "agent_response": agent_response.response_text,
            "actions_taken": agent_response.actions_taken
        })
        
        # Update last action
        if agent_response.actions_taken:
            context.last_action = agent_response.actions_taken[-1]
        
        # TODO: Persist conversation updates to database
    
    async def clear_conversation(self, conversation_id: UUID):
        """Clear conversation memory and context."""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
        
        # TODO: Clear from database as well
    
    async def get_conversation_summary(self, conversation_id: UUID) -> Optional[str]:
        """Get a summary of the conversation."""
        if conversation_id not in self.conversations:
            return None
        
        context = self.conversations[conversation_id]
        
        # TODO: Generate AI summary of conversation
        return f"Conversation with {len(context.conversation_history)} messages"


# Global agent instance
_agent_instance: Optional[OrchestratorAgent] = None


async def get_orchestrator_agent() -> OrchestratorAgent:
    """Get the global orchestrator agent instance."""
    global _agent_instance
    
    if _agent_instance is None:
        _agent_instance = OrchestratorAgent()
    
    return _agent_instance
