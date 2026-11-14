"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BarChart2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileJson,
  FileSearch,
  FileText,
  FileUp,
  Globe,
  HelpCircle,
  Languages,
  Layers,
  Link,
  Link2,
  ListFilter,
  Monitor,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  SearchCheck,
  Share2,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Twitter,
  Unlink,
  X,
} from "lucide-react";
import type { Tool } from "../lib/tools";

const inputClass =
  "w-full rounded-xl border border-line bg-pale/50 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 font-sans";

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

export function SeoToolWorkspace({
  tool,
}: {
  tool: Pick<Tool, "slug" | "name" | "description" | "category" | "pro">;
}) {
  if (tool.slug === "meta-tags-analyzer") return <MetaTagsAnalyzerWorkspace />;
  if (tool.slug === "open-graph-preview") return <OpenGraphPreviewWorkspace />;
  if (tool.slug === "twitter-card-preview") return <TwitterCardPreviewWorkspace />;
  if (tool.slug === "schema-markup-generator") return <SchemaMarkupGeneratorWorkspace />;
  if (tool.slug === "schema-markup-validator") return <SchemaMarkupValidatorWorkspace />;
  if (tool.slug === "canonical-url-checker") return <CanonicalUrlCheckerWorkspace />;
  if (tool.slug === "hreflang-generator") return <HreflangGeneratorWorkspace />;
  if (tool.slug === "http-status-checker") return <HttpStatusCheckerWorkspace />;
  if (tool.slug === "redirect-checker") return <RedirectCheckerWorkspace />;
  if (tool.slug === "url-slug-generator") return <UrlSlugGeneratorWorkspace />;
  if (tool.slug === "keyword-research-organizer") return <KeywordOrganizerWorkspace />;
  if (tool.slug === "serp-snippet-preview") return <SerpSnippetPreviewWorkspace />;
  if (tool.slug === "utm-link-builder") return <UtmLinkBuilderWorkspace />;
  if (tool.slug === "broken-link-checker") return <BrokenLinkCheckerWorkspace />;
  if (tool.slug === "website-word-counter") return <WebsiteWordCounterWorkspace />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #76 — Meta Tags Analyzer
// ─────────────────────────────────────────────────────────────────────────────
function MetaTagsAnalyzerWorkspace() {
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "og" | "twitter" | "technical">("overview");

  const analyzeUrl = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `HTTP Error ${res.status}: Failed to inspect website.`);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to inspection service.");
    } finally {
      setLoading(false);
    }
  };

  const meta = data?.metadata;

  return (
    <div className="space-y-6">
      {/* URL Input Form */}
      <form onSubmit={analyzeUrl} className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-muted">
          Website URL to Analyze
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? "Analyzing..." : "Analyze Meta Tags"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Secure client inspection: Server-side request resolves DNS with SSRF protection, extracts metadata, and rejects private networks.
        </p>
      </form>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Analysis Error</p>
            <p className="font-normal mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {data && meta && (
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-soft space-y-6">
          {/* Header Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Inspected Destination</span>
              <p className="font-mono text-sm font-bold text-ink break-all">{data.finalUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                HTTP {data.statusCode} {data.statusText}
              </span>
              <span className="rounded-full bg-pale px-3 py-1 text-xs font-bold text-muted">
                {data.totalTimeMs} ms
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(data, null, 2), setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy Report"}
              </button>
              <button
                type="button"
                onClick={() => downloadFile(JSON.stringify(data, null, 2), "meta-analysis.json", "application/json")}
                className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
              >
                <Download size={13} /> Download
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-line gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === "overview" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              SEO Essentials
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("og")}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === "og" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Open Graph ({Object.keys(meta.og).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("twitter")}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === "twitter" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Twitter / X ({Object.keys(meta.twitter).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("technical")}
              className={`pb-2 px-3 border-b-2 transition ${
                activeTab === "technical" ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Technical & Robots
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Title Tag */}
              <div className="rounded-2xl border border-line bg-pale/30 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Page Title (&lt;title&gt;)</span>
                  <span className={`text-xs font-bold ${meta.title.length >= 50 && meta.title.length <= 60 ? "text-emerald-600" : "text-amber-600"}`}>
                    {meta.title.length} characters {meta.title.length >= 50 && meta.title.length <= 60 ? "(Optimal: 50-60)" : "(Recommended: 50-60)"}
                  </span>
                </div>
                <p className="font-semibold text-ink text-sm">{meta.title || <span className="text-red-500 font-bold">Missing title tag</span>}</p>
              </div>

              {/* Meta Description */}
              <div className="rounded-2xl border border-line bg-pale/30 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Meta Description</span>
                  <span className={`text-xs font-bold ${meta.description.length >= 140 && meta.description.length <= 160 ? "text-emerald-600" : "text-amber-600"}`}>
                    {meta.description.length} characters {meta.description.length >= 140 && meta.description.length <= 160 ? "(Optimal: 140-160)" : "(Recommended: 140-160)"}
                  </span>
                </div>
                <p className="text-sm text-ink">{meta.description || <span className="text-red-500 font-bold">Missing meta description tag</span>}</p>
              </div>

              {/* Canonical URL */}
              <div className="rounded-2xl border border-line bg-pale/30 p-4 space-y-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Canonical URL</span>
                <p className="font-mono text-xs text-ink">{meta.canonical || <span className="text-amber-600 font-bold">No canonical link tag found</span>}</p>
              </div>

              {/* Diagnostic Checklist */}
              <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted">SEO Observations & Diagnostics</span>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2">
                    {meta.title ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-red-600" />}
                    <span>{meta.title ? "Title tag present" : "Missing page title"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {meta.description ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-red-600" />}
                    <span>{meta.description ? "Meta description present" : "Missing meta description"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {meta.canonical ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
                    <span>{meta.canonical ? "Canonical tag configured" : "No canonical tag found"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {meta.viewport ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-red-600" />}
                    <span>{meta.viewport ? "Mobile viewport declared" : "Missing viewport tag"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Open Graph */}
          {activeTab === "og" && (
            <div className="space-y-4">
              {Object.keys(meta.og).length === 0 ? (
                <p className="text-xs text-muted">No Open Graph (`og:*`) tags were detected on this page.</p>
              ) : (
                <div className="divide-y divide-line rounded-2xl border border-line bg-pale/20">
                  {Object.entries(meta.og).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 text-xs gap-2">
                      <span className="font-mono font-bold text-brand">og:{key}</span>
                      <span className="font-mono text-ink text-right break-all">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Twitter Card */}
          {activeTab === "twitter" && (
            <div className="space-y-4">
              {Object.keys(meta.twitter).length === 0 ? (
                <p className="text-xs text-muted">No Twitter (`twitter:*`) metadata tags were detected on this page.</p>
              ) : (
                <div className="divide-y divide-line rounded-2xl border border-line bg-pale/20">
                  {Object.entries(meta.twitter).map(([key, val]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 text-xs gap-2">
                      <span className="font-mono font-bold text-sky-600">twitter:{key}</span>
                      <span className="font-mono text-ink text-right break-all">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Technical & Robots */}
          {activeTab === "technical" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-line bg-pale/30 p-3">
                  <span className="font-bold text-muted uppercase">Meta Robots:</span>
                  <p className="font-mono font-semibold mt-1">{meta.robots || "Not specified (defaults to index, follow)"}</p>
                </div>
                <div className="rounded-xl border border-line bg-pale/30 p-3">
                  <span className="font-bold text-muted uppercase">HTML Language:</span>
                  <p className="font-mono font-semibold mt-1">{meta.lang || "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-line bg-pale/30 p-3">
                  <span className="font-bold text-muted uppercase">Charset Encoding:</span>
                  <p className="font-mono font-semibold mt-1">{meta.charset || "UTF-8 (inferred)"}</p>
                </div>
                <div className="rounded-xl border border-line bg-pale/30 p-3">
                  <span className="font-bold text-muted uppercase">Viewport:</span>
                  <p className="font-mono font-semibold mt-1">{meta.viewport || "Not declared"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Important Technical Disclaimer */}
          <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
            <span className="font-bold text-ink">Technical Observation Note: </span>
            This tool reports technical observations and diagnostic checks based on accessible HTML markup. Metadata compliance supports search engine understanding but does not guarantee search rankings.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #77 — Open Graph Preview
// ─────────────────────────────────────────────────────────────────────────────
function OpenGraphPreviewWorkspace() {
  const [urlInput, setUrlInput] = useState("");
  const [ogTitle, setOgTitle] = useState("ToolModeOn — Everyday Tools. One Platform.");
  const [ogDescription, setOgDescription] = useState("One focused online utility for every small task that keeps your workday moving. PDF, Image, Code, and SEO tools.");
  const [ogImage, setOgImage] = useState("https://toolmodeon.online/og-image.png");
  const [ogUrl, setOgUrl] = useState("https://toolmodeon.online");
  const [ogType, setOgType] = useState("website");
  const [ogSiteName, setOgSiteName] = useState("ToolModeOn");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchFromUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(urlInput.trim())}`);
      const json = await res.json();
      if (json.success && json.metadata) {
        const og = json.metadata.og;
        if (og.title || json.metadata.title) setOgTitle(og.title || json.metadata.title);
        if (og.description || json.metadata.description) setOgDescription(og.description || json.metadata.description);
        if (og.image) setOgImage(og.image);
        if (og.url || json.finalUrl) setOgUrl(og.url || json.finalUrl);
        if (og.type) setOgType(og.type);
        if (og.site_name) setOgSiteName(og.site_name);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const generatedTags = useMemo(() => {
    return [
      `<!-- Open Graph / Facebook -->`,
      `<meta property="og:type" content="${ogType}" />`,
      `<meta property="og:url" content="${ogUrl}" />`,
      `<meta property="og:title" content="${ogTitle}" />`,
      `<meta property="og:description" content="${ogDescription}" />`,
      ogImage ? `<meta property="og:image" content="${ogImage}" />` : null,
      ogSiteName ? `<meta property="og:site_name" content="${ogSiteName}" />` : null,
    ].filter(Boolean).join("\n");
  }, [ogType, ogUrl, ogTitle, ogDescription, ogImage, ogSiteName]);

  const domain = useMemo(() => {
    try {
      return new URL(ogUrl).hostname.toUpperCase();
    } catch {
      return "TOOLMODEON.ONLINE";
    }
  }, [ogUrl]);

  return (
    <div className="space-y-6">
      {/* Fetch from URL bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Fetch from URL (e.g. https://example.com)"
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={fetchFromUrl}
          disabled={loading || !urlInput.trim()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? "Fetching..." : "Auto-Fill"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Form */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Open Graph Metadata Editor</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">og:title</label>
            <input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">og:description</label>
            <textarea
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              className={`${inputClass} min-h-[90px] resize-y`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">og:image (URL)</label>
            <input value={ogImage} onChange={(e) => setOgImage(e.target.value)} className={inputClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">og:url</label>
              <input value={ogUrl} onChange={(e) => setOgUrl(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">og:type</label>
              <select value={ogType} onChange={(e) => setOgType(e.target.value)} className={inputClass}>
                <option value="website">website</option>
                <option value="article">article</option>
                <option value="product">product</option>
                <option value="book">book</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">og:site_name</label>
            <input value={ogSiteName} onChange={(e) => setOgSiteName(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Live Social Sharing Card Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Social Feed Card Preview</h3>
            <span className="rounded-full bg-pale px-2.5 py-0.5 text-[11px] font-bold text-muted">Simulation</span>
          </div>

          <div className="rounded-2xl border border-line bg-slate-100 p-4 shadow-sm flex justify-center">
            <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              {ogImage ? (
                <div className="h-52 w-full bg-slate-200 overflow-hidden flex items-center justify-center">
                  <img
                    src={ogImage}
                    alt="Open Graph preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="h-44 w-full bg-slate-100 flex items-center justify-center text-xs text-muted font-bold">
                  No Image URL Specified
                </div>
              )}
              <div className="p-4 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{domain}</p>
                <h4 className="font-extrabold text-sm text-ink line-clamp-2 leading-snug">{ogTitle}</h4>
                <p className="text-xs text-muted line-clamp-2 leading-relaxed">{ogDescription}</p>
              </div>
            </div>
          </div>

          {/* Generated Code */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted">HTML Meta Tags</span>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedTags, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy Tags"}
              </button>
            </div>
            <pre className="rounded-xl bg-pale/50 p-3 font-mono text-xs overflow-x-auto text-ink">
              {generatedTags}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #78 — Twitter/X Card Preview
// ─────────────────────────────────────────────────────────────────────────────
function TwitterCardPreviewWorkspace() {
  const [urlInput, setUrlInput] = useState("");
  const [cardType, setCardType] = useState<"summary_large_image" | "summary">("summary_large_image");
  const [title, setTitle] = useState("ToolModeOn — Everyday Tools. One Platform.");
  const [description, setDescription] = useState("The all-in-one productivity platform with PDF, image, developer, and SEO tools.");
  const [image, setImage] = useState("https://toolmodeon.online/og-image.png");
  const [site, setSite] = useState("@ToolModeOn");
  const [creator, setCreator] = useState("@ToolModeOn");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchFromUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(urlInput.trim())}`);
      const json = await res.json();
      if (json.success && json.metadata) {
        const tw = json.metadata.twitter;
        const og = json.metadata.og;
        if (tw.card === "summary" || tw.card === "summary_large_image") setCardType(tw.card);
        if (tw.title || og.title || json.metadata.title) setTitle(tw.title || og.title || json.metadata.title);
        if (tw.description || og.description || json.metadata.description) setDescription(tw.description || og.description || json.metadata.description);
        if (tw.image || og.image) setImage(tw.image || og.image);
        if (tw.site) setSite(tw.site);
        if (tw.creator) setCreator(tw.creator);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const generatedTags = useMemo(() => {
    return [
      `<!-- Twitter / X Card -->`,
      `<meta name="twitter:card" content="${cardType}" />`,
      site ? `<meta name="twitter:site" content="${site}" />` : null,
      creator ? `<meta name="twitter:creator" content="${creator}" />` : null,
      `<meta name="twitter:title" content="${title}" />`,
      `<meta name="twitter:description" content="${description}" />`,
      image ? `<meta name="twitter:image" content="${image}" />` : null,
    ].filter(Boolean).join("\n");
  }, [cardType, site, creator, title, description, image]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Fetch from URL (e.g. https://example.com)"
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={fetchFromUrl}
          disabled={loading || !urlInput.trim()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? "Fetching..." : "Auto-Fill"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Twitter/X Metadata Settings</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Card Style</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCardType("summary_large_image")}
                className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                  cardType === "summary_large_image" ? "border-brand bg-brand/10 text-brand" : "border-line bg-white text-ink"
                }`}
              >
                Large Image (16:9)
              </button>
              <button
                type="button"
                onClick={() => setCardType("summary")}
                className={`rounded-xl border p-2.5 text-xs font-bold transition ${
                  cardType === "summary" ? "border-brand bg-brand/10 text-brand" : "border-line bg-white text-ink"
                }`}
              >
                Small Thumbnail (1:1)
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">twitter:title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">twitter:description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} min-h-[90px] resize-y`} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">twitter:image (URL)</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">twitter:site</label>
              <input value={site} onChange={(e) => setSite(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">twitter:creator</label>
              <input value={creator} onChange={(e) => setCreator(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Live Simulation Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Twitter/X Timeline Simulation</h3>
            <span className="rounded-full bg-pale px-2.5 py-0.5 text-[11px] font-bold text-muted">Simulation</span>
          </div>

          <div className="rounded-2xl border border-line bg-slate-900 p-5 shadow-sm flex justify-center text-slate-100">
            {cardType === "summary_large_image" ? (
              <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-700 bg-black">
                {image && (
                  <div className="h-52 w-full bg-slate-800 overflow-hidden flex items-center justify-center">
                    <img src={image} alt="Card preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-3.5 space-y-1">
                  <p className="text-[11px] text-slate-400 font-mono">toolmodeon.online</p>
                  <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">{title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{description}</p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-700 bg-black flex p-3 gap-3">
                {image && (
                  <div className="h-24 w-24 rounded-xl bg-slate-800 overflow-hidden shrink-0">
                    <img src={image} alt="Thumbnail" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="space-y-1 overflow-hidden">
                  <p className="text-[11px] text-slate-400 font-mono">toolmodeon.online</p>
                  <h4 className="font-bold text-sm text-white line-clamp-2">{title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{description}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted">HTML Tags</span>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedTags, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy Tags"}
              </button>
            </div>
            <pre className="rounded-xl bg-pale/50 p-3 font-mono text-xs overflow-x-auto text-ink">
              {generatedTags}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #79 — Schema Markup Generator
// ─────────────────────────────────────────────────────────────────────────────
type SchemaType =
  | "Organization"
  | "LocalBusiness"
  | "Person"
  | "Product"
  | "Article"
  | "BlogPosting"
  | "Event"
  | "Recipe"
  | "Course"
  | "JobPosting"
  | "WebSite"
  | "BreadcrumbList"
  | "FAQPage";

function SchemaMarkupGeneratorWorkspace() {
  const [schemaType, setSchemaType] = useState<SchemaType>("Organization");
  const [copied, setCopied] = useState(false);

  // Form states
  const [name, setName] = useState("ToolModeOn");
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [logo, setLogo] = useState("https://toolmodeon.online/logo.png");
  const [description, setDescription] = useState("Everyday online tools for creators, developers, and professionals.");
  const [image, setImage] = useState("https://toolmodeon.online/og-image.png");
  const [author, setAuthor] = useState("ToolModeOn Team");
  const [price, setPrice] = useState("29.99");
  const [currency, setCurrency] = useState("USD");
  const [rating, setRating] = useState("4.9");
  const [faqItems, setFaqItems] = useState([
    { q: "Is ToolModeOn free to use?", a: "Yes, everyday tools are available completely free without registration." },
    { q: "Are files uploaded to external servers?", a: "No, sensitive image, PDF, and code tools execute locally in your browser." },
  ]);

  const generatedSchema = useMemo(() => {
    const base: any = {
      "@context": "https://schema.org",
      "@type": schemaType,
    };

    switch (schemaType) {
      case "Organization":
        base.name = name;
        base.url = url;
        base.logo = logo;
        base.sameAs = ["https://twitter.com/ToolModeOn", "https://github.com/ToolModeOn"];
        break;
      case "LocalBusiness":
        base.name = name;
        base.image = image;
        base.telephone = "+1-555-0199";
        base.priceRange = "$$";
        base.address = {
          "@type": "PostalAddress",
          streetAddress: "100 Tech Boulevard",
          addressLocality: "San Francisco",
          addressRegion: "CA",
          postalCode: "94105",
          addressCountry: "US",
        };
        break;
      case "Person":
        base.name = name;
        base.url = url;
        base.jobTitle = "Software Architect";
        base.sameAs = ["https://twitter.com/example", "https://linkedin.com/in/example"];
        break;
      case "Product":
        base.name = name;
        base.image = image;
        base.description = description;
        base.offers = {
          "@type": "Offer",
          price: price,
          priceCurrency: currency,
          availability: "https://schema.org/InStock",
        };
        base.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: rating,
          reviewCount: "89",
        };
        break;
      case "Article":
      case "BlogPosting":
        base.headline = name;
        base.image = image;
        base.author = { "@type": "Person", name: author };
        base.publisher = { "@type": "Organization", name: "ToolModeOn", logo: { "@type": "ImageObject", url: logo } };
        base.datePublished = new Date().toISOString().slice(0, 10);
        base.description = description;
        break;
      case "FAQPage":
        base.mainEntity = faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        }));
        break;
      case "WebSite":
        base.name = name;
        base.url = url;
        base.potentialAction = {
          "@type": "SearchAction",
          target: `${url}/tools?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        };
        break;
      case "BreadcrumbList":
        base.itemListElement = [
          { "@type": "ListItem", position: 1, name: "Home", item: url },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${url}/tools` },
          { "@type": "ListItem", position: 3, name: name, item: `${url}/tools/${name.toLowerCase().replace(/\s+/g, "-")}` },
        ];
        break;
      default:
        base.name = name;
        base.description = description;
        break;
    }

    return JSON.stringify(base, null, 2);
  }, [schemaType, name, url, logo, description, image, author, price, currency, rating, faqItems]);

  const scriptTagCode = `<script type="application/ld+json">\n${generatedSchema}\n</script>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Schema Configuration */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Schema.org Generator</h3>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Select Schema Type</label>
            <select
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value as SchemaType)}
              className={inputClass}
            >
              <option value="Organization">Organization</option>
              <option value="LocalBusiness">LocalBusiness</option>
              <option value="Person">Person</option>
              <option value="Product">Product</option>
              <option value="Article">Article</option>
              <option value="BlogPosting">BlogPosting</option>
              <option value="FAQPage">FAQPage</option>
              <option value="WebSite">WebSite</option>
              <option value="BreadcrumbList">BreadcrumbList</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Name / Headline</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          {schemaType === "Product" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-muted uppercase">Price</label>
                <input value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase">Currency</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase">Rating (1-5)</label>
                <input value={rating} onChange={(e) => setRating(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Image URL</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Generated JSON-LD</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(scriptTagCode, setCopied)}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale shadow-sm"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy <script>"}
              </button>
              <button
                type="button"
                onClick={() => downloadFile(generatedSchema, "schema.json", "application/json")}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 shadow-sm"
              >
                <Download size={13} /> Download JSON
              </button>
            </div>
          </div>

          <pre className="rounded-2xl border border-line bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 overflow-x-auto min-h-[380px] max-h-[500px]">
            {scriptTagCode}
          </pre>

          <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
            <span className="font-bold text-ink">Installation Guide: </span>
            Paste this snippet inside the &lt;head&gt; or before the closing &lt;/body&gt; tag of your page. Search engine rich results eligibility depends on platform policies and complete crawl guidelines.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #80 — Schema Markup Validator
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_VALIDATOR_JSON = `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Everyday Tools All-in-One Suite",
  "image": "https://toolmodeon.online/og-image.png",
  "description": "Comprehensive suite of 75+ productivity utilities.",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}`;

function SchemaMarkupValidatorWorkspace() {
  const [input, setInput] = useState(SAMPLE_VALIDATOR_JSON);
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Remove surrounding <script> tags if user pasted full HTML snippet
    const sanitized = trimmed
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(sanitized);
    } catch (err: any) {
      return {
        validSyntax: false,
        syntaxError: err?.message || "Invalid JSON syntax",
        contextValid: false,
        type: null,
        warnings: [],
      };
    }

    const context = parsed["@context"];
    const hasValidContext =
      typeof context === "string" &&
      (context.includes("schema.org") || context === "https://schema.org" || context === "http://schema.org");

    const schemaType = parsed["@type"];
    const warnings: string[] = [];

    if (!hasValidContext) {
      warnings.push('Missing or invalid @context property (expected "https://schema.org").');
    }

    if (!schemaType) {
      warnings.push('Missing @type property declaring the Schema.org entity.');
    }

    // Specific property warnings
    if (schemaType === "Product") {
      if (!parsed.name) warnings.push('Product is missing recommended property: "name".');
      if (!parsed.image) warnings.push('Product is missing recommended property: "image".');
      if (!parsed.offers) warnings.push('Product is missing recommended property: "offers".');
    } else if (schemaType === "Article" || schemaType === "BlogPosting") {
      if (!parsed.headline) warnings.push('Article is missing recommended property: "headline".');
      if (!parsed.author) warnings.push('Article is missing recommended property: "author".');
      if (!parsed.datePublished) warnings.push('Article is missing recommended property: "datePublished".');
    }

    return {
      validSyntax: true,
      contextValid: hasValidContext,
      type: schemaType,
      warnings,
      parsed,
    };
  }, [input]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">JSON-LD Schema Validator</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInput(SAMPLE_VALIDATOR_JSON)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Sample Product
          </button>
          <button
            type="button"
            onClick={() => setInput("")}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            Clear
          </button>
        </div>
      </div>

      {validation && (
        <div>
          {!validation.validSyntax ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Malformed JSON Syntax</p>
                <p className="font-normal mt-0.5">{validation.syntaxError}</p>
              </div>
            </div>
          ) : validation.warnings.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>JSON syntax is valid, but structural warnings were detected:</span>
              </div>
              <ul className="list-disc list-inside pl-5 space-y-0.5 font-normal">
                {validation.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Valid Schema.org structured data ({validation.type || "Schema"})! All recommended fields present.</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Paste JSON-LD or Script Tag</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
          className={`${inputClass} min-h-[360px] font-mono resize-y`}
          spellCheck={false}
        />
      </div>

      <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
        <span className="font-bold text-ink">Validation Scope: </span>
        This validator evaluates JSON syntax and Schema.org vocabulary specifications. It does not replace live search engine crawler tests (such as Google Rich Results Test), which test search-specific eligibility policies.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #81 — Canonical URL Checker
// ─────────────────────────────────────────────────────────────────────────────
function CanonicalUrlCheckerWorkspace() {
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkCanonical = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to inspect canonical URL.");
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to inspection endpoint.");
    } finally {
      setLoading(false);
    }
  };

  const meta = data?.metadata;
  const canonical = meta?.canonical;
  const canonicalTags = meta?.canonicalTags || [];
  const requestedUrl = data?.originalUrl;
  const isMatch = canonical && requestedUrl && canonical.toLowerCase() === requestedUrl.toLowerCase();
  const isRelative = canonical && !canonical.startsWith("http://") && !canonical.startsWith("https://");

  return (
    <div className="space-y-6">
      <form onSubmit={checkCanonical} className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-muted">
          Page URL to Inspect
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Link2 size={16} />}
            {loading ? "Checking..." : "Inspect Canonical"}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && meta && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Canonical Analysis Result</span>
            {canonicalTags.length > 1 ? (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                Multiple Canonical Tags Found ({canonicalTags.length})
              </span>
            ) : canonical ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                Canonical Tag Present
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                Missing Canonical Tag
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-line bg-pale/30 p-4 space-y-1">
              <span className="font-extrabold uppercase text-muted">Requested URL</span>
              <p className="font-mono font-bold text-ink break-all">{requestedUrl}</p>
            </div>
            <div className="rounded-2xl border border-line bg-pale/30 p-4 space-y-1">
              <span className="font-extrabold uppercase text-muted">Extracted Canonical URL</span>
              <p className="font-mono font-bold text-brand break-all">{canonical || "None detected"}</p>
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2 text-xs">
            <span className="font-extrabold uppercase text-muted">Diagnostic Observations</span>
            <div className="space-y-2">
              {canonicalTags.length > 1 && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-red-800">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <span>
                    Warning: Multiple canonical link tags detected on this page. Search engines will ignore ambiguous canonical tags.
                  </span>
                </div>
              )}
              {isRelative && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-800">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Warning: The canonical URL uses a relative path. Absolute URLs (including https:// and domain) are strongly recommended.
                  </span>
                </div>
              )}
              {isMatch && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800 font-semibold">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Self-referential canonical tag matches the requested page URL.</span>
                </div>
              )}
              {canonical && !isMatch && (
                <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-blue-800">
                  <HelpCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    The canonical URL points to a different location than requested. This is normal when designating a preferred master version of syndicated or parameterized content.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #82 — Hreflang Tag Generator
// ─────────────────────────────────────────────────────────────────────────────
interface HreflangEntry {
  id: string;
  url: string;
  lang: string;
  country?: string;
  isDefault?: boolean;
}

function HreflangGeneratorWorkspace() {
  const [entries, setEntries] = useState<HreflangEntry[]>([
    { id: "1", url: "https://toolmodeon.online/en", lang: "en", country: "US" },
    { id: "2", url: "https://toolmodeon.online/es", lang: "es", country: "ES" },
    { id: "3", url: "https://toolmodeon.online/fr", lang: "fr", country: "FR" },
    { id: "4", url: "https://toolmodeon.online", lang: "x-default", isDefault: true },
  ]);
  const [copied, setCopied] = useState(false);

  const addEntry = () => {
    setEntries([
      ...entries,
      { id: Date.now().toString(), url: "https://toolmodeon.online/de", lang: "de", country: "DE" },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof HreflangEntry, val: any) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
  };

  const generatedHtml = useMemo(() => {
    return entries
      .map((e) => {
        const code = e.isDefault || e.lang === "x-default" ? "x-default" : e.country ? `${e.lang}-${e.country}` : e.lang;
        return `<link rel="alternate" hreflang="${code}" href="${e.url}" />`;
      })
      .join("\n");
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Multilingual URL Matrix</h3>
            <p className="text-xs text-muted mt-0.5">Add language and regional URL variations</p>
          </div>
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-95"
          >
            <Plus size={14} /> Add Language
          </button>
        </div>

        <div className="space-y-3">
          {entries.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-line bg-pale/30 p-3">
              <input
                type="url"
                value={item.url}
                onChange={(e) => updateEntry(item.id, "url", e.target.value)}
                placeholder="https://example.com/en"
                className="w-full sm:flex-1 rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono outline-none"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={item.lang}
                  onChange={(e) => updateEntry(item.id, "lang", e.target.value)}
                  placeholder="en (or x-default)"
                  className="w-28 rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono outline-none uppercase"
                />
                <input
                  type="text"
                  value={item.country || ""}
                  onChange={(e) => updateEntry(item.id, "country", e.target.value)}
                  placeholder="US (opt)"
                  className="w-20 rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => removeEntry(item.id)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  aria-label="Remove language"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Code */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Generated Reciprocal Hreflang Tags</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(generatedHtml, setCopied)}
              className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale shadow-sm"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy Tags"}
            </button>
            <button
              type="button"
              onClick={() => downloadFile(generatedHtml, "hreflang.html", "text/html")}
              className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 shadow-sm"
            >
              <Download size={13} /> Download
            </button>
          </div>
        </div>

        <pre className="rounded-2xl border border-line bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 overflow-x-auto">
          {generatedHtml}
        </pre>

        <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
          <span className="font-bold text-ink">Reciprocal Tag Rule: </span>
          For hreflang annotations to be valid according to Google guidelines, every alternate page in the cluster must reference all other pages in the group, including a self-referential tag to itself.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #83 — HTTP Status Code Checker
// ─────────────────────────────────────────────────────────────────────────────
function HttpStatusCheckerWorkspace() {
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `HTTP ${res.status}: Failed to reach destination.`);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err?.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const status = data?.statusCode;
  const is2xx = status >= 200 && status < 300;
  const is3xx = status >= 300 && status < 400;
  const is4xx = status >= 400 && status < 500;
  const is5xx = status >= 500;

  return (
    <div className="space-y-6">
      <form onSubmit={checkStatus} className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-muted">
          Target URL to Probe
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Response Code</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`font-mono text-3xl font-black ${is2xx ? "text-emerald-600" : is3xx ? "text-blue-600" : is4xx ? "text-amber-600" : "text-red-600"}`}>
                  {status}
                </span>
                <span className="font-bold text-lg text-ink">{data.statusText}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-pale px-3 py-1 text-xs font-bold text-ink">
                Response Time: {data.totalTimeMs} ms
              </span>
            </div>
          </div>

          {/* Response Headers */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Safe Response Headers</span>
            <div className="divide-y divide-line rounded-2xl border border-line bg-pale/20 overflow-x-auto">
              {Object.entries(data.headers || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-3 text-xs gap-3">
                  <span className="font-mono font-bold text-brand">{k}</span>
                  <span className="font-mono text-ink text-right break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #84 — Redirect Checker
// ─────────────────────────────────────────────────────────────────────────────
function RedirectCheckerWorkspace() {
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkRedirects = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to trace redirects.");
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err?.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const hops = data?.redirectChain || [];

  return (
    <div className="space-y-6">
      <form onSubmit={checkRedirects} className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-muted">
          URL to Trace Redirects
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Route size={16} />}
            {loading ? "Tracing..." : "Check Redirects"}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Redirect Path Overview</span>
              <p className="text-sm font-extrabold text-ink mt-0.5">
                {hops.length <= 1 ? "Direct URL (0 redirects)" : `${hops.length - 1} redirect hop(s) detected`}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
              Final: HTTP {data.statusCode}
            </span>
          </div>

          {/* Stepper Chain */}
          <div className="space-y-3">
            {hops.map((hop: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 rounded-2xl border border-line bg-pale/30 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 font-bold text-brand text-xs shrink-0">
                  {hop.hop}
                </span>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-ink break-all">{hop.url}</span>
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-black ${hop.statusCode >= 300 && hop.statusCode < 400 ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {hop.statusCode} {hop.statusText}
                    </span>
                  </div>
                  {hop.location && (
                    <p className="text-xs text-muted flex items-center gap-1 font-mono pt-1">
                      <ArrowRight size={13} className="text-brand shrink-0" /> Location: {hop.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
            <span className="font-bold text-ink">SEO Guidance: </span>
            Search engines follow 301 redirects to transfer link equity (PageRank) to the destination. Limit redirect chains to fewer than 3 hops to minimize crawl latency and prevent crawler drop-off.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #85 — URL Slug Generator
// ─────────────────────────────────────────────────────────────────────────────
function UrlSlugGeneratorWorkspace() {
  const [input, setInput] = useState("Best Digital Marketing Services in 2026!");
  const [separator, setSeparator] = useState<"-" | "_" | "." | "/">("-");
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [casing, setCasing] = useState<"lower" | "preserve">("lower");
  const [copied, setCopied] = useState(false);

  const STOP_WORDS = new Set(["in", "the", "a", "an", "and", "of", "to", "for", "with", "at", "by", "from", "on"]);

  const generatedSlug = useMemo(() => {
    let text = input.trim();
    if (!text) return "";

    // Normalize Unicode / Accents
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Casing
    if (casing === "lower") text = text.toLowerCase();

    // Remove punctuation & special chars
    text = text.replace(/[^a-zA-Z0-9\s-_]/g, "");

    // Split words
    let words = text.split(/\s+/).filter(Boolean);

    if (removeStopWords) {
      words = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
    }

    return words.join(separator);
  }, [input, separator, removeStopWords, casing]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
        <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Input Title / Phrase</label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste any headline or phrase..."
          className={inputClass}
        />

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase">Separator:</span>
            <div className="flex items-center rounded-lg border border-line bg-pale/50 p-1">
              {(["-", "_", ".", "/"] as const).map((sep) => (
                <button
                  key={sep}
                  type="button"
                  onClick={() => setSeparator(sep)}
                  className={`rounded px-2.5 py-0.5 font-mono text-xs font-bold transition ${
                    separator === sep ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {sep === "/" ? "/ (slash)" : sep}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={removeStopWords}
              onChange={(e) => setRemoveStopWords(e.target.checked)}
              className="rounded text-brand"
            />
            Remove stop words (in, the, a, and...)
          </label>
        </div>
      </div>

      {/* Output Card */}
      <div className="rounded-3xl border border-line bg-gradient-to-br from-brand/5 via-white to-pale p-6 sm:p-8 shadow-soft text-center space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand">Clean SEO Slug</p>
        <div className="inline-block rounded-2xl border border-brand/30 bg-white px-6 py-4 shadow-sm max-w-full">
          <span className="font-mono text-xl sm:text-2xl font-black text-ink break-all">{generatedSlug || "slug-preview"}</span>
        </div>
        <p className="font-mono text-xs text-muted break-all">
          Preview: https://toolmodeon.online/blog/<span className="text-brand font-bold">{generatedSlug || "your-slug"}</span>
        </p>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={!generatedSlug}
            onClick={() => copyToClipboard(generatedSlug, setCopied)}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Slug"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #86 — Keyword Research Organizer
// ─────────────────────────────────────────────────────────────────────────────
interface KeywordRow {
  id: string;
  keyword: string;
  intent: "Informational" | "Navigational" | "Commercial" | "Transactional";
  volume: string;
  difficulty: string;
  category: string;
  notes: string;
}

function KeywordOrganizerWorkspace() {
  const [rows, setRows] = useState<KeywordRow[]>([
    { id: "1", keyword: "pdf tools online", intent: "Commercial", volume: "18500", difficulty: "42", category: "PDF", notes: "Core brand pillar" },
    { id: "2", keyword: "how to compress pdf", intent: "Informational", volume: "45000", difficulty: "58", category: "PDF", notes: "High volume guide" },
    { id: "3", keyword: "online image compressor", intent: "Commercial", volume: "32000", difficulty: "65", category: "Image", notes: "Pillar landing page" },
    { id: "4", keyword: "json formatter online", intent: "Transactional", volume: "22000", difficulty: "38", category: "Developer", notes: "High CTR query" },
  ]);

  const [newKeyword, setNewKeyword] = useState("");
  const [batchText, setBatchText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSingleKeyword = () => {
    if (!newKeyword.trim()) return;
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        keyword: newKeyword.trim(),
        intent: "Informational",
        volume: "1000",
        difficulty: "30",
        category: "General",
        notes: "",
      },
    ]);
    setNewKeyword("");
  };

  const importBatch = () => {
    const lines = batchText.split("\n").map((l) => l.trim()).filter(Boolean);
    const newItems = lines.map((k, idx) => ({
      id: `${Date.now()}_${idx}`,
      keyword: k,
      intent: "Informational" as const,
      volume: "0",
      difficulty: "0",
      category: "Uncategorized",
      notes: "",
    }));
    setRows([...rows, ...newItems]);
    setBatchText("");
  };

  const removeDuplicates = () => {
    const seen = new Set<string>();
    const filtered = rows.filter((r) => {
      const lower = r.keyword.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
    setRows(filtered);
  };

  const exportCsv = () => {
    const headers = ["Keyword", "Intent", "Search Volume", "Difficulty", "Category", "Notes"];
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.keyword.replace(/"/g, '""')}"`,
          r.intent,
          r.volume,
          r.difficulty,
          `"${r.category}"`,
          `"${r.notes.replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");
    downloadFile(csvContent, "keywords.csv", "text/csv");
  };

  const filteredRows = useMemo(() => {
    const q = searchFilter.toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.keyword.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [rows, searchFilter]);

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter keywords..."
            className="rounded-lg border border-line bg-pale/50 px-3 py-1.5 text-xs outline-none"
          />
          <button
            type="button"
            onClick={removeDuplicates}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-pale"
          >
            Deduplicate
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 shadow-sm"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Add Single Keyword */}
      <div className="flex gap-2">
        <input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSingleKeyword()}
          placeholder="Type keyword and press Enter..."
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={addSingleKeyword}
          className="rounded-xl bg-brand px-5 py-3 text-xs font-bold text-white hover:opacity-95"
        >
          Add Keyword
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-pale/50 text-muted font-bold">
              <tr>
                <th className="px-4 py-3">Keyword</th>
                <th className="px-4 py-3">Search Intent</th>
                <th className="px-4 py-3">Vol.</th>
                <th className="px-4 py-3">KD%</th>
                <th className="px-4 py-3">Cluster / Category</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRows.map((item) => (
                <tr key={item.id} className="hover:bg-pale/30">
                  <td className="px-4 py-3 font-semibold text-ink">{item.keyword}</td>
                  <td className="px-4 py-3">
                    <select
                      value={item.intent}
                      onChange={(e) =>
                        setRows(rows.map((r) => (r.id === item.id ? { ...r, intent: e.target.value as any } : r)))
                      }
                      className="rounded border border-line bg-white p-1 text-[11px] font-semibold"
                    >
                      <option value="Informational">Informational</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Transactional">Transactional</option>
                      <option value="Navigational">Navigational</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono">{item.volume}</td>
                  <td className="px-4 py-3 font-mono">{item.difficulty}%</td>
                  <td className="px-4 py-3 font-medium text-muted">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setRows(rows.filter((r) => r.id !== item.id))}
                      className="text-red-600 hover:opacity-80"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #87 — SERP Snippet Preview
// ─────────────────────────────────────────────────────────────────────────────
function SerpSnippetPreviewWorkspace() {
  const [title, setTitle] = useState("ToolModeOn — Everyday Tools. One Platform.");
  const [description, setDescription] = useState(
    "Fast, reliable online utilities for everyday tasks. High performance PDF, image, text, developer, and SEO tools running directly in your browser."
  );
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const titleLength = title.length;
  const descLength = description.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Snippet Content Editor</h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted uppercase">SEO Title</label>
              <span className={`text-xs font-bold ${titleLength >= 50 && titleLength <= 60 ? "text-emerald-600" : "text-amber-600"}`}>
                {titleLength} / 60 chars
              </span>
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted uppercase">Meta Description</label>
              <span className={`text-xs font-bold ${descLength >= 140 && descLength <= 160 ? "text-emerald-600" : "text-amber-600"}`}>
                {descLength} / 160 chars
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[100px] resize-y`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Target URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Live SERP Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView("desktop")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  view === "desktop" ? "bg-ink text-white" : "border border-line bg-white text-ink"
                }`}
              >
                Desktop Google Preview
              </button>
              <button
                type="button"
                onClick={() => setView("mobile")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  view === "mobile" ? "bg-ink text-white" : "border border-line bg-white text-ink"
                }`}
              >
                Mobile Google Preview
              </button>
            </div>
          </div>

          {/* Google Result Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            {view === "desktop" ? (
              <div className="max-w-[600px] space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#202124]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 font-bold text-[9px]">
                    G
                  </span>
                  <span className="font-medium text-muted">{url.replace(/^https?:\/\//, "")}</span>
                </div>
                <h4 className="text-lg font-normal text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
                  {title || "Untitled Document"}
                </h4>
                <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">{description || "No description provided."}</p>
              </div>
            ) : (
              <div className="max-w-[360px] space-y-1.5 border border-slate-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#202124]">ToolModeOn</span>
                  <span className="text-muted text-[11px]">{url.replace(/^https?:\/\//, "")}</span>
                </div>
                <h4 className="text-base font-medium text-[#1a0dab] leading-snug line-clamp-2">
                  {title || "Untitled Document"}
                </h4>
                <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-3">{description || "No description provided."}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
            <span className="font-bold text-ink">Search Engine Behavior: </span>
            This simulation previews title and description lengths. Search engines like Google frequently generate dynamic descriptions from page content based on the user&apos;s specific search query.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #88 — UTM Link Builder
// ─────────────────────────────────────────────────────────────────────────────
function UtmLinkBuilderWorkspace() {
  const [baseUrl, setBaseUrl] = useState("https://toolmodeon.online/tools/seo");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("spring_launch_2026");
  const [term, setTerm] = useState("seo+tools");
  const [content, setContent] = useState("hero_cta_banner");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const generatedUrl = useMemo(() => {
    let clean = baseUrl.trim();
    if (!clean) return "";

    try {
      const u = new URL(clean);
      if (source.trim()) u.searchParams.set("utm_source", source.trim());
      if (medium.trim()) u.searchParams.set("utm_medium", medium.trim());
      if (campaign.trim()) u.searchParams.set("utm_campaign", campaign.trim());
      if (term.trim()) u.searchParams.set("utm_term", term.trim());
      if (content.trim()) u.searchParams.set("utm_content", content.trim());
      return u.toString();
    } catch {
      return "";
    }
  }, [baseUrl, source, medium, campaign, term, content]);

  useEffect(() => {
    if (!generatedUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(generatedUrl, { width: 220, margin: 2 }, (err, dataUri) => {
      if (!err && dataUri) setQrDataUrl(dataUri);
    });
  }, [generatedUrl]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Form */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Campaign Tracking Parameters</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Base Website URL</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={inputClass} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">Campaign Source (`utm_source`)*</label>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="google, newsletter" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">Campaign Medium (`utm_medium`)*</label>
              <input value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="cpc, email, social" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted uppercase">Campaign Name (`utm_campaign`)*</label>
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="summer_sale" className={inputClass} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">Campaign Term (`utm_term`)</label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="keywords" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted uppercase">Campaign Content (`utm_content`)</label>
              <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="banner_cta" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Output & QR */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand">Campaign URL</p>
            <div className="rounded-2xl border border-line bg-pale/30 p-3 font-mono text-xs font-bold text-ink break-all">
              {generatedUrl || "Enter a valid base URL above"}
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                disabled={!generatedUrl}
                onClick={() => copyToClipboard(generatedUrl, setCopied)}
                className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy UTM Link"}
              </button>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="pt-2 flex flex-col items-center">
                <img src={qrDataUrl} alt="Campaign QR Code" className="h-40 w-40 rounded-xl border border-line shadow-sm" />
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = qrDataUrl;
                    a.download = "campaign-qr.png";
                    a.click();
                  }}
                  className="mt-2 text-xs font-bold text-brand hover:underline"
                >
                  Download QR Code (PNG)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #89 — Broken Link Checker
// ─────────────────────────────────────────────────────────────────────────────
function BrokenLinkCheckerWorkspace() {
  const [crawlUrl, setCrawlUrl] = useState("https://toolmodeon.online");
  const [batchText, setBatchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "broken" | "working">("all");
  const [error, setError] = useState<string | null>(null);

  const checkFromCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // 1. Inspect page to extract links
      const inspectRes = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(crawlUrl.trim())}`);
      const inspectJson = await inspectRes.json();
      if (!inspectJson.success || !inspectJson.metadata?.links) {
        setError(inspectJson.error || "Could not extract links from webpage.");
        setLoading(false);
        return;
      }

      const linksToCheck = inspectJson.metadata.links.slice(0, 20);
      if (linksToCheck.length === 0) {
        setError("No external or internal links were found on this page.");
        setLoading(false);
        return;
      }

      // 2. Check extracted links
      const checkRes = await fetch("/api/tools/seo/check-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: linksToCheck }),
      });
      const checkJson = await checkRes.json();
      if (!checkRes.ok) {
        setError(checkJson.error || "Failed to check links.");
      } else {
        setResults(checkJson.results || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to probe links.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "broken") {
      return results.filter((r) => ["client_error", "server_error", "timeout", "inaccessible"].includes(r.category));
    }
    if (filter === "working") {
      return results.filter((r) => r.category === "working");
    }
    return results;
  }, [results, filter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
        <label className="text-xs font-extrabold uppercase tracking-wider text-muted">Page URL to Scan for Broken Links</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={crawlUrl}
            onChange={(e) => setCrawlUrl(e.target.value)}
            placeholder="https://example.com"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={checkFromCrawl}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Unlink size={16} />}
            {loading ? "Scanning Links..." : "Scan Webpage Links"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${filter === "all" ? "bg-ink text-white" : "border border-line text-ink"}`}
              >
                All ({results.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("broken")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${filter === "broken" ? "bg-red-600 text-white" : "border border-line text-red-600"}`}
              >
                Broken ({results.filter((r) => ["client_error", "server_error", "timeout", "inaccessible"].includes(r.category)).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("working")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${filter === "working" ? "bg-emerald-600 text-white" : "border border-line text-emerald-600"}`}
              >
                Working ({results.filter((r) => r.category === "working").length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-line overflow-x-auto">
            {filtered.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 text-xs gap-3">
                <span className="font-mono text-ink break-all">{item.url}</span>
                <span className={`rounded px-2 py-0.5 font-mono font-bold shrink-0 ${
                  item.category === "working" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}>
                  HTTP {item.statusCode || "ERR"} ({item.category})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #90 — Website Word Counter
// ─────────────────────────────────────────────────────────────────────────────
function WebsiteWordCounterWorkspace() {
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAndCount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tools/seo/inspect?url=${encodeURIComponent(url.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success || !json.metadata) {
        setError(json.error || "Failed to extract readable content from URL.");
      } else {
        const s = json.metadata.textStats;
        setText(s.cleanedText || "");
        setStats(s);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach inspection service.");
    } finally {
      setLoading(false);
    }
  };

  // Live recalculate words if user edits the text area
  const computedWords = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = text.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0);
    return {
      words: words.length,
      chars,
      charsNoSpaces,
      sentences: sentences.length,
      readTime: Math.ceil(words.length / 200),
    };
  }, [text]);

  return (
    <div className="space-y-6">
      <form onSubmit={fetchAndCount} className="rounded-3xl border border-line bg-white p-5 sm:p-7 shadow-soft space-y-4">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-muted">
          Webpage URL to Extract & Count Words
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-soft hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <FileSearch size={16} />}
            {loading ? "Counting..." : "Analyze Webpage"}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {text && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-6">
          {/* Metrics Tiles */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-line bg-pale/30 p-4 text-center">
              <span className="text-xs font-bold uppercase text-muted">Total Words</span>
              <p className="font-mono text-3xl font-black text-brand mt-1">{computedWords.words}</p>
            </div>
            <div className="rounded-2xl border border-line bg-pale/30 p-4 text-center">
              <span className="text-xs font-bold uppercase text-muted">Characters</span>
              <p className="font-mono text-3xl font-black text-ink mt-1">{computedWords.chars}</p>
            </div>
            <div className="rounded-2xl border border-line bg-pale/30 p-4 text-center">
              <span className="text-xs font-bold uppercase text-muted">Sentences</span>
              <p className="font-mono text-3xl font-black text-ink mt-1">{computedWords.sentences}</p>
            </div>
            <div className="rounded-2xl border border-line bg-pale/30 p-4 text-center">
              <span className="text-xs font-bold uppercase text-muted">Read Time</span>
              <p className="font-mono text-3xl font-black text-ink mt-1">~{computedWords.readTime} min</p>
            </div>
          </div>

          {/* Extracted Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Extracted Content (Editable)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(text, setCopied)}
                  className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink hover:bg-pale"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy Text"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(text, "webpage-text.txt", "text/plain")}
                  className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-white hover:opacity-90"
                >
                  <Download size={13} /> Export .txt
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`${inputClass} min-h-[320px] resize-y font-sans leading-relaxed`}
            />
          </div>

          <div className="rounded-2xl border border-line bg-pale/50 p-4 text-xs text-muted leading-relaxed">
            <span className="font-bold text-ink">Text Extraction Details: </span>
            Scripts, inline CSS styles, navigational headers, footers, and HTML comments are automatically stripped to isolate the primary readable content.
          </div>
        </div>
      )}
    </div>
  );
}
