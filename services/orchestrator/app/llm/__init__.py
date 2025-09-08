"""
LLM module for BeQ Orchestrator using OpenRouter and Gemma 3 27B IT.

This module provides conversational AI capabilities using
100% open source models via OpenRouter.
"""

from .openrouter_client import (
    OpenRouterConversationalClient,
    ConversationMessage,
    get_openrouter_conversational_client,
    cleanup_openrouter_conversational_client
)

__all__ = [
    "OpenRouterConversationalClient",
    "ConversationMessage",
    "get_openrouter_conversational_client",
    "cleanup_openrouter_conversational_client"
]
