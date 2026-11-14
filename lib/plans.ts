export type PlanKey = "free" | "pro" | "business";
export type PlanEntitlement = {
  plan_key: PlanKey;
  name: string;
  description: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  monthly_paddle_price_id?: string | null;
  yearly_paddle_price_id?: string | null;
  access_period_days: number;
  document_grace_days: number;
  storage_limit_bytes: number | null;
  ai_requests_per_minute: number;
  monthly_tool_runs: number;
  ai_credits: number;
  max_file_bytes: number;
  max_batch_files: number;
  history_days: number;
  api_requests: number;
  team_members: number;
  ads_enabled: boolean;
  priority: string;
  trials_enabled?: boolean;
  is_active?: boolean;
  sort_order?: number;
};

export const defaultPlans: PlanEntitlement[] = [
  { plan_key: "free", name: "Free", description: "Basic tools, one successful AI generation, and temporary browser-based processing.", monthly_price_cents: 0, yearly_price_cents: 0, monthly_tool_runs: 100, ai_credits: 1, max_file_bytes: 10 * 1024 * 1024, max_batch_files: 1, history_days: 0, api_requests: 0, team_members: 0, ads_enabled: true, priority: "standard", trials_enabled: false, is_active: true, sort_order: 0, access_period_days: 30, document_grace_days: 7, storage_limit_bytes: null, ai_requests_per_minute: 10 },
  { plan_key: "pro", name: "Pro", description: "All tools, unlimited AI subject to fair-use controls, 7-day history, and configurable saved-file storage.", monthly_price_cents: 230, yearly_price_cents: 0, monthly_tool_runs: 2000, ai_credits: 0, max_file_bytes: 100 * 1024 * 1024, max_batch_files: 20, history_days: 7, api_requests: 0, team_members: 0, ads_enabled: false, priority: "priority", trials_enabled: false, is_active: true, sort_order: 1, access_period_days: 30, document_grace_days: 7, storage_limit_bytes: null, ai_requests_per_minute: 10 },
  { plan_key: "business", name: "Premium", description: "All tools, unlimited AI subject to fair-use controls, 14-day history, higher configurable storage, and a five-member team workspace.", monthly_price_cents: 700, yearly_price_cents: 0, monthly_tool_runs: 10000, ai_credits: 0, max_file_bytes: 500 * 1024 * 1024, max_batch_files: 50, history_days: 14, api_requests: 10000, team_members: 5, ads_enabled: false, priority: "priority", trials_enabled: false, is_active: true, sort_order: 2, access_period_days: 30, document_grace_days: 7, storage_limit_bytes: null, ai_requests_per_minute: 10 }
];

export function planRank(plan: PlanKey | string) { return plan === "business" ? 2 : plan === "pro" ? 1 : 0; }

export function priceLabel(cents: number, interval: "month" | "year") {
  if (cents === 0) return "$0";
  const dollars = (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return `$${dollars}/${interval === "month" ? "month" : "year"}`;
}
