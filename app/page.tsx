import Link from "next/link";
import { ArrowRight, ChevronRight, Zap, ShieldCheck, Clock, Check, Layers, Cpu, Globe, Search, Terminal } from "lucide-react";
import { categories, popularTools, tools } from "../lib/tools";
import { ToolCard } from "../components/tool-card";
import { HeroSearch } from "../components/hero-search";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative border-b border-line bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-pale px-3 py-1 text-xs font-medium text-muted mb-6">
            <span>Everyday Tools. One Platform.</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Everything You Need.<br />
            <span className="text-neutral-500 font-normal">One Platform.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            Discover simple, powerful tools for everyday tasks, productivity, documents, images, and development. Get things done without unnecessary complexity.
          </p>

          {/* Clean Search Bar */}
          <HeroSearch />

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Explore All Tools <ArrowRight size={15} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-lg border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pale"
            >
              About ToolModeOn
            </Link>
          </div>

          {/* Quick jump category tags */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
            <span className="text-neutral-400">Jump to:</span>
            {[
              { name: "PDF", href: "/tools/pdf" },
              { name: "Image", href: "/tools/image" },
              { name: "Developer", href: "/tools/developer" },
              { name: "SEO", href: "/tools/seo" },
              { name: "Social Media", href: "/tools/social" },
              { name: "Calculators", href: "/tools/calculators" },
              { name: "Utilities", href: "/tools/utilities" },
            ].map((chip) => (
              <Link
                key={chip.name}
                href={chip.href}
                className="rounded-md border border-line bg-white px-2.5 py-1 text-ink transition hover:border-ink hover:bg-pale"
              >
                {chip.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR TOOLS ────────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Selected Utilities</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Popular Tools</h2>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline"
            >
              View all {tools.length} tools <ChevronRight size={14} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOL CATEGORIES ────────────────────────────────────────── */}
      <section className="border-b border-line bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Tool Categories</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Organized by task
            </h2>
            <p className="mt-2 text-sm text-muted">
              Find exactly what you need across our structured utility categories.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.slug}
                  href={`/tools/${category.slug}`}
                  className="group rounded-xl border border-line bg-white p-5 transition-all duration-150 hover:border-ink hover:bg-pale"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pale text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className="text-xs font-medium text-muted">{category.count} tools</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-sm text-ink">{category.name}</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                    {category.description}
                  </p>
                  <div className="mt-3 text-[11px] font-semibold text-ink inline-flex items-center gap-1">
                    Browse category <ArrowRight size={11} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY TOOLMODEON ───────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Platform Architecture</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Why ToolModeOn?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Built with purpose: simple, fast, and respectful of your data.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Simple to Use",
                desc: "Clean interfaces with zero learning curve. Drop your input, adjust options, and download results in seconds.",
              },
              {
                title: "Fast Processing",
                desc: "Leverages modern browser WebAssembly and local JavaScript execution for sub-second performance without server queues.",
              },
              {
                title: "Useful Everyday Tools",
                desc: "79 focused utilities across PDF manipulation, image conversion, code minification, SEO inspection, and calculations.",
              },
              {
                title: "Convenient Platform",
                desc: "Everything under one roof. No need to visit ten different ad-bloated single-purpose websites.",
              },
              {
                title: "Privacy-Conscious Processing",
                desc: "Client-side processing keeps your sensitive documents and images on your machine. Nothing is retained or uploaded.",
              },
              {
                title: "Always Available",
                desc: "Accessible 24/7 on desktop, tablet, and mobile. Responsive layout designed for clarity across all screen sizes.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-line bg-white p-6">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pale text-ink">
                  <Check size={15} strokeWidth={2.5} />
                </div>
                <h3 className="mt-4 font-semibold text-sm text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (DARK SECTION) ─────────────────────────────────── */}
      <section className="bg-ink text-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Make Everyday Work Simpler.
          </h2>
          <p className="mt-3 text-sm text-neutral-400 max-w-md mx-auto">
            Find the right tool and get started.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-neutral-100"
            >
              Explore Tools <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
