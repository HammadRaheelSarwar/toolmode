import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/admin.server";

const filterSchema = z.object({ from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() });

export async function GET(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(request.url); const status = url.searchParams.get("status") || "all"; const query = (url.searchParams.get("q") || "").replace(/[^a-zA-Z0-9@._+\-\s]/g, "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1));
  if (!["all", "completed", "partially_refunded", "refunded", "past_due", "canceled"].includes(status)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  const dates = filterSchema.safeParse({ from: url.searchParams.get("from") || undefined, to: url.searchParams.get("to") || undefined });
  if (!dates.success || (dates.data.from && dates.data.to && dates.data.from >= dates.data.to)) return NextResponse.json({ error: "Invalid payment date range." }, { status: 400 });
  let userIds: string[] = [];
  if (query.includes("@")) {
    const { data: matches, error } = await access.admin.from("admin_user_directory").select("user_id").ilike("email", `%${query}%`).limit(100);
    if (error) return NextResponse.json({ error: "Could not search payment accounts." }, { status: 503 });
    userIds = (matches || []).map(row => row.user_id);
    if (!userIds.length) return NextResponse.json({ payments: [], events: [], page, count: 0, hasNext: false });
  }
  let requestQuery = access.admin.from("payments").select("id,user_id,subscription_id,provider_transaction_id,provider_subscription_id,amount_cents,refunded_amount_cents,currency,status,invoice_number,occurred_at", { count: "exact" }).order("occurred_at", { ascending: false });
  if (status !== "all") requestQuery = requestQuery.eq("status", status);
  if (dates.data.from) requestQuery = requestQuery.gte("occurred_at", dates.data.from);
  if (dates.data.to) requestQuery = requestQuery.lt("occurred_at", dates.data.to);
  if (userIds.length) requestQuery = requestQuery.in("user_id", userIds);
  if (query && !query.includes("@")) requestQuery = requestQuery.or(`provider_transaction_id.ilike.%${query}%,provider_subscription_id.ilike.%${query}%,invoice_number.ilike.%${query}%`);
  const { data: payments, error, count } = await requestQuery.range((page - 1) * 50, page * 50 - 1);
  if (error) return NextResponse.json({ error: "Could not load verified payment records." }, { status: 503 });
  const userList = Array.from(new Set((payments || []).map(row => row.user_id)));
  const transactionIds = new Set((payments || []).flatMap(row => [row.provider_transaction_id, row.provider_subscription_id].filter(Boolean)));
  const [users, plans, eventRows, attempts] = await Promise.all([
    userList.length ? access.admin.from("admin_user_directory").select("user_id,email,full_name").in("user_id", userList) : Promise.resolve({ data: [], error: null }),
    payments?.length ? access.admin.from("subscriptions").select("id,plan_key").in("id", payments.map(row => row.subscription_id).filter(Boolean) as string[]) : Promise.resolve({ data: [], error: null }),
    access.admin.from("payment_webhook_events").select("notification_id,event_type,occurred_at,processed_at,payload").order("occurred_at", { ascending: false }).limit(500),
    access.admin.from("payment_webhook_attempts").select("notification_id,outcome").order("received_at", { ascending: false }).limit(1000)
  ]);
  if (users.error || plans.error || eventRows.error || attempts.error) return NextResponse.json({ error: "Could not load payment details and webhook status." }, { status: 503 });
  const eventList = (eventRows.data || []).map(row => {
    const payload = row.payload as Record<string, unknown>;
    const data = (payload?.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
    const reference = String(data.id || data.transaction_id || data.subscription_id || "");
    return { notification_id: row.notification_id, event_type: row.event_type, occurred_at: row.occurred_at, processed_at: row.processed_at, reference };
  }).filter(row => transactionIds.has(row.reference));
  const counts = new Map<string, number>(); for (const attempt of attempts.data || []) counts.set(attempt.notification_id, (counts.get(attempt.notification_id) || 0) + (attempt.outcome === "duplicate" ? 1 : 0));
  const result = (payments || []).map(row => ({ ...row,
    account: users.data?.find(user => user.user_id === row.user_id) || null,
    plan_key: plans.data?.find(subscription => subscription.id === row.subscription_id)?.plan_key || null
  }));
  return NextResponse.json({ payments: result, events: eventList.map(event => ({ ...event, duplicate_attempts: counts.get(event.notification_id) || 0 })), page, count: count || 0, hasNext: page * 50 < (count || 0) }, { headers: { "Cache-Control": "no-store" } });
}
