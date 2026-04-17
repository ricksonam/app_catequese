// Supabase client — iCatequese
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Prefer the legacy JWT anon key (full JWT) over the publishable key
// as it has full SDK compatibility for auth flows
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[iCatequese] CRÍTICO: Chaves do Supabase ausentes! Verifique as variáveis de ambiente.");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-app-name': 'iCatequese' },
  },
  db: {
    schema: 'public',
  },
});