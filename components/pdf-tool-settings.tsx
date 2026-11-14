"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { NumberingOptions, PdfInspection, TextExtractionOptions, WatermarkOptions } from "../lib/pdf-processing";

const control = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";
const labelClass = "mt-4 block text-sm font-bold text-ink";
const positions = ["top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right", "diagonal-center"] as const;
const positionLabels: Record<(typeof positions)[number], string> = {
  "top-left": "Top left", "top-center": "Top center", "top-right": "Top right", center: "Center",
  "bottom-left": "Bottom left", "bottom-center": "Bottom center", "bottom-right": "Bottom right", "diagonal-center": "Diagonal center",
};

export function PdfToolSettings(props: {
  slug: string;
  file?: File;
  inspection: PdfInspection | null;
  watermark: WatermarkOptions;
  setWatermark: (next: WatermarkOptions) => void;
  numbering: NumberingOptions;
  setNumbering: (next: NumberingOptions) => void;
  watermarkImage: File | null;
  setWatermarkImage: (file: File | null) => void;
  protectPassword: string;
  setProtectPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  ownerPassword: string;
  setOwnerPassword: (value: string) => void;
  permissions: { printing: boolean; copying: boolean; editing: boolean; annotations: boolean; formFilling: boolean };
  setPermissions: (next: { printing: boolean; copying: boolean; editing: boolean; annotations: boolean; formFilling: boolean }) => void;
  unlockPassword: string;
  setUnlockPassword: (value: string) => void;
  unlockAuthorized: boolean;
  setUnlockAuthorized: (value: boolean) => void;
  textOptions: TextExtractionOptions;
  setTextOptions: (next: TextExtractionOptions) => void;
  sourcePassword: string;
  setSourcePassword: (value: string) => void;
}) {
  const { slug } = props;
  if (slug === "pdf-watermark") return <WatermarkSettings {...props}/>;
  if (slug === "pdf-page-numbering") return <NumberingSettings {...props}/>;
  if (slug === "protect-pdf") return <ProtectSettings {...props}/>;
  if (slug === "unlock-pdf") return <UnlockSettings {...props}/>;
  if (slug === "pdf-to-text") return <TextSettings {...props}/>;
  return null;
}

function WatermarkSettings(props: Parameters<typeof PdfToolSettings>[0]) {
  const w = props.watermark;
  const set = (update: Partial<WatermarkOptions>) => props.setWatermark({ ...w, ...update });
  return <div className="mt-5 rounded-2xl border border-line bg-pale p-4 sm:p-5">
    <h3 className="font-extrabold text-ink">Watermark settings</h3>
    <label className={labelClass}>Watermark type<select value={w.content} onChange={(event) => set({ content: event.target.value as WatermarkOptions["content"] })} className={`${control} mt-2`}><option value="text">Text</option><option value="image">Image (PNG or JPG)</option></select></label>
    {w.content === "text" ? <>
      <label className={labelClass}>Watermark text<input value={w.text} onChange={(event) => set({ text: event.target.value })} className={`${control} mt-2`} maxLength={120}/></label>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <Select label="Font family" value={w.font} onChange={(value) => set({ font: value as WatermarkOptions["font"] })} options={[["Helvetica", "Helvetica"], ["TimesRoman", "Times Roman"], ["Courier", "Courier"]]}/>
        <Field label="Font size" value={String(w.fontSize)} onChange={(value) => set({ fontSize: Number(value) })} min="6" max="160"/>
      </div>
      <div className="mt-2 flex flex-wrap gap-4"><Check label="Bold" checked={w.bold} onChange={(value) => set({ bold: value })}/><Check label="Italic" checked={w.italic} onChange={(value) => set({ italic: value })}/></div>
    </> : <>
      <label className={labelClass}>Watermark image<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event) => props.setWatermarkImage(event.target.files?.[0] || null)} className={`${control} mt-2`} aria-label="Choose a PNG or JPG watermark image"/></label>
      {props.watermarkImage && <p className="mt-2 text-xs text-muted">{props.watermarkImage.name} · {(props.watermarkImage.size / 1024).toFixed(0)} KB</p>}
      <Field label="Image width (PDF points)" value={String(w.imageSize)} onChange={(value) => set({ imageSize: Number(value) })} min="24" max="600"/>
    </>}
    <div className="mt-2 grid grid-cols-2 gap-3">
      <label className={labelClass}>Color<input type="color" value={w.color} onChange={(event) => set({ color: event.target.value })} className={`${control} mt-2 h-11 p-1.5`}/></label>
      <Field label="Opacity (0.05–1)" value={String(w.opacity)} onChange={(value) => set({ opacity: Number(value) })} min="0.05" max="1" step="0.05"/>
      <Field label="Rotation (degrees)" value={String(w.rotation)} onChange={(value) => set({ rotation: Number(value) })} min="-360" max="360"/>
      <Field label="Distance from edges" value={String(w.margin)} onChange={(value) => set({ margin: Number(value) })} min="0" max="200"/>
    </div>
    <Select label="Position" value={w.position} onChange={(value) => set({ position: value as WatermarkOptions["position"] })} options={positions.map((position) => [position, positionLabels[position]])}/>
    <div className="mt-3 flex flex-wrap gap-4"><Check label="Repeat as a pattern" checked={w.repeat} onChange={(value) => set({ repeat: value })}/></div>
    <PageSelection scope={w.scope} ranges={w.pageRanges} onChange={(scope, pageRanges) => set({ scope, pageRanges })} pageCount={props.inspection?.pageCount || 0}/>
    {props.inspection?.isEncrypted && <PasswordField label="PDF open password" value={props.sourcePassword} onChange={props.setSourcePassword} help="The document is encrypted. Enter a password you are authorized to use."/>}
    <PdfPagePreview file={props.file} pageCount={props.inspection?.pageCount || 0} password={props.sourcePassword} watermark={w} watermarkImage={props.watermarkImage}/>
    <p className="mt-3 text-xs leading-5 text-muted">The listed fonts are built-in PDF fonts. Watermark text outside their supported character set may not render correctly.</p>
  </div>;
}

function NumberingSettings(props: Parameters<typeof PdfToolSettings>[0]) {
  const n = props.numbering;
  const set = (update: Partial<NumberingOptions>) => props.setNumbering({ ...n, ...update });
  const numberPositions = positions.filter((position) => position.startsWith("top") || position.startsWith("bottom")) as NumberingOptions["position"][];
  return <div className="mt-5 rounded-2xl border border-line bg-pale p-4 sm:p-5">
    <h3 className="font-extrabold text-ink">Page numbering settings</h3>
    <div className="grid grid-cols-2 gap-3">
      <Select label="Position" value={n.position} onChange={(value) => set({ position: value as NumberingOptions["position"] })} options={numberPositions.map((position) => [position, positionLabels[position]])}/>
      <Select label="Format" value={n.format} onChange={(value) => set({ format: value as NumberingOptions["format"] })} options={[["plain", "1, 2, 3…"], ["page", "Page 1, Page 2…"], ["of", "1 of 10"], ["page-of", "Page 1 of 10"], ["roman", "Roman numerals (I, II…) "]]}/>
      <Select label="Font family" value={n.font} onChange={(value) => set({ font: value as NumberingOptions["font"] })} options={[["Helvetica", "Helvetica"], ["TimesRoman", "Times Roman"], ["Courier", "Courier"]]}/>
      <Field label="Font size" value={String(n.fontSize)} onChange={(value) => set({ fontSize: Number(value) })} min="6" max="72"/>
      <label className={labelClass}>Font color<input type="color" value={n.color} onChange={(event) => set({ color: event.target.value })} className={`${control} mt-2 h-11 p-1.5`}/></label>
      <Field label="Distance from edges" value={String(n.margin)} onChange={(value) => set({ margin: Number(value) })} min="0" max="200"/>
      <Field label="Start numbering at" value={String(n.startingNumber)} onChange={(value) => set({ startingNumber: Number(value) })} min="1" max="1000000"/>
      <Field label="Start on PDF page" value={String(n.startingPdfPage)} onChange={(value) => set({ startingPdfPage: Number(value) })} min="1" max={String(props.inspection?.pageCount || 9999)}/>
    </div>
    <div className="mt-3 flex flex-wrap gap-4"><Check label="Bold" checked={n.bold} onChange={(value) => set({ bold: value })}/><Check label="Skip cover page" checked={n.skipCover} onChange={(value) => set({ skipCover: value })}/></div>
    <div className="mt-2 grid grid-cols-2 gap-3"><Field label="Prefix" value={n.prefix} onChange={(value) => set({ prefix: value })} type="text"/><Field label="Suffix" value={n.suffix} onChange={(value) => set({ suffix: value })} type="text"/></div>
    <PageSelection scope={n.scope} ranges={n.pageRanges} onChange={(scope, pageRanges) => set({ scope, pageRanges })} pageCount={props.inspection?.pageCount || 0}/>
    <label className={labelClass}>Skip PDF pages (optional)<input value={n.skipPages} onChange={(event) => set({ skipPages: event.target.value })} placeholder="1 or 1, 4-5" className={`${control} mt-2`}/></label>
    {props.inspection?.isEncrypted && <PasswordField label="PDF open password" value={props.sourcePassword} onChange={props.setSourcePassword} help="The document is encrypted. Enter a password you are authorized to use."/>}
    <PdfPagePreview file={props.file} pageCount={props.inspection?.pageCount || 0} password={props.sourcePassword} numbering={n}/>
    <p className="mt-3 text-xs leading-5 text-muted">For “of” formats, the total is the number of pages receiving numbers after range, start-page, cover, and skip rules are applied.</p>
  </div>;
}

function ProtectSettings(props: Parameters<typeof PdfToolSettings>[0]) {
  const p = props.protectPassword;
  const [show, setShow] = useState(false);
  const permissions = props.permissions;
  const restricted = Object.values(permissions).some((value) => !value);
  const strength = p.length < 8 ? "Too short" : p.length >= 14 && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p) ? "Strong" : "Fair";
  const changePermission = (key: keyof typeof permissions, value: boolean) => props.setPermissions({ ...permissions, [key]: value });
  return <div className="mt-5 rounded-2xl border border-line bg-pale p-4 sm:p-5">
    <h3 className="font-extrabold text-ink">Password protection</h3>
    <p className="mt-2 text-xs leading-5 text-muted">Processing stays in this browser. Passwords are used in memory for this run and are not added to account history.</p>
    <PasswordField label="Open password (at least 8 characters)" value={p} onChange={props.setProtectPassword} visible={show} onVisibility={() => setShow((current) => !current)}/>
    <p className={`mt-2 text-xs font-bold ${strength === "Strong" ? "text-emerald-700" : strength === "Fair" ? "text-amber-700" : "text-red-700"}`}>Password strength: {strength}</p>
    <PasswordField label="Confirm open password" value={props.confirmPassword} onChange={props.setConfirmPassword} visible={show}/>
    <div className="mt-4 rounded-xl border border-line bg-white p-3">
      <p className="text-sm font-extrabold">Reader permissions</p>
      <p className="mt-1 text-xs leading-5 text-muted">PDF permissions are reader-enforced and are not DRM. Some readers may ignore them.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Check label="Allow printing" checked={permissions.printing} onChange={(value) => changePermission("printing", value)}/>
        <Check label="Allow text and image copying" checked={permissions.copying} onChange={(value) => changePermission("copying", value)}/>
        <Check label="Allow editing" checked={permissions.editing} onChange={(value) => changePermission("editing", value)}/>
        <Check label="Allow annotations" checked={permissions.annotations} onChange={(value) => changePermission("annotations", value)}/>
        <Check label="Allow form filling" checked={permissions.formFilling} onChange={(value) => changePermission("formFilling", value)}/>
      </div>
    </div>
    {restricted && <PasswordField label="Separate owner password (required for restricted permissions)" value={props.ownerPassword} onChange={props.setOwnerPassword} visible={show} help="The owner password grants full access in compatible readers. Keep it separate from the open password."/>}
    {props.inspection?.isEncrypted && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">This PDF is already encrypted. Unlock it with a known password before protecting it again.</p>}
    {props.file && <p className="mt-3 text-xs text-muted">{props.inspection?.pageCount || "…"} page{props.inspection?.pageCount === 1 ? "" : "s"} will be encrypted using AES-256.</p>}
  </div>;
}

function UnlockSettings(props: Parameters<typeof PdfToolSettings>[0]) {
  const [show, setShow] = useState(false);
  return <div className="mt-5 rounded-2xl border border-line bg-pale p-4 sm:p-5">
    <h3 className="font-extrabold text-ink">Unlock with a known password</h3>
    <p className="mt-2 text-sm leading-6 text-muted">Enter an opening password or owner password you know and are authorized to use. This tool does not guess or bypass passwords. No password is sent to a server. Some PDFs do not let this browser library distinguish an opening password from an owner password, so permission-only restriction removal cannot be independently confirmed.</p>
    {props.inspection?.isEncrypted ? <PasswordField label="Existing PDF password" value={props.unlockPassword} onChange={props.setUnlockPassword} visible={show} onVisibility={() => setShow((current) => !current)}/> : <p className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-emerald-800">{props.file ? "This PDF is not encrypted. Processing will make a validated unencrypted copy." : "Choose a PDF to check its password protection."}</p>}
    <label className="mt-4 flex items-start gap-2 text-sm font-semibold leading-5 text-ink"><input type="checkbox" checked={props.unlockAuthorized} onChange={(event) => props.setUnlockAuthorized(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#7651E8]"/><span>I own this PDF or am authorized to remove its password protection and restrictions.</span></label>
    {props.file && <p className="mt-3 text-xs text-muted">{props.inspection?.pageCount || "…"} page{props.inspection?.pageCount === 1 ? "" : "s"} · the uploaded original will not be changed.</p>}
  </div>;
}

function TextSettings(props: Parameters<typeof PdfToolSettings>[0]) {
  const t = props.textOptions;
  const set = (update: Partial<TextExtractionOptions>) => props.setTextOptions({ ...t, ...update });
  return <div className="mt-5 rounded-2xl border border-line bg-pale p-4 sm:p-5">
    <h3 className="font-extrabold text-ink">Text extraction options</h3>
    <PageSelection scope={t.scope} ranges={t.pageRanges} onChange={(scope, pageRanges) => set({ scope, pageRanges })} pageCount={props.inspection?.pageCount || 0}/>
    <div className="mt-4 grid gap-3"><Check label="Preserve line breaks" checked={t.preserveLineBreaks} onChange={(value) => set({ preserveLineBreaks: value })}/><Check label="Clean repeated spaces and blank lines" checked={t.cleanSpaces} onChange={(value) => set({ cleanSpaces: value })}/><Check label="Include page separators" checked={t.pageSeparators} onChange={(value) => set({ pageSeparators: value })}/></div>
    {props.inspection?.isEncrypted && <PasswordField label="PDF open password" value={props.sourcePassword} onChange={props.setSourcePassword} help="This encrypted PDF needs a password you are authorized to use."/>}
    <p className="mt-3 text-xs leading-5 text-muted">This extracts existing selectable text. Scanned page images need OCR, which this tool does not run.</p>
  </div>;
}

function PageSelection({ scope, ranges, onChange, pageCount }: { scope: "all" | "selected"; ranges: string; onChange: (scope: "all" | "selected", ranges: string) => void; pageCount: number }) {
  return <div className="mt-4 rounded-xl border border-line bg-white p-3">
    <Select label="Pages to process" value={scope} onChange={(value) => onChange(value as "all" | "selected", ranges)} options={[["all", "All pages"], ["selected", "Selected pages / custom range"]]}/>
    {scope === "selected" && <label className={labelClass}>Page list or ranges<input value={ranges} onChange={(event) => onChange(scope, event.target.value)} className={`${control} mt-2`} placeholder={pageCount ? `Example: 1, 3-${Math.min(pageCount, 5)}` : "Example: 1, 3-5"}/><span className="mt-1 block text-xs font-normal text-muted">Use comma-separated pages and ranges, such as 1, 3-5.</span></label>}
  </div>;
}

function PdfPagePreview({ file, pageCount, password, watermark, watermarkImage, numbering }: { file?: File; pageCount: number; password: string; watermark?: WatermarkOptions; watermarkImage?: File | null; numbering?: NumberingOptions }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [previewError, setPreviewError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  useEffect(() => { setPageNumber(1); }, [file]);
  useEffect(() => {
    if (!watermarkImage) { setImageUrl(""); return; }
    const url = URL.createObjectURL(watermarkImage);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [watermarkImage]);
  useEffect(() => {
    if (!file || !pageCount || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    const render = async () => {
      setPreviewError("");
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password });
      const document = await task.promise;
      if (cancelled) { await task.destroy(); return; }
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: Math.min(1, 520 / page.getViewport({ scale: 1 }).width) });
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Preview is not available in this browser.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      await task.destroy();
    };
    void render().catch((cause) => { if (!cancelled) setPreviewError(cause instanceof Error ? cause.message : "Could not render the preview."); });
    return () => { cancelled = true; canvas.width = 0; canvas.height = 0; };
  }, [file, pageCount, pageNumber, password]);
  const overlayStyle = useMemo(() => {
    const position = watermark?.position || numbering?.position || "bottom-center";
    const top = position.startsWith("top");
    const bottom = position.startsWith("bottom");
    const left = position.endsWith("left");
    const right = position.endsWith("right");
    const centered = position === "center" || position === "diagonal-center";
    const horizontalCenter = position.endsWith("center");
    const transform = `${centered ? "translate(-50%, -50%)" : horizontalCenter ? "translateX(-50%)" : ""}${watermark ? ` rotate(${watermark.rotation}deg)` : ""}`.trim();
    return {
      top: top || centered ? (top ? "6%" : "50%") : undefined,
      bottom: bottom ? "6%" : undefined,
      left: left || horizontalCenter ? (left ? "6%" : "50%") : undefined,
      right: right ? "6%" : undefined,
      transform: transform || undefined,
    } as CSSProperties;
  }, [watermark?.position, watermark?.rotation, numbering?.position]);
  if (!file) return null;
  const sampleText = watermark?.content === "text" ? watermark.text : numbering ? getNumberPreview(numbering) : "";
  return <div className="mt-5 rounded-xl border border-line bg-white p-3">
    <div className="flex items-center justify-between gap-2"><p className="text-sm font-extrabold">Live page preview</p><div className="flex items-center gap-2 text-xs font-semibold"><button aria-label="Previous preview page" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))} className="rounded-lg border border-line p-1.5 disabled:opacity-40"><ChevronLeft size={16}/></button><span>Page {pageNumber} of {pageCount || "…"}</span><button aria-label="Next preview page" disabled={pageNumber >= pageCount} onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-line p-1.5 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
    <div className="relative mx-auto mt-3 w-fit max-w-full overflow-hidden rounded-lg border border-line bg-white shadow-sm"><canvas ref={canvasRef} className="block max-h-[580px] max-w-full"/>
      {(watermark || numbering) && <div aria-hidden="true" className={`pointer-events-none absolute max-w-[88%] text-center ${watermark?.repeat ? "grid grid-cols-3 gap-x-5 gap-y-16" : ""}`} style={{ ...overlayStyle, color: watermark?.color || numbering?.color, opacity: watermark?.opacity ?? 1, fontSize: `${Math.max(10, (watermark?.fontSize || numbering?.fontSize || 12) * 0.55)}px`, fontFamily: watermark?.font === "TimesRoman" || numbering?.font === "TimesRoman" ? "'Times New Roman', serif" : watermark?.font === "Courier" || numbering?.font === "Courier" ? "'Courier New', monospace" : "Arial, sans-serif", fontWeight: (watermark?.bold || numbering?.bold) ? 700 : 400, fontStyle: watermark?.italic ? "italic" : undefined, whiteSpace: "nowrap" }}>
        {watermark?.content === "image" && imageUrl ? <img src={imageUrl} alt="Watermark preview" style={{ width: `${Math.min(190, watermark.imageSize * 0.55)}px`, maxWidth: "40vw", opacity: watermark.opacity, transform: `rotate(${watermark.rotation}deg)` }}/> : watermark?.repeat ? Array.from({ length: 9 }, (_, index) => <span key={index}>{sampleText}</span>) : sampleText}
      </div>}
    </div>
    {previewError && <p role="status" className="mt-2 text-xs text-amber-800">Preview: {previewError}</p>}
  </div>;
}

function getNumberPreview(options: NumberingOptions) {
  const text = options.format === "page" || options.format === "page-of" ? `Page ${options.startingNumber}` : options.format === "roman" ? "I" : String(options.startingNumber);
  return `${options.prefix}${text}${options.format === "of" || options.format === "page-of" ? " of 10" : ""}${options.suffix}`;
}

function Field({ label, value, onChange, type = "number", min, max, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; max?: string; step?: string }) {
  return <label className={labelClass}>{label}<input type={type} min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className={`${control} mt-2`}/></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) {
  return <label className={labelClass}>{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={`${control} mt-2`}>{options.map(([option, title]) => <option value={option} key={option}>{title}</option>)}</select></label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#7651E8]"/>{label}</label>;
}

function PasswordField({ label, value, onChange, help, visible, onVisibility }: { label: string; value: string; onChange: (value: string) => void; help?: string; visible?: boolean; onVisibility?: () => void }) {
  return <label className={labelClass}>{label}<span className="relative mt-2 block"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" className={`${control} ${onVisibility ? "pr-11" : ""}`}/>{onVisibility && <button type="button" onClick={onVisibility} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}</span>{help && <span className="mt-1 block text-xs font-normal leading-5 text-muted">{help}</span>}</label>;
}
