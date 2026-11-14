import { NextResponse } from "next/server";
import { z } from "zod";
import { tools } from "../../../../lib/tools";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { checkRateLimit } from "../../../../lib/rate-limit.server";
import type { SupabaseClient } from "@supabase/supabase-js";

const bodySchema = z.object({
  tool_slug: z.string().refine(slug => tools.some(tool => tool.slug === slug)), request_id: z.string().uuid(),
  status: z.enum(["completed", "failed"]), original_filename: z.string().max(255).optional().nullable(),
  output_filename: z.string().max(255).optional().nullable(), output_mime_type: z.string().max(100).optional().nullable(),
  output_size_bytes: z.number().int().nonnegative().max(5 * 1024 * 1024 * 1024).optional().nullable()
});
const paidStatuses = ["active", "trialing", "past_due", "canceled"];

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const historyDays = await getHistoryDays(supabase, user.id);
  if (historyDays <= 0) return NextResponse.json({ history: [] });
  const cutoff = new Date(Date.now() - historyDays * 86400000).toISOString();
  const { data, error } = await supabase.from("processing_history").select("id,tool_slug,status,original_filename,output_filename,output_mime_type,output_size_bytes,output_storage_path,output_expires_at,processed_at").gte("processed_at", cutoff).order("processed_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load processing history." }, { status: 500 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Secure history downloads are not configured." }, { status: 503 });
  const history = await Promise.all((data || []).map(async row => {
    const expired = Boolean(row.output_expires_at && new Date(row.output_expires_at).getTime() <= Date.now());
    if (!row.output_storage_path || expired) return { ...withoutStoragePath(row), download_available: false };
    const { data: signed, error: signedError } = await admin.storage.from("project-outputs").createSignedUrl(row.output_storage_path, 60);
    return { ...withoutStoragePath(row), download_available: !signedError && Boolean(signed?.signedUrl) };
  }));
  return NextResponse.json({ history });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const rate = await checkRateLimit(request, "history-entry", 100, 3600, `user:${user.id}`);
  if (!rate.allowed) return NextResponse.json({ error: "Too many history updates. Please try again later." }, { status: 429 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid processing history entry." }, { status: 400 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Secure processing history is not configured." }, { status: 503 });
  const isAi = tools.find(tool => tool.slug === parsed.data.tool_slug)?.category === "AI";
  const [usage, aiReservation] = await Promise.all([
    admin.from("usage_events").select("id").eq("user_id", user.id).eq("request_id", parsed.data.request_id).eq("tool_slug", parsed.data.tool_slug).eq("event_type", "tool_run").maybeSingle(),
    isAi ? admin.from("ai_generation_reservations").select("status").eq("user_id", user.id).eq("request_id", parsed.data.request_id).eq("tool_slug", parsed.data.tool_slug).maybeSingle() : Promise.resolve({ data: null, error: null })
  ]);
  if (usage.error || aiReservation.error) return NextResponse.json({ error: "Could not verify this processing request." }, { status: 503 });
  if (!usage.data && !aiReservation.data) return NextResponse.json({ error: "This processing request was not reserved by the server." }, { status: 403 });
  const historyDays = await getHistoryDays(admin, user.id);
  if (historyDays <= 0) return NextResponse.json({ recorded: false, reason: "history_not_included" }, { status: 201 });
  const { data, error } = await admin.from("processing_history").insert({ ...parsed.data, user_id: user.id, retention_expires_at: new Date(Date.now() + historyDays * 86400000).toISOString() }).select("id").single();
  if (error) return NextResponse.json({ error: "Could not record tool activity." }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

async function getHistoryDays(client: SupabaseClient, userId: string) {
  const { data: subscriptions } = await client.from("subscriptions").select("plan_key,status,current_period_ends_at,updated_at").eq("user_id", userId).in("status", paidStatuses).order("updated_at", { ascending: false }).limit(10);
  const { data: plans } = await client.from("plan_entitlements").select("plan_key,history_days,is_active,trials_enabled");
  const now = Date.now();
  const subscription = (subscriptions || []).find(item => {
    const plan = plans?.find(entry => entry.plan_key === item.plan_key);
    return Boolean(plan?.is_active && (!item.current_period_ends_at || new Date(item.current_period_ends_at).getTime() > now) && (item.status !== "trialing" || plan.trials_enabled));
  });
  return plans?.find(plan => plan.plan_key === subscription?.plan_key)?.history_days || 0;
}

function withoutStoragePath<T extends { output_storage_path?: unknown }>(row: T) {
  const { output_storage_path: _hidden, ...safe } = row;
  return safe;
}
