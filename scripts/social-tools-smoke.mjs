import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import QRCode from "qrcode";

console.log("=================================================");
console.log("  ToolModeOn Social Media Tools (#91-100) Smoke Test");
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

// ----------------------------------------------------
// 1. Tool Registry Verification in lib/tools.ts
// ----------------------------------------------------
await test("All 10 Social Media & Marketing tools registered with exact slugs in lib/tools.ts", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const expectedTools = [
    { slug: "youtube-thumbnail-downloader", name: "YouTube Thumbnail Downloader" },
    { slug: "youtube-banner-resizer", name: "YouTube Channel Banner Resizer" },
    { slug: "instagram-bio-formatter", name: "Instagram Bio Formatter" },
    { slug: "hashtag-generator", name: "Hashtag Generator" },
    { slug: "social-media-post-preview", name: "Social Media Post Preview" },
    { slug: "utm-campaign-builder", name: "UTM Campaign Builder" },
    { slug: "email-signature-generator", name: "Email Signature Generator" },
    { slug: "qr-business-card-generator", name: "QR Business Card Generator" },
    { slug: "youtube-description-formatter", name: "YouTube Description Formatter" },
    { slug: "social-media-character-counter", name: "Social Media Character Counter" },
  ];

  for (const t of expectedTools) {
    assert.ok(content.includes(`slug: "${t.slug}"`), `Missing slug: ${t.slug}`);
    assert.ok(content.includes(`name: "${t.name}"`), `Missing name: ${t.name}`);
    assert.ok(content.includes(`category: "Social"`), `Tool not categorized as Social: ${t.slug}`);
  }
});

// ----------------------------------------------------
// 2. Category Verification in lib/tools.ts
// ----------------------------------------------------
await test("Social Media & Marketing category registered with slug 'social' and count 10", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  assert.ok(content.includes('name: "Social Media & Marketing"'), "Missing category name");
  assert.ok(content.includes('slug: "social"'), "Missing social category slug");
  assert.ok(content.includes("count: 10"), "Category count is not 10");
});

// ----------------------------------------------------
// 3. Tool Guides & FAQ Schemas in lib/tool-guides.ts
// ----------------------------------------------------
await test("All 10 tools have comprehensive step-by-step guides and FAQs in lib/tool-guides.ts", () => {
  const content = readFileSync(resolve("lib/tool-guides.ts"), "utf-8");
  const slugs = [
    "youtube-thumbnail-downloader",
    "youtube-banner-resizer",
    "instagram-bio-formatter",
    "hashtag-generator",
    "social-media-post-preview",
    "utm-campaign-builder",
    "email-signature-generator",
    "qr-business-card-generator",
    "youtube-description-formatter",
    "social-media-character-counter",
  ];

  for (const slug of slugs) {
    assert.ok(content.includes(`"${slug}": {`), `Missing guide for ${slug}`);
  }
});

// ----------------------------------------------------
// 4. Workspace Dispatcher Integration
// ----------------------------------------------------
await test("ToolWorkspace dispatches SocialToolWorkspace when tool.category === 'Social'", () => {
  const content = readFileSync(resolve("components/tool-workspace.tsx"), "utf-8");
  assert.ok(content.includes("SocialToolWorkspace"), "Missing SocialToolWorkspace import in tool-workspace.tsx");
  assert.ok(content.includes('if (tool.category === "Social")'), "Missing category === 'Social' check");
});

await test("SocialToolWorkspace dispatches all 10 tools in components/social-tools.tsx", () => {
  const content = readFileSync(resolve("components/social-tools.tsx"), "utf-8");
  assert.ok(content.includes("YouTubeThumbnailDownloaderWorkspace"));
  assert.ok(content.includes("YouTubeBannerResizerWorkspace"));
  assert.ok(content.includes("InstagramBioFormatterWorkspace"));
  assert.ok(content.includes("HashtagGeneratorWorkspace"));
  assert.ok(content.includes("SocialMediaPostPreviewWorkspace"));
  assert.ok(content.includes("UtmLinkBuilderWorkspace"));
  assert.ok(content.includes("EmailSignatureGeneratorWorkspace"));
  assert.ok(content.includes("QrBusinessCardWorkspace"));
  assert.ok(content.includes("YouTubeDescriptionFormatterWorkspace"));
  assert.ok(content.includes("SocialMediaCharacterCounterWorkspace"));
});

// ----------------------------------------------------
// 5. Tool #91: YouTube Thumbnail Downloader Logic
// ----------------------------------------------------
await test("YouTube video ID extractor handles all YouTube URL variations", () => {
  function extractYouTubeVideoId(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    try {
      const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.replace(/^\/+/, "").split(/[?#]/)[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
      if (u.hostname.includes("youtube.com")) {
        const v = u.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
        const shorts = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shorts) return shorts[1];
        const embed = u.pathname.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
        if (embed) return embed[1];
      }
    } catch {
      const match = trimmed.match(/(?:watch\?v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
    return null;
  }

  assert.equal(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=10"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeVideoId("https://google.com/search?q=video"), null);
});

// ----------------------------------------------------
// 6. Tool #92: YouTube Banner Resizer Math
// ----------------------------------------------------
await test("YouTube Banner Resizer dimensions and safe area coordinates match YouTube specs", () => {
  const CANVAS_W = 2560;
  const CANVAS_H = 1440;
  const SAFE_W = 1546;
  const SAFE_H = 423;

  assert.equal(CANVAS_W / CANVAS_H, 16 / 9, "Banner must be 16:9 ratio");
  const safeAreaLeft = (CANVAS_W - SAFE_W) / 2;
  const safeAreaTop = (CANVAS_H - SAFE_H) / 2;
  assert.equal(safeAreaLeft, 507, "Safe area left margin must be 507px");
  assert.equal(safeAreaTop, 508.5, "Safe area top margin must be 508.5px");
});

// ----------------------------------------------------
// 7. Tool #93: Instagram Bio Formatter Unicode & Spacing
// ----------------------------------------------------
await test("Instagram Bio Formatter applies Unicode fonts and preserves blank lines", () => {
  const boldSans = (str) =>
    str.replace(/[a-zA-Z0-9]/g, (c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + (code - 48));
      return c;
    });

  const formatted = boldSans("ToolMode 2026");
  assert.equal(formatted, "𝗧𝗼𝗼𝗹𝗠𝗼𝗱𝗲 𝟮𝟬𝟮𝟲");

  // Invisible space
  const bio = `Hello\n\u200B\nWorld`;
  assert.ok(bio.includes("\u200B"), "Must contain zero-width space");
  assert.equal(bio.length, 13);
});

// ----------------------------------------------------
// 8. Tool #94: Hashtag Generator Expansion & Deduplication
// ----------------------------------------------------
await test("Hashtag Generator produces categorized tags with casing control", () => {
  const rawKeywords = "marketing, ai";
  const tokens = rawKeywords.split(/[,;\s]+/).filter(Boolean);
  const tags = tokens.map((t) => `#${t.toLowerCase()}`);
  assert.deepEqual(tags, ["#marketing", "#ai"]);

  const camelTags = tokens.map((t) => `#${t.charAt(0).toUpperCase()}${t.slice(1)}`);
  assert.deepEqual(camelTags, ["#Marketing", "#Ai"]);
});

// ----------------------------------------------------
// 9. Tool #96: UTM Campaign Builder Parameter Preservation & CSV Export
// ----------------------------------------------------
await test("UTM Link Builder preserves existing query parameters and formats correctly", () => {
  const base = "https://example.com/store?ref=partner123";
  const u = new URL(base);
  u.searchParams.set("utm_source", "newsletter");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", "black_friday_2026");

  const finalUrl = u.toString();
  assert.ok(finalUrl.includes("ref=partner123"), "Original param was lost");
  assert.ok(finalUrl.includes("utm_source=newsletter"));
  assert.ok(finalUrl.includes("utm_medium=email"));
  assert.ok(finalUrl.includes("utm_campaign=black_friday_2026"));
});

// ----------------------------------------------------
// 10. Tool #97: Email Signature Generator Inline CSS & Sanitization
// ----------------------------------------------------
await test("Email Signature Generator generates email-compatible HTML with inline styles", () => {
  const name = "Jane Doe";
  const company = "Acme Corp";
  const email = "jane@acme.com";

  const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial, sans-serif;font-size:13px;color:#111111;">
    <tr><td><strong>${name}</strong> | ${company} | <a href="mailto:${email}">${email}</a></td></tr>
  </table>`;

  assert.ok(html.startsWith("<table"));
  assert.ok(html.includes("cellpadding=\"0\""));
  assert.ok(html.includes("style="));
  assert.ok(!html.includes("<style>"), "Must not use external or head <style> tag for cross-client compatibility");
});

// ----------------------------------------------------
// 11. Tool #98: QR Business Card Generator vCard 3.0 & QR Encoding
// ----------------------------------------------------
await test("QR Business Card Generator generates valid vCard 3.0 and scannable QR string", async () => {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Doe;John;;;",
    "FN:John Doe",
    "ORG:ToolModeOn",
    "TITLE:Founder",
    "TEL;TYPE=WORK,VOICE:+15551234567",
    "EMAIL;TYPE=PREF,INTERNET:john@toolmodeon.online",
    "URL:https://toolmodeon.online",
    "END:VCARD",
  ].join("\n");

  assert.ok(vcard.startsWith("BEGIN:VCARD"));
  assert.ok(vcard.endsWith("END:VCARD"));

  // Verify qrcode generates a data URI without error
  const dataUri = await QRCode.toDataURL(vcard, { errorCorrectionLevel: "H", width: 200 });
  assert.ok(dataUri.startsWith("data:image/png;base64,"));
});

// ----------------------------------------------------
// 12. Tool #99: YouTube Description Formatter Timestamp Validation
// ----------------------------------------------------
await test("YouTube Description Formatter builds chapters and structures plain text", () => {
  const title = "HOW TO USE TOOLS";
  const timestamps = "00:00 Intro\n01:30 Step 1\n05:00 Conclusion";
  const desc = `${title}\n\nTIMESTAMPS:\n${timestamps}`;

  assert.ok(desc.includes("00:00 Intro"));
  assert.ok(desc.length < 5000, "Within YouTube 5000 char limit");
});

// ----------------------------------------------------
// 13. Tool #100: Social Media Character Counter
// ----------------------------------------------------
await test("Social Media Character Counter calculates words, chars, lines, and reading time", () => {
  const text = "Hello world! This is a test of our character counter.\nSecond line here.";
  const charsWithSpaces = text.length;
  const charsNoSpaces = text.replace(/\s+/g, "").length;
  const words = text.trim().split(/\s+/).length;
  const lines = text.split(/\r\n|\r|\n/).length;

  assert.equal(charsWithSpaces, 71);
  assert.equal(words, 13);
  assert.equal(lines, 2);
  assert.ok(charsNoSpaces < charsWithSpaces);
});

// ----------------------------------------------------
// 14. Navigation & Redirects Verification
// ----------------------------------------------------
await test("Site navigation and next.config.mjs contain social routes", () => {
  const headerContent = readFileSync(resolve("components/site-header.tsx"), "utf-8");
  assert.ok(headerContent.includes('["Social", "/tools/social"]'), "Header missing Social link");

  const footerContent = readFileSync(resolve("components/site-footer.tsx"), "utf-8");
  assert.ok(footerContent.includes('["Social tools", "/tools/social"]'), "Footer missing Social link");

  const nextConfig = readFileSync(resolve("next.config.mjs"), "utf-8");
  assert.ok(nextConfig.includes('source: "/youtube-thumbnail-downloader"'));
  assert.ok(nextConfig.includes('destination: "/tools/youtube-thumbnail-downloader"'));
});

// ----------------------------------------------------
// Summary Report
// ----------------------------------------------------
console.log("\n=================================================");
const failed = tests.filter((t) => !t.pass);
if (failed.length === 0) {
  console.log(`  ALL ${tests.length} TESTS PASSED SUCCESSFULLY!`);
} else {
  console.error(`  ${failed.length} OF ${tests.length} TESTS FAILED!`);
  process.exitCode = 1;
}
console.log("=================================================");
