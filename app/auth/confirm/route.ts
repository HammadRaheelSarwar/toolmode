import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/dashboard";
  const supabase = await getSupabaseServerClient();
  if (!supabase || !tokenHash || !(type === "signup" || type === "recovery" || type === "email" || type === "email_change" || type === "invite" || type === "magiclink")) return NextResponse.redirect(new URL("/login?error=verification_failed", url.origin));
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return NextResponse.redirect(new URL(error ? "/login?error=verification_failed" : safeNext, url.origin));
}
