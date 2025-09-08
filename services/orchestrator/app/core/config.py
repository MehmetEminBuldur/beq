"""
Configuration management for the BeQ Orchestrator Service.

This module handles all configuration settings using Pydantic Settings
for type safety and environment variable management.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Application settings
    app_name: str = Field("BeQ Orchestrator Service", description="Application name")
    environment: str = Field("development", description="Environment (development, staging, production)")
    debug: bool = Field(False, description="Debug mode")
    
    # Server settings
    host: str = Field("0.0.0.0", description="Host to bind to")
    port: int = Field(8000, description="Port to bind to")
    reload: bool = Field(False, description="Auto-reload on code changes")
    
    # Security settings
    secret_key: str = Field(..., description="Secret key for JWT tokens")
    algorithm: str = Field("HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(30, description="Access token expiration time")
    
    # CORS settings
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="Allowed CORS origins"
    )
    allowed_hosts: List[str] = Field(
        default=["localhost", "127.0.0.1"],
        description="Allowed hosts"
    )
    
    # Database settings
    database_url: str = Field(
        "postgresql+asyncpg://beq:beq@localhost:5432/beq_orchestrator",
        description="Database URL"
    )
    database_echo: bool = Field(False, description="Echo SQL queries")
    
    # Redis settings
    redis_url: str = Field("redis://localhost:6379/0", description="Redis URL")
    redis_password: Optional[str] = Field(None, description="Redis password")
    
    # AI/LLM settings
    openai_api_key: Optional[str] = Field(None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(None, description="Anthropic API key")
    default_llm_provider: str = Field("openai", description="Default LLM provider")
    default_model: str = Field("gpt-4-turbo-preview", description="Default LLM model")
    max_tokens: int = Field(4000, description="Maximum tokens for LLM responses")
    temperature: float = Field(0.7, description="LLM temperature")
    
    # External service URLs
    scheduler_service_url: str = Field(
        "http://localhost:8001",
        description="Scheduler service URL"
    )
    rag_service_url: str = Field(
        "http://localhost:8002",
        description="RAG recommender service URL"
    )
    calendar_service_url: str = Field(
        "http://localhost:8003",
        description="Calendar integration service URL"
    )
    user_profile_service_url: str = Field(
        "http://localhost:8004",
        description="User profile service URL"
    )
    
    # Service discovery and health checks
    service_discovery_enabled: bool = Field(False, description="Enable service discovery")
    health_check_interval_seconds: int = Field(30, description="Health check interval")
    
    # Rate limiting
    rate_limit_enabled: bool = Field(True, description="Enable rate limiting")
    rate_limit_requests: int = Field(100, description="Requests per minute")
    rate_limit_window_seconds: int = Field(60, description="Rate limit window")
    
    # Caching
    cache_enabled: bool = Field(True, description="Enable caching")
    cache_ttl_seconds: int = Field(300, description="Default cache TTL")
    
    # Monitoring and observability
    sentry_dsn: Optional[str] = Field(None, description="Sentry DSN for error tracking")
    metrics_enabled: bool = Field(True, description="Enable Prometheus metrics")
    tracing_enabled: bool = Field(False, description="Enable distributed tracing")
    jaeger_endpoint: Optional[str] = Field(None, description="Jaeger endpoint")
    
    # Logging
    log_level: str = Field("INFO", description="Log level")
    log_format: str = Field("json", description="Log format (json, text)")
    log_file: Optional[str] = Field(None, description="Log file path")
    
    # AI Agent settings
    agent_max_iterations: int = Field(10, description="Maximum agent iterations")
    agent_timeout_seconds: int = Field(60, description="Agent timeout")
    enable_agent_memory: bool = Field(True, description="Enable agent conversation memory")
    memory_max_messages: int = Field(50, description="Maximum messages in memory")
    
    # Scheduling optimization
    scheduling_lookahead_days: int = Field(14, description="Days to look ahead for scheduling")
    scheduling_optimization_timeout: int = Field(30, description="Scheduling optimization timeout")
    enable_background_optimization: bool = Field(True, description="Enable background optimization")
    
    # Feature flags
    enable_ai_suggestions: bool = Field(True, description="Enable AI suggestions")
    enable_auto_scheduling: bool = Field(True, description="Enable automatic scheduling")
    enable_learning_recommendations: bool = Field(True, description="Enable learning recommendations")
    enable_health_optimization: bool = Field(True, description="Enable health optimization")
    
    # API versioning
    api_version: str = Field("v1", description="API version")
    deprecation_warnings: bool = Field(True, description="Show deprecation warnings")
    
    # Testing
    testing: bool = Field(False, description="Testing mode")
    test_database_url: Optional[str] = Field(None, description="Test database URL")
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


class DevelopmentSettings(Settings):
    """Development environment settings."""
    
    environment: str = "development"
    debug: bool = True
    reload: bool = True
    database_echo: bool = True
    log_level: str = "DEBUG"


class ProductionSettings(Settings):
    """Production environment settings."""
    
    environment: str = "production"
    debug: bool = False
    reload: bool = False
    database_echo: bool = False
    log_level: str = "INFO"
    
    # Override for production security
    allowed_origins: List[str] = Field(
        default=[],  # Must be explicitly set
        description="Allowed CORS origins"
    )


class TestingSettings(Settings):
    """Testing environment settings."""
    
    environment: str = "testing"
    testing: bool = True
    debug: True
    database_url: str = "sqlite+aiosqlite:///./test.db"
    redis_url: str = "redis://localhost:6379/15"  # Different Redis DB for testing


@lru_cache()
def get_settings() -> Settings:
    """Get application settings with caching."""
    import os
    
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()


# Global settings instance
settings = get_settings()
