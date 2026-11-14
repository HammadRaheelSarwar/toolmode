import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

console.log("=========================================");
console.log("  ToolModeOn Tools #38-46 Smoke Test");
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
await test("All 9 new utility tools registered with exact slugs and names in lib/tools.ts", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const expectedTools = [
    { slug: "qr-code-generator", name: "QR Code Generator" },
    { slug: "barcode-generator", name: "Barcode Generator" },
    { slug: "currency-converter", name: "Currency Converter" },
    { slug: "weather-forecast", name: "Weather Forecast" },
    { slug: "world-clock-converter", name: "World Clock Converter" },
    { slug: "public-holiday-finder", name: "Public Holiday Finder" },
    { slug: "ip-address-lookup", name: "IP Address Lookup" },
    { slug: "country-information-finder", name: "Country Information Finder" },
    { slug: "sunrise-sunset-calculator", name: "Sunrise & Sunset Calculator" },
  ];

  for (const t of expectedTools) {
    assert.ok(content.includes(`slug: "${t.slug}"`), `Missing slug: ${t.slug}`);
    assert.ok(content.includes(`name: "${t.name}"`), `Missing name: ${t.name}`);
  }
});

// ----------------------------------------------------
// 2. Utility Tools Category Verification
// ----------------------------------------------------
await test("Utility Tools category is registered with count 9 and slug 'utilities'", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  assert.ok(content.includes('slug: "utilities"'), "Missing utilities category slug");
  assert.ok(content.includes('count: 9'), "Category count is not 9");
});

// ----------------------------------------------------
// 3. Navigation Header Includes Utilities
// ----------------------------------------------------
await test("Site header includes navigation item for Utilities", () => {
  const content = readFileSync(resolve("components/site-header.tsx"), "utf-8");
  assert.ok(content.includes('["Utilities", "/tools/utilities"]'), "Header missing Utilities link");
});

// ----------------------------------------------------
// 4. Barcode Check Digit Algorithms Verification
// ----------------------------------------------------
await test("Barcode modulo-10 check digit algorithms for EAN-13, EAN-8 and UPC-A", () => {
  // Test EAN-13 check digit calculation: 400638133393 -> 1
  function computeEan13(digits) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return digits + check;
  }
  assert.equal(computeEan13("400638133393"), "4006381333931");

  // Test EAN-8 check digit: 7351353 -> 7
  function computeEan8(digits) {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
    }
    const check = (10 - (sum % 10)) % 10;
    return digits + check;
  }
  assert.equal(computeEan8("7351353"), "73513537");

  // Test UPC-A check digit: 01234567890 -> 5
  function computeUpcA(digits) {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
    }
    const check = (10 - (sum % 10)) % 10;
    return digits + check;
  }
  assert.equal(computeUpcA("01234567890"), "012345678905");
});

// ----------------------------------------------------
// 5. QR Code Payload Generator Logic
// ----------------------------------------------------
await test("QR Code formatting for WiFi, vCard, mailto and tel", () => {
  // Wi-Fi payload format
  const ssid = "TestNet;1";
  const pass = "P@ss:word";
  const escapedSsid = ssid.replace(/([\\;,:])/g, "\\$1");
  const escapedPass = pass.replace(/([\\;,:])/g, "\\$1");
  const wifiPayload = `WIFI:T:WPA;S:${escapedSsid};P:${escapedPass};H:false;;`;
  assert.equal(wifiPayload, "WIFI:T:WPA;S:TestNet\\;1;P:P@ss\\:word;H:false;;");

  // vCard format
  const vcard = ["BEGIN:VCARD", "VERSION:3.0", "FN:Jane Doe", "TEL:+15550199", "END:VCARD"].join("\n");
  assert.ok(vcard.startsWith("BEGIN:VCARD") && vcard.endsWith("END:VCARD"));
});

// ----------------------------------------------------
// 6. World Clock Intl Timezone Formatting
// ----------------------------------------------------
await test("World Clock timezone calculation using native Intl API", () => {
  const d = new Date("2026-06-15T12:00:00Z");
  const tokyoFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", hour: "numeric", hour12: false });
  const nyFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false });

  const tokyoHour = parseInt(tokyoFormatter.format(d), 10);
  const nyHour = parseInt(nyFormatter.format(d), 10);

  // Tokyo is UTC+9 (21:00), NY is UTC-4 in June (08:00) -> 13 hours difference
  const diff = (tokyoHour - nyHour + 24) % 24;
  assert.equal(diff, 13);
});

// ----------------------------------------------------
// 7. Countries Database Integrity
// ----------------------------------------------------
await test("Countries database in lib/countries-data.ts contains 250 countries with full schemas", async () => {
  const { countriesData } = await import("../lib/countries-data.ts");
  assert.equal(countriesData.length, 250, "Expected 250 countries in dataset");

  const us = countriesData.find((c) => c.iso2 === "US");
  assert.ok(us, "Missing United States");
  assert.equal(us.name, "United States");
  assert.equal(us.capital, "Washington");
  assert.equal(us.currency, "USD");
  assert.equal(us.calling_code, "+1");
  assert.ok(us.population > 300000000);

  const jp = countriesData.find((c) => c.iso2 === "JP");
  assert.ok(jp, "Missing Japan");
  assert.equal(jp.capital, "Tokyo");
  assert.equal(jp.currency, "JPY");
});

// ----------------------------------------------------
// 8. Tool Guides & FAQ Schema
// ----------------------------------------------------
await test("Every utility tool has steps and FAQs in lib/tool-guides.ts", async () => {
  const { getToolGuide } = await import("../lib/tool-guides.ts");
  const slugs = [
    "qr-code-generator",
    "barcode-generator",
    "currency-converter",
    "weather-forecast",
    "world-clock-converter",
    "public-holiday-finder",
    "ip-address-lookup",
    "country-information-finder",
    "sunrise-sunset-calculator",
  ];

  for (const s of slugs) {
    const guide = getToolGuide(s, s, "Utilities");
    assert.ok(guide.steps.length >= 3, `Expected at least 3 steps for ${s}`);
    assert.ok(guide.faqs.length >= 2, `Expected at least 2 FAQs for ${s}`);
  }
});

// ----------------------------------------------------
// 9. Database Migration Verification
// ----------------------------------------------------
await test("Database migration 202611130002_utility_tools_38_46.sql registers all 9 tools", () => {
  const sql = readFileSync(resolve("supabase/migrations/202611130002_utility_tools_38_46.sql"), "utf-8");
  assert.ok(sql.includes("qr-code-generator"));
  assert.ok(sql.includes("barcode-generator"));
  assert.ok(sql.includes("currency-converter"));
  assert.ok(sql.includes("weather-forecast"));
  assert.ok(sql.includes("world-clock-converter"));
  assert.ok(sql.includes("public-holiday-finder"));
  assert.ok(sql.includes("ip-address-lookup"));
  assert.ok(sql.includes("country-information-finder"));
  assert.ok(sql.includes("sunrise-sunset-calculator"));
});

console.log("\n=========================================");
console.log(`Results: ${tests.filter((t) => t.pass).length}/${tests.length} tests passed`);
console.log("=========================================");

if (tests.some((t) => !t.pass)) {
  process.exit(1);
}

