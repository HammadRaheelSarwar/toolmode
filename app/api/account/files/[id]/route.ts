import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../../lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "File not found." }, { status: 404 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: file, error } = await supabase.from("project_files").select("id,file_name,storage_path,mime_type").eq("id", id).maybeSingle();
  if (error || !file?.storage_path) return NextResponse.json({ error: "Saved file is unavailable." }, { status: 404 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Secure file downloads are not configured." }, { status: 503 });
  const { data, error: signedError } = await admin.storage.from("project-outputs").createSignedUrl(file.storage_path, 60, { download: file.file_name });
  if (signedError || !data?.signedUrl) return NextResponse.json({ error: "Saved file is unavailable or expired." }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, 302);
}
