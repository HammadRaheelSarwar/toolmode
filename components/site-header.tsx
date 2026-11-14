"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Zap,
  ArrowRight,
  FileText,
  ImageIcon,
  Code2,
  Search,
  Share2,
  Calculator,
  Type,
  Sparkles,
  Wrench,
} from "lucide-react";
import { getPublicSiteConfig } from "../lib/site-config";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [brandName, setBrandName] = useState("ToolModeOn");
  const [logoUrl, setLogoUrl] = useState("");

  const toolsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPublicSiteConfig().then((config) => {
      if (config?.platform_name) setBrandName(config.platform_name);
      if (config?.logo_url) setLogoUrl(config.logo_url);
    });

    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navRoutes: Array<[string, string]> = [
    ["All tools", "/tools"],
    ["PDF tools", "/tools/pdf"],
    ["Image tools", "/tools/image"],
    ["Developer", "/tools/developer"],
    ["SEO tools", "/tools/seo"],
    ["Social", "/tools/social"],
    ["Calculators", "/tools/calculators"],
    ["Text tools", "/tools/text"],
    ["Utilities", "/tools/utilities"],
    ["AI tools", "/tools/ai"],
  ];

  const categories = [
    { name: "PDF Tools", slug: "pdf", count: "10 tools", icon: FileText },
    { name: "Image Tools", slug: "image", count: "8 tools", icon: ImageIcon },
    { name: "Developer Tools", slug: "developer", count: "10 tools", icon: Code2 },
    { name: "SEO Tools", slug: "seo", count: "10 tools", icon: Search },
    { name: "Social Media & Marketing", slug: "social", count: "10 tools", icon: Share2 },
    { name: "Calculator Tools", slug: "calculators", count: "5 tools", icon: Calculator },
    { name: "Text Tools", slug: "text", count: "10 tools", icon: Type },
    { name: "Utility Tools", slug: "utilities", count: "10 tools", icon: Wrench },
    { name: "AI Tools", slug: "ai", count: "8 tools", icon: Sparkles },
  ];

  const popularTools = [
    { name: "YouTube Thumbnail Downloader", slug: "youtube-thumbnail-downloader", category: "Social" },
    { name: "YouTube Channel Banner Resizer", slug: "youtube-banner-resizer", category: "Social" },
    { name: "Instagram Bio Formatter", slug: "instagram-bio-formatter", category: "Social" },
    { name: "PDF Merger", slug: "pdf-merger", category: "PDF" },
    { name: "PDF Compressor", slug: "pdf-compressor", category: "PDF" },
    { name: "Image Compressor", slug: "image-compressor", category: "Image" },
    { name: "Background Remover", slug: "background-remover", category: "Image" },
    { name: "QR Code Generator", slug: "qr-code-generator", category: "Utilities" },
    { name: "UTM Campaign Builder", slug: "utm-link-builder", category: "Social" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Left: Brand Logo + Divider */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${brandName} Logo`}
                className="h-8 md:h-9 w-auto object-contain"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-white shadow-xs">
                <Zap size={16} className="fill-white" />
              </span>
            )}
            <span className="text-[17px] font-bold tracking-tight text-neutral-950">
              {brandName}
            </span>
          </Link>

          {/* Thin Vertical Divider */}
          <div className="hidden h-5 w-[1px] bg-neutral-200 lg:block ml-2" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1.5 lg:flex">
          {/* Tools Dropdown */}
          <div
            ref={toolsRef}
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setToolsOpen(!toolsOpen)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Tools
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {toolsOpen && (
              <div className="absolute left-0 top-full pt-1.5 w-80 z-50">
                <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Popular Tools
                  </div>
                  <div className="mt-1 grid gap-0.5">
                    {popularTools.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/tools/${t.slug}`}
                        onClick={() => setToolsOpen(false)}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition"
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          {t.category}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 border-t border-neutral-100 pt-2 px-1">
                    <Link
                      href="/tools"
                      onClick={() => setToolsOpen(false)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:underline"
                    >
                      Browse all 81+ tools <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Categories Dropdown */}
          <div
            ref={categoriesRef}
            className="relative"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Categories
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {categoriesOpen && (
              <div className="absolute left-0 top-full pt-1.5 w-96 z-50">
                <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Browse Categories
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1">
                    {categories.map((c) => {
                      const Icon = c.icon;
                      return (
                        <Link
                          key={c.slug}
                          href={`/tools/${c.slug}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg p-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 hover:text-neutral-950 transition"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 shrink-0">
                            <Icon size={14} />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-neutral-900">{c.name}</div>
                            <div className="text-[10px] text-neutral-400">{c.count}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Blog Link */}
          <Link
            href="/blog"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            Blog
          </Link>

          {/* About Link */}
          <Link
            href="/about"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            About
          </Link>
        </nav>

        {/* Right CTA Button: "Get Started" */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/tools"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800 shadow-xs"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-neutral-900 hover:bg-neutral-100 lg:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-5 py-5 lg:hidden max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/tools/${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
              <Link
                href="/tools"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-neutral-800 hover:text-neutral-950 py-1"
              >
                All Tools
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-neutral-800 hover:text-neutral-950 py-1"
              >
                Blog & Articles
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-neutral-800 hover:text-neutral-950 py-1"
              >
                About ToolModeOn
              </Link>
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <Link
                href="/tools"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xs"
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
