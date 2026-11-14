"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, CreditCard, ExternalLink, LoaderCircle } from "lucide-react";
import { DashboardHeading, EmptyState } from "../../../components/dashboard-primitives";

type Subscription = { plan_key: string; status: string; billing_interval: string | null; current_period_ends_at: string | null; next_billed_at: string | null; cancel_at_period_end: boolean } | null;
type PageData = { plan: { key: string; name: string; monthly_tool_runs: number; ai_credits: number; max_file_bytes: number; history_days: number; ads_enabled: boolean }; usage: { toolRuns: number; aiCredits: number; remainingToolRuns: number; remainingAiCredits: number }; subscription: Subscription };
type Payment = { id: string; amount_cents: number; currency: string; status: string; occurred_at: string; invoice_number: string | null };

export default function SubscriptionPage() {
  const [data, setData] = useState<PageData | null>(null); const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([fetch("/api/account/entitlements", { cache: "no-store" }).then((r) => r.json()), fetch("/api/account/billing-history", { cache: "no-store" }).then((r) => r.json())])
      .then(([entitlements, ledger]) => { if (entitlements.plan) setData(entitlements); setPayments(ledger.payments || []); })
      .catch(() => setError("Could not load current subscription details."))
      .finally(() => setLoading(false));
  }, []);

  async function manage() {
    setBusy(true); setError("");
    try { const response = await fetch("/api/billing/portal", { method: "POST" }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Subscription management is unavailable."); window.location.assign(body.url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Subscription management is unavailable."); setBusy(false); }
  }

  const plan = data?.plan; const subscription = data?.subscription;
  return <><DashboardHeading eyebrow="Your account" title="Subscription" description="Plan, usage, renewal and verified billing activity."/>
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    {loading || !plan ? <div className="flex items-center gap-2 rounded-2xl border border-line p-6 text-sm text-muted"><LoaderCircle className="animate-spin" size={18}/> Loading subscription details…</div> : <>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[.07] to-blue/[.04] p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-brand">CURRENT PLAN</span><h2 className="mt-4 text-3xl font-black">{plan.name}</h2><p className="mt-2 text-sm text-muted">{subscription ? `${pretty(subscription.status)} · ${subscription.billing_interval || "subscription"} billing` : "Active · No payment method required"}</p></div><CreditCard className="text-brand" size={24}/></div>
          <ul className="mt-6 grid gap-3 text-sm font-semibold text-ink sm:grid-cols-2">{[`${plan.monthly_tool_runs.toLocaleString()} tool runs per month`, `${plan.ai_credits.toLocaleString()} AI credits per month`, `${formatBytes(plan.max_file_bytes)} maximum file size`, `${plan.history_days} days of processing history`, plan.ads_enabled ? "Ad-supported experience" : "Ad-free experience"].map((benefit) => <li key={benefit} className="flex items-center gap-2"><Check size={16} className="text-emerald-600"/>{benefit}</li>)}</ul>
          {subscription?.current_period_ends_at && <p className="mt-5 rounded-xl bg-white/80 p-3 text-sm text-muted">{subscription.cancel_at_period_end ? "Access ends" : "Current period ends"}: <strong className="text-ink">{date(subscription.current_period_ends_at)}</strong>{subscription.next_billed_at && !subscription.cancel_at_period_end ? ` · Renews ${date(subscription.next_billed_at)}` : ""}</p>}
          <Link href="/pricing" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-brand">Compare plans <ArrowRight size={15}/></Link>
        </section>
        <section className="rounded-2xl border border-line p-6"><h2 className="text-lg font-black">Usage this month</h2><UsageBar label="Tool runs" used={data.usage.toolRuns} total={plan.monthly_tool_runs}/><UsageBar label="AI credits" used={data.usage.aiCredits} total={plan.ai_credits}/>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-pale p-3 text-xs font-semibold text-muted"><Clock3 size={15}/> {subscription ? `Subscription status: ${pretty(subscription.status)}` : "Subscription status: Free plan"}</div>
          {subscription && <button disabled={busy} onClick={manage} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-bold disabled:opacity-60">{busy ? "Opening portal…" : "Manage or cancel subscription"}<ExternalLink size={15}/></button>}
          {!subscription && <p className="mt-4 text-sm leading-6 text-muted">Upgrade from Pricing when you need higher limits or an ad-free workspace.</p>}
        </section>
      </div>
      <section className="mt-8"><h2 className="mb-4 text-lg font-black">Billing history</h2>{payments.length ? <div className="overflow-x-auto rounded-2xl border border-line"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-pale text-xs uppercase tracking-wide text-muted"><tr><th className="p-4">Date</th><th className="p-4">Reference</th><th className="p-4">Status</th><th className="p-4 text-right">Amount</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-t border-line"><td className="p-4">{date(payment.occurred_at)}</td><td className="p-4">{payment.invoice_number || payment.id.slice(0, 12)}</td><td className="p-4 capitalize">{payment.status.replaceAll("_", " ")}</td><td className="p-4 text-right">{formatMoney(payment.amount_cents, payment.currency)}</td></tr>)}</tbody></table></div> : <EmptyState title="No billing activity">Verified Paddle transactions will appear here after checkout.</EmptyState>}</section>
    </>}
  </>;
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) { const percent = total ? Math.min(100, used / total * 100) : 0; return <div className="mt-5"><div className="flex justify-between text-sm"><span className="font-bold">{label}</span><span className="text-muted">{used.toLocaleString()} / {total.toLocaleString()}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-pale"><div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }}/></div></div>; }
function pretty(value: string) { return value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()); }
function date(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)); }
function formatBytes(value: number) { return value >= 1024 ** 3 ? `${(value / 1024 ** 3).toFixed(1)} GB` : `${Math.round(value / 1024 / 1024)} MB`; }
function formatMoney(cents: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100); } catch { return `${currency} ${(cents / 100).toFixed(2)}`; } }
