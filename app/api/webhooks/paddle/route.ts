import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { liveBillingEnabled, verifyPaddleSignature } from "../../../../lib/paddle.server";

const eventSchema = z.object({ notification_id: z.string().min(10).max(100), event_type: z.string().min(3).max(100), occurred_at: z.string().datetime({ offset: true }), data: z.record(z.string(), z.unknown()) });

export async function POST(request: Request) {
  if (!liveBillingEnabled()) return NextResponse.json({ error: "The configured Paddle environment is disabled." }, { status: 503 });
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 1024 * 1024) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 1024 * 1024) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  if (!verifyPaddleSignature(rawBody, request.headers.get("paddle-signature"), secret)) return NextResponse.json({ error: "Invalid Paddle signature." }, { status: 401 });
  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 }); }
  const event = eventSchema.safeParse(json);
  if (!event.success) return NextResponse.json({ error: "Invalid Paddle event payload." }, { status: 400 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Webhook database access is not configured." }, { status: 503 });
  const { data, error } = await admin.rpc("process_paddle_webhook_final", {
    p_notification_id: event.data.notification_id,
    p_event_type: event.data.event_type,
    p_occurred_at: event.data.occurred_at,
    p_payload: json
  });
  if (error || !data?.ok) {
    const { error: logError } = await admin.from("payment_webhook_attempts").insert({ notification_id: event.data.notification_id, event_type: event.data.event_type, outcome: "failed" });
    if (logError) console.error("Paddle webhook attempt log failed", { code: logError.code });
    console.error("Paddle webhook processing failed", { notificationId: event.data.notification_id, code: error?.code });
    return NextResponse.json({ error: "Webhook processing failed; Paddle may retry this notification." }, { status: 500 });
  }
  const { error: attemptError } = await admin.from("payment_webhook_attempts").insert({ notification_id: event.data.notification_id, event_type: event.data.event_type, outcome: data.duplicate ? "duplicate" : "processed" });
  if (attemptError) console.error("Paddle webhook attempt log failed", { code: attemptError.code });
  return NextResponse.json({ received: true, duplicate: Boolean(data.duplicate) }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
