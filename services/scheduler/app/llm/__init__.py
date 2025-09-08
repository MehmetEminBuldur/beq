"""
LLM-based scheduling module for BeQ.

This module provides AI-powered scheduling capabilities using
large language models via OpenRouter.
"""

from .openrouter_client import (
    OpenRouterClient,
    SchedulingContext,
    SchedulingResult,
    get_openrouter_client,
    cleanup_openrouter_client
)

__all__ = [
    "OpenRouterClient",
    "SchedulingContext", 
    "SchedulingResult",
    "get_openrouter_client",
    "cleanup_openrouter_client"
]
