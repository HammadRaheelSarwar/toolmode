"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const credentials = z.object({ email: z.string().trim().email("Enter a valid email address."), password: z.string().min(1, "Enter your password.") });
const fieldClass = "mt-2 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function Login() {
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const googleEnabled = process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED === "true";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("next") || "/dashboard";
    setNextPath(requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\") ? requested : "/dashboard");
    if (params.get("error") === "verification_failed") setError("That verification link is invalid or has expired. Request a fresh link and try again.");
    if (params.get("error") === "auth_callback_failed") setError("Sign-in link could not be verified. Please try again.");
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your email and password."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...parsed.data, remember }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not sign in.");
      window.location.assign(nextPath);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign in."); setBusy(false); }
  }

  async function googleLogin() {
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Authentication is not configured yet."); return; }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` } });
    if (oauthError) setError(oauthError.message);
  }

  return <main className="bg-pale"><div className="mx-auto flex min-h-[680px] max-w-md items-center px-5 py-16"><div className="w-full rounded-3xl border border-line bg-white p-7 shadow-soft sm:p-9"><div className="flex items-center gap-2 text-brand"><Sparkles size={19}/><span className="text-sm font-extrabold">Welcome back</span></div><h1 className="mt-4 text-3xl font-black">Log in to ToolModeOn</h1><p className="mt-3 text-sm leading-6 text-muted">Pick up where you left off.</p>
    {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error} {error.toLowerCase().includes("verification") && <Link href="/verify-email" className="ml-1 underline">Resend verification email</Link>}</p>}
    <form onSubmit={submit} className="mt-7 grid gap-4"><label className="text-sm font-bold">Email address<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} placeholder="you@example.com"/></label><label className="text-sm font-bold">Password<span className="relative mt-2 block"><input required autoComplete="current-password" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} mt-0 pr-12`} placeholder="Your password"/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted">{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label><div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-xs font-semibold text-muted"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-brand"/> Remember me</label><Link href="/forgot-password" className="text-xs font-bold text-brand">Forgot password?</Link></div><button disabled={busy} className="gradient-bg mt-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Signing in…" : <>Log in <ArrowRight size={16}/></>}</button></form>
    {googleEnabled && <><div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line"/>or continue with<span className="h-px flex-1 bg-line"/></div><button onClick={googleLogin} className="w-full rounded-xl border border-line px-4 py-3 text-sm font-bold hover:bg-pale">Continue with Google</button></>}
    <p className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">New here? <Link href="/register" className="font-bold text-brand">Create an account</Link></p></div></div></main>;
}
