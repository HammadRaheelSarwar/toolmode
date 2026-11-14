import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../../lib/admin.server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const [directory, accessRow, subscriptions, payments, usage, files, history, ai] = await Promise.all([
    access.admin.from("admin_user_directory").select("user_id,email,full_name,created_at,last_sign_in_at,email_confirmed_at").eq("user_id", id).maybeSingle(),
    access.admin.from("user_access").select("status,reason,updated_at").eq("user_id", id).maybeSingle(),
    access.admin.from("subscriptions").select("id,plan_key,status,current_period_starts_at,current_period_ends_at,grace_period_ends_at,cancel_at_period_end,billing_interval").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    access.admin.from("payments").select("id,provider_transaction_id,subscription_id,amount_cents,refunded_amount_cents,currency,status,invoice_number,occurred_at").eq("user_id", id).order("occurred_at", { ascending: false }).limit(50),
    access.admin.from("usage_events").select("tool_slug,event_type,units,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
    access.admin.from("project_files").select("id,file_name,mime_type,size_bytes,created_at,grace_period_ends_at,cleanup_error").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
    access.admin.from("processing_history").select("id,tool_slug,status,original_filename,output_filename,output_mime_type,output_size_bytes,processed_at,retention_expires_at").eq("user_id", id).order("processed_at", { ascending: false }).limit(100),
    access.admin.from("ai_generation_logs").select("tool_slug,status,input_chars,output_chars,latency_ms,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(100)
  ]);
  if (directory.error || !directory.data) return NextResponse.json({ error: "Could not find that account." }, { status: 404 });
  if ([accessRow, subscriptions, payments, usage, files, history, ai].some(result => result.error)) return NextResponse.json({ error: "Could not load the account history." }, { status: 503 });
  return NextResponse.json({
    user: { ...directory.data, email_confirmed: Boolean(directory.data.email_confirmed_at), email_confirmed_at: undefined },
    access: accessRow.data || { status: "active", reason: null },
    subscriptions: subscriptions.data || [], payments: payments.data || [], usage: usage.data || [],
    files: files.data || [], processingHistory: history.data || [], ai: ai.data || []
  }, { headers: { "Cache-Control": "no-store" } });
}
