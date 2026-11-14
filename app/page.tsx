import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Zap,
  ShieldCheck,
  Layers,
  Users,
  LayoutGrid,
  PlayCircle,
  Check,
} from "lucide-react";
import { categories, popularTools, tools } from "../lib/tools";
import { ToolCard } from "../components/tool-card";
import { HeroSearch } from "../components/hero-search";
import { HomeCategoryBar } from "../components/home-category-bar";
import { HeroPreviewMockup } from "../components/hero-preview-mockup";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO SECTION (MATCHING SCREENSHOT) ───────────────────────── */}
      <section className="relative overflow-hidden border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        {/* Subtle dot matrix background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left Column: Headline, Description, Search, Action CTAs, Badges */}
            <div className="flex flex-col items-start lg:col-span-7">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs">
                <Zap size={13} className="fill-neutral-900 text-neutral-900" />
                <span>Everyday Tools. One Platform.</span>
              </div>

              {/* Bold Title */}
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl lg:text-[56px] lg:leading-[1.12]">
                Everything You Need.
                <br />
                One Platform.
              </h1>

              {/* Subheadline */}
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-600 max-w-xl">
                Discover simple, powerful tools for everyday tasks, productivity, documents, images,
                and development. Get things done without unnecessary complexity.
              </p>

              {/* Search Bar */}
              <HeroSearch />

              {/* Action Buttons */}
              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-xs"
                >
                  <LayoutGrid size={16} />
                  Explore All Tools
                </Link>
                <a
                  href="#tools-section"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 shadow-xs"
                >
                  <PlayCircle size={17} className="text-neutral-700" />
                  See How It Works
                </a>
              </div>

              {/* Trust & Feature Badges */}
              <div className="mt-10 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs font-semibold text-neutral-700 pt-6 border-t border-neutral-100 w-full max-w-xl">
                <div className="inline-flex items-center gap-1.5">
                  <Zap size={14} className="fill-neutral-900 text-neutral-900" />
                  <span>Fast & Reliable</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-neutral-900" />
                  <span>Privacy Focused</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Layers size={14} className="text-neutral-900" />
                  <span>100+ Tools</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Users size={14} className="text-neutral-900" />
                  <span>Trusted by Users</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Tilted Floating Mockup Card */}
            <div className="lg:col-span-5">
              <HeroPreviewMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── HORIZONTAL SCROLLING CATEGORY BAR & CATEGORY-WISE TOOLS ── */}
      <div id="tools-section">
        <HomeCategoryBar />
      </div>

      {/* ── TOOL CATEGORIES: ORGANIZED BY TASK ───────────────────────── */}
      <section className="border-b border-line bg-pale py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Tool Categories</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Organized by task
              </h2>
              <p className="mt-2 text-sm text-muted">
                Find exactly what you need across our structured utility categories.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline"
            >
              Browse all {tools.length} tools <ChevronRight size={14} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.slug}
                  href={`/tools/${category.slug}`}
                  className="group rounded-xl border border-line bg-white p-5 transition-all duration-150 hover:border-ink hover:bg-pale shadow-card"
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

      {/* ── POPULAR TOOLS ────────────────────────────────────────────── */}
      <section className="border-b border-line bg-white py-16 lg:py-20">
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
                title: "Generous Free Access",
                desc: "Over 80 focused utilities across PDF manipulation, image conversion, code minification, SEO inspection, social media, and calculations.",
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
