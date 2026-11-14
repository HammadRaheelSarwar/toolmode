import { NextResponse } from "next/server";
import { tools } from "../../../../lib/tools";
import { defaultPlans, planRank, type PlanEntitlement } from "../../../../lib/plans";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

const paidAccessStatuses = ["active", "trialing", "past_due", "canceled"];

async function getToolRunAccess(toolSlug: string) {
  const tool = tools.find((item) => item.slug === toolSlug);
  if (!tool) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });

  const supabase = await getSupabaseServerClient();
  let plan = defaultPlans[0];
  let authenticated = false;
  let row: { enabled: boolean; required_plan: string; max_file_bytes_override: number | null; batch_files_override: number | null } | null = null;

  if (supabase) {
    const [userResult, plansResult, ruleResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("plan_entitlements").select("plan_key,max_file_bytes,max_batch_files,trials_enabled,is_active"),
      supabase.from("tool_settings").select("enabled,required_plan,max_file_bytes_override,batch_files_override").eq("tool_slug", tool.slug).maybeSingle()
    ]);
    const userId = userResult.data.user?.id || null;
    authenticated = Boolean(userId);
    const plans = (plansResult.data || []) as PlanEntitlement[];
    const free = plans.find((item) => item.plan_key === "free") || defaultPlans[0];
    row = ruleResult.error ? null : ruleResult.data;

    if (userId) {
      const { data: subscriptions } = await supabase.from("subscriptions")
        .select("plan_key,status,current_period_ends_at,updated_at")
        .eq("user_id", userId).in("status", paidAccessStatuses).order("updated_at", { ascending: false }).limit(10);
      const now = Date.now();
      const valid = (subscriptions || []).find((item) => paidAccessStatuses.includes(item.status)
        && (!item.current_period_ends_at || new Date(item.current_period_ends_at).getTime() > now)
        && (item.status !== "trialing" || plans.find((candidate) => candidate.plan_key === item.plan_key)?.trials_enabled));
      plan = plans.find((item) => item.plan_key === valid?.plan_key && item.is_active) || free;
    } else {
      plan = free;
    }
  }

  const rule = {
    slug: tool.slug,
    enabled: row ? row.enabled : true,
    required_plan: "free",
    max_file_bytes: row?.max_file_bytes_override ?? 50 * 1024 * 1024,
    max_batch_files: row?.batch_files_override ?? 20
  };
  return NextResponse.json({
    authenticated: true,
    plan: { key: "free", max_file_bytes: 50 * 1024 * 1024, max_batch_files: 20 },
    tools: [rule]
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  const toolSlug = new URL(request.url).searchParams.get("tool_slug");
  if (toolSlug) return getToolRunAccess(toolSlug);

  const supabase = await getSupabaseServerClient();
  let userId: string | null = null;
  let plan = defaultPlans[0];
  let used = { toolRuns: 0, aiCredits: 0, apiRequests: 0 };
  let currentSubscription: Record<string, unknown> | null = null;
  let rules: Array<{ tool_slug: string; enabled: boolean; required_plan: string; max_file_bytes_override: number | null; batch_files_override: number | null }> = [];

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
    const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const [plansResult, rulesResult] = await Promise.all([
      supabase.from("plan_entitlements").select("plan_key,name,description,monthly_price_cents,yearly_price_cents,monthly_tool_runs,ai_credits,max_file_bytes,max_batch_files,history_days,api_requests,team_members,ads_enabled,priority,trials_enabled,is_active,sort_order,access_period_days,document_grace_days,storage_limit_bytes,ai_requests_per_minute"),
      supabase.from("tool_settings").select("tool_slug,enabled,required_plan,max_file_bytes_override,batch_files_override")
    ]);
    const plans = (plansResult.data || []) as PlanEntitlement[];
    const free = plans.find((item) => item.plan_key === "free") || defaultPlans[0];
    if (userId) {
      const { data: subscriptions } = await supabase.from("subscriptions")
        .select("id,plan_key,status,billing_interval,current_period_starts_at,current_period_ends_at,next_billed_at,cancel_at_period_end,canceled_at,grace_period_ends_at,updated_at")
        .eq("user_id", userId).order("updated_at", { ascending: false }).limit(10);
      const now = Date.now();
      const valid = (subscriptions || []).find((item) => paidAccessStatuses.includes(item.status)
        && (!item.current_period_ends_at || new Date(item.current_period_ends_at).getTime() > now)
        && (item.status !== "trialing" || plans.find((p) => p.plan_key === item.plan_key)?.trials_enabled));
      currentSubscription = subscriptions?.[0] || null;
      plan = plans.find((item) => item.plan_key === valid?.plan_key && item.is_active) || free;
      const [runCount, aiCount, apiCount] = await Promise.all([
        supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("event_type", "tool_run").gte("created_at", monthStart.toISOString()),
        plan.plan_key === "free"
          ? supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("event_type", "ai_request")
          : supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("event_type", "ai_request").gte("created_at", monthStart.toISOString()),
        supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("event_type", "api_request").gte("created_at", monthStart.toISOString())
      ]);
      used = { toolRuns: runCount.count || 0, aiCredits: aiCount.count || 0, apiRequests: apiCount.count || 0 };
    } else plan = free;
    if (!rulesResult.error) rules = rulesResult.data || [];
  }

  const toolRules = tools.map((tool) => {
    const row = rules.find((item) => item.tool_slug === tool.slug);
    return { slug: tool.slug, enabled: row ? row.enabled : true, required_plan: row?.required_plan || (tool.pro ? "pro" : "free"),
      max_file_bytes: row?.max_file_bytes_override ?? plan.max_file_bytes, max_batch_files: row?.batch_files_override ?? plan.max_batch_files };
  });
  const subscription = currentSubscription ? {
    ...currentSubscription,
    effective_status: currentSubscription.current_period_ends_at && new Date(String(currentSubscription.current_period_ends_at)).getTime() <= Date.now() ? "expired" : currentSubscription.status,
    remaining_days: currentSubscription.current_period_ends_at ? Math.max(0, Math.ceil((new Date(String(currentSubscription.current_period_ends_at)).getTime() - Date.now()) / 86400000)) : null
  } : null;
  return NextResponse.json({
    authenticated: Boolean(userId),
    plan: { key: plan.plan_key, name: plan.name, monthly_price_cents: plan.monthly_price_cents, access_period_days: plan.access_period_days,
      monthly_tool_runs: plan.monthly_tool_runs, ai_credits: plan.ai_credits, ai_requests_per_minute: plan.ai_requests_per_minute,
      max_file_bytes: plan.max_file_bytes, max_batch_files: plan.max_batch_files, history_days: plan.history_days,
      document_grace_days: plan.document_grace_days, storage_limit_bytes: plan.storage_limit_bytes, api_requests: plan.api_requests,
      team_members: plan.team_members, ads_enabled: plan.ads_enabled, priority: plan.priority },
    usage: { ...used, remainingToolRuns: Math.max(0, plan.monthly_tool_runs - used.toolRuns),
      remainingAiCredits: plan.plan_key === "free" ? Math.max(0, plan.ai_credits - used.aiCredits) : null,
      remainingApiRequests: Math.max(0, plan.api_requests - used.apiRequests) },
    subscription, tools: toolRules, planOrder: ["free", "pro", "business"].sort((a, b) => planRank(a) - planRank(b))
  }, { headers: { "Cache-Control": "no-store" } });
}
