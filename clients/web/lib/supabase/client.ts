import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase Client Debug (Browser):');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'undefined');
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase environment variables: URL=${!!supabaseUrl}, Key=${!!supabaseAnonKey}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
