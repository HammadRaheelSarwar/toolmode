import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../../../lib/supabase/admin";
import { hasExpectedFileContent } from "../../../../../../lib/file-validation";
import { checkRateLimit } from "../../../../../../lib/rate-limit.server";

const bucket = "project-outputs";
const bucketLimitBytes = 4 * 1024 * 1024;
const allowedMime = new Set(["application/pdf", "text/plain", "text/csv", "application/json", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const rate = await checkRateLimit(request, "project-file-upload", 20, 3600, `user:${user.id}`);
  if (!rate.allowed) return NextResponse.json({ error: "Too many file uploads. Please try again later." }, { status: 429 });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > bucketLimitBytes + 256 * 1024) return NextResponse.json({ error: "Upload request is too large." }, { status: 413 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Secure project file storage is not configured." }, { status: 503 });
  const { data: uploadSetting, error: settingError } = await admin.from("system_settings").select("value").eq("setting_key", "storage.max_upload_bytes").maybeSingle();
  if (settingError) return NextResponse.json({ error: "Upload policy could not be verified." }, { status: 503 });
  const configuredLimit = Number(uploadSetting?.value ?? bucketLimitBytes);
  const maxBytes = Math.max(1024 * 1024, Math.min(bucketLimitBytes, Number.isFinite(configuredLimit) ? configuredLimit : bucketLimitBytes));
  const form = await request.formData().catch(() => null);
  const input = form?.get("file");
  if (!(input instanceof File)) return NextResponse.json({ error: "Choose a result file to save." }, { status: 400 });
  if (input.size > maxBytes) return NextResponse.json({ error: `Saved files are limited to ${(maxBytes / 1024 / 1024).toFixed(0)} MB.` }, { status: 413 });
  const mimeType = input.type.split(";")[0].trim().toLowerCase();
  if (!allowedMime.has(mimeType)) return NextResponse.json({ error: "This file type cannot be saved to a project." }, { status: 415 });
  const content = new Uint8Array(await input.arrayBuffer());
  if (!hasExpectedFileContent(mimeType, content)) return NextResponse.json({ error: "The file contents do not match the selected file type, or the file is invalid." }, { status: 415 });
  const historyId = form?.get("history_id");
  if (historyId && (typeof historyId !== "string" || !z.string().uuid().safeParse(historyId).success)) return NextResponse.json({ error: "Invalid history reference." }, { status: 400 });
  const cleanName = input.name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-180) || "result";
  const storagePath = `${user.id}/${id}/${crypto.randomUUID()}-${cleanName}`;
  const reservation = await admin.rpc("reserve_project_file", {
    p_uploader_id: user.id, p_project_id: id, p_history_id: typeof historyId === "string" ? historyId : null,
    p_file_name: cleanName, p_mime_type: mimeType, p_size_bytes: input.size, p_storage_path: storagePath, p_storage_provider: "supabase"
  });
  if (reservation.error) return NextResponse.json({ error: "Could not verify your plan and storage allowance." }, { status: 503 });
  if (!reservation.data?.ok) {
    const messages: Record<string, string> = {
      project_not_found: "Project not found.", project_access: "You do not have access to this project.", billing_owner_missing: "The project storage owner could not be verified.",
      paid_plan_required: "Saved cloud storage is available on paid plans.", storage_not_configured: "Storage is not configured for this plan.",
      file_too_large: "This file is larger than your plan allows.", storage_limit: "This file would exceed your storage allowance.", history_not_found: "That history entry is unavailable.", duplicate_storage_path: "Could not reserve this file path. Try again."
    };
    const reason = String(reservation.data?.reason || "");
    return NextResponse.json({ error: messages[reason] || "This file cannot be saved with the current account settings.", limit: reservation.data?.limit || undefined }, { status: reason === "paid_plan_required" ? 403 : reason === "file_too_large" || reason === "storage_limit" ? 413 : reason === "project_not_found" ? 404 : 403 });
  }
  const fileId = String(reservation.data.file_id);
  const { error: uploadError } = await admin.storage.from(bucket).upload(storagePath, input, { contentType: mimeType, upsert: false });
  if (uploadError) {
    await admin.from("project_files").delete().eq("id", fileId);
    if (typeof historyId === "string") await admin.from("processing_history").update({ output_storage_path: null, output_size_bytes: null, output_expires_at: null }).eq("id", historyId).eq("user_id", user.id);
    return NextResponse.json({ error: "Could not upload this project file. The reservation was removed." }, { status: 500 });
  }
  return NextResponse.json({ file: { id: fileId, file_name: cleanName, mime_type: mimeType, size_bytes: input.size, created_at: new Date().toISOString() } }, { status: 201 });
}
