/**
 * Centralized SEO & Domain Configuration for ToolModeOn
 * Target Domain: www.toolmodeon.online
 */

export const SITE_NAME = "ToolModeOn";
export const SITE_DOMAIN = "www.toolmodeon.online";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.toolmodeon.online"
).replace(/\/$/, "");

export const DEFAULT_META_TITLE = "ToolModeOn — 80+ Free Online Everyday Tools for PDF, Image, Dev & SEO";
export const DEFAULT_META_DESCRIPTION =
  "Access 80+ fast, private, and 100% free online tools for PDFs, images, development, SEO, and social media. Instant browser processing with no software or sign-up required.";

export const DEFAULT_KEYWORDS = [
  "online tools",
  "free web utilities",
  "pdf tools online",
  "image compressor free",
  "developer utilities",
  "seo audit tools",
  "social media tools",
  "youtube thumbnail downloader",
  "qr code generator",
  "character counter",
  "privacy first online tools",
  "client side tools",
  "toolmodeon",
];

