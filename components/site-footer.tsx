"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Layers, Twitter, Github, Linkedin } from "lucide-react";
import { getPublicSiteConfig } from "../lib/site-config";

export function SiteFooter() {
  const [brandName, setBrandName] = useState("ToolModeOn");
  const [logoUrl, setLogoUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  useEffect(() => {
    getPublicSiteConfig().then((config) => {
      if (config?.platform_name) setBrandName(config.platform_name);
      if (config?.logo_url) setLogoUrl(config.logo_url);
      if (config?.support_email) setSupportEmail(config.support_email);
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
              Everyday Tools. One Platform. Minimalist, fast, and privacy-conscious online utilities for everyday work.
            </p>
            {supportEmail && (
              <a className="mt-3 inline-block text-xs font-medium text-ink hover:underline" href={`mailto:${supportEmail}`}>
                Contact: {supportEmail}
              </a>
            )}
            <div className="mt-5 flex gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink">
                <Twitter size={14} />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink">
                <Github size={14} />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink">
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
              ["About", "/about"],
              ["Blog", "/blog"],
              ["Contact", "/contact"],
              ["Help center", "/help"],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ["Privacy policy", "/privacy"],
              ["Terms of service", "/terms"],
              ["Cookie policy", "/cookies"],
              ["Disclaimer", "/disclaimer"],
              ["Affiliate disclosure", "/affiliate-disclosure"],
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <span>© 2026 ToolModeOn. Everyday Tools. One Platform.</span>
          <span>Fast · Private · Free</span>
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
