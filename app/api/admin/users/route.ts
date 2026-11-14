import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAdminAudit } from "../../../../lib/admin.server";

const changeSchema = z.object({ user_id: z.string().uuid(), status: z.enum(["active", "suspended"]), reason: z.string().trim().max(500).optional() });

export async function GET(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(request.url);
  const page = Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1));
  const query = (url.searchParams.get("q") || "").replace(/[^a-zA-Z0-9@._+\-\s]/g, "").trim().slice(0, 100);
  const plan = url.searchParams.get("plan") || "all";
  const status = url.searchParams.get("status") || "all";
  if (!(["all", "free", "pro", "business"].includes(plan)) || !(["all", "active", "suspended"].includes(status))) {
    return NextResponse.json({ error: "Invalid user filters." }, { status: 400 });
  }
  const { data, error } = await access.admin.rpc("admin_user_directory_page", {
    p_query: query || null, p_plan: plan, p_status: status, p_page: page, p_per_page: 50
  });
  if (error) return NextResponse.json({ error: "Could not load users. Apply the Phase 6 database migration." }, { status: 503 });
  const rows = data || [];
  const count = Number(rows[0]?.total_count || 0);
  return NextResponse.json({ users: rows.map((row: Record<string, unknown>) => ({
    id: row.user_id, email: row.email, full_name: row.full_name, created_at: row.created_at,
    last_sign_in_at: row.last_sign_in_at, email_confirmed: row.email_confirmed,
    access: { status: row.access_status, reason: row.access_reason }, plan: row.plan_key,
    subscription_status: row.subscription_status, subscription_ends_at: row.subscription_ends_at,
    usage_30d: row.usage_30d, storage_bytes: row.storage_bytes
  })), page, count, hasNext: page * 50 < count });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid account status update." }, { status: 400 });
  const values = parsed.data;
  if (values.user_id === access.user.id && values.status === "suspended") return NextResponse.json({ error: "You cannot suspend your own administrator account." }, { status: 400 });
  const { error } = await access.admin.from("user_access").upsert({
    user_id: values.user_id, status: values.status,
    reason: values.status === "suspended" ? (values.reason || "Suspended by an administrator") : null,
    updated_by: access.user.id
  }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Could not update account status." }, { status: 500 });
  const audit = await writeAdminAudit(access.admin, access.user.id, `user.${values.status}`, "user", values.user_id, { reason: values.reason || null });
  if (audit.error) return NextResponse.json({ error: "Account status changed, but the audit entry could not be recorded." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
