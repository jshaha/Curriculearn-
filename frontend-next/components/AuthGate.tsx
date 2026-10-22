"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, signInAsGuest, signInWithGoogle } from "@/lib/supabase";

/**
 * Ensures there is a Supabase session before rendering the app. Visitors with
 * no session get a guest (anonymous) session automatically so the demo opens
 * with no sign-up step; the sign-in screen only appears if that fails.
 * Listens for auth changes so the OAuth redirect and sign-out update the UI.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guestAttempted = useRef(false);

  const startGuest = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInAsGuest();
    } catch (err) {
      console.error("Guest sign-in failed:", err);
      setError("Couldn't start a guest session. Try again or sign in with Google.");
      setLoading(false);
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      // Don't create a guest while returning from the Google OAuth redirect.
      const oauthReturn = /[?&#](code|access_token)=/.test(window.location.href);
      if (!data.session && !oauthReturn && !guestAttempted.current) {
        guestAttempted.current = true;
        void startGuest();
        return;
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleGoogle = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign-in failed:", err);
      setSigningIn(false);
    }
  };

  if (session) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="font-mono text-sm text-white/40">Setting up your demo…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-5xl font-light tracking-tight mb-3">Curriculearn</h1>
        <div className="h-px w-24 bg-white/20 mx-auto mb-6" />
        <p className="text-sm text-white/40 mb-10">
          {error ?? "Try the demo as a guest, or sign in to keep your lessons across devices."}
        </p>
        <div className="space-y-3">
          <button
            onClick={startGuest}
            disabled={signingIn}
            className="w-full bg-white px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {signingIn ? "Starting…" : "Continue as guest"}
          </button>
          <button
            onClick={handleGoogle}
            disabled={signingIn}
            className="w-full border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
