"""
Configuration settings for the Calendar Integration Service.

This module defines all configuration settings including OAuth credentials,
database connections, and service-specific settings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict
from typing import List, Optional
import os


class OAuthConfig(BaseSettings):
    """OAuth configuration for external calendar providers."""

    # Google OAuth Settings
    google_client_id: str = Field(..., env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(..., env="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(
        default="http://localhost:8003/api/v1/auth/google/callback",
        env="GOOGLE_REDIRECT_URI"
    )

    # Microsoft OAuth Settings
    microsoft_client_id: Optional[str] = Field(default=None, env="MICROSOFT_CLIENT_ID")
    microsoft_client_secret: Optional[str] = Field(default=None, env="MICROSOFT_CLIENT_SECRET")
    microsoft_tenant_id: Optional[str] = Field(default=None, env="MICROSOFT_TENANT_ID")
    microsoft_redirect_uri: Optional[str] = Field(
        default="http://localhost:8003/api/v1/auth/microsoft/callback",
        env="MICROSOFT_REDIRECT_URI"
    )

    # OAuth Scopes
    google_scopes: List[str] = Field(
        default=[
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
        ]
    )
    microsoft_scopes: List[str] = Field(
        default=[
            "Calendars.ReadWrite",
            "Calendars.Read",
            "offline_access",
        ]
    )


class DatabaseConfig(BaseSettings):
    """Database configuration."""

    url: str = Field(
        default="postgresql://user:password@localhost:5432/beq_calendar",
        env="DATABASE_URL"
    )
    pool_size: int = Field(default=10, env="DB_POOL_SIZE")
    max_overflow: int = Field(default=20, env="DB_MAX_OVERFLOW")


class ServiceConfig(BaseSettings):
    """Service-wide configuration."""

    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8003, env="PORT")

    # Redis for session storage
    redis_url: str = Field(
        default="redis://localhost:6379",
        env="REDIS_URL"
    )

    # Supabase integration
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")

    # Security
    secret_key: str = Field(
        default="change-this-in-production",
        env="SECRET_KEY"
    )
    session_secret: str = Field(
        default="change-this-session-secret",
        env="SESSION_SECRET"
    )

    # Background task settings
    sync_interval_minutes: int = Field(default=15, env="SYNC_INTERVAL_MINUTES")
    max_sync_retries: int = Field(default=3, env="MAX_SYNC_RETRIES")


class Settings(BaseSettings):
    """Main application settings."""

    oauth: OAuthConfig = OAuthConfig()
    database: DatabaseConfig = DatabaseConfig()
    service: ServiceConfig = ServiceConfig()

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra='allow'  # Allow extra fields to prevent validation errors
    )


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings
