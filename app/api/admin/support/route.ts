import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAdminAudit } from "../../../../lib/admin.server";

const statuses = ["open", "in_progress", "waiting_on_user", "resolved", "closed"] as const;
const patchSchema = z.object({ ticket_id: z.string().uuid(), status: z.enum(statuses).optional(), message: z.string().trim().min(1).max(10000).optional(), internal_note: z.string().trim().min(1).max(10000).optional(), assigned_to: z.string().uuid().nullable().optional() }).refine(value => value.status || value.message || value.internal_note || value.assigned_to !== undefined);

export async function GET(request: Request) {
  const access = await requireAdmin(["admin", "super_admin", "support_manager"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(request.url); const status = url.searchParams.get("status") || "all"; const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (status !== "all" && !statuses.includes(status as typeof statuses[number])) return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
  let query = access.admin.from("support_tickets").select("*").order("updated_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data: tickets, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: "Could not load support queue." }, { status: 503 });
  const rows = tickets || []; const ids = rows.map(ticket => ticket.id); const userIds = Array.from(new Set(rows.map(ticket => ticket.user_id)));
  const [messages, notes, profiles, staff] = await Promise.all([
    ids.length ? access.admin.from("support_messages").select("id,ticket_id,author_user_id,is_admin,body,created_at").in("ticket_id", ids).order("created_at") : Promise.resolve({ data: [], error: null }),
    ids.length ? access.admin.from("support_ticket_notes").select("id,ticket_id,author_user_id,body,created_at").in("ticket_id", ids).order("created_at") : Promise.resolve({ data: [], error: null }),
    userIds.length ? access.admin.from("admin_user_directory").select("user_id,email,full_name").in("user_id", userIds) : Promise.resolve({ data: [], error: null }),
    access.admin.from("admin_users").select("user_id,role")
  ]);
  if (messages.error || notes.error || profiles.error || staff.error) return NextResponse.json({ error: "Could not load ticket history. Apply the Phase 6 migration." }, { status: 503 });
  return NextResponse.json({ tickets: rows.filter(ticket => !q || `${ticket.subject} ${ticket.category} ${profiles.data?.find(p => p.user_id === ticket.user_id)?.email || ""} ${profiles.data?.find(p => p.user_id === ticket.user_id)?.full_name || ""}`.toLowerCase().includes(q.toLowerCase())).map(ticket => ({
    ...ticket, user_email: profiles.data?.find(p => p.user_id === ticket.user_id)?.email || "", full_name: profiles.data?.find(p => p.user_id === ticket.user_id)?.full_name || "",
    messages: (messages.data || []).filter(item => item.ticket_id === ticket.id), notes: (notes.data || []).filter(item => item.ticket_id === ticket.id)
  })), staff: staff.data || [] });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(["admin", "super_admin", "support_manager"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add a valid status change, reply, note or staff assignment." }, { status: 400 });
  const value = parsed.data;
  const { data: ticket, error: ticketError } = await access.admin.from("support_tickets").select("id,user_id,subject").eq("id", value.ticket_id).maybeSingle();
  if (ticketError || !ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  if (value.assigned_to) {
    const { data: member } = await access.admin.from("admin_users").select("user_id").eq("user_id", value.assigned_to).maybeSingle();
    if (!member) return NextResponse.json({ error: "Assign tickets to a current staff account." }, { status: 400 });
  }
  if (value.status || value.assigned_to !== undefined) {
    const update: Record<string, unknown> = {};
    if (value.status) update.status = value.status;
    if (value.assigned_to !== undefined) update.assigned_to = value.assigned_to;
    const { error } = await access.admin.from("support_tickets").update(update).eq("id", value.ticket_id);
    if (error) return NextResponse.json({ error: "Could not update ticket." }, { status: 500 });
  }
  if (value.message) {
    const { error } = await access.admin.from("support_messages").insert({ ticket_id: value.ticket_id, author_user_id: access.user.id, is_admin: true, body: value.message });
    if (error) return NextResponse.json({ error: "Could not send support reply." }, { status: 500 });
    const { error: notificationError } = await access.admin.from("account_notifications").insert({
      user_id: ticket.user_id, event_key: `support:${value.ticket_id}:${crypto.randomUUID()}`, kind: "support",
      title: "A support reply is available", body: `ToolModeOn support replied to “${ticket.subject}”.`, href: "/dashboard/support", metadata: { ticket_id: value.ticket_id }
    });
    if (notificationError) console.error("Support notification write failed", { code: notificationError.code });
  }
  if (value.internal_note) {
    const { error } = await access.admin.from("support_ticket_notes").insert({ ticket_id: value.ticket_id, author_user_id: access.user.id, body: value.internal_note });
    if (error) return NextResponse.json({ error: "Could not save internal note." }, { status: 500 });
  }
  const audit = await writeAdminAudit(access.admin, access.user.id, "support.ticket_updated", "support_ticket", value.ticket_id, { status: value.status || null, assigned: value.assigned_to !== undefined, replied: Boolean(value.message), internalNote: Boolean(value.internal_note) });
  if (audit.error) return NextResponse.json({ error: "Ticket was updated, but the audit entry failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
