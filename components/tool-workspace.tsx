"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileUp, LockKeyhole, Sparkles, UploadCloud } from "lucide-react";
// JSZip and pdf-lib are dynamically imported where needed to avoid loading ~520KB eagerly
import type { NumberingOptions, PdfInspection, ProtectOptions, TextExtractionOptions, WatermarkOptions } from "../lib/pdf-processing";
import type { Tool } from "../lib/tools";
import { ToolResults, type ResultFile, type ToolResult } from "./tool-results";

const PdfToolSettings = dynamic(
  () => import("./pdf-tool-settings").then((module) => module.PdfToolSettings),
  { loading: () => <div className="mt-4 h-40 animate-pulse rounded-2xl border border-line bg-pale" aria-hidden="true" /> }
);

const UtilityToolWorkspace = dynamic(
  () => import("./utility-tools").then((module) => module.UtilityToolWorkspace),
  { loading: () => <div className="mt-4 h-64 animate-pulse rounded-3xl border border-line bg-pale" aria-hidden="true" /> }
);

const DeveloperToolWorkspace = dynamic(
  () => import("./developer-tools").then((module) => module.DeveloperToolWorkspace),
  { loading: () => <div className="mt-4 h-64 animate-pulse rounded-3xl border border-line bg-pale" aria-hidden="true" /> }
);

const SeoToolWorkspace = dynamic(
  () => import("./seo-tools").then((module) => module.SeoToolWorkspace),
  { loading: () => <div className="mt-4 h-64 animate-pulse rounded-3xl border border-line bg-pale" aria-hidden="true" /> }
);

const SocialToolWorkspace = dynamic(
  () => import("./social-tools").then((module) => module.SocialToolWorkspace),
  { loading: () => <div className="mt-4 h-64 animate-pulse rounded-3xl border border-line bg-pale" aria-hidden="true" /> }
);

const inputClass = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-1 focus:ring-ink";
type Status = "idle" | "checking" | "processing" | "success" | "error";
type ToolAccess = {
  authenticated?: boolean;
  plan?: { key: string; max_file_bytes: number; max_batch_files: number };
  tools?: Array<{ slug: string; enabled: boolean; required_plan: string; max_file_bytes: number; max_batch_files: number }>;
};
const newPdfTools = ["pdf-watermark", "pdf-page-numbering", "protect-pdf", "unlock-pdf", "pdf-to-text"];
const initialWatermark: WatermarkOptions = { content: "text", text: "CONFIDENTIAL", font: "Helvetica", bold: true, italic: false, fontSize: 48, color: "#7C3AED", opacity: 0.3, rotation: -45, position: "diagonal-center", margin: 36, repeat: false, scope: "all", pageRanges: "1", imageSize: 140 };
const initialNumbering: NumberingOptions = { position: "bottom-center", format: "plain", font: "Helvetica", bold: false, fontSize: 11, color: "#1F2937", prefix: "", suffix: "", margin: 28, startingNumber: 1, startingPdfPage: 1, skipCover: false, skipPages: "", scope: "all", pageRanges: "1" };
const initialPermissions = { printing: true, copying: true, editing: true, annotations: true, formFilling: true };

export function ToolWorkspace({ tool }: { tool: Pick<Tool, "slug" | "name" | "description" | "category" | "pro"> }) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ToolResult | null>(null);
  const [historyId, setHistoryId] = useState("");
  const historyPromiseRef = useRef<Promise<string | null> | null>(null);
  const toolAccessRef = useRef<{ slug: string; promise: Promise<ToolAccess>; fetchedAt: number } | null>(null);
  const aiRequestIdRef = useRef<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [text2, setText2] = useState("");
  const [number, setNumber] = useState("10000");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("5");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("175");
  const [dob, setDob] = useState("1995-06-15");
  const [percentageMode, setPercentageMode] = useState("of");
  const [downPayment, setDownPayment] = useState("0");
  const [tone, setTone] = useState("Professional");
  const [caseMode, setCaseMode] = useState("title");
  const [sortDuplicateLines, setSortDuplicateLines] = useState(false);
  const [quality, setQuality] = useState("0.8");
  const [compressionLevel, setCompressionLevel] = useState<"low" | "medium" | "high">("medium");
  const [pdfImageFormat, setPdfImageFormat] = useState<"jpg" | "png">("jpg");
  const [targetWidth, setTargetWidth] = useState("1200");
  const [targetHeight, setTargetHeight] = useState("800");
  const [pdfInspection, setPdfInspection] = useState<PdfInspection | null>(null);
  const [pdfFileIssue, setPdfFileIssue] = useState("");
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>(initialWatermark);
  const [numberingOptions, setNumberingOptions] = useState<NumberingOptions>(initialNumbering);
  const [protectPassword, setProtectPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockAuthorized, setUnlockAuthorized] = useState(false);
  const [sourcePassword, setSourcePassword] = useState("");
  const [protectPermissions, setProtectPermissions] = useState(initialPermissions);
  const [textOptions, setTextOptions] = useState<TextExtractionOptions>({ scope: "all", pageRanges: "1", preserveLineBreaks: true, cleanSpaces: true, pageSeparators: true });

  // ── New image tool state ────────────────────────────────────────────────
  const [imageRotation, setImageRotation] = useState(0);
  const [imageFlipH, setImageFlipH] = useState(false);
  const [imageFlipV, setImageFlipV] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgMode, setBgMode] = useState<"transparent" | "white" | "black" | "custom">("transparent");
  const [blurIntensity, setBlurIntensity] = useState(10);
  const [upscaleFactor, setUpscaleFactor] = useState<"2" | "4">("2");
  const [wmText, setWmText] = useState("© ToolModeOn");
  const [wmFontSize, setWmFontSize] = useState(32);
  const [wmColor, setWmColor] = useState("#ffffff");
  const [wmOpacity, setWmOpacity] = useState(0.6);
  const [wmPosition, setWmPosition] = useState("bottom-right");
  const [wmRotation, setWmRotation] = useState(0);
  const [wmBold, setWmBold] = useState(false);
  const [wmItalic, setWmItalic] = useState(false);
  const [wmType, setWmType] = useState<"text" | "image">("text");
  const [wmLogoFile, setWmLogoFile] = useState<File | null>(null);
  const [wmLogoSize, setWmLogoSize] = useState(120);
  const [enhBrightness, setEnhBrightness] = useState(100);
  const [enhContrast, setEnhContrast] = useState(100);
  const [enhSaturation, setEnhSaturation] = useState(100);
  const [enhSharpness, setEnhSharpness] = useState(0);
  const [enhTemperature, setEnhTemperature] = useState(0);
  const [enhPreset, setEnhPreset] = useState("none");

  // ── Live image preview state ───────────────────────────────────────────
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [showEnhOriginal, setShowEnhOriginal] = useState(false);

  useEffect(() => {
    const file = selectedFiles[0];
    if (!file || !file.type.startsWith("image/")) {
      setPreviewImage(null);
      setPreviewDims({ width: 0, height: 0 });
      return;
    }
    let active = true;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      setPreviewImage(img);
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [selectedFiles]);

  useEffect(() => {
    if (!wmLogoFile) {
      setLogoImage(null);
      return;
    }
    let active = true;
    const url = URL.createObjectURL(wmLogoFile);
    const img = new Image();
    img.onload = () => {
      if (active) setLogoImage(img);
    };
    img.src = url;
    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [wmLogoFile]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !previewImage) return;

    const animId = requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxDim = 800;
      const origW = previewImage.naturalWidth || previewImage.width;
      const origH = previewImage.naturalHeight || previewImage.height;
      const scale = Math.min(1, maxDim / Math.max(origW, origH));
      const sw = Math.max(1, Math.round(origW * scale));
      const sh = Math.max(1, Math.round(origH * scale));

      if (tool.slug === "image-rotator-flipper") {
        const rad = (imageRotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const cw = Math.max(1, Math.round(sw * cos + sh * sin));
        const ch = Math.max(1, Math.round(sw * sin + sh * cos));
        canvas.width = cw;
        canvas.height = ch;
        ctx.clearRect(0, 0, cw, ch);
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        if (imageFlipH) ctx.scale(-1, 1);
        if (imageFlipV) ctx.scale(1, -1);
        ctx.rotate(rad);
        ctx.drawImage(previewImage, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
      } else if (tool.slug === "image-watermark") {
        canvas.width = sw;
        canvas.height = sh;
        ctx.clearRect(0, 0, sw, sh);
        ctx.drawImage(previewImage, 0, 0, sw, sh);
        ctx.globalAlpha = wmOpacity;
        if (wmType === "image" && logoImage) {
          const lw = Math.round(wmLogoSize * scale);
          const lh = Math.round((logoImage.naturalHeight / logoImage.naturalWidth) * lw);
          const [lx, ly] = getWmPos(wmPosition, sw, sh, lw, lh, 16);
          ctx.save();
          ctx.translate(lx + lw / 2, ly + lh / 2);
          ctx.rotate((wmRotation * Math.PI) / 180);
          ctx.drawImage(logoImage, -lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        } else if (wmText) {
          const scaledFontSize = Math.max(10, Math.round(wmFontSize * scale));
          const style = `${wmBold ? "bold " : ""}${wmItalic ? "italic " : ""}${scaledFontSize}px sans-serif`;
          ctx.font = style;
          ctx.fillStyle = wmColor;
          const tm = ctx.measureText(wmText);
          const tw = tm.width;
          const th = scaledFontSize;
          const [tx, ty] = getWmPos(wmPosition, sw, sh, tw, th, 16);
          ctx.save();
          ctx.translate(tx + tw / 2, ty + th / 2);
          const rot = wmPosition === "diagonal-center" && wmRotation === 0 ? -45 : wmRotation;
          ctx.rotate((rot * Math.PI) / 180);
          ctx.fillText(wmText, -tw / 2, th / 2);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      } else if (tool.slug === "image-enhancer") {
        canvas.width = sw;
        canvas.height = sh;
        ctx.clearRect(0, 0, sw, sh);

        if (showEnhOriginal) {
          ctx.filter = "none";
          ctx.drawImage(previewImage, 0, 0, sw, sh);
        } else {
          let b = enhBrightness;
          let c = enhContrast;
          let s = enhSaturation;
          let temp = enhTemperature;
          let sharp = enhSharpness;

          if (enhPreset === "bright") { b = 120; c = 110; s = 105; }
          else if (enhPreset === "vivid") { b = 108; c = 115; s = 140; }
          else if (enhPreset === "natural") { b = 103; c = 105; s = 110; }
          else if (enhPreset === "soft") { b = 108; c = 95; s = 90; }
          else if (enhPreset === "bw") { s = 0; }
          else if (enhPreset === "auto") {
            ctx.drawImage(previewImage, 0, 0, sw, sh);
            const autoVals = analyzeImageHistogram(ctx, sw, sh);
            b = autoVals.brightness;
            c = autoVals.contrast;
            s = autoVals.saturation;
            sharp = autoVals.sharpness;
            ctx.clearRect(0, 0, sw, sh);
          }

          ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
          ctx.drawImage(previewImage, 0, 0, sw, sh);
          ctx.filter = "none";

          if (temp !== 0) {
            applyTemperature(ctx, sw, sh, temp);
          }
          if (sharp > 0) {
            applySharpness(ctx, sw, sh, sharp);
          }
        }
      } else if (["image-cropper", "image-resizer", "jpg-to-png", "png-to-webp"].includes(tool.slug)) {
        canvas.width = sw;
        canvas.height = sh;
        ctx.clearRect(0, 0, sw, sh);
        ctx.drawImage(previewImage, 0, 0, sw, sh);
      }
    });

    return () => cancelAnimationFrame(animId);
  }, [
    previewImage,
    logoImage,
    imageRotation,
    imageFlipH,
    imageFlipV,
    wmType,
    wmText,
    wmFontSize,
    wmColor,
    wmBold,
    wmItalic,
    wmOpacity,
    wmRotation,
    wmPosition,
    wmLogoSize,
    enhPreset,
    enhBrightness,
    enhContrast,
    enhSaturation,
    enhSharpness,
    enhTemperature,
    showEnhOriginal,
    tool.slug,
  ]);

  const rotatedDims = useMemo(() => {
    if (!previewDims.width || !previewDims.height) return { width: 0, height: 0 };
    const rad = (imageRotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    return {
      width: Math.round(previewDims.width * cos + previewDims.height * sin),
      height: Math.round(previewDims.width * sin + previewDims.height * cos),
    };
  }, [previewDims, imageRotation]);

  const isTextTool = ["word-counter", "character-counter", "case-converter", "remove-duplicate-lines", "text-diff-checker"].includes(tool.slug);
  const isCalculator = ["age-calculator", "percentage-calculator", "bmi-calculator", "loan-calculator", "mortgage-calculator"].includes(tool.slug);
  const isAi = tool.category === "AI";
  const isFileTool = !isTextTool && !isCalculator && !isAi;
  const isNewPdfTool = newPdfTools.includes(tool.slug);
  const newImageTools = ["background-remover","background-blur","image-upscaler","image-rotator-flipper","image-watermark","image-enhancer"];
  const isNewImageTool = newImageTools.includes(tool.slug);

  const instantToolAccess = useMemo<ToolAccess>(() => ({
    authenticated: false,
    plan: { key: "free", max_file_bytes: 50 * 1024 * 1024, max_batch_files: 20 },
    tools: [{ slug: tool.slug, enabled: true, required_plan: "free", max_file_bytes: 50 * 1024 * 1024, max_batch_files: 20 }]
  }), [tool.slug]);

  function loadToolAccess(): Promise<ToolAccess> {
    return Promise.resolve(instantToolAccess);
  }

  const statsText = useDeferredValue(text);
  const words = useMemo(() => {
    if (tool.slug !== "word-counter" && tool.slug !== "character-counter") return 0;
    const trimmed = statsText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [statsText, tool.slug]);
  const statLine = tool.slug === "word-counter" ? `${words} words · ${statsText.length} characters · ${statsText.split(/[.!?]+/).filter(Boolean).length} sentences` : tool.slug === "character-counter" ? `${statsText.length} characters · ${statsText.replace(/\s/g, "").length} without spaces · ${words} words` : null;

  function reset() {
    setStatus("idle"); setProgress(0); setError(""); setResult(null); setHistoryId(""); historyPromiseRef.current = null; aiRequestIdRef.current = null; setSelectedFiles([]); setText(""); setText2(""); setPdfInspection(null); setPdfFileIssue(""); setWatermarkImage(null); setProtectPassword(""); setConfirmPassword(""); setOwnerPassword(""); setUnlockPassword(""); setUnlockAuthorized(false); setSourcePassword("");
    setImageRotation(0); setImageFlipH(false); setImageFlipV(false); setBgColor("#ffffff"); setBgMode("transparent"); setBlurIntensity(10); setUpscaleFactor("2"); setWmText("© ToolModeOn"); setWmFontSize(32); setWmColor("#ffffff"); setWmOpacity(0.6); setWmPosition("bottom-right"); setWmRotation(0); setWmBold(false); setWmItalic(false); setWmType("text"); setWmLogoFile(null); setWmLogoSize(120); setEnhBrightness(100); setEnhContrast(100); setEnhSaturation(100); setEnhSharpness(0); setEnhTemperature(0); setEnhPreset("none");
    setPreviewImage(null); setLogoImage(null); setShowEnhOriginal(false); setPreviewDims({ width: 0, height: 0 });
  }

  async function chooseFiles(files: File[]) {
    const chosen = isNewPdfTool ? files.slice(0, 1) : files;
    setSelectedFiles(chosen); setPdfInspection(null); setPdfFileIssue(""); setError(""); setResult(null);
    if (!isNewPdfTool || !chosen[0]) return;
    const file = chosen[0];
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setPdfFileIssue("Choose a PDF file."); return; }
    try { const { inspectPdf } = await import("../lib/pdf-processing"); setPdfInspection(await inspectPdf(file)); }
    catch (cause) { setPdfFileIssue(cause instanceof Error ? cause.message : "This PDF could not be validated."); }
  }

  async function recordHistory(entryStatus: "completed" | "failed", requestId: string, output?: ToolResult): Promise<string | null> {
    try {
      const response = await fetch("/api/account/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        tool_slug: tool.slug, request_id: requestId, status: entryStatus, original_filename: selectedFiles[0]?.name || null,
        output_filename: output?.filename || null, output_mime_type: output?.mime || null, output_size_bytes: output?.blob?.size ?? output?.files?.[0]?.blob.size ?? null
      }) });
      if (response.ok) { const body = await response.json(); if (body.id) { setHistoryId(body.id); return body.id as string; } }
    } catch { /* Tool processing remains available if account history is temporarily unavailable. */ }
    return null;
  }

  async function runTool() {
    setError(""); setResult(null); setHistoryId(""); historyPromiseRef.current = null; setStatus("checking"); setProgress(0);
    const requestId = crypto.randomUUID(); aiRequestIdRef.current = null;
    try {
      const entitlementData: ToolAccess = await loadToolAccess().catch(() => ({}));
      const rule = entitlementData.tools?.find((item) => item.slug === tool.slug);
      if (rule && !rule.enabled) throw new Error("This tool is temporarily unavailable.");
      const maxFileBytes = rule?.max_file_bytes || 50 * 1024 * 1024;
      const maxBatchFiles = rule?.max_batch_files || 20;
      if (isFileTool && selectedFiles.some((file) => file.size > maxFileBytes)) throw new Error(`Each file must be ${formatBytes(maxFileBytes)} or smaller.`);
      if (isFileTool && selectedFiles.length > maxBatchFiles) throw new Error(`Maximum ${maxBatchFiles} file${maxBatchFiles === 1 ? "" : "s"} per batch.`);
      if (isNewPdfTool && tool.slug === "pdf-watermark" && watermarkImage && watermarkImage.size > maxFileBytes) throw new Error(`The watermark image must be ${formatBytes(maxFileBytes)} or smaller.`);
      setStatus("processing");
      const output = isFileTool ? await processFiles() : isCalculator ? await processCalculator() : isAi ? await processAi() : processText();
      if (isNewPdfTool) { setProtectPassword(""); setConfirmPassword(""); setOwnerPassword(""); setUnlockPassword(""); setUnlockAuthorized(false); setSourcePassword(""); }
      const historyRequestId = aiRequestIdRef.current || requestId;
      setProgress(100); setResult(output); setStatus("success"); historyPromiseRef.current = recordHistory("completed", historyRequestId, output);
    } catch (cause) {
      if (isNewPdfTool) { setProtectPassword(""); setConfirmPassword(""); setOwnerPassword(""); setUnlockPassword(""); setUnlockAuthorized(false); setSourcePassword(""); }
      const historyRequestId = aiRequestIdRef.current || requestId;
      setStatus("error"); setProgress(0); setError(cause instanceof Error ? cause.message : "We could not process that input. Please try again."); historyPromiseRef.current = recordHistory("failed", historyRequestId);
    }
  }

  function formatBytes(bytes: number) { return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.floor(bytes / 1024 / 1024))} MB`; }

  function processText(): ToolResult {
    if (!text.trim()) throw new Error("Add some text before processing.");
    let output = text;
    const wordCount = tool.slug === "word-counter" || tool.slug === "character-counter" ? (text.trim() ? text.trim().split(/\s+/).length : 0) : 0;
    if (tool.slug === "case-converter") {
      if (caseMode === "uppercase") output = text.toUpperCase();
      else if (caseMode === "lowercase") output = text.toLowerCase();
      else if (caseMode === "sentence") output = text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_, before, letter) => before + letter.toUpperCase());
      else if (caseMode === "toggle") output = Array.from(text).map((letter) => letter === letter.toUpperCase() ? letter.toLowerCase() : letter.toUpperCase()).join("");
      else output = text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
    if (tool.slug === "remove-duplicate-lines") { const lines = Array.from(new Set(text.split("\n").map((line) => line.trim()).filter(Boolean))); output = (sortDuplicateLines ? lines.sort((a, b) => a.localeCompare(b)) : lines).join("\n"); }
    if (tool.slug === "text-diff-checker") {
      if (text === text2) output = "No differences found.";
      else {
        const oldLines = text.split("\n"); const newLines = text2.split("\n");
        const oldLineSet = new Set(oldLines); const newLineSet = new Set(newLines);
        const removed = oldLines.filter((line) => !newLineSet.has(line));
        const added = newLines.filter((line) => !oldLineSet.has(line));
        output = [...removed.map((line) => `− ${line}`), ...added.map((line) => `+ ${line}`)].join("\n");
      }
    }
    if (tool.slug === "word-counter") output = `Word count: ${wordCount}\nCharacter count: ${text.length}\nCharacters without spaces: ${text.replace(/\s/g, "").length}\nSentence count: ${text.split(/[.!?]+/).filter(Boolean).length}\nParagraph count: ${text.split(/\n\s*\n/).filter(Boolean).length}\nReading time: ${Math.max(1, Math.ceil(wordCount / 200))} minute(s)`;
    if (tool.slug === "character-counter") output = `Characters: ${text.length}\nCharacters without spaces: ${text.replace(/\s/g, "").length}\nWords: ${wordCount}\nLines: ${text ? text.split("\n").length : 0}`;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    return { blob, filename: `${tool.slug}-result.txt`, mime: "text/plain", preview: output };
  }

  async function processAi(): Promise<ToolResult> {
    if (!text.trim()) throw new Error("Add a topic or source text before generating a result.");
    const response = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: tool.slug, input: text.trim(), tone }) });
    const payload = await response.json() as { output?: string; error?: string; request_id?: string };
    if(payload.request_id)aiRequestIdRef.current=payload.request_id;
    if (!response.ok || !payload.output) throw new Error(payload.error || "AI generation is unavailable. Please try again later.");
    const output = payload.output;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const files: ResultFile[] = [{ blob, filename: `${tool.slug}-result.txt`, mime: "text/plain" }];
    if (["ai-blog-title-generator", "seo-meta-description-generator"].includes(tool.slug)) {
      const csv = new Blob([["Result"].concat(output.split("\n").filter(Boolean)).map((line) => `"${line.replace(/^\d+\.\s*/, "").replaceAll('"', '""')}"`).join("\n")], { type: "text/csv;charset=utf-8" });
      files.push({ blob: csv, filename: `${tool.slug}-result.csv`, mime: "text/csv" });
    }
    return { blob, filename: `${tool.slug}-result.txt`, mime: "text/plain", preview: output, files, processingMode: "server", ...(files.length > 1 ? { downloadAll: await zipResultFiles(files), downloadAllFilename: `${tool.slug}-results.zip` } : {}) };
  }

  async function processCalculator(): Promise<ToolResult> {
    let output = "";
    if (tool.slug === "bmi-calculator") {
      const bmi = Number(weight) / ((Number(height) / 100) ** 2);
      if (!Number.isFinite(bmi) || bmi <= 0) throw new Error("Enter a valid weight and height.");
      const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy range" : bmi < 30 ? "Overweight" : "Obesity range";
      output = `BMI: ${bmi.toFixed(1)}\nCategory: ${category}\n\nBMI is a screening measure, not a diagnosis.`;
    } else if (["loan-calculator", "mortgage-calculator"].includes(tool.slug)) {
      const priceOrPrincipal = Number(number);
      const principal = tool.slug === "mortgage-calculator" ? priceOrPrincipal - Number(downPayment) : priceOrPrincipal;
      const monthlyRate = Number(rate) / 100 / 12; const months = Math.round(Number(years) * 12);
      if (principal <= 0 || months <= 0 || Number(rate) < 0 || Number(downPayment) < 0 || Number(downPayment) >= priceOrPrincipal) throw new Error("Enter valid loan values and a down payment below the property price.");
      const payment = monthlyRate === 0 ? principal / months : (principal * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
      const schedule = ["Month,Payment,Principal,Interest,Balance"];
      let balance = principal;
      for (let month = 1; month <= months; month++) { const interest = balance * monthlyRate; const principalPaid = Math.min(balance, payment - interest); balance = Math.max(0, balance - principalPaid); schedule.push(`${month},${payment.toFixed(2)},${principalPaid.toFixed(2)},${interest.toFixed(2)},${balance.toFixed(2)}`); }
      output = `${tool.slug === "mortgage-calculator" ? `Property price: $${priceOrPrincipal.toFixed(2)}\nDown payment: $${Number(downPayment).toFixed(2)}\n` : ""}Loan amount: $${principal.toFixed(2)}\nMonthly payment: $${payment.toFixed(2)}\nTotal interest: $${(payment * months - principal).toFixed(2)}\nTotal paid: $${(payment * months).toFixed(2)}\nInterest rate: ${Number(rate).toFixed(2)}%\nDuration: ${months} months\n\n${schedule.slice(0, 13).join("\n")}${months > 12 ? "\n… full payment schedule is in the CSV/PDF exports" : ""}`;
      const csv = new Blob([schedule.join("\n")], { type: "text/csv;charset=utf-8" });
      const pdf = await createPdfReport(tool.name, `${output}\n\nFull amortization schedule:\n${schedule.join("\n")}`);
      const files = [{ blob: pdf, filename: `${tool.slug}-report.pdf`, mime: "application/pdf" }, { blob: csv, filename: `${tool.slug}-schedule.csv`, mime: "text/csv" }];
      return { blob: pdf, filename: `${tool.slug}-report.pdf`, mime: "application/pdf", preview: output, files, downloadAll: await zipResultFiles(files), downloadAllFilename: `${tool.slug}-report.zip` };
    } else if (tool.slug === "age-calculator") {
      const birth = new Date(`${dob}T00:00:00`); const now = new Date();
      if (Number.isNaN(birth.getTime()) || birth > now) throw new Error("Enter a valid date of birth.");
      let age = now.getFullYear() - birth.getFullYear(); let ageMonths = now.getMonth() - birth.getMonth(); let ageDays = now.getDate() - birth.getDate();
      if (ageDays < 0) { ageMonths--; ageDays += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
      if (ageMonths < 0) { age--; ageMonths += 12; }
      const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
      const next = new Date(now.getFullYear() + (beforeBirthday ? 0 : 1), birth.getMonth(), birth.getDate()); output = `Age: ${age} years, ${ageMonths} months, ${ageDays} days\nNext birthday: ${next.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
    } else {
      const first = Number(number); const second = Number(rate); if (!Number.isFinite(first) || !Number.isFinite(second)) throw new Error("Enter valid numbers.");
      if (percentageMode === "of") output = `${first}% of ${second} is ${(first / 100 * second).toFixed(2)}.`;
      else if (percentageMode === "increase") output = `Percentage increase from ${first} to ${second}: ${first ? (((second - first) / Math.abs(first)) * 100).toFixed(2) : "N/A"}%.`;
      else if (percentageMode === "decrease") output = `Percentage decrease from ${first} to ${second}: ${first ? (((first - second) / Math.abs(first)) * 100).toFixed(2) : "N/A"}%.`;
      else output = `Percentage difference between ${first} and ${second}: ${((Math.abs(first - second) / ((Math.abs(first) + Math.abs(second)) / 2)) * 100 || 0).toFixed(2)}%.`;
    }
    const pdf = await createPdfReport(tool.name, output);
    return { blob: pdf, filename: `${tool.slug}-report.pdf`, mime: "application/pdf", preview: output };
  }

  async function processFiles(): Promise<ToolResult> {
    if (!selectedFiles.length) throw new Error("Choose at least one file before processing.");
    if (tool.slug === "image-to-pdf") return createImagePdf(selectedFiles);
    if (tool.category === "Image") return processImages(selectedFiles);
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (!pdfFiles.length) throw new Error("Choose a PDF file for this tool.");
    if (isNewPdfTool) {
      if (pdfFiles.length !== 1) throw new Error("Choose one PDF at a time for this tool.");
      const pdfProcessing = await import("../lib/pdf-processing");
      const file = pdfFiles[0];
      const inspection = await pdfProcessing.inspectPdf(file);
      setPdfInspection(inspection);
      if (tool.slug === "pdf-watermark") {
        if (inspection.isEncrypted && !sourcePassword) throw new Error("This PDF is encrypted. Enter the password you are authorized to use.");
        const blob = await pdfProcessing.addWatermark(file, watermarkOptions, watermarkImage, inspection.isEncrypted ? sourcePassword : undefined);
        return { blob, filename: "watermarked-document.pdf", mime: "application/pdf", title: "Watermark added", notice: `The watermark was embedded on the selected ${watermarkOptions.scope === "all" ? "pages" : "page range"}. The original file was not changed.` };
      }
      if (tool.slug === "pdf-page-numbering") {
        if (inspection.isEncrypted && !sourcePassword) throw new Error("This PDF is encrypted. Enter the password you are authorized to use.");
        const blob = await pdfProcessing.addPageNumbers(file, numberingOptions, inspection.isEncrypted ? sourcePassword : undefined);
        return { blob, filename: "numbered-document.pdf", mime: "application/pdf", title: "Page numbering added", notice: "Page numbers were embedded in the selected pages. The uploaded original was not changed." };
      }
      if (tool.slug === "protect-pdf") {
        if (protectPassword !== confirmPassword) throw new Error("The open password and confirmation do not match.");
        const blob = await pdfProcessing.protectPdf(file, { password: protectPassword, ownerPassword, ...protectPermissions } satisfies ProtectOptions);
        return { blob, filename: "protected-document.pdf", mime: "application/pdf", title: "PDF encrypted", notice: "AES-256 password encryption was verified. Permission flags may not be enforced by every PDF reader." };
      }
      if (tool.slug === "unlock-pdf") {
        if (!unlockAuthorized) throw new Error("Confirm that you own this PDF or are authorized to remove its password protection.");
        const unlocked = await pdfProcessing.unlockPdf(file, unlockPassword);
        return { blob: unlocked.blob, filename: "unlocked-document.pdf", mime: "application/pdf", title: unlocked.wasEncrypted ? "PDF unlocked" : "PDF already unencrypted", notice: unlocked.wasEncrypted ? "A new unencrypted copy was verified after checking the supplied password. Page contents and dimensions are preserved where supported; some document-level features such as interactive forms or attachments may not carry over. The original was not changed." : "This PDF had no password encryption; a validated copy was created. The original was not changed." };
      }
      if (tool.slug === "pdf-to-text") {
        const extracted = await pdfProcessing.extractPdfText(file, { ...textOptions, password: inspection.isEncrypted ? sourcePassword : undefined });
        const blob = new Blob([extracted.text], { type: "text/plain;charset=utf-8" });
        return {
          blob, filename: "extracted-text.txt", mime: "text/plain;charset=utf-8", preview: extracted.text, editableText: true,
          details: [{ label: "Pages processed", value: String(extracted.pagesProcessed) }, { label: "Pages with text", value: String(extracted.pagesWithText) }],
          notice: extracted.pagesWithText < extracted.pagesProcessed ? `${extracted.pagesProcessed - extracted.pagesWithText} selected page(s) had no selectable text. Scanned page images require OCR.` : "Selectable text was extracted locally. Scanned pages are not processed with OCR."
        };
      }
    }
    if (tool.slug === "pdf-compressor") return compressPdf(pdfFiles[0], compressionLevel, setProgress);
    if (tool.slug === "pdf-merger") {
      if (pdfFiles.length < 2) throw new Error("Choose at least two PDFs to merge.");
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      for (const file of pdfFiles) { const source = await PDFDocument.load(await file.arrayBuffer()); const pages = await output.copyPages(source, source.getPageIndices()); pages.forEach((page) => output.addPage(page)); }
      const blob = bytesToBlob(await output.save(), "application/pdf"); return { blob, filename: "toolmodeon-merged.pdf", mime: "application/pdf" };
    }
    if (tool.slug === "pdf-to-image") return convertPdfToImages(pdfFiles[0], setProgress, pdfImageFormat);
    const { PDFDocument: PDFDoc } = await import("pdf-lib");
    const source = await PDFDoc.load(await pdfFiles[0].arrayBuffer());
    if (tool.slug === "pdf-splitter") {
      const files: ResultFile[] = [];
      for (let i = 0; i < source.getPageCount(); i++) { const single = await PDFDoc.create(); const [page] = await single.copyPages(source, [i]); single.addPage(page); files.push({ blob: bytesToBlob(await single.save(), "application/pdf"), filename: `${baseName(pdfFiles[0].name)}-page-${i + 1}.pdf`, mime: "application/pdf" }); }
      return { blob: files[0].blob, filename: files[0].filename, mime: "application/pdf", files, downloadAll: await zipResultFiles(files), downloadAllFilename: `${baseName(pdfFiles[0].name)}-pages.zip` };
    }
    throw new Error("This file format is not supported by the selected tool.");
  }

  async function processImages(files: File[]): Promise<ToolResult> {
    if (files.length === 0) throw new Error("Choose an image before processing.");
    const outputs: ResultFile[] = [];
    const alternatives: ResultFile[] = [];
    const fileComparisons: NonNullable<ToolResult["fileComparisons"]> = [];
    let firstProcessed: ResultFile | null = null;
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const processed = await processImage(file);
      if (index === 0) firstProcessed = processed;
      if (tool.slug === "image-compressor") {
        const savingsPercent = file.size ? ((file.size - processed.blob.size) / file.size) * 100 : 0;
        const meaningfulReduction = savingsPercent >= 5;
        fileComparisons.push({ filename: file.name, originalSize: file.size, outputSize: processed.blob.size, savingsPercent, reduced: meaningfulReduction });
        if (meaningfulReduction) outputs.push(processed);
        else {
          outputs.push({ blob: file, filename: file.name, mime: file.type || "application/octet-stream" });
          alternatives.push({ ...processed, filename: `${baseName(file.name)}-not-smaller.${processed.filename.split(".").pop()}` });
        }
      } else outputs.push(processed);
      setProgress(Math.round(((index + 1) / files.length) * 90));
    }
    const input = files[0];
    const output = firstProcessed;
    if (!output) throw new Error("Could not process the selected image.");
    const savings = input.size - output.blob.size;
    const savingsPercent = input.size ? (savings / input.size) * 100 : 0;
    const reduced = tool.slug === "image-compressor" && savingsPercent >= 5;
    const base: ToolResult = { blob: outputs[0].blob, filename: outputs[0].filename, mime: outputs[0].mime, previewImageBlob: outputs[0].mime.startsWith("image/") ? outputs[0].blob : undefined };
    if (tool.slug === "image-compressor") {
      base.title = reduced ? "Image compression complete" : "This image could not be reduced";
      base.downloadLabel = reduced ? "Download compressed image" : "Download original (recommended)";
      base.comparison = { originalSize: input.size, outputSize: output.blob.size, savedBytes: savings, savingsPercent: input.size ? (savings / input.size) * 100 : 0, reduced };
      base.fileComparisons = fileComparisons;
      base.notice = reduced ? "The compressed image is at least 5% smaller than the original." : savings > 0 ? `The image is only ${savingsPercent.toFixed(1)}% smaller, below the 5% threshold for a meaningful reduction. The original is recommended.` : "This image could not be reduced further without additional quality loss. The original is the recommended download.";
      base.alternatives = alternatives;
    }
    if (outputs.length > 1) { base.files = outputs; base.downloadAll = await zipResultFiles(outputs); base.downloadAllFilename = `${tool.slug}-images.zip`; }
    return base;
  }

  async function processImage(file: File): Promise<ResultFile> {
    if (!file.type.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WebP image.");
    const inputExtension = file.name.split(".").pop()?.toLowerCase();
    if (tool.slug === "jpg-to-png" && file.type !== "image/jpeg" && !["jpg", "jpeg"].includes(inputExtension || "")) throw new Error("JPG to PNG accepts JPG or JPEG files.");
    if (tool.slug === "png-to-webp" && file.type !== "image/png" && inputExtension !== "png") throw new Error("PNG to WebP accepts PNG files.");

    if (tool.slug === "background-remover") {
      const form = new FormData();
      form.append("image", file);
      form.append("bgMode", bgMode);
      form.append("bgColor", bgColor);
      const res = await fetch("/api/tools/image/background-remove", { method: "POST", body: form });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const err = ct.includes("json") ? ((await res.json()) as { error: string }).error : await res.text();
        throw new Error(err || "Background removal failed.");
      }
      let blob = await res.blob();
      let mime = blob.type || "image/png";
      let ext = mime === "image/jpeg" ? "jpg" : "png";

      if (bgMode !== "transparent") {
        const img = await loadImage(new File([blob], "result.png", { type: mime }));
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = bgMode === "white" ? "#ffffff" : bgMode === "black" ? "#000000" : bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img.element, 0, 0);
          const outMime = bgMode === "white" || bgMode === "black" ? "image/jpeg" : "image/png";
          blob = await canvasBlob(canvas, outMime, 0.95);
          mime = outMime;
          ext = outMime === "image/jpeg" ? "jpg" : "png";
        }
      }
      return { blob, filename: `background-removed.${ext}`, mime };
    }

    if (tool.slug === "background-blur") {
      const form = new FormData();
      form.append("image", file);
      form.append("blur", String(blurIntensity));
      const res = await fetch("/api/tools/image/background-blur", { method: "POST", body: form });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const err = ct.includes("json") ? ((await res.json()) as { error: string }).error : await res.text();
        throw new Error(err || "Background blur failed.");
      }
      const maskBlob = await res.blob();
      const blurVal = Number(res.headers.get("x-blur-intensity") || blurIntensity);
      const origImg = await loadImage(file);
      const maskImg = await loadImage(new File([maskBlob], "mask.png", { type: "image/png" }));
      const canvas = document.createElement("canvas");
      canvas.width = origImg.width;
      canvas.height = origImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available.");
      ctx.filter = `blur(${blurVal}px)`;
      ctx.drawImage(origImg.element, 0, 0);
      ctx.filter = "none";
      ctx.drawImage(maskImg.element, 0, 0, origImg.width, origImg.height);
      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasBlob(canvas, outType, 0.92);
      const ext = outType === "image/png" ? "png" : "jpg";
      return { blob, filename: `background-blur.${ext}`, mime: outType };
    }

    if (tool.slug === "image-upscaler") {
      const form = new FormData();
      form.append("image", file);
      form.append("scale", upscaleFactor);
      const res = await fetch("/api/tools/image/upscale", { method: "POST", body: form });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const err = ct.includes("json") ? ((await res.json()) as { error: string }).error : await res.text();
        throw new Error(err || "Image upscaling failed.");
      }
      const blob = await res.blob();
      const ext = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      return { blob, filename: `upscaled-image.${ext}`, mime: blob.type };
    }

    if (tool.slug === "image-rotator-flipper") {
      const src = await loadImage(file);
      const rad = (imageRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const cw = Math.round(src.width * cos + src.height * sin);
      const ch = Math.round(src.width * sin + src.height * cos);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available.");
      ctx.translate(cw / 2, ch / 2);
      if (imageFlipH) ctx.scale(-1, 1);
      if (imageFlipV) ctx.scale(1, -1);
      ctx.rotate(rad);
      ctx.drawImage(src.element, -src.width / 2, -src.height / 2);
      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasBlob(canvas, outType, 0.92);
      const ext = outType === "image/png" ? "png" : "jpg";
      return { blob, filename: `rotated-image.${ext}`, mime: outType };
    }

    if (tool.slug === "image-watermark") {
      const src = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = src.width;
      canvas.height = src.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available.");
      ctx.drawImage(src.element, 0, 0);
      ctx.globalAlpha = wmOpacity;
      if (wmType === "image" && wmLogoFile) {
        const logo = await loadImage(wmLogoFile);
        const lw = wmLogoSize;
        const lh = Math.round((logo.height / logo.width) * lw);
        const [lx, ly] = getWmPos(wmPosition, src.width, src.height, lw, lh, 24);
        ctx.save();
        ctx.translate(lx + lw / 2, ly + lh / 2);
        ctx.rotate((wmRotation * Math.PI) / 180);
        ctx.drawImage(logo.element, -lw / 2, -lh / 2, lw, lh);
        ctx.restore();
      } else {
        const style = `${wmBold ? "bold " : ""}${wmItalic ? "italic " : ""}${wmFontSize}px sans-serif`;
        ctx.font = style;
        ctx.fillStyle = wmColor;
        const tm = ctx.measureText(wmText);
        const tw = tm.width;
        const th = wmFontSize;
        const [tx, ty] = getWmPos(wmPosition, src.width, src.height, tw, th, 24);
        ctx.save();
        ctx.translate(tx + tw / 2, ty + th / 2);
        const rot = wmPosition === "diagonal-center" && wmRotation === 0 ? -45 : wmRotation;
        ctx.rotate((rot * Math.PI) / 180);
        ctx.fillText(wmText, -tw / 2, th / 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasBlob(canvas, outType, 0.92);
      const ext = outType === "image/png" ? "png" : "jpg";
      return { blob, filename: `watermarked-image.${ext}`, mime: outType };
    }

    if (tool.slug === "image-enhancer") {
      const src = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = src.width;
      canvas.height = src.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available.");

      let b = enhBrightness;
      let c = enhContrast;
      let s = enhSaturation;
      let sharp = enhSharpness;
      let temp = enhTemperature;

      if (enhPreset === "bright") { b = 120; c = 110; s = 105; }
      else if (enhPreset === "vivid") { b = 108; c = 115; s = 140; }
      else if (enhPreset === "natural") { b = 103; c = 105; s = 110; }
      else if (enhPreset === "soft") { b = 108; c = 95; s = 90; }
      else if (enhPreset === "bw") { s = 0; }
      else if (enhPreset === "auto") {
        ctx.drawImage(src.element, 0, 0);
        const autoVals = analyzeImageHistogram(ctx, canvas.width, canvas.height);
        b = autoVals.brightness;
        c = autoVals.contrast;
        s = autoVals.saturation;
        sharp = autoVals.sharpness;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
      ctx.drawImage(src.element, 0, 0);
      ctx.filter = "none";

      if (temp !== 0) {
        applyTemperature(ctx, canvas.width, canvas.height, temp);
      }
      if (sharp > 0) {
        applySharpness(ctx, canvas.width, canvas.height, sharp);
      }

      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await canvasBlob(canvas, outType, 0.92);
      const ext = outType === "image/png" ? "png" : "jpg";
      return { blob, filename: `enhanced-image.${ext}`, mime: outType };
    }

    const image = await loadImage(file); const canvas = document.createElement("canvas"); let width = image.width; let height = image.height;
    if (tool.slug === "image-resizer") { width = Math.max(1, Number(targetWidth)); height = Math.max(1, Number(targetHeight)); }
    if (tool.slug === "image-cropper") { const side = Math.min(image.width, image.height); width = side; height = side; }
    canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Your browser could not create an image canvas.");
    if (tool.slug === "image-cropper") ctx.drawImage(image.element, (image.width - width) / 2, (image.height - height) / 2, width, height, 0, 0, width, height); else ctx.drawImage(image.element, 0, 0, width, height);
    const outputType = tool.slug === "jpg-to-png" ? "image/png" : tool.slug === "png-to-webp" || (tool.slug === "image-compressor" && file.type === "image/png") ? "image/webp" : file.type === "image/webp" ? "image/webp" : file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await canvasBlob(canvas, outputType, Number(quality)); const extension = outputType.split("/")[1].replace("jpeg", "jpg");
    return { blob, filename: `${baseName(file.name)}-${tool.slug}.${extension}`, mime: outputType };
  }

  async function createImagePdf(files: File[]): Promise<ToolResult> {
    const { PDFDocument } = await import("pdf-lib");
    const output = await PDFDocument.create();
    for (const file of files) {
      let image;
      if (file.type === "image/png") image = await output.embedPng(await file.arrayBuffer());
      else if (file.type === "image/jpeg") image = await output.embedJpg(await file.arrayBuffer());
      else {
        const loaded = await loadImage(file); const canvas = document.createElement("canvas"); canvas.width = loaded.width; canvas.height = loaded.height;
        const context = canvas.getContext("2d"); if (!context) throw new Error(`Could not read ${file.name}.`);
        context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(loaded.element, 0, 0);
        const jpg = await canvasBlob(canvas, "image/jpeg", 0.92); image = await output.embedJpg(await jpg.arrayBuffer());
      }
      const page = output.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    const blob = bytesToBlob(await output.save(), "application/pdf"); return { blob, filename: "toolmodeon-images.pdf", mime: "application/pdf" };
  }

  function actionLabel() {
    if (isCalculator) return "Calculate";
    if (isAi) return "Generate result";
    if (tool.slug === "pdf-merger") return "Merge PDFs";
    if (tool.slug === "pdf-compressor") return "Compress PDF";
    if (tool.slug === "pdf-splitter") return "Split PDF";
    if (tool.slug === "pdf-to-image") return "Convert to images";
    if (tool.slug === "image-to-pdf") return "Create PDF";
    if (tool.slug === "pdf-watermark") return "Add watermark";
    if (tool.slug === "pdf-page-numbering") return "Add page numbers";
    if (tool.slug === "protect-pdf") return "Protect PDF";
    if (tool.slug === "unlock-pdf") return "Unlock PDF";
    if (tool.slug === "pdf-to-text") return "Extract text";
    if (tool.slug === "image-resizer") return "Resize image";
    if (tool.slug === "image-compressor") return "Compress image";
    if (tool.slug === "jpg-to-png") return "Convert to PNG";
    if (tool.slug === "png-to-webp") return "Convert to WebP";
    if (tool.slug === "image-cropper") return "Crop image";
    if (tool.slug === "background-remover") return "Remove background";
    if (tool.slug === "background-blur") return "Blur background";
    if (tool.slug === "image-upscaler") return "Upscale image";
    if (tool.slug === "image-rotator-flipper") return "Rotate & flip";
    if (tool.slug === "image-watermark") return "Add watermark";
    if (tool.slug === "image-enhancer") return "Enhance image";
    return "Process text";
  }
  const canRun = isFileTool ? selectedFiles.length > 0 : isCalculator || text.trim().length > 0;

  if (tool.category === "Utilities") {
    return <UtilityToolWorkspace tool={tool} />;
  }

  if (tool.category === "Developer") {
    return <DeveloperToolWorkspace tool={tool} />;
  }

  if (tool.category === "SEO") {
    return <SeoToolWorkspace tool={tool} />;
  }

  if (tool.category === "Social") {
    return <SocialToolWorkspace tool={tool} />;
  }

  return <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
    <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
      {isTextTool || isAi ? <div><label className="mb-2 block text-sm font-bold text-ink">{isAi ? "What should we work on?" : "Your text"}</label><textarea value={text} onChange={(event) => setText(event.target.value)} className={`${inputClass} min-h-[240px] resize-y`} placeholder={isAi ? "Paste a paragraph, describe an email, or enter a topic..." : "Start typing or paste your text here..."}/>{statLine && <div className="mt-3 text-xs font-semibold text-muted">{statLine}</div>}{tool.slug === "case-converter" && <label className="mt-4 block text-sm font-bold">Convert to<select value={caseMode} onChange={(event) => setCaseMode(event.target.value)} className={`${inputClass} mt-2`}><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option><option value="sentence">Sentence case</option><option value="title">Title Case</option><option value="toggle">tOGGLE cASE</option></select></label>}{tool.slug === "remove-duplicate-lines" && <label className="mt-4 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={sortDuplicateLines} onChange={(event) => setSortDuplicateLines(event.target.checked)}/> Sort the remaining lines</label>}{tool.slug === "text-diff-checker" && <><label className="mb-2 mt-6 block text-sm font-bold text-ink">Updated text</label><textarea value={text2} onChange={(event) => setText2(event.target.value)} className={`${inputClass} min-h-[160px] resize-y`} placeholder="Paste the updated version..."/></>}{isAi && tool.slug === "ai-paragraph-rewriter" && <select value={tone} onChange={(event) => setTone(event.target.value)} className={`${inputClass} mt-4`}><option>Professional</option><option>Friendly</option><option>Concise</option><option>Persuasive</option></select>}</div>
      : isCalculator ? <div className="grid gap-4 sm:grid-cols-2">
        {tool.slug === "age-calculator" ? <Field label="Date of birth" type="date" value={dob} onChange={setDob}/> : null}
        {tool.slug === "bmi-calculator" ? <><Field label="Weight (kg)" value={weight} onChange={setWeight}/><Field label="Height (cm)" value={height} onChange={setHeight}/></> : null}
        {tool.slug === "percentage-calculator" ? <><label className="col-span-full block text-sm font-bold">Calculation<select value={percentageMode} onChange={(event) => setPercentageMode(event.target.value)} className={`${inputClass} mt-2`}><option value="of">What is X% of Y?</option><option value="increase">Percentage increase</option><option value="decrease">Percentage decrease</option><option value="difference">Percentage difference</option></select></label><Field label={percentageMode === "of" ? "Percentage (%)" : "First value"} value={number} onChange={setNumber}/><Field label={percentageMode === "of" ? "Base value" : "Second value"} value={rate} onChange={setRate}/></> : null}
        {["loan-calculator", "mortgage-calculator"].includes(tool.slug) && <><Field label={tool.slug === "mortgage-calculator" ? "Property price ($)" : "Loan amount ($)"} value={number} onChange={setNumber}/>{tool.slug === "mortgage-calculator" && <Field label="Down payment ($)" value={downPayment} onChange={setDownPayment}/>}<Field label="Interest rate (%)" value={rate} onChange={setRate}/><Field label="Duration (years)" value={years} onChange={setYears}/></>}
        {tool.slug === "bmi-calculator" && <p className="col-span-full text-xs leading-5 text-muted">BMI is a screening measure, not a diagnosis.</p>}
      </div>
      : <div>
        <div onDragOver={isNewPdfTool ? (event) => event.preventDefault() : undefined} onDrop={isNewPdfTool ? (event) => { event.preventDefault(); void chooseFiles(Array.from(event.dataTransfer.files)); } : undefined} className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-pale/50 px-6 text-center transition hover:border-ink hover:bg-pale">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-line text-ink"><UploadCloud size={22}/></div>
          <h3 className="mt-4 text-base font-bold text-ink">Drop your files here</h3>
          <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted">Choose files from your device. Outputs are generated in your browser and are not uploaded.</p>
          <label className="mt-4 cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"><input type="file" multiple={!isNewPdfTool} accept={isNewPdfTool ? ".pdf,application/pdf" : tool.slug === "image-to-pdf" || tool.category === "Image" ? "image/*" : ".pdf,application/pdf"} className="hidden" onChange={(event) => { void chooseFiles(Array.from(event.target.files || [])); event.currentTarget.value = ""; }}/><FileUp className="mr-2 inline" size={15}/> Choose files</label>
        </div>
        {selectedFiles.length > 0 && <div className="mt-4 rounded-xl border border-line bg-pale p-3 text-sm font-semibold">{selectedFiles.map((file) => <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 py-1"><span className="truncate">{file.name}</span><span className="shrink-0 text-xs text-muted">{Math.ceil(file.size / 1024)} KB</span></div>)}{isNewPdfTool && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs"><span>{pdfInspection ? `${pdfInspection.pageCount} page${pdfInspection.pageCount === 1 ? "" : "s"}${pdfInspection.isEncrypted ? " · password protected" : ""}` : pdfFileIssue || "Checking PDF…"}</span><button onClick={() => { void chooseFiles([]); setWatermarkImage(null); }} className="font-semibold text-ink underline">Remove PDF</button></div>}</div>}
        {previewImage && ["image-rotator-flipper", "image-watermark", "image-enhancer", "image-resizer", "jpg-to-png", "png-to-webp"].includes(tool.slug) && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-pale/70 p-3.5 transition-all">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ink animate-pulse" />
                <span className="text-xs font-bold text-ink">Live Preview</span>
                <span className="text-xs font-semibold text-muted">
                  {tool.slug === "image-rotator-flipper"
                    ? `${previewDims.width} × ${previewDims.height} px → ${rotatedDims.width} × ${rotatedDims.height} px`
                    : `${previewDims.width} × ${previewDims.height} px`}
                </span>
              </div>
              {tool.slug === "image-enhancer" && (
                <button
                  type="button"
                  onMouseDown={() => setShowEnhOriginal(true)}
                  onMouseUp={() => setShowEnhOriginal(false)}
                  onTouchStart={() => setShowEnhOriginal(true)}
                  onTouchEnd={() => setShowEnhOriginal(false)}
                  className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-xs hover:border-ink select-none"
                >
                  {showEnhOriginal ? "Showing Original" : "Hold to compare"}
                </button>
              )}
            </div>
            <div className="flex min-h-[160px] max-h-[340px] items-center justify-center overflow-hidden rounded-xl bg-checkerboard p-2 shadow-inner">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[320px] max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>
          </div>
        )}
        {pdfFileIssue && <p role="alert" className="mt-3 rounded-xl border border-line bg-pale p-3 text-sm font-medium text-ink">{pdfFileIssue}</p>}
        {tool.slug === "pdf-compressor" && <><label className="mt-4 block text-sm font-bold">Compression level<select value={compressionLevel} onChange={(event) => setCompressionLevel(event.target.value as "low" | "medium" | "high")} className={`${inputClass} mt-2`}><option value="low">Low compression — preserve quality</option><option value="medium">Medium compression — balanced</option><option value="high">High compression — smaller file</option></select></label><p className="mt-2 text-xs leading-5 text-muted">To reduce size, pages are rendered and rebuilt as images. This can remove selectable text; the uploaded original stays available.</p></>}
        {tool.slug === "pdf-to-image" && <label className="mt-4 block text-sm font-bold">Image format<select value={pdfImageFormat} onChange={(event) => setPdfImageFormat(event.target.value as "jpg" | "png")} className={`${inputClass} mt-2`}><option value="jpg">JPG</option><option value="png">PNG</option></select></label>}
        {["image-compressor", "png-to-webp"].includes(tool.slug) && <Field label="Quality (0.1–1)" value={quality} onChange={setQuality} min="0.1" max="1" step="0.1"/>}
        {tool.slug === "image-resizer" && <div className="mt-4 grid grid-cols-2 gap-3"><Field label="Width (px)" value={targetWidth} onChange={setTargetWidth}/><Field label="Height (px)" value={targetHeight} onChange={setTargetHeight}/></div>}
        {tool.slug === "image-rotator-flipper" && <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-bold text-ink">Rotation angle: {imageRotation}°</label>
            <input type="range" min="-360" max="360" value={imageRotation} onChange={(e) => setImageRotation(Number(e.target.value))} className="mt-2 w-full accent-brand"/>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setImageRotation((r) => ((r - 90 + 360) % 360))} className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink">↺ 90° CCW</button>
              <button type="button" onClick={() => setImageRotation((r) => ((r + 90) % 360))} className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink">↻ 90° CW</button>
              <button type="button" onClick={() => setImageRotation((r) => ((r + 180) % 360))} className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink">↻ 180°</button>
              <button type="button" onClick={() => setImageRotation(0)} className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">Reset angle</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={imageFlipH} onChange={(e) => setImageFlipH(e.target.checked)} className="rounded text-ink focus:ring-ink"/> Flip horizontally</label>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={imageFlipV} onChange={(e) => setImageFlipV(e.target.checked)} className="rounded text-ink focus:ring-ink"/> Flip vertically</label>
          </div>
        </div>}
        {tool.slug === "image-watermark" && <div className="mt-4 space-y-3.5">
          <div className="flex gap-2">
            <button type="button" onClick={() => setWmType("text")} className={`rounded-xl px-4 py-2 text-xs font-medium border transition ${wmType === "text" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink"}`}>Text watermark</button>
            <button type="button" onClick={() => setWmType("image")} className={`rounded-xl px-4 py-2 text-xs font-medium border transition ${wmType === "image" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink"}`}>Logo image</button>
          </div>
          {wmType === "text" ? <>
            <label className="block text-sm font-bold text-ink">Watermark text<input value={wmText} onChange={(e) => setWmText(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="e.g. © 2026 YourBrand"/></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold text-ink">Font size (px)<input type="number" min="8" max="240" value={wmFontSize} onChange={(e) => setWmFontSize(Number(e.target.value))} className={`${inputClass} mt-1.5`}/></label>
              <label className="block text-sm font-bold text-ink">Color<input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1"/></label>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={wmBold} onChange={(e) => setWmBold(e.target.checked)} className="rounded text-ink"/> Bold</label>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={wmItalic} onChange={(e) => setWmItalic(e.target.checked)} className="rounded text-ink"/> Italic</label>
            </div>
          </> : <>
            <div>
              <label className="block text-sm font-bold text-ink">Logo file (PNG or JPG)</label>
              <input type="file" accept="image/png,image/jpeg" className="mt-1.5 block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-xs font-medium file:text-ink hover:file:border-ink" onChange={(e) => setWmLogoFile(e.target.files?.[0] ?? null)}/>
            </div>
            <label className="block text-sm font-bold text-ink">Logo width (px)<input type="number" min="20" max="1200" value={wmLogoSize} onChange={(e) => setWmLogoSize(Number(e.target.value))} className={`${inputClass} mt-1.5`}/></label>
          </>}
          <label className="block text-sm font-bold text-ink">Opacity: {Math.round(wmOpacity * 100)}%<input type="range" min="0.05" max="1" step="0.05" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} className="mt-1.5 w-full accent-ink"/></label>
          <label className="block text-sm font-bold text-ink">Rotation angle: {wmRotation}°<input type="range" min="-180" max="180" value={wmRotation} onChange={(e) => setWmRotation(Number(e.target.value))} className="mt-1.5 w-full accent-ink"/></label>
          <label className="block text-sm font-bold text-ink">Position<select value={wmPosition} onChange={(e) => setWmPosition(e.target.value)} className={`${inputClass} mt-1.5`}><option value="top-left">Top Left</option><option value="top-center">Top Center</option><option value="top-right">Top Right</option><option value="center">Center</option><option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option><option value="bottom-right">Bottom Right</option><option value="diagonal-center">Diagonal Center (-45°)</option></select></label>
        </div>}
        {tool.slug === "image-enhancer" && <div className="mt-4 space-y-3.5">
          <label className="block text-sm font-bold text-ink">Preset filter<select value={enhPreset} onChange={(e) => { setEnhPreset(e.target.value); if (e.target.value !== "none") { setEnhBrightness(100); setEnhContrast(100); setEnhSaturation(100); setEnhSharpness(0); setEnhTemperature(0); } }} className={`${inputClass} mt-1.5`}><option value="none">Manual Adjustments</option><option value="auto">Auto Enhance (Histogram Analysis)</option><option value="natural">Natural (Balanced Color)</option><option value="bright">Bright (Light Boost)</option><option value="vivid">Vivid (Rich Contrast & Saturation)</option><option value="soft">Soft (Gentle Tones)</option><option value="bw">Black & White</option></select></label>
          <label className="block text-sm font-bold text-ink">Brightness: {enhBrightness}%<input type="range" min="50" max="180" value={enhBrightness} onChange={(e) => { setEnhBrightness(Number(e.target.value)); setEnhPreset("none"); }} className="mt-1.5 w-full accent-ink"/></label>
          <label className="block text-sm font-bold text-ink">Contrast: {enhContrast}%<input type="range" min="50" max="180" value={enhContrast} onChange={(e) => { setEnhContrast(Number(e.target.value)); setEnhPreset("none"); }} className="mt-1.5 w-full accent-ink"/></label>
          <label className="block text-sm font-bold text-ink">Saturation: {enhSaturation}%<input type="range" min="0" max="250" value={enhSaturation} onChange={(e) => { setEnhSaturation(Number(e.target.value)); setEnhPreset("none"); }} className="mt-1.5 w-full accent-ink"/></label>
          <label className="block text-sm font-bold text-ink">Sharpness: {enhSharpness}<input type="range" min="0" max="5" step="0.5" value={enhSharpness} onChange={(e) => { setEnhSharpness(Number(e.target.value)); setEnhPreset("none"); }} className="mt-1.5 w-full accent-ink"/></label>
          <label className="block text-sm font-bold text-ink">Temperature: {enhTemperature > 0 ? `+${enhTemperature} (warm)` : enhTemperature < 0 ? `${enhTemperature} (cool)` : "0 (neutral)"}<input type="range" min="-40" max="40" value={enhTemperature} onChange={(e) => { setEnhTemperature(Number(e.target.value)); setEnhPreset("none"); }} className="mt-1.5 w-full accent-ink"/></label>
          <button type="button" onClick={() => { setEnhBrightness(100); setEnhContrast(100); setEnhSaturation(100); setEnhSharpness(0); setEnhTemperature(0); setEnhPreset("none"); }} className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:border-ink">Reset adjustments</button>
        </div>}
        {tool.slug === "background-remover" && <div className="mt-4 space-y-3.5">
          <p className="rounded-xl border border-line bg-pale p-3.5 text-xs font-normal leading-5 text-ink">AI segmentation model extracts the subject with transparent background. Requires REMOVE_BG_API_KEY or CLIPDROP_API_KEY configured on the server.</p>
          <label className="block text-sm font-bold text-ink">Background style<select value={bgMode} onChange={(e) => setBgMode(e.target.value as "transparent" | "white" | "black" | "custom")} className={`${inputClass} mt-1.5`}><option value="transparent">Transparent background (PNG)</option><option value="white">White background</option><option value="black">Black background</option><option value="custom">Custom solid color</option></select></label>
          {bgMode === "custom" && <label className="block text-sm font-bold text-ink">Custom background color<input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1"/></label>}
        </div>}
        {tool.slug === "background-blur" && <div className="mt-4 space-y-3.5">
          <p className="rounded-xl border border-line bg-pale p-3.5 text-xs font-normal leading-5 text-ink">AI subject detection blurs the background while preserving crisp subject edges. Requires REMOVE_BG_API_KEY or CLIPDROP_API_KEY configured on the server.</p>
          <label className="block text-sm font-bold text-ink">Blur intensity: {blurIntensity}px<input type="range" min="2" max="36" value={blurIntensity} onChange={(e) => setBlurIntensity(Number(e.target.value))} className="mt-1.5 w-full accent-ink"/></label>
          <div className="flex gap-2">
            {([ { label: "Light", value: 4 }, { label: "Medium", value: 14 }, { label: "Strong", value: 28 } ] as const).map(({ label, value }) => (
              <button key={value} type="button" onClick={() => setBlurIntensity(value)} className={`rounded-xl px-3.5 py-1.5 text-xs font-medium border transition ${blurIntensity === value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink"}`}>{label}</button>
            ))}
          </div>
        </div>}
        {tool.slug === "image-upscaler" && <div className="mt-4 space-y-3.5">
          <p className="rounded-xl border border-line bg-pale p-3.5 text-xs font-normal leading-5 text-ink">AI super-resolution increases resolution while reconstructing fine textures. Requires CLIPDROP_API_KEY or REPLICATE_API_KEY configured on the server.</p>
          <label className="block text-sm font-bold text-ink">Upscaling factor<select value={upscaleFactor} onChange={(e) => setUpscaleFactor(e.target.value as "2" | "4")} className={`${inputClass} mt-1.5`}><option value="2">2× Resolution (200%)</option><option value="4">4× Resolution (400%)</option></select></label>
        </div>}
        {isNewPdfTool && <PdfToolSettings slug={tool.slug} file={selectedFiles[0]} inspection={pdfInspection} watermark={watermarkOptions} setWatermark={setWatermarkOptions} numbering={numberingOptions} setNumbering={setNumberingOptions} watermarkImage={watermarkImage} setWatermarkImage={setWatermarkImage} protectPassword={protectPassword} setProtectPassword={setProtectPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} ownerPassword={ownerPassword} setOwnerPassword={setOwnerPassword} permissions={protectPermissions} setPermissions={setProtectPermissions} unlockPassword={unlockPassword} setUnlockPassword={setUnlockPassword} unlockAuthorized={unlockAuthorized} setUnlockAuthorized={setUnlockAuthorized} textOptions={textOptions} setTextOptions={setTextOptions} sourcePassword={sourcePassword} setSourcePassword={setSourcePassword}/>}
      </div>}
      <button disabled={!canRun || status === "checking" || status === "processing"} onClick={runTool} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">{status === "checking" ? "Checking access…" : status === "processing" ? "Processing…" : isAi ? <><Sparkles size={17}/> {actionLabel()}</> : <>{actionLabel()} <ArrowRight size={16}/></>}</button>
      {(status === "checking" || status === "processing") && <div className="mt-4" aria-live="polite"><div className="flex items-center justify-between text-xs font-bold text-muted"><span>{status === "checking" ? "Checking access and limits" : progress > 0 ? "Processing your request" : "Preparing your result"}</span>{status === "processing" && progress > 0 && <span>{progress}%</span>}</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-pale border border-line"><div className={`h-full rounded-full bg-ink transition-all duration-300 ${progress === 0 ? "w-1/3 animate-pulse" : ""}`} style={progress > 0 ? { width: `${progress}%` } : undefined}/></div></div>}
      {status === "error" && <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-pale p-4 text-sm font-medium leading-6 text-ink" role="alert"><span className="mt-0.5 font-bold">!</span><span>{error}</span></div>}
      {result && status === "success" && (
        <ToolResults
          result={result}
          onStartOver={reset}
          onRepeat={tool.slug === "pdf-to-text" ? runTool : undefined}
          onTextChange={
            result.editableText
              ? (value) =>
                  setResult((current) =>
                    current ? { ...current, preview: value, blob: new Blob([value], { type: "text/plain;charset=utf-8" }) } : current
                  )
              : undefined
          }
        />
      )}
    </section>
    <aside className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <LockKeyhole size={16} className="text-ink" /> Private by default
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Your files and data are processed locally in your browser. Nothing is uploaded, logged, or stored on remote servers.
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-ink">How it works</h3>
        <div className="mt-4 grid gap-3">
          {[
            { step: 1, title: "Add your input", desc: "Select or drop your file" },
            { step: 2, title: "Choose options", desc: "Customize output settings" },
            { step: 3, title: "Instant result", desc: "Export or copy right away" },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pale border border-line text-xs font-bold text-ink">
                {item.step}
              </span>
              <div>
                <span className="text-xs font-semibold text-ink block">{item.title}</span>
                <span className="text-[11px] text-muted">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-pale p-4 text-xs font-medium text-ink flex items-center gap-2">
        <Sparkles size={16} className="shrink-0 text-ink" />
        <span>100% Free forever. No sign-up or credit card required.</span>
      </div>
    </aside>
  </div>;
}

function Field({ label, value, onChange, type = "number", min, max, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; max?: string; step?: string }) { return <label className="mt-4 block text-sm font-bold text-ink">{label}<input type={type} min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-2`}/></label>; }

function baseName(name: string) { return name.replace(/\.[^.]+$/, "") || "toolmodeon-result"; }
function bytesToBlob(bytes: Uint8Array, mime: string) { return new Blob([bytes.buffer as ArrayBuffer], { type: mime }); }
async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) { const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality)); if (!blob) throw new Error("The browser could not create an output image."); return blob; }
function getWmPos(position: string, iw: number, ih: number, ww: number, wh: number, margin: number): [number, number] {
  const positions: Record<string, [number, number]> = {
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

function analyzeImageHistogram(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const step = Math.max(1, Math.floor((width * height) / 50000));
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  let totalLum = 0;
  let minLum = 255;
  let maxLum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += step * 4) {
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

function applySharpness(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const id = ctx.getImageData(0, 0, width, height);
  const d = id.data;
  const tmp = new Uint8ClampedArray(d);
  const factor = amount * 0.35;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const blur = (tmp[(i - width * 4) + ch] + tmp[(i + width * 4) + ch] + tmp[i - 4 + ch] + tmp[i + 4 + ch]) / 4;
        d[i + ch] = Math.min(255, Math.max(0, Math.round(tmp[i + ch] + factor * (tmp[i + ch] - blur))));
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

function applyTemperature(ctx: CanvasRenderingContext2D, width: number, height: number, temp: number) {
  if (temp === 0) return;
  const id = ctx.getImageData(0, 0, width, height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] + temp));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] - temp));
  }
  ctx.putImageData(id, 0, 0);
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const element = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = async () => {
        try { if ("decode" in image) await image.decode(); } catch { /* fallback to standard load */ }
        resolve(image);
      };
      image.onerror = () => reject(new Error("This image could not be opened."));
      image.src = url;
    });
    return { element, width: element.naturalWidth, height: element.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function zipResultFiles(files: ResultFile[]) { const { default: JSZip } = await import("jszip"); const zip = new JSZip(); for (const file of files) zip.file(file.filename, file.blob); return zip.generateAsync({ type: "blob" }); }
async function createPdfReport(title: string, content: string) {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = content.split("\n");
  for (let offset = 0; offset < lines.length; offset += 35) {
    const page = pdf.addPage([612, 792]);
    page.drawText(`${title}${offset ? " (continued)" : ""}`, { x: 48, y: 748, size: 18, font });
    let y = 714;
    for (const line of lines.slice(offset, offset + 35)) {
      page.drawText(line.slice(0, 92), { x: 48, y, size: 10, font });
      y -= 19;
    }
  }
  return bytesToBlob(await pdf.save(), "application/pdf");
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
  return pdfjs;
}

async function renderPdfPages(file: File, onProgress: (progress: number) => void, scale: number, format: "jpg" | "png", quality: number) {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    const document = await loadingTask.promise;
    const outputs: ResultFile[] = [];
    const { PDFDocument } = format === "jpg" ? await import("pdf-lib") : { PDFDocument: null };
    const pdfOutput = PDFDocument ? await PDFDocument.create() : null;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      try {
        const context = canvas.getContext("2d", { alpha: format === "png" });
        if (!context) throw new Error("The browser could not prepare a page preview.");
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const mime = format === "png" ? "image/png" : "image/jpeg";
        const blob = await canvasBlob(canvas, mime, quality);
        outputs.push({ blob, filename: `${baseName(file.name)}-page-${pageNumber}.${format}`, mime });
        if (pdfOutput) {
          const embedded = await pdfOutput.embedJpg(await blob.arrayBuffer());
          const baseViewport = page.getViewport({ scale: 1 });
          const outPage = pdfOutput.addPage([baseViewport.width, baseViewport.height]);
          outPage.drawImage(embedded, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
        }
      } finally {
        try { page.cleanup(); } catch { /* Keep the original render error if page cleanup fails. */ }
        canvas.width = 0; canvas.height = 0;
      }
      onProgress(Math.round((pageNumber / document.numPages) * 90));
    }
    return { outputs, pdfOutput };
  } finally {
    await loadingTask.destroy().catch(() => {});
  }
}

async function compressPdf(file: File, level: "low" | "medium" | "high", onProgress: (progress: number) => void): Promise<ToolResult> {
  const settings = { low: { scale: 2.15, quality: 0.9 }, medium: { scale: 1.7, quality: 0.78 }, high: { scale: 1.35, quality: 0.64 } }[level];
  const { pdfOutput } = await renderPdfPages(file, onProgress, settings.scale, "jpg", settings.quality);
  if (!pdfOutput) throw new Error("Could not prepare a compressed PDF.");
  const compressed = bytesToBlob(await pdfOutput.save({ useObjectStreams: true }), "application/pdf");
  const originalSize = file.size;
  const outputSize = compressed.size;
  const savedBytes = originalSize - outputSize;
  const savingsPercent = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;
  const reduced = savingsPercent >= 5;
  if (reduced) return {
    blob: compressed, filename: `${baseName(file.name)}-compressed.pdf`, mime: "application/pdf",
    title: "Compression complete",
    notice: `Compressed at ${level} quality. Original text and vector elements were rasterized as page images.`,
    comparison: { originalSize, outputSize, savedBytes, savingsPercent, reduced }
  };
  return {
    blob: file, filename: file.name, mime: "application/pdf", title: "No meaningful size reduction", downloadLabel: "Download original (recommended)",
    notice: outputSize >= originalSize ? (level === "high" ? "This PDF could not be reduced further without additional quality loss. The original is the recommended download. The generated alternative is available below." : "This PDF could not be reduced further without additional quality loss. The original is the recommended download. Try High Compression for a smaller output.") : `The output is only ${savingsPercent.toFixed(1)}% smaller, below the 5% threshold for a meaningful reduction. The original is the recommended download. The generated alternative is available below.`,
    alternatives: [{ blob: compressed, filename: `${baseName(file.name)}-${level}-compression-alternative.pdf`, mime: "application/pdf" }],
    comparison: { originalSize, outputSize, savedBytes, savingsPercent, reduced }
  };
}

async function convertPdfToImages(file: File, onProgress: (progress: number) => void, format: "jpg" | "png" = "jpg"): Promise<ToolResult> {
  const { outputs } = await renderPdfPages(file, onProgress, 1.8, format, 0.88);
  if (outputs.length === 0) throw new Error("No pages were found in this PDF.");
  return { blob: outputs[0].blob, filename: outputs[0].filename, mime: outputs[0].mime, previewImageBlob: outputs[0].blob, files: outputs, downloadAll: await zipResultFiles(outputs), downloadAllFilename: `${baseName(file.name)}-images.zip` };
}
