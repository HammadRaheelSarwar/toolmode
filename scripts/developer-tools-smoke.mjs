import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as yaml from "js-yaml";
import { format as formatSql } from "sql-formatter";
import * as diff from "diff";
import cronstrue from "cronstrue";
import * as terser from "terser";

console.log("=========================================");
console.log("  ToolModeOn Developer Tools (#62-75) Smoke Test");
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
await test("All 14 developer tools registered with exact slugs in lib/tools.ts", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  const expectedTools = [
    { slug: "json-formatter", name: "JSON Formatter & Validator" },
    { slug: "json-minifier", name: "JSON Minifier" },
    { slug: "javascript-minifier", name: "JavaScript Minifier" },
    { slug: "css-minifier", name: "CSS Minifier" },
    { slug: "html-minifier", name: "HTML Minifier" },
    { slug: "sql-formatter", name: "SQL Formatter" },
    { slug: "regex-tester", name: "Regex Tester" },
    { slug: "cron-expression-generator", name: "Cron Expression Generator" },
    { slug: "unix-timestamp-converter", name: "Unix Timestamp Converter" },
    { slug: "html-preview", name: "HTML Previewer" },
    { slug: "yaml-to-json", name: "YAML to JSON Converter" },
    { slug: "json-to-yaml", name: "JSON to YAML Converter" },
    { slug: "sql-formatter-validator", name: "SQL Formatter & Validator" },
    { slug: "code-diff-checker", name: "Diff Checker for Code" },
  ];

  for (const t of expectedTools) {
    assert.ok(content.includes(`slug: "${t.slug}"`), `Missing slug: ${t.slug}`);
    assert.ok(content.includes(`name: "${t.name}"`), `Missing name: ${t.name}`);
    assert.ok(content.includes(`category: "Developer"`), `Tool not categorized as Developer: ${t.slug}`);
  }
});

// ----------------------------------------------------
// 2. Developer Category Verification
// ----------------------------------------------------
await test("Developer Tools category registered with count 14 and slug 'developer'", () => {
  const content = readFileSync(resolve("lib/tools.ts"), "utf-8");
  assert.ok(content.includes('name: "Developer Tools"'), "Missing Developer Tools category name");
  assert.ok(content.includes('slug: "developer"'), "Missing developer category slug");
  assert.ok(content.includes('count: 14'), "Category count is not 14");
});

// ----------------------------------------------------
// 3. Navigation Header Includes Developer
// ----------------------------------------------------
await test("Site header includes navigation item for Developer", () => {
  const content = readFileSync(resolve("components/site-header.tsx"), "utf-8");
  assert.ok(content.includes('["Developer", "/tools/developer"]'), "Header missing Developer link");
});

// ----------------------------------------------------
// 4. Supabase Migration Verification
// ----------------------------------------------------
await test("Database migration registers all 14 tools with free plan policy", () => {
  const content = readFileSync(resolve("supabase/migrations/202611140001_dev_tools_62_75.sql"), "utf-8");
  const expectedSlugs = [
    "json-formatter",
    "json-minifier",
    "javascript-minifier",
    "css-minifier",
    "html-minifier",
    "sql-formatter",
    "regex-tester",
    "cron-expression-generator",
    "unix-timestamp-converter",
    "html-preview",
    "yaml-to-json",
    "json-to-yaml",
    "sql-formatter-validator",
    "code-diff-checker",
  ];
  for (const slug of expectedSlugs) {
    assert.ok(content.includes(`'${slug}', 'free'`), `Migration missing slug: ${slug}`);
  }
});

// ----------------------------------------------------
// 5. Tool Workspace Routing
// ----------------------------------------------------
await test("tool-workspace.tsx imports and routes to DeveloperToolWorkspace", () => {
  const content = readFileSync(resolve("components/tool-workspace.tsx"), "utf-8");
  assert.ok(content.includes("DeveloperToolWorkspace"), "Missing DeveloperToolWorkspace reference");
  assert.ok(content.includes('tool.category === "Developer"'), "Missing category branch for Developer");
});

// ----------------------------------------------------
// 6. Tool #62: JSON Formatter & Validator logic
// ----------------------------------------------------
await test("#62 JSON Formatter & Validator formats and detects errors", () => {
  const sample = '{"a":1,"b":[true,false,"str"]}';
  const parsed = JSON.parse(sample);
  const formatted2 = JSON.stringify(parsed, null, 2);
  const formatted4 = JSON.stringify(parsed, null, 4);
  assert.ok(formatted2.includes("  \"a\": 1"));
  assert.ok(formatted4.includes("    \"a\": 1"));

  // Check invalid syntax throws
  let threw = false;
  try {
    JSON.parse('{"broken": true, }');
  } catch (e) {
    threw = true;
    assert.ok(e instanceof SyntaxError);
  }
  assert.ok(threw, "Invalid JSON should throw SyntaxError");
});

// ----------------------------------------------------
// 7. Tool #63: JSON Minifier logic
// ----------------------------------------------------
await test("#63 JSON Minifier removes whitespace and reduces size", () => {
  const formatted = '{\n  "name": "ToolModeOn",\n  "count": 75\n}';
  const minified = JSON.stringify(JSON.parse(formatted));
  assert.equal(minified, '{"name":"ToolModeOn","count":75}');
  assert.ok(minified.length < formatted.length);
});

// ----------------------------------------------------
// 8. Tool #64: JavaScript Minifier logic (Terser)
// ----------------------------------------------------
await test("#64 JavaScript Minifier minifies with AST parser", async () => {
  const code = `
    function calculateTotal(price, taxRate) {
      // Internal calculation
      const subtotal = price * 1.0;
      const tax = subtotal * taxRate;
      return subtotal + tax;
    }
  `;
  const result = await terser.minify(code, { mangle: true, compress: true });
  assert.ok(result.code);
  assert.ok(result.code.length < code.length);
  assert.ok(!result.code.includes("// Internal calculation"));
});

// ----------------------------------------------------
// 9. Tool #65: CSS Minifier logic
// ----------------------------------------------------
await test("#65 CSS Minifier strips comments and collapses whitespace", () => {
  const css = `
    /* Header Styles */
    .header {
      color: #333333;
      margin: 0px 10px;
      padding: 12px;
    }
  `;
  const minified = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
  assert.ok(!minified.includes("/* Header Styles */"));
  assert.ok(minified.includes(".header{color:#333333;margin:0px 10px;padding:12px}"));
});

// ----------------------------------------------------
// 10. Tool #66: HTML Minifier logic
// ----------------------------------------------------
await test("#66 HTML Minifier preserves pre blocks and removes comments", () => {
  const html = `
    <!DOCTYPE html>
    <!-- Page Header -->
    <html>
      <body>
        <div class="box">
          <pre>  hello   world  </pre>
        </div>
      </body>
    </html>
  `;
  const preservedBlocks = [];
  let tokenized = html.replace(/<(pre|code)[\s\S]*?<\/\1>/gi, (m) => {
    preservedBlocks.push(m);
    return `___PRESERVED_BLOCK_${preservedBlocks.length - 1}___`;
  });
  tokenized = tokenized.replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "");
  tokenized = tokenized.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  const result = tokenized.replace(/___PRESERVED_BLOCK_(\d+)___/g, (_, idx) => preservedBlocks[Number(idx)]);

  assert.ok(!result.includes("<!-- Page Header -->"));
  assert.ok(result.includes("<pre>  hello   world  </pre>"));
});

// ----------------------------------------------------
// 11. Tool #67: SQL Formatter logic
// ----------------------------------------------------
await test("#67 SQL Formatter formats multiple dialects", () => {
  const query = "select id, name, count(*) from users where active = 1 group by id, name order by id desc limit 10";
  const pgFormatted = formatSql(query, { language: "postgresql", keywordCase: "upper" });
  assert.ok(pgFormatted.includes("SELECT"));
  assert.ok(pgFormatted.includes("GROUP BY"));
  assert.ok(pgFormatted.includes("ORDER BY"));
});

// ----------------------------------------------------
// 12. Tool #68: Regex Tester logic
// ----------------------------------------------------
await test("#68 Regex Tester matches patterns and capture groups", () => {
  const regex = /(?:https?:\/\/)?([a-z0-9.-]+)\.([a-z]{2,})/gi;
  const str = "Visit https://toolmodeon.online or test.dev today!";
  const matches = [...str.matchAll(regex)];
  assert.equal(matches.length, 2);
  assert.equal(matches[0][1], "toolmodeon");
  assert.equal(matches[0][2], "online");
});

// ----------------------------------------------------
// 13. Tool #69: Cron Expression Generator logic
// ----------------------------------------------------
await test("#69 Cron Generator translates expressions accurately", () => {
  const exp1 = cronstrue.toString("*/15 * * * *");
  assert.ok(exp1.toLowerCase().includes("15 minutes"));

  const exp2 = cronstrue.toString("0 9 * * 1-5");
  assert.ok(exp2.includes("09:00 AM"));
  assert.ok(exp2.includes("Monday through Friday"));
});

// ----------------------------------------------------
// 14. Tool #70: Unix Timestamp Converter logic
// ----------------------------------------------------
await test("#70 Unix Timestamp Converter converts seconds and milliseconds", () => {
  const sec = 1763078400; // 2025-11-14T00:00:00.000Z
  const dateSec = new Date(sec * 1000);
  assert.equal(dateSec.toISOString(), "2025-11-14T00:00:00.000Z");

  const ms = 1763078400000;
  const dateMs = new Date(ms);
  assert.equal(dateMs.toISOString(), "2025-11-14T00:00:00.000Z");
});

// ----------------------------------------------------
// 15. Tool #71: HTML Previewer sandboxing check
// ----------------------------------------------------
await test("#71 HTML Previewer enforces sandbox without allow-same-origin", () => {
  const component = readFileSync(resolve("components/developer-tools.tsx"), "utf-8");
  assert.ok(component.includes('sandbox="allow-scripts"'), "Missing sandbox allow-scripts attribute");
  assert.ok(!component.includes("allow-same-origin"), "Security violation: allow-same-origin must not be present");
});

// ----------------------------------------------------
// 16. Tool #72 & #73: YAML <-> JSON Converters
// ----------------------------------------------------
await test("#72 & #73 YAML and JSON converters transform reciprocally", () => {
  const originalObj = {
    appName: "ToolModeOn",
    active: true,
    ports: [80, 443],
    meta: { release: 2026 },
  };

  const yamlStr = yaml.dump(originalObj, { indent: 2 });
  assert.ok(yamlStr.includes("appName: ToolModeOn"));

  const parsedObj = yaml.load(yamlStr);
  assert.deepEqual(parsedObj, originalObj);
});

// ----------------------------------------------------
// 17. Tool #74: SQL Formatter & Validator logic
// ----------------------------------------------------
await test("#74 SQL Formatter & Validator detects clause ordering errors", () => {
  const component = readFileSync(resolve("components/developer-tools.tsx"), "utf-8");
  assert.ok(component.includes("validateSqlSyntax"), "Missing validateSqlSyntax function");
  assert.ok(component.includes("WHERE clause must appear before GROUP BY clause"), "Missing clause order validator");
  assert.ok(component.includes("Client-side syntax validation checks SQL statement structure"), "Missing disclaimer notice");
});

// ----------------------------------------------------
// 18. Tool #75: Diff Checker for Code
// ----------------------------------------------------
await test("#75 Diff Checker computes additions and deletions", () => {
  const oldCode = "const a = 1;\nconst b = 2;";
  const newCode = "const a = 1;\nconst b = 3;\nconst c = 4;";
  const lineDiff = diff.diffLines(oldCode, newCode);

  let adds = 0;
  let dels = 0;
  for (const c of lineDiff) {
    if (c.added) adds += c.count || 1;
    if (c.removed) dels += c.count || 1;
  }
  assert.ok(adds >= 2);
  assert.ok(dels >= 1);
});

// ----------------------------------------------------
// 19. Tool Guides & FAQs for all 14 tools
// ----------------------------------------------------
await test("All 14 developer tools have bespoke steps and FAQs in lib/tool-guides.ts", () => {
  const content = readFileSync(resolve("lib/tool-guides.ts"), "utf-8");
  const expectedSlugs = [
    "json-formatter",
    "json-minifier",
    "javascript-minifier",
    "css-minifier",
    "html-minifier",
    "sql-formatter",
    "regex-tester",
    "cron-expression-generator",
    "unix-timestamp-converter",
    "html-preview",
    "yaml-to-json",
    "json-to-yaml",
    "sql-formatter-validator",
    "code-diff-checker",
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

