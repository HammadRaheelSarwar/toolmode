import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "About Us — Everyday Tools, One Platform",
  description:
    "Learn about ToolModeOn, our mission to provide fast, privacy-conscious, client-side online tools for PDF, image, code, SEO, and social media tasks.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description:
      "Learn about ToolModeOn, our mission to provide fast, privacy-conscious, client-side online tools.",
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    images: [{ url: `${SITE_URL}/logo-full.jpg`, width: 1024, height: 341, alt: `About ${SITE_NAME}` }],
  },
};

export default function About() {
  return (
    <main>
      <section className="bg-pale border-b border-line">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-muted">About ToolModeOn</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-ink">
            Make the everyday work feel lighter.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
            ToolModeOn brings the small, useful utilities people reach for every day into one calm, dependable workspace.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <div className="prose prose-lg max-w-none text-ink">
          <h2 className="text-2xl font-bold">A better home for the in-between tasks</h2>
          <p className="mt-4 leading-8 text-muted">
            The work between the work matters. A PDF to compress before a meeting, a number to check before a decision, a draft that needs a clearer tone. ToolModeOn is built around those moments: focused tools, thoughtful defaults, and a little less friction.
          </p>
          <p className="mt-5 leading-8 text-muted">
            We’re building for people who value speed and clarity, without trading away privacy. Free tools stay generous, paid plans add room when you need it, and every feature earns its place.
          </p>
        </div>
      </section>
    </main>
  );
}
