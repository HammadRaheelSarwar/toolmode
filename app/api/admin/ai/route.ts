import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, writeAdminAudit } from "../../../../lib/admin.server";

const schema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("ai.provider"), value: z.string().trim().min(1).max(80) }),
  z.object({ key: z.literal("ai.model"), value: z.string().trim().min(1).max(120) }),
  z.object({ key: z.literal("ai.endpoint"), value: z.string().url().refine(value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash; } catch { return false; } }) }),
  z.object({ key: z.literal("ai.max_input_chars"), value: z.number().int().min(1000).max(12000) }),
  z.object({ key: z.literal("ai.max_output_tokens"), value: z.number().int().min(64).max(8192) })
]);

export async function GET(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const url = new URL(request.url); const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86400000).toISOString(); const until = new Date().toISOString();
  const [metrics, settings, plans, logs] = await Promise.all([
    access.admin.rpc("admin_ai_metrics", { p_since: since, p_until: until }),
    access.admin.from("system_settings").select("setting_key,value,updated_at").in("setting_key", ["ai.provider", "ai.model", "ai.endpoint", "ai.max_input_chars", "ai.max_output_tokens"]),
    access.admin.from("plan_entitlements").select("plan_key,name,ai_credits,ai_requests_per_minute").order("sort_order"),
    access.admin.from("ai_generation_logs").select("tool_slug,provider,model,status,error_code,input_chars,output_chars,latency_ms,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(50)
  ]);
  if (metrics.error || settings.error || plans.error || logs.error) return NextResponse.json({ error: "AI analytics are unavailable. Apply the Phase 6 migration." }, { status: 503 });
  const config = Object.fromEntries((settings.data || []).map(row => [row.setting_key.replace("ai.", ""), row.value]));
  return NextResponse.json({ metrics: metrics.data, config: {
    provider: String(config.provider || "OpenAI-compatible"), model: String(config.model || process.env.AI_PROVIDER_MODEL || "Not configured"),
    endpoint_host: safeHost(String(config.endpoint || process.env.AI_PROVIDER_API_URL || "")),
    endpoint_override: typeof config.endpoint === "string" ? config.endpoint : "",
    max_input_chars: Number(config.max_input_chars || 12000), max_output_tokens: Number(config.max_output_tokens || 2048),
    endpoint_configured: Boolean(config.endpoint || process.env.AI_PROVIDER_API_URL), credentials_configured: Boolean(process.env.AI_PROVIDER_API_KEY)
  }, plans: plans.data || [], logs: logs.data || [], days }, { headers: { "Cache-Control": "no-store" } });
}

function safeHost(value: string) { try { return new URL(value).host || ""; } catch { return ""; } }

export async function PATCH(request: Request) {
  const access = await requireAdmin(["admin", "super_admin"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid AI configuration value." }, { status: 400 });
  const { key, value } = parsed.data;
  const { error } = await access.admin.from("system_settings").upsert({ setting_key: key, value, updated_by: access.user.id }, { onConflict: "setting_key" });
  if (error) return NextResponse.json({ error: "Could not save AI configuration." }, { status: 500 });
  const audit = await writeAdminAudit(access.admin, access.user.id, "ai.configuration_updated", "system_setting", key, { key, value });
  if (audit.error) return NextResponse.json({ error: "AI configuration saved, but the audit entry failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
