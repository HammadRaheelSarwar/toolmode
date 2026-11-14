import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";
import { getSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { checkRateLimit } from "../../../../lib/rate-limit.server";
import { z } from "zod";

const allowedTools = new Set([
  "ai-text-summarizer",
  "ai-paragraph-rewriter",
  "ai-email-generator",
  "ai-blog-title-generator",
  "seo-meta-description-generator"
]);

const instructions: Record<string, string> = {
  "ai-text-summarizer": "Summarize the supplied source accurately. Preserve its main claims and do not add facts. Return only the summary.",
  "ai-paragraph-rewriter": "Rewrite the supplied text in the requested tone while preserving its meaning. Return only the rewritten text.",
  "ai-email-generator": "Draft a useful email from the user's details. Do not invent dates, commitments, or facts. Return a subject and email body.",
  "ai-blog-title-generator": "Generate 8 distinct, specific blog title ideas for the topic. Return one title per line.",
  "seo-meta-description-generator": "Generate 5 distinct, accurate meta description options for the supplied page details. Avoid keyword stuffing and keep each under 160 characters. Return one option per line."
};
const requestSchema = z.object({ slug: z.string().min(1).max(80), input: z.string().trim().min(1).max(12000), tone: z.string().max(80).optional() });

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 64 * 1024) return NextResponse.json({ error: "AI request is too large." }, { status: 413 });
  let rawBody: string;
  try { rawBody = await request.text(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (Buffer.byteLength(rawBody, "utf8") > 64 * 1024) return NextResponse.json({ error: "AI request is too large." }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsedBody = requestSchema.safeParse(json);
  if (!parsedBody.success) return NextResponse.json({ error: "Enter valid AI tool inputs." }, { status: 400 });
  const body = parsedBody.data;
  if (!allowedTools.has(body.slug)) return NextResponse.json({ error: "Unknown AI tool." }, { status: 400 });
  const { slug, input } = body;

  const apiKey = process.env.AI_PROVIDER_API_KEY;
  let admin: ReturnType<typeof getSupabaseAdminClient> = getSupabaseAdminClient();
  const { data: settings } = admin ? await admin.from("system_settings").select("setting_key,value").in("setting_key", ["ai.model", "ai.provider", "ai.endpoint", "ai.max_input_chars", "ai.max_output_tokens"]) : { data: [] };
  const settingMap = Object.fromEntries((settings || []).map(row => [row.setting_key, row.value]));
  const endpointSetting = settingMap["ai.endpoint"];
  const endpointCandidate = typeof endpointSetting === "string" && endpointSetting ? endpointSetting : process.env.AI_PROVIDER_API_URL;
  const endpoint = secureProviderEndpoint(endpointCandidate);
  const modelSetting = settingMap["ai.model"];
  const providerSetting = settingMap["ai.provider"];
  const maxInputChars = Number(settingMap["ai.max_input_chars"] || 12000);
  const maxOutputTokens = Number(settingMap["ai.max_output_tokens"] || 2048);
  const model = typeof modelSetting === "string" && modelSetting ? modelSetting : process.env.AI_PROVIDER_MODEL;
  const provider = typeof providerSetting === "string" && providerSetting ? providerSetting : "OpenAI-compatible";
  if (input.length > maxInputChars) return NextResponse.json({ error: `Enter text up to ${maxInputChars.toLocaleString()} characters.` }, { status: 400 });
  if (!admin) return NextResponse.json({ error: "AI tool access could not be verified." }, { status: 503 });
  const { data: toolRule, error: toolRuleError } = await admin.from("tool_settings").select("enabled,required_plan").eq("tool_slug", slug).maybeSingle();
  if (toolRuleError || !toolRule) return NextResponse.json({ error: "AI tool availability could not be verified." }, { status: 503 });
  if (!toolRule.enabled) return NextResponse.json({ error: "This AI tool is temporarily unavailable." }, { status: 403 });
  if (!apiKey || !endpoint || !model) return NextResponse.json({ error: "AI tools need server-side provider credentials. Configure AI_PROVIDER_API_KEY and the provider endpoint in deployment settings." }, { status: 503 });

  const supabase = await getSupabaseServerClient();
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const requestId = randomUUID();
  let reserved = false;
  if (user) {
    admin = getSupabaseAdminClient();
    if (admin) {
      const { data: reservation } = await admin.rpc("reserve_ai_generation", { p_user_id: user.id, p_request_id: requestId, p_tool_slug: slug });
      if (reservation?.allowed) reserved = true;
    }
  } else {
    const rate = await checkRateLimit(request, "ai-generation-burst", 20, 60);
    if (!rate.allowed) return NextResponse.json({ error: "Too many AI requests. Please wait a minute and try again." }, { status: 429 });
  }

  async function finish(succeeded: boolean) {
    if (!reserved || !admin || !user) return true;
    const { data, error } = await admin.rpc("complete_ai_generation", { p_user_id: user.id, p_request_id: requestId, p_succeeded: succeeded });
    return !error && Boolean(data?.ok);
  }

  async function logResult(status: "succeeded" | "failed", errorCode: string | null, outputChars = 0) {
    if (!admin) return;
    const { error } = await admin.from("ai_generation_logs").upsert({
      request_id: requestId, user_id: user?.id || null, tool_slug: slug,
      provider, model, status, error_code: errorCode, input_chars: input.length,
      output_chars: outputChars, latency_ms: Date.now() - startedAt
    }, { onConflict: "request_id" });
    if (error) console.error("AI generation log write failed", { code: error.code });
  }

  const startedAt = Date.now();
  const prompt = `${instructions[slug]}${slug === "ai-paragraph-rewriter" && typeof body.tone === "string" ? ` Requested tone: ${body.tone}.` : ""}\n\nUser input:\n${input}`;
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.6, max_tokens: maxOutputTokens }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(45000)
    });
    if (!upstream.ok) { await finish(false); await logResult("failed", `provider_http_${upstream.status}`); return NextResponse.json({ error: "The AI provider could not complete this request. Please retry shortly.", request_id: requestId }, { status: 502 }); }
    const responseLength = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(responseLength) && responseLength > 512 * 1024) { await finish(false); await logResult("failed", "provider_response_too_large"); return NextResponse.json({ error: "The AI provider returned an invalid response. Please retry.", request_id: requestId }, { status: 502 }); }
    const rawProviderBody = await upstream.text();
    if (new TextEncoder().encode(rawProviderBody).byteLength > 512 * 1024) { await finish(false); await logResult("failed", "provider_response_too_large"); return NextResponse.json({ error: "The AI provider returned an invalid response. Please retry.", request_id: requestId }, { status: 502 }); }
    const data = JSON.parse(rawProviderBody) as { choices?: Array<{ message?: { content?: string } }> };
    const output = data.choices?.[0]?.message?.content?.trim();
    if (!output) { await finish(false); await logResult("failed", "empty_output"); return NextResponse.json({ error: "The AI provider returned an empty result. Please retry.", request_id: requestId }, { status: 502 }); }
    if (!await finish(true)) { await logResult("failed", "usage_commit_failed", output.length); return NextResponse.json({ error: "The result could not be saved against your AI allowance. Please retry shortly.", request_id: requestId }, { status: 503 }); }
    await logResult("succeeded", null, output.length);
    return NextResponse.json({ output, request_id: requestId });
  } catch {
    await finish(false);
    await logResult("failed", "provider_unavailable");
    return NextResponse.json({ error: "The AI provider could not be reached. Please retry shortly.", request_id: requestId }, { status: 502 });
  }
}

function secureProviderEndpoint(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.search || url.hash) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}
