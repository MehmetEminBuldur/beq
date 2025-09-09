"""
OpenRouter LLM Client for BeQ Orchestrator.

This module provides integration with OpenRouter API to use
Gemma 3 27B IT model for conversational AI and orchestration.
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
from dataclasses import dataclass

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger(__name__)

@dataclass
class ConversationMessage:
    """A message in the conversation."""
    role: str  # "system", "user", "assistant"
    content: str
    timestamp: Optional[datetime] = None

class OpenRouterConversationalClient:
    """Client for OpenRouter API with Gemma 3 27B IT for conversations."""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = os.getenv("OPENROUTER_MODEL", "google/gemma-2-27b-it")
        self.max_tokens = 4000
        self.temperature = 0.7
        self.top_p = 0.9
        self.frequency_penalty = 0.1
        self.presence_penalty = 0.1
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://beq.app",
                "X-Title": "BeQ Life Management"
            }
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_response(
        self, 
        messages: List[ConversationMessage],
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate a conversational response using Gemma 3 27B IT."""
        
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
            
            response = await self._make_api_call(api_messages)
            content = response["choices"][0]["message"]["content"]
            
            logger.info(
                "Conversational response generated",
                model=self.model,
                input_messages=len(api_messages),
                response_length=len(content)
            )
            
            return content
            
        except Exception as e:
            logger.error("Error in conversational response generation", exc_info=e)
            return "I apologize, but I'm having trouble processing your request right now. Please try again."
    
    async def _make_api_call(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Make API call to OpenRouter."""
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
            "stream": False
        }
        
        response = await self.client.post(
            f"{self.base_url}/chat/completions",
            json=payload
        )
        
        response.raise_for_status()
        return response.json()
    
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
            
            payload = {
                "model": self.model,
                "messages": api_messages,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "top_p": self.top_p,
                "frequency_penalty": self.frequency_penalty,
                "presence_penalty": self.presence_penalty,
                "stream": True
            }
            
            async with self.client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                json=payload
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(data)
                            if "choices" in chunk and chunk["choices"]:
                                delta = chunk["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            logger.error("Error in streaming response", exc_info=e)
            yield "I apologize, but I'm having trouble processing your request."
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global client instance
_openrouter_conversational_client: Optional[OpenRouterConversationalClient] = None

async def get_openrouter_conversational_client() -> OpenRouterConversationalClient:
    """Get the global OpenRouter conversational client instance."""
    global _openrouter_conversational_client
    
    if _openrouter_conversational_client is None:
        _openrouter_conversational_client = OpenRouterConversationalClient()
    
    return _openrouter_conversational_client

async def cleanup_openrouter_conversational_client():
    """Cleanup the global OpenRouter conversational client."""
    global _openrouter_conversational_client
    
    if _openrouter_conversational_client is not None:
        await _openrouter_conversational_client.close()
        _openrouter_conversational_client = None
