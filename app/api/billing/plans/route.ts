import { NextResponse } from "next/server";
import { defaultPlans, type PlanEntitlement } from "../../../../lib/plans";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

export async function GET() {
  const envPrices:Record<string,string|undefined>={
    pro_month:process.env.PADDLE_PRO_MONTHLY_PRICE_ID,pro_year:process.env.PADDLE_PRO_YEARLY_PRICE_ID,
    business_month:process.env.PADDLE_BUSINESS_MONTHLY_PRICE_ID,business_year:process.env.PADDLE_BUSINESS_YEARLY_PRICE_ID
  };
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase.from("plan_entitlements").select("plan_key,name,description,monthly_price_cents,yearly_price_cents,monthly_paddle_price_id,yearly_paddle_price_id,monthly_tool_runs,ai_credits,max_file_bytes,max_batch_files,history_days,api_requests,team_members,ads_enabled,priority,is_active,sort_order,access_period_days,document_grace_days,storage_limit_bytes,ai_requests_per_minute").eq("is_active", true).order("sort_order");
    if (!error && data?.length) return NextResponse.json({ plans: data.map((plan) => { const month=plan.monthly_paddle_price_id||envPrices[`${plan.plan_key}_month`];const year=plan.yearly_paddle_price_id||envPrices[`${plan.plan_key}_year`];return{...plan,monthly_paddle_price_id:month,yearly_paddle_price_id:year,monthly_price_configured:Boolean(month),yearly_price_configured:Boolean(year),storage_configured: Boolean(plan.storage_limit_bytes&&plan.storage_limit_bytes>0)}; }) as PlanEntitlement[] });
  }
  return NextResponse.json({ plans: defaultPlans.map((plan) => {const month=envPrices[`${plan.plan_key}_month`];const year=envPrices[`${plan.plan_key}_year`];return{...plan,monthly_paddle_price_id:month,yearly_paddle_price_id:year,monthly_price_configured:Boolean(month),yearly_price_configured:Boolean(year),storage_configured: Boolean(plan.storage_limit_bytes&&plan.storage_limit_bytes>0)};}) });
}
