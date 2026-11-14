import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAdminAudit } from "../../../../lib/admin.server";

const actionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("retry_cleanup"), target: z.enum(["saved_document", "processing_history"]), id: z.string().uuid() }),
  z.object({ kind: z.literal("upload_limit"), value: z.number().int().min(1024 * 1024).max(4 * 1024 * 1024) })
]);

export async function GET() {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const now = new Date().toISOString();
  const [snapshot, plans, failedFiles, dueFiles, histories, settings] = await Promise.all([
    access.admin.rpc("admin_storage_snapshot", { p_now: now }),
    access.admin.from("plan_entitlements").select("plan_key,name,max_file_bytes,storage_limit_bytes").order("sort_order"),
    access.admin.from("project_files").select("id,user_id,billing_owner_user_id,file_name,mime_type,size_bytes,grace_period_ends_at,storage_provider,cleanup_attempts,cleanup_error").not("cleanup_error", "is", null).order("cleanup_error", { ascending: false }).limit(100),
    access.admin.from("project_files").select("id,user_id,billing_owner_user_id,file_name,mime_type,size_bytes,grace_period_ends_at,storage_provider,cleanup_attempts,cleanup_error").lte("grace_period_ends_at", now).order("grace_period_ends_at").limit(100),
    access.admin.from("processing_history").select("id,user_id,tool_slug,status,output_filename,output_size_bytes,retention_expires_at,output_storage_provider,cleanup_attempts,cleanup_error,output_storage_path").not("output_storage_path", "is", null).order("retention_expires_at").limit(200),
    access.admin.from("system_settings").select("value").eq("setting_key", "storage.max_upload_bytes").maybeSingle()
  ]);
  if (snapshot.error || plans.error || failedFiles.error || dueFiles.error || histories.error || settings.error) return NextResponse.json({ error: "Storage data is unavailable. Apply the Phase 6 migration." }, { status: 503 });
  const historyRows = histories.data || [];
  const paths = historyRows.map(row => row.output_storage_path).filter(Boolean) as string[];
  const linked = paths.length ? await access.admin.from("project_files").select("storage_path").in("storage_path", paths) : { data: [] as Array<{ storage_path: string }>, error: null };
  if (linked.error) return NextResponse.json({ error: "Could not check saved-file ownership references." }, { status: 503 });
  const linkedPaths = new Set((linked.data || []).map(row => row.storage_path));
  const fileRows = [...(failedFiles.data || []), ...(dueFiles.data || [])];
  const directoryIds = Array.from(new Set([...fileRows.map(row => row.billing_owner_user_id || row.user_id), ...historyRows.map(row => row.user_id)].filter(Boolean)));
  const directory = directoryIds.length ? await access.admin.from("admin_user_directory").select("user_id,email").in("user_id", directoryIds) : { data: [] as Array<{ user_id: string; email: string }>, error: null };
  if (directory.error) return NextResponse.json({ error: "Could not load storage account details." }, { status: 503 });
  const formatFile = (row: Record<string, unknown>) => ({ ...row, account_email: directory.data?.find(item => item.user_id === (row.billing_owner_user_id || row.user_id))?.email || "", storage_path: undefined });
  const temporaryFiles = historyRows.filter(row => !linkedPaths.has(row.output_storage_path)).map(row => ({
    id: row.id, user_id: row.user_id, account_email: directory.data?.find(item => item.user_id === row.user_id)?.email || "",
    tool_slug: row.tool_slug, status: row.status, output_filename: row.output_filename, output_size_bytes: row.output_size_bytes,
    retention_expires_at: row.retention_expires_at, provider: row.output_storage_provider, cleanup_attempts: row.cleanup_attempts, cleanup_error: row.cleanup_error
  }));
  const rawMax = settings.data?.value;
  const configuredMax = Number(rawMax && typeof rawMax === "object" && "value" in rawMax ? (rawMax as { value: unknown }).value : rawMax) || 4 * 1024 * 1024;
  const maxUploadBytes = Math.min(4 * 1024 * 1024, configuredMax);
  return NextResponse.json({ snapshot: snapshot.data, plans: (plans.data || []).map(plan => ({ ...plan, max_file_bytes: Math.min(Number(plan.max_file_bytes), maxUploadBytes) })), failedFiles: (failedFiles.data || []).map(formatFile), dueFiles: (dueFiles.data || []).map(formatFile), temporaryFiles, maxUploadBytes, r2Configured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY && process.env.CLOUDFLARE_R2_BUCKET) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid storage operation." }, { status: 400 });
  const action = parsed.data;
  if (action.kind === "upload_limit") {
    const { error } = await access.admin.from("system_settings").upsert({ setting_key: "storage.max_upload_bytes", value: action.value, updated_by: access.user.id }, { onConflict: "setting_key" });
    if (error) return NextResponse.json({ error: "Could not save the upload limit." }, { status: 500 });
    const audit = await writeAdminAudit(access.admin, access.user.id, "storage.upload_limit_updated", "system_setting", "storage.max_upload_bytes", { value: action.value });
    if (audit.error) return NextResponse.json({ error: "Upload limit saved, but the audit entry failed." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();
  if (action.target === "saved_document") {
    const { data: file, error } = await access.admin.from("project_files").select("id,user_id,processing_history_id,storage_path,storage_provider,grace_period_ends_at,cleanup_error").eq("id", action.id).maybeSingle();
    if (error || !file) return NextResponse.json({ error: "Saved file not found." }, { status: 404 });
    if ((!file.cleanup_error && (!file.grace_period_ends_at || file.grace_period_ends_at > now))) return NextResponse.json({ error: "This file is not due for deletion." }, { status: 409 });
    if (file.storage_provider === "r2") return NextResponse.json({ error: "Cloudflare R2 is not configured in this build, so this item cannot be retried here." }, { status: 503 });
    if (file.storage_path) {
      const { error: removeError } = await access.admin.storage.from("project-outputs").remove([file.storage_path]);
      if (removeError) {
        await access.admin.from("project_files").update({ cleanup_attempts: 1, cleanup_error: "Supabase Storage removal failed", cleanup_locked_at: null }).eq("id", action.id);
        return NextResponse.json({ error: "Storage could not remove this object. The retry failure was recorded." }, { status: 503 });
      }
    }
    if (file.processing_history_id) await access.admin.from("processing_history").update({ output_storage_path: null, output_size_bytes: null, output_expires_at: null, cleanup_error: null, cleanup_locked_at: null }).eq("id", file.processing_history_id);
    const { error: deleteError } = await access.admin.from("project_files").delete().eq("id", action.id);
    if (deleteError) return NextResponse.json({ error: "Object was removed, but the saved-file record could not be cleared." }, { status: 500 });
  } else {
    const { data: history, error } = await access.admin.from("processing_history").select("id,output_storage_path,output_storage_provider,retention_expires_at,cleanup_error").eq("id", action.id).maybeSingle();
    if (error || !history) return NextResponse.json({ error: "Processing history item not found." }, { status: 404 });
    if (!history.cleanup_error && (!history.retention_expires_at || history.retention_expires_at > now)) return NextResponse.json({ error: "This history item is not due for cleanup." }, { status: 409 });
    if (history.output_storage_provider === "r2") return NextResponse.json({ error: "Cloudflare R2 is not configured in this build, so this item cannot be retried here." }, { status: 503 });
    if (history.output_storage_path) {
      const { data: references, error: referenceError } = await access.admin.from("project_files").select("id").eq("storage_path", history.output_storage_path).limit(1);
      if (referenceError) return NextResponse.json({ error: "Could not verify file ownership references." }, { status: 503 });
      if (!references?.length) {
        const { error: removeError } = await access.admin.storage.from("project-outputs").remove([history.output_storage_path]);
        if (removeError) {
          await access.admin.from("processing_history").update({ cleanup_attempts: 1, cleanup_error: "Supabase Storage removal failed", cleanup_locked_at: null }).eq("id", action.id);
          return NextResponse.json({ error: "Storage could not remove this object. The retry failure was recorded." }, { status: 503 });
        }
      }
    }
    const { error: updateError } = await access.admin.from("processing_history").update({ output_storage_path: null, output_size_bytes: null, output_expires_at: null, cleanup_error: null, cleanup_locked_at: null }).eq("id", action.id);
    if (updateError) return NextResponse.json({ error: "Object was removed, but history cleanup status could not be updated." }, { status: 500 });
  }
  const audit = await writeAdminAudit(access.admin, access.user.id, "storage.cleanup_retried", action.target, action.id, { outcome: "completed" });
  if (audit.error) return NextResponse.json({ error: "Cleanup completed, but the audit entry failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
