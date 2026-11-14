import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabasePublicConfig } from "../../../../lib/supabase/env";
import { checkRateLimit } from "../../../../lib/rate-limit.server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";

const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256), remember: z.boolean().default(false) });

export async function POST(request: Request) {
  const config = getSupabasePublicConfig();
  if (!config) return NextResponse.json({ error: "Authentication is not configured yet. Set the Supabase URL and anon key." }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 4096) return NextResponse.json({ error: "Sign-in request is too large." }, { status: 413 });
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const [ipLimit,emailLimit]=await Promise.all([checkRateLimit(request,"login-ip",30,900),checkRateLimit(request,"login-email",10,900,`email:${parsed.data.email.toLowerCase()}`)]);
  if(!ipLimit.allowed||!emailLimit.allowed)return NextResponse.json({error:"Too many sign-in attempts. Wait a few minutes and try again."},{status:429});
  const store = await cookies();
  const supabase = createServerClient(config.url, config.anonKey, {
    cookieOptions: { maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => {
            const cookieOptions = { ...options };
            if (parsed.data.remember) cookieOptions.maxAge = 60 * 60 * 24 * 365;
            else { delete cookieOptions.maxAge; delete cookieOptions.expires; }
            store.set(name, value, cookieOptions);
          });
        } catch { /* Route handlers can persist cookies; this is a defensive fallback. */ }
      }
    }
  });
  const { data: signedIn, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return NextResponse.json({ error: "Email or password is incorrect, or the account still needs verification." }, { status: 401 });
  if(signedIn.user){const admin=getSupabaseAdminClient();if(admin){const {data:membership}=await admin.from("admin_users").select("user_id").eq("user_id",signedIn.user.id).maybeSingle();if(membership)await admin.from("admin_audit_logs").insert({actor_user_id:signedIn.user.id,action:"admin.login",target_type:"admin_user",target_id:signedIn.user.id,detail:{method:"password"}});}}
  store.set("toolmodeon_remember", parsed.data.remember ? "1" : "0", {
    path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" || new URL(request.url).protocol === "https:",
    ...(parsed.data.remember ? { maxAge: 60 * 60 * 24 * 365 } : {})
  });
  return NextResponse.json({ signedIn: true });
}
