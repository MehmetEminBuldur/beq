"""
Supabase client for BeQ Orchestrator.
"""

import os
from typing import Optional
from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")

    return create_client(supabase_url, supabase_key)


# Global client instance
supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create global Supabase client instance."""
    global supabase_client
    if supabase_client is None:
        supabase_client = get_supabase_client()
    return supabase_client