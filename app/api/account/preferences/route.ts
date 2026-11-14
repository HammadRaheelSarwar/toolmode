import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

const preferencesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("user_preferences").select("preferences,updated_at").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load preferences." }, { status: 500 });
  return NextResponse.json({ preferences: data?.preferences || {} });
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = preferencesSchema.safeParse((await request.json().catch(() => null))?.preferences);
  if (!parsed.success) return NextResponse.json({ error: "Preferences must be a simple key/value object." }, { status: 400 });
  const { data, error } = await supabase.from("user_preferences").upsert({ user_id: user.id, preferences: parsed.data }).select("preferences").single();
  if (error) return NextResponse.json({ error: "Could not save preferences." }, { status: 500 });
  return NextResponse.json({ preferences: data.preferences });
}
