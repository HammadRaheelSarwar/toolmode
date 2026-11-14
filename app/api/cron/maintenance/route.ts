import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const batchSize = 100;
const maxBatchesPerRun = 5;

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
type CleanupResult = { attempted: number; deleted: number; failed: number; claimFailed: boolean };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Scheduled maintenance is not configured." }, { status: 503 });
  if (!constantTimeEqual(request.headers.get("authorization") || "", `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Maintenance database access is not configured." }, { status: 503 });
  const now = new Date().toISOString();
  const maintenance = await admin.rpc("run_subscription_maintenance", { p_now: now });
  if (maintenance.error) {
    console.error("Scheduled subscription maintenance failed", { code: maintenance.error.code });
    return NextResponse.json({ error: "Subscription maintenance failed." }, { status: 503 });
  }

  const savedFiles = await cleanupSavedFiles(admin, now);
  const history = await cleanupHistory(admin, now);
  const failed = savedFiles.failed + history.failed + Number(savedFiles.claimFailed) + Number(history.claimFailed);
  const summary = { subscriptions: maintenance.data, savedFiles, history, completedAt: now };
  if (failed) {
    console.error("Scheduled storage cleanup had failures", { savedFileFailures: savedFiles.failed, historyFailures: history.failed, claimFailures: Number(savedFiles.claimFailed) + Number(history.claimFailed) });
    return NextResponse.json({ ok: false, ...summary }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ ok: true, ...summary }, { headers: { "Cache-Control": "no-store" } });
}

async function cleanupSavedFiles(admin: AdminClient, now: string): Promise<CleanupResult> {
  const result: CleanupResult = { attempted: 0, deleted: 0, failed: 0, claimFailed: false };
  for (let batch = 0; batch < maxBatchesPerRun; batch++) {
    const { data, error } = await admin.rpc("claim_expired_project_files", { p_now: now, p_limit: batchSize });
    if (error) {
      result.claimFailed = true;
      console.error("Could not claim expired saved files", { code: error.code });
      break;
    }
    const rows = data || [];
    result.attempted += rows.length;
    for (const file of rows) {
      try {
        if (file.storage_provider !== "supabase") throw new Error("unsupported_storage_provider");
        if (file.storage_path) {
          const { error: removeError } = await admin.storage.from("project-outputs").remove([file.storage_path]);
          if (removeError) throw new Error("storage_remove_failed");
          const { error: historyError } = await admin.from("processing_history").update({
            output_storage_path: null, output_size_bytes: null, output_expires_at: null, cleanup_error: null, cleanup_locked_at: null
          }).eq("output_storage_path", file.storage_path);
          if (historyError) throw new Error("history_metadata_update_failed");
        }
        const { error: deleteError } = await admin.from("project_files").delete().eq("id", file.id);
        if (deleteError) throw new Error("saved_file_record_delete_failed");
        result.deleted++;
      } catch (error) {
        result.failed++;
        const code = error instanceof Error ? error.message : "cleanup_failed";
        await recordProjectFileFailure(admin, file.id, code);
        console.error("Saved file cleanup failed", { fileId: file.id, code });
      }
    }
    if (rows.length < batchSize) break;
  }
  return result;
}

async function cleanupHistory(admin: AdminClient, now: string): Promise<CleanupResult> {
  const result: CleanupResult = { attempted: 0, deleted: 0, failed: 0, claimFailed: false };
  for (let batch = 0; batch < maxBatchesPerRun; batch++) {
    const { data, error } = await admin.rpc("claim_expired_processing_history", { p_now: now, p_limit: batchSize });
    if (error) {
      result.claimFailed = true;
      console.error("Could not claim expired processing history", { code: error.code });
      break;
    }
    const rows = data || [];
    result.attempted += rows.length;
    for (const row of rows) {
      try {
        if (row.delete_output && row.output_storage_path) {
          if (row.output_storage_provider !== "supabase") throw new Error("unsupported_storage_provider");
          const { error: removeError } = await admin.storage.from("project-outputs").remove([row.output_storage_path]);
          if (removeError) throw new Error("storage_remove_failed");
        }
        const { error: deleteError } = await admin.from("processing_history").delete().eq("id", row.id).eq("user_id", row.user_id);
        if (deleteError) throw new Error("history_record_delete_failed");
        result.deleted++;
      } catch (error) {
        result.failed++;
        const code = error instanceof Error ? error.message : "cleanup_failed";
        await recordHistoryFailure(admin, row.id, code);
        console.error("Processing history cleanup failed", { historyId: row.id, code });
      }
    }
    if (rows.length < batchSize) break;
  }
  return result;
}

async function recordProjectFileFailure(admin: AdminClient, id: string, code: string) {
  const { data } = await admin.from("project_files").select("cleanup_attempts").eq("id", id).maybeSingle();
  await admin.from("project_files").update({ cleanup_attempts: (data?.cleanup_attempts || 0) + 1, cleanup_error: code, cleanup_locked_at: null }).eq("id", id);
}

async function recordHistoryFailure(admin: AdminClient, id: string, code: string) {
  const { data } = await admin.from("processing_history").select("cleanup_attempts").eq("id", id).maybeSingle();
  await admin.from("processing_history").update({ cleanup_attempts: (data?.cleanup_attempts || 0) + 1, cleanup_error: code, cleanup_locked_at: null }).eq("id", id);
}

function constantTimeEqual(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
