import { createClient } from "@supabase/supabase-js";

// Extend ImportMeta typing for Vite env variables used in this file
declare global {
  interface ImportMeta {
    readonly env: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
  }
}

// Supabase project config — the URL + anon key are safe to keep in client
// source (same trust model as the old Firebase web config). Real access
// control happens via Supabase Auth + the Row Level Security policies on
// the `trackers` table (see supabase_schema.sql in the project root).
//
// Set these in a `.env` file at the project root (Vite reads anything
// prefixed with VITE_):
//   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
//   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev rather than silently making requests to "undefined".
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Add them to your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);