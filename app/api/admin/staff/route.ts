import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../../../../lib/admin.server";

const roles = ["super_admin", "admin", "support_manager", "content_manager"] as const;
const setSchema = z.object({ user_id: z.string().uuid(), role: z.enum(roles) });
const removeSchema = z.object({ user_id: z.string().uuid() });

export async function GET() {
  const access = await requireAdmin(["super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { data: members, error } = await access.admin.from("admin_users").select("user_id,role,created_at").order("created_at");
  if (error) return NextResponse.json({ error: "Could not load administrator access." }, { status: 503 });
  const ids = (members || []).map(member => member.user_id);
  const { data: users, error: directoryError } = ids.length ? await access.admin.from("admin_user_directory").select("user_id,email,full_name,created_at,last_sign_in_at").in("user_id", ids) : { data: [], error: null };
  if (directoryError) return NextResponse.json({ error: "Could not load staff account details." }, { status: 503 });
  return NextResponse.json({ staff: (members || []).map(member => ({ ...member, account: users?.find(user => user.user_id === member.user_id) || null })) });
}

export async function POST(request: Request) {
  const access = await requireAdmin(["super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = setSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid account and role." }, { status: 400 });
  return setRole(access.admin, access.user.id, parsed.data.user_id, parsed.data.role);
}

export async function PUT(request: Request) {
  const access = await requireAdmin(["super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ email: z.string().trim().email().max(254), role: z.enum(roles) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter an existing account email and a valid role." }, { status: 400 });
  const { data: user, error } = await access.admin.from("admin_user_directory").select("user_id").ilike("email", parsed.data.email).maybeSingle();
  if (error || !user) return NextResponse.json({ error: "No registered account matches that email." }, { status: 404 });
  return setRole(access.admin, access.user.id, user.user_id, parsed.data.role);
}

export async function DELETE(request: Request) {
  const access = await requireAdmin(["super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = removeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid staff account." }, { status: 400 });
  return setRole(access.admin, access.user.id, parsed.data.user_id, null);
}

async function setRole(admin: SupabaseClient, actor: string, target: string, role: typeof roles[number] | null) {
  const { data, error } = await admin.rpc("admin_set_user_role", { p_actor_id: actor, p_user_id: target, p_role: role });
  if (error) return NextResponse.json({ error: "Could not update administrator role." }, { status: 503 });
  if (!data?.ok) {
    const messages: Record<string, string> = { last_super_admin: "At least one super administrator must remain.", cannot_change_self: "Use another super administrator to change your own role.", actor_not_super_admin: "Super administrator access is required.", invalid_role: "Invalid administrator role." };
    return NextResponse.json({ error: messages[data?.reason] || "This role change is not allowed." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
