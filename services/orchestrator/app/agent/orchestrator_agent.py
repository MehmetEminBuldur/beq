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

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool
from langchain_core.runnables import RunnableLambda
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
    CreateQuantaTool,
    UpdateQuantaTool,
    GetQuantasTool,
    DeleteBrickTool,
    DeleteQuantaTool
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


def handle_tool_error(state: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tool execution errors gracefully."""
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls if state["messages"] and hasattr(state["messages"][-1], 'tool_calls') else []
    
    error_messages = []
    for tc in tool_calls:
        error_msg = ToolMessage(
            content=f"Error executing tool '{tc.get('name', 'unknown')}': {repr(error)}\nPlease try a different approach or check your parameters.",
            tool_call_id=tc.get("id", "unknown"),
        )
        error_messages.append(error_msg)
    
    return {"messages": error_messages}


def create_tool_node_with_fallback(tools: List[BaseTool]) -> ToolNode:
    """Create a ToolNode with proper error handling fallback."""
    tool_node = ToolNode(tools)
    return tool_node.with_fallbacks(
        [RunnableLambda(handle_tool_error)], 
        exception_key="error"
    )


def _print_event(event: Dict[str, Any], _printed: set, max_length: int = 1500) -> None:
    """Print LangGraph events for debugging."""
    current_state = event.get("dialog_state")
    if current_state:
        logger.debug("Currently in state", state=current_state[-1])
    
    message = event.get("messages")
    if message:
        if isinstance(message, list):
            message = message[-1]
        if hasattr(message, 'id') and message.id not in _printed:
            msg_repr = str(message)
            if len(msg_repr) > max_length:
                msg_repr = msg_repr[:max_length] + " ... (truncated)"
            logger.debug("Message event", message=msg_repr)
            _printed.add(message.id)


from typing import Annotated
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """State for the LangGraph agent workflow."""
    messages: Annotated[List[BaseMessage], add_messages]
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
            CreateQuantaTool(),
            UpdateQuantaTool(),
            GetQuantasTool(),
            DeleteBrickTool(),
            DeleteQuantaTool()
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
        """Create the LangGraph workflow using modern patterns."""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("call_model", self._call_model)
        workflow.add_node("tools", self._get_tool_node())
        
        # Add edges
        workflow.add_edge(START, "call_model")
        workflow.add_conditional_edges(
            "call_model",
            self._should_continue,
            {
                "tools": "tools",
                END: END,
            }
        )
        workflow.add_edge("tools", "call_model")
        
        # Compile workflow (recursion limit is handled in _should_continue)
        return workflow.compile(checkpointer=self.checkpointer)
    
    def _get_tool_node(self):
        """Get the tool node with proper error handling and user ID injection."""
        return self._create_custom_tool_node()
    
    def _create_custom_tool_node(self):
        """Create a custom tool node that handles user ID injection."""
        async def custom_tool_node(state: AgentState):
            """Custom tool node that injects user_id for specific tools."""
            messages = state["messages"]
            if not messages:
                return {"messages": []}
            
            last_message = messages[-1]
            if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
                return {"messages": []}
            
            tool_results = []
            for tool_call in last_message.tool_calls:
                tool_name = tool_call.get("name")
                tool_args = tool_call.get("args", {})
                
                # Handle string arguments that need to be parsed as JSON
                if isinstance(tool_args, str):
                    try:
                        import json
                        tool_args = json.loads(tool_args)
                    except json.JSONDecodeError:
                        self.logger.warning(f"Failed to parse tool args as JSON: {tool_args}")
                        tool_args = {}
                tool_id = tool_call.get("id")
                
                # Inject user_id for tools that need it
                tools_needing_user_id = [
                    "create_brick", "get_bricks", "update_brick", "delete_brick", 
                    "get_quantas", "create_quanta", "update_quanta", "delete_quanta",
                    "schedule_brick", "optimize_schedule", "get_schedule",
                    "get_resource_recommendations", "search_resources",
                    "get_calendar_events", "sync_calendar"
                ]
                if tool_name in tools_needing_user_id:
                    tool_args["user_id"] = state.get("user_id")
                    self.logger.info(f"Injected user_id {state.get('user_id')} for {tool_name}")
                
                self.logger.info(f"Executing tool {tool_name} with args: {tool_args}")
                
                # Find and execute the tool
                tool = next((t for t in self.tools if t.name == tool_name), None)
                if tool:
                    try:
                        result = await tool.arun(tool_input=tool_args)
                        tool_message = ToolMessage(
                            content=str(result),
                            tool_call_id=tool_id,
                            name=tool_name
                        )
                        tool_results.append(tool_message)
                        
                        # Track tool execution results for response metadata
                        self._track_tool_execution(state, tool_name, str(result), tool_args)
                        
                        self.logger.info("Tool executed successfully",
                                       tool_name=tool_name,
                                       result=result[:100] + "..." if len(str(result)) > 100 else str(result))
                    except Exception as e:
                        self.logger.error("Error executing tool", tool_name=tool_name, error=str(e))
                        error_message = ToolMessage(
                            content=f"Error executing {tool_name}: {str(e)}",
                            tool_call_id=tool_id,
                            name=tool_name
                        )
                        tool_results.append(error_message)
                else:
                    self.logger.warning("Tool not found", tool_name=tool_name)
                    error_message = ToolMessage(
                        content=f"Tool {tool_name} not found",
                        tool_call_id=tool_id,
                        name=tool_name
                    )
                    tool_results.append(error_message)
            
            return {"messages": tool_results}
        
        return custom_tool_node
    
    def _should_continue(self, state: AgentState) -> str:
        """Determine whether to continue with tool execution or end."""
        messages = state["messages"]
        if not messages:
            return END
        
        # Count AI messages to prevent infinite loops
        ai_message_count = sum(1 for msg in messages if isinstance(msg, AIMessage))
        if ai_message_count > 5:  # Limit to 5 AI responses max
            self.logger.warning("Maximum AI message count reached, ending conversation", 
                              ai_message_count=ai_message_count)
            return END
            
        last_message = messages[-1]
        
        # If the LLM makes a tool call, execute tools
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            self.logger.info("Tool calls detected, continuing to tools", 
                           tool_calls=[tc.get('name', 'unknown') for tc in last_message.tool_calls],
                           ai_message_count=ai_message_count)
            return "tools"
        
        # Otherwise, we're done
        self.logger.info("No tool calls, ending conversation", ai_message_count=ai_message_count)
        return END
    
    async def _call_model(self, state: AgentState) -> AgentState:
        """Call the LLM with current messages and system prompt."""
        try:
            self.logger.info("Calling LLM model", 
                           message_count=len(state["messages"]),
                           user_id=state.get("user_id"),
                           conversation_id=state.get("conversation_id"))
            
            # Get the LLM client
            llm_client = await self._get_llm_client()
            
            # Prepare messages for the LLM
            messages = []
            
            # Add system message
            system_prompt = self._create_system_prompt()
            messages.append(ConversationMessage(role="system", content=system_prompt))
            
            # Add conversation history
            for msg in state["messages"]:
                if isinstance(msg, HumanMessage):
                    messages.append(ConversationMessage(role="user", content=msg.content))
                elif isinstance(msg, AIMessage):
                    messages.append(ConversationMessage(role="assistant", content=msg.content))
                elif isinstance(msg, ToolMessage):
                    # Add tool results as user messages for context
                    messages.append(ConversationMessage(role="user", content=f"Tool result: {msg.content}"))
            
            # Prepare available tools for function calling
            available_functions = []
            for tool in self.tools:
                if tool.name in ["create_brick", "create_quanta", "get_bricks", "update_brick", "update_quanta", "get_quantas", "delete_brick", "delete_quanta"]:
                    try:
                        input_schema = tool.get_input_schema()
                        if input_schema is not None:
                            tool_schema = {
                                "type": "function", 
                                "function": {
                                    "name": tool.name,
                                    "description": tool.description,
                                    "parameters": input_schema.model_json_schema()
                                }
                            }
                            available_functions.append(tool_schema)
                    except Exception as e:
                        self.logger.warning("Failed to get schema for tool", tool_name=tool.name, error=str(e))
            
            self.logger.info("Prepared tools for LLM", 
                           available_tool_count=len(available_functions),
                           tool_names=[f["function"]["name"] for f in available_functions])
            
            # Call the LLM with function calling enabled
            response = await llm_client.generate_response(
                messages=messages,
                system_prompt=None,  # System prompt is already included in messages
                tools=available_functions if available_functions else None
            )
            
            # Handle response based on type
            if isinstance(response, str):
                # Simple text response
                ai_message = AIMessage(content=response)
            else:
                # Response with potential tool calls
                message = response.choices[0].message
                ai_message = AIMessage(content=message.content or "")
                
                # Handle tool calls if present
                if hasattr(message, 'tool_calls') and message.tool_calls:
                    tool_calls = []
                    for tool_call in message.tool_calls:
                        tool_calls.append({
                            "id": tool_call.id,
                            "name": tool_call.function.name,
                            "args": tool_call.function.arguments
                        })
                    ai_message.tool_calls = tool_calls
                    
                    self.logger.info("LLM made tool calls", 
                                   tool_calls=[tc["name"] for tc in tool_calls])
            
            return {"messages": [ai_message]}
            
        except Exception as e:
            self.logger.error("Error in _call_model", exc_info=e)
            error_message = AIMessage(content=f"I encountered an error while processing your request: {str(e)}")
            return {"messages": [error_message]}
    
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
    
    # Note: _execute_tools, _generate_response, and _update_context methods removed
    # as they are replaced by the modern LangGraph pattern with ToolNode
    
    async def _old_execute_tools(self, state: AgentState) -> AgentState:
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
    
    def _track_tool_execution(self, state: AgentState, tool_name: str, result: str, tool_args: Dict[str, Any]) -> None:
        """Track tool execution results for response metadata."""
        if tool_name == "create_brick":
            # Extract brick ID from the result if successful
            if "Successfully created" in result and "with ID" in result:
                try:
                    # Parse: "Successfully created Brick 'title' with ID {brick_id}. ..."
                    brick_id = result.split("with ID ")[1].split(".")[0].strip()
                    state["bricks_created"].append(brick_id)
                    self.logger.info("Tracked brick creation", brick_id=brick_id)
                except (IndexError, ValueError) as e:
                    self.logger.warning("Failed to parse brick ID from result", result=result, error=str(e))
                    state["bricks_created"].append(tool_args.get("title", "Unknown"))
            else:
                state["bricks_created"].append(tool_args.get("title", "Unknown"))
        
        elif tool_name == "update_brick":
            # Track brick updates
            if "Successfully updated" in result or "updated successfully" in result:
                brick_id = tool_args.get("brick_id", "Unknown")
                state["bricks_updated"].append(brick_id)
                self.logger.info("Tracked brick update", brick_id=brick_id)
        
        elif tool_name == "create_quanta":
            # Track quanta creation (these don't go in bricks_created but are tracked)
            if "Successfully created" in result and "with ID" in result:
                try:
                    quanta_id = result.split("with ID ")[1].split(".")[0].strip()
                    # Quantas aren't bricks, but we track them for completeness
                    self.logger.info("Tracked quanta creation", quanta_id=quanta_id)
                except (IndexError, ValueError) as e:
                    self.logger.warning("Failed to parse quanta ID from result", result=result, error=str(e))
        
        # Add tool to used tools list
        state["tools_used"].append(tool_name)
    
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
            if tool.name in ["create_brick", "create_quanta", "get_bricks", "update_brick"]:
                try:
                    # Use get_input_schema() method instead of args_schema attribute
                    input_schema = tool.get_input_schema()
                    if input_schema is not None:
                        tool_schema = {
                            "type": "function", 
                            "function": {
                                "name": tool.name,
                                "description": tool.description,
                                "parameters": input_schema.model_json_schema()
                            }
                        }
                        available_functions.append(tool_schema)
                        self.logger.debug(f"Added tool schema for {tool.name}")
                except Exception as e:
                    logger.error(f"Failed to create schema for tool {tool.name}", exc_info=e)
        
        # Generate response with OpenAI using full conversation history
        llm_client = await self._get_llm_client()
        
        response = await llm_client.generate_response(
            messages=conversation_messages,
            system_prompt=self._create_system_prompt(),
            tools=available_functions if available_functions else None
        )
        
        self.logger.info(
            "Generated response from LLM",
            response_type=type(response).__name__,
            has_choices=hasattr(response, 'choices'),
            available_tools_count=len(available_functions) if available_functions else 0
        )
        
        # Handle function calls if present
        # Check if response is the raw OpenAI response object with tool calls
        if hasattr(response, 'choices') and response.choices and hasattr(response.choices[0].message, 'tool_calls'):
            message = response.choices[0].message
            self.logger.info(
                "Tool calls detected",
                tool_calls_count=len(message.tool_calls) if message.tool_calls else 0,
                tool_names=[call.function.name for call in (message.tool_calls or [])]
            )
            if message.tool_calls:
                # Execute tool calls
                tool_results = []
                for tool_call in message.tool_calls:
                    try:
                        function_name = tool_call.function.name
                        function_args = json.loads(tool_call.function.arguments)
                        
                        # Inject required context into function args
                        tools_needing_user_id = [
                            "create_brick", "get_bricks", "update_brick", "delete_brick", 
                            "get_quantas", "create_quanta", "update_quanta", "delete_quanta",
                            "schedule_brick", "optimize_schedule", "get_schedule",
                            "get_resource_recommendations", "search_resources",
                            "get_calendar_events", "sync_calendar"
                        ]
                        if function_name in tools_needing_user_id:
                            function_args["user_id"] = state.get("user_id")
                            self.logger.info(f"Injected user_id {state.get('user_id')} for {function_name}")
                        # Note: create_quanta doesn't need user_id as it gets user through brick relationship
                        
                        # Find and execute the tool
                        tool = next((t for t in self.tools if t.name == function_name), None)
                        if tool:
                            # Pass arguments as a dictionary (LangChain expects tool_input as single param)
                            result = await tool.arun(function_args)
                            tool_results.append(f"{function_name}: {result}")
                            
                            # Track tool execution results for response metadata
                            self._track_tool_execution(state, function_name, str(result), function_args)
                            
                            self.logger.info(
                                "Tool executed successfully",
                                tool_name=function_name,
                                result=result[:100] + "..." if len(result) > 100 else result
                            )
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
            # No tool calls detected, response is a string
            response_content = response
            self.logger.info(
                "No tool calls detected in response",
                response_length=len(response) if isinstance(response, str) else 0
            )
        
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
    
    def _safe_parse_uuid(self, uuid_string: str) -> Optional[UUID]:
        """Safely parse a UUID string, returning None if invalid."""
        try:
            if uuid_string and isinstance(uuid_string, str):
                # Remove any extra whitespace and validate format
                cleaned = uuid_string.strip()
                if len(cleaned) == 36 and cleaned.count('-') == 4:
                    return UUID(cleaned)
        except (ValueError, TypeError):
            pass
        return None

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

2. **create_quanta**: Use when user wants to break down a Brick into smaller sub-tasks (Quantas). Requires a brick_id from a previously created Brick. ALWAYS suggest breaking down complex Bricks into Quantas for better task management.

3. **get_bricks**: ALWAYS call this FIRST when user wants to create quantas to see their available Bricks. This helps you:
   - Show the user their existing Bricks to choose from
   - Match the user's request to the most appropriate Brick
   - Avoid creating quantas for the wrong Brick
   - Let the user specify which Brick they want to add quantas to

4. **get_schedule**: Use to retrieve current user schedule when needed for context.

When creating Bricks or Quantas:
- Extract meaningful titles and descriptions from user messages
- Choose appropriate categories (learning, work, personal, health, social, maintenance, recreation)
- Estimate realistic durations based on task complexity (Quantas should typically be 15-60 minutes)
- Set appropriate priorities (low, medium, high, urgent)

IMPORTANT: When a user asks you to create a Brick or task, you MUST use the create_brick function to actually create it in the system. Don't just talk about creating it - actually call the function.

QUANTA CREATION WORKFLOW:
1. **ALWAYS call get_bricks first** when user wants to create quantas
2. **Present options** to the user based on their existing Bricks
3. **Let user choose** which Brick to add quantas to, OR intelligently match their request
4. **Then call create_quanta** with the correct brick_id

QUANTA CREATION GUIDELINES:
- After creating a Brick, ALWAYS ask if the user wants to break it down into Quantas
- When users mention sub-tasks, steps, or parts of a larger task, use create_quanta
- Quantas should be specific, actionable steps that can be completed in one focused session
- Each Quanta should have a clear outcome and be measurable
- Use create_quanta when users say things like:
  * "Break this down into steps"
  * "What are the sub-tasks for..."
  * "I need to plan the steps for..."
  * "Create tasks for each part of..."
  * "Add sub-tasks to..."

EXAMPLES of when to create Quantas:
- User: "Break down my 'Learn Spanish' brick" → Use create_quanta for each learning component
- User: "I need steps for my presentation project" → Use create_quanta for research, outline, slides, practice, etc.
- User: "Add tasks for planning my vacation" → Use create_quanta for booking, packing, itinerary, etc.

USER CONTEXT:
- You already have access to the user's ID and authentication information - you don't need to ask for it
- When using tools like create_brick, create_quanta, get_bricks, etc., the user context is automatically provided
- Simply call the tool functions directly with the required parameters (title, description, category, priority, etc.)
- You do NOT need to ask users for their user ID, authentication details, or other system identifiers

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
            
            # Execute the workflow with timeout
            config = {"configurable": {"thread_id": str(conversation_id)}}
            
            import asyncio
            try:
                # Add 45 second timeout to workflow execution (increased from 20s)
                final_state = await asyncio.wait_for(
                    self.workflow.ainvoke(initial_state, config),
                    timeout=45.0
                )
            except asyncio.TimeoutError:
                self.logger.error("Workflow execution timed out", 
                                user_id=str(user_id),
                                conversation_id=str(conversation_id))
                # Return a timeout response
                timeout_message = AIMessage(content="I'm taking longer than expected to process your request. Please try again with a simpler question.")
                final_state = {
                    **initial_state,
                    "messages": initial_state["messages"] + [timeout_message]
                }
            
            # Extract the AI response
            ai_message = final_state["messages"][-1]
            
            # Create response object
            agent_response = AgentResponse(
                response_text=ai_message.content,
                model_used=settings.default_model,
                actions_taken=final_state.get("tools_used", []),
                suggestions=final_state.get("user_context", {}).get("last_suggestions", []),
                schedule_updated=final_state.get("schedule_updated", False),
                bricks_created=[self._safe_parse_uuid(bid) for bid in final_state.get("bricks_created", []) if self._safe_parse_uuid(bid)],
                bricks_updated=[self._safe_parse_uuid(bid) for bid in final_state.get("bricks_updated", []) if self._safe_parse_uuid(bid)],
                resources_recommended=[self._safe_parse_uuid(rid) for rid in final_state.get("resources_recommended", []) if self._safe_parse_uuid(rid)]
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