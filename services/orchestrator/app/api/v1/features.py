"""
Feature flags API endpoints for the BeQ Orchestrator Service.

This module provides endpoints for checking feature flag status
and managing feature rollout for the web client.
"""

from typing import Dict, Any, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ...core.feature_flags import get_feature_manager, FeatureFlag, is_feature_enabled
from ...core.telemetry import record_feature_usage
import structlog

router = APIRouter()
logger = structlog.get_logger(__name__)


class FeatureStatusResponse(BaseModel):
    """Response model for feature status check."""

    feature: str = Field(..., description="Feature name")
    enabled: bool = Field(..., description="Whether the feature is enabled")
    user_specific: bool = Field(
        default=False,
        description="Whether the status is specific to this user"
    )
    rollout_percentage: Optional[int] = Field(
        default=None,
        description="Rollout percentage if applicable"
    )


class FeaturesStatusResponse(BaseModel):
    """Response model for all features status."""

    features: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Dictionary of feature statuses"
    )
    user_id: Optional[str] = Field(
        default=None,
        description="User ID for user-specific checks"
    )


@router.get("/status", response_model=FeaturesStatusResponse)
async def get_features_status(
    user_id: Optional[UUID] = Query(None, description="User ID for personalized feature checks")
):
    """Get the status of all features for a user."""

    try:
        feature_manager = get_feature_manager()
        user_id_str = str(user_id) if user_id else None

        features_status = {}
        for flag in FeatureFlag:
            enabled = is_feature_enabled(flag, user_id_str)
            features_status[flag.value] = {
                "enabled": enabled,
                "user_specific": user_id_str is not None,
                "description": _get_feature_description(flag),
            }

        logger.info(
            "Features status requested",
            user_id=user_id_str,
            feature_count=len(features_status)
        )

        return FeaturesStatusResponse(
            features=features_status,
            user_id=user_id_str
        )

    except Exception as e:
        logger.error(
            "Failed to get features status",
            user_id=str(user_id) if user_id else None,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve feature status"}
        )


@router.get("/status/{feature_name}", response_model=FeatureStatusResponse)
async def get_feature_status(
    feature_name: str,
    user_id: Optional[UUID] = Query(None, description="User ID for personalized feature check")
):
    """Get the status of a specific feature for a user."""

    try:
        # Validate feature name
        try:
            flag = FeatureFlag(feature_name)
        except ValueError:
            raise HTTPException(
                status_code=404,
                detail={"error": f"Feature '{feature_name}' not found"}
            )

        user_id_str = str(user_id) if user_id else None
        enabled = is_feature_enabled(flag, user_id_str)

        # Record feature check
        record_feature_usage(f"feature_check_{feature_name}", user_id_str or "anonymous", "checked")

        logger.info(
            "Feature status requested",
            feature=feature_name,
            user_id=user_id_str,
            enabled=enabled
        )

        return FeatureStatusResponse(
            feature=feature_name,
            enabled=enabled,
            user_specific=user_id_str is not None,
            rollout_percentage=None  # Could be implemented for percentage rollouts
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get feature status",
            feature=feature_name,
            user_id=str(user_id) if user_id else None,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to retrieve feature status"}
        )


def _get_feature_description(flag: FeatureFlag) -> str:
    """Get human-readable description for a feature flag."""
    descriptions = {
        FeatureFlag.SCHEDULE_OPTIMIZATION: "AI-powered schedule generation and optimization using Gemma 3 27B IT",
        FeatureFlag.AI_CHAT: "Conversational AI chat interface powered by OpenRouter",
        FeatureFlag.CALENDAR_SYNC: "Google Calendar integration for event synchronization",
        FeatureFlag.BRICK_MANAGEMENT: "Advanced project brick creation and management",
        FeatureFlag.ADVANCED_ANALYTICS: "Detailed analytics and reporting features",
    }
    return descriptions.get(flag, f"{flag.value.replace('_', ' ').title()} feature")
