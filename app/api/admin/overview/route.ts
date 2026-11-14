import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "../../../../lib/admin.server";

const rangeSchema = z.object({ from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }) });

export async function GET(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(request.url);
  const now = new Date();
  let from = new Date(now.getTime() - 30 * 86400000);
  let to = now;
  const preset = url.searchParams.get("range") || "30d";
  if (preset === "today") from = new Date(now.getTime() - 86400000);
  else if (["7d", "30d", "90d"].includes(preset)) from = new Date(now.getTime() - Number(preset.slice(0, -1)) * 86400000);
  else if (preset === "custom") {
    const parsed = rangeSchema.safeParse({ from: url.searchParams.get("from"), to: url.searchParams.get("to") });
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid custom date range." }, { status: 400 });
    from = new Date(parsed.data.from); to = new Date(parsed.data.to);
    if (to <= from || to.getTime() - from.getTime() > 366 * 86400000 || to > new Date(Date.now() + 86400000)) {
      return NextResponse.json({ error: "Custom analytics ranges must be valid and no longer than 366 days." }, { status: 400 });
    }
  } else if (preset !== "today") return NextResponse.json({ error: "Choose a supported date range." }, { status: 400 });

  const since = from.toISOString();
  const until = to.toISOString();
  const [snapshot, users, processing, ai] = await Promise.all([
    access.admin.rpc("admin_dashboard_snapshot", { p_since: since, p_until: until }),
    access.admin.from("profiles").select("id,full_name,created_at").gte("created_at", since).lt("created_at", until).order("created_at", { ascending: false }).limit(8),
    access.admin.from("processing_history").select("user_id,tool_slug,status,processed_at").gte("processed_at", since).lt("processed_at", until).order("processed_at", { ascending: false }).limit(10),
    access.admin.from("ai_generation_logs").select("user_id,tool_slug,status,created_at").gte("created_at", since).lt("created_at", until).order("created_at", { ascending: false }).limit(10)
  ]);
  if (snapshot.error || users.error || processing.error || ai.error) return NextResponse.json({ error: "Admin analytics are unavailable. Apply the Phase 6 database migration." }, { status: 503 });
  const recentActivity = [
    ...(processing.data || []).map(item => ({ user_id: item.user_id, tool_slug: item.tool_slug, event_type: `processing_${item.status}`, created_at: item.processed_at })),
    ...(ai.data || []).map(item => ({ user_id: item.user_id, tool_slug: item.tool_slug, event_type: `ai_${item.status}`, created_at: item.created_at }))
  ].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,10);
  return NextResponse.json({ ...snapshot.data, recentUsers: users.data || [], recentActivity, range: { from: since, to: until, preset } }, { headers: { "Cache-Control": "no-store" } });
}
