import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { CSS } from "./styles";

type Mode = "login" | "signup";

/* ---------------------------------------------------------------------
   AUTH STATE HOOK — tracks the current Supabase user across the app.
--------------------------------------------------------------------- */
export function useAuthUser(): { user: User | null; checking: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, checking };
}

export function signOutUser(): Promise<void> {
  return supabase.auth.signOut().then(() => undefined);
}

function friendlyAuthError(e: unknown): string {
  const message = (e as { message?: string } | null)?.message || "";
  if (/invalid login credentials/i.test(message)) {
    return "Incorrect email or password.";
  }
  if (/user already registered/i.test(message)) {
    return "An account already exists with that email. Try signing in instead.";
  }
  if (/password should be at least/i.test(message)) {
    return "Password should be at least 6 characters.";
  }
  if (/unable to validate email address|invalid.*email/i.test(message)) {
    return "That email address doesn't look right.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email address before signing in (check your inbox).";
  }
  return "Something went wrong. Please try again.";
}

/* ---------------------------------------------------------------------
   LOGIN / SIGNUP SCREEN — shown whenever there is no signed-in user.
--------------------------------------------------------------------- */
export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    setNotice("");
    if (!email.trim() || !password) { setError("Enter an email and password."); return; }
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
        // onAuthStateChanged in useAuthUser picks up the signed-in user from here.
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) throw signUpErr;
        // If your Supabase project has "Confirm email" enabled, there will
        // be no session yet — the user needs to click the emailed link
        // before useAuthUser sees them as signed in.
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      }
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="jst-app">
      <style>{CSS}</style>
      <style>{AUTH_CSS}</style>
      <div className="jst-auth-screen">
        <div className="jst-auth-card">
          <span className="jst-eyebrow">Job search</span>
          <h1 className="jst-auth-title">Command Center</h1>
          <p className="jst-auth-sub">{mode === "login" ? "Sign in to your tracker" : "Create your tracker account"}</p>

          <div className="jst-form jst-auth-form">
            <label className="jst-field jst-field-full">
              <span className="jst-field-label">Email</span>
              <input
                type="email"
                value={email}
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </label>
            <label className="jst-field jst-field-full">
              <span className="jst-field-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </label>

            {error && <div className="jst-form-error jst-field-full">{error}</div>}
            {notice && !error && <div className="jst-field-full jst-auth-notice">{notice}</div>}

            <div className="jst-field-full jst-auth-actions">
              <button type="button" className="jst-btn-primary" disabled={submitting} onClick={submit}>
                {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
              <button
                type="button"
                className="jst-btn-ghost"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}
              >
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AUTH_CSS = `
.jst-auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.jst-auth-card { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 36px 32px; width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.06); }
.jst-auth-title { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; margin: 2px 0 6px; }
.jst-auth-sub { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 22px; }
.jst-auth-form { display: flex; flex-direction: column; gap: 14px; }
.jst-auth-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.jst-auth-actions .jst-btn-primary, .jst-auth-actions .jst-btn-ghost { width: 100%; justify-content: center; }
.jst-auth-notice { font-size: 13px; color: var(--ink-soft); background: var(--surface-soft, rgba(0,0,0,0.03)); border-radius: 8px; padding: 8px 10px; }
`;