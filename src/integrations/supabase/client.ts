import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSupabaseBrowserConfig } from '@/lib/supabaseClientConfig';

const { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISHABLE_KEY } = getSupabaseBrowserConfig();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});