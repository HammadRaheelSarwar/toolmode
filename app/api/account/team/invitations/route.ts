import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/admin";
import { getActivePlan } from "../../../../../lib/team.server";
import { checkRateLimit } from "../../../../../lib/rate-limit.server";

const schema = z.object({ email: z.string().trim().email().max(254), role: z.enum(["admin", "member"]).default("member") });

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and team role." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  if (email === user.email?.toLowerCase()) return NextResponse.json({ error: "You are already a member of this workspace." }, { status: 409 });
  const rate = await checkRateLimit(request, "team-invite", 10, 86400, `user:${user.id}`);
  if (!rate.allowed) return NextResponse.json({ error: "Invitation limit reached. Try again tomorrow." }, { status: 429 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Team management is not configured." }, { status: 503 });
  const { data: membership } = await admin.from("team_members").select("workspace_id,role").eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) return NextResponse.json({ error: "Workspace owner or admin access required." }, { status: 403 });
  const { data: workspace } = await admin.from("team_workspaces").select("owner_user_id").eq("id", membership.workspace_id).maybeSingle();
  const plan = workspace?.owner_user_id ? await getActivePlan(admin, workspace.owner_user_id) : await getActivePlan(admin, user.id);
  const cap = Number(plan.team_members) || 0;
  if (cap < 2) return NextResponse.json({ error: "The workspace owner needs an active Business plan to invite members." }, { status: 403 });
  const [{ count: memberCount }, { data: existingInvitation }] = await Promise.all([
    admin.from("team_members").select("user_id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    admin.from("team_invitations").select("id,expires_at,accepted_at").eq("workspace_id", membership.workspace_id).eq("email", email).maybeSingle()
  ]);
  if (existingInvitation?.accepted_at) return NextResponse.json({ error: "This person is already a member." }, { status: 409 });
  if (existingInvitation && new Date(existingInvitation.expires_at) > new Date()) return NextResponse.json({ error: "An active invitation already exists for this email." }, { status: 409 });
  const { count: pendingCount } = await admin.from("team_invitations").select("id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id).is("accepted_at", null).gt("expires_at", new Date().toISOString());
  if ((memberCount || 0) + (pendingCount || 0) >= cap) return NextResponse.json({ error: `This workspace has reached its ${cap}-member plan limit.` }, { status: 409 });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const invitation = { workspace_id: membership.workspace_id, email, role: parsed.data.role, token_hash: createHash("sha256").update(token).digest("hex"), expires_at: expiresAt, created_by: user.id };
  const saved = existingInvitation
    ? await admin.from("team_invitations").update(invitation).eq("id", existingInvitation.id).select("id").single()
    : await admin.from("team_invitations").insert(invitation).select("id").single();
  if (saved.error || !saved.data) return NextResponse.json({ error: "Could not create invitation." }, { status: 500 });

  const site = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const inviteUrl = `${site}/dashboard/team?invite=${token}`;
  const redirectTo = `${site}/auth/callback?next=${encodeURIComponent(`/dashboard/team?invite=${token}`)}`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo, data: { toolmodeon_workspace_invitation: saved.data.id } });
  return NextResponse.json({ invitation: { id: saved.data.id, email, role: parsed.data.role, expires_at: expiresAt, invite_url: inviteUrl, email_request_accepted: !inviteError, mail_error: inviteError ? "Supabase did not send an email; share the invitation URL with the invited person." : null } }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = z.object({ invitation_id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invitation." }, { status: 400 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Team management is not configured." }, { status: 503 });
  const { data: membership } = await admin.from("team_members").select("workspace_id,role").eq("user_id", user.id).maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role)) return NextResponse.json({ error: "Workspace owner or admin access required." }, { status: 403 });
  const { error } = await admin.from("team_invitations").delete().eq("id", parsed.data.invitation_id).eq("workspace_id", membership.workspace_id).is("accepted_at", null);
  if (error) return NextResponse.json({ error: "Could not revoke invitation." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
