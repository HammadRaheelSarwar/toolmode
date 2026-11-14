import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [notifications, unread] = await Promise.all([
    supabase.from("account_notifications").select("id,kind,title,body,href,created_at,read_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("account_notifications").select("id", { count: "exact", head: true }).is("read_at", null)
  ]);
  if (notifications.error || unread.error) return NextResponse.json({ error: "Could not load notifications." }, { status: 503 });
  return NextResponse.json({ notifications: notifications.data || [], unread: unread.count || 0 }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
  const { data, error } = await supabase.from("account_notifications").update({ read_at: new Date().toISOString() }).eq("id", parsed.data.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not mark notification as read." }, { status: 503 });
  if (!data) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
