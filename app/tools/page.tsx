"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ToolCard } from "../../components/tool-card";
import { categories, tools, type Tool } from "../../lib/tools";

type Override = {
  tool_slug: string;
  enabled: boolean;
  name_override: string | null;
  description_override: string | null;
  category_override: Tool["category"] | null;
  required_plan: string;
};

let cachedOverrides: Override[] | null = null;

export default function ToolsPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("All");
  const [available, setAvailable] = useState<Tool[]>(() => {
    if (cachedOverrides) {
      return applyOverrides(tools, cachedOverrides);
    }
    return tools;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setQuery(q);
      const cat = params.get("category");
      if (cat) setCategory(cat);
    }
    if (cachedOverrides) return;
    fetch("/api/tools/settings", { cache: "force-cache" })
      .then((r) => r.json())
      .then((body: { overrides?: Override[] }) => {
        const rows = body.overrides || [];
        cachedOverrides = rows;
        setAvailable(applyOverrides(tools, rows));
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return available.filter((t) => {
      const matchCat =
        category === "All" ||
        t.category === category ||
        (category === "Developer" && t.category === "Developer") ||
        (category === "SEO" && t.category === "SEO") ||
        (category === "Utility" && t.category === "Utilities") ||
        (category === "Calculator" && t.category === "Calculators");
      if (!matchCat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [deferredQuery, category, available]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: available.length };
    for (const t of available) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, [available]);

  return (
    <main className="min-h-screen bg-white">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Tool Catalog</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              All Tools
            </h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Browse 79 focused utilities across documents, images, development, and everyday calculations.
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-6 flex max-w-xl items-center rounded-xl border border-line bg-white p-1.5 focus-within:border-ink">
            <Search className="ml-3 text-muted shrink-0" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools by name, category, or task..."
              className="w-full bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mr-2 rounded p-1 text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CATEGORY TABS & TOOLS LIST ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {/* Category Filter Tabs */}
        <div className="mobile-scroll flex gap-1.5 pb-2">
          {["All", ...categories.map((c) => c.name.replace(" Tools", ""))].map((item) => {
            const active = category === item;
            const count = item === "All" ? categoryCounts["All"] : categoryCounts[item] || 0;
            return (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-ink text-white"
                    : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
                }`}
              >
                <span>{item}</span>
                {count > 0 && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] ${
                      active ? "bg-neutral-800 text-white" : "bg-pale text-muted"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="mt-6 flex items-center justify-between border-b border-line pb-3 text-xs text-muted">
          <span>
            Showing <strong className="text-ink">{filtered.length}</strong> {filtered.length === 1 ? "tool" : "tools"}
            {category !== "All" && <span> in {category}</span>}
            {query && <span> matching &ldquo;{query}&rdquo;</span>}
          </span>
          <span>Fast · Client-side · Free</span>
        </div>

        {/* Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-line bg-white p-12 text-center">
              <p className="text-base font-bold text-ink">No tools found</p>
              <p className="mt-1 text-xs text-muted">
                No matching tools for &ldquo;{query}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
                className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function applyOverrides(baseTools: Tool[], overrides: Override[]): Tool[] {
  return baseTools.flatMap((tool) => {
    const row = overrides.find((item) => item.tool_slug === tool.slug);
    if (row && !row.enabled) return [];
    return [
      {
        ...tool,
        name: row?.name_override || tool.name,
        description: row?.description_override || tool.description,
        category: row?.category_override || tool.category,
        pro: false,
      },
    ];
  });
}
