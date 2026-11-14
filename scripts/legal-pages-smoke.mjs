import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

console.log("=================================================");
console.log("  ToolModeOn Legal & Information Pages Smoke Test");
console.log("=================================================\n");

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

// 1. About Us Page (/about)
await test("About page contains all 6 required sections, correct titles, and CTAs", () => {
  const content = readFileSync(resolve("app/about/page.tsx"), "utf-8");
  assert.ok(content.includes("Everything You Need."), "Missing hero title");
  assert.ok(content.includes("One Platform."), "Missing hero subtitle");
  assert.ok(content.includes("Who We Are"), "Missing Who We Are section");
  assert.ok(content.includes("Making Everyday Digital Tasks Simpler"), "Missing Mission section");
  assert.ok(content.includes("What We Offer"), "Missing What We Offer section");
  assert.ok(content.includes("Our Approach"), "Missing Approach section");
  assert.ok(content.includes("Find the Right Tool for Your Task"), "Missing CTA section");
  assert.ok(content.includes('href="/tools"'), "Missing Explore All Tools CTA link");
  assert.ok(content.includes('href="/contact"'), "Missing Contact Us CTA link");
  assert.ok(content.includes("Students"), "Missing Students audience");
  assert.ok(content.includes("Developers"), "Missing Developers audience");
  assert.ok(content.includes("PDF Tools"), "Missing PDF Tools category");
  assert.ok(content.includes("Social Media and Marketing Tools"), "Missing Social Media category");
});

// 2. Contact Us Page (/contact)
await test("Contact page contains required hero, official email, and contact categories", () => {
  const content = readFileSync(resolve("app/contact/page.tsx"), "utf-8");
  assert.ok(content.includes("We&apos;re Here to Help") || content.includes("We're Here to Help"), "Missing hero heading");
  assert.ok(content.includes("toolmodeon@gmail.com"), "Missing official contact email");
  assert.ok(content.includes("General Inquiries"), "Missing General Inquiries category");
  assert.ok(content.includes("Technical Support"), "Missing Technical Support category");
  assert.ok(content.includes("Bug Reports"), "Missing Bug Reports category");
  assert.ok(content.includes("Feedback & Suggestions"), "Missing Feedback category");
  assert.ok(content.includes("Business & Partnerships"), "Missing Business category");
  assert.ok(content.includes("Privacy & Data Protection"), "Missing Privacy category");
  assert.ok(content.includes("<ContactForm />") || content.includes("<ContactForm"), "Missing ContactForm component");
});

// 3. Contact Form Component (components/contact-form.tsx)
await test("Contact form enforces validation, privacy consent, and honeypot protection", () => {
  const content = readFileSync(resolve("components/contact-form.tsx"), "utf-8");
  assert.ok(content.includes('name="honeypot"'), "Missing anti-spam honeypot input");
  assert.ok(content.includes("privacyConsent"), "Missing privacy acknowledgement checkbox state");
  assert.ok(content.includes("/api/public/contact"), "Missing API submission path");
  assert.ok(content.includes("toolmodeon@gmail.com"), "Missing mailto fallback email");
  assert.ok(content.includes("5000"), "Missing message character length limit");
});

// 4. Contact API Route (app/api/public/contact/route.ts)
await test("Contact API validates schema, handles rate limiting, and protects against spam", () => {
  const content = readFileSync(resolve("app/api/public/contact/route.ts"), "utf-8");
  assert.ok(content.includes("isRateLimited"), "Missing rate limiting function");
  assert.ok(content.includes("honeypot"), "Missing honeypot validation");
  assert.ok(content.includes("toolmodeon@gmail.com"), "Missing target official email address");
  assert.ok(content.includes("contactSchema"), "Missing zod validation schema");
});

// 5. Privacy Policy (/privacy-policy)
await test("Privacy policy documents real architecture, client-side files, and AdSense disclosures", () => {
  const content = readFileSync(resolve("app/privacy-policy/page.tsx"), "utf-8");
  assert.ok(content.includes("1. Introduction"), "Missing Introduction");
  assert.ok(content.includes("4. Uploaded Files and Document Processing"), "Missing File Processing section");
  assert.ok(content.includes("client-side"), "Missing client-side processing explanation");
  assert.ok(content.includes("ca-pub-9061183031295584"), "Missing official AdSense client ID disclosure");
  assert.ok(content.includes("adssettings.google.com"), "Missing Google Ads Settings opt-out link");
  assert.ok(content.includes("toolmodeon@gmail.com"), "Missing official contact email");
  assert.ok(content.includes("Children&apos;s Privacy") || content.includes("Children's Privacy"), "Missing Children's Privacy section");
});

// 6. Terms of Service (/terms)
await test("Terms of Service includes acceptable use, AI disclaimers, and file backup responsibilities", () => {
  const content = readFileSync(resolve("app/terms/page.tsx"), "utf-8");
  assert.ok(content.includes("5. Acceptable Use Policy"), "Missing Acceptable Use Policy");
  assert.ok(content.includes("malware"), "Missing malware prohibition");
  assert.ok(content.includes("Maintain Original Backups"), "Missing file backup disclaimer");
  assert.ok(content.includes("10. AI-Generated Content Limitations"), "Missing AI disclaimer");
  assert.ok(content.includes("15. Disclaimer of Warranties"), "Missing Warranty Disclaimer");
  assert.ok(content.includes("16. Limitation of Liability"), "Missing Limitation of Liability");
  assert.ok(content.includes("toolmodeon@gmail.com"), "Missing official contact email");
});

// 7. Global Footer Integration (components/site-footer.tsx)
await test("Global footer includes Company and Legal sections, dynamic copyright, and email", () => {
  const content = readFileSync(resolve("components/site-footer.tsx"), "utf-8");
  assert.ok(content.includes('["About Us", "/about"]'), "Missing About Us link");
  assert.ok(content.includes('["Contact Us", "/contact"]'), "Missing Contact Us link");
  assert.ok(content.includes('["Privacy Policy", "/privacy-policy"]'), "Missing Privacy Policy link");
  assert.ok(content.includes('["Terms of Service", "/terms"]'), "Missing Terms of Service link");
  assert.ok(content.includes("currentYear"), "Missing dynamic current year");
  assert.ok(content.includes("toolmodeon@gmail.com"), "Missing official contact email");
});

// 8. Sitemap and Robots
await test("Sitemap and robots.txt include all 4 information pages", () => {
  const sitemap = readFileSync(resolve("app/sitemap.ts"), "utf-8");
  assert.ok(sitemap.includes("/about"), "Sitemap missing /about");
  assert.ok(sitemap.includes("/contact"), "Sitemap missing /contact");
  assert.ok(sitemap.includes("/privacy-policy"), "Sitemap missing /privacy-policy");
  assert.ok(sitemap.includes("/terms"), "Sitemap missing /terms");

  const robots = readFileSync(resolve("app/robots.ts"), "utf-8");
  assert.ok(robots.includes("/about"), "Robots missing /about");
  assert.ok(robots.includes("/contact"), "Robots missing /contact");
  assert.ok(robots.includes("/privacy-policy"), "Robots missing /privacy-policy");
  assert.ok(robots.includes("/terms"), "Robots missing /terms");
});

console.log("\n=================================================");
const failed = tests.filter((t) => !t.pass);
if (failed.length === 0) {
  console.log(`  ALL ${tests.length} TESTS PASSED SUCCESSFULLY!`);
} else {
  console.error(`  ${failed.length} OF ${tests.length} TESTS FAILED!`);
  process.exitCode = 1;
}
console.log("=================================================");

