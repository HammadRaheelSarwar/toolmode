"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import { tools } from "../../../lib/tools";
import { DashboardHeading, EmptyState, StatusNotice } from "../../../components/dashboard-primitives";

export default function FavoritesPage() {
  const [slugs, setSlugs] = useState<string[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function load() { try { const response = await fetch("/api/account/favorites"); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not load favorites."); setSlugs((body.favorites || []).map((item: { tool_slug: string }) => item.tool_slug)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load favorites."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function remove(slug: string) { setError(""); setSuccess(""); const response = await fetch(`/api/account/favorites?tool_slug=${encodeURIComponent(slug)}`, { method: "DELETE" }); const body = await response.json(); if (!response.ok) { setError(body.error || "Could not remove favorite."); return; } setSlugs((current) => current.filter((item) => item !== slug)); setSuccess("Favorite removed."); }
  const favorites = slugs.map((slug) => tools.find((tool) => tool.slug === slug)).filter((tool): tool is (typeof tools)[number] => Boolean(tool));
  return <><DashboardHeading eyebrow="Your account" title="Favorite tools" description="Keep your most useful tools close at hand." action={{ label: "Browse tools", href: "/tools" }}/><StatusNotice error={error} success={success}/>{loading ? <p className="text-sm text-muted">Loading favorites…</p> : favorites.length === 0 ? <EmptyState title="No favorites saved">Open any tool and select “Add to favorites” to pin it here.</EmptyState> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{favorites.map((tool) => { const Icon = tool.icon; return <div key={tool.slug} className="rounded-2xl border border-line p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}><Icon size={19}/></span><p className="mt-3 font-extrabold">{tool.name}</p><p className="mt-1 min-h-10 text-xs leading-5 text-muted">{tool.description}</p><div className="mt-4 flex items-center justify-between"><Link href={`/tools/${tool.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand">Open tool <ArrowRight size={14}/></Link><button onClick={() => remove(tool.slug)} title="Remove favorite" aria-label={`Remove ${tool.name} from favorites`} className="rounded-lg border border-line p-2 text-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15}/></button></div></div>; })}</div>}</>;
}
