"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight, Layers } from "lucide-react";
import { getPublicSiteConfig } from "../lib/site-config";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName] = useState("ToolModeOn");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    getPublicSiteConfig().then((config) => {
      if (config?.platform_name) setBrandName(config.platform_name);
      if (config?.logo_url) setLogoUrl(config.logo_url);
    });
  }, []);

  const nav = [
    ["All tools", "/tools"],
    ["PDF tools", "/tools/pdf"],
    ["Image tools", "/tools/image"],
    ["Developer", "/tools/developer"],
    ["SEO tools", "/tools/seo"],
    ["Calculators", "/tools/calculators"],
    ["Text tools", "/tools/text"],
    ["Utilities", "/tools/utilities"],
    ["AI tools", "/tools/ai"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <img
            src={logoUrl || "/logo.png"}
            alt="ToolModeOn Logo"
            className="h-8 md:h-9 w-auto object-contain"
          />
          <span className="text-[17px] font-bold tracking-tight text-ink">{brandName}</span>
          <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            100% Free
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted transition hover:bg-hover hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/tools"
            prefetch={true}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
          >
            Explore Tools <ArrowRight size={13} />
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-ink hover:bg-hover lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-5 py-4 lg:hidden">
          <nav className="grid grid-cols-2 gap-1.5">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-hover"
              >
                {label}
              </Link>
            ))}
            <div className="col-span-2 mt-2 border-t border-line pt-3">
              <Link
                href="/tools"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Explore All Tools <ArrowRight size={14} />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
