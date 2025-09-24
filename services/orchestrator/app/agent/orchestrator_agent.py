"""
Main Orchestrator Agent for BeQ using LangGraph.

This module contains the core AI agent that orchestrates all user interactions,
manages conversations, and coordinates with other services to provide
intelligent life management assistance using LangGraph workflows.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, TypedDict
from uuid import UUID
import json

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
import structlog

from ..core.config import get_settings
from ..core.logging import LoggerMixin
from ..core.supabase import get_supabase
from ..llm.openrouter_client import (
    OpenAIConversationalClient,
    ConversationMessage,
    get_openai_conversational_client
)
from ..tools.scheduling_tools import (
    ScheduleBrickTool, 
    OptimizeScheduleTool,
    GetScheduleTool
)
from ..tools.brick_management_tools import (
    CreateBrickTool,
    UpdateBrickTool,
    GetBricksTool,
    CreateQuantaTool
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


class AgentState(TypedDict):
    """State for the LangGraph agent workflow."""
    messages: List[BaseMessage]
    user_id: str
    conversation_id: str
    user_context: Dict[str, Any]
    tools_used: List[str]
    schedule_updated: bool
    bricks_created: List[str]
    bricks_updated: List[str]
    resources_recommended: List[str]
    next_action: Optional[str]


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
    """Main orchestrator agent for BeQ conversations using LangGraph."""
    
    def __init__(self):
        self.openrouter_client = None  # Will be initialized async
        self.checkpointer = MemorySaver()
        self.tools = self._initialize_tools()
        self.workflow = self._create_workflow()
        self.conversations: Dict[UUID, ConversationContext] = {}
    
    async def _get_llm_client(self) -> OpenAIConversationalClient:
        """Get the OpenAI LLM client (async initialization)."""
        if self.openrouter_client is None:
            self.openrouter_client = await get_openai_conversational_client()
        return self.openrouter_client
    
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
            GetBricksTool(),
            CreateQuantaTool()
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
    
    def _create_workflow(self) -> StateGraph:
        """Create the LangGraph workflow."""
        
        # Create the workflow graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("analyze_request", self._analyze_request)
        workflow.add_node("execute_tools", self._execute_tools)
        workflow.add_node("generate_response", self._generate_response)
        workflow.add_node("update_context", self._update_context)
        
        # Define edges
        workflow.set_entry_point("analyze_request")
        workflow.add_edge("analyze_request", "execute_tools")
        workflow.add_edge("execute_tools", "generate_response")
        workflow.add_edge("generate_response", "update_context")
        workflow.add_edge("update_context", END)
        
        return workflow.compile(checkpointer=self.checkpointer)
    
    async def _analyze_request(self, state: AgentState) -> AgentState:
        """Analyze the user request and determine required actions."""
        
        latest_message = state["messages"][-1]
        user_message = latest_message.content
        
        # Create analysis prompt
        analysis_prompt = f"""
        Analyze this user request for BeQ life management assistance:
        "{user_message}"
        
        Determine what tools and actions are needed. Consider:
        1. Does this require scheduling or calendar operations?
        2. Does this involve creating or managing Bricks/Quantas?
        3. Does this need resource recommendations?
        4. What follow-up questions might be needed?
        
        User context: {json.dumps(state.get("user_context", {}), default=str)}
        
        Respond with a brief analysis in 1-2 sentences.
        """
        
        # Analyze with OpenAI
        llm_client = await self._get_llm_client()
        conversation_messages = [
            ConversationMessage(role="user", content=analysis_prompt)
        ]
        
        analysis_response = await llm_client.generate_response(
            messages=conversation_messages,
            system_prompt=self._create_system_prompt()
        )
        
        # Update state with analysis results
        state["next_action"] = "tools_required"
        
        return state
    
    async def _execute_tools(self, state: AgentState) -> AgentState:
        """Execute required tools based on the analysis."""
        
        latest_message = state["messages"][-1]
        user_message = latest_message.content
        tools_used = []
        
        # Determine which tools to use based on message content
        # This is a simplified heuristic - in practice, you'd use LLM to decide
        
        if any(keyword in user_message.lower() for keyword in ["schedule", "plan", "calendar"]):
            # Use scheduling tools
            try:
                schedule_tool = next(t for t in self.tools if t.name == "get_schedule")
                result = await schedule_tool.arun(
                    user_id=state["user_id"],
                    include_details=True
                )
                tools_used.append("get_schedule")
                # Getting the schedule does not imply an update
            except Exception as e:
                logger.error("Error using schedule tool", exc_info=e)
        
        # Note: Removed automatic brick creation here
        # AI will decide when to use tools through conversation context
        
        if any(keyword in user_message.lower() for keyword in ["learn", "resource", "help", "guide"]):
            # Use resource recommendation tools
            try:
                resource_tool = next(t for t in self.tools if t.name == "get_resource_recommendations")
                result = await resource_tool.arun(
                    user_id=state["user_id"],
                    context=user_message[:100]  # First 100 chars as context
                )
                tools_used.append("get_resource_recommendations")
                state["resources_recommended"].append("resource_id")
            except Exception as e:
                logger.error("Error using resource tool", exc_info=e)
        
        state["tools_used"] = tools_used
        return state
    
    async def _generate_response(self, state: AgentState) -> AgentState:
        """Generate the final response to the user."""
        
        # Prepare context for response generation
        latest_message = state["messages"][-1]
        tools_used = state.get("tools_used", [])
        
        # Convert LangChain messages to OpenAI format for conversation history
        conversation_messages = []
        
        # Add conversation history (excluding the last message we'll add separately)
        for msg in state["messages"][:-1]:  # All messages except the current one
            if isinstance(msg, HumanMessage):
                conversation_messages.append(ConversationMessage(role="user", content=msg.content))
            elif isinstance(msg, AIMessage):
                conversation_messages.append(ConversationMessage(role="assistant", content=msg.content))
        
        # Add current user message with context about tools used
        current_message_content = latest_message.content
        if tools_used:
            current_message_content += f"\n\n[Context: Tools used in processing: {', '.join(tools_used)}]"
        if state.get("schedule_updated"):
            current_message_content += "\n[Schedule was updated during processing]"
        if state.get("bricks_created"):
            current_message_content += f"\n[Created {len(state.get('bricks_created', []))} new Brick(s)]"
        if state.get("resources_recommended"):
            current_message_content += f"\n[Recommended {len(state.get('resources_recommended', []))} resource(s)]"
        
        conversation_messages.append(ConversationMessage(role="user", content=current_message_content))
        
        # Prepare available tools for function calling
        available_functions = []
        for tool in self.tools:
            if tool.name in ["create_brick", "create_quanta", "get_bricks"] and tool.args_schema is not None:
                try:
                    tool_schema = {
                        "type": "function",
                        "function": {
                            "name": tool.name,
                            "description": tool.description,
                            "parameters": tool.args_schema.model_json_schema()
                        }
                    }
                    available_functions.append(tool_schema)
                except Exception as e:
                    logger.error(f"Failed to create schema for tool {tool.name}", exc_info=e)
        
        # Generate response with OpenAI using full conversation history
        llm_client = await self._get_llm_client()
        
        response = await llm_client.generate_response(
            messages=conversation_messages,
            system_prompt=self._create_system_prompt(),
            tools=available_functions if available_functions else None
        )
        
        # Handle function calls if present
        if hasattr(response, 'choices') and hasattr(response.choices[0].message, 'tool_calls'):
            message = response.choices[0].message
            if message.tool_calls:
                # Execute tool calls
                tool_results = []
                for tool_call in message.tool_calls:
                    try:
                        function_name = tool_call.function.name
                        function_args = json.loads(tool_call.function.arguments)
                        
                        # Find and execute the tool
                        tool = next((t for t in self.tools if t.name == function_name), None)
                        if tool:
                            result = await tool.arun(function_args)
                            tool_results.append(f"{function_name}: {result}")
                            
                            # Update state based on tool used
                            if function_name == "create_brick":
                                state["bricks_created"].append(function_args.get("title", "Unknown"))
                            elif function_name == "create_quanta":
                                state["bricks_created"].append(f"Quanta: {function_args.get('title', 'Unknown')}")
                            
                            state["tools_used"].append(function_name)
                    except Exception as e:
                        logger.error(f"Error executing tool {tool_call.function.name}", exc_info=e)
                        tool_results.append(f"Error executing {tool_call.function.name}: {str(e)}")
                
                # Get final response after tool execution
                tool_context = "\n".join(tool_results)
                conversation_messages.append(ConversationMessage(role="assistant", content=f"Tool results: {tool_context}"))
                conversation_messages.append(ConversationMessage(role="user", content="Please provide a summary of what was created."))
                
                response_content = await llm_client.generate_response(
                    messages=conversation_messages,
                    system_prompt=self._create_system_prompt()
                )
            else:
                response_content = response  # String response
        else:
            response_content = response  # String response
        
        # Add AI response to messages
        state["messages"].append(AIMessage(content=response_content))
        
        # Heuristic suggestions based on actions/results
        suggestions: List[str] = []
        if state.get("schedule_updated"):
            suggestions.append("Review today's schedule and adjust any conflicts")
            suggestions.append("Would you like me to add reminders for key blocks?")
        if state.get("bricks_created"):
            suggestions.append("Break the new Brick into Quantas for actionable steps")
            suggestions.append("Should I schedule the first Quanta this week?")
        if state.get("resources_recommended"):
            suggestions.append("Save recommended resources to your learning list")
        if not suggestions:
            suggestions.append("Would you like me to create a Brick for this?")
            suggestions.append("Should I check your calendar for available time blocks?")
        
        # Store suggestions for downstream consumption
        state["next_action"] = state.get("next_action") or "respond"
        state["tools_used"] = state.get("tools_used", [])
        state.setdefault("user_context", {})
        # Persist on state via context updates key if needed later
        state["user_context"].update({"last_suggestions": suggestions})
        
        return state
    
    async def _update_context(self, state: AgentState) -> AgentState:
        """Update conversation context and state."""
        
        # Update conversation context in memory
        conversation_id = UUID(state["conversation_id"])
        
        if conversation_id in self.conversations:
            context = self.conversations[conversation_id]
            context.conversation_history.append({
                "timestamp": datetime.utcnow().isoformat(),
                "user_message": state["messages"][-2].content,  # User message
                "agent_response": state["messages"][-1].content,  # AI response
                "tools_used": state.get("tools_used", [])
            })
            
            if state.get("tools_used"):
                context.last_action = state["tools_used"][-1]
        
        return state
    
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
You have access to various tools for scheduling, task management, resource recommendations, and calendar integration. Use them appropriately based on user needs:

1. **create_brick**: Use when user wants to create a main task/project (Brick). Extract meaningful title, description, category (learning, work, personal, health, etc.), priority, and estimated duration.

2. **create_quanta**: Use when user wants to break down a Brick into smaller sub-tasks (Quantas). Requires a brick_id from a previously created Brick.

3. **get_schedule**, **get_bricks**: Use to retrieve current user data when needed for context.

When creating Bricks or Quantas:
- Extract meaningful titles and descriptions from user messages
- Choose appropriate categories (learning, work, personal, health, social, maintenance, recreation)
- Estimate realistic durations based on task complexity
- Set appropriate priorities (low, medium, high, urgent)

IMPORTANT: When a user asks you to create a Brick or task, you MUST use the create_brick function to actually create it in the system. Don't just talk about creating it - actually call the function.

Examples of when to use create_brick function:
- "Create a Brick for..."
- "I need a task for..."
- "Add [task name] to my list"
- "Schedule [activity] for [time]"
- "Make a Brick called [name]"

Always inform the user when you create Bricks or Quantas, and explain what you've created.

Remember: You're not just a scheduler, you're a life optimization partner. Help users build a more purposeful, organized, and fulfilling life.
"""
    
    async def process_user_message(
        self,
        message: str,
        user_id: UUID,
        conversation_id: UUID,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """Process a user message and generate a response using LangGraph workflow."""
        
        self.logger.info(
            "Processing user message with LangGraph",
            user_id=str(user_id),
            conversation_id=str(conversation_id),
            message_length=len(message)
        )
        
        try:
            # Get or create conversation context
            conv_context = await self._get_conversation_context(
                user_id, conversation_id, context
            )

            # Load conversation history from Supabase
            conversation_history = await self._load_conversation_history(user_id, conversation_id)

            # Convert history to LangChain messages
            history_messages = []
            for msg in conversation_history:
                if msg['sender'] == 'user':
                    history_messages.append(HumanMessage(content=msg['content']))
                elif msg['sender'] == 'assistant':
                    history_messages.append(AIMessage(content=msg['content']))

            # Add current message
            history_messages.append(HumanMessage(content=message))

            # Create initial state with conversation history
            initial_state: AgentState = {
                "messages": history_messages,
                "user_id": str(user_id),
                "conversation_id": str(conversation_id),
                "user_context": context or {},
                "tools_used": [],
                "schedule_updated": False,
                "bricks_created": [],
                "bricks_updated": [],
                "resources_recommended": [],
                "next_action": None
            }
            
            # Execute the workflow
            config = {"configurable": {"thread_id": str(conversation_id)}}
            final_state = await self.workflow.ainvoke(initial_state, config)
            
            # Extract the AI response
            ai_message = final_state["messages"][-1]
            
            # Create response object
            agent_response = AgentResponse(
                response_text=ai_message.content,
                model_used=settings.default_model,
                actions_taken=final_state.get("tools_used", []),
                suggestions=final_state.get("user_context", {}).get("last_suggestions", []),
                schedule_updated=final_state.get("schedule_updated", False),
                bricks_created=[UUID(bid) for bid in final_state.get("bricks_created", []) if bid],
                resources_recommended=[UUID(rid) for rid in final_state.get("resources_recommended", []) if rid]
            )
            
            self.logger.info(
                "User message processed successfully with LangGraph",
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                actions_count=len(agent_response.actions_taken)
            )
            
            return agent_response
            
        except Exception as e:
            self.logger.error(
                "Error processing user message with LangGraph",
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

    async def _load_conversation_history(
        self,
        user_id: UUID,
        conversation_id: UUID,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Load conversation history from Supabase."""

        try:
            supabase = get_supabase()

            # Get messages from Supabase
            response = supabase.table('messages') \
                .select('*') \
                .eq('conversation_id', str(conversation_id)) \
                .eq('user_id', str(user_id)) \
                .order('created_at', desc=False) \
                .limit(limit) \
                .execute()

            history = []
            for msg in response.data:
                # Add user message
                history.append({
                    'sender': 'user',
                    'content': msg['content'],
                    'timestamp': msg['created_at']
                })

                # Add assistant response if exists
                if msg['response']:
                    history.append({
                        'sender': 'assistant',
                        'content': msg['response'],
                        'timestamp': msg['created_at']
                    })

            return history

        except Exception as e:
            self.logger.warning(
                "Failed to load conversation history, proceeding without history",
                user_id=str(user_id),
                conversation_id=str(conversation_id),
                error=str(e)
            )
            return []
    
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