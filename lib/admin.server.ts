import "server-only";
import { getSupabaseAdminClient } from "./supabase/admin";
import { getSupabaseServerClient } from "./supabase/server";

export type AdminRole = "super_admin" | "admin" | "support_manager" | "content_manager";
export const ADMIN_ROLES: AdminRole[] = ["super_admin", "admin", "support_manager", "content_manager"];

export async function requireAdmin(allowed: AdminRole[] = ADMIN_ROLES) {
  const sessionClient = await getSupabaseServerClient();
  if (!sessionClient) return { ok: false as const, status: 503, error: "Supabase is not configured." };
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user || !user.email_confirmed_at) return { ok: false as const, status: 401, error: "Sign in with a verified account." };
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return { ok: false as const, status: 503, error: "Admin authorization is not configured." };
  const { data: membership, error } = await adminClient.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (error) return { ok: false as const, status: 503, error: "Admin authorization is unavailable." };
  if (!membership || !ADMIN_ROLES.includes(membership.role as AdminRole) || !allowed.includes(membership.role as AdminRole)) return { ok: false as const, status: 403, error: "Administrator access required." };
  return { ok: true as const, user, role: membership.role as AdminRole, admin: adminClient };
}

export async function writeAdminAudit(admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, actorId: string, action: string, targetType: string, targetId?: string, detail: Record<string, unknown> = {}) {
  return admin.from("admin_audit_logs").insert({ actor_user_id: actorId, action, target_type: targetType, target_id: targetId || null, detail });
}
