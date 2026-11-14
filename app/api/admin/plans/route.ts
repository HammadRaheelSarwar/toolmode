import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAdminAudit } from "../../../../lib/admin.server";

const schema = z.object({
  plan_key: z.enum(["free", "pro", "business"]), name: z.string().min(1).max(60), description: z.string().max(300),
  monthly_price_cents: z.number().int().min(0).max(100000000), yearly_price_cents: z.number().int().min(0).max(100000000),
  monthly_paddle_price_id: z.string().regex(/^pri_[a-z\d]{26}$/i).or(z.literal("")).nullable(), yearly_paddle_price_id: z.string().regex(/^pri_[a-z\d]{26}$/i).or(z.literal("")).nullable(),
  monthly_tool_runs: z.number().int().min(0).max(10000000), ai_credits: z.number().int().min(0).max(10000000), max_file_bytes: z.number().int().min(0).max(5368709120),
  max_batch_files: z.number().int().min(1).max(1000), history_days: z.number().int().min(0).max(3650), api_requests: z.number().int().min(0).max(10000000), team_members: z.number().int().min(0).max(1000),
  access_period_days: z.number().int().min(1).max(366), document_grace_days: z.number().int().min(0).max(90), storage_limit_bytes: z.number().int().min(0).max(536870912000).nullable(), ai_requests_per_minute: z.number().int().min(1).max(600),
  ads_enabled: z.boolean(), priority: z.enum(["standard", "priority"]), trials_enabled: z.boolean(), is_active: z.boolean()
});

export async function GET() {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { data, error } = await access.admin.from("plan_entitlements").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: "Could not load plan settings." }, { status: 503 });
  return NextResponse.json({ plans: data || [] });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan settings." }, { status: 400 });
  const values = { ...parsed.data, monthly_paddle_price_id: parsed.data.monthly_paddle_price_id || null, yearly_paddle_price_id: parsed.data.yearly_paddle_price_id || null };
  const { data: previous, error: readError } = await access.admin.from("plan_entitlements").select("plan_key,monthly_price_cents,yearly_price_cents,history_days,access_period_days,document_grace_days,storage_limit_bytes,max_file_bytes,ai_credits,ai_requests_per_minute,is_active").eq("plan_key", values.plan_key).maybeSingle();
  if (readError || !previous) return NextResponse.json({ error: "Could not read current plan settings." }, { status: 503 });
  const { error } = await access.admin.from("plan_entitlements").update(values).eq("plan_key", values.plan_key);
  if (error) return NextResponse.json({ error: "Could not update plan settings." }, { status: 500 });
  const audit = await writeAdminAudit(access.admin, access.user.id, "plan.updated", "plan", values.plan_key, {
    previous: { monthly_price_cents: previous.monthly_price_cents, yearly_price_cents: previous.yearly_price_cents, history_days: previous.history_days, access_period_days: previous.access_period_days, document_grace_days: previous.document_grace_days, storage_limit_bytes: previous.storage_limit_bytes, max_file_bytes: previous.max_file_bytes, ai_credits: previous.ai_credits, ai_requests_per_minute: previous.ai_requests_per_minute, is_active: previous.is_active },
    updated: { monthly_price_cents: values.monthly_price_cents, yearly_price_cents: values.yearly_price_cents, history_days: values.history_days, access_period_days: values.access_period_days, document_grace_days: values.document_grace_days, storage_limit_bytes: values.storage_limit_bytes, max_file_bytes: values.max_file_bytes, ai_credits: values.ai_credits, ai_requests_per_minute: values.ai_requests_per_minute, is_active: values.is_active }
  });
  if (audit.error) return NextResponse.json({ error: "Plan settings saved, but the audit entry failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
