"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, BriefcaseBusiness, Heart, Sparkles } from "lucide-react";
import { popularTools, tools } from "../../lib/tools";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { DashboardHeading, EmptyState } from "../../components/dashboard-primitives";

type HistoryRow = { id: string; tool_slug: string; status: "completed" | "failed"; original_filename: string | null; output_storage_path: string | null; output_expires_at: string | null; processed_at: string };
type Overview = { recent: HistoryRow[]; toolsUsedThisMonth: number; favoritesCount: number; projectsCount: number };

export default function DashboardOverview() {
  const [data, setData] = useState<Overview | null>(null); const [error, setError] = useState("");
  const [account, setAccount] = useState({ name: "", email: "" });
  useEffect(() => {
    fetch("/api/account/overview").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not load account overview."); setData(body); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load account overview."));
    const supabase = getSupabaseBrowserClient();
    if (supabase) supabase.auth.getSession().then(({ data: authData }) => {
      const user = authData.session?.user;
      if (user) setAccount({ name: user.user_metadata?.full_name || "", email: user.email || "" });
    });
    fetch("/api/account/profile").then((response) => response.ok ? response.json() : null).then((body) => { if (body?.profile?.full_name) setAccount((current) => ({ ...current, name: body.profile.full_name })); }).catch(() => {});
  }, []);
  return <><DashboardHeading eyebrow="Overview" title="Your workspace" description="Your account, saved tools, and recent activity in one place."/><div className="mb-6 rounded-2xl bg-pale p-4 sm:p-5"><p className="text-lg font-black">Welcome back{account.name ? `, ${account.name}` : ""}.</p><p className="mt-1 text-sm text-muted">{account.email || "Your ToolModeOn account"}</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Current plan" value="Free" note="Account plan" icon={<Sparkles size={18}/>}/><Metric label="Tools used" value={data ? String(data.toolsUsedThisMonth) : "—"} note="Last 30 days" icon={<Activity size={18}/>}/><Metric label="Favorites" value={data ? String(data.favoritesCount) : "—"} note="Saved tools" icon={<Heart size={18}/>}/><Metric label="Projects" value={data ? String(data.projectsCount) : "—"} note="Your projects" icon={<BriefcaseBusiness size={18}/>}/></div>
    <p className="mt-4 rounded-xl bg-brand/[.06] px-4 py-3 text-xs leading-5 text-muted">Monthly account-wide usage allowances are not configured yet. Existing guest and tool limits continue to apply.</p>
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Recent activity</h2><Link href="/dashboard/history" className="inline-flex items-center gap-1 text-sm font-bold text-brand">View history <ArrowRight size={14}/></Link></div>{error ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p> : !data ? <p className="text-sm text-muted">Loading activity…</p> : data.recent.length === 0 ? <EmptyState title="No activity yet">Use any of the free tools to start building your processing history.</EmptyState> : <div className="divide-y divide-line rounded-2xl border border-line">{data.recent.map((row) => { const tool = tools.find((item) => item.slug === row.tool_slug); return <Link href={`/tools/${row.tool_slug}`} key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-pale"><div><p className="text-sm font-bold">{tool?.name || row.tool_slug}</p><p className="mt-1 text-xs text-muted">{row.original_filename || "Tool activity"} · {new Date(row.processed_at).toLocaleString()}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{row.status}</span></Link>; })}</div>}</section>
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Quick access</h2><Link href="/dashboard/tools" className="text-sm font-bold text-brand">My tools</Link></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{popularTools.map((tool) => <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}><tool.icon size={19}/></span><ArrowRight size={15} className="text-muted transition group-hover:translate-x-1 group-hover:text-brand"/></div><p className="mt-3 font-extrabold">{tool.name}</p><p className="mt-1 text-xs leading-5 text-muted">{tool.description}</p></Link>)}</div></section>
  </>;
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-line p-4"><div className="flex items-center justify-between text-brand"><span className="text-xs font-bold text-muted">{label}</span>{icon}</div><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-muted">{note}</p></div>; }
