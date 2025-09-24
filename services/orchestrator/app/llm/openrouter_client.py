"""
OpenAI LLM Client for BeQ Orchestrator.

This module provides integration with OpenAI API for
conversational AI and orchestration.
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
from dataclasses import dataclass

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger(__name__)

@dataclass
class ConversationMessage:
    """A message in the conversation."""
    role: str  # "system", "user", "assistant"
    content: str
    timestamp: Optional[datetime] = None

class OpenAIConversationalClient:
    """Client for OpenAI API for conversations."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.max_tokens = 4000
        self.temperature = 0.7
        self.top_p = 0.9
        self.frequency_penalty = 0.1
        self.presence_penalty = 0.1

        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        # Create OpenAI client with error handling
        try:
            # Use minimal initialization to avoid version conflicts
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                # Avoid passing any problematic parameters
            )
            logger.info("OpenAI client successfully initialized", model=self.model)
        except Exception as e:
            logger.error("Failed to initialize OpenAI client", error=str(e), model=self.model)
            # Set client to None so we can detect and use fallback
            self.client = None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_response(
        self,
        messages: List[ConversationMessage],
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate a conversational response using OpenAI."""

        # If client failed to initialize, return a fallback response
        if self.client is None:
            logger.warning("OpenAI client not available, returning fallback response")
            return "Merhaba! BeQ asistanınızla konuşuyorsunuz. Şu anda teknik bir sorun yaşıyoruz, lütfen daha sonra tekrar deneyin."

        try:
            # Prepare messages for the API
            api_messages = []

            # Add system prompt if provided
            if system_prompt:
                api_messages.append({
                    "role": "system",
                    "content": system_prompt
                })

            # Add conversation messages
            for msg in messages:
                api_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=self.top_p,
                frequency_penalty=self.frequency_penalty,
                presence_penalty=self.presence_penalty
            )

            content = response.choices[0].message.content

            logger.info(
                "Conversational response generated",
                model=self.model,
                input_messages=len(api_messages),
                response_length=len(content) if content else 0
            )

            return content or "I apologize, but I'm having trouble processing your request right now. Please try again."

        except Exception as e:
            logger.error("Error in conversational response generation", exc_info=e)
            return "Merhaba! BeQ asistanınızla konuşuyorsunuz. Teknik bir sorun yaşıyoruz, lütfen daha sonra tekrar deneyin."
    
    
    async def stream_response(
        self,
        messages: List[ConversationMessage],
        system_prompt: Optional[str] = None
    ):
        """Stream a conversational response (for real-time UI)."""

        try:
            # Prepare messages for the API
            api_messages = []

            if system_prompt:
                api_messages.append({
                    "role": "system",
                    "content": system_prompt
                })

            for msg in messages:
                api_messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=self.top_p,
                frequency_penalty=self.frequency_penalty,
                presence_penalty=self.presence_penalty,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error("Error in streaming response", exc_info=e)
            yield "I apologize, but I'm having trouble processing your request."
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global client instance
_openai_conversational_client: Optional[OpenAIConversationalClient] = None

async def get_openai_conversational_client() -> OpenAIConversationalClient:
    """Get the global OpenAI conversational client instance."""
    global _openai_conversational_client

    if _openai_conversational_client is None:
        _openai_conversational_client = OpenAIConversationalClient()

    return _openai_conversational_client

async def cleanup_openai_conversational_client():
    """Cleanup the global OpenAI conversational client."""
    global _openai_conversational_client

    if _openai_conversational_client is not None:
        await _openai_conversational_client.close()
        _openai_conversational_client = None
