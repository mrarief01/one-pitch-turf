import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Supabase is not configured. Add the Supabase URL and publishable key to .env.local.",
  );
}

export const supabaseBrowser = createClient(url, key);
