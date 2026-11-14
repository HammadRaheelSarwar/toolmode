"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X } from "lucide-react";
import { tools } from "../lib/tools";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tools
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      router.push("/tools");
      return;
    }
    if (results.length === 1 && results[0]) {
      router.push(`/tools/${results[0].slug}`);
    } else {
      router.push(`/tools?q=${encodeURIComponent(query.trim())}`);
    }
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative mt-7 w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="flex items-center rounded-xl border border-neutral-200/90 bg-white p-1.5 shadow-xs transition-all focus-within:border-neutral-900 focus-within:shadow-md"
      >
        <div className="flex flex-1 items-center gap-2.5 px-3">
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            aria-label="Search for a tool"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search for a tool (e.g. PDF, image, text, SEO...)"
            className="w-full bg-transparent py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="rounded p-1 text-neutral-400 hover:text-neutral-900"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 shrink-0"
        >
          Search <ArrowRight size={13} />
        </button>
      </form>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-dropdown">
          {results.length > 0 ? (
            <div className="grid gap-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                Tools ({results.length})
              </div>
              {results.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-lg p-2.5 transition hover:bg-pale group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-pale text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-ink truncate">
                          {tool.name}
                        </div>
                        <div className="text-xs text-muted truncate max-w-sm">
                          {tool.description}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted pl-2">
                      {tool.category} →
                    </span>
                  </Link>
                );
              })}
              <div className="border-t border-line mt-1 pt-1.5 px-3 py-1 flex items-center justify-between text-xs text-muted">
                <span>Press Enter to view all</span>
                <Link
                  href={`/tools?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="font-semibold text-ink hover:underline"
                >
                  View all results
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center text-xs text-muted">
              No tools found for &ldquo;{query}&rdquo;.{" "}
              <Link href="/tools" onClick={() => setOpen(false)} className="font-semibold text-ink underline">
                Browse catalog
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
