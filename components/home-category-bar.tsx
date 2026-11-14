"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { categories, tools, type Tool } from "../lib/tools";

export function HomeCategoryBar() {
  // Ordered categories as requested:
  // PDF Tools, Image Tools, Developer Tools, SEO Tools, Social Media & Marketing, Calculator Tools, Text Tools, AI Tools, Utility Tools
  const orderedCategories = useMemo(() => {
    const order = [
      "pdf",
      "image",
      "developer",
      "seo",
      "social",
      "calculators",
      "text",
      "ai",
      "utilities",
    ];
    return [...categories].sort((a, b) => {
      const idxA = order.indexOf(a.slug);
      const idxB = order.indexOf(b.slug);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [categories]);

  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("pdf");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const toolsScrollRef = useRef<HTMLDivElement>(null);

  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(true);

  const [canScrollToolLeft, setCanScrollToolLeft] = useState(false);
  const [canScrollToolRight, setCanScrollToolRight] = useState(true);

  const updateCategoryScrollState = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollCatLeft(el.scrollLeft > 10);
    setCanScrollCatRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const updateToolScrollState = () => {
    const el = toolsScrollRef.current;
    if (!el) return;
    setCanScrollToolLeft(el.scrollLeft > 10);
    setCanScrollToolRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    updateCategoryScrollState();
    updateToolScrollState();
  }, [activeCategorySlug, orderedCategories]);

  const scrollCategories = (direction: "left" | "right") => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const offset = direction === "left" ? -320 : 320;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollTools = (direction: "left" | "right") => {
    const el = toolsScrollRef.current;
    if (!el) return;
    const offset = direction === "left" ? -340 : 340;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const selectedCategory = useMemo(() => {
    return orderedCategories.find((c) => c.slug === activeCategorySlug) || orderedCategories[0];
  }, [activeCategorySlug, orderedCategories]);

  const categoryTools = useMemo(() => {
    if (!selectedCategory) return tools;
    const catMap: Record<string, string> = {
      pdf: "PDF",
      image: "Image",
      developer: "Developer",
      seo: "SEO",
      social: "Social",
      calculators: "Calculators",
      text: "Text",
      ai: "AI",
      utilities: "Utilities",
    };
    const targetCat = catMap[selectedCategory.slug];
    return tools.filter((t) => t.category === targetCat);
  }, [selectedCategory, tools]);

  return (
    <section className="border-b border-line bg-white py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Interactive Category Navigator
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Browse Tools by Category
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted">
              Scroll horizontally from left to right to explore all 9 categories and their tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              disabled={!canScrollCatLeft}
              aria-label="Scroll categories left"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:border-ink hover:bg-pale disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              disabled={!canScrollCatRight}
              aria-label="Scroll categories right"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:border-ink hover:bg-pale disabled:opacity-30 disabled:pointer-events-none shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── 1. HORIZONTAL SCROLLING CATEGORIES BAR (Left to Right) ───────── */}
        <div className="relative">
          <div
            ref={categoryScrollRef}
            onScroll={updateCategoryScrollState}
            className="no-scrollbar flex items-center gap-3 overflow-x-auto scroll-smooth py-1 px-0.5"
          >
            {orderedCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.slug === activeCategorySlug;

              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategorySlug(cat.slug)}
                  className={`group relative flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 ${
                    isActive
                      ? "border-ink bg-ink text-white shadow-md"
                      : "border-line bg-white text-ink hover:border-ink hover:bg-pale/80 shadow-sm"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive ? "bg-white/15 text-white" : "bg-pale text-ink group-hover:bg-ink group-hover:text-white"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <div className="min-w-0 pr-1">
                    <span
                      className={`block whitespace-nowrap text-xs sm:text-sm font-bold tracking-tight ${
                        isActive ? "text-white" : "text-ink"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span
                      className={`block text-[11px] font-medium ${
                        isActive ? "text-white/70" : "text-muted"
                      }`}
                    >
                      {cat.count} tools
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. CATEGORY-WISE TOOLS SCROLLER (Scrolls Left to Right) ────────── */}
        <div className="mt-8 rounded-3xl border border-line bg-pale/40 p-5 sm:p-7 space-y-5">
          {/* Active Category Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
                <selectedCategory.icon size={16} strokeWidth={2} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink tracking-tight">
                    {selectedCategory.name}
                  </h3>
                  <span className="rounded-full bg-white border border-line px-2 py-0.5 text-[10px] font-bold text-muted">
                    {categoryTools.length} tools available
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">
                  {selectedCategory.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/tools/${selectedCategory.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:underline"
              >
                Browse all {selectedCategory.name} <ArrowRight size={13} />
              </Link>

              {/* Tools Left/Right Scroll Arrows */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-line">
                <button
                  type="button"
                  onClick={() => scrollTools("left")}
                  disabled={!canScrollToolLeft}
                  aria-label="Scroll tools left"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink hover:border-ink hover:bg-pale disabled:opacity-30 disabled:pointer-events-none transition shadow-sm"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollTools("right")}
                  disabled={!canScrollToolRight}
                  aria-label="Scroll tools right"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink hover:border-ink hover:bg-pale disabled:opacity-30 disabled:pointer-events-none transition shadow-sm"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Tool Cards Track */}
          <div
            ref={toolsScrollRef}
            onScroll={updateToolScrollState}
            className="no-scrollbar flex items-stretch gap-4 overflow-x-auto scroll-smooth py-1 px-0.5"
          >
            {categoryTools.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  prefetch={true}
                  className="group relative flex w-[280px] sm:w-[310px] shrink-0 flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition-all duration-150 hover:border-ink hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pale text-ink transition-colors group-hover:bg-ink group-hover:text-white">
                        <ToolIcon size={17} strokeWidth={2} />
                      </span>
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                        Free · Client-Side
                      </span>
                    </div>

                    <h4 className="mt-3.5 text-sm font-bold text-ink tracking-tight group-hover:text-ink">
                      {tool.name}
                    </h4>
                    <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] font-semibold text-ink">
                    <span className="text-muted">{tool.category}</span>
                    <span className="inline-flex items-center gap-1 text-ink transition-transform duration-150 group-hover:translate-x-0.5">
                      Open Tool <ArrowUpRight size={12} strokeWidth={2.2} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

