"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as yaml from "js-yaml";
import { format as formatSql } from "sql-formatter";
import * as diff from "diff";
import cronstrue from "cronstrue";
import * as terser from "terser";
import {
  AlertCircle,
  ArrowLeftRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Download,
  FileCode,
  FileText,
  FileUp,
  Laptop,
  Maximize2,
  Minimize2,
  Monitor,
  Play,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Sparkles,
  Split,
  Tablet,
  Trash2,
} from "lucide-react";
import type { Tool } from "../lib/tools";

const inputClass =
  "w-full rounded-xl border border-line bg-pale/50 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 font-mono";

function copyToClipboard(text: string, setCopied: (val: boolean) => void) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  } else {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
}

function downloadFile(content: string, filename: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DeveloperToolWorkspace({
  tool,
}: {
  tool: Pick<Tool, "slug" | "name" | "description" | "category" | "pro">;
}) {
  if (tool.slug === "json-formatter") return <JsonFormatterWorkspace />;
  if (tool.slug === "json-minifier") return <JsonMinifierWorkspace />;
  if (tool.slug === "javascript-minifier") return <JsMinifierWorkspace />;
  if (tool.slug === "css-minifier") return <CssMinifierWorkspace />;
  if (tool.slug === "html-minifier") return <HtmlMinifierWorkspace />;
  if (tool.slug === "sql-formatter") return <SqlFormatterWorkspace />;
  if (tool.slug === "regex-tester") return <RegexTesterWorkspace />;
  if (tool.slug === "cron-expression-generator") return <CronGeneratorWorkspace />;
  if (tool.slug === "unix-timestamp-converter") return <UnixTimestampWorkspace />;
  if (tool.slug === "html-preview") return <HtmlPreviewWorkspace />;
  if (tool.slug === "yaml-to-json") return <YamlToJsonWorkspace />;
  if (tool.slug === "json-to-yaml") return <JsonToYamlWorkspace />;
  if (tool.slug === "sql-formatter-validator") return <SqlFormatterValidatorWorkspace />;
  if (tool.slug === "code-diff-checker") return <CodeDiffCheckerWorkspace />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #62 — JSON Formatter & Validator
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_JSON = `{
  "platform": "ToolModeOn",
  "version": 2.0,
  "active": true,
  "category": "Developer Tools",
  "features": [
    "Format and beautify JSON",
    "Instant syntax validation",
    "Line and column error pointers",
    "Minify or download"
  ],
  "author": {
    "organization": "ToolModeOn Team",
    "verified": true,
    "contact": null
  }
}`;

function JsonFormatterWorkspace() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [indent, setIndent] = useState<number | string>(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<{ message: string; line?: number; column?: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndFormat = useCallback(
    (source: string, indentSize: number | string, mode: "format" | "minify" = "format") => {
      if (!source.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        const parsed = JSON.parse(source);
        setError(null);
        if (mode === "minify") {
          setOutput(JSON.stringify(parsed));
        } else {
          const spacing = indentSize === "tab" ? "\t" : Number(indentSize);
          setOutput(JSON.stringify(parsed, null, spacing));
        }
      } catch (err: any) {
        let line: number | undefined;
        let column: number | undefined;
        const msg = err?.message || "Invalid JSON syntax";
        const posMatch = msg.match(/at position (\d+)/) || msg.match(/line (\d+) column (\d+)/);
        if (posMatch) {
          if (posMatch[2]) {
            line = parseInt(posMatch[1], 10);
            column = parseInt(posMatch[2], 10);
          } else {
            const pos = parseInt(posMatch[1], 10);
            const linesBefore = source.slice(0, pos).split("\n");
            line = linesBefore.length;
            column = linesBefore[linesBefore.length - 1].length + 1;
          }
        }
        setError({ message: msg, line, column });
      }
    },
    []
  );

  useEffect(() => {
    validateAndFormat(input, indent, "format");
  }, [input, indent, validateAndFormat]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInput(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Indent:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : Number(e.target.value))}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
            <option value="tab">Tabs</option>
          </select>
          <button
            type="button"
            onClick={() => validateAndFormat(input, indent, "format")}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white shadow hover:opacity-95"
          >
            <Sparkles size={14} /> Format
          </button>
          <button
            type="button"
            onClick={() => validateAndFormat(input, indent, "minify")}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <Minimize2 size={14} /> Minify
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload JSON
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JSON)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
              setError(null);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Invalid JSON: </span>
            <span>{error.message}</span>
            {error.line !== undefined && (
              <span className="ml-2 font-mono font-bold bg-red-200/60 px-2 py-0.5 rounded">
                Line {error.line}, Column {error.column}
              </span>
            )}
          </div>
        </div>
      ) : input.trim() ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Valid JSON — Syntax is clean and well-formed.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input JSON</label>
            <span className="text-xs text-muted font-mono">{formatBytes(input.length)}</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw or unformatted JSON here..."
            className={`${inputClass} min-h-[460px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Formatted & Validated Output
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "formatted.json", "application/json")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Formatted output will appear here automatically..."
            className={`${inputClass} min-h-[460px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #63 — JSON Minifier
// ─────────────────────────────────────────────────────────────────────────────
function JsonMinifierWorkspace() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Invalid JSON syntax");
      setOutput("");
    }
  }, [input]);

  const originalBytes = new Blob([input]).size;
  const minifiedBytes = new Blob([output]).size;
  const reduction = originalBytes > 0 && minifiedBytes > 0 ? ((1 - minifiedBytes / originalBytes) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs">
            <span className="text-muted">Original: </span>
            <span className="font-bold font-mono text-ink">{formatBytes(originalBytes)}</span>
          </div>
          <span className="text-line">|</span>
          <div className="text-xs">
            <span className="text-muted">Minified: </span>
            <span className="font-bold font-mono text-ink">{formatBytes(minifiedBytes)}</span>
          </div>
          {Number(reduction) > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
              -{reduction}% Size Reduction
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setInput(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = "";
            }}
            accept=".json,application/json,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload JSON
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JSON)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>Cannot minify invalid JSON: {error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON to remove whitespace and compress..."
            className={`${inputClass} min-h-[420px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Minified JSON</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "minified.json", "application/json")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Minified single-line JSON will appear here..."
            className={`${inputClass} min-h-[420px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #64 — JavaScript Minifier
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_JS = `// Utility helper for calculating cart discounts
function calculateDiscount(user, items, baseTaxRate) {
  /* Check if the user is a VIP member */
  const isVip = user && user.isVipMember === true;
  let totalDiscount = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.price > 100) {
      totalDiscount += item.price * 0.15;
    } else {
      totalDiscount += item.price * 0.05;
    }
  }

  if (isVip) {
    totalDiscount += 25;
  }

  const finalTax = totalDiscount * baseTaxRate;
  console.log("Calculated discount:", totalDiscount, "Tax savings:", finalTax);
  return totalDiscount;
}
`;

function JsMinifierWorkspace() {
  const [input, setInput] = useState(SAMPLE_JS);
  const [output, setOutput] = useState("");
  const [mangle, setMangle] = useState(true);
  const [compress, setCompress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runMinification = useCallback(
    async (code: string, doMangle: boolean, doCompress: boolean) => {
      if (!code.trim()) {
        setOutput("");
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await terser.minify(code, {
          mangle: doMangle,
          compress: doCompress ? { dead_code: true, drop_console: false } : false,
        });
        if (res.code !== undefined) {
          setOutput(res.code);
        }
      } catch (err: any) {
        const line = err?.line;
        const col = err?.col;
        const msg = err?.message || "JavaScript parse error";
        setError(line !== undefined ? `${msg} (Line ${line}, Col ${col})` : msg);
        setOutput("");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    runMinification(input, mangle, compress);
  }, [input, mangle, compress, runMinification]);

  const originalBytes = new Blob([input]).size;
  const minifiedBytes = new Blob([output]).size;
  const reduction = originalBytes > 0 && minifiedBytes > 0 ? ((1 - minifiedBytes / originalBytes) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={mangle}
              onChange={(e) => setMangle(e.target.checked)}
              className="rounded text-brand"
            />
            Mangle variable names
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={compress}
              onChange={(e) => setCompress(e.target.checked)}
              className="rounded text-brand"
            />
            Dead-code elimination
          </label>
          {Number(reduction) > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
              -{reduction}% ({formatBytes(originalBytes)} → {formatBytes(minifiedBytes)})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setInput(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = "";
            }}
            accept=".js,application/javascript,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload .js
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JS)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>Syntax / Minification Error: {error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Original JavaScript</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JavaScript code here..."
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Minified JS {loading && "(Optimizing...)"}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "app.min.js", "application/javascript")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .min.js
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Minified JavaScript output will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #65 — CSS Minifier
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_CSS = `/* ToolModeOn Main UI Theme */
:root {
  --primary-brand: #7651e8;
  --primary-hover: #5d3bc6;
  --neutral-bg: #f8fafc;
  --text-main: #0f172a;
}

.hero-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background-color: var(--neutral-bg);
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 16px;
  line-height: 1.2;
}

.hero-button {
  background: var(--primary-brand);
  color: #ffffff;
  padding: 12px 28px;
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.hero-button:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}
`;

function minifyCssString(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // remove comments
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/\s*([{}:;,>+~])\s*/g, "$1") // remove whitespace around punctuation
    .replace(/;}/g, "}") // remove trailing semicolons before closing brace
    .replace(/:\s*0(px|em|rem|%|pt)/g, ":0") // zero units
    .trim();
}

function CssMinifierWorkspace() {
  const [input, setInput] = useState(SAMPLE_CSS);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOutput(minifyCssString(input));
  }, [input]);

  const originalBytes = new Blob([input]).size;
  const minifiedBytes = new Blob([output]).size;
  const reduction = originalBytes > 0 && minifiedBytes > 0 ? ((1 - minifiedBytes / originalBytes) * 100).toFixed(1) : "0";

  // Balance check
  const openBraces = (input.match(/{/g) || []).length;
  const closeBraces = (input.match(/}/g) || []).length;
  const hasBraceMismatch = openBraces !== closeBraces;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs">
            <span className="text-muted">Original: </span>
            <span className="font-bold font-mono text-ink">{formatBytes(originalBytes)}</span>
          </div>
          <span className="text-line">|</span>
          <div className="text-xs">
            <span className="text-muted">Minified: </span>
            <span className="font-bold font-mono text-ink">{formatBytes(minifiedBytes)}</span>
          </div>
          {Number(reduction) > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
              -{reduction}% Compression
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setInput(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = "";
            }}
            accept=".css,text/css,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload .css
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_CSS)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {hasBraceMismatch && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>Warning: CSS has mismatched curly braces ({openBraces} opening vs {closeBraces} closing).</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input CSS</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your raw CSS styles here..."
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Minified CSS</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "styles.min.css", "text/css")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .min.css
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Minified CSS will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #66 — HTML Minifier
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Character encoding & viewport setup -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToolModeOn - Everyday Tools</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        background: #f1f5f9;
        margin: 0;
        padding: 24px;
      }
      .card {
        background: #ffffff;
        border-radius: 12px;
        padding: 24px;
        max-width: 480px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
    </style>
  </head>
  <body>
    <!-- Main content card container -->
    <div class="card">
      <h1>Everyday Tools, One Platform</h1>
      <p>Instant online tools designed for developers, creators, and everyday productivity.</p>
      <pre><code>console.log("Zero server upload required");</code></pre>
      <button onclick="alert('Welcome to ToolModeOn!')">Get Started</button>
    </div>
  </body>
</html>
`;

function minifyHtmlString(html: string, removeComments = true, collapseWhitespace = true): string {
  // Preserve pre, code, script, style, textarea contents
  const preservedBlocks: string[] = [];
  let tokenized = html.replace(
    /<(pre|code|textarea|script|style)[\s\S]*?<\/\1>/gi,
    (match) => {
      preservedBlocks.push(match);
      return `___PRESERVED_BLOCK_${preservedBlocks.length - 1}___`;
    }
  );

  if (removeComments) {
    // Remove standard HTML comments, preserve conditional comments <!--[if ...]>
    tokenized = tokenized.replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "");
  }

  if (collapseWhitespace) {
    // Collapse whitespace between tags
    tokenized = tokenized.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  }

  // Restore preserved blocks
  return tokenized.replace(/___PRESERVED_BLOCK_(\d+)___/g, (_, index) => {
    return preservedBlocks[parseInt(index, 10)] || "";
  });
}

function HtmlMinifierWorkspace() {
  const [input, setInput] = useState(SAMPLE_HTML);
  const [removeComments, setRemoveComments] = useState(true);
  const [collapseWhitespace, setCollapseWhitespace] = useState(true);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOutput(minifyHtmlString(input, removeComments, collapseWhitespace));
  }, [input, removeComments, collapseWhitespace]);

  const originalBytes = new Blob([input]).size;
  const minifiedBytes = new Blob([output]).size;
  const reduction = originalBytes > 0 && minifiedBytes > 0 ? ((1 - minifiedBytes / originalBytes) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={removeComments}
              onChange={(e) => setRemoveComments(e.target.checked)}
              className="rounded text-brand"
            />
            Remove comments
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={collapseWhitespace}
              onChange={(e) => setCollapseWhitespace(e.target.checked)}
              className="rounded text-brand"
            />
            Collapse whitespace
          </label>
          {Number(reduction) > 0 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
              -{reduction}% ({formatBytes(originalBytes)} → {formatBytes(minifiedBytes)})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setInput(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = "";
            }}
            accept=".html,.htm,text/html,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload HTML
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_HTML)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input HTML</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste raw HTML here..."
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Minified HTML</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "index.min.html", "text/html")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .html
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Minified HTML will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #67 — SQL Formatter
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_SQL = `select u.id as user_id, u.full_name, u.email, count(o.id) as total_orders, coalesce(sum(o.amount), 0) as total_spent, max(o.created_at) as last_order_date from users u inner join accounts a on u.account_id = a.id left join orders o on u.id = o.user_id and o.status = 'completed' where a.status = 'active' and u.created_at >= '2025-01-01' group by u.id, u.full_name, u.email having count(o.id) > 2 order by total_spent desc, u.full_name asc limit 50;`;

type SqlDialect = "sql" | "mysql" | "postgresql" | "sqlite" | "transactsql" | "plsql" | "bigquery";

function SqlFormatterWorkspace() {
  const [input, setInput] = useState(SAMPLE_SQL);
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [tabWidth, setTabWidth] = useState(2);
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower" | "preserve">("upper");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const formatted = formatSql(input, {
        language: dialect,
        tabWidth: tabWidth,
        keywordCase: keywordCase,
      });
      setOutput(formatted);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to format SQL");
      setOutput("");
    }
  }, [input, dialect, tabWidth, keywordCase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Dialect:</label>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlDialect)}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value="sql">Standard SQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="transactsql">T-SQL (SQL Server)</option>
            <option value="plsql">PL/SQL (Oracle)</option>
            <option value="bigquery">Google BigQuery</option>
          </select>

          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Keywords:</label>
          <select
            value={keywordCase}
            onChange={(e) => setKeywordCase(e.target.value as any)}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Preserve</option>
          </select>

          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Indent:</label>
          <select
            value={tabWidth}
            onChange={(e) => setTabWidth(Number(e.target.value))}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(SAMPLE_SQL)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>Error formatting query: {error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input SQL Query</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter raw SQL statement (SELECT, INSERT, UPDATE, DELETE, CREATE...)"
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Formatted SQL</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "query.sql", "application/sql")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .sql
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Formatted SQL output with indented clauses will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #68 — Regex Tester
// ─────────────────────────────────────────────────────────────────────────────
const REGEX_PRESETS = [
  {
    name: "Email Address",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    flags: "gm",
    sample: "user@toolmodeon.online\nsupport@example.com\ninvalid-email@\ntest.name+tag@sub.domain.co.uk",
  },
  {
    name: "URL / Web Address",
    pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)",
    flags: "gi",
    sample: "Visit https://toolmodeon.online or check http://example.org/docs?id=123&page=2 for details.",
  },
  {
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    sample: "Host 192.168.1.1 connected to gateway 10.0.0.254 and DNS 8.8.8.8. Invalid: 999.12.34.5",
  },
  {
    name: "US Phone Number",
    pattern: "(?:\\+?1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})",
    flags: "g",
    sample: "Call (555) 123-4567 or +1-800-555-0199 or 415.555.2671 during normal office hours.",
  },
  {
    name: "ISO Date (YYYY-MM-DD)",
    pattern: "\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    sample: "Release scheduled for 2026-11-14, followed by maintenance on 2026-12-01.",
  },
  {
    name: "Hex Color Code",
    pattern: "#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b",
    flags: "gi",
    sample: "Brand colors: #7651E8, #3984F6, #FFF, #000000, and accent #E58A2C.",
  },
];

interface MatchDetail {
  index: number;
  match: string;
  start: number;
  end: number;
  groups: string[];
}

function RegexTesterWorkspace() {
  const [pattern, setPattern] = useState(REGEX_PRESETS[0].pattern);
  const [flags, setFlags] = useState<{ g: boolean; i: boolean; m: boolean; s: boolean; u: boolean }>({
    g: true,
    i: false,
    m: true,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState(REGEX_PRESETS[0].sample);
  const [copied, setCopied] = useState(false);

  const activeFlags = useMemo(() => {
    let f = "";
    if (flags.g) f += "g";
    if (flags.i) f += "i";
    if (flags.m) f += "m";
    if (flags.s) f += "s";
    if (flags.u) f += "u";
    return f;
  }, [flags]);

  const { matches, error, highlightedSpans } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, highlightedSpans: [] };
    try {
      const regex = new RegExp(pattern, activeFlags);
      const list: MatchDetail[] = [];
      const spans: Array<{ text: string; isMatch: boolean; matchIndex?: number }> = [];

      if (!activeFlags.includes("g")) {
        const single = regex.exec(testString);
        if (single && single[0] !== undefined) {
          const start = single.index;
          const end = start + single[0].length;
          list.push({
            index: 0,
            match: single[0],
            start,
            end,
            groups: Array.from(single).slice(1),
          });
          if (start > 0) spans.push({ text: testString.slice(0, start), isMatch: false });
          spans.push({ text: single[0], isMatch: true, matchIndex: 0 });
          if (end < testString.length) spans.push({ text: testString.slice(end), isMatch: false });
        } else {
          spans.push({ text: testString, isMatch: false });
        }
      } else {
        let lastIndex = 0;
        let matchCount = 0;
        let m: RegExpExecArray | null;

        while ((m = regex.exec(testString)) !== null && matchCount < 2000) {
          const start = m.index;
          const end = start + m[0].length;

          if (start > lastIndex) {
            spans.push({ text: testString.slice(lastIndex, start), isMatch: false });
          }

          spans.push({ text: m[0], isMatch: true, matchIndex: matchCount });
          list.push({
            index: matchCount,
            match: m[0],
            start,
            end,
            groups: Array.from(m).slice(1),
          });

          lastIndex = end;
          matchCount++;

          if (m[0].length === 0) {
            regex.lastIndex++;
          }
        }

        if (lastIndex < testString.length) {
          spans.push({ text: testString.slice(lastIndex), isMatch: false });
        }
      }

      return { matches: list, error: null, highlightedSpans: spans };
    } catch (err: any) {
      return { matches: [], error: err?.message || "Invalid regular expression", highlightedSpans: [] };
    }
  }, [pattern, activeFlags, testString]);

  const loadPreset = (preset: (typeof REGEX_PRESETS)[0]) => {
    setPattern(preset.pattern);
    setTestString(preset.sample);
    setFlags({
      g: preset.flags.includes("g"),
      i: preset.flags.includes("i"),
      m: preset.flags.includes("m"),
      s: preset.flags.includes("s"),
      u: preset.flags.includes("u"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Presets:</label>
          <select
            onChange={(e) => {
              const selected = REGEX_PRESETS.find((p) => p.name === e.target.value);
              if (selected) loadPreset(selected);
            }}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            {REGEX_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPattern("");
              setTestString("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Regex Input Bar */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Regular Expression Pattern</label>
          <div className="flex items-center rounded-xl border border-line bg-pale/50 px-3 py-2.5 focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/10">
            <span className="text-lg font-mono text-muted select-none">/</span>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern, e.g. [a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
              className="w-full bg-transparent px-2 font-mono text-sm text-ink outline-none"
              spellCheck={false}
            />
            <span className="text-lg font-mono text-muted select-none">/</span>
            <span className="ml-1 text-sm font-mono font-bold text-brand">{activeFlags || "none"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <span className="text-xs font-bold text-muted uppercase">Flags:</span>
          {(["g", "i", "m", "s", "u"] as const).map((flag) => {
            const labels: Record<string, string> = {
              g: "Global (g)",
              i: "Case-insensitive (i)",
              m: "Multiline (m)",
              s: "Dot-all (s)",
              u: "Unicode (u)",
            };
            return (
              <label key={flag} className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={flags[flag]}
                  onChange={(e) => setFlags({ ...flags, [flag]: e.target.checked })}
                  className="rounded text-brand"
                />
                {labels[flag]}
              </label>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>Regex Syntax Error: {error}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">
              {matches.length}
            </span>
            <span className="font-bold text-ink">
              {matches.length === 1 ? "1 match found" : `${matches.length} matches found`}
            </span>
          </div>
          {matches.length > 0 && (
            <button
              type="button"
              onClick={() => copyToClipboard(matches.map((m) => m.match).join("\n"), setCopied)}
              className="flex items-center gap-1 rounded-lg border border-line bg-pale px-2.5 py-1 text-xs font-bold text-ink hover:bg-white"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy All Matches"}
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test String Input */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Test String</label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter or paste text to test regular expression matches against..."
            className={`${inputClass} min-h-[360px] resize-y`}
            spellCheck={false}
          />
        </div>

        {/* Live Highlight Preview */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Match Highlighting</label>
          <div className="min-h-[360px] rounded-xl border border-line bg-white p-4 font-mono text-sm leading-relaxed overflow-auto whitespace-pre-wrap max-h-[500px]">
            {highlightedSpans.length === 0 ? (
              <span className="text-muted/60">No text to test.</span>
            ) : (
              highlightedSpans.map((span, idx) =>
                span.isMatch ? (
                  <mark
                    key={idx}
                    className="rounded bg-brand/20 px-1 py-0.5 text-brand font-bold border border-brand/30 hover:bg-brand/30 transition"
                    title={`Match #${(span.matchIndex ?? 0) + 1}`}
                  >
                    {span.text}
                  </mark>
                ) : (
                  <span key={idx} className="text-ink">
                    {span.text}
                  </span>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Match Table Details */}
      {matches.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Capture Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-pale/50 text-muted">
                <tr>
                  <th className="px-3 py-2 font-bold">#</th>
                  <th className="px-3 py-2 font-bold">Match</th>
                  <th className="px-3 py-2 font-bold">Index</th>
                  <th className="px-3 py-2 font-bold">Length</th>
                  <th className="px-3 py-2 font-bold">Capture Groups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {matches.slice(0, 100).map((m) => (
                  <tr key={m.index} className="hover:bg-pale/30">
                    <td className="px-3 py-2 font-bold text-muted">{m.index + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-brand">{m.match}</td>
                    <td className="px-3 py-2 font-mono text-muted">
                      [{m.start}:{m.end}]
                    </td>
                    <td className="px-3 py-2 font-mono text-muted">{m.match.length}</td>
                    <td className="px-3 py-2 font-mono text-ink">
                      {m.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.groups.map((g, gIdx) => (
                            <span key={gIdx} className="rounded bg-pale px-1.5 py-0.5 text-[11px] font-semibold">
                              ${gIdx + 1}: {g !== undefined ? g : "(none)"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matches.length > 100 && (
            <p className="text-xs text-muted">Showing first 100 of {matches.length} matches.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #69 — Cron Expression Generator
// ─────────────────────────────────────────────────────────────────────────────
const CRON_PRESETS = [
  { name: "Every minute", cron: "* * * * *" },
  { name: "Every 5 minutes", cron: "*/5 * * * *" },
  { name: "Every 15 minutes", cron: "*/15 * * * *" },
  { name: "Every 30 minutes", cron: "*/30 * * * *" },
  { name: "Every hour at minute 0", cron: "0 * * * *" },
  { name: "Every day at midnight (00:00)", cron: "0 0 * * *" },
  { name: "Every day at 9:00 AM", cron: "0 9 * * *" },
  { name: "Every weekday at 9:00 AM", cron: "0 9 * * 1-5" },
  { name: "Every Sunday at midnight", cron: "0 0 * * 0" },
  { name: "First day of every month at midnight", cron: "0 0 1 * *" },
];

function getNextCronRuns(cron: string, count = 5): string[] {
  // Simple prospective simulation for standard 5-part cron
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minPart, hrPart, domPart, monPart, dowPart] = parts;
  const results: string[] = [];
  const now = new Date();
  const iter = new Date(now.getTime() + 60000); // start next minute
  iter.setSeconds(0, 0);

  const matchField = (val: number, expr: string): boolean => {
    if (expr === "*") return true;
    if (expr.startsWith("*/")) {
      const step = parseInt(expr.slice(2), 10);
      return !isNaN(step) && step > 0 && val % step === 0;
    }
    if (expr.includes("-")) {
      const [start, end] = expr.split("-").map((v) => parseInt(v, 10));
      return val >= start && val <= end;
    }
    if (expr.includes(",")) {
      return expr.split(",").some((sub) => matchField(val, sub));
    }
    return parseInt(expr, 10) === val;
  };

  let maxMinutesChecked = 60 * 24 * 365; // up to 1 year ahead
  while (results.length < count && maxMinutesChecked > 0) {
    const minute = iter.getMinutes();
    const hour = iter.getHours();
    const dom = iter.getDate();
    const month = iter.getMonth() + 1; // 1-12
    const dow = iter.getDay(); // 0-6 (Sun-Sat)

    if (
      matchField(minute, minPart) &&
      matchField(hour, hrPart) &&
      matchField(dom, domPart) &&
      matchField(month, monPart) &&
      matchField(dow, dowPart)
    ) {
      results.push(iter.toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" }));
    }

    iter.setMinutes(iter.getMinutes() + 1);
    maxMinutesChecked--;
  }

  return results;
}

function CronGeneratorWorkspace() {
  const [cron, setCron] = useState("0 9 * * 1-5");
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("9");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("1-5");
  const [copied, setCopied] = useState(false);

  const syncFromParts = (m: string, h: string, dom: string, mon: string, dow: string) => {
    setMinute(m);
    setHour(h);
    setDayOfMonth(dom);
    setMonth(mon);
    setDayOfWeek(dow);
    setCron(`${m} ${h} ${dom} ${mon} ${dow}`);
  };

  const handleManualCronChange = (val: string) => {
    setCron(val);
    const parts = val.trim().split(/\s+/);
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
    }
  };

  const explanation = useMemo(() => {
    try {
      return cronstrue.toString(cron);
    } catch {
      return "Invalid or unsupported cron expression format.";
    }
  }, [cron]);

  const upcomingRuns = useMemo(() => {
    return getNextCronRuns(cron, 5);
  }, [cron]);

  return (
    <div className="space-y-6">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Common Schedules:</label>
          <select
            onChange={(e) => handleManualCronChange(e.target.value)}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            {CRON_PRESETS.map((p) => (
              <option key={p.cron} value={p.cron}>
                {p.name} ({p.cron})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => copyToClipboard(cron, setCopied)}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white shadow hover:opacity-95"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy Expression"}
        </button>
      </div>

      {/* Main Display Card */}
      <div className="rounded-3xl border border-line bg-gradient-to-br from-brand/5 via-white to-pale p-6 sm:p-8 shadow-soft text-center space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand">Cron Expression</p>
        <div className="inline-block rounded-2xl border border-brand/30 bg-white px-6 py-4 shadow-sm">
          <span className="font-mono text-3xl sm:text-4xl font-black tracking-wider text-ink">{cron}</span>
        </div>
        <p className="text-lg font-bold text-ink max-w-xl mx-auto">{explanation}</p>
      </div>

      {/* Visual Builders */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-ink">Visual Expression Builder</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Minute */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Minute (0 - 59)</label>
            <select
              value={minute}
              onChange={(e) => syncFromParts(e.target.value, hour, dayOfMonth, month, dayOfWeek)}
              className="w-full rounded-xl border border-line bg-pale/50 p-2.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="*">Every minute (*)</option>
              <option value="*/5">Every 5 minutes (*/5)</option>
              <option value="*/10">Every 10 minutes (*/10)</option>
              <option value="*/15">Every 15 minutes (*/15)</option>
              <option value="*/30">Every 30 minutes (*/30)</option>
              <option value="0">At minute 0 (0)</option>
              <option value="15">At minute 15 (15)</option>
              <option value="30">At minute 30 (30)</option>
              <option value="45">At minute 45 (45)</option>
            </select>
          </div>

          {/* Hour */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Hour (0 - 23)</label>
            <select
              value={hour}
              onChange={(e) => syncFromParts(minute, e.target.value, dayOfMonth, month, dayOfWeek)}
              className="w-full rounded-xl border border-line bg-pale/50 p-2.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="*">Every hour (*)</option>
              <option value="*/2">Every 2 hours (*/2)</option>
              <option value="*/4">Every 4 hours (*/4)</option>
              <option value="*/6">Every 6 hours (*/6)</option>
              <option value="*/12">Every 12 hours (*/12)</option>
              <option value="0">Midnight (00:00)</option>
              <option value="6">6:00 AM (06:00)</option>
              <option value="9">9:00 AM (09:00)</option>
              <option value="12">Noon (12:00)</option>
              <option value="18">6:00 PM (18:00)</option>
            </select>
          </div>

          {/* Day of Month */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Day of Month (1 - 31)</label>
            <select
              value={dayOfMonth}
              onChange={(e) => syncFromParts(minute, hour, e.target.value, month, dayOfWeek)}
              className="w-full rounded-xl border border-line bg-pale/50 p-2.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="*">Every day (*)</option>
              <option value="1">1st of the month (1)</option>
              <option value="15">15th of the month (15)</option>
              <option value="1,15">1st and 15th (1,15)</option>
              <option value="*/2">Every 2 days (*/2)</option>
            </select>
          </div>

          {/* Month */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Month (1 - 12)</label>
            <select
              value={month}
              onChange={(e) => syncFromParts(minute, hour, dayOfMonth, e.target.value, dayOfWeek)}
              className="w-full rounded-xl border border-line bg-pale/50 p-2.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="*">Every month (*)</option>
              <option value="*/3">Every quarter (*/3)</option>
              <option value="1">January (1)</option>
              <option value="6">June (6)</option>
              <option value="12">December (12)</option>
            </select>
          </div>

          {/* Day of Week */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase">Day of Week (0 - 6)</label>
            <select
              value={dayOfWeek}
              onChange={(e) => syncFromParts(minute, hour, dayOfMonth, month, e.target.value)}
              className="w-full rounded-xl border border-line bg-pale/50 p-2.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="*">Every day (*)</option>
              <option value="1-5">Monday to Friday (1-5)</option>
              <option value="0,6">Weekends only (0,6)</option>
              <option value="0">Sunday only (0)</option>
              <option value="1">Monday only (1)</option>
              <option value="5">Friday only (5)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-muted uppercase">Or type a custom 5-field cron expression</label>
          <input
            value={cron}
            onChange={(e) => handleManualCronChange(e.target.value)}
            placeholder="* * * * *"
            className="w-full rounded-xl border border-line bg-pale/50 px-4 py-3 font-mono text-sm text-ink outline-none focus:border-brand focus:bg-white"
          />
        </div>
      </div>

      {/* Upcoming Runs */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Next 5 Scheduled Executions</h3>
        {upcomingRuns.length > 0 ? (
          <ul className="divide-y divide-line">
            {upcomingRuns.map((timeStr, idx) => (
              <li key={idx} className="flex items-center gap-3 py-2.5 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 font-bold text-brand text-[10px]">
                  {idx + 1}
                </span>
                <Clock size={14} className="text-muted" />
                <span className="font-semibold text-ink">{timeStr}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Unable to calculate upcoming run times for this expression.</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #70 — Unix Timestamp Converter
// ─────────────────────────────────────────────────────────────────────────────
function UnixTimestampWorkspace() {
  const [currentEpoch, setCurrentEpoch] = useState(Math.floor(Date.now() / 1000));
  const [currentMs, setCurrentMs] = useState(Date.now());
  const [ticking, setTicking] = useState(true);

  // Timestamp -> Date
  const [tsInput, setTsInput] = useState(Math.floor(Date.now() / 1000).toString());
  // Date -> Timestamp
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 16));

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!ticking) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentEpoch(Math.floor(now / 1000));
      setCurrentMs(now);
    }, 1000);
    return () => clearInterval(interval);
  }, [ticking]);

  const copyWithKey = (val: string, key: string) => {
    copyToClipboard(val, () => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Convert parsed timestamp
  const parsedDateInfo = useMemo(() => {
    const raw = tsInput.trim();
    if (!raw) return null;
    const num = Number(raw);
    if (isNaN(num)) return null;

    // Auto-detect seconds vs milliseconds
    const date = raw.length > 11 ? new Date(num) : new Date(num * 1000);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    let relative = "";
    if (Math.abs(diffSec) < 60) relative = diffSec >= 0 ? `${diffSec} seconds ago` : `in ${Math.abs(diffSec)} seconds`;
    else if (Math.abs(diffSec) < 3600) {
      const m = Math.floor(Math.abs(diffSec) / 60);
      relative = diffSec >= 0 ? `${m} minutes ago` : `in ${m} minutes`;
    } else if (Math.abs(diffSec) < 86400) {
      const h = Math.floor(Math.abs(diffSec) / 3600);
      relative = diffSec >= 0 ? `${h} hours ago` : `in ${h} hours`;
    } else {
      const d = Math.floor(Math.abs(diffSec) / 86400);
      relative = diffSec >= 0 ? `${d} days ago` : `in ${d} days`;
    }

    const year = date.getUTCFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    return {
      date,
      utcIso: date.toISOString(),
      utcString: date.toUTCString(),
      localString: date.toString(),
      relative,
      isLeapYear,
      dayOfWeek: date.toLocaleDateString("en-US", { weekday: "long" }),
    };
  }, [tsInput]);

  // Convert picked date to epoch
  const convertedFromDate = useMemo(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return {
      seconds: Math.floor(d.getTime() / 1000),
      milliseconds: d.getTime(),
    };
  }, [dateInput]);

  const adjustTimestamp = (seconds: number) => {
    const current = Number(tsInput) || Math.floor(Date.now() / 1000);
    setTsInput((current + seconds).toString());
  };

  return (
    <div className="space-y-6">
      {/* Current Live Epoch */}
      <div className="rounded-3xl border border-line bg-gradient-to-r from-brand/5 via-white to-pale p-6 sm:p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand">Current Unix Epoch Time</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-black text-ink">{currentEpoch}</span>
              <span className="text-xs font-semibold text-muted font-mono">({currentMs} ms)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTicking(!ticking)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-pale shadow-sm"
            >
              {ticking ? "Pause Ticking" : "Resume Ticking"}
            </button>
            <button
              type="button"
              onClick={() => {
                const nowSec = Math.floor(Date.now() / 1000);
                setTsInput(nowSec.toString());
                setDateInput(new Date().toISOString().slice(0, 16));
              }}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-bold text-white hover:opacity-90 shadow-sm"
            >
              Use Current Time
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Timestamp to Date */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-ink">Convert Timestamp → Human Date</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase">Unix Timestamp (Seconds or Milliseconds)</label>
            <input
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="e.g. 1763078400"
              className={inputClass}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => adjustTimestamp(-86400)}
                className="rounded-lg border border-line bg-pale px-2 py-1 text-[11px] font-bold text-ink hover:bg-white"
              >
                -1 Day
              </button>
              <button
                type="button"
                onClick={() => adjustTimestamp(-3600)}
                className="rounded-lg border border-line bg-pale px-2 py-1 text-[11px] font-bold text-ink hover:bg-white"
              >
                -1 Hour
              </button>
              <button
                type="button"
                onClick={() => adjustTimestamp(3600)}
                className="rounded-lg border border-line bg-pale px-2 py-1 text-[11px] font-bold text-ink hover:bg-white"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => adjustTimestamp(86400)}
                className="rounded-lg border border-line bg-pale px-2 py-1 text-[11px] font-bold text-ink hover:bg-white"
              >
                +1 Day
              </button>
            </div>
          </div>

          {parsedDateInfo ? (
            <div className="space-y-3 pt-2 divide-y divide-line">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">UTC Time</span>
                  <p className="font-mono text-xs font-bold text-ink">{parsedDateInfo.utcIso}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyWithKey(parsedDateInfo.utcIso, "utcIso")}
                  className="rounded-md border border-line px-2 py-1 text-[11px] font-bold hover:bg-pale"
                >
                  {copiedKey === "utcIso" ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">RFC 2822 / GMT</span>
                  <p className="font-mono text-xs font-bold text-ink">{parsedDateInfo.utcString}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyWithKey(parsedDateInfo.utcString, "utcString")}
                  className="rounded-md border border-line px-2 py-1 text-[11px] font-bold hover:bg-pale"
                >
                  {copiedKey === "utcString" ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Your Local Time</span>
                  <p className="font-mono text-xs font-bold text-ink">{parsedDateInfo.localString}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyWithKey(parsedDateInfo.localString, "localString")}
                  className="rounded-md border border-line px-2 py-1 text-[11px] font-bold hover:bg-pale"
                >
                  {copiedKey === "localString" ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-bold text-brand">
                  {parsedDateInfo.relative}
                </span>
                <span className="rounded-full bg-pale px-2.5 py-0.5 font-semibold text-muted">
                  {parsedDateInfo.dayOfWeek}
                </span>
                <span className="rounded-full bg-pale px-2.5 py-0.5 font-semibold text-muted">
                  {parsedDateInfo.isLeapYear ? "Leap year" : "Not a leap year"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Enter a valid numeric timestamp above.</p>
          )}
        </div>

        {/* Section 2: Date to Timestamp */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-ink">Convert Human Date → Unix Timestamp</h3>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase">Select Date & Time</label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full rounded-xl border border-line bg-pale/50 px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:bg-white"
            />
          </div>

          {convertedFromDate && (
            <div className="space-y-4 pt-3 divide-y divide-line">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Seconds (Unix Epoch)</span>
                  <p className="font-mono text-lg font-bold text-brand">{convertedFromDate.seconds}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyWithKey(convertedFromDate.seconds.toString(), "sec")}
                  className="rounded-md border border-line px-2.5 py-1 text-xs font-bold hover:bg-pale"
                >
                  {copiedKey === "sec" ? "Copied" : "Copy Seconds"}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Milliseconds</span>
                  <p className="font-mono text-base font-bold text-ink">{convertedFromDate.milliseconds}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyWithKey(convertedFromDate.milliseconds.toString(), "ms")}
                  className="rounded-md border border-line px-2.5 py-1 text-xs font-bold hover:bg-pale"
                >
                  {copiedKey === "ms" ? "Copied" : "Copy Milliseconds"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #71 — HTML Previewer
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_PREVIEW_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 20px;
      padding: 32px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .badge {
      display: inline-block;
      background: #ede9fe;
      color: #7c3aed;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    h2 { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
    p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .btn {
      display: block;
      width: 100%;
      background: #7c3aed;
      color: #ffffff;
      padding: 12px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">ToolModeOn Live Preview</span>
    <h2>Everyday Tools</h2>
    <p>Render interactive HTML, responsive CSS, and modern web layouts securely in your browser.</p>
    <button class="btn" onclick="alert('Hello from sandboxed iframe!')">Click Interactive Button</button>
  </div>
</body>
</html>
`;

function HtmlPreviewWorkspace() {
  const [code, setCode] = useState(SAMPLE_PREVIEW_HTML);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const viewportWidth = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }[viewport];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Viewport:</span>
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewport === "desktop" ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-pale"
            }`}
          >
            <Monitor size={14} /> Desktop (100%)
          </button>
          <button
            type="button"
            onClick={() => setViewport("tablet")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewport === "tablet" ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-pale"
            }`}
          >
            <Tablet size={14} /> Tablet (768px)
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewport === "mobile" ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-pale"
            }`}
          >
            <Smartphone size={14} /> Mobile (375px)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => copyToClipboard(code, setCopied)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Code"}
          </button>
          <button
            type="button"
            onClick={() => downloadFile(code, "preview.html", "text/html")}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            <Download size={14} /> Download HTML
          </button>
          <button
            type="button"
            onClick={() => setCode(SAMPLE_PREVIEW_HTML)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Code Editor */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">HTML & CSS Code Editor</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write or paste your HTML and CSS code here..."
            className={`${inputClass} min-h-[500px] resize-y`}
            spellCheck={false}
          />
        </div>

        {/* Live Sandboxed Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Live Sandboxed Preview
            </label>
            <span className="text-[11px] text-muted">Sandboxed: Scripts permitted, origin isolated</span>
          </div>

          <div className="flex justify-center rounded-2xl border border-line bg-slate-100 p-3 min-h-[500px]">
            <div
              style={{ width: viewportWidth }}
              className="transition-all duration-300 rounded-xl overflow-hidden border border-line bg-white shadow-card flex flex-col"
            >
              <iframe
                title="HTML Live Sandbox"
                srcDoc={code}
                sandbox="allow-scripts"
                className="w-full h-full min-h-[480px] border-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #72 — YAML to JSON Converter
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_YAML = `# ToolModeOn Platform Configuration
server:
  host: "0.0.0.0"
  port: 8080
  ssl:
    enabled: true
    certificate: "/etc/ssl/cert.pem"

database:
  driver: "postgres"
  pool_size: 20
  timeout_seconds: 30

features:
  - "client_side_processing"
  - "instant_preview"
  - "zero_server_upload"
`;

function YamlToJsonWorkspace() {
  const [input, setInput] = useState(SAMPLE_YAML);
  const [indent, setIndent] = useState<number | string>(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<{ message: string; line?: number; column?: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const parsed = yaml.load(input);
      setError(null);
      if (indent === "minify") {
        setOutput(JSON.stringify(parsed));
      } else {
        setOutput(JSON.stringify(parsed, null, Number(indent)));
      }
    } catch (err: any) {
      const line = err?.mark?.line !== undefined ? err.mark.line + 1 : undefined;
      const column = err?.mark?.column !== undefined ? err.mark.column + 1 : undefined;
      setError({ message: err?.reason || err?.message || "Invalid YAML", line, column });
      setOutput("");
    }
  }, [input, indent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Indent:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value === "minify" ? "minify" : Number(e.target.value))}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
            <option value="minify">Minify JSON</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setInput(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = "";
            }}
            accept=".yaml,.yml,text/yaml,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload YAML
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_YAML)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>
            YAML Syntax Error: {error.message}
            {error.line !== undefined && ` (Line ${error.line}, Column ${error.column})`}
          </span>
        </div>
      ) : input.trim() ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Valid YAML converted successfully to JSON.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input YAML</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste YAML here..."
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Converted JSON Output</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "data.json", "application/json")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .json
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="JSON output will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #73 — JSON to YAML Converter
// ─────────────────────────────────────────────────────────────────────────────
function JsonToYamlWorkspace() {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [indent, setIndent] = useState(2);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setError(null);
      const dumped = yaml.dump(parsed, { indent: indent, lineWidth: -1, noRefs: true });
      setOutput(dumped);
    } catch (err: any) {
      setError(err?.message || "Invalid JSON syntax");
      setOutput("");
    }
  }, [input, indent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Indent:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setInput(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = "";
            }}
            accept=".json,application/json,text/plain"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <FileUp size={14} /> Upload JSON
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_JSON)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>Cannot convert invalid JSON: {error}</span>
        </div>
      ) : input.trim() ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          JSON successfully converted to clean YAML.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON to convert into YAML..."
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Converted YAML Output</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "data.yaml", "text/yaml")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .yaml
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="YAML output will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #74 — SQL Formatter & Validator
// ─────────────────────────────────────────────────────────────────────────────
function validateSqlSyntax(sql: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const trimmed = sql.trim();
  if (!trimmed) return { valid: true, issues: [] };

  // 1. Balance check: parentheses
  let parenDepth = 0;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "(") parenDepth++;
    else if (trimmed[i] === ")") parenDepth--;
    if (parenDepth < 0) {
      issues.push("Unmatched closing parenthesis ')' found.");
      break;
    }
  }
  if (parenDepth > 0) {
    issues.push(`Unclosed opening parenthesis '(' (${parenDepth} unmatched).`);
  }

  // 2. Balance check: single quotes
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    const prev = i > 0 ? trimmed[i - 1] : "";
    if (ch === "'" && prev !== "\\" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    if (ch === '"' && prev !== "\\" && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
  }
  if (inSingleQuote) issues.push("Unterminated single-quoted string literal (').");
  if (inDoubleQuote) issues.push('Unterminated double-quoted identifier/string (").');

  // 3. Clause order check
  const upper = trimmed.toUpperCase();
  const whereIdx = upper.search(/\bWHERE\b/);
  const groupByIdx = upper.search(/\bGROUP\s+BY\b/);
  const havingIdx = upper.search(/\bHAVING\b/);
  const orderByIdx = upper.search(/\bORDER\s+BY\b/);

  if (whereIdx !== -1 && groupByIdx !== -1 && whereIdx > groupByIdx) {
    issues.push("WHERE clause must appear before GROUP BY clause.");
  }
  if (havingIdx !== -1 && groupByIdx !== -1 && havingIdx < groupByIdx) {
    issues.push("HAVING clause must appear after GROUP BY clause.");
  }
  if (havingIdx !== -1 && groupByIdx === -1) {
    issues.push("HAVING clause typically requires a preceding GROUP BY clause.");
  }
  if (orderByIdx !== -1 && whereIdx !== -1 && orderByIdx < whereIdx) {
    issues.push("ORDER BY clause must appear after WHERE clause.");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function SqlFormatterValidatorWorkspace() {
  const [input, setInput] = useState(SAMPLE_SQL);
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [tabWidth, setTabWidth] = useState(2);
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower" | "preserve">("upper");
  const [output, setOutput] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => validateSqlSyntax(input), [input]);

  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setFormatError(null);
      return;
    }
    try {
      const formatted = formatSql(input, {
        language: dialect,
        tabWidth: tabWidth,
        keywordCase: keywordCase,
      });
      setOutput(formatted);
      setFormatError(null);
    } catch (err: any) {
      setFormatError(err?.message || "Failed to format SQL statement");
      setOutput("");
    }
  }, [input, dialect, tabWidth, keywordCase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">Dialect:</label>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlDialect)}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value="sql">Standard SQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="transactsql">T-SQL (SQL Server)</option>
            <option value="plsql">PL/SQL (Oracle)</option>
            <option value="bigquery">Google BigQuery</option>
          </select>

          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Keywords:</label>
          <select
            value={keywordCase}
            onChange={(e) => setKeywordCase(e.target.value as any)}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="preserve">Preserve</option>
          </select>

          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-2">Indent:</label>
          <select
            value={tabWidth}
            onChange={(e) => setTabWidth(Number(e.target.value))}
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(SAMPLE_SQL)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Validation Banner */}
      {validation.issues.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>Syntax Structure Warnings Detected:</span>
          </div>
          <ul className="list-disc list-inside text-xs pl-5 space-y-0.5 text-amber-800">
            {validation.issues.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : input.trim() ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600" />
          Syntax check passed: Balanced delimiters and valid clause ordering.
        </div>
      ) : null}

      {/* Required Disclaimer Notice */}
      <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
        <span className="font-bold text-ink">Important Notice: </span>
        Client-side syntax validation checks SQL statement structure, keyword grammar, and delimiter balance. It does
        not connect to a database to verify table existence, column schemas, data types, or runtime permissions.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input SQL Statement</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter raw SQL statement..."
            className={`${inputClass} min-h-[440px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Formatted & Validated SQL</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!output}
                onClick={() => copyToClipboard(output, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale disabled:opacity-50"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                disabled={!output}
                onClick={() => downloadFile(output, "query.sql", "application/sql")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Download size={13} /> Download .sql
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Formatted SQL output will appear here..."
            className={`${inputClass} min-h-[440px] resize-y bg-pale/30`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #75 — Diff Checker for Code
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_DIFF_ORIGINAL = `function processPayment(user, cart) {
  if (!user.isLoggedIn) {
    throw new Error("Authentication required");
  }

  let total = 0;
  for (let i = 0; i < cart.items.length; i++) {
    total += cart.items[i].price;
  }

  console.log("Processing payment for user:", user.id, "Amount:", total);
  return stripe.charges.create({ amount: total, customer: user.stripeId });
}
`;

const SAMPLE_DIFF_MODIFIED = `async function processPayment(user, cart, currency = "USD") {
  if (!user?.isLoggedIn) {
    throw new Error("Authentication required: Please sign in to checkout.");
  }

  // Calculate sum cleanly using array reduce
  const total = cart.items.reduce((sum, item) => sum + item.price, 0);

  if (total <= 0) {
    throw new Error("Cart is empty or zero total");
  }

  console.log(\`Processing payment (\${currency}) for user:\`, user.id, "Amount:", total);
  return stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency,
    customer: user.stripeId,
  });
}
`;

function CodeDiffCheckerWorkspace() {
  const [original, setOriginal] = useState(SAMPLE_DIFF_ORIGINAL);
  const [modified, setModified] = useState(SAMPLE_DIFF_MODIFIED);
  const [diffMode, setDiffMode] = useState<"lines" | "words">("lines");
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const { changes, additions, deletions } = useMemo(() => {
    let diffResult: diff.Change[];
    if (diffMode === "words") {
      diffResult = diff.diffWords(original, modified);
    } else {
      diffResult = diff.diffLines(original, modified, { ignoreWhitespace });
    }

    let adds = 0;
    let dels = 0;
    for (const c of diffResult) {
      if (c.added) adds += c.count || 1;
      if (c.removed) dels += c.count || 1;
    }

    return { changes: diffResult, additions: adds, deletions: dels };
  }, [original, modified, diffMode, ignoreWhitespace]);

  const patchText = useMemo(() => {
    return diff.createPatch("file.txt", original, modified);
  }, [original, modified]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-line bg-pale/50 p-1">
            <button
              type="button"
              onClick={() => setDiffMode("lines")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                diffMode === "lines" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Line-by-Line
            </button>
            <button
              type="button"
              onClick={() => setDiffMode("words")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                diffMode === "words" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Word-by-Word
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-line bg-pale/50 p-1">
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                viewMode === "unified" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Unified View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                viewMode === "split" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Split View
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="rounded text-brand"
            />
            Ignore whitespace
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const temp = original;
              setOriginal(modified);
              setModified(temp);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            <ArrowLeftRight size={14} /> Swap
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginal(SAMPLE_DIFF_ORIGINAL);
              setModified(SAMPLE_DIFF_MODIFIED);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginal("");
              setModified("");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
            +{additions} Additions
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
            -{deletions} Deletions
          </span>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(patchText, setCopied)}
          className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale shadow-sm"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy Diff Patch"}
        </button>
      </div>

      {/* Inputs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Original Code (Left)</label>
            <input
              type="file"
              ref={fileInputRef1}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setOriginal(ev.target?.result as string);
                reader.readAsText(file);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef1.current?.click()}
              className="text-xs text-brand font-semibold hover:underline"
            >
              Upload original
            </button>
          </div>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Paste original code..."
            className={`${inputClass} min-h-[220px] resize-y`}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Modified Code (Right)</label>
            <input
              type="file"
              ref={fileInputRef2}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setModified(ev.target?.result as string);
                reader.readAsText(file);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef2.current?.click()}
              className="text-xs text-brand font-semibold hover:underline"
            >
              Upload modified
            </button>
          </div>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder="Paste modified code..."
            className={`${inputClass} min-h-[220px] resize-y`}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Diff Output Visualization */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">
          Difference Comparison ({viewMode === "unified" ? "Unified" : "Split"} View)
        </h3>

        {viewMode === "unified" ? (
          <div className="rounded-xl border border-line bg-slate-950 p-4 font-mono text-xs leading-relaxed overflow-x-auto text-slate-100 max-h-[560px]">
            {changes.map((part, index) => {
              if (part.added) {
                return (
                  <div key={index} className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded whitespace-pre">
                    + {part.value}
                  </div>
                );
              }
              if (part.removed) {
                return (
                  <div key={index} className="bg-red-950/80 text-red-300 px-2 py-0.5 rounded whitespace-pre">
                    - {part.value}
                  </div>
                );
              }
              return (
                <div key={index} className="text-slate-400 px-2 py-0.5 whitespace-pre">
                  {part.value}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-slate-950 p-4 font-mono text-xs leading-relaxed overflow-x-auto text-slate-100 max-h-[560px]">
              <div className="text-[11px] font-bold text-red-400 mb-2 border-b border-slate-800 pb-1">
                Original Deletions / Baseline
              </div>
              {changes.map((part, idx) => {
                if (part.removed) {
                  return (
                    <div key={idx} className="bg-red-950/80 text-red-300 px-2 py-0.5 rounded whitespace-pre">
                      - {part.value}
                    </div>
                  );
                }
                if (!part.added) {
                  return (
                    <div key={idx} className="text-slate-400 px-2 py-0.5 whitespace-pre">
                      {part.value}
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="rounded-xl border border-line bg-slate-950 p-4 font-mono text-xs leading-relaxed overflow-x-auto text-slate-100 max-h-[560px]">
              <div className="text-[11px] font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">
                Modified Additions / Current
              </div>
              {changes.map((part, idx) => {
                if (part.added) {
                  return (
                    <div key={idx} className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded whitespace-pre">
                      + {part.value}
                    </div>
                  );
                }
                if (!part.removed) {
                  return (
                    <div key={idx} className="text-slate-400 px-2 py-0.5 whitespace-pre">
                      {part.value}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
