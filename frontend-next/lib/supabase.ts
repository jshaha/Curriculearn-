"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// A single browser client. The session is persisted in localStorage, so a
// visitor keeps the same user_id (and their data) across reloads. Guest data is
// tied to the browser; Google sign-in ties it to the account across devices.
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // handle the OAuth redirect automatically
    storageKey: "curriculearn-auth",
  },
});

/**
 * Returns the current user id (guest or Google). Throws if there is no session;
 * AuthGate creates a guest session before rendering the app, so data calls only
 * run once a user exists.
 */
export async function ensureAuth(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

/**
 * Start a guest session. Portfolio visitors get a real (anonymous) user_id so
 * row-level security still isolates their data, without a sign-up step.
 */
export async function signInAsGuest(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

/** Redirect to Google's OAuth consent screen, returning to the current origin. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/** Sign the current user out and clear the local session. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
