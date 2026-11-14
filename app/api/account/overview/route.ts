import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [recent, activityCount, favoritesCount, projectsCount] = await Promise.all([
    supabase.from("processing_history").select("id,tool_slug,status,original_filename,output_filename,output_storage_path,output_expires_at,processed_at").order("processed_at", { ascending: false }).limit(6),
    supabase.from("processing_history").select("id", { count: "exact", head: true }).gte("processed_at", cutoff),
    supabase.from("favorites").select("tool_slug", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true })
  ]);
  if (recent.error || activityCount.error || favoritesCount.error || projectsCount.error) return NextResponse.json({ error: "Could not load account overview." }, { status: 500 });
  return NextResponse.json({ recent: recent.data || [], toolsUsedThisMonth: activityCount.count || 0, favoritesCount: favoritesCount.count || 0, projectsCount: projectsCount.count || 0 });
}
