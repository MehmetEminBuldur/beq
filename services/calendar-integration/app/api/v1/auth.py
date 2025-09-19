"""
OAuth authentication endpoints for calendar integration.

This module provides OAuth flows for Google Calendar and Microsoft Calendar
integration, including authorization, token management, and callback handling.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from uuid import uuid4
import json

from fastapi import APIRouter, HTTPException, Request, Query, Depends
from fastapi.responses import RedirectResponse
import httpx
import structlog

from ...core.config import get_settings

router = APIRouter()
logger = structlog.get_logger(__name__)
settings = get_settings()


# OAuth clients and token storage will be initialized in app.state


async def get_oauth_clients(request: Request):
    """Dependency to get OAuth clients from app state."""
    return {
        "google_oauth": request.app.state.google_oauth,
        "token_storage": request.app.state.token_storage,
    }


@router.get("/google/login")
async def google_login(
    user_id: str = Query(..., description="User ID for OAuth flow"),
    state: Optional[str] = Query(None, description="Optional state parameter"),
    clients: Dict[str, Any] = Depends(get_oauth_clients)
):
    """Initiate Google OAuth login flow."""

    try:
        google_oauth = clients["google_oauth"]
        token_storage = clients["token_storage"]

        # Generate a unique state for CSRF protection
        oauth_state = str(uuid4())

        # Store state with user_id for verification
        state_data = {
            "user_id": user_id,
            "provider": "google",
            "timestamp": datetime.now().isoformat()
        }
        if state:
            state_data["client_state"] = state

        # Store state in Redis/session
        await token_storage.store_oauth_state(oauth_state, state_data)

        # Generate authorization URL
        auth_url = google_oauth.get_authorization_url(oauth_state)

        logger.info(
            "Google OAuth login initiated",
            user_id=user_id,
            state=oauth_state
        )

        return {
            "authorization_url": auth_url,
            "state": oauth_state
        }

    except Exception as e:
        logger.error(
            "Failed to initiate Google OAuth login",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to initiate OAuth login"}
        )


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter for verification"),
    error: Optional[str] = Query(None, description="OAuth error if any"),
    clients: Dict[str, Any] = Depends(get_oauth_clients)
):
    """Handle Google OAuth callback."""

    try:
        google_oauth = clients["google_oauth"]
        token_storage = clients["token_storage"]

        # Handle OAuth errors
        if error:
            logger.error(
                "Google OAuth error in callback",
                error=error,
                state=state
            )
            return RedirectResponse(
                url=f"{settings.service.frontend_url}/auth/error?error={error}",
                status_code=302
            )

        # Verify state parameter
        state_data = await token_storage.get_oauth_state(state)
        if not state_data:
            logger.error("Invalid OAuth state", state=state)
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid state parameter"}
            )

        user_id = state_data["user_id"]

        # Exchange authorization code for tokens
        token_data = await google_oauth.exchange_code_for_tokens(code)

        # Store tokens securely
        await token_storage.store_user_tokens(
            user_id=user_id,
            provider="google",
            tokens=token_data
        )

        # Clean up state
        await token_storage.delete_oauth_state(state)

        logger.info(
            "Google OAuth callback successful",
            user_id=user_id,
            has_refresh_token=bool(token_data.get("refresh_token"))
        )

        # Redirect to frontend success page
        redirect_url = f"{settings.service.frontend_url}/auth/success?provider=google"
        if state_data.get("client_state"):
            redirect_url += f"&state={state_data['client_state']}"

        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        logger.error(
            "Google OAuth callback failed",
            error=str(e),
            state=state,
            exc_info=True
        )

        # Clean up state on error
        try:
            await token_storage.delete_oauth_state(state)
        except:
            pass

        return RedirectResponse(
            url=f"{settings.service.frontend_url}/auth/error?error=oauth_callback_failed",
            status_code=302
        )


@router.get("/google/status/{user_id}")
async def google_auth_status(
    user_id: str,
    clients: Dict[str, Any] = Depends(get_oauth_clients)
):
    """Check Google authentication status for a user."""

    try:
        google_oauth = clients["google_oauth"]
        token_storage = clients["token_storage"]

        tokens = await token_storage.get_user_tokens(user_id, "google")

        if not tokens:
            return {
                "authenticated": False,
                "provider": "google",
                "user_id": user_id
            }

        # Check if tokens are still valid
        is_valid = await google_oauth.validate_tokens(tokens)

        # Get user profile information
        profile = None
        if is_valid:
            try:
                profile = await google_oauth.get_user_profile(tokens)
            except Exception as e:
                logger.warning(
                    "Failed to get Google user profile",
                    user_id=user_id,
                    error=str(e)
                )

        return {
            "authenticated": True,
            "provider": "google",
            "user_id": user_id,
            "tokens_valid": is_valid,
            "profile": profile,
            "expires_at": tokens.get("expires_at"),
            "scopes": tokens.get("scope", "").split()
        }

    except Exception as e:
        logger.error(
            "Failed to check Google auth status",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to check authentication status"}
        )


@router.post("/google/refresh/{user_id}")
async def refresh_google_tokens(
    user_id: str,
    clients: Dict[str, Any] = Depends(get_oauth_clients)
):
    """Refresh Google OAuth tokens for a user."""

    try:
        google_oauth = clients["google_oauth"]
        token_storage = clients["token_storage"]

        # Get current tokens
        tokens = await token_storage.get_user_tokens(user_id, "google")
        if not tokens:
            raise HTTPException(
                status_code=404,
                detail={"error": "No Google tokens found for user"}
            )

        # Refresh tokens
        new_tokens = await google_oauth.refresh_tokens(tokens.get("refresh_token"))

        # Store updated tokens
        await token_storage.store_user_tokens(
            user_id=user_id,
            provider="google",
            tokens=new_tokens
        )

        logger.info(
            "Google tokens refreshed successfully",
            user_id=user_id
        )

        return {
            "success": True,
            "message": "Tokens refreshed successfully",
            "expires_at": new_tokens.get("expires_at")
        }

    except Exception as e:
        logger.error(
            "Failed to refresh Google tokens",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to refresh tokens"}
        )


@router.delete("/google/disconnect/{user_id}")
async def disconnect_google(
    user_id: str,
    clients: Dict[str, Any] = Depends(get_oauth_clients)
):
    """Disconnect Google integration for a user."""

    try:
        token_storage = clients["token_storage"]

        # Remove stored tokens
        await token_storage.delete_user_tokens(user_id, "google")

        logger.info(
            "Google integration disconnected",
            user_id=user_id
        )

        return {
            "success": True,
            "message": "Google integration disconnected successfully"
        }

    except Exception as e:
        logger.error(
            "Failed to disconnect Google integration",
            user_id=user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to disconnect Google integration"}
        )


@router.get("/providers")
async def list_providers():
    """List available calendar providers and their status."""

    return {
        "providers": {
            "google": {
                "name": "Google Calendar",
                "status": "available",
                "scopes": settings.oauth.google_scopes,
                "oauth_url": "/api/v1/auth/google/login"
            },
            "microsoft": {
                "name": "Microsoft Outlook",
                "status": "coming_soon",
                "scopes": settings.oauth.microsoft_scopes,
                "oauth_url": None
            }
        }
    }
