"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, signInWithGoogle } from "@/lib/supabase";

/**
 * Gates the entire app behind Google sign-in. Renders a login screen when there
 * is no session, and the app once the user is authenticated. Listens for auth
 * changes so the OAuth redirect (and sign-out) update the UI without a reload.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign-in failed:", err);
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="font-mono text-sm text-white/40">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-5xl font-light tracking-tight mb-3">Curriculearn</h1>
          <div className="h-px w-24 bg-white/20 mx-auto mb-6" />
          <p className="text-sm text-white/40 mb-10">
            Sign in to save your classes and lessons across devices.
          </p>
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
          >
            {signingIn ? "Redirecting…" : "Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
