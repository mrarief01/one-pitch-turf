import { createClient } from "@supabase/supabase-js";

/**
 * Server-only database client. The SQL migration exposes only the narrowly
 * scoped RPC functions used by the booking APIs; never put a service-role key
 * in NEXT_PUBLIC_* variables.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured. Add the Supabase URL and publishable key to .env.local.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
