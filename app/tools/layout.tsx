import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "../../lib/seo-constants";

export const metadata: Metadata = {
  title: "All Online Tools — Free PDF, Image, Developer & Marketing Utilities",
  description:
    "Explore 81+ free, instant, browser-based online tools for PDF editing, image conversion, developer utilities, SEO optimization, social media marketing, and calculators. 100% free and privacy-friendly.",
  keywords: [
    "online tools",
    "free web utilities",
    "free pdf tools",
    "free image converter",
    "developer tools online",
    "seo tools free",
    "social media tools",
    "online calculators",
    "browser utilities",
    "toolmodeon",
  ],
  alternates: {
    canonical: `${SITE_URL}/tools`,
  },
  openGraph: {
    type: "website",
    title: `All Online Tools — Free PDF, Image, Developer & Marketing Utilities | ${SITE_NAME}`,
    description:
      "Explore 81+ free, instant, browser-based online tools for PDF editing, image conversion, developer utilities, SEO optimization, social media marketing, and calculators.",
    url: `${SITE_URL}/tools`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/logo-full.jpg`,
        width: 1024,
        height: 341,
        alt: `${SITE_NAME} Tools Catalog`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `All Online Tools — Free PDF, Image, Developer & Marketing Utilities | ${SITE_NAME}`,
    description:
      "Explore 81+ free, instant, browser-based online tools for PDF editing, image conversion, developer utilities, SEO optimization, social media marketing, and calculators.",
    images: [`${SITE_URL}/logo-full.jpg`],
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

