/**
 * lib/supabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase client for LingoVibe.
 *
 * Works in:
 *   • Client Components  ("use client" pages — browser)
 *   • Server Components  (Next.js App Router server side)
 *   • API Route Handlers (app/api/**)
 *
 * Import in any file:
 *   import { supabase } from '@/lib/supabase';
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[LingoVibe] ⚠️  Supabase credentials are missing.\n' +
    'Make sure .env.local contains:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://dhsaunoaqmizpqukcpfl.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>'
  );
}

/**
 * A single shared Supabase client instance.
 * Auth state (sessions, tokens) is persisted in localStorage automatically
 * when running in the browser.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // keep session across page reloads
    autoRefreshToken: true,        // refresh JWT before it expires
    detectSessionInUrl: true,      // handle OAuth / magic-link redirects
  },
});
