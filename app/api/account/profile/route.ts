import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

const profileSchema = z.object({ full_name: z.string().trim().min(1).max(100), avatar_url: z.string().url().max(500).optional().nullable() });

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("id,full_name,avatar_url,created_at,updated_at").eq("id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  return NextResponse.json({ profile: data || { id: user.id, full_name: user.user_metadata.full_name || "", avatar_url: null, created_at: user.created_at } });
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a full name up to 100 characters." }, { status: 400 });
  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } });
  if (authError) return NextResponse.json({ error: "Could not update account metadata." }, { status: 400 });
  const { data, error } = await supabase.from("profiles").upsert({ id: user.id, ...parsed.data }).select("id,full_name,avatar_url,created_at,updated_at").single();
  if (error) return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  return NextResponse.json({ profile: data });
}
