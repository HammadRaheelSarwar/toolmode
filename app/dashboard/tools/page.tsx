"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Wrench } from "lucide-react";
import { tools } from "../../../lib/tools";
import { DashboardHeading, EmptyState } from "../../../components/dashboard-primitives";

type HistoryItem = { id: string; tool_slug: string; processed_at: string; status: string };
export default function MyToolsPage() {
  const [recent, setRecent] = useState<HistoryItem[]>([]);
  useEffect(() => { fetch("/api/account/history").then((response) => response.ok ? response.json() : null).then((data) => setRecent((data?.history || []).filter((item: HistoryItem, index: number, all: HistoryItem[]) => all.findIndex((row) => row.tool_slug === item.tool_slug) === index).slice(0, 8))).catch(() => {}); }, []);
  const recentTools = recent.map((entry) => tools.find((tool) => tool.slug === entry.tool_slug)).filter((tool): tool is (typeof tools)[number] => Boolean(tool));
  return <><DashboardHeading eyebrow="My tools" title="Tools you use" description="Jump back into recent tools or browse all 25 ToolModeOn tools." action={{ label: "Browse tools", href: "/tools" }}/><h2 className="mb-4 text-lg font-black">Recently used</h2>{recentTools.length ? <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{recentTools.map((tool) => <ToolLink key={tool.slug} tool={tool}/>)}</div> : <div className="mb-8"><EmptyState title="Your recent tools will appear here">Once signed in, processing history will help you get back to the tools you use most.</EmptyState></div>}<h2 className="mb-4 text-lg font-black">All tools</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tools.map((tool) => <ToolLink key={tool.slug} tool={tool}/>)}</div></>;
}

function ToolLink({ tool }: { tool: (typeof tools)[number] }) { const Icon = tool.icon; return <Link href={`/tools/${tool.slug}`} className="group flex items-center gap-3 rounded-2xl border border-line p-4 transition hover:border-brand/30 hover:shadow-soft"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}><Icon size={19}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{tool.name}</span><span className="mt-1 block truncate text-xs text-muted">{tool.category}</span></span><ArrowRight size={15} className="text-muted group-hover:text-brand"/></Link>; }
