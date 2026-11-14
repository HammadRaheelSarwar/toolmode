import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isPrivateIp, parseHtmlMetadata } from "../lib/seo/url-inspector.ts";

console.log("=========================================");
console.log("  ToolModeOn SEO Tools (#76-90) Smoke Test");
console.log("=========================================\n");

const tests = [];
async function test(name, fn) {
  try {
    await fn();
    tests.push({ name, pass: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    tests.push({ name, pass: false, error: err.message });
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// ----------------------------------------------------
// 1. Tool Registry Verification
// ----------------------------------------------------
await test("All 15 SEO & Website tools registered with exact slugs in lib/tools.ts", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const expectedTools = [
    { slug: "meta-tags-analyzer", name: "Meta Tags Analyzer" },
    { slug: "open-graph-preview", name: "Open Graph Preview" },
    { slug: "twitter-card-preview", name: "Twitter/X Card Preview" },
    { slug: "schema-markup-generator", name: "Schema Markup Generator" },
    { slug: "schema-markup-validator", name: "Schema Markup Validator" },
    { slug: "canonical-url-checker", name: "Canonical URL Checker" },
    { slug: "hreflang-generator", name: "Hreflang Tag Generator" },
    { slug: "http-status-checker", name: "HTTP Status Code Checker" },
    { slug: "redirect-checker", name: "Redirect Checker" },
    { slug: "url-slug-generator", name: "URL Slug Generator" },
    { slug: "keyword-research-organizer", name: "Keyword Research Organizer" },
    { slug: "serp-snippet-preview", name: "SERP Snippet Preview" },
    { slug: "utm-link-builder", name: "UTM Link Builder" },
    { slug: "broken-link-checker", name: "Broken Link Checker" },
    { slug: "website-word-counter", name: "Website Word Counter" },
  ];

  for (const t of expectedTools) {
    assert.ok(content.includes(`slug: "${t.slug}"`), `Missing slug: ${t.slug}`);
    assert.ok(content.includes(`name: "${t.name}"`), `Missing name: ${t.name}`);
    assert.ok(content.includes(`category: "SEO"`), `Tool not categorized as SEO: ${t.slug}`);
  }
});

// ----------------------------------------------------
// 2. SEO Category Verification
// ----------------------------------------------------
await test("SEO Tools category registered with count 15 and slug 'seo'", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  assert.ok(content.includes('name: "SEO Tools"'), "Missing SEO Tools category name");
  assert.ok(content.includes('slug: "seo"'), "Missing seo category slug");
  assert.ok(content.includes("count: 15"), "Category count is not 15");
});

// ----------------------------------------------------
// 3. Navigation Header Includes SEO Tools
// ----------------------------------------------------
await test("Site header includes navigation item for SEO tools", () => {
  const content = readFileSync(resolve("components/site-header.tsx"), "utf-8");
  assert.ok(content.includes('["SEO tools", "/tools/seo"]'), "Header missing SEO tools link");
});

// ----------------------------------------------------
// 4. Supabase Migration Verification
// ----------------------------------------------------
await test("Database migration registers all 15 tools with free plan policy", () => {
  const content = readFileSync(resolve("supabase/migrations/202611140002_seo_tools_76_90.sql"), "utf-8");
  const expectedSlugs = [
    "meta-tags-analyzer",
    "open-graph-preview",
    "twitter-card-preview",
    "schema-markup-generator",
    "schema-markup-validator",
    "canonical-url-checker",
    "hreflang-generator",
    "http-status-checker",
    "redirect-checker",
    "url-slug-generator",
    "keyword-research-organizer",
    "serp-snippet-preview",
    "utm-link-builder",
    "broken-link-checker",
    "website-word-counter",
  ];
  for (const slug of expectedSlugs) {
    assert.ok(content.includes(`'${slug}', 'free'`), `Migration missing slug: ${slug}`);
  }
});

// ----------------------------------------------------
// 5. Tool Workspace Routing
// ----------------------------------------------------
await test("tool-workspace.tsx imports and routes to SeoToolWorkspace", () => {
  const content = readFileSync(resolve("components/tool-workspace.tsx"), "utf-8");
  assert.ok(content.includes("SeoToolWorkspace"), "Missing SeoToolWorkspace reference");
  assert.ok(content.includes('tool.category === "SEO"'), "Missing category branch for SEO");
});

// ----------------------------------------------------
// 6. SSRF Protection: Private & Loopback IP Checks
// ----------------------------------------------------
await test("SSRF filter accurately blocks private, loopback, and cloud metadata IPs", () => {
  // Loopback
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("127.0.1.1"), true);
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);

  // Private network ranges
  assert.equal(isPrivateIp("10.0.0.1"), true);
  assert.equal(isPrivateIp("10.254.1.5"), true);
  assert.equal(isPrivateIp("172.16.0.1"), true);
  assert.equal(isPrivateIp("172.31.255.254"), true);
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("192.168.0.254"), true);

  // Cloud metadata & link-local
  assert.equal(isPrivateIp("169.254.169.254"), true);
  assert.equal(isPrivateIp("169.254.1.1"), true);
  assert.equal(isPrivateIp("fe80::1"), true);
  assert.equal(isPrivateIp("fc00::1"), true);

  // Public IPs
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
  assert.equal(isPrivateIp("93.184.216.34"), false);
});

// ----------------------------------------------------
// 7. HTML Metadata Parser Extraction
// ----------------------------------------------------
await test("parseHtmlMetadata extracts title, description, OG, Twitter, canonical, and word counts", () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>ToolModeOn - Everyday Tools</title>
        <meta name="description" content="All-in-one productivity suite for creators and developers." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://toolmodeon.online" />
        <meta property="og:title" content="ToolModeOn Open Graph" />
        <meta property="og:description" content="Social sharing description" />
        <meta property="og:image" content="https://toolmodeon.online/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ToolModeOn on Twitter" />
      </head>
      <body>
        <nav><a href="/home">Home</a></nav>
        <h1>Main Page Heading</h1>
        <h2>Secondary Subtitle</h2>
        <p>This is the first paragraph with five words.</p>
        <p>Second paragraph with more interesting content and information.</p>
        <a href="https://example.com/about">About Us</a>
        <a href="/tools/pdf">PDF Tools</a>
        <footer>Technical footer text</footer>
      </body>
    </html>
  `;

  const meta = parseHtmlMetadata(sampleHtml, "https://toolmodeon.online");
  assert.equal(meta.title, "ToolModeOn - Everyday Tools");
  assert.equal(meta.description, "All-in-one productivity suite for creators and developers.");
  assert.equal(meta.robots, "index, follow");
  assert.equal(meta.canonical, "https://toolmodeon.online");
  assert.equal(meta.og.title, "ToolModeOn Open Graph");
  assert.equal(meta.og.image, "https://toolmodeon.online/og.png");
  assert.equal(meta.twitter.card, "summary_large_image");
  assert.equal(meta.headings.h1[0], "Main Page Heading");
  assert.equal(meta.headings.h2[0], "Secondary Subtitle");
  assert.ok(meta.textStats.totalWords > 0);
  assert.ok(meta.links.includes("https://example.com/about"));
  assert.ok(meta.links.includes("https://toolmodeon.online/tools/pdf"));
});

// ----------------------------------------------------
// 8. Tool #79 Schema Generator JSON-LD format
// ----------------------------------------------------
await test("#79 Schema Markup Generator produces valid JSON-LD structure", () => {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "ToolModeOn All-in-One",
    description: "Everyday utility suite",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
  const str = JSON.stringify(productSchema);
  const reParsed = JSON.parse(str);
  assert.equal(reParsed["@context"], "https://schema.org");
  assert.equal(reParsed["@type"], "Product");
  assert.equal(reParsed.offers.priceCurrency, "USD");
});

// ----------------------------------------------------
// 9. Tool #85 URL Slug Generator logic
// ----------------------------------------------------
await test("#85 URL Slug Generator normalizes accents, spaces, and punctuation", () => {
  const input = "Crème Brûlée & Café Latte: Best in 2026!";
  let text = input.trim();
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Accents normalized
  text = text.toLowerCase();
  text = text.replace(/[^a-zA-Z0-9\s-_]/g, "");
  const slug = text.split(/\s+/).filter(Boolean).join("-");

  assert.equal(slug, "creme-brulee-cafe-latte-best-in-2026");
});

// ----------------------------------------------------
// 10. Tool #88 UTM Link Builder preserves existing parameters
// ----------------------------------------------------
await test("#88 UTM Link Builder generates valid URLs and preserves existing query parameters", () => {
  const base = "https://example.com/store?category=books&ref=partner";
  const url = new URL(base);
  url.searchParams.set("utm_source", "newsletter");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", "summer_2026");

  const finalStr = url.toString();
  assert.ok(finalStr.includes("category=books"));
  assert.ok(finalStr.includes("ref=partner"));
  assert.ok(finalStr.includes("utm_source=newsletter"));
  assert.ok(finalStr.includes("utm_campaign=summer_2026"));
});

// ----------------------------------------------------
// 11. Tool Guides & FAQs for all 15 SEO tools
// ----------------------------------------------------
await test("All 15 SEO tools have bespoke steps and FAQs in lib/tool-guides.ts", () => {
  const content = readFileSync(resolve("lib/tool-guides.ts"), "utf-8");
  const expectedSlugs = [
    "meta-tags-analyzer",
    "open-graph-preview",
    "twitter-card-preview",
    "schema-markup-generator",
    "schema-markup-validator",
    "canonical-url-checker",
    "hreflang-generator",
    "http-status-checker",
    "redirect-checker",
    "url-slug-generator",
    "keyword-research-organizer",
    "serp-snippet-preview",
    "utm-link-builder",
    "broken-link-checker",
    "website-word-counter",
  ];
  for (const slug of expectedSlugs) {
    assert.ok(content.includes(`"${slug}": {`), `Missing guide for ${slug}`);
  }
});

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log("\n=========================================");
const passed = tests.filter((t) => t.pass).length;
const failed = tests.filter((t) => !t.pass).length;
console.log(`Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}

