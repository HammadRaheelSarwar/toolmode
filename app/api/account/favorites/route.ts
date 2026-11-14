import { NextResponse } from "next/server";
import { z } from "zod";
import { tools } from "../../../../lib/tools";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

const toolSchema = z.object({ tool_slug: z.string().refine((slug) => tools.some((tool) => tool.slug === slug)) });

async function authenticatedClient() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("favorites").select("tool_slug,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load favorites." }, { status: 500 });
  return NextResponse.json({ favorites: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = toolSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  const { error } = await supabase.from("favorites").upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id,tool_slug" });
  if (error) return NextResponse.json({ error: "Could not save favorite." }, { status: 500 });
  return NextResponse.json({ favorite: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = toolSchema.safeParse({ tool_slug: new URL(request.url).searchParams.get("tool_slug") });
  if (!parsed.success) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("tool_slug", parsed.data.tool_slug);
  if (error) return NextResponse.json({ error: "Could not remove favorite." }, { status: 500 });
  return NextResponse.json({ favorite: false });
}
