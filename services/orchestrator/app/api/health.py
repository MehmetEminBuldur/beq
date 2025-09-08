"""
Health check endpoints for the BeQ Orchestrator Service.

This module provides health check endpoints for monitoring
and service discovery purposes.
"""

import asyncio
import time
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, HTTPException
import httpx
import structlog

from ..core.config import get_settings

router = APIRouter()
logger = structlog.get_logger(__name__)
settings = get_settings()

# Track service start time
_start_time = time.time()


@router.get("/", response_model=Dict[str, Any])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "beq-orchestrator",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": int(time.time() - _start_time)
    }


@router.get("/live", response_model=Dict[str, Any])
async def liveness_check():
    """Kubernetes liveness probe endpoint."""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ready", response_model=Dict[str, Any])
async def readiness_check():
    """Kubernetes readiness probe endpoint."""
    
    # Check dependencies
    dependencies_status = await check_dependencies()
    
    all_healthy = all(
        dep["status"] == "healthy" 
        for dep in dependencies_status.values()
    )
    
    if not all_healthy:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "dependencies": dependencies_status,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return {
        "status": "ready",
        "dependencies": dependencies_status,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/detailed", response_model=Dict[str, Any])
async def detailed_health_check():
    """Detailed health check with dependency status."""
    
    # Check dependencies
    dependencies_status = await check_dependencies()
    
    # Calculate overall status
    all_healthy = all(
        dep["status"] == "healthy" 
        for dep in dependencies_status.values()
    )
    
    overall_status = "healthy" if all_healthy else "degraded"
    
    # Get system metrics
    try:
        import psutil
        cpu_percent = psutil.cpu_percent(interval=1)
        memory_info = psutil.virtual_memory()
        memory_percent = memory_info.percent
    except ImportError:
        cpu_percent = None
        memory_percent = None
        logger.warning("psutil not available, system metrics disabled")
    
    return {
        "status": overall_status,
        "service": "beq-orchestrator",
        "version": "0.1.0",
        "environment": settings.environment,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": int(time.time() - _start_time),
        "dependencies": dependencies_status,
        "system_metrics": {
            "cpu_usage_percent": cpu_percent,
            "memory_usage_percent": memory_percent
        },
        "configuration": {
            "database_configured": bool(settings.database_url),
            "redis_configured": bool(settings.redis_url),
            "ai_configured": bool(settings.openai_api_key or settings.anthropic_api_key),
            "debug_mode": settings.debug
        }
    }


async def check_dependencies() -> Dict[str, Dict[str, Any]]:
    """Check the health of all service dependencies."""
    
    dependencies = {}
    
    # Check database
    dependencies["database"] = await check_database()
    
    # Check Redis
    dependencies["redis"] = await check_redis()
    
    # Check external services
    dependencies["scheduler_service"] = await check_service(
        settings.scheduler_service_url, "scheduler"
    )
    dependencies["rag_service"] = await check_service(
        settings.rag_service_url, "rag-recommender"
    )
    dependencies["calendar_service"] = await check_service(
        settings.calendar_service_url, "calendar-integration"
    )
    
    return dependencies


async def check_database() -> Dict[str, Any]:
    """Check database connectivity."""
    try:
        # TODO: Implement actual database connection check
        # For now, return healthy if URL is configured
        if settings.database_url:
            return {
                "status": "healthy",
                "response_time_ms": 0,
                "message": "Database connection configured"
            }
        else:
            return {
                "status": "unhealthy",
                "response_time_ms": 0,
                "message": "Database URL not configured"
            }
    except Exception as e:
        logger.error("Database health check failed", exc_info=e)
        return {
            "status": "unhealthy",
            "response_time_ms": 0,
            "message": f"Database connection failed: {str(e)}"
        }


async def check_redis() -> Dict[str, Any]:
    """Check Redis connectivity."""
    try:
        # TODO: Implement actual Redis connection check
        # For now, return healthy if URL is configured
        if settings.redis_url:
            return {
                "status": "healthy",
                "response_time_ms": 0,
                "message": "Redis connection configured"
            }
        else:
            return {
                "status": "unhealthy",
                "response_time_ms": 0,
                "message": "Redis URL not configured"
            }
    except Exception as e:
        logger.error("Redis health check failed", exc_info=e)
        return {
            "status": "unhealthy",
            "response_time_ms": 0,
            "message": f"Redis connection failed: {str(e)}"
        }


async def check_service(service_url: str, service_name: str) -> Dict[str, Any]:
    """Check external service health."""
    start_time = time.time()
    
    try:
        timeout = httpx.Timeout(5.0)  # 5 second timeout
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{service_url}/health")
            
        response_time_ms = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            return {
                "status": "healthy",
                "response_time_ms": response_time_ms,
                "message": f"{service_name} service is healthy"
            }
        else:
            return {
                "status": "unhealthy",
                "response_time_ms": response_time_ms,
                "message": f"{service_name} returned status {response.status_code}"
            }
            
    except httpx.TimeoutException:
        response_time_ms = int((time.time() - start_time) * 1000)
        return {
            "status": "unhealthy",
            "response_time_ms": response_time_ms,
            "message": f"{service_name} service timeout"
        }
    except httpx.ConnectError:
        response_time_ms = int((time.time() - start_time) * 1000)
        return {
            "status": "unhealthy",
            "response_time_ms": response_time_ms,
            "message": f"{service_name} service unreachable"
        }
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"{service_name} health check failed", exc_info=e)
        return {
            "status": "unhealthy",
            "response_time_ms": response_time_ms,
            "message": f"{service_name} health check failed: {str(e)}"
        }
