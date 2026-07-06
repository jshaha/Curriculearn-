"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// A single browser client. The anonymous session is persisted in localStorage,
// so a visitor keeps the same user_id (and their data) across reloads.
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "curriculearn-auth",
  },
});

let authPromise: Promise<string> | null = null;

/**
 * Ensures there is a session (signing in anonymously if needed) and returns the
 * current user id. Safe to call repeatedly — the sign-in only happens once.
 */
export async function ensureAuth(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  if (!authPromise) {
    authPromise = (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) return session.user.id;

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return data.user!.id;
    })();
  }
  return authPromise;
}
