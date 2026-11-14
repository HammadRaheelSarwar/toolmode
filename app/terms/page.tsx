import type { Metadata } from "next";
import Link from "next/link";
import { Scale, AlertTriangle, ShieldCheck, FileText, Sparkles, Mail, CheckCircle2 } from "lucide-react";
import { SITE_NAME, SITE_URL, OFFICIAL_EMAIL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "Terms of Service | ToolModeOn",
  description:
    "Read the terms and conditions governing the use of ToolModeOn online tools and services.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: "Terms of Service | ToolModeOn",
    description:
      "Read the terms and conditions governing the use of ToolModeOn online tools and services.",
    url: `${SITE_URL}/terms`,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | ToolModeOn",
    description:
      "Read the terms and conditions governing the use of ToolModeOn online tools and services.",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "November 15, 2026";

  return (
    <main className="min-h-screen bg-white">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-pale/40 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-xs font-semibold text-muted shadow-2xs mb-6">
            <Scale size={13} className="text-ink" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            These Terms of Service govern your access to and use of ToolModeOn (available at{" "}
            <span className="font-semibold text-ink">https://toolmodeon.online</span>) and our
            suite of online utilities.
          </p>
          <p className="mt-3 text-xs text-muted">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      {/* ── TERMS BODY ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
        <div className="prose prose-neutral max-w-none text-ink space-y-12">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">1. Introduction</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Welcome to ToolModeOn (&quot;ToolModeOn&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
              By accessing or using our website, tools, applications, and related services
              (collectively, the &quot;Services&quot;), you acknowledge that you have read, understood,
              and agree to be bound by these Terms of Service. If you do not agree to these terms, you
              must immediately discontinue use of the Services.
            </p>
          </section>

          {/* 2. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">2. Acceptance of Terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              By using any tool or page on ToolModeOn, you affirm that you are of legal age in your
              jurisdiction to form a binding contract, or have obtained consent from a legal guardian.
              Your continued use of the platform represents ongoing agreement to these Terms and any
              future revisions.
            </p>
          </section>

          {/* 3. Description of Services */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">3. Description of Services</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ToolModeOn provides a comprehensive catalog of 81+ browser-based utilities spanning
              document processing (PDFs), image transformations, calculations, text utilities, developer
              tools, SEO inspection, and social media helpers. Most utilities run client-side in your
              web browser. We reserve the right to modify, add, or discontinue any feature or tool at
              our sole discretion.
            </p>
          </section>

          {/* 4. Eligibility and User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              4. Eligibility and User Responsibilities
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              You agree to use our Services solely for lawful purposes. You are solely responsible
              for:
            </p>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2">
              <li>Verifying that you have full legal rights to process any files or content you input.</li>
              <li>Reviewing output files and results prior to publishing, sharing, or relying on them.</li>
              <li>Maintaining independent backup copies of all original source files and documents.</li>
              <li>Ensuring your device, web browser, and network connection meet operating requirements.</li>
            </ul>
          </section>

          {/* 5. Acceptable Use Policy */}
          <section className="rounded-2xl border border-line bg-pale/40 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-ink">
              <ShieldCheck size={20} />
              <h2 className="text-xl font-bold tracking-tight text-ink m-0">
                5. Acceptable Use Policy
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              ToolModeOn is built to empower honest, productive digital work. Users must adhere strictly
              to this Acceptable Use Policy.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">
              You specifically agree NOT to:
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-muted space-y-2">
              <li>Upload, process, or distribute illegal, fraudulent, harmful, or defamatory content.</li>
              <li>Upload files containing computer viruses, malware, trojans, or malicious scripts.</li>
              <li>Violate any third party&apos;s copyright, trademark, trade secret, or privacy rights.</li>
              <li>Attack, flood, disrupt, or place an unreasonable load on ToolModeOn&apos;s server infrastructure.</li>
              <li>Circumvent, disable, or tamper with security controls, rate limiters, or access restrictions.</li>
              <li>Use unauthorized scrapers, spiders, or automated bots to extract tool data or overwhelm APIs.</li>
              <li>Attempt to reverse-engineer, decompile, or intercept private server-side backend logic.</li>
            </ul>
          </section>

          {/* 6. Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">6. Prohibited Activities</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Engaging in any prohibited conduct may result in immediate termination of access,
              revocation of any account, blocking of IP ranges, and where appropriate, referral to
              law enforcement authorities. We actively monitor traffic patterns to prevent malicious
              exploitation.
            </p>
          </section>

          {/* 7. Uploaded Files and User Content */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              7. Uploaded Files and User Content
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <strong className="text-ink">You retain 100% ownership</strong> of all files, text,
              images, and materials you upload or enter into ToolModeOn. We do not claim any
              intellectual property rights over your user content.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Because our PDF and image tools operate client-side directly within your browser, your
              files are not copied to or stored on our servers during normal processing.
            </p>
          </section>

          {/* 8. Copyright and Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              8. Copyright and Intellectual Property
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              All website software, branding, designs, logos, text guides, icons, graphics, and
              codebases comprising ToolModeOn are the property of ToolModeOn and protected by
              applicable copyright and intellectual property laws. You may not duplicate, redistribute,
              or mirror our website architecture without prior written authorization.
            </p>
          </section>

          {/* 9. PDF and Image Processing Limitations */}
          <section className="rounded-2xl border border-line bg-pale/40 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-ink">
              <FileText size={20} />
              <h2 className="text-xl font-bold tracking-tight text-ink m-0">
                9. File Processing Limitations and Disclaimers
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              While our tools are built using reliable open-source web standards, processing outcomes
              are dependent on your local browser memory, file complexity, and hardware capabilities:
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-muted space-y-2">
              <li>
                <strong className="text-ink">Maintain Original Backups:</strong> Always preserve your
                original files. Do not delete original documents until you have verified the integrity
                of converted or modified files.
              </li>
              <li>
                <strong className="text-ink">Browser Memory Constraints:</strong> Very large PDF files
                (e.g., hundreds of high-resolution pages) or multi-gigabyte images may exceed browser
                memory limits on mobile devices.
              </li>
              <li>
                <strong className="text-ink">No Guarantee of Exact Formatting:</strong> Complex PDF
                formatting, custom embedded typography, or corrupt files may not render identically
                across all reader software.
              </li>
            </ul>
          </section>

          {/* 10. AI-Generated Content Limitations */}
          <section className="rounded-2xl border border-line bg-pale/40 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-ink">
              <Sparkles size={20} />
              <h2 className="text-xl font-bold tracking-tight text-ink m-0">
                10. AI-Generated Content Limitations
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Certain features on ToolModeOn utilize artificial intelligence. Please understand that:
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-muted space-y-2">
              <li>
                AI-generated suggestions, summaries, outlines, and code explanations are automated
                outputs that may contain factual inaccuracies, omissions, or unintended phrasing.
              </li>
              <li>
                AI tools do not provide licensed legal, financial, medical, or tax advice. You must
                independently review and verify all generated content before commercial, professional,
                or contractual use.
              </li>
            </ul>
          </section>

          {/* 11. Accuracy and Reliability (Calculators) */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              11. Calculators and Informational Estimates
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Calculators (such as Loan, Percentage, BMI, and Age utilities) provide mathematical
              estimates based on user-provided inputs. Currency rates reflect third-party reference data
              and should not be used as official transaction exchange guarantees.
            </p>
          </section>

          {/* 12. Third-Party Services and Links */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              12. Third-Party Services and Advertising
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ToolModeOn may display advertisements served by Google AdSense and third-party advertising
              networks, or include links to external resources. We do not endorse, guarantee, or assume
              responsibility for any goods, services, or claims advertised by third parties.
            </p>
          </section>

          {/* 13. Website Availability and Maintenance */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              13. Website Availability and Maintenance
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We strive to keep ToolModeOn available 24/7/365. However, we do not warrant that service
              will be uninterrupted, bug-free, or error-free. We may perform routine maintenance, deploy
              upgrades, or experience temporary downtime due to host or network conditions without prior
              liability.
            </p>
          </section>

          {/* 14. Service Modifications */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">14. Service Modifications</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We reserve the right at any time to modify, suspend, or discontinue any portion of the
              Services with or without notice. We shall not be liable to you or any third party for any
              modification, suspension, or discontinuance.
            </p>
          </section>

          {/* 15. Disclaimer of Warranties */}
          <section className="rounded-2xl border border-line bg-pale/40 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-ink">
              <AlertTriangle size={20} />
              <h2 className="text-xl font-bold tracking-tight text-ink m-0">
                15. Disclaimer of Warranties
              </h2>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted uppercase tracking-wider font-semibold">
              THE SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS
              WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT
              PERMISSIBLE UNDER APPLICABLE LAW, TOOLMODEON DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
              INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          {/* 16. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              16. Limitation of Liability
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted uppercase tracking-wider font-semibold">
              IN NO EVENT SHALL TOOLMODEON, ITS OPERATORS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF
              PROFITS, DATA LOSS, DOCUMENT CORRUPTION, OR BUSINESS INTERRUPTION) ARISING OUT OF OR IN
              CONNECTION WITH YOUR ACCESS TO OR INABILITY TO USE THE SERVICES.
            </p>
          </section>

          {/* 17. Suspension and Termination */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              17. Suspension and Termination
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We reserve the right to suspend or terminate your access to ToolModeOn at our sole
              discretion, without notice, if we believe your conduct violates these Terms, our
              Acceptable Use Policy, or infringes the rights of others.
            </p>
          </section>

          {/* 18. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight text-ink">18. Changes to Terms</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We may revise these Terms of Service at any time. When revisions are posted, the &quot;Last
              Updated&quot; timestamp at the top of this document will be amended. Continued use of the
              Services after such modifications constitutes your acceptance of the updated terms.
            </p>
          </section>

          {/* 19. Contact Information */}
          <section className="rounded-2xl border border-line bg-pale/50 p-6 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-ink m-0">
              19. Contact Information
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If you have any questions, clarifications, or feedback regarding these Terms of Service,
              please contact our administration team:
            </p>
            <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
                <Mail size={15} />
              </span>
              <div>
                <p className="text-xs text-muted font-normal">Official Legal Contact</p>
                <a href="mailto:toolmodeon@gmail.com" className="hover:underline">
                  toolmodeon@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
