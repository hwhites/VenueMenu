// ./utils/supabase/server.ts

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase credentials for server client. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

export function createClient() {
  return createSupabaseClient(
    supabaseUrl!, // FIX APPLIED: Non-null assertion (!) ensures TypeScript accepts it as 'string'
    supabaseServiceRoleKey!, // FIX APPLIED: Non-null assertion (!)
    {
      auth: {
        persistSession: false, 
      },
    }
  );
}