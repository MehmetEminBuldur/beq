"""
LLM-based scheduling module for BeQ.

This module provides AI-powered scheduling capabilities using
large language models via OpenAI.
"""

from .openrouter_client import (
    OpenAIClient,
    SchedulingContext,
    SchedulingResult,
    get_openai_client,
    cleanup_openai_client
)

__all__ = [
    "OpenAIClient",
    "SchedulingContext",
    "SchedulingResult",
    "get_openai_client",
    "cleanup_openai_client"
]
