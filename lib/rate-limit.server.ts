import "server-only";
import { createHash } from "crypto";
import { getSupabaseAdminClient } from "./supabase/admin";

const memory = new Map<string, { windowStart: number; hits: number }>();

export async function checkRateLimit(request: Request, bucket: string, limit: number, windowSeconds: number, identity?: string) {
  const rawIp = identity || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const salt = process.env.RATE_LIMIT_SALT || "toolmodeon-rate-limit";
  const bucketKey = createHash("sha256").update(`${salt}:${bucket}:${rawIp}`).digest("hex");
  const admin = getSupabaseAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("take_rate_limit", { p_bucket_key: bucketKey, p_limit: limit, p_window_seconds: windowSeconds });
    if (!error && data) return data as { allowed: boolean; remaining: number; reset_at: string };
    if (process.env.NODE_ENV === "production") {
      console.error("Distributed rate limiter unavailable", { bucket, code: error?.code });
      return { allowed: false, remaining: 0, reset_at: new Date(Date.now() + windowSeconds * 1000).toISOString() };
    }
  }
  if (process.env.NODE_ENV === "production") {
    console.error("Distributed rate limiter is not configured", { bucket });
    return { allowed: false, remaining: 0, reset_at: new Date(Date.now() + windowSeconds * 1000).toISOString() };
  }
  const now = Date.now();
  const current = memory.get(bucketKey);
  if (!current || now - current.windowStart >= windowSeconds * 1000) {
    memory.set(bucketKey, { windowStart: now, hits: 1 });
    return { allowed: true, remaining: limit - 1, reset_at: new Date(now + windowSeconds * 1000).toISOString() };
  }
  if (current.hits >= limit) return { allowed: false, remaining: 0, reset_at: new Date(current.windowStart + windowSeconds * 1000).toISOString() };
  current.hits++;
  if (memory.size > 10000) memory.clear();
  return { allowed: true, remaining: Math.max(0, limit - current.hits), reset_at: new Date(current.windowStart + windowSeconds * 1000).toISOString() };
}
