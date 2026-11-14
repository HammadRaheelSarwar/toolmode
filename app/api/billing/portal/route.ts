import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";
import { paddleApiBaseUrl, liveBillingEnabled } from "../../../../lib/paddle.server";
import { checkRateLimit } from "../../../../lib/rate-limit.server";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const rate = await checkRateLimit(request, "billing-portal", 10, 300, `user:${user.id}`);
  if (!rate.allowed) return NextResponse.json({ error: "Too many billing requests. Try again shortly." }, { status: 429 });
  if (!liveBillingEnabled()) return NextResponse.json({ error: "Live subscription management is disabled until seller approval is verified." }, { status: 503 });
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Paddle management is not configured." }, { status: 503 });
  const { data: subscription } = await supabase.from("subscriptions").select("provider_customer_id,provider_subscription_id").eq("user_id", user.id).not("provider_customer_id", "is", null).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!subscription?.provider_customer_id) return NextResponse.json({ error: "No Paddle customer is linked to this account." }, { status: 404 });
  const response = await fetch(`${paddleApiBaseUrl()}/customers/${encodeURIComponent(subscription.provider_customer_id)}/portal-sessions`, {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(subscription.provider_subscription_id ? { subscription_ids: [subscription.provider_subscription_id] } : {}), cache: "no-store", signal: AbortSignal.timeout(15000)
  }).catch(() => null);
  if (!response?.ok) return NextResponse.json({ error: "Paddle could not create a management link. Try again shortly." }, { status: 502 });
  const payload = await response.json().catch(() => null);
  const urls = payload?.data?.urls;
  const link = urls?.subscriptions?.[0]?.view_subscription || urls?.general?.overview;
  if (!link) return NextResponse.json({ error: "Paddle returned no customer portal link." }, { status: 502 });
  const parsed = new URL(link);
  if (parsed.protocol !== "https:" || !(parsed.hostname === "paddle.com" || parsed.hostname.endsWith(".paddle.com"))) return NextResponse.json({ error: "Paddle returned an invalid customer portal URL." }, { status: 502 });
  return NextResponse.json({ url: link }, { headers: { "Cache-Control": "no-store" } });
}
