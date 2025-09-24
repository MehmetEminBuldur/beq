"""
Supabase client for BeQ Orchestrator.
"""

import os
from typing import Optional
from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")

    # Create client with service role key to bypass RLS for backend operations
    client = create_client(supabase_url, supabase_key)
    
    # Disable RLS for service role operations
    client.auth.set_session = lambda x: None
    
    return client


# Global client instance
supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create global Supabase client instance."""
    global supabase_client
    if supabase_client is None:
        supabase_client = get_supabase_client()
    return supabase_client