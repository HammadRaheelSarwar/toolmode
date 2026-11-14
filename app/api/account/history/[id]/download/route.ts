import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../../../lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "File is unavailable." }, { status: 404 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: row } = await supabase.from("processing_history").select("output_storage_path,output_expires_at,output_filename").eq("id", id).maybeSingle();
  if (!row?.output_storage_path || (row.output_expires_at && new Date(row.output_expires_at).getTime() <= Date.now())) return NextResponse.json({ error: "This output has expired or was deleted." }, { status: 404 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Secure file downloads are not configured." }, { status: 503 });
  const { data, error } = await admin.storage.from("project-outputs").createSignedUrl(row.output_storage_path, 60, { download: row.output_filename || true });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "This output has expired or was deleted." }, { status: 404 });
  return NextResponse.redirect(data.signedUrl, 302);
}
