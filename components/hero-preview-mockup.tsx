"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileText,
  ImageIcon,
  Code2,
  Search,
  Type,
  Calculator,
  ChevronRight,
  ChevronDown,
  Zap,
} from "lucide-react";

export function HeroPreviewMockup() {
  const [activeCategory, setActiveCategory] = useState("all");

  const categoryCards = [
    {
      slug: "pdf",
      title: "PDF Tools",
      description: "Edit, convert and manage PDF files.",
      icon: FileText,
      href: "/tools/pdf",
    },
    {
      slug: "image",
      title: "Image Tools",
      description: "Resize, enhance and convert images.",
      icon: ImageIcon,
      href: "/tools/image",
    },
    {
      slug: "developer",
      title: "Developer Tools",
      description: "Format, minify and work with code.",
      icon: Code2,
      href: "/tools/developer",
    },
    {
      slug: "seo",
      title: "SEO Tools",
      description: "Analyze, optimize and improve your website.",
      icon: Search,
      href: "/tools/seo",
    },
    {
      slug: "text",
      title: "Text Tools",
      description: "Edit, convert and process text.",
      icon: Type,
      href: "/tools/text",
    },
    {
      slug: "calculators",
      title: "Calculators",
      description: "Useful calculation tools for everyday needs.",
      icon: Calculator,
      href: "/tools/calculators",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none [perspective:1400px]">
      {/* Background ambient decorative shapes matching screenshot */}
      <div className="absolute -top-12 -right-8 h-48 w-48 rounded-full bg-neutral-200/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-neutral-100 blur-2xl pointer-events-none" />

      {/* 3D Dark Angled Underlay Plate */}
      <div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-neutral-900 shadow-2xl transition-transform duration-700 ease-out"
        style={{
          transform: "rotate(-2.8deg) translateY(12px) translateX(10px) scale(0.98)",
        }}
      />

      {/* 3D Tilted Main Window Mockup Card */}
      <div
        className="relative rounded-2xl sm:rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-2xl transition-all duration-500 ease-out hover:[transform:rotateY(-4deg)_rotateX(2deg)_translateY(-4px)]"
        style={{
          transform: "rotateY(-7deg) rotateX(4deg) rotateZ(0.8deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top Window Bar */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-950 p-0.5 shadow-xs">
              <img
                src="/logo.png"
                alt="ToolModeOn Logo"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-xs font-bold tracking-tight text-neutral-900">ToolModeOn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-neutral-200" />
            <span className="h-2 w-2 rounded-full bg-neutral-300" />
            <span className="h-2 w-2 rounded-full bg-neutral-200" />
          </div>
        </div>

        {/* Window Content: Header */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950">
            All Tools
          </h2>

          {/* Category Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                activeCategory === "all"
                  ? "bg-neutral-950 text-white shadow-xs"
                  : "border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              All Tools
            </button>
            <Link
              href="/tools/pdf"
              className="rounded-full border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-neutral-600 font-medium whitespace-nowrap hover:bg-neutral-100 transition"
            >
              PDF Tools
            </Link>
            <Link
              href="/tools/image"
              className="rounded-full border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-neutral-600 font-medium whitespace-nowrap hover:bg-neutral-100 transition"
            >
              Image Tools
            </Link>
            <Link
              href="/tools/developer"
              className="rounded-full border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-neutral-600 font-medium whitespace-nowrap hover:bg-neutral-100 transition"
            >
              Developer
            </Link>
            <Link
              href="/tools/seo"
              className="rounded-full border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-neutral-600 font-medium whitespace-nowrap hover:bg-neutral-100 transition hidden sm:inline-block"
            >
              SEO Tools
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-neutral-600 font-medium whitespace-nowrap hover:bg-neutral-100 transition"
            >
              More <ChevronDown size={11} />
            </Link>
          </div>
        </div>

        {/* 2x3 Grid of Tool Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {categoryCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                href={item.href}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-200/90 bg-white p-3 sm:p-3.5 transition-all duration-200 hover:border-neutral-900 hover:bg-neutral-50/60 hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 text-neutral-900 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <h3 className="mt-2.5 text-xs sm:text-sm font-bold text-neutral-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

