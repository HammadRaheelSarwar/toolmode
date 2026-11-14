import type { Metadata } from "next";
import { Mail, Clock, HelpCircle, Shield, Bug, MessageSquare, Handshake } from "lucide-react";
import { ContactForm } from "../../components/contact-form";
import { SITE_NAME, SITE_URL, OFFICIAL_EMAIL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "Contact ToolModeOn | Support and Inquiries",
  description:
    "Contact ToolModeOn for technical support, feedback, business inquiries and general assistance.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact ToolModeOn | Support and Inquiries",
    description:
      "Contact ToolModeOn for technical support, feedback, business inquiries and general assistance.",
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/logo-full.jpg`,
        width: 1024,
        height: 341,
        alt: `Contact ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact ToolModeOn | Support and Inquiries",
    description:
      "Contact ToolModeOn for technical support, feedback, business inquiries and general assistance.",
    images: [`${SITE_URL}/logo-full.jpg`],
  },
};

export default function ContactPage() {
  const categories = [
    {
      title: "General Inquiries",
      description: "General questions about ToolModeOn, tool features, and platform updates.",
      icon: MessageSquare,
    },
    {
      title: "Technical Support",
      description: "Assistance with tool execution, browser compatibility, and workflow troubleshooting.",
      icon: HelpCircle,
    },
    {
      title: "Bug Reports",
      description: "Report unexpected behavior, layout issues, or browser processing glitches.",
      icon: Bug,
    },
    {
      title: "Feedback & Suggestions",
      description: "Share your ideas for new tools, enhancements, or platform usability improvements.",
      icon: Clock,
    },
    {
      title: "Business & Partnerships",
      description: "Inquiries regarding integrations, business collaboration, and media requests.",
      icon: Handshake,
    },
    {
      title: "Privacy & Data Protection",
      description: "Questions regarding data processing, privacy practices, and user rights.",
      icon: Shield,
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* ── SECTION 1: HERO ───────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale/40 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-xs font-semibold text-muted shadow-2xs mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            <span>Contact Information</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            We&apos;re Here to Help.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
            Have a question, need technical assistance or want to share feedback? Contact the
            ToolModeOn team. We&apos;re happy to hear from you.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT: CONTACT INFO + FORM ─────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left Column: Direct Email & Support Categories */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Official Channels
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Get in touch directly
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Whether you have an inquiry regarding a specific tool or need privacy assistance,
                  our team is accessible via our primary email address:
                </p>

                {/* Official Email Card */}
                <div className="mt-6 rounded-2xl border border-line bg-pale/50 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
                      <Mail size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-muted">Primary Support Email</p>
                      <a
                        href="mailto:toolmodeon@gmail.com"
                        className="text-base font-bold text-ink hover:underline tracking-tight"
                      >
                        toolmodeon@gmail.com
                      </a>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    We review messages systematically. Inquiries typically receive responses within
                    24 to 48 business hours.
                  </p>
                </div>

                {/* Inquiry Categories List */}
                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
                    Inquiry Categories
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {categories.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pale text-ink shrink-0 mt-0.5">
                            <Icon size={14} />
                          </span>
                          <div>
                            <h3 className="font-semibold text-xs text-ink">{item.title}</h3>
                            <p className="mt-0.5 text-[11px] text-muted leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Contact Form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
