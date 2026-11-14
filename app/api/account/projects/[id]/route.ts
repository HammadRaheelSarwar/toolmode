import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/admin";
import { getSupabaseServerClient } from "../../../../../lib/supabase/server";

const updateSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(500).optional().default("") });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid project name." }, { status: 400 });
  const { data, error } = await supabase.from("projects").update(parsed.data).eq("id", id).select("id,name,description,updated_at").single();
  if (error || !data) return NextResponse.json({ error: "Could not update that project." }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: project } = await supabase.from("projects").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const { data: files, error: listError } = await supabase.from("project_files").select("storage_path,storage_provider").eq("project_id", id).not("storage_path", "is", null);
  if (listError) return NextResponse.json({ error: "Could not prepare project deletion." }, { status: 500 });
  const paths = (files || []).map((file) => file.storage_path).filter((path): path is string => Boolean(path));
  if ((files || []).some(file => file.storage_provider !== "supabase")) return NextResponse.json({ error: "This project contains files from a storage provider that is not available for deletion here." }, { status: 503 });
  if (paths.length) {
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Secure project deletion is not configured." }, { status: 503 });
    const { error: storageError } = await admin.storage.from("project-outputs").remove(paths);
    if (storageError) return NextResponse.json({ error: "Could not remove the project's saved files. The project was kept." }, { status: 500 });
  }
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Saved files were removed, but the project record could not be deleted. Please retry." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
