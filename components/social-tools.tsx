"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Crop,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  FileUp,
  Globe,
  Hash,
  HelpCircle,
  Image as ImageIcon,
  Instagram,
  Layers,
  Link as LinkIcon,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Monitor,
  Move,
  PenTool,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Type,
  Upload,
  User,
  Users,
  Video,
  X,
  Youtube,
  CaseSensitive,
  Contact,
  Building,
  MapPin,
  Briefcase,
} from "lucide-react";
import type { Tool } from "../lib/tools";
import { UtmLinkBuilderWorkspace } from "./seo-tools";

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

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #91 — YouTube Thumbnail Downloader
// ─────────────────────────────────────────────────────────────────────────────
export function YouTubeThumbnailDownloaderWorkspace() {
  const [urlInput, setUrlInput] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [videoId, setVideoId] = useState<string | null>("dQw4w9WgXcQ");
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [downloadingQuality, setDownloadingQuality] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<Record<string, { width: number; height: number; available: boolean }>>({});

  const extractId = useCallback((input: string): string | null => {
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
  }, []);

  const handleFetch = (targetUrl = urlInput) => {
    setError(null);
    const id = extractId(targetUrl);
    if (!id) {
      setError("Please enter a valid YouTube video URL (e.g., youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...)");
      setVideoId(null);
      setAvailableQualities({});
      return;
    }
    setVideoId(id);
    checkQualities(id);
  };

  const checkQualities = (id: string) => {
    const qualities = [
      { key: "maxres", name: "Maximum HD (1080p / 720p)", file: "maxresdefault.jpg", expW: 1280, expH: 720 },
      { key: "sd", name: "Standard Definition (480p)", file: "sddefault.jpg", expW: 640, expH: 480 },
      { key: "hq", name: "High Quality (360p)", file: "hqdefault.jpg", expW: 480, expH: 360 },
      { key: "mq", name: "Medium Quality (180p)", file: "mqdefault.jpg", expW: 320, expH: 180 },
      { key: "default", name: "Default Thumbnail", file: "default.jpg", expW: 120, expH: 90 },
    ];

    const results: Record<string, { width: number; height: number; available: boolean }> = {};
    let pending = qualities.length;

    qualities.forEach((q) => {
      const img = new Image();
      img.src = `https://img.youtube.com/vi/${id}/${q.file}`;
      img.onload = () => {
        // YouTube returns a 120x90 placeholder when maxres or sd does not exist
        const isPlaceholder = q.key === "maxres" && img.naturalWidth <= 120 && img.naturalHeight <= 90;
        results[q.key] = {
          width: img.naturalWidth || q.expW,
          height: img.naturalHeight || q.expH,
          available: !isPlaceholder && img.naturalWidth > 0,
        };
        pending -= 1;
        if (pending === 0) setAvailableQualities({ ...results });
      };
      img.onerror = () => {
        results[q.key] = { width: q.expW, height: q.expH, available: false };
        pending -= 1;
        if (pending === 0) setAvailableQualities({ ...results });
      };
    });
  };

  useEffect(() => {
    if (videoId) checkQualities(videoId);
  }, []);

  const handleDownload = async (imgUrl: string, filename: string, qualityKey: string) => {
    setDownloadingQuality(qualityKey);
    try {
      const response = await fetch(imgUrl, { mode: "cors" }).catch(() => null);
      if (response && response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        // Fallback using Canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgUrl;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((b) => {
              if (b) {
                const u = URL.createObjectURL(b);
                const a = document.createElement("a");
                a.href = u;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(u);
              } else {
                window.open(imgUrl, "_blank");
              }
            }, "image/jpeg", 0.95);
          } else {
            window.open(imgUrl, "_blank");
          }
        };
        img.onerror = () => window.open(imgUrl, "_blank");
      }
    } catch {
      window.open(imgUrl, "_blank");
    } finally {
      setDownloadingQuality(null);
    }
  };

  const thumbnailTiers = [
    { key: "maxres", label: "Maximum HD", desc: "Highest resolution available (1280 × 720 px)", file: "maxresdefault.jpg" },
    { key: "sd", label: "Standard Definition", desc: "SD quality (640 × 480 px)", file: "sddefault.jpg" },
    { key: "hq", label: "High Quality", desc: "HQ preview (480 × 360 px)", file: "hqdefault.jpg" },
    { key: "mq", label: "Medium Quality", desc: "MQ preview (320 × 180 px)", file: "mqdefault.jpg" },
    { key: "default", label: "Default Mini", desc: "Standard mini thumbnail (120 × 90 px)", file: "default.jpg" },
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
        <div>
          <h2 className="text-base font-bold text-ink">Enter YouTube Video URL</h2>
          <p className="text-xs text-muted">Supports standard videos, Shorts, mobile links, youtu.be, and embedded links.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or youtu.be/..."
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => handleFetch()}
            className="flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-xs font-bold text-white shadow hover:opacity-90 transition shrink-0"
          >
            <Search size={14} />
            Get Thumbnails
          </button>
          <button
            type="button"
            onClick={() => {
              setUrlInput("");
              setVideoId(null);
              setError(null);
              setAvailableQualities({});
            }}
            className="rounded-xl border border-line bg-white px-4 py-3 text-xs font-bold text-muted hover:border-ink hover:text-ink transition shrink-0"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {videoId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pale text-ink text-xs font-bold">ID</span>
              <span className="font-mono text-xs font-bold text-ink">{videoId}</span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink hover:underline"
            >
              Watch Video <ExternalLink size={12} />
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {thumbnailTiers.map((tier) => {
              const imgUrl = `https://img.youtube.com/vi/${videoId}/${tier.file}`;
              const qual = availableQualities[tier.key];
              const isAvailable = qual ? qual.available : true;
              const isCopied = copiedUrl === imgUrl;
              const isDownloading = downloadingQuality === tier.key;

              return (
                <div
                  key={tier.key}
                  className={`rounded-2xl border ${
                    isAvailable ? "border-line bg-white" : "border-line/60 bg-pale/40 opacity-70"
                  } p-5 shadow-soft space-y-3 transition`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-ink">{tier.label}</h3>
                        <span className="rounded-md border border-line bg-pale px-2 py-0.5 text-[10px] font-semibold text-muted">
                          {qual ? `${qual.width} × ${qual.height} px` : "Checking resolution..."}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{tier.desc}</p>
                    </div>

                    {!isAvailable && (
                      <span className="rounded-md border border-line bg-pale px-2 py-0.5 text-[10px] font-bold text-muted">
                        Unavailable
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Image Preview */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-pale/30">
                    <img
                      src={imgUrl}
                      alt={`${tier.label} Thumbnail`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm text-xs font-bold text-muted">
                        Resolution not uploaded by creator
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!isAvailable || isDownloading}
                      onClick={() => handleDownload(imgUrl, `youtube-${videoId}-${tier.key}.jpg`, tier.key)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40 transition shadow-sm"
                    >
                      <Download size={13} />
                      {isDownloading ? "Downloading..." : "Download JPG"}
                    </button>

                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => copyToClipboard(imgUrl, () => setCopiedUrl(imgUrl))}
                      className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-ink hover:bg-pale disabled:opacity-40 transition"
                      title="Copy direct image link"
                    >
                      {isCopied ? <Check size={13} className="text-ink" /> : <Copy size={13} />}
                      {isCopied ? "Copied" : "Copy URL"}
                    </button>

                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-muted hover:text-ink hover:bg-pale transition"
                      title="Open full size in new tab"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #92 — YouTube Channel Banner Resizer
// ─────────────────────────────────────────────────────────────────────────────
export function YouTubeBannerResizerWorkspace() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("banner-image");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [bgMode, setBgMode] = useState<"blur" | "black" | "white" | "dark">("black");
  const [showGuides, setShowGuides] = useState(true);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("jpeg");
  const [quality, setQuality] = useState(0.9);
  const [estimatedSize, setEstimatedSize] = useState<string>("~");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setZoom(1);
      setPanX(0);
      setPanY(0);
    };
    reader.readAsDataURL(file);
  };

  const drawBanner = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed YouTube Banner standard: 2560 × 1440
    canvas.width = 2560;
    canvas.height = 1440;

    // Draw background
    if (bgMode === "white") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 2560, 1440);
    } else if (bgMode === "dark") {
      ctx.fillStyle = "#222222";
      ctx.fillRect(0, 0, 2560, 1440);
    } else {
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, 2560, 1440);
    }

    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      if (bgMode === "blur") {
        ctx.save();
        ctx.filter = "blur(40px) brightness(0.6)";
        ctx.drawImage(img, -100, -100, 2760, 1640);
        ctx.restore();
      }

      // Draw main image with pan & zoom centered
      ctx.save();
      const scaledW = img.naturalWidth * zoom;
      const scaledH = img.naturalHeight * zoom;
      const centerX = 2560 / 2 + panX;
      const centerY = 1440 / 2 + panY;

      ctx.drawImage(img, centerX - scaledW / 2, centerY - scaledH / 2, scaledW, scaledH);
      ctx.restore();

      // Estimate output file size
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const kb = Math.round(blob.size / 1024);
            setEstimatedSize(kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb} KB`);
          }
        },
        exportFormat === "png" ? "image/png" : "image/jpeg",
        quality
      );
    };
  }, [imageSrc, zoom, panX, panY, bgMode, exportFormat, quality]);

  useEffect(() => {
    drawBanner();
  }, [drawBanner]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
    const ext = exportFormat === "png" ? "png" : "jpg";
    const dataUrl = canvas.toDataURL(mime, quality);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileName}-youtube-banner-2560x1440.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetControls = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setBgMode("black");
    setExportFormat("jpeg");
    setQuality(0.9);
  };

  return (
    <div className="space-y-6">
      {/* Upload & Workspace */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas & Visual Guide Viewport */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h2 className="text-base font-bold text-ink">YouTube Channel Banner Workspace</h2>
                <p className="text-xs text-muted">Canvas: 2560 × 1440 px · Center Safe Area: 1546 × 423 px</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuides(!showGuides)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    showGuides ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {showGuides ? "Hide Safe Area Guide" : "Show Safe Area Guide"}
                </button>
              </div>
            </div>

            {/* Interactive Preview Viewport */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-neutral-900 shadow-inner flex items-center justify-center">
              <canvas ref={canvasRef} className="h-full w-full object-contain" />

              {!imageSrc && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-pale/90 cursor-pointer p-6 text-center hover:bg-pale transition"
                >
                  <Upload size={32} className="text-muted mb-3" />
                  <p className="text-sm font-bold text-ink">Click or drag & drop an image here</p>
                  <p className="text-xs text-muted mt-1">Supports JPG, PNG, and WebP (up to 20MB)</p>
                </div>
              )}

              {/* Safe Area Overlays */}
              {showGuides && imageSrc && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {/* Desktop Banner Area: 2560 x 423 -> (423/1440) = 29.375% height */}
                  <div className="absolute w-full h-[29.375%] border-y border-dashed border-white/40 bg-white/5 flex items-center justify-center">
                    {/* Safe Area Box: 1546 x 423 -> (1546/2560) = 60.39% width */}
                    <div className="relative h-full w-[60.39%] border-2 border-emerald-400/90 bg-emerald-500/10 flex flex-col items-center justify-between p-2">
                      <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        SAFE AREA: 1546 × 423 px (Text & Logo visible on all devices)
                      </span>
                      <span className="rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-white/80">
                        Desktop & Mobile Safe Zone
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />

            {/* Quick Upload or Replace */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-pale transition"
              >
                <Upload size={14} />
                {imageSrc ? "Replace Image" : "Upload Banner Image"}
              </button>

              {imageSrc && (
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>Output: <strong className="text-ink">2560 × 1440 px</strong></span>
                  <span>Est. Size: <strong className="text-ink">{estimatedSize}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Adjustments & Export Panel */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Position & Adjustments</h3>

            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ink">Zoom / Scale</span>
                <span className="font-mono text-muted">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={zoom}
                disabled={!imageSrc}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-ink"
              />
            </div>

            {/* Pan X Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ink">Horizontal Position (X)</span>
                <span className="font-mono text-muted">{panX}px</span>
              </div>
              <input
                type="range"
                min="-1200"
                max="1200"
                step="10"
                value={panX}
                disabled={!imageSrc}
                onChange={(e) => setPanX(parseInt(e.target.value))}
                className="w-full accent-ink"
              />
            </div>

            {/* Pan Y Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-ink">Vertical Position (Y)</span>
                <span className="font-mono text-muted">{panY}px</span>
              </div>
              <input
                type="range"
                min="-800"
                max="800"
                step="10"
                value={panY}
                disabled={!imageSrc}
                onChange={(e) => setPanY(parseInt(e.target.value))}
                className="w-full accent-ink"
              />
            </div>

            {/* Background Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Canvas Background</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "black", label: "Black" },
                  { id: "white", label: "White" },
                  { id: "dark", label: "Dark Gray" },
                  { id: "blur", label: "Blurred Image" },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBgMode(bg.id as any)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      bgMode === bg.id ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-1.5 border-t border-line pt-4">
              <label className="text-xs font-bold text-ink">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat("jpeg")}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                    exportFormat === "jpeg" ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  JPG (Best size)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("png")}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                    exportFormat === "png" ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  PNG (Lossless)
                </button>
              </div>
            </div>

            {/* Quality Slider (JPG) */}
            {exportFormat === "jpeg" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-ink">JPG Quality</span>
                  <span className="font-mono text-muted">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-ink"
                />
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={!imageSrc}
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-40 transition"
              >
                <Download size={14} />
                Download YouTube Banner (2560 × 1440)
              </button>

              <button
                type="button"
                disabled={!imageSrc}
                onClick={resetControls}
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:border-ink hover:text-ink disabled:opacity-40 transition"
              >
                Reset Adjustments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #93 — Instagram Bio Formatter
// ─────────────────────────────────────────────────────────────────────────────
export function InstagramBioFormatterWorkspace() {
  const [bio, setBio] = useState(
    "Digital Creator & Tech Explorer 🚀\nHelping you build faster with modern tools.\n📍 New York, NY\n🔗 Read my latest articles below 👇"
  );
  const [handle, setHandle] = useState("toolmodeon");
  const [name, setName] = useState("ToolModeOn");
  const [website, setWebsite] = useState("toolmodeon.online");
  const [copied, setCopied] = useState(false);

  // Unicode font transform maps
  const unicodeTransforms: Record<string, (text: string) => string> = {
    boldSans: (str) =>
      str.replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + (code - 48));
        return c;
      }),
    boldSerif: (str) =>
      str.replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ce + (code - 48));
        return c;
      }),
    italicSans: (str) =>
      str.replace(/[a-zA-Z]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d608 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d622 + (code - 97));
        return c;
      }),
    script: (str) =>
      str.replace(/[a-zA-Z]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d4d0 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d4ea + (code - 97));
        return c;
      }),
    monospace: (str) =>
      str.replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d670 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d68a + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7f6 + (code - 48));
        return c;
      }),
    doubleStruck: (str) =>
      str.replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d538 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d552 + (code - 97));
        if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7d8 + (code - 48));
        return c;
      }),
    smallCaps: (str) => {
      const smallMap: Record<string, string> = {
        a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
        k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ꞯ", r: "ʀ", s: "s", t: "ᴛ",
        u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
      };
      return str.toLowerCase().split("").map((ch) => smallMap[ch] || ch).join("");
    },
    circled: (str) =>
      str.replace(/[a-zA-Z0-9]/g, (c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24b6 + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24d0 + (code - 97));
        if (code >= 49 && code <= 57) return String.fromCodePoint(0x2460 + (code - 49));
        if (code === 48) return "⓪";
        return c;
      }),
  };

  const applyFont = (fontKey: string) => {
    const fn = unicodeTransforms[fontKey];
    if (fn) {
      setBio((prev) => fn(prev));
    }
  };

  const insertSeparator = (sep: string) => {
    setBio((prev) => (prev ? `${prev}\n${sep}\n` : `${sep}\n`));
  };

  const insertInvisibleSpace = () => {
    // Zero-width space preserves Instagram line breaks
    setBio((prev) => `${prev}\n\u200B\n`);
  };

  const templates = [
    {
      name: "Creator",
      text: "✨ Creating daily tech & design content\n💡 Tips, workflows, and productivity\n🎙️ Host of The Creator Corner\n👇 Explore my favorite tools\n🔗 linkin.bio/creator",
    },
    {
      name: "Business",
      text: "🏢 Everyday Tools for Modern Teams\n⚡ 100+ Free client-side utilities\n🔒 Fast, private, zero data collection\n📩 hello@example.com\n👇 Get started for free",
    },
    {
      name: "Personal",
      text: "Coffee, code, and curiosity ☕\nExploring the world through a camera lens 📷\nBrooklyn, NY 📍\nSay hi 👋",
    },
    {
      name: "Freelancer",
      text: "🎨 UI/UX Designer & Frontend Engineer\n💼 Open for selected freelance contracts\n🏆 Featured on Awwwards & Behance\n👇 View portfolio & case studies",
    },
    {
      name: "Influencer",
      text: "Daily lifestyle, travel & wellness 🌴\nCollaborations: brand@agency.com ✉️\nPodcast every Thursday 🎙️\nDiscount codes in link below 👇",
    },
    {
      name: "Professional",
      text: "Product Strategist & Growth Advisor\nEx-Google · Angel Investor · Speaker\nWriting weekly about AI & SaaS\n👇 Read the latest newsletter issue",
    },
    {
      name: "Brand",
      text: "Minimalist essentials for creative minds.\nWorldwide shipping 🌍 | 100% sustainable\nTag #BrandMode to be featured\n👇 Shop the new drop",
    },
  ];

  const emojis = ["🚀", "✨", "🔥", "💡", "📍", "👇", "📩", "🔗", "💼", "☕", "🏆", "🌟", "⚡", "🎯", "🌿"];

  const bioLength = bio.length;
  const isOverLimit = bioLength > 150;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Controls */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Bio Editor</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${isOverLimit ? "text-rose-600" : "text-muted"}`}>
                {bioLength} / 150 chars
              </span>
              <button
                type="button"
                onClick={() => setBio("")}
                className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-muted hover:border-ink hover:text-ink"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Type your Instagram bio here..."
            className="w-full rounded-2xl border border-line bg-pale/50 p-4 text-sm text-ink outline-none transition focus:border-ink focus:bg-white resize-y font-sans"
          />

          {isOverLimit && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Bio exceeds Instagram's 150-character limit by {bioLength - 150} characters.</span>
            </div>
          )}

          {/* Unicode Font Converters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Unicode Styling</label>
              <span className="text-[10px] text-muted">Click to transform text</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "boldSans", label: "Bold Sans", preview: "𝗯𝗼𝗹𝗱" },
                { id: "boldSerif", label: "Bold Serif", preview: "𝐛𝐨𝐥𝐝" },
                { id: "italicSans", label: "Italic", preview: "𝘪𝘵𝘢𝘭𝘪𝘤" },
                { id: "script", label: "Cursive", preview: "𝓈𝒸𝓇𝒾𝓅𝓉" },
                { id: "monospace", label: "Mono", preview: "𝚖𝚘𝚗𝚘" },
                { id: "doubleStruck", label: "Double", preview: "𝕕𝕠𝕦𝕓𝕝𝕖" },
                { id: "smallCaps", label: "Small Caps", preview: "sᴍᴀʟʟ" },
                { id: "circled", label: "Bubble", preview: "ⓑⓤⓑ" },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => applyFont(style.id)}
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink hover:border-ink hover:bg-pale transition"
                  title={`Apply ${style.label} styling`}
                >
                  <span className="font-bold">{style.preview}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Insert & Spacing */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Spacing & Decorative Dividers</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={insertInvisibleSpace}
                className="rounded-lg border border-line bg-pale px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink transition"
                title="Inserts zero-width space to keep empty lines from collapsing on Instagram"
              >
                + Empty Line Break (Invisible)
              </button>
              {[
                "───────────",
                "✦ ──────── ✦",
                "• • • • • •",
                "━━━━━━━━━━━",
                "| | | | | | |",
              ].map((sep) => (
                <button
                  key={sep}
                  type="button"
                  onClick={() => insertSeparator(sep)}
                  className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-mono text-muted hover:border-ink hover:text-ink transition"
                >
                  {sep}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Emojis */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Quick Emojis</label>
            <div className="flex flex-wrap gap-1.5">
              {emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setBio((prev) => `${prev} ${em}`)}
                  className="rounded-lg border border-line bg-white px-2 py-1 text-sm hover:border-ink hover:bg-pale transition"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Bio Templates */}
          <div className="space-y-2 border-t border-line pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Pre-Made Bio Templates</label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => setBio(tpl.text)}
                  className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink hover:bg-pale transition"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notice about Unicode */}
          <p className="text-[11px] text-muted leading-relaxed">
            Note: Unicode stylized fonts render natively without external apps, but screen readers and older Android devices may not announce decorative characters identically. Use styled accents for emphasis.
          </p>
        </div>

        {/* Live Instagram Profile Simulation Preview */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Instagram size={18} className="text-ink" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-ink">Instagram Feed Simulation</span>
              </div>
              <span className="rounded-full bg-pale px-2.5 py-0.5 text-[10px] font-bold text-muted">1080 × 1920 viewport</span>
            </div>

            {/* Simulated Phone Card */}
            <div className="mx-auto max-w-sm rounded-3xl border border-line bg-white p-5 shadow-dropdown space-y-4 font-sans">
              {/* Profile Top Bar */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink lowercase">@{handle || "username"}</span>
                <div className="flex gap-3 text-ink">
                  <Plus size={18} />
                  <span className="font-bold text-xs">•••</span>
                </div>
              </div>

              {/* Avatar & Counts */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-ink font-bold text-lg">
                    {name.charAt(0) || "T"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 flex-1 text-center">
                  <div>
                    <div className="font-bold text-sm text-ink">142</div>
                    <div className="text-[11px] text-muted">Posts</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">18.4K</div>
                    <div className="text-[11px] text-muted">Followers</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">412</div>
                    <div className="text-[11px] text-muted">Following</div>
                  </div>
                </div>
              </div>

              {/* Name & Bio Live Render */}
              <div className="space-y-1">
                <div className="font-bold text-xs text-ink">{name || "ToolModeOn"}</div>
                <div className="whitespace-pre-line text-xs text-ink leading-relaxed font-sans break-words">
                  {bio || <span className="text-muted italic">Your formatted bio will appear here...</span>}
                </div>
                {website && (
                  <div className="pt-1 flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                    <LinkIcon size={11} />
                    <span>{website}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button type="button" className="rounded-lg bg-pale py-1.5 text-xs font-bold text-ink">
                  Edit profile
                </button>
                <button type="button" className="rounded-lg bg-pale py-1.5 text-xs font-bold text-ink">
                  Share profile
                </button>
                <button type="button" className="rounded-lg bg-pale py-1.5 text-xs font-bold text-ink">
                  Contact
                </button>
              </div>
            </div>

            {/* Copy Button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(bio, setCopied)}
                className="flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Bio Copied to Clipboard!" : "Copy Formatted Bio"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #94 — Hashtag Generator
// ─────────────────────────────────────────────────────────────────────────────
export function HashtagGeneratorWorkspace() {
  const [keywordInput, setKeywordInput] = useState("marketing, saas, growth");
  const [niche, setNiche] = useState<string>("Marketing");
  const [casing, setCasing] = useState<"lowercase" | "camelCase">("lowercase");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSelected, setCopiedSelected] = useState(false);
  const [manualText, setManualText] = useState("");

  const nicheDictionary: Record<string, { general: string[]; niche: string[]; industry: string[]; business: string[]; community: string[] }> = {
    Marketing: {
      general: ["marketing", "digitalmarketing", "marketingstrategy", "growthmarketing", "contentmarketing", "socialmediamarketing", "branding"],
      niche: ["martech", "demandgeneration", "b2bmarketing", "emailmarketingtips", "performancemarketing", "conversionrate", "copywritingtips"],
      industry: ["marketingagency", "digitalagency", "adtech", "growthhacking", "influencermarketing", "marketingoperations"],
      business: ["smallbusinessmarketing", "entrepreneurship", "businessgrowth", "startupmarketing", "brandstrategy"],
      community: ["marketersoftwitter", "contentcreator", "marketingcommunity", "growthmindset", "buildinpublic"],
    },
    Technology: {
      general: ["technology", "tech", "innovation", "programming", "developer", "coding", "softwareengineering"],
      niche: ["webdevelopment", "fullstack", "reactjs", "nextjs", "typescript", "cloudcomputing", "cybersecurity"],
      industry: ["techindustry", "saas", "devops", "artificialintelligence", "machinelearning", "bigdata"],
      business: ["techstartup", "bootstrapped", "venturecapital", "productmanagement", "techcareers"],
      community: ["developerlife", "100daysofcode", "codersofinstagram", "womenintech", "buildinpublic"],
    },
    Business: {
      general: ["business", "entrepreneur", "leadership", "success", "motivation", "finance", "strategy"],
      niche: ["smallbusiness", "b2bbusiness", "ecommerce", "startuplife", "businessconsulting", "bootstrapping"],
      industry: ["corporate", "venturebacked", "management", "scaleyourbusiness", "businessowner"],
      business: ["revenuegrowth", "businessmodel", "profitablebusiness", "founders", "leadershipdevelopment"],
      community: ["entrepreneurcommunity", "businessmindset", "foundersnetwork", "bosslife"],
    },
    Education: {
      general: ["education", "learning", "study", "student", "knowledge", "teacher", "onlinelearning"],
      niche: ["edtech", "elearning", "homeschooling", "highereducation", "skillbuilding", "tutoring"],
      industry: ["academics", "curriculum", "educationaltechnology", "teachingtips", "stem"],
      business: ["coursecreator", "onlinecourses", "coachingbusiness", "educationconsultant"],
      community: ["teachersoftiktok", "studygram", "learningeveryday", "studentlife"],
    },
    Fitness: {
      general: ["fitness", "workout", "gym", "fitfam", "health", "exercise", "training"],
      niche: ["strengthtraining", "calisthenics", "crossfit", "bodybuilding", "hiitworkout", "mobility"],
      industry: ["fitnesscoach", "personaltrainer", "sportsnutrition", "gymlife", "fitnessmotivation"],
      business: ["fitnessbusiness", "fitnesstrainer", "onlinecoach", "gymowner"],
      community: ["fitnesscommunity", "gyminspiration", "noexcuses", "consistencyiskey"],
    },
    Travel: {
      general: ["travel", "wanderlust", "travelgram", "instatravel", "adventure", "vacation", "explore"],
      niche: ["solotravel", "budgettravel", "backpacking", "luxurytravel", "roadtrip", "digitalnomad"],
      industry: ["travelagency", "tourism", "hospitality", "travelcreator", "travelphotography"],
      business: ["nomadlife", "remotejobs", "travelblogger", "travelinfluencer"],
      community: ["travelcommunity", "globetrotter", "passportready", "bucketlist"],
    },
    Food: {
      general: ["food", "foodie", "instafood", "foodporn", "delicious", "yummy", "cooking"],
      niche: ["homecooking", "plantbased", "glutenfree", "baking", "mealprep", "healthyrecipes"],
      industry: ["culinary", "restaurantlife", "chefsofinstagram", "foodstyling", "foodbusiness"],
      business: ["foodentrepreneur", "bakeryowner", "cloudkitchen", "catering"],
      community: ["foodlovers", "cookingtips", "recipeoftheday", "homechef"],
    },
    Fashion: {
      general: ["fashion", "style", "ootd", "streetwear", "clothing", "fashionblogger", "instafashion"],
      niche: ["sustainablefashion", "vintageclothing", "capsulewardrobe", "thrifted", "designerfashion"],
      industry: ["fashionindustry", "fashiondesign", "textiles", "modelfashion", "apparel"],
      business: ["clothingbrand", "boutiqueowner", "fashionentrepreneur", "retail"],
      community: ["fashioncommunity", "styleinspo", "dailyoutfit", "wardrobegoals"],
    },
    "Real Estate": {
      general: ["realestate", "realtor", "property", "home", "housing", "investment", "architecture"],
      niche: ["commercialrealestate", "residentialrealestate", "firsttimehomebuyer", "luxuryrealestate", "flippinghouses"],
      industry: ["realtorlife", "realestatebroker", "propertydevelopment", "mortgage", "realestateinvesting"],
      business: ["realestatebusiness", "realty", "passiveincome", "realestateagent"],
      community: ["propertytour", "dreamhome", "housespotting", "realestatelife"],
    },
    Photography: {
      general: ["photography", "photo", "photographer", "photooftheday", "portrait", "visuals", "art"],
      niche: ["streetphotography", "landscapephotography", "portraitphotography", "sonyalpha", "filmmaking"],
      industry: ["photographygear", "commercialphotography", "editorialphotography", "lighting"],
      business: ["photobusiness", "weddingphotographer", "freelancephotographer", "studiophotography"],
      community: ["shutterbug", "photocommunity", "throughmycanvas", "capturethemoment"],
    },
  };

  const generatedCategories = useMemo(() => {
    const rawTokens = keywordInput
      .toLowerCase()
      .split(/[,;\s]+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""))
      .filter((t) => t.length > 1);

    const baseNiche = nicheDictionary[niche] || nicheDictionary["Marketing"];
    const formatTag = (t: string) => {
      if (casing === "camelCase") {
        return `#${t.charAt(0).toUpperCase()}${t.slice(1)}`;
      }
      return `#${t.toLowerCase()}`;
    };

    // Keyword expansion
    const kwTags = rawTokens.flatMap((token) => [
      token,
      `${token}tips`,
      `${token}life`,
      `${token}strategy`,
      `${token}daily`,
      `${token}growth`,
      `${token}community`,
    ]);

    const result = {
      General: Array.from(new Set([...baseNiche.general, ...kwTags.slice(0, 3)])).map(formatTag),
      Niche: Array.from(new Set([...baseNiche.niche, ...kwTags.slice(3, 7)])).map(formatTag),
      Industry: Array.from(new Set([...baseNiche.industry, ...kwTags.slice(7, 10)])).map(formatTag),
      Business: Array.from(new Set([...baseNiche.business])).map(formatTag),
      Community: Array.from(new Set([...baseNiche.community])).map(formatTag),
    };

    return result;
  }, [keywordInput, niche, casing]);

  const allTags = useMemo(() => {
    return Array.from(
      new Set([
        ...generatedCategories.General,
        ...generatedCategories.Niche,
        ...generatedCategories.Industry,
        ...generatedCategories.Business,
        ...generatedCategories.Community,
      ])
    );
  }, [generatedCategories]);

  useEffect(() => {
    // Select first 15 by default
    setSelectedTags(new Set(allTags.slice(0, 15)));
  }, [allTags]);

  useEffect(() => {
    const currentList = Array.from(selectedTags).join(" ");
    setManualText(currentList);
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const selectAll = () => setSelectedTags(new Set(allTags));
  const deselectAll = () => setSelectedTags(new Set());

  const handleCopySelected = () => {
    copyToClipboard(manualText || Array.from(selectedTags).join(" "), setCopiedSelected);
  };

  const handleCopyAll = () => {
    copyToClipboard(allTags.join(" "), setCopiedAll);
  };

  return (
    <div className="space-y-6">
      {/* Search & Niche Configuration */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Core Keywords</label>
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="e.g. productivity, ai, writing, saas"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Category / Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className={inputClass}
            >
              {Object.keys(nicheDictionary).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">Format:</span>
            <button
              type="button"
              onClick={() => setCasing("lowercase")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                casing === "lowercase" ? "bg-ink text-white" : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
              }`}
            >
              #lowercase
            </button>
            <button
              type="button"
              onClick={() => setCasing("camelCase")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                casing === "camelCase" ? "bg-ink text-white" : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
              }`}
            >
              #CamelCase
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="font-bold text-ink hover:underline"
            >
              Select All ({allTags.length})
            </button>
            <span className="text-muted">·</span>
            <button
              type="button"
              onClick={deselectAll}
              className="font-bold text-muted hover:text-ink hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>
      </div>

      {/* Categorized Suggestions */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-6">
        {Object.entries(generatedCategories).map(([categoryName, tags]) => (
          <div key={categoryName} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {categoryName} Hashtags ({tags.length})
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedTags.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-ink bg-ink text-white shadow-sm"
                        : "border-line bg-pale text-ink hover:border-ink hover:bg-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Selected Output & Actions */}
        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">Selected Hashtag Set</h3>
              <span className="rounded-full bg-pale px-2.5 py-0.5 text-xs font-mono font-bold text-ink">
                {selectedTags.size} tags
              </span>
            </div>
            <span className="text-[11px] text-muted">
              Instagram limit: 30 · LinkedIn/X ideal: 3–5
            </span>
          </div>

          <textarea
            rows={3}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="w-full rounded-2xl border border-line bg-pale/40 p-4 font-mono text-xs text-ink outline-none transition focus:border-ink focus:bg-white"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={selectedTags.size === 0 && !manualText}
              onClick={handleCopySelected}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-40 transition"
            >
              {copiedSelected ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedSelected ? "Copied Selected!" : `Copy Selected (${selectedTags.size})`}
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-ink hover:bg-pale transition"
            >
              {copiedAll ? <Check size={14} /> : <Copy size={14} />}
              {copiedAll ? "Copied All!" : `Copy All (${allTags.length})`}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted leading-relaxed">
          Disclaimer: Hashtags are generated using curated semantic associations and keyword patterns. They are suggestions to boost content discoverability and do not represent guaranteed real-time trending metrics.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #95 — Social Media Post Preview
// ─────────────────────────────────────────────────────────────────────────────
export function SocialMediaPostPreviewWorkspace() {
  const [platform, setPlatform] = useState<"instagram" | "facebook" | "linkedin" | "x">("x");
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const [postText, setPostText] = useState(
    "Just launched our brand new suite of 10 Social Media & Marketing tools on ToolModeOn! 🚀\n\n100% free, client-side, and no sign-up required. Try them out and let us know what you think: https://toolmodeon.online"
  );
  const [authorName, setAuthorName] = useState("ToolModeOn");
  const [username, setUsername] = useState("toolmodeon");
  const [headline, setHeadline] = useState("Everyday Tools · One Platform");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMediaUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setMediaUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const platformLimits: Record<string, number> = {
    x: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
  };

  const limit = platformLimits[platform] || 280;
  const charsUsed = postText.length;
  const isOver = charsUsed > limit;

  return (
    <div className="space-y-6">
      {/* Top Config & Platforms */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Platform Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "x", label: "X (Twitter)", icon: Share2 },
              { id: "instagram", label: "Instagram", icon: Instagram },
              { id: "facebook", label: "Facebook", icon: Globe },
              { id: "linkedin", label: "LinkedIn", icon: Briefcase },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    platform === p.id
                      ? "bg-ink text-white shadow-sm"
                      : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  <Icon size={14} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Viewport Toggle */}
          <div className="flex items-center rounded-xl border border-line bg-pale/50 p-1">
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewport === "mobile" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Smartphone size={13} />
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewport === "desktop" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Monitor size={13} />
              Desktop
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Simulation Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Post Inputs */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Post Content</h3>
            <span className={`text-xs font-mono font-bold ${isOver ? "text-rose-600" : "text-muted"}`}>
              {charsUsed} / {limit} chars
            </span>
          </div>

          <textarea
            rows={6}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Write your post here..."
            className="w-full rounded-2xl border border-line bg-pale/40 p-4 text-sm text-ink outline-none transition focus:border-ink focus:bg-white resize-y font-sans"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Author / Display Name</label>
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Username / Handle</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
            </div>
          </div>

          {platform === "linkedin" && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">LinkedIn Headline</label>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} />
            </div>
          )}

          {/* Media Upload */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Attach Media (Optional)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-ink hover:bg-pale transition"
              >
                <ImageIcon size={14} />
                {mediaUrl ? "Change Image" : "Upload Image"}
              </button>
              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => setMediaUrl(null)}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => copyToClipboard(postText, setCopied)}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy Post Text"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPostText("");
                setMediaUrl(null);
              }}
              className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:border-ink hover:text-ink transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live Simulation Viewport */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted">
                {platform.toUpperCase()} · {viewport.toUpperCase()} SIMULATION
              </span>
              <span className="rounded-md border border-line bg-pale px-2 py-0.5 text-[10px] font-bold text-muted">
                Simulation Only
              </span>
            </div>

            {/* Container */}
            <div className={`mx-auto ${viewport === "mobile" ? "max-w-sm" : "w-full"} transition-all`}>
              {/* X / TWITTER CARD */}
              {platform === "x" && (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-card font-sans space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white font-bold text-sm">
                      {authorName.charAt(0) || "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-ink truncate">{authorName}</span>
                        <span className="text-xs text-muted truncate">@{username}</span>
                        <span className="text-muted text-xs">·</span>
                        <span className="text-xs text-muted">Just now</span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink whitespace-pre-line leading-relaxed break-words">
                        {postText || <span className="text-muted italic">What is happening?!</span>}
                      </p>

                      {mediaUrl && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
                          <img src={mediaUrl} alt="Post Attachment" className="max-h-72 w-full object-cover" />
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-muted max-w-xs text-xs">
                        <span className="flex items-center gap-1 hover:text-ink cursor-pointer"><MessageSquare size={14} /> 12</span>
                        <span className="flex items-center gap-1 hover:text-ink cursor-pointer"><RepeatIcon size={14} /> 48</span>
                        <span className="flex items-center gap-1 hover:text-ink cursor-pointer"><HeartIcon size={14} /> 256</span>
                        <span className="flex items-center gap-1 hover:text-ink cursor-pointer"><Share2 size={14} /></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INSTAGRAM CARD */}
              {platform === "instagram" && (
                <div className="rounded-2xl border border-line bg-white shadow-card font-sans overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-line">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-rose-600 p-0.5">
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-ink">
                          {authorName.charAt(0)}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-ink lowercase">@{username}</span>
                    </div>
                    <span className="text-xs font-bold text-muted">•••</span>
                  </div>

                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Post Attachment" className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="aspect-square w-full bg-pale flex flex-col items-center justify-center text-muted p-6 text-center">
                      <ImageIcon size={36} className="mb-2 opacity-40" />
                      <span className="text-xs font-bold">Image attachment preview</span>
                    </div>
                  )}

                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-ink">
                      <div className="flex gap-3">
                        <HeartIcon size={18} />
                        <MessageSquare size={18} />
                        <Share2 size={18} />
                      </div>
                      <span className="text-xs font-bold">🔖</span>
                    </div>
                    <div className="text-xs font-bold text-ink">1,492 likes</div>
                    <div className="text-xs text-ink whitespace-pre-line leading-relaxed">
                      <strong className="mr-1.5 lowercase">@{username}</strong>
                      {postText}
                    </div>
                    <div className="text-[10px] text-muted uppercase">2 HOURS AGO</div>
                  </div>
                </div>
              )}

              {/* FACEBOOK CARD */}
              {platform === "facebook" && (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-card font-sans space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                      {authorName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{authorName}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-muted">
                        <span>Just now</span> · <Globe size={11} />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-ink whitespace-pre-line leading-relaxed break-words">{postText}</p>

                  {mediaUrl && (
                    <div className="overflow-hidden rounded-xl border border-line">
                      <img src={mediaUrl} alt="Post Attachment" className="max-h-80 w-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                    <span className="flex items-center gap-1">👍 ❤️ 318</span>
                    <span>42 comments · 12 shares</span>
                  </div>

                  <div className="grid grid-cols-3 border-t border-line pt-1 text-center text-xs font-bold text-muted">
                    <button type="button" className="py-1 hover:text-ink">Like</button>
                    <button type="button" className="py-1 hover:text-ink">Comment</button>
                    <button type="button" className="py-1 hover:text-ink">Share</button>
                  </div>
                </div>
              )}

              {/* LINKEDIN CARD */}
              {platform === "linkedin" && (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-card font-sans space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white font-bold">
                      {authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-ink truncate">{authorName}</h4>
                      <p className="text-xs text-muted truncate">{headline}</p>
                      <p className="text-[10px] text-muted">Just now · 🌐</p>
                    </div>
                  </div>

                  <p className="text-sm text-ink whitespace-pre-line leading-relaxed break-words">{postText}</p>

                  {mediaUrl && (
                    <div className="overflow-hidden rounded-xl border border-line">
                      <img src={mediaUrl} alt="Post Attachment" className="max-h-80 w-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                    <span>👏 💡 842</span>
                    <span>68 comments</span>
                  </div>

                  <div className="grid grid-cols-4 border-t border-line pt-1 text-center text-xs font-bold text-muted">
                    <button type="button" className="py-1 hover:text-ink">Like</button>
                    <button type="button" className="py-1 hover:text-ink">Comment</button>
                    <button type="button" className="py-1 hover:text-ink">Repost</button>
                    <button type="button" className="py-1 hover:text-ink">Send</button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted text-center pt-2">
              Note: Layout simulations approximate official platform feed displays. No accounts or APIs are connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function RepeatIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #97 — Email Signature Generator
// ─────────────────────────────────────────────────────────────────────────────
export function EmailSignatureGeneratorWorkspace() {
  const [fullName, setFullName] = useState("Alex Morgan");
  const [jobTitle, setJobTitle] = useState("Head of Growth & Product");
  const [company, setCompany] = useState("ToolModeOn");
  const [email, setEmail] = useState("alex@toolmodeon.online");
  const [phone, setPhone] = useState("+1 (555) 234-5678");
  const [website, setWebsite] = useState("https://toolmodeon.online");
  const [address, setAddress] = useState("100 Tech Plaza, New York, NY");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face");
  const [template, setTemplate] = useState<"minimal" | "professional" | "business" | "executive" | "modern" | "compact">("professional");
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [accentColor, setAccentColor] = useState("#111111");
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedRich, setCopiedRich] = useState(false);

  // Generate Email-Safe HTML Signature (Inline CSS only)
  const signatureHtml = useMemo(() => {
    const avatarHtml = avatarUrl
      ? `<img src="${avatarUrl}" alt="${fullName}" width="80" height="80" style="display:block;border-radius:50%;width:80px;height:80px;object-fit:cover;border:1px solid #E5E5E5;" />`
      : "";

    if (template === "minimal") {
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily};font-size:13px;line-height:1.5;color:#111111;">
  <tr>
    <td>
      <strong style="font-size:15px;color:#111111;">${fullName}</strong><br />
      <span style="color:#666666;">${jobTitle} · ${company}</span>
    </td>
  </tr>
  <tr>
    <td style="padding-top:8px;font-size:12px;color:#666666;">
      <a href="mailto:${email}" style="color:${accentColor};text-decoration:none;">${email}</a> · 
      <span>${phone}</span> · 
      <a href="${website}" style="color:${accentColor};text-decoration:none;">${website.replace(/^https?:\/\//, "")}</a>
    </td>
  </tr>
</table>`;
    }

    if (template === "compact") {
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily};font-size:12px;line-height:1.4;color:#111111;">
  <tr>
    <td>
      <strong>${fullName}</strong> | <span style="color:#666666;">${jobTitle}, ${company}</span> | 
      <a href="mailto:${email}" style="color:${accentColor};text-decoration:none;">${email}</a> | 
      <a href="${website}" style="color:${accentColor};text-decoration:none;">${website.replace(/^https?:\/\//, "")}</a>
    </td>
  </tr>
</table>`;
    }

    if (template === "business") {
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily};font-size:13px;line-height:1.5;color:#111111;max-width:500px;">
  <tr>
    <td style="padding-bottom:8px;border-bottom:2px solid ${accentColor};">
      <strong style="font-size:16px;color:#111111;letter-spacing:-0.2px;">${fullName}</strong><br />
      <span style="font-size:12px;color:#666666;font-weight:bold;text-transform:uppercase;">${jobTitle} | ${company}</span>
    </td>
  </tr>
  <tr>
    <td style="padding-top:10px;">
      <table cellpadding="0" cellspacing="0" border="0" style="font-size:12px;color:#444444;">
        <tr>
          <td style="padding-right:12px;"><strong>E:</strong> <a href="mailto:${email}" style="color:${accentColor};text-decoration:none;">${email}</a></td>
          <td><strong>P:</strong> ${phone}</td>
        </tr>
        <tr>
          <td style="padding-right:12px;padding-top:4px;"><strong>W:</strong> <a href="${website}" style="color:${accentColor};text-decoration:none;">${website.replace(/^https?:\/\//, "")}</a></td>
          <td style="padding-top:4px;"><strong>A:</strong> ${address}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
    }

    if (template === "executive") {
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Times New Roman', Georgia, serif;font-size:14px;line-height:1.6;color:#111111;border-left:3px solid ${accentColor};padding-left:14px;">
  <tr>
    <td>
      <span style="font-size:18px;font-weight:bold;letter-spacing:0.5px;color:#111111;">${fullName}</span><br />
      <span style="font-size:13px;font-style:italic;color:#666666;">${jobTitle} — ${company}</span>
    </td>
  </tr>
  <tr>
    <td style="padding-top:8px;font-family:Arial, sans-serif;font-size:11px;color:#666666;">
      <span>Email: <a href="mailto:${email}" style="color:${accentColor};text-decoration:none;">${email}</a></span> | 
      <span>Direct: ${phone}</span><br />
      <span>Web: <a href="${website}" style="color:${accentColor};text-decoration:none;">${website.replace(/^https?:\/\//, "")}</a></span>
    </td>
  </tr>
</table>`;
    }

    if (template === "modern") {
      return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily};font-size:13px;line-height:1.5;color:#111111;background-color:#F7F7F7;border:1px solid #E5E5E5;border-radius:12px;padding:16px;">
  <tr>
    ${avatarUrl ? `<td style="vertical-align:top;padding-right:16px;">${avatarHtml}</td>` : ""}
    <td style="vertical-align:top;">
      <strong style="font-size:16px;color:#111111;">${fullName}</strong><br />
      <span style="color:#666666;font-size:12px;">${jobTitle} at <strong>${company}</strong></span><br />
      <div style="margin-top:8px;font-size:12px;color:#444444;">
        <span>✉️ <a href="mailto:${email}" style="color:${accentColor};text-decoration:none;">${email}</a></span><br />
        <span>📞 ${phone}</span><br />
        <span>🌐 <a href="${website}" style="color:${accentColor};text-decoration:none;">${website.replace(/^https?:\/\//, "")}</a></span>
      </div>
    </td>
  </tr>
</table>`;
    }

    // Default: Professional Two-Column
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFamily};font-size:13px;line-height:1.5;color:#111111;">
  <tr>
    ${avatarUrl ? `<td style="vertical-align:middle;padding-right:16px;">${avatarHtml}</td>` : ""}
    <td style="border-left:2px solid #E5E5E5;padding-left:16px;vertical-align:middle;">
      <strong style="font-size:15px;color:#111111;">${fullName}</strong><br />
      <span style="font-size:12px;color:#666666;">${jobTitle}</span><br />
      <span style="font-size:12px;font-weight:bold;color:${accentColor};">${company}</span>
      <div style="margin-top:6px;font-size:12px;color:#555555;">
        <span><a href="mailto:${email}" style="color:#111111;text-decoration:none;">${email}</a></span> · 
        <span>${phone}</span><br />
        <span><a href="${website}" style="color:${accentColor};text-decoration:none;font-weight:bold;">${website.replace(/^https?:\/\//, "")}</a></span>
      </div>
    </td>
  </tr>
</table>`;
  }, [fullName, jobTitle, company, email, phone, website, address, avatarUrl, template, fontFamily, accentColor]);

  const copyRichSignature = async () => {
    try {
      if (typeof window !== "undefined" && window.ClipboardItem && navigator.clipboard) {
        const blobHtml = new Blob([signatureHtml], { type: "text/html" });
        const blobText = new Blob([`${fullName}\n${jobTitle} | ${company}\n${email} | ${phone}`], { type: "text/plain" });
        await navigator.clipboard.write([
          new window.ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
        setCopiedRich(true);
        setTimeout(() => setCopiedRich(false), 2000);
      } else {
        copyToClipboard(signatureHtml, setCopiedHtml);
      }
    } catch {
      copyToClipboard(signatureHtml, setCopiedHtml);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Form Controls */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <h2 className="text-base font-bold text-ink">Personal & Business Details</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Job Title</label>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Company Name</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Email Address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Website URL</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Avatar / Photo URL (Optional)</label>
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className={inputClass} />
          </div>

          {/* Template Selection */}
          <div className="space-y-2 border-t border-line pt-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Choose Signature Template</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "professional", label: "Professional" },
                { id: "minimal", label: "Minimal" },
                { id: "business", label: "Business" },
                { id: "executive", label: "Executive" },
                { id: "modern", label: "Modern Card" },
                { id: "compact", label: "Compact Inline" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id as any)}
                  className={`rounded-xl border p-2 text-xs font-bold transition ${
                    template === t.id ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Selection */}
          <div className="grid gap-3 sm:grid-cols-2 border-t border-line pt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Email-Safe Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className={inputClass}
              >
                <option value="Arial, sans-serif">Arial (Standard Sans)</option>
                <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                <option value="Verdana, Geneva, sans-serif">Verdana</option>
                <option value="Georgia, serif">Georgia (Classic Serif)</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-12 rounded-lg border border-line bg-white p-1 cursor-pointer"
                />
                <input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Email Client Preview */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted">Email Client Preview</span>
              <span className="rounded-md border border-line bg-pale px-2 py-0.5 text-[10px] font-bold text-muted">
                100% Inline CSS
              </span>
            </div>

            {/* Email Message Window Simulation */}
            <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
              <div className="bg-pale border-b border-line p-3 text-xs text-muted space-y-1 font-sans">
                <div><strong>To:</strong> partner@example.com</div>
                <div><strong>Subject:</strong> Quick follow-up on project deliverables</div>
              </div>

              <div className="p-5 space-y-4 text-sm text-ink font-sans">
                <p>Hi team,</p>
                <p>Thank you for the productive discussion earlier today. Everything is on track for our upcoming release.</p>
                <p>Best regards,</p>

                {/* Rendered Signature */}
                <div
                  className="pt-2"
                  dangerouslySetInnerHTML={{ __html: signatureHtml }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={copyRichSignature}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                {copiedRich ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedRich ? "Copied Formatted Signature!" : "Copy Formatted Signature (Paste into Gmail / Outlook)"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(signatureHtml, setCopiedHtml)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-ink hover:bg-pale transition"
                >
                  {copiedHtml ? <Check size={13} /> : <FileText size={13} />}
                  {copiedHtml ? "Copied HTML!" : "Copy HTML Code"}
                </button>

                <button
                  type="button"
                  onClick={() => downloadFile(signatureHtml, "email-signature.html", "text/html")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-ink hover:bg-pale transition"
                >
                  <Download size={13} />
                  Download HTML
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-pale/50 p-3 text-[11px] text-muted space-y-1">
              <strong>Installation Tip:</strong> Click <em>&ldquo;Copy Formatted Signature&rdquo;</em> and paste directly into your email client&apos;s signature settings (Gmail &gt; Settings &gt; General &gt; Signature; Outlook &gt; Signatures).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #98 — QR Business Card Generator
// ─────────────────────────────────────────────────────────────────────────────
export function QrBusinessCardWorkspace() {
  const [firstName, setFirstName] = useState("Sarah");
  const [lastName, setLastName] = useState("Connor");
  const [title, setTitle] = useState("Chief Technology Officer");
  const [org, setOrg] = useState("Cyberdyne Innovations");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [email, setEmail] = useState("sarah@cyberdyne.io");
  const [url, setUrl] = useState("https://cyberdyne.io");
  const [street, setStreet] = useState("100 Innovation Way");
  const [city, setCity] = useState("San Francisco");
  const [region, setRegion] = useState("CA");
  const [postalCode, setPostalCode] = useState("94105");
  const [country, setCountry] = useState("USA");
  const [note, setNote] = useState("Connect for enterprise partnerships & advisory.");

  // QR Customizations
  const [fgColor, setFgColor] = useState("#111111");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrSize, setQrSize] = useState(300);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedVcard, setCopiedVcard] = useState(false);

  // Standard vCard 3.0 format
  const vcardString = useMemo(() => {
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${firstName} ${lastName}`,
      org ? `ORG:${org};` : "",
      title ? `TITLE:${title}` : "",
      phone ? `TEL;TYPE=WORK,VOICE:${phone}` : "",
      email ? `EMAIL;TYPE=PREF,INTERNET:${email}` : "",
      url ? `URL:${url}` : "",
      street || city ? `ADR;TYPE=WORK:;;${street};${city};${region};${postalCode};${country}` : "",
      note ? `NOTE:${note}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\n");
  }, [firstName, lastName, title, org, phone, email, url, street, city, region, postalCode, country, note]);

  useEffect(() => {
    QRCode.toDataURL(
      vcardString,
      {
        width: qrSize,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: "H",
      },
      (err, dataUri) => {
        if (!err && dataUri) setQrDataUrl(dataUri);
      }
    );
  }, [vcardString, qrSize, fgColor, bgColor]);

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-vcard-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    QRCode.toString(
      vcardString,
      {
        type: "svg",
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: "H",
      },
      (err, svgString) => {
        if (!err && svgString) {
          downloadFile(svgString, `${firstName.toLowerCase()}-${lastName.toLowerCase()}-vcard-qr.svg`, "image/svg+xml");
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Form Inputs */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <h2 className="text-base font-bold text-ink">vCard Contact Information</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">First Name*</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Last Name*</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Job Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Company / Organization</label>
              <input value={org} onChange={(e) => setOrg(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Email Address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Website URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Street Address</label>
              <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">City & State</label>
              <input
                value={`${city}${region ? `, ${region}` : ""}`}
                onChange={(e) => {
                  const parts = e.target.value.split(",");
                  setCity(parts[0]?.trim() || "");
                  if (parts[1]) setRegion(parts[1]?.trim() || "");
                }}
                className={inputClass}
              />
            </div>
          </div>

          {/* QR Style Options */}
          <div className="grid gap-3 sm:grid-cols-3 border-t border-line pt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">QR Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-line p-0.5 cursor-pointer"
                />
                <input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Background</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-9 w-9 rounded-lg border border-line p-0.5 cursor-pointer"
                />
                <input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">QR Size ({qrSize}px)</label>
              <input
                type="range"
                min="200"
                max="600"
                step="50"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                className="w-full mt-3 accent-ink"
              />
            </div>
          </div>
        </div>

        {/* Live QR & Card Preview */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5 text-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand">Live Scannable QR Code</span>

            {/* QR Viewport */}
            <div className="flex justify-center p-3">
              {qrDataUrl ? (
                <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                  <img src={qrDataUrl} alt="vCard QR Code" className="h-56 w-56 object-contain" />
                </div>
              ) : (
                <div className="h-56 w-56 animate-pulse rounded-2xl bg-pale" />
              )}
            </div>

            <div className="text-xs text-muted">
              Scanning this QR automatically opens the contact card on iOS &amp; Android.
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                <Download size={14} />
                Download PNG
              </button>

              <button
                type="button"
                onClick={handleDownloadSvg}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-ink hover:bg-pale transition"
              >
                <Download size={14} />
                Download Vector SVG
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(vcardString, setCopiedVcard)}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-muted hover:border-ink hover:text-ink transition"
              >
                {copiedVcard ? <Check size={14} /> : <Copy size={14} />}
                {copiedVcard ? "Copied" : "Copy vCard"}
              </button>
            </div>

            {/* Advice Callout */}
            <div className="rounded-xl border border-line bg-pale/50 p-3 text-[11px] text-muted text-left">
              <strong>Printing Tip:</strong> Always test-scan the generated QR code on a physical phone screen before submitting your business cards to a print vendor.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #99 — YouTube Description Formatter
// ─────────────────────────────────────────────────────────────────────────────
export function YouTubeDescriptionFormatterWorkspace() {
  const [title, setTitle] = useState("Build Modern Web Apps with ToolModeOn — Full 2026 Walkthrough");
  const [intro, setIntro] = useState("In this video, we explore the brand new Social Media & Marketing tool suite. Learn how to format Instagram bios, generate viral hashtags, and preview posts across all networks before publishing.");
  const [timestamps, setTimestamps] = useState(
    "00:00 Intro & Overview\n01:30 YouTube Thumbnail Downloader\n04:15 YouTube Channel Banner Resizer\n08:00 Instagram Bio Formatter\n12:45 Hashtag Generator\n16:20 Social Media Post Preview\n20:10 Final Tips & Wrap Up"
  );
  const [resources, setResources] = useState(
    "🔗 Platform Link: https://toolmodeon.online\n📦 GitHub Repository: https://github.com/toolmodeon\n📄 Official Documentation: https://toolmodeon.online/docs"
  );
  const [socials, setSocials] = useState(
    "🐦 Twitter/X: https://x.com/toolmodeon\n📷 Instagram: https://instagram.com/toolmodeon\n💼 LinkedIn: https://linkedin.com/company/toolmodeon"
  );
  const [hashtags, setHashtags] = useState("#ToolModeOn #WebDev #MarketingTools");
  const [disclaimer, setDisclaimer] = useState("DISCLAIMER: Some of the links above may be affiliate links, meaning we may earn a small commission at no additional cost to you.");
  const [copied, setCopied] = useState(false);

  // Compile final YouTube description
  const fullDescription = useMemo(() => {
    const parts = [
      title ? `${title.toUpperCase()}\n` : "",
      intro ? `${intro}\n` : "",
      timestamps ? `TIMESTAMPS / CHAPTERS:\n${timestamps}\n` : "",
      resources ? `RESOURCES & LINKS MENTIONED:\n${resources}\n` : "",
      socials ? `CONNECT WITH US:\n${socials}\n` : "",
      hashtags ? `${hashtags}\n` : "",
      disclaimer ? `───────────────────────────────\n${disclaimer}` : "",
    ];
    return parts.filter(Boolean).join("\n").trim();
  }, [title, intro, timestamps, resources, socials, hashtags, disclaimer]);

  const charCount = fullDescription.length;
  const isOverLimit = charCount > 5000;

  const templates = [
    {
      name: "Tutorial / How-To",
      title: "How to Build High-Performance Tools in 2026",
      intro: "A step-by-step masterclass covering client-side architectures, offline processing, and modern UI engineering.",
      timestamps: "00:00 Introduction\n02:15 Architecture Setup\n06:40 Implementing Core Features\n14:20 Testing & Verification\n18:00 Conclusion",
    },
    {
      name: "Product Review",
      title: "ToolModeOn In-Depth Review: Is It Really 100% Free?",
      intro: "We tested every single feature on ToolModeOn to see how it stacks up against paid alternatives.",
      timestamps: "00:00 First Impressions\n03:10 PDF & Image Suite\n07:45 SEO & Social Tools\n11:30 Speed Benchmarks\n15:00 Final Verdict",
    },
    {
      name: "Podcast / Interview",
      title: "Episode #42: The Future of Developer Utilities with Alex Morgan",
      intro: "In this episode, we sit down with founders building privacy-first developer platforms for everyday workflows.",
      timestamps: "00:00 Welcome Guest\n05:30 Why Privacy Matters\n18:20 Monolith vs Micro-tools\n32:10 Audience Q&A",
    },
    {
      name: "Gaming",
      title: "Ultimate 4K Ultra Settings Benchmark & Gameplay",
      intro: "Testing real-world frame rates, ray tracing, and temperature metrics on the latest flagship GPU.",
      timestamps: "00:00 Benchmark Specs\n04:00 Cyberpunk 2077\n09:30 Warzone 4K\n14:00 Thermals & Noise",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Sections */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Description Builder</h2>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${isOverLimit ? "text-rose-600" : "text-muted"}`}>
                {charCount} / 5,000 chars
              </span>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Load Preset Template</span>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => {
                    setTitle(tpl.title);
                    setIntro(tpl.intro);
                    setTimestamps(tpl.timestamps);
                  }}
                  className="rounded-lg border border-line bg-pale px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink hover:bg-white transition"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Video Title / Headline</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Introduction / Summary</label>
            <textarea
              rows={3}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              className="w-full rounded-xl border border-line bg-pale/50 p-3 text-xs text-ink outline-none transition focus:border-ink focus:bg-white resize-y"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Timestamps / Chapters</label>
              <span className="text-[10px] text-muted">Must start at 00:00 for YouTube</span>
            </div>
            <textarea
              rows={4}
              value={timestamps}
              onChange={(e) => setTimestamps(e.target.value)}
              className="w-full rounded-xl border border-line bg-pale/50 p-3 font-mono text-xs text-ink outline-none transition focus:border-ink focus:bg-white resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Resources & Links Mentioned</label>
            <textarea
              rows={3}
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              className="w-full rounded-xl border border-line bg-pale/50 p-3 text-xs text-ink outline-none transition focus:border-ink focus:bg-white resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">Social Media & Contact Links</label>
            <textarea
              rows={3}
              value={socials}
              onChange={(e) => setSocials(e.target.value)}
              className="w-full rounded-xl border border-line bg-pale/50 p-3 text-xs text-ink outline-none transition focus:border-ink focus:bg-white resize-y"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Top 3 Hashtags</label>
              <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Affiliate / Legal Disclaimer</label>
              <input value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Live Preview Viewport */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Youtube size={18} className="text-rose-600" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-ink">YouTube Plain-Text Output</span>
              </div>
              <span className="rounded-md border border-line bg-pale px-2 py-0.5 text-[10px] font-bold text-muted">
                {charCount} / 5000 chars
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-pale/40 p-4 font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
              {fullDescription}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(fullDescription, setCopied)}
                className="flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Description Copied!" : "Copy Description"}
              </button>

              <button
                type="button"
                onClick={() => downloadFile(fullDescription, "youtube-description.txt")}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-ink hover:bg-pale transition"
              >
                <Download size={14} />
                Download .txt File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #100 — Social Media Character Counter
// ─────────────────────────────────────────────────────────────────────────────
export function SocialMediaCharacterCounterWorkspace() {
  const [text, setText] = useState(
    "Supercharge your content workflow with ToolModeOn's new Social Media & Marketing tools! 🚀 Fast, client-side, and privacy-conscious utilities for every creator."
  );
  const [selectedPlatform, setSelectedPlatform] = useState<string>("instagram");
  const [copied, setCopied] = useState(false);

  // Central platform limits configuration (Verified November 2026)
  const platformLimitsConfig = useMemo(() => {
    return [
      {
        id: "instagram",
        name: "Instagram",
        limits: [
          { name: "Caption Max", limit: 2200, trunc: 125, desc: "Captions truncate in feed at ~125 chars" },
          { name: "Bio", limit: 150, trunc: 150, desc: "Profile biography character limit" },
          { name: "Hashtags Allowed", limit: 30, trunc: 30, isTagCount: true, desc: "Max 30 hashtags per post" },
        ],
      },
      {
        id: "x",
        name: "X (Twitter)",
        limits: [
          { name: "Standard Post", limit: 280, trunc: 280, desc: "Standard free account tweet limit" },
          { name: "Premium Post", limit: 25000, trunc: 280, desc: "Long-form subscriber post limit" },
          { name: "Profile Bio", limit: 160, trunc: 160, desc: "Account profile bio" },
          { name: "Direct Message", limit: 10000, trunc: 10000, desc: "DM conversation limit" },
        ],
      },
      {
        id: "facebook",
        name: "Facebook",
        limits: [
          { name: "Feed Post", limit: 63206, trunc: 250, desc: "Truncates in feed behind 'See More' at ~250 chars" },
          { name: "Page About", limit: 255, trunc: 255, desc: "Short page description" },
          { name: "Comment", limit: 8000, trunc: 8000, desc: "Single comment character limit" },
        ],
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        limits: [
          { name: "Post Update", limit: 3000, trunc: 210, desc: "Truncates in feed behind '...see more' at ~210 chars" },
          { name: "Profile Headline", limit: 220, trunc: 220, desc: "Headline below name" },
          { name: "About / Summary", limit: 2600, trunc: 2600, desc: "Profile summary section" },
          { name: "Article Title", limit: 100, trunc: 100, desc: "LinkedIn pulse article title" },
        ],
      },
      {
        id: "youtube",
        name: "YouTube",
        limits: [
          { name: "Video Title", limit: 100, trunc: 70, desc: "Truncates in search cards after ~70 chars" },
          { name: "Video Description", limit: 5000, trunc: 150, desc: "Full description limit" },
          { name: "Channel Bio", limit: 1000, trunc: 1000, desc: "Channel about section" },
          { name: "Video Tags", limit: 500, trunc: 500, desc: "Comma-separated tag metadata" },
        ],
      },
      {
        id: "pinterest",
        name: "Pinterest",
        limits: [
          { name: "Pin Title", limit: 100, trunc: 100, desc: "Appears on pin view" },
          { name: "Pin Description", limit: 500, trunc: 50, desc: "Feed preview shows first 50-60 chars" },
        ],
      },
      {
        id: "tiktok",
        name: "TikTok",
        limits: [
          { name: "Video Caption", limit: 2200, trunc: 150, desc: "Video description & hashtags" },
          { name: "Profile Bio", limit: 80, trunc: 80, desc: "Account biography limit" },
        ],
      },
    ];
  }, []);

  // Text statistics
  const stats = useMemo(() => {
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s+/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.length ? text.split(/\r\n|\r|\n/).length : 0;
    const paragraphs = text.length ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
    const readingTimeSec = Math.ceil((words / 200) * 60);
    const speakingTimeSec = Math.ceil((words / 130) * 60);

    return {
      charsWithSpaces,
      charsNoSpaces,
      words,
      lines,
      paragraphs,
      readingTimeSec,
      speakingTimeSec,
    };
  }, [text]);

  const currentPlatformObj = platformLimitsConfig.find((p) => p.id === selectedPlatform) || platformLimitsConfig[0];

  return (
    <div className="space-y-6">
      {/* Metrics Header Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Characters", value: stats.charsWithSpaces },
          { label: "No Spaces", value: stats.charsNoSpaces },
          { label: "Words", value: stats.words },
          { label: "Lines", value: stats.lines },
          { label: "Reading Time", value: `${stats.readingTimeSec}s` },
          { label: "Speaking Time", value: `${stats.speakingTimeSec}s` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-white p-4 shadow-soft text-center">
            <div className="text-xl font-black text-ink">{item.value}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Editor & Platforms Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Editor Box */}
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Text Input</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText("")}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-muted hover:border-ink hover:text-ink"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your post text here to inspect character counts and platform limits..."
            className="w-full rounded-2xl border border-line bg-pale/40 p-4 text-sm text-ink outline-none transition focus:border-ink focus:bg-white resize-y font-sans"
          />

          {/* Quick Case & Transform Tools */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-xs font-bold text-muted">Quick Transforms:</span>
            <button
              type="button"
              onClick={() => setText(text.toUpperCase())}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-pale"
            >
              UPPERCASE
            </button>
            <button
              type="button"
              onClick={() => setText(text.toLowerCase())}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-pale"
            >
              lowercase
            </button>
            <button
              type="button"
              onClick={() =>
                setText(
                  text.replace(
                    /\w\S*/g,
                    (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()
                  )
                )
              }
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-pale"
            >
              Title Case
            </button>
            <button
              type="button"
              onClick={() => setText(text.replace(/[ \t]+/g, " ").trim())}
              className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-pale"
            >
              Trim Extra Spaces
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => copyToClipboard(text, setCopied)}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy Text"}
            </button>
          </div>
        </div>

        {/* Platform Limits Inspector */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand">Platform Limits Comparison</span>
              <p className="text-xs text-muted mt-1">Verified limits for major social platforms (Updated Nov 2026).</p>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
              {platformLimitsConfig.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedPlatform === p.id
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Selected Platform Cards */}
            <div className="space-y-3">
              {currentPlatformObj.limits.map((lim) => {
                const used = lim.isTagCount ? (text.match(/#[a-zA-Z0-9_]+/g) || []).length : stats.charsWithSpaces;
                const remaining = lim.limit - used;
                const isOver = remaining < 0;
                const pct = Math.min(100, Math.round((used / lim.limit) * 100));
                const willTruncate = !isOver && used > lim.trunc && lim.trunc < lim.limit;

                return (
                  <div key={lim.name} className="rounded-2xl border border-line bg-pale/30 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-ink">{lim.name}</span>
                        <p className="text-[11px] text-muted">{lim.desc}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isOver ? "bg-rose-100 text-rose-700 font-mono" : "bg-pale border border-line text-ink font-mono"
                          }`}
                        >
                          {isOver ? `${Math.abs(remaining)} over` : `${remaining} left`}
                        </span>
                        <div className="text-[10px] text-muted mt-0.5 font-mono">
                          {used} / {lim.limit}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOver ? "bg-rose-500" : pct > 85 ? "bg-amber-500" : "bg-ink"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {willTruncate && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle size={12} className="shrink-0" />
                        <span>Visible before truncation: first {lim.trunc} characters</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SOCIAL TOOL DISPATCHER WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
export function SocialToolWorkspace({
  tool,
}: {
  tool: Pick<Tool, "slug" | "name" | "description" | "category" | "pro">;
}) {
  if (tool.slug === "youtube-thumbnail-downloader") return <YouTubeThumbnailDownloaderWorkspace />;
  if (tool.slug === "youtube-banner-resizer") return <YouTubeBannerResizerWorkspace />;
  if (tool.slug === "instagram-bio-formatter") return <InstagramBioFormatterWorkspace />;
  if (tool.slug === "hashtag-generator") return <HashtagGeneratorWorkspace />;
  if (tool.slug === "social-media-post-preview") return <SocialMediaPostPreviewWorkspace />;
  if (tool.slug === "utm-campaign-builder" || tool.slug === "utm-link-builder") return <UtmLinkBuilderWorkspace />;
  if (tool.slug === "email-signature-generator") return <EmailSignatureGeneratorWorkspace />;
  if (tool.slug === "qr-business-card-generator") return <QrBusinessCardWorkspace />;
  if (tool.slug === "youtube-description-formatter") return <YouTubeDescriptionFormatterWorkspace />;
  if (tool.slug === "social-media-character-counter") return <SocialMediaCharacterCounterWorkspace />;

  return null;
}

