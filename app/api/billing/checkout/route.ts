import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { liveBillingEnabled, paddleEnvironment } from "../../../../lib/paddle.server";
import { checkRateLimit } from "../../../../lib/rate-limit.server";

const schema = z.object({ plan_key: z.enum(["pro", "business"]), billing_interval: z.literal("month") });
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before choosing a paid plan." }, { status: 401 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email before subscribing." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose an available paid plan and billing interval." }, { status: 400 });
  const limit = await checkRateLimit(request, "billing-checkout", 5, 300, `user:${user.id}`);
  if (!limit.allowed) return NextResponse.json({ error: "Too many checkout attempts. Wait a few minutes and try again." }, { status: 429 });
  if (!liveBillingEnabled()) return NextResponse.json({ error: "Live checkout is disabled until seller approval and payout setup are confirmed." }, { status: 503 });
  const token = process.env.PADDLE_CLIENT_TOKEN;
  const admin = getSupabaseAdminClient();
  if (!token || !admin) return NextResponse.json({ error: "Paddle checkout is not configured. Configure the client token, service role key, and plan price IDs." }, { status: 503 });
  const { data: current } = await supabase.from("subscriptions").select("status,plan_key,current_period_ends_at").eq("user_id", user.id).in("status", ["active", "trialing", "past_due", "canceled"]).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (current && (!current.current_period_ends_at || new Date(current.current_period_ends_at).getTime() > Date.now())) return NextResponse.json({ error: "You already have a subscription. Use Manage subscription to change or cancel it." }, { status: 409 });
  const now = new Date().toISOString();
  const { error: expireError } = await admin.from("checkout_intents").update({ status: "expired" }).eq("user_id", user.id).eq("status", "pending").lte("expires_at", now);
  if (expireError) return NextResponse.json({ error: "Could not refresh an expired checkout attempt." }, { status: 503 });
  const { data: pendingIntent } = await admin.from("checkout_intents").select("id").eq("user_id", user.id).eq("status", "pending").gt("expires_at", now).limit(1).maybeSingle();
  if (pendingIntent) return NextResponse.json({ error: "A checkout is already in progress for this account. Finish it or wait for it to expire before starting another." }, { status: 409 });
  const { data: plan } = await admin.from("plan_entitlements").select("plan_key,is_active,monthly_paddle_price_id,storage_limit_bytes,monthly_price_cents,access_period_days").eq("plan_key", parsed.data.plan_key).maybeSingle();
  if (!plan?.is_active) return NextResponse.json({ error: "This plan is not currently available." }, { status: 404 });
  if (!plan.storage_limit_bytes || plan.storage_limit_bytes<=0) return NextResponse.json({ error: "Cloud storage is not available yet because an administrator has not configured this plan's approved storage allowance." }, { status: 503 });
  if (plan.access_period_days!==30) return NextResponse.json({ error: "The paid plan duration is not configured to the required 30-day period." }, { status: 503 });
  const configuredPriceId = plan.monthly_paddle_price_id;
  const priceId = configuredPriceId || process.env[parsed.data.plan_key === "pro" ? "PADDLE_PRO_MONTHLY_PRICE_ID" : "PADDLE_BUSINESS_MONTHLY_PRICE_ID"];
  if (!priceId || !/^pri_[a-z\d]{26}$/i.test(priceId)) return NextResponse.json({ error: "This 30-day plan has no configured Paddle price yet." }, { status: 503 });
  if (!configuredPriceId) {
    const { error: mappingError } = await admin.from("plan_entitlements").update({ monthly_paddle_price_id: priceId }).eq("plan_key", plan.plan_key);
    if (mappingError) return NextResponse.json({ error: "Could not save the Paddle price mapping needed to reconcile the subscription." }, { status: 503 });
  }
  const { data: intent, error } = await admin.from("checkout_intents").insert({ user_id: user.id, plan_key: plan.plan_key, billing_interval: parsed.data.billing_interval, provider_price_id: priceId }).select("id,expires_at").single();
  if (error || !intent) return NextResponse.json({ error: error?.code === "23505" ? "A checkout was started at the same time. Continue the active checkout or wait for it to expire." : "Could not prepare a secure checkout." }, { status: error?.code === "23505" ? 409 : 500 });
  return NextResponse.json({ clientToken: token, environment: paddleEnvironment(), priceId, intentId: intent.id, expiresAt: intent.expires_at, customerEmail: user.email });
}
