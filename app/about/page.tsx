import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  ImageIcon,
  Calculator,
  Type,
  Sparkles,
  Search,
  Code2,
  Wrench,
  Share2,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { SITE_NAME, SITE_URL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "About ToolModeOn | Everyday Tools. One Platform.",
  description:
    "Discover ToolModeOn, an online platform offering practical PDF, image, AI, developer, SEO and productivity tools.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About ToolModeOn | Everyday Tools. One Platform.",
    description:
      "Discover ToolModeOn, an online platform offering practical PDF, image, AI, developer, SEO and productivity tools.",
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/logo-full.jpg`,
        width: 1024,
        height: 341,
        alt: `About ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About ToolModeOn | Everyday Tools. One Platform.",
    description:
      "Discover ToolModeOn, an online platform offering practical PDF, image, AI, developer, SEO and productivity tools.",
    images: [`${SITE_URL}/logo-full.jpg`],
  },
};

export default function AboutPage() {
  const categories = [
    {
      title: "PDF Tools",
      description:
        "Merge, compress, split, password-protect, unlock, paginate, and convert PDF documents with client-side browser processing.",
      icon: FileText,
      href: "/tools/pdf",
      count: "10 tools",
    },
    {
      title: "Image Tools",
      description:
        "Compress, resize, crop, rotate, watermark, and convert image files with instant client-side canvas transformations.",
      icon: ImageIcon,
      href: "/tools/image",
      count: "8 tools",
    },
    {
      title: "Calculator Tools",
      description:
        "Instant calculation utilities for loans, percentages, BMI, chronological age, and live currency conversions.",
      icon: Calculator,
      href: "/tools/calculators",
      count: "5 tools",
    },
    {
      title: "Text Tools",
      description:
        "Comprehensive text analysis, case transformations, duplicate removal, diff comparison, and formatting tools.",
      icon: Type,
      href: "/tools/text",
      count: "10 tools",
    },
    {
      title: "AI Tools",
      description:
        "AI-assisted writing, summarizing, grammar verification, headline generation, email drafting, and code explanations.",
      icon: Sparkles,
      href: "/tools/ai",
      count: "8 tools",
    },
    {
      title: "SEO and Website Tools",
      description:
        "Meta tag generation, SERP previews, robots.txt testing, sitemap building, UTM tracking, and link status verification.",
      icon: Search,
      href: "/tools/seo",
      count: "10 tools",
    },
    {
      title: "Developer Tools",
      description:
        "JSON/SQL formatters, JavaScript/CSS/HTML minifiers, regex testing, cron generators, and timestamp converters.",
      icon: Code2,
      href: "/tools/developer",
      count: "10 tools",
    },
    {
      title: "Utility Tools",
      description:
        "QR code & barcode generators, secure password creators, unit converters, UUID generators, and base64 encoders.",
      icon: Wrench,
      href: "/tools/utilities",
      count: "10 tools",
    },
    {
      title: "Social Media and Marketing Tools",
      description:
        "YouTube thumbnail downloaders, banner resizers, bio formatters, hashtag generators, post previews, and signature builders.",
      icon: Share2,
      href: "/tools/social",
      count: "10 tools",
    },
  ];

  const audienceGroups = [
    {
      role: "Students",
      description:
        "Merge lecture notes, compress project submissions, calculate percentages, and format essays without intrusive ads.",
    },
    {
      role: "Professionals",
      description:
        "Prepare clean client documents, calculate loan options, build email signatures, and convert files with browser-side privacy.",
    },
    {
      role: "Developers",
      description:
        "Format messy JSON responses, minify production scripts, validate regex patterns, and debug cron schedules in seconds.",
    },
    {
      role: "Content Creators",
      description:
        "Preview social media posts across layouts, resize channel banners, generate hashtags, and fetch YouTube thumbnails.",
    },
    {
      role: "Businesses",
      description:
        "Generate campaign UTM links, create customer QR codes, draft announcements, and analyze SEO meta structures.",
    },
    {
      role: "Everyday Internet Users",
      description:
        "Simple, fast utilities for everyday tasks that run smoothly on desktop, tablet, and mobile browsers.",
    },
  ];

  const approachPrinciples = [
    {
      title: "Simplicity",
      description:
        "Every tool is built around an intuitive, uncluttered interface. No confusing configuration menus or unnecessary steps.",
      icon: Zap,
    },
    {
      title: "Accessibility",
      description:
        "Tools run directly in any modern web browser without software installation, plugins, or complex setup prerequisites.",
      icon: Compass,
    },
    {
      title: "Transparency",
      description:
        "We explicitly state how tools operate, whether processing happens in your browser or via an API, and what limitations apply.",
      icon: ShieldCheck,
    },
    {
      title: "User Experience",
      description:
        "A calm, black-and-white minimalist design system that emphasizes high contrast, fast loading times, and zero visual clutter.",
      icon: Layers,
    },
    {
      title: "Continuous Improvement",
      description:
        "We actively maintain existing tools, optimize processing performance, and introduce new requested utilities based on feedback.",
      icon: CheckCircle2,
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* ── SECTION 1: HERO ───────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale/40 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-xs font-semibold text-muted shadow-2xs mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            <span>About ToolModeOn</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Everything You Need.
            <br />
            <span className="text-neutral-500 font-normal">One Platform.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            ToolModeOn brings together useful online tools designed to make everyday digital tasks
            easier. From documents and images to calculations, productivity and development, our
            goal is to help people get things done with less complexity.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: WHO WE ARE ─────────────────────────────────────── */}
      <section className="border-b border-line bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Who We Are</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              A dependable home for your everyday digital tasks
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ToolModeOn is an online platform that brings multiple practical digital tools together
              in one accessible place. Instead of navigating dozens of separate single-purpose
              websites crowded with intrusive advertisements, users can find focused, reliable
              utilities under one roof.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audienceGroups.map((group) => (
              <div
                key={group.role}
                className="rounded-xl border border-line bg-pale/40 p-6 transition hover:border-ink"
              >
                <div className="flex items-center gap-2 text-ink">
                  <Users size={16} className="text-muted" />
                  <h3 className="font-bold text-sm">{group.role}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{group.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: OUR MISSION ────────────────────────────────────── */}
      <section className="border-b border-line bg-pale/30 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Our Purpose</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Making Everyday Digital Tasks Simpler.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Modern digital work often involves small, repetitive chores—resizing an image,
              extracting pages from a PDF, calculating a ratio, formatting JSON, or generating a
              tracking link. These tasks shouldn&apos;t require heavy software subscriptions, bulky
              installers, or privacy compromises.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Simple & Accessible Tools",
                desc: "Zero installation required. Instant processing directly in your modern web browser.",
              },
              {
                title: "Convenient Online Workflows",
                desc: "All your essential everyday utilities gathered into a single, organized catalog.",
              },
              {
                title: "Clear User Experiences",
                desc: "High-contrast minimalist layouts that prioritize your input, output, and immediate results.",
              },
              {
                title: "Useful Productivity Features",
                desc: "One-click copy, structured file downloads, keyboard shortcuts, and live interactive previews.",
              },
              {
                title: "Privacy-Conscious Architecture",
                desc: "Client-side processing for documents and images ensures your data remains on your device.",
              },
              {
                title: "Continuous Improvement",
                desc: "Ongoing performance enhancements, bug fixes, and feature updates driven by user feedback.",
              },
            ].map((pillar) => (
              <div key={pillar.title} className="rounded-xl border border-line bg-white p-6 shadow-2xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pale text-ink">
                  <CheckCircle2 size={16} />
                </div>
                <h3 className="mt-4 font-bold text-sm text-ink">{pillar.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHAT WE OFFER ──────────────────────────────────── */}
      <section className="border-b border-line bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">What We Offer</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Structured tool suites
              </h2>
              <p className="mt-2 text-sm text-muted">
                Explore our active catalog of 81+ focused utilities across 9 practical categories.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:underline"
            >
              Browse complete catalog <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className="group rounded-xl border border-line bg-white p-5 transition hover:border-ink hover:bg-pale/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pale text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-medium text-muted">{cat.count}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-sm text-ink">{cat.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                    {cat.description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-ink">
                    Open category <ArrowRight size={11} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: OUR APPROACH ───────────────────────────────────── */}
      <section className="border-b border-line bg-pale/40 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Our Approach</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Built on transparency, speed, and respect
            </h2>
            <p className="mt-2 text-sm text-muted">
              We design every feature adhering to five core principles.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approachPrinciples.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-line bg-white p-6 shadow-2xs">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pale text-ink">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 font-bold text-sm text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: CALL TO ACTION (DARK SECTION) ─────────────────── */}
      <section className="bg-ink text-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find the Right Tool for Your Task.
          </h2>
          <p className="mt-3 text-sm text-neutral-400 max-w-md mx-auto">
            Explore 81+ free online tools or get in touch with our team if you need assistance or
            have suggestions.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-neutral-100 shadow-xs"
            >
              Explore All Tools <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border border-neutral-700 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
