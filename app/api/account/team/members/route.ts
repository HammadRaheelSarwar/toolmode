import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/admin";
import { getActivePlan } from "../../../../../lib/team.server";

const schema = z.object({ user_id: z.string().uuid(), role: z.enum(["admin", "member"]).optional() }).refine(value => value.role !== undefined);
const deleteSchema = z.object({ user_id: z.string().uuid() });

async function context() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const admin = getSupabaseAdminClient();
  if (!admin) return { error: NextResponse.json({ error: "Team management is not configured." }, { status: 503 }) };
  const { data: membership } = await admin.from("team_members").select("workspace_id,role").eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) return { error: NextResponse.json({ error: "Workspace owner or admin access required." }, { status: 403 }) };
  const { data: workspace } = await admin.from("team_workspaces").select("owner_user_id").eq("id", membership.workspace_id).maybeSingle();
  const plan = workspace?.owner_user_id ? await getActivePlan(admin, workspace.owner_user_id) : null;
  if (!plan || Number(plan.team_members) < 2) return { error: NextResponse.json({ error: "The workspace owner needs an active Business plan." }, { status: 403 }) };
  return { admin, user, membership };
}

export async function PATCH(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid member role." }, { status: 400 });
  if (parsed.data.user_id === ctx.user.id) return NextResponse.json({ error: "You cannot change your own workspace role." }, { status: 409 });
  const { data: target } = await ctx.admin.from("team_members").select("user_id,role").eq("workspace_id", ctx.membership.workspace_id).eq("user_id", parsed.data.user_id).maybeSingle();
  if (!target || target.role === "owner") return NextResponse.json({ error: "Workspace owner or member not found." }, { status: 404 });
  if (ctx.membership.role !== "owner" && target.role === "admin") return NextResponse.json({ error: "Only the workspace owner can change an admin role." }, { status: 403 });
  const { error } = await ctx.admin.from("team_members").update({ role: parsed.data.role }).eq("workspace_id", ctx.membership.workspace_id).eq("user_id", parsed.data.user_id);
  if (error) return NextResponse.json({ error: "Could not update member role." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid workspace member." }, { status: 400 });
  if (parsed.data.user_id === ctx.user.id && ctx.membership.role === "owner") return NextResponse.json({ error: "Transfer workspace ownership before leaving as the owner." }, { status: 409 });
  const { data: target } = await ctx.admin.from("team_members").select("user_id,role").eq("workspace_id", ctx.membership.workspace_id).eq("user_id", parsed.data.user_id).maybeSingle();
  if (!target || target.role === "owner") return NextResponse.json({ error: "Workspace owner or member not found." }, { status: 404 });
  if (ctx.membership.role !== "owner" && target.role === "admin") return NextResponse.json({ error: "Only the workspace owner can remove an admin." }, { status: 403 });
  const { error } = await ctx.admin.from("team_members").delete().eq("workspace_id", ctx.membership.workspace_id).eq("user_id", parsed.data.user_id);
  if (error) return NextResponse.json({ error: "Could not remove member." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
