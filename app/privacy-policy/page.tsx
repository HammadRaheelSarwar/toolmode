import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, FileCheck, Eye, AlertCircle, Mail, ExternalLink } from "lucide-react";
import { SITE_NAME, SITE_URL, OFFICIAL_EMAIL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "Privacy Policy | ToolModeOn",
  description:
    "Learn how ToolModeOn handles information, cookies, uploaded files, analytics and advertising.",
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy | ToolModeOn",
    description:
      "Learn how ToolModeOn handles information, cookies, uploaded files, analytics and advertising.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | ToolModeOn",
    description:
      "Learn how ToolModeOn handles information, cookies, uploaded files, analytics and advertising.",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 15, 2026";

  return (
    <main className="min-h-screen bg-white">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale/40 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-xs font-semibold text-muted shadow-2xs mb-6">
            <Shield size={13} className="text-ink" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            This Privacy Policy explains how ToolModeOn (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
            handles your information when you visit and use our website at{" "}
            <span className="font-semibold text-ink">https://toolmodeon.online</span>.
          </p>
          <p className="mt-3 text-xs text-muted">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      {/* ── POLICY BODY ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
        <div className="prose prose-neutral max-w-none text-ink space-y-12">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">1. Introduction</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ToolModeOn is dedicated to providing practical, accessible online utilities while
              respecting visitor privacy. We believe that everyday utility tasks—such as manipulating
              documents, resizing images, calculating everyday numbers, or formatting text—should
              not require unnecessary data collection. This document describes the types of
              information we may receive, how client-side processing functions, our cookie practices,
              and our disclosures regarding advertising and third-party services.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">2. Information We Collect</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We collect information in two primary ways: (a) information you voluntarily provide to
              us, and (b) technical data automatically collected when you interact with our website.
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2">
              <li>
                <strong className="text-ink">Technical & Device Data:</strong> Like most web
                services, our hosting infrastructure and Content Delivery Network (CDN) may log
                standard web traffic details, including Internet Protocol (IP) addresses, browser type,
                operating system, referring URLs, access timestamps, and page request headers.
              </li>
              <li>
                <strong className="text-ink">Operational Logs:</strong> Automated server logs are used
                strictly for security monitoring, preventing distributed denial-of-service (DDoS)
                attacks, and diagnosing server health.
              </li>
            </ul>
          </section>

          {/* 3. Information You Provide */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">3. Information You Provide</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              You may provide information directly to us when using certain features:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2">
              <li>
                <strong className="text-ink">Contact Inquiries:</strong> When you submit a message
                through our Contact Us page or email us directly at{" "}
                <a href="mailto:toolmodeon@gmail.com" className="underline text-ink">
                  toolmodeon@gmail.com
                </a>
                , we collect your full name, email address, subject, inquiry category, and message
                body to respond to your request.
              </li>
              <li>
                <strong className="text-ink">Account Credentials (Optional):</strong> ToolModeOn tools
                are freely available without registration. However, if you choose to create an
                account to save favorites or manage projects, authentication data (such as your email
                address and secure sign-in credentials) is handled through Supabase Authentication.
              </li>
            </ul>
          </section>

          {/* 4. Uploaded Files and Document Processing */}
          <section className="rounded-2xl border border-line bg-pale/40 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-ink">
              <FileCheck size={20} />
              <h2 className="text-xl font-bold tracking-tight text-ink m-0">
                4. Uploaded Files and Document Processing
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              We design our document and image utilities with a strict{" "}
              <strong className="text-ink">client-side first architecture</strong>:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs text-muted">
              <div className="rounded-xl border border-line bg-white p-4">
                <h3 className="font-bold text-sm text-ink mb-1">PDF & Image Tools</h3>
                <p>
                  Tools such as PDF Merger, PDF Compressor, Image Resizer, and Watermark Generator
                  process files directly inside your web browser using HTML5 Canvas, WebAssembly, and
                  client-side JavaScript. Your files are not uploaded to our application servers for
                  processing.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-white p-4">
                <h3 className="font-bold text-sm text-ink mb-1">Text & Developer Tools</h3>
                <p>
                  Utilities such as JSON Minifier, Code Formatter, Regex Tester, and Character
                  Counters execute entirely within local browser memory. Text entered into these tools
                  never leaves your computer or device.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              <strong className="text-ink">AI Tools Exception:</strong> When using AI writing or
              summarizing tools, submitted text prompts are transmitted securely via encrypted API to
              our configured AI provider (such as Google Gemini) to generate output. No personal files
              or images are shared with the AI model.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              <strong className="text-ink">Saved Projects:</strong> Files are never retained in server
              storage unless an authenticated user explicitly clicks &quot;Save to Project&quot;. In
              that event, the file is saved in a private storage bucket belonging to that user.
            </p>
          </section>

          {/* 5. How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">5. How We Use Information</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Information collected is used solely for legitimate operational purposes:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2">
              <li>To provide, operate, maintain, and optimize our website and online tools.</li>
              <li>To respond promptly to support inquiries, bug reports, and feedback.</li>
              <li>To monitor platform stability, detect fraud, and prevent malicious security abuse.</li>
              <li>To comply with applicable legal obligations and enforce our Terms of Service.</li>
            </ul>
          </section>

          {/* 6. Cookies and Similar Technologies */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              6. Cookies and Similar Technologies
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Cookies are small text files placed on your device to ensure basic site functionality
              and remember your preferences:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2">
              <li>
                <strong className="text-ink">Essential Cookies:</strong> Required to maintain secure
                sessions if you sign in to an account.
              </li>
              <li>
                <strong className="text-ink">Preference Storage:</strong> Local storage
                (&quot;localStorage&quot;) is used to remember your theme preferences, favorite tool
                shortcuts, and cookie consent choices without storing personal information.
              </li>
              <li>
                <strong className="text-ink">Managing Cookies:</strong> You can configure your
                browser settings to reject or delete cookies. Note that disabling essential cookies may
                impact features that require user authentication.
              </li>
            </ul>
          </section>

          {/* 7. Analytics and Usage Information */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              7. Analytics and Usage Information
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We may utilize aggregated, non-personally identifiable analytics to understand how
              visitors navigate our website, which tools are most frequently utilized, and where
              usability bottlenecks occur.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Optional analytics scripts remain disabled by default until you grant permission
              through our on-site Cookie Consent banner.
            </p>
          </section>

          {/* 8. Google AdSense and Advertising */}
          <section className="rounded-2xl border border-line bg-pale/40 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-ink">
              <Eye size={20} />
              <h2 className="text-xl font-bold tracking-tight text-ink m-0">
                8. Google AdSense and Advertising Disclosures
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              ToolModeOn includes the Google AdSense advertising verification code (Client ID:{" "}
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-line text-ink">
                ca-pub-9061183031295584
              </code>
              ). As we prepare to display advertisements to support our free tools, please review the
              following standard advertising disclosures:
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-muted space-y-2">
              <li>
                Third-party vendors, including Google, use cookies to serve ads based on a
                user&apos;s prior visits to ToolModeOn or other websites across the Internet.
              </li>
              <li>
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to
                our visitors based on their visit to our site and/or other sites on the Internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-ink underline"
                >
                  Google Ads Settings <ExternalLink size={11} />
                </a>
                .
              </li>
              <li>
                Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for
                personalized advertising by visiting{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-ink underline"
                >
                  www.aboutads.info <ExternalLink size={11} />
                </a>
                .
              </li>
            </ul>
          </section>

          {/* 9. Third-Party Advertising Providers */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              9. Third-Party Advertising Providers
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              When advertising is active, third-party ad networks and ad servers may use cookies,
              JavaScript, or web beacons in their advertisements and links displayed on ToolModeOn.
              These technologies automatically receive your IP address when ad requests occur.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              ToolModeOn has no access to or control over these cookies used by third-party
              advertisers. We recommend reviewing the respective privacy policies of these
              third-party ad servers for detailed information on their practices.
            </p>
          </section>

          {/* 10. Data Storage and Retention */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              10. Data Storage and Retention
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We retain personal data only for as long as strictly necessary to fulfill the purposes
              outlined in this policy:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2">
              <li>
                <strong className="text-ink">Client-side tools:</strong> Zero retention. Files and
                text are discarded immediately when the browser tab is closed or refreshed.
              </li>
              <li>
                <strong className="text-ink">Contact inquiries:</strong> Retained for a maximum of 12
                months to resolve ongoing support dialogs, after which they are purged.
              </li>
              <li>
                <strong className="text-ink">Account data:</strong> Retained until the account is
                deleted upon user request.
              </li>
            </ul>
          </section>

          {/* 11. File Deletion and Processing */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              11. File Deletion and Processing
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Because files processed through our PDF and Image tools remain within your browser&apos;s
              local runtime memory, there is no server-side deletion timer required—the data never
              resides on our physical servers in the first place. You maintain complete control over
              your original and transformed documents.
            </p>
          </section>

          {/* 12. Data Security */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">12. Data Security</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We employ industry-standard technical measures to safeguard the integrity of
              ToolModeOn. All data transmitted between your browser and our website is encrypted
              using modern Transport Layer Security (HTTPS/TLS). While no Internet transmission is
              entirely impenetrable, our client-side processing architecture drastically reduces
              exposure by avoiding remote file storage.
            </p>
          </section>

          {/* 13. Third-Party Services and External Links */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              13. Third-Party Services and External Links
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Our website may contain links to external websites, articles, or resources (such as
              developer documentation or social networks). ToolModeOn does not operate or control
              these external sites and assumes no responsibility for their content, privacy policies,
              or operational practices. We encourage you to review their policies upon visiting them.
            </p>
          </section>

          {/* 14. International Visitors */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              14. International Visitors (USA, UK, Canada, Australia, EU)
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ToolModeOn is accessible to global visitors. Depending on your jurisdiction (such as
              the European Economic Area, United Kingdom, Canada, Australia, or California and other
              U.S. states), you may have statutory privacy rights regarding your personal
              information, including the right to request access, correction, deletion, or restriction
              of your data.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              We do not sell, rent, or trade your personal information.
            </p>
          </section>

          {/* 15. Privacy Rights and Requests */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              15. Privacy Rights and Requests
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              To exercise any applicable data protection rights, request account deletion, or ask
              questions regarding how your information is handled, please submit a request to our
              designated privacy mailbox at{" "}
              <a href={`mailto:${OFFICIAL_EMAIL}`} className="font-semibold text-ink underline">
                {OFFICIAL_EMAIL}
              </a>
              . We will evaluate and respond to your request in accordance with applicable data
              protection laws.
            </p>
          </section>

          {/* 16. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">16. Children&apos;s Privacy</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ToolModeOn is intended for general audiences and does not knowingly collect or solicit
              personal information from children under the age of 13 (or under 16 where applicable by
              local law). If we become aware that personal information from a child has been collected
              without verified parental consent, we will take immediate steps to remove such
              information.
            </p>
          </section>

          {/* 17. Changes to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              17. Changes to This Privacy Policy
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We may revise this Privacy Policy periodically to reflect changes in our operational
              practices, tool features, or legal obligations. When changes are published, we will
              update the &quot;Last Updated&quot; date at the top of this page. We encourage visitors
              to review this page periodically.
            </p>
          </section>

          {/* 18. Contact Information */}
          <section className="rounded-2xl border border-line bg-pale/50 p-6 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-ink m-0">
              18. Contact Information
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              For any questions, concerns, or requests regarding this Privacy Policy or our privacy
              practices, please contact us directly:
            </p>
            <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
                <Mail size={15} />
              </span>
              <div>
                <p className="text-xs text-muted font-normal">Official Privacy Contact</p>
                <a href={`mailto:${OFFICIAL_EMAIL}`} className="hover:underline">
                  {OFFICIAL_EMAIL}
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
