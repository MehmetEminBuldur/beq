"""
Google OAuth client for calendar integration.

This module handles Google OAuth 2.0 authentication flow,
token management, and API interactions for Google Calendar.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import json
import base64

import httpx
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import structlog

from ..config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class GoogleOAuthClient:
    """Google OAuth 2.0 client for calendar integration."""

    def __init__(self):
        self.client_id = settings.oauth.google_client_id
        self.client_secret = settings.oauth.google_client_secret
        self.redirect_uri = settings.oauth.google_redirect_uri
        self.scopes = settings.oauth.google_scopes

        # Google OAuth endpoints
        self.auth_url = "https://accounts.google.com/o/oauth2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.revoke_url = "https://oauth2.googleapis.com/revoke"

    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL."""

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "response_type": "code",
            "access_type": "offline",  # Request refresh token
            "prompt": "consent",  # Force consent screen to get refresh token
            "state": state,
        }

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.auth_url}?{query_string}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": self.redirect_uri,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )

                if response.status_code != 200:
                    logger.error(
                        "Token exchange failed",
                        status_code=response.status_code,
                        response=response.text
                    )
                    raise Exception(f"Token exchange failed: {response.text}")

                token_data = response.json()

                # Add expiration timestamp
                expires_at = datetime.now() + timedelta(seconds=token_data["expires_in"])

                return {
                    "access_token": token_data["access_token"],
                    "refresh_token": token_data.get("refresh_token"),
                    "token_type": token_data["token_type"],
                    "expires_in": token_data["expires_in"],
                    "expires_at": expires_at.isoformat(),
                    "scope": token_data.get("scope", " ".join(self.scopes)),
                }

        except Exception as e:
            logger.error(
                "Failed to exchange code for tokens",
                error=str(e),
                exc_info=True
            )
            raise

    async def refresh_tokens(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )

                if response.status_code != 200:
                    logger.error(
                        "Token refresh failed",
                        status_code=response.status_code,
                        response=response.text
                    )
                    raise Exception(f"Token refresh failed: {response.text}")

                token_data = response.json()

                # Add expiration timestamp
                expires_at = datetime.now() + timedelta(seconds=token_data["expires_in"])

                return {
                    "access_token": token_data["access_token"],
                    "refresh_token": refresh_token,  # Keep original refresh token
                    "token_type": token_data["token_type"],
                    "expires_in": token_data["expires_in"],
                    "expires_at": expires_at.isoformat(),
                    "scope": token_data.get("scope", " ".join(self.scopes)),
                }

        except Exception as e:
            logger.error(
                "Failed to refresh tokens",
                error=str(e),
                exc_info=True
            )
            raise

    async def validate_tokens(self, tokens: Dict[str, Any]) -> bool:
        """Validate if tokens are still valid."""

        try:
            expires_at = datetime.fromisoformat(tokens["expires_at"])
            return datetime.now() < expires_at
        except (KeyError, ValueError) as e:
            logger.error(
                "Invalid token format for validation",
                error=str(e)
            )
            return False

    async def get_user_profile(self, tokens: Dict[str, Any]) -> Dict[str, Any]:
        """Get user profile information from Google."""

        try:
            credentials = Credentials(
                token=tokens["access_token"],
                refresh_token=tokens.get("refresh_token"),
                token_uri=self.token_url,
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.scopes
            )

            # Build Google API client
            service = build("people", "v1", credentials=credentials)

            # Get user profile
            profile = service.people().get(
                resourceName="people/me",
                personFields="names,emailAddresses,photos"
            ).execute()

            return {
                "id": profile.get("resourceName", "").replace("people/", ""),
                "name": profile.get("names", [{}])[0].get("displayName", ""),
                "email": profile.get("emailAddresses", [{}])[0].get("value", ""),
                "picture": profile.get("photos", [{}])[0].get("url", ""),
            }

        except HttpError as e:
            logger.error(
                "Google API error getting user profile",
                error=str(e),
                status_code=e.resp.status if e.resp else None
            )
            raise
        except Exception as e:
            logger.error(
                "Failed to get user profile",
                error=str(e),
                exc_info=True
            )
            raise

    async def revoke_tokens(self, tokens: Dict[str, Any]) -> bool:
        """Revoke Google OAuth tokens."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.revoke_url,
                    data={
                        "token": tokens["access_token"],
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )

                success = response.status_code == 200
                if not success:
                    logger.warning(
                        "Token revocation may have failed",
                        status_code=response.status_code,
                        response=response.text
                    )

                return success

        except Exception as e:
            logger.error(
                "Failed to revoke tokens",
                error=str(e),
                exc_info=True
            )
            return False

    def create_google_credentials(self, tokens: Dict[str, Any]) -> Credentials:
        """Create Google API credentials from token data."""

        return Credentials(
            token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token"),
            token_uri=self.token_url,
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.scopes
        )
