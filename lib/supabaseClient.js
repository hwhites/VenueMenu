// lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Both variables are correctly prefixed for client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// FIX APPLIED: Add a runtime check to ensure credentials exist before calling createClient.
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Supabase URL or Anon Key not defined. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
}

// Both variables are required here and are guaranteed to be strings by the check above.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);