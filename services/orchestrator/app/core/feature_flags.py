"""
Feature flags for the BeQ Orchestrator Service.

This module provides centralized feature flag management for controlling
the rollout and behavior of experimental or new features.
"""

import os
from typing import Dict, Any, Optional
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class FeatureFlag(Enum):
    """Available feature flags."""
    SCHEDULE_OPTIMIZATION = "schedule_optimization"
    AI_CHAT = "ai_chat"
    CALENDAR_SYNC = "calendar_sync"
    BRICK_MANAGEMENT = "brick_management"
    ADVANCED_ANALYTICS = "advanced_analytics"


class FeatureFlagManager:
    """Manages feature flags for the orchestrator service."""

    def __init__(self):
        self._flags: Dict[str, bool] = {}
        self._load_flags()

    def _load_flags(self):
        """Load feature flags from environment variables."""
        # Default feature flags (can be overridden by env vars)
        defaults = {
            FeatureFlag.SCHEDULE_OPTIMIZATION.value: True,  # Enabled by default
            FeatureFlag.AI_CHAT.value: True,
            FeatureFlag.CALENDAR_SYNC.value: False,  # Disabled until implemented
            FeatureFlag.BRICK_MANAGEMENT.value: True,
            FeatureFlag.ADVANCED_ANALYTICS.value: False,
        }

        # Load from environment variables
        for flag in FeatureFlag:
            env_var = f"FEATURE_{flag.value.upper()}_ENABLED"
            env_value = os.getenv(env_var)

            if env_value is not None:
                # Convert string to boolean
                self._flags[flag.value] = env_value.lower() in ('true', '1', 'yes', 'on')
            else:
                self._flags[flag.value] = defaults.get(flag.value, False)

        logger.info(
            "Feature flags loaded",
            flags=self._flags
        )

    def is_enabled(self, flag: FeatureFlag, user_id: Optional[str] = None) -> bool:
        """Check if a feature flag is enabled for a user."""
        base_enabled = self._flags.get(flag.value, False)

        # Add user-specific logic here if needed (e.g., percentage rollout, A/B testing)
        if user_id and flag == FeatureFlag.SCHEDULE_OPTIMIZATION:
            # Example: Enable for beta users only
            # return base_enabled and user_id in self._beta_users
            pass

        return base_enabled

    def get_all_flags(self) -> Dict[str, bool]:
        """Get all feature flags and their current state."""
        return self._flags.copy()

    def refresh_flags(self):
        """Refresh feature flags from environment variables."""
        self._load_flags()


# Global feature flag manager instance
_feature_manager: Optional[FeatureFlagManager] = None


def get_feature_manager() -> FeatureFlagManager:
    """Get the global feature flag manager instance."""
    global _feature_manager

    if _feature_manager is None:
        _feature_manager = FeatureFlagManager()

    return _feature_manager


def is_feature_enabled(flag: FeatureFlag, user_id: Optional[str] = None) -> bool:
    """Convenience function to check if a feature is enabled."""
    return get_feature_manager().is_enabled(flag, user_id)
