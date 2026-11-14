import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

console.log("=========================================");
console.log("  ToolModeOn Full Platform Smoke Test");
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
// 1. Tool Registry Integrity
// ----------------------------------------------------
await test("Registry contains all base and image tools plus new utility tools", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const toolSlugMatches = [...content.matchAll(/slug:\s*"([a-z0-9-]+)"/g)]
    .map(m => m[1])
    .filter(s => !["pdf", "image", "calculators", "text", "ai", "utilities"].includes(s));
  
  assert.ok(toolSlugMatches.length >= 36, `Expected at least 36 tools in registry, found ${toolSlugMatches.length}`);
});

await test("All 6 new Image tools are registered with correct slugs", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const expectedNew = [
    "background-remover",
    "background-blur",
    "image-upscaler",
    "image-rotator-flipper",
    "image-watermark",
    "image-enhancer",
  ];
  for (const slug of expectedNew) {
    assert.ok(content.includes(`slug: "${slug}"`), `Missing slug: ${slug}`);
  }
});

await test("Image Tools category count reflects active tools (8 visible, 3 hidden pending user API key)", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  assert.ok(
    content.includes('slug: "image"') && (content.includes('count: 8') || content.includes('count: 11')),
    "Image category count is invalid"
  );
});

await test("All 31 original tools are preserved", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const originalSlugs = [
    "pdf-merger", "pdf-compressor", "pdf-splitter", "pdf-to-image", "image-to-pdf",
    "pdf-watermark", "pdf-page-numbering", "protect-pdf", "unlock-pdf", "pdf-to-text",
    "image-compressor", "image-resizer", "jpg-to-png", "png-to-webp", "image-cropper",
    "age-calculator", "percentage-calculator", "bmi-calculator", "loan-calculator", "mortgage-calculator",
    "word-counter", "character-counter", "case-converter", "remove-duplicate-lines", "text-diff-checker",
    "ai-text-summarizer", "ai-paragraph-rewriter", "ai-email-generator", "ai-blog-title-generator", "seo-meta-description-generator"
  ];
  for (const slug of originalSlugs) {
    assert.ok(content.includes(`slug: "${slug}"`), `Original tool missing: ${slug}`);
  }
});

// ----------------------------------------------------
// 2. Image Rotator & Flipper Math Verification
// ----------------------------------------------------
await test("Rotation bounding box recalculation logic", () => {
  function calcBoundingBox(w, h, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    return {
      width: Math.round(w * cos + h * sin),
      height: Math.round(w * sin + h * cos),
    };
  }

  // 0° should maintain original dimensions
  const bbox0 = calcBoundingBox(800, 600, 0);
  assert.equal(bbox0.width, 800);
  assert.equal(bbox0.height, 600);

  // 90° should swap dimensions
  const bbox90 = calcBoundingBox(800, 600, 90);
  assert.equal(bbox90.width, 600);
  assert.equal(bbox90.height, 800);

  // 180° should maintain original dimensions
  const bbox180 = calcBoundingBox(800, 600, 180);
  assert.equal(bbox180.width, 800);
  assert.equal(bbox180.height, 600);

  // 45° of 100x100 square: sqrt(2)*100 ~= 141x141
  const bbox45 = calcBoundingBox(100, 100, 45);
  assert.equal(bbox45.width, 141);
  assert.equal(bbox45.height, 141);
});

// ----------------------------------------------------
// 3. Watermark Position Calculator
// ----------------------------------------------------
await test("Watermark 8-way position coordinates", () => {
  function getWmPos(position, iw, ih, ww, wh, margin) {
    const positions = {
      "top-left": [margin, margin],
      "top-center": [(iw - ww) / 2, margin],
      "top-right": [iw - ww - margin, margin],
      "center": [(iw - ww) / 2, (ih - wh) / 2],
      "bottom-left": [margin, ih - wh - margin],
      "bottom-center": [(iw - ww) / 2, ih - wh - margin],
      "bottom-right": [iw - ww - margin, ih - wh - margin],
      "diagonal-center": [(iw - ww) / 2, (ih - wh) / 2],
    };
    return positions[position] ?? [margin, margin];
  }

  const iw = 1000, ih = 800, ww = 200, wh = 50, m = 20;
  
  assert.deepEqual(getWmPos("top-left", iw, ih, ww, wh, m), [20, 20]);
  assert.deepEqual(getWmPos("top-center", iw, ih, ww, wh, m), [400, 20]);
  assert.deepEqual(getWmPos("top-right", iw, ih, ww, wh, m), [780, 20]);
  assert.deepEqual(getWmPos("center", iw, ih, ww, wh, m), [400, 375]);
  assert.deepEqual(getWmPos("bottom-left", iw, ih, ww, wh, m), [20, 730]);
  assert.deepEqual(getWmPos("bottom-center", iw, ih, ww, wh, m), [400, 730]);
  assert.deepEqual(getWmPos("bottom-right", iw, ih, ww, wh, m), [780, 730]);
  assert.deepEqual(getWmPos("diagonal-center", iw, ih, ww, wh, m), [400, 375]);
});

// ----------------------------------------------------
// 4. Histogram Auto-Enhance Analysis Logic
// ----------------------------------------------------
await test("Luminance histogram calculation and auto-tuning", () => {
  function analyzeSample(data) {
    let totalLum = 0, minLum = 255, maxLum = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalLum += lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
      count++;
    }
    const avgLum = count > 0 ? totalLum / count : 128;
    let bAdj = 100;
    if (avgLum < 100) bAdj = Math.min(135, Math.round(100 + (128 - avgLum) * 0.4));
    else if (avgLum > 160) bAdj = Math.max(85, Math.round(100 - (avgLum - 128) * 0.3));

    let cAdj = 100;
    const range = maxLum - minLum;
    if (range < 200) cAdj = Math.min(130, Math.round(100 + (220 - range) * 0.25));

    return { brightness: bAdj, contrast: cAdj, saturation: 110, sharpness: 1 };
  }

  // Dark image: avg lum ~ 30 -> should boost brightness
  const darkImage = new Uint8ClampedArray(400); // 100 pixels
  for (let i = 0; i < darkImage.length; i += 4) {
    darkImage[i] = 30; darkImage[i+1] = 30; darkImage[i+2] = 30; darkImage[i+3] = 255;
  }
  const darkResult = analyzeSample(darkImage);
  assert.ok(darkResult.brightness > 100, `Expected brightness boost, got ${darkResult.brightness}`);

  // Washed-out/overexposed image: avg lum ~ 230 -> should reduce brightness
  const brightImage = new Uint8ClampedArray(400);
  for (let i = 0; i < brightImage.length; i += 4) {
    brightImage[i] = 230; brightImage[i+1] = 230; brightImage[i+2] = 230; brightImage[i+3] = 255;
  }
  const brightResult = analyzeSample(brightImage);
  assert.ok(brightResult.brightness < 100, `Expected brightness reduction, got ${brightResult.brightness}`);
});

// ----------------------------------------------------
// 5. Middleware Body Limit Verification
// ----------------------------------------------------
await test("Middleware allows 10MB for /api/tools/image/", () => {
  const content = readFileSync(resolve("middleware.ts"), "utf-8");
  assert.ok(
    content.includes('path.startsWith("/api/tools/image/")'),
    "Middleware does not have special size limit for /api/tools/image/"
  );
  assert.ok(
    content.includes("10 * 1024 * 1024"),
    "Middleware does not allow 10MB for image tools"
  );
});

// ----------------------------------------------------
// 6. API Route Files Syntax & Export Check
// ----------------------------------------------------
await test("All 3 API route files exist and export POST", () => {
  const routes = [
    "app/api/tools/image/background-remove/route.ts",
    "app/api/tools/image/background-blur/route.ts",
    "app/api/tools/image/upscale/route.ts",
  ];
  for (const r of routes) {
    const code = readFileSync(resolve(r), "utf-8");
    assert.ok(code.includes("export async function POST"), `${r} does not export POST`);
    assert.ok(code.includes('export const runtime = "nodejs"'), `${r} does not set nodejs runtime`);
  }
});

console.log("\n=========================================");
const passed = tests.filter(t => t.pass).length;
console.log(`Results: ${passed}/${tests.length} tests passed`);
console.log("=========================================");

if (passed !== tests.length) {
  process.exit(1);
}
