"""
Supabase client configuration for BeQ backend services.

This module provides Supabase client instances for backend services
to interact with the Supabase database and authentication.
"""

import os
from typing import Optional
from supabase import create_client, Client
import structlog

logger = structlog.get_logger(__name__)

class SupabaseClient:
    """Supabase client wrapper for backend services."""
    
    def __init__(self):
        self.url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.anon_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not self.url:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL environment variable is required")
        
        if not self.service_key:
            logger.warning("SUPABASE_SERVICE_ROLE_KEY not found, using anon key")
            if not self.anon_key:
                raise ValueError("Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
        
        # Create clients
        self._service_client: Optional[Client] = None
        self._anon_client: Optional[Client] = None
    
    @property
    def service_client(self) -> Client:
        """Get Supabase client with service role (full permissions)."""
        if self._service_client is None:
            if not self.service_key:
                raise ValueError("Service role key not available")
            
            self._service_client = create_client(self.url, self.service_key)
            logger.info("Supabase service client initialized")
        
        return self._service_client
    
    @property
    def anon_client(self) -> Client:
        """Get Supabase client with anon key (public permissions)."""
        if self._anon_client is None:
            if not self.anon_key:
                raise ValueError("Anon key not available")
            
            self._anon_client = create_client(self.url, self.anon_key)
            logger.info("Supabase anon client initialized")
        
        return self._anon_client
    
    async def verify_connection(self) -> bool:
        """Verify connection to Supabase."""
        try:
            # Test connection by fetching auth settings
            response = self.anon_client.auth.get_session()
            logger.info("Supabase connection verified")
            return True
        except Exception as e:
            logger.error("Supabase connection failed", exc_info=e)
            return False
    
    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """Get user profile from Supabase."""
        try:
            response = self.service_client.table('profiles').select('*').eq('id', user_id).single().execute()
            
            if response.data:
                return response.data
            else:
                logger.warning(f"User profile not found for user_id: {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching user profile for {user_id}", exc_info=e)
            return None
    
    async def create_user_profile(self, user_id: str, email: str, full_name: str = None) -> Optional[dict]:
        """Create a new user profile in Supabase."""
        try:
            profile_data = {
                'id': user_id,
                'email': email,
                'full_name': full_name,
                'created_at': 'now()',
                'updated_at': 'now()'
            }
            
            response = self.service_client.table('profiles').insert(profile_data).execute()
            
            if response.data:
                logger.info(f"User profile created for {user_id}")
                return response.data[0]
            else:
                logger.error(f"Failed to create user profile for {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating user profile for {user_id}", exc_info=e)
            return None
    
    async def get_user_bricks(self, user_id: str) -> list:
        """Get all bricks for a user."""
        try:
            response = self.service_client.table('bricks').select('*').eq('user_id', user_id).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error fetching bricks for user {user_id}", exc_info=e)
            return []
    
    async def create_brick(self, brick_data: dict) -> Optional[dict]:
        """Create a new brick."""
        try:
            response = self.service_client.table('bricks').insert(brick_data).execute()
            
            if response.data:
                logger.info(f"Brick created: {response.data[0]['id']}")
                return response.data[0]
            else:
                logger.error("Failed to create brick")
                return None
                
        except Exception as e:
            logger.error("Error creating brick", exc_info=e)
            return None
    
    async def get_user_events(self, user_id: str, start_date: str = None, end_date: str = None) -> list:
        """Get events for a user within a date range."""
        try:
            query = self.service_client.table('events').select('*').eq('user_id', user_id)
            
            if start_date:
                query = query.gte('start_time', start_date)
            
            if end_date:
                query = query.lte('end_time', end_date)
            
            response = query.execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error fetching events for user {user_id}", exc_info=e)
            return []
    
    async def create_event(self, event_data: dict) -> Optional[dict]:
        """Create a new event."""
        try:
            response = self.service_client.table('events').insert(event_data).execute()
            
            if response.data:
                logger.info(f"Event created: {response.data[0]['id']}")
                return response.data[0]
            else:
                logger.error("Failed to create event")
                return None
                
        except Exception as e:
            logger.error("Error creating event", exc_info=e)
            return None


# Global Supabase client instance
_supabase_client: Optional[SupabaseClient] = None

def get_supabase_client() -> SupabaseClient:
    """Get the global Supabase client instance."""
    global _supabase_client
    
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    
    return _supabase_client

# Convenience functions
async def get_user_profile(user_id: str) -> Optional[dict]:
    """Convenience function to get user profile."""
    client = get_supabase_client()
    return await client.get_user_profile(user_id)

async def create_user_profile(user_id: str, email: str, full_name: str = None) -> Optional[dict]:
    """Convenience function to create user profile."""
    client = get_supabase_client()
    return await client.create_user_profile(user_id, email, full_name)

async def get_user_bricks(user_id: str) -> list:
    """Convenience function to get user bricks."""
    client = get_supabase_client()
    return await client.get_user_bricks(user_id)

async def create_brick(brick_data: dict) -> Optional[dict]:
    """Convenience function to create brick."""
    client = get_supabase_client()
    return await client.create_brick(brick_data)
