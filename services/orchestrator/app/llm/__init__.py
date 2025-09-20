"""
LLM module for BeQ Orchestrator using OpenAI.

This module provides conversational AI capabilities using
OpenAI models.
"""

from .openrouter_client import (
    OpenAIConversationalClient,
    ConversationMessage,
    get_openai_conversational_client,
    cleanup_openai_conversational_client
)

__all__ = [
    "OpenAIConversationalClient",
    "ConversationMessage",
    "get_openai_conversational_client",
    "cleanup_openai_conversational_client"
]
