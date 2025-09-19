"""
Token storage for OAuth credentials.

This module provides secure storage and retrieval of OAuth tokens
using Redis for session management and encrypted token storage.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import json
import hashlib
import os

import redis.asyncio as redis
import structlog
from cryptography.fernet import Fernet

from ..config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class TokenStorage:
    """Secure token storage using Redis with encryption."""

    def __init__(self):
        self.redis = redis.from_url(settings.service.redis_url)

        # Generate or load encryption key
        self._setup_encryption()

    def _setup_encryption(self):
        """Setup encryption for token storage."""

        # Use a consistent key derived from the secret key
        key_material = settings.service.secret_key.encode()
        key = hashlib.sha256(key_material).digest()
        self.fernet = Fernet(base64.urlsafe_b64encode(key[:32]))

    async def store_oauth_state(self, state: str, data: Dict[str, Any], ttl: int = 600) -> None:
        """Store OAuth state data for CSRF protection."""

        try:
            key = f"oauth_state:{state}"
            value = json.dumps(data)

            await self.redis.setex(key, ttl, value)

            logger.debug("OAuth state stored", state=state, ttl=ttl)

        except Exception as e:
            logger.error(
                "Failed to store OAuth state",
                state=state,
                error=str(e),
                exc_info=True
            )
            raise

    async def get_oauth_state(self, state: str) -> Optional[Dict[str, Any]]:
        """Retrieve OAuth state data."""

        try:
            key = f"oauth_state:{state}"
            value = await self.redis.get(key)

            if value is None:
                return None

            return json.loads(value)

        except Exception as e:
            logger.error(
                "Failed to get OAuth state",
                state=state,
                error=str(e),
                exc_info=True
            )
            return None

    async def delete_oauth_state(self, state: str) -> None:
        """Delete OAuth state data."""

        try:
            key = f"oauth_state:{state}"
            await self.redis.delete(key)

            logger.debug("OAuth state deleted", state=state)

        except Exception as e:
            logger.error(
                "Failed to delete OAuth state",
                state=state,
                error=str(e),
                exc_info=True
            )

    async def store_user_tokens(
        self,
        user_id: str,
        provider: str,
        tokens: Dict[str, Any]
    ) -> None:
        """Store encrypted OAuth tokens for a user."""

        try:
            key = f"user_tokens:{user_id}:{provider}"

            # Encrypt sensitive token data
            token_data = json.dumps(tokens)
            encrypted_data = self.fernet.encrypt(token_data.encode())

            # Store with appropriate TTL (tokens expire)
            expires_at = datetime.fromisoformat(tokens["expires_at"])
            ttl_seconds = int((expires_at - datetime.now()).total_seconds())

            # Add some buffer time and ensure minimum TTL
            ttl_seconds = max(ttl_seconds + 300, 3600)  # At least 1 hour

            await self.redis.setex(key, ttl_seconds, encrypted_data)

            logger.info(
                "User tokens stored",
                user_id=user_id,
                provider=provider,
                expires_at=tokens["expires_at"]
            )

        except Exception as e:
            logger.error(
                "Failed to store user tokens",
                user_id=user_id,
                provider=provider,
                error=str(e),
                exc_info=True
            )
            raise

    async def get_user_tokens(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        """Retrieve and decrypt user OAuth tokens."""

        try:
            key = f"user_tokens:{user_id}:{provider}"
            encrypted_data = await self.redis.get(key)

            if encrypted_data is None:
                return None

            # Decrypt token data
            decrypted_data = self.fernet.decrypt(encrypted_data)
            token_data = json.loads(decrypted_data.decode())

            return token_data

        except Exception as e:
            logger.error(
                "Failed to get user tokens",
                user_id=user_id,
                provider=provider,
                error=str(e),
                exc_info=True
            )
            return None

    async def delete_user_tokens(self, user_id: str, provider: str) -> None:
        """Delete user OAuth tokens."""

        try:
            key = f"user_tokens:{user_id}:{provider}"
            await self.redis.delete(key)

            logger.info(
                "User tokens deleted",
                user_id=user_id,
                provider=provider
            )

        except Exception as e:
            logger.error(
                "Failed to delete user tokens",
                user_id=user_id,
                provider=provider,
                error=str(e),
                exc_info=True
            )
            raise

    async def update_token_expiry(
        self,
        user_id: str,
        provider: str,
        new_expires_at: str
    ) -> None:
        """Update token expiry time without changing other token data."""

        try:
            tokens = await self.get_user_tokens(user_id, provider)
            if not tokens:
                raise ValueError("No tokens found for user")

            # Update expiry
            tokens["expires_at"] = new_expires_at

            # Re-store tokens with updated expiry
            await self.store_user_tokens(user_id, provider, tokens)

            logger.debug(
                "Token expiry updated",
                user_id=user_id,
                provider=provider,
                new_expires_at=new_expires_at
            )

        except Exception as e:
            logger.error(
                "Failed to update token expiry",
                user_id=user_id,
                provider=provider,
                error=str(e),
                exc_info=True
            )
            raise

    async def list_user_providers(self, user_id: str) -> list[str]:
        """List all calendar providers a user has authenticated with."""

        providers = ["google", "microsoft"]  # Supported providers
        connected_providers = []

        for provider in providers:
            tokens = await self.get_user_tokens(user_id, provider)
            if tokens:
                connected_providers.append(provider)

        return connected_providers

    async def cleanup_expired_states(self) -> int:
        """Clean up expired OAuth states (maintenance function)."""

        try:
            # This is a simplified cleanup - in production, you might want
            # to use Redis SCAN or maintain a separate index
            pattern = "oauth_state:*"
            # Note: Redis SCAN with patterns can be expensive on large datasets

            logger.info("OAuth state cleanup completed")
            return 0  # Placeholder

        except Exception as e:
            logger.error(
                "Failed to cleanup expired states",
                error=str(e),
                exc_info=True
            )
            return 0
