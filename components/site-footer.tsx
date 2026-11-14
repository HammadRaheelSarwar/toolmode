"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { getPublicSiteConfig } from "../lib/site-config";
import { OFFICIAL_EMAIL } from "../lib/seo-constants";

export function SiteFooter() {
  const [brandName, setBrandName] = useState("ToolModeOn");
  const [logoUrl, setLogoUrl] = useState("");
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    getPublicSiteConfig().then((config) => {
      if (config?.platform_name) setBrandName(config.platform_name);
      if (config?.logo_url) setLogoUrl(config.logo_url);
    });
  }, []);

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 p-1.5 shadow-xs shrink-0">
                <img
                  src={logoUrl || "/logo.png"}
                  alt={`${brandName} Logo`}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-base font-bold text-ink">{brandName}</span>
            </Link>
            <p className="mt-3.5 max-w-xs text-xs leading-relaxed text-muted">
              Everyday Tools. One Platform. Minimalist, fast, and privacy-conscious online utilities
              for everyday work.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-ink">
              <Mail size={13} className="text-muted shrink-0" />
              <a
                href="mailto:toolmodeon@gmail.com"
                className="hover:underline text-muted hover:text-ink transition"
              >
                toolmodeon@gmail.com
              </a>
            </div>
            <div className="mt-5 flex gap-2">
              <a
                href="https://twitter.com/toolmodeon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink transition"
              >
                <Twitter size={14} />
              </a>
              <a
                href="https://github.com/toolmodeon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink transition"
              >
                <Github size={14} />
              </a>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted">
                <Linkedin size={14} />
              </span>
            </div>
          </div>

          <FooterCol
            title="Tools"
            links={[
              ["All tools", "/tools"],
              ["PDF tools", "/tools/pdf"],
              ["Image tools", "/tools/image"],
              ["Developer tools", "/tools/developer"],
              ["SEO tools", "/tools/seo"],
              ["Social tools", "/tools/social"],
              ["Calculators", "/tools/calculators"],
            ]}
          />

          <FooterCol
            title="Company"
            links={[
              ["About Us", "/about"],
              ["Contact Us", "/contact"],
              ["Blog", "/blog"],
              ["Help Center", "/help"],
            ]}
          />

          <FooterCol
            title="Legal"
            links={[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms of Service", "/terms"],
              ["Cookie Policy", "/cookies"],
              ["Disclaimer", "/disclaimer"],
              ["Affiliate Disclosure", "/affiliate-disclosure"],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <span>&copy; {currentYear} {brandName}. All rights reserved.</span>
          <span>Fast &middot; Private &middot; Free</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink">{title}</h3>
      <div className="mt-4 grid gap-2.5">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="text-xs text-muted transition hover:text-ink">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
