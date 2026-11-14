"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import {
  ArrowLeftRight,
  Calendar,
  CalendarHeart,
  Check,
  Clock,
  CloudRain,
  CloudSun,
  Coins,
  Compass,
  Copy,
  Download,
  Droplets,
  ExternalLink,
  Globe,
  MapPin,
  Moon,
  Network,
  Plus,
  QrCode,
  RotateCcw,
  ScanBarcode,
  Search,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Wind,
  X,
} from "lucide-react";
import { countriesData, type CountryData } from "../lib/countries-data";
import type { Tool } from "../lib/tools";

const inputClass =
  "w-full rounded-xl border border-line bg-pale/50 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function UtilityToolWorkspace({ tool }: { tool: Pick<Tool, "slug" | "name" | "description" | "category" | "pro"> }) {
  if (tool.slug === "qr-code-generator") return <QrCodeGeneratorWorkspace />;
  if (tool.slug === "barcode-generator") return <BarcodeGeneratorWorkspace />;
  if (tool.slug === "currency-converter") return <CurrencyConverterWorkspace />;
  if (tool.slug === "weather-forecast") return <WeatherForecastWorkspace />;
  if (tool.slug === "world-clock-converter") return <WorldClockConverterWorkspace />;
  if (tool.slug === "public-holiday-finder") return <PublicHolidayFinderWorkspace />;
  if (tool.slug === "ip-address-lookup") return <IpAddressLookupWorkspace />;
  if (tool.slug === "country-information-finder") return <CountryInformationFinderWorkspace />;
  if (tool.slug === "sunrise-sunset-calculator") return <SunriseSunsetCalculatorWorkspace />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #38 — QR Code Generator
// ─────────────────────────────────────────────────────────────────────────────
function QrCodeGeneratorWorkspace() {
  const [type, setType] = useState<"url" | "text" | "email" | "phone" | "wifi" | "vcard">("url");
  const [url, setUrl] = useState("https://toolmodeon.online");
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phone, setPhone] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  const [vcardName, setVcardName] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");
  const [vcardTitle, setVcardTitle] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardUrl, setVcardUrl] = useState("");

  const [size, setSize] = useState(300);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");

  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payload = useMemo(() => {
    switch (type) {
      case "url":
        return url.trim();
      case "text":
        return text;
      case "email":
        return `mailto:${email.trim()}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "phone":
        return `tel:${phone.trim()}`;
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSsid.replace(/([\\;,:])/g, "\\$1")};P:${wifiPassword.replace(/([\\;,:])/g, "\\$1")};H:${wifiHidden ? "true" : "false"};;`;
      case "vcard":
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${vcardName.trim()}`,
          vcardOrg ? `ORG:${vcardOrg.trim()}` : "",
          vcardTitle ? `TITLE:${vcardTitle.trim()}` : "",
          vcardPhone ? `TEL:${vcardPhone.trim()}` : "",
          vcardEmail ? `EMAIL:${vcardEmail.trim()}` : "",
          vcardUrl ? `URL:${vcardUrl.trim()}` : "",
          "END:VCARD",
        ]
          .filter(Boolean)
          .join("\n");
      default:
        return "";
    }
  }, [type, url, text, email, emailSubject, emailBody, phone, wifiSsid, wifiPassword, wifiEncryption, wifiHidden, vcardName, vcardOrg, vcardTitle, vcardPhone, vcardEmail, vcardUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload.trim()) return;
    void QRCode.toCanvas(canvas, payload, {
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: errorLevel,
    }).catch(() => {});
  }, [payload, size, fgColor, bgColor, errorLevel]);

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-code.png";
    a.click();
  }

  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(payload, {
        type: "svg",
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "qr-code.svg";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // handled
    }
  }

  async function copyQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      // Fallback: copy string payload
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function reset() {
    setType("url");
    setUrl("https://toolmodeon.online");
    setText("");
    setEmail("");
    setEmailSubject("");
    setEmailBody("");
    setPhone("");
    setWifiSsid("");
    setWifiPassword("");
    setVcardName("");
    setSize(300);
    setFgColor("#000000");
    setBgColor("#ffffff");
    setErrorLevel("M");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap gap-2 pb-4 border-b border-line">
          {(
            [
              { id: "url", label: "Website URL" },
              { id: "text", label: "Plain Text" },
              { id: "email", label: "Email" },
              { id: "phone", label: "Phone" },
              { id: "wifi", label: "Wi-Fi" },
              { id: "vcard", label: "Contact (vCard)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                type === t.id ? "bg-ink text-white shadow-sm" : "border border-line bg-white text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {type === "url" && (
            <label className="block text-sm font-bold text-ink">
              Website URL
              <input value={url} onChange={(e) => setUrl(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="https://example.com" />
            </label>
          )}

          {type === "text" && (
            <label className="block text-sm font-bold text-ink">
              Plain Text
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={`${inputClass} mt-1.5 resize-y`} placeholder="Enter any message or note..." />
            </label>
          )}

          {type === "email" && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-ink">
                Email Address
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="contact@example.com" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Subject (optional)
                <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Inquiry from QR" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Message Body (optional)
                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={3} className={`${inputClass} mt-1.5 resize-y`} placeholder="Hello..." />
              </label>
            </div>
          )}

          {type === "phone" && (
            <label className="block text-sm font-bold text-ink">
              Phone Number
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="+1 (555) 000-0000" />
            </label>
          )}

          {type === "wifi" && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-ink">
                Network SSID
                <input value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Office Wi-Fi" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Password
                <input type="text" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Wi-Fi Password" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold text-ink">
                  Security
                  <select value={wifiEncryption} onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")} className={`${inputClass} mt-1.5`}>
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={wifiHidden} onChange={(e) => setWifiHidden(e.target.checked)} className="rounded text-brand" /> Hidden network
                </label>
              </div>
            </div>
          )}

          {type === "vcard" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-bold text-ink">
                Full Name
                <input value={vcardName} onChange={(e) => setVcardName(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Jane Doe" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Phone Number
                <input type="tel" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="+1 555-0199" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Email
                <input type="email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="jane@company.com" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Organization
                <input value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Acme Corp" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Job Title
                <input value={vcardTitle} onChange={(e) => setVcardTitle(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Product Lead" />
              </label>
              <label className="block text-sm font-bold text-ink">
                Website
                <input value={vcardUrl} onChange={(e) => setVcardUrl(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="https://janedoe.com" />
              </label>
            </div>
          )}

          {/* Appearance controls */}
          <div className="pt-4 border-t border-line grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-ink">
              QR Size: {size}px
              <input type="range" min="160" max="600" step="20" value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1.5 w-full accent-brand" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Error Correction
              <select value={errorLevel} onChange={(e) => setErrorLevel(e.target.value as "L" | "M" | "Q" | "H")} className={`${inputClass} mt-1.5`}>
                <option value="L">Low (~7% recovery)</option>
                <option value="M">Medium (~15% recovery)</option>
                <option value="Q">Quartile (~25% recovery)</option>
                <option value="H">High (~30% recovery)</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-ink">
              QR Color
              <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Background Color
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1" />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={reset} className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:text-ink">
              <RotateCcw size={13} className="inline mr-1" /> Reset
            </button>
          </div>
        </div>
      </section>

      {/* Right Column: Live QR Preview & Export */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Live Preview</p>
          <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-xl bg-pale p-4">
            <canvas ref={canvasRef} className="max-h-[260px] max-w-full rounded-lg shadow-sm" />
          </div>

          <div className="mt-5 space-y-2">
            <button onClick={downloadPng} className="gradient-bg flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand/20 hover:opacity-95">
              <Download size={15} /> Download PNG
            </button>
            <button onClick={downloadSvg} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:border-brand">
              <Download size={15} /> Download SVG
            </button>
            <button onClick={copyQr} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-muted hover:text-ink">
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              {copied ? "Copied to clipboard!" : "Copy Image"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-pale p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <ShieldCheck size={16} className="text-brand" /> 100% Client-Side
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            QR codes are generated locally inside your browser canvas. No data or credentials ever leave your device.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #39 — Barcode Generator
// ─────────────────────────────────────────────────────────────────────────────
function BarcodeGeneratorWorkspace() {
  const [format, setFormat] = useState<"CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "ITF">("CODE128");
  const [value, setValue] = useState("TOOLMODEON-2026");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [displayValue, setDisplayValue] = useState(true);
  const [lineColor, setLineColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [error, setError] = useState("");

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Auto-calculate check digit for EAN-13, EAN-8, UPC
  function computeEan13(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 13);
    if (digits.length === 12) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      return digits + check;
    }
    return digits;
  }

  function computeEan8(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length === 7) {
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
      }
      const check = (10 - (sum % 10)) % 10;
      return digits + check;
    }
    return digits;
  }

  function computeUpcA(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    if (digits.length === 11) {
      let sum = 0;
      for (let i = 0; i < 11; i++) {
        sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
      }
      const check = (10 - (sum % 10)) % 10;
      return digits + check;
    }
    return digits;
  }

  const sanitizedValue = useMemo(() => {
    const val = value.trim();
    if (format === "EAN13") return computeEan13(val);
    if (format === "EAN8") return computeEan8(val);
    if (format === "UPC") return computeUpcA(val);
    if (format === "ITF") return val.replace(/\D/g, "");
    if (format === "CODE39") return val.toUpperCase();
    return val;
  }, [format, value]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !sanitizedValue) return;
    setError("");

    // Validate requirements before JsBarcode call
    if (format === "EAN13" && sanitizedValue.length !== 13) {
      setError("EAN-13 requires 12 or 13 digits.");
      return;
    }
    if (format === "EAN8" && sanitizedValue.length !== 8) {
      setError("EAN-8 requires 7 or 8 digits.");
      return;
    }
    if (format === "UPC" && sanitizedValue.length !== 12) {
      setError("UPC-A requires 11 or 12 digits.");
      return;
    }
    if (format === "ITF" && (sanitizedValue.length % 2 !== 0 || sanitizedValue.length === 0)) {
      setError("ITF (Interleaved 2 of 5) requires an even number of numeric digits.");
      return;
    }

    try {
      JsBarcode(svg, sanitizedValue, {
        format,
        width,
        height,
        displayValue,
        lineColor,
        background: bgColor,
        margin: 12,
        valid: (valid) => {
          if (!valid) setError(`Invalid input for ${format} format.`);
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate barcode.");
    }
  }, [format, sanitizedValue, width, height, displayValue, lineColor, bgColor]);

  function downloadSvg() {
    const svg = svgRef.current;
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([s], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `barcode-${sanitizedValue}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadPng() {
    const svg = svgRef.current;
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([s], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `barcode-${sanitizedValue}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function reset() {
    setFormat("CODE128");
    setValue("TOOLMODEON-2026");
    setWidth(2);
    setHeight(80);
    setDisplayValue(true);
    setLineColor("#000000");
    setBgColor("#ffffff");
    setError("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-ink">
            Barcode Format
            <select
              value={format}
              onChange={(e) => {
                const nextFmt = e.target.value as "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC" | "ITF";
                setFormat(nextFmt);
                if (nextFmt === "EAN13") setValue("400638133393");
                else if (nextFmt === "EAN8") setValue("7351353");
                else if (nextFmt === "UPC") setValue("01234567890");
                else if (nextFmt === "ITF") setValue("123456");
                else if (nextFmt === "CODE39") setValue("CODE39-TEST");
                else setValue("TOOLMODEON-2026");
              }}
              className={`${inputClass} mt-1.5`}
            >
              <option value="CODE128">Code 128 (Standard alphanumeric)</option>
              <option value="CODE39">Code 39 (Industrial uppercase alphanumeric)</option>
              <option value="EAN13">EAN-13 (12 or 13 digits with auto check digit)</option>
              <option value="EAN8">EAN-8 (7 or 8 digits with auto check digit)</option>
              <option value="UPC">UPC-A (11 or 12 digits retail standard)</option>
              <option value="ITF">ITF / Interleaved 2 of 5 (Even numeric)</option>
            </select>
          </label>

          <label className="block text-sm font-bold text-ink">
            Barcode Value
            <input value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} mt-1.5 font-mono`} placeholder="Enter barcode data..." />
          </label>

          {sanitizedValue !== value && (
            <p className="text-xs text-brand font-semibold">
              Computed value with check digit: <span className="font-mono">{sanitizedValue}</span>
            </p>
          )}

          {error && <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-line">
            <label className="block text-sm font-bold text-ink">
              Bar Width: {width}px
              <input type="range" min="1" max="4" step="1" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="mt-1.5 w-full accent-brand" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Bar Height: {height}px
              <input type="range" min="40" max="150" step="5" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="mt-1.5 w-full accent-brand" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Bar Color
              <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Background Color
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-line bg-white p-1" />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink pt-1">
            <input type="checkbox" checked={displayValue} onChange={(e) => setDisplayValue(e.target.checked)} className="rounded text-brand" /> Show human-readable text below barcode
          </label>

          <div className="pt-2">
            <button type="button" onClick={reset} className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:text-ink">
              <RotateCcw size={13} className="inline mr-1" /> Reset
            </button>
          </div>
        </div>
      </section>

      {/* Right Column: Barcode Preview & Export */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Barcode Preview</p>
          <div className="mt-4 flex min-h-[180px] items-center justify-center overflow-x-auto rounded-xl bg-pale p-4">
            <svg ref={svgRef} className="max-w-full" />
          </div>

          <div className="mt-5 space-y-2">
            <button onClick={downloadPng} disabled={Boolean(error)} className="gradient-bg flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand/20 hover:opacity-95 disabled:opacity-50">
              <Download size={15} /> Download PNG
            </button>
            <button onClick={downloadSvg} disabled={Boolean(error)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:border-brand disabled:opacity-50">
              <Download size={15} /> Download SVG
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-pale p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <ShieldCheck size={16} className="text-brand" /> Standard Compliance
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            Outputs follow GS1 and ISO standards for scannability on laser scanners, 2D imagers, and mobile cameras.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #40 — Currency Converter
// ─────────────────────────────────────────────────────────────────────────────
function CurrencyConverterWorkspace() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    amount: number;
    base: string;
    target: string;
    rate: number;
    result: number;
    inverseRate: number;
    date: string;
    disclaimer: string;
  } | null>(null);

  const [currencies, setCurrencies] = useState<Record<string, string>>({
    USD: "United States Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    CHF: "Swiss Franc",
    INR: "Indian Rupee",
    CNY: "Chinese Renminbi Yuan",
    SGD: "Singapore Dollar",
  });

  useEffect(() => {
    fetch("/api/tools/currency?action=currencies")
      .then((r) => r.json())
      .then((data) => {
        if (data.currencies) setCurrencies(data.currencies);
      })
      .catch(() => {});
  }, []);

  const convert = useCallback(async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/currency?amount=${encodeURIComponent(num)}&from=${from}&to=${to}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert currency.");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Currency conversion failed.");
    } finally {
      setLoading(false);
    }
  }, [amount, from, to]);

  useEffect(() => {
    void convert();
  }, [from, to]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function reset() {
    setAmount("100");
    setFrom("USD");
    setTo("EUR");
    setError("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-ink">
            Amount
            <input type="number" min="0.01" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} mt-1.5 text-lg font-black`} placeholder="100" />
          </label>

          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <label className="block text-sm font-bold text-ink">
              From Currency
              <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} mt-1.5`}>
                {Object.entries(currencies).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={swap} className="mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-pale text-ink transition hover:border-brand hover:text-brand" title="Swap currencies">
              <ArrowLeftRight size={18} />
            </button>

            <label className="block text-sm font-bold text-ink">
              To Currency
              <select value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} mt-1.5`}>
                {Object.entries(currencies).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={convert} disabled={loading} className="gradient-bg flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand/20 hover:opacity-95 disabled:opacity-50">
              <Coins size={16} /> {loading ? "Converting…" : "Convert Now"}
            </button>
            <button onClick={reset} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-muted hover:text-ink">
              <RotateCcw size={14} className="inline mr-1" /> Reset
            </button>
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          {/* Quick denomination table */}
          {result && (
            <div className="mt-8 border-t border-line pt-6">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">Quick Conversions ({from} to {to})</h4>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[1, 5, 10, 25, 50, 100, 500, 1000].map((v) => (
                  <div key={v} className="rounded-xl border border-line bg-pale/60 p-2.5 text-xs">
                    <span className="font-semibold text-muted">{v} {from} =</span>
                    <span className="block font-black text-ink mt-0.5">{(v * result.rate).toFixed(2)} {to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Result Card */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Converted Amount</p>
          {result ? (
            <div className="mt-3">
              <div className="text-3xl font-black text-ink">
                {result.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-lg font-bold text-emerald-700">{result.target}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {result.amount.toLocaleString()} {result.base}
              </p>

              <div className="mt-5 space-y-2 border-t border-emerald-200/60 pt-4 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-muted">Exchange Rate:</span>
                  <span className="font-bold text-ink">1 {result.base} = {result.rate.toFixed(4)} {result.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Inverse Rate:</span>
                  <span className="font-bold text-ink">1 {result.target} = {result.inverseRate.toFixed(4)} {result.base}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Rate Date:</span>
                  <span className="font-bold text-ink">{result.date}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Enter an amount to see exchange rate.</p>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-pale p-5">
          <p className="text-xs font-bold text-ink">European Central Bank Data</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Rates are updated daily via Frankfurter.dev. Indicative only; retail bank and card processor rates may differ.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #41 — Weather Forecast
// ─────────────────────────────────────────────────────────────────────────────
function WeatherForecastWorkspace() {
  const [query, setQuery] = useState("London");
  const [selectedCity, setSelectedCity] = useState<{ name: string; country?: string; lat: number; lng: number }>({
    name: "London",
    country: "United Kingdom",
    lat: 51.5085,
    lng: -0.1257,
  });
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; country?: string; latitude: number; longitude: number }>>([]);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState<any>(null);

  // Autocomplete city search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/tools/weather?action=geocode&q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.results)) setSuggestions(data.results);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const loadWeather = useCallback(async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tools/weather?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load weather forecast.");
      setWeather(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Weather lookup failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWeather(selectedCity.lat, selectedCity.lng, selectedCity.name);
  }, [selectedCity, loadWeather]);

  function convertTemp(c: number): string {
    if (unit === "F") {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(c)}°C`;
  }

  function getWeatherDesc(code: number): { text: string; icon: typeof Sun } {
    if (code === 0) return { text: "Clear Sky", icon: Sun };
    if ([1, 2].includes(code)) return { text: "Partly Cloudy", icon: CloudSun };
    if (code === 3) return { text: "Overcast", icon: CloudSun };
    if ([45, 48].includes(code)) return { text: "Foggy", icon: CloudSun };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { text: "Rain", icon: CloudRain };
    if ([71, 73, 75, 85, 86].includes(code)) return { text: "Snow", icon: CloudRain };
    if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", icon: CloudRain };
    return { text: "Cloudy", icon: CloudSun };
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-bold text-ink">
              Search City
              <div className="relative mt-1.5">
                <Search size={18} className="absolute left-3.5 top-3.5 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="Type city name (e.g. Tokyo, Paris, New York)..."
                />
              </div>
            </label>

            {suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                {suggestions.map((s) => (
                  <button
                    key={`${s.id}-${s.latitude}`}
                    type="button"
                    onClick={() => {
                      setSelectedCity({ name: s.name, country: s.country, lat: s.latitude, lng: s.longitude });
                      setQuery(s.name);
                      setSuggestions([]);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-ink hover:bg-pale"
                  >
                    <span>
                      {s.name} <span className="text-muted font-normal">{s.country ? `(${s.country})` : ""}</span>
                    </span>
                    <span className="text-[11px] text-muted">
                      {s.latitude.toFixed(2)}°, {s.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-brand" />
              <span className="text-sm font-black text-ink">{selectedCity.name}</span>
              {selectedCity.country && <span className="text-xs text-muted">· {selectedCity.country}</span>}
            </div>
            <div className="flex rounded-xl border border-line bg-pale p-0.5 text-xs font-bold">
              <button onClick={() => setUnit("C")} className={`rounded-lg px-2.5 py-1 ${unit === "C" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                °C
              </button>
              <button onClick={() => setUnit("F")} className={`rounded-lg px-2.5 py-1 ${unit === "F" ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                °F
              </button>
            </div>
          </div>

          {loading && <p className="py-8 text-center text-sm font-semibold text-muted animate-pulse">Loading live weather forecast…</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          {weather && weather.current && (
            <div className="space-y-6">
              {/* Current Overview */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                <div className="rounded-2xl border border-line bg-pale/70 p-4">
                  <span className="text-xs font-semibold text-muted">Feels Like</span>
                  <div className="mt-1 text-2xl font-black text-ink">{convertTemp(weather.current.apparent_temperature)}</div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/70 p-4">
                  <span className="text-xs font-semibold text-muted">Humidity</span>
                  <div className="mt-1 text-2xl font-black text-ink flex items-center gap-1.5">
                    <Droplets size={20} className="text-blue" /> {weather.current.relative_humidity_2m}%
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/70 p-4">
                  <span className="text-xs font-semibold text-muted">Wind</span>
                  <div className="mt-1 text-2xl font-black text-ink flex items-center gap-1.5">
                    <Wind size={20} className="text-brand" /> {weather.current.wind_speed_10m} km/h
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/70 p-4">
                  <span className="text-xs font-semibold text-muted">Precipitation</span>
                  <div className="mt-1 text-2xl font-black text-ink">{weather.current.precipitation} mm</div>
                </div>
              </div>

              {/* Hourly Forecast */}
              {weather.hourly?.time && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">24-Hour Forecast</h4>
                  <div className="mobile-scroll flex gap-2.5 pb-2">
                    {weather.hourly.time.slice(0, 16).map((t: string, i: number) => {
                      const hourStr = new Date(t).toLocaleTimeString([], { hour: "numeric" });
                      const code = weather.hourly.weather_code[i];
                      const info = getWeatherDesc(code);
                      const Icon = info.icon;
                      return (
                        <div key={t} className="min-w-[76px] shrink-0 rounded-2xl border border-line bg-white p-3 text-center shadow-card">
                          <span className="text-[11px] font-bold text-muted">{hourStr}</span>
                          <Icon size={20} className="mx-auto my-2 text-brand" />
                          <span className="text-xs font-black text-ink">{convertTemp(weather.hourly.temperature_2m[i])}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7-Day Forecast */}
              {weather.daily?.time && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">7-Day Daily Forecast</h4>
                  <div className="space-y-2">
                    {weather.daily.time.slice(0, 7).map((d: string, i: number) => {
                      const dayName = new Date(d).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
                      const code = weather.daily.weather_code[i];
                      const info = getWeatherDesc(code);
                      const Icon = info.icon;
                      return (
                        <div key={d} className="flex items-center justify-between rounded-xl border border-line bg-pale/50 px-4 py-2.5 text-xs font-semibold">
                          <span className="w-32 font-bold text-ink">{dayName}</span>
                          <div className="flex items-center gap-2">
                            <Icon size={16} className="text-brand" />
                            <span className="text-muted hidden sm:inline">{info.text}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-ink">{convertTemp(weather.daily.temperature_2m_max[i])}</span>
                            <span className="text-muted ml-2">{convertTemp(weather.daily.temperature_2m_min[i])}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Current Weather Highlight */}
      <aside className="space-y-4">
        {weather?.current && (
          <div className="gradient-bg rounded-2xl p-6 text-white shadow-xl">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">Current Conditions</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-5xl font-black">{convertTemp(weather.current.temperature_2m)}</div>
                <p className="mt-2 text-sm font-semibold text-white/90">{getWeatherDesc(weather.current.weather_code).text}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-md">
                <Sun size={36} className="text-amber-300" />
              </div>
            </div>
            <div className="mt-6 border-t border-white/20 pt-4 text-xs space-y-1 text-white/80">
              <p>Timezone: {weather.timezone || "Local"}</p>
              <p>Coords: {weather.latitude?.toFixed(2)}°, {weather.longitude?.toFixed(2)}°</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-line bg-pale p-5">
          <p className="text-xs font-bold text-ink">Open-Meteo High Resolution</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Global weather models from ECMWF, DWD, and NOAA. Updated every hour.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #42 — World Clock Converter
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_CITIES = [
  { name: "London", country: "United Kingdom", tz: "Europe/London" },
  { name: "New York", country: "United States", tz: "America/New_York" },
  { name: "San Francisco", country: "United States", tz: "America/Los_Angeles" },
  { name: "Tokyo", country: "Japan", tz: "Asia/Tokyo" },
  { name: "Paris", country: "France", tz: "Europe/Paris" },
  { name: "Dubai", country: "United Arab Emirates", tz: "Asia/Dubai" },
  { name: "Singapore", country: "Singapore", tz: "Asia/Singapore" },
  { name: "Sydney", country: "Australia", tz: "Australia/Sydney" },
  { name: "Karachi", country: "Pakistan", tz: "Asia/Karachi" },
  { name: "Toronto", country: "Canada", tz: "America/Toronto" },
  { name: "Berlin", country: "Germany", tz: "Europe/Berlin" },
  { name: "Hong Kong", country: "Hong Kong", tz: "Asia/Hong_Kong" },
];

function WorldClockConverterWorkspace() {
  const [selectedCities, setSelectedCities] = useState([
    PRESET_CITIES[0], // London
    PRESET_CITIES[1], // New York
    PRESET_CITIES[3], // Tokyo
    PRESET_CITIES[5], // Dubai
  ]);
  const [refCity, setRefCity] = useState(PRESET_CITIES[0]);
  const [is24Hour, setIs24Hour] = useState(false);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function getTimeDetails(tz: string) {
    try {
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: !is24Hour,
      });
      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const hourOnlyFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      });

      const timeStr = timeFormatter.format(now);
      const dateStr = dateFormatter.format(now);
      const hourNum = parseInt(hourOnlyFormatter.format(now), 10);
      const isDay = hourNum >= 6 && hourNum < 18;

      return { timeStr, dateStr, hourNum, isDay };
    } catch {
      return { timeStr: "--:--", dateStr: "", hourNum: 12, isDay: true };
    }
  }

  function getTimeDiff(targetTz: string, baseTz: string) {
    try {
      const targetDate = new Date(now.toLocaleString("en-US", { timeZone: targetTz }));
      const baseDate = new Date(now.toLocaleString("en-US", { timeZone: baseTz }));
      const diffMs = targetDate.getTime() - baseDate.getTime();
      const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2;
      if (diffHrs === 0) return "Same time";
      return diffHrs > 0 ? `+${diffHrs} hrs ahead` : `${diffHrs} hrs behind`;
    } catch {
      return "";
    }
  }

  function addCity(city: (typeof PRESET_CITIES)[number]) {
    if (!selectedCities.some((c) => c.tz === city.tz)) {
      setSelectedCities([...selectedCities, city]);
    }
    setSearch("");
  }

  function removeCity(tz: string) {
    setSelectedCities(selectedCities.filter((c) => c.tz !== tz));
  }

  const filteredPresets = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return PRESET_CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.tz.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-10`}
              placeholder="Search city to add (e.g. Sydney, Paris)..."
            />
            {filteredPresets.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                {filteredPresets.map((c) => (
                  <button
                    key={c.tz}
                    type="button"
                    onClick={() => addCity(c)}
                    className="flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-semibold hover:bg-pale"
                  >
                    <span>
                      {c.name} <span className="text-muted">({c.country})</span>
                    </span>
                    <Plus size={14} className="text-brand" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-ink">
              <span className="text-muted">Reference:</span>
              <select
                value={refCity.tz}
                onChange={(e) => {
                  const target = selectedCities.find((c) => c.tz === e.target.value) || PRESET_CITIES.find((c) => c.tz === e.target.value);
                  if (target) setRefCity(target);
                }}
                className="rounded-xl border border-line bg-pale px-3 py-1.5 text-xs font-bold"
              >
                {selectedCities.map((c) => (
                  <option key={c.tz} value={c.tz}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => setIs24Hour(!is24Hour)}
              className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink hover:border-brand"
            >
              {is24Hour ? "24-Hour Clock" : "12-Hour AM/PM"}
            </button>
          </div>
        </div>

        {/* City Comparison Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {selectedCities.map((city) => {
            const { timeStr, dateStr, isDay } = getTimeDetails(city.tz);
            const diff = getTimeDiff(city.tz, refCity.tz);
            const isReference = city.tz === refCity.tz;

            return (
              <div
                key={city.tz}
                className={`relative rounded-2xl border p-5 transition ${
                  isReference ? "border-brand bg-brand/[.02] shadow-soft ring-2 ring-brand/10" : "border-line bg-white shadow-card"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-ink">{city.name}</h3>
                    <p className="text-xs text-muted">{city.country}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isDay ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-blue" />}
                    {selectedCities.length > 1 && (
                      <button onClick={() => removeCity(city.tz)} className="text-muted hover:text-red-500 p-1" title="Remove city">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-black tracking-tight text-ink">{timeStr}</div>
                  <div className="mt-1 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted">{dateStr}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${isReference ? "bg-brand/10 text-brand" : "bg-pale text-ink"}`}>
                      {diff}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick presets row */}
        <div className="mt-8 border-t border-line pt-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">Popular World Cities</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_CITIES.map((c) => {
              const active = selectedCities.some((sc) => sc.tz === c.tz);
              return (
                <button
                  key={c.tz}
                  type="button"
                  onClick={() => addCity(c)}
                  disabled={active}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    active ? "bg-pale text-muted opacity-50 cursor-not-allowed" : "border border-line bg-white text-ink hover:border-brand"
                  }`}
                >
                  {c.name} {active ? "✓" : "+"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #43 — Public Holiday Finder
// ─────────────────────────────────────────────────────────────────────────────
function PublicHolidayFinderWorkspace() {
  const [countries, setCountries] = useState<Array<{ countryCode: string; name: string }>>([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/tools/holidays?action=countries")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.countries)) setCountries(data.countries);
      })
      .catch(() => {});
  }, []);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tools/holidays?country=${selectedCountry}&year=${year}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load public holidays.");
      setHolidays(data.holidays || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Holiday lookup failed.");
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, year]);

  useEffect(() => {
    void loadHolidays();
  }, [selectedCountry, year]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const d = new Date(h.date);
      const m = d.getMonth() + 1;
      const matchMonth = filterMonth === "ALL" || String(m) === filterMonth;
      const matchSearch =
        !search.trim() ||
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.localName && h.localName.toLowerCase().includes(search.toLowerCase()));
      return matchMonth && matchSearch;
    });
  }, [holidays, filterMonth, search]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-bold text-ink">
            Select Country
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className={`${inputClass} mt-1.5`}>
              {countries.length > 0 ? (
                countries.map((c) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.name} ({c.countryCode})
                  </option>
                ))
              ) : (
                <option value="US">United States (US)</option>
              )}
            </select>
          </label>

          <label className="block text-sm font-bold text-ink">
            Select Year
            <select value={year} onChange={(e) => setYear(e.target.value)} className={`${inputClass} mt-1.5`}>
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <div className="pt-6">
            <button onClick={loadHolidays} disabled={loading} className="gradient-bg flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md shadow-brand/20 hover:opacity-95 disabled:opacity-50">
              <CalendarHeart size={16} /> {loading ? "Loading…" : "Find Holidays"}
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-6 border-t border-line pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="mobile-scroll flex gap-1.5">
            {[
              { id: "ALL", label: "All Months" },
              { id: "1", label: "Jan" },
              { id: "2", label: "Feb" },
              { id: "3", label: "Mar" },
              { id: "4", label: "Apr" },
              { id: "5", label: "May" },
              { id: "6", label: "Jun" },
              { id: "7", label: "Jul" },
              { id: "8", label: "Aug" },
              { id: "9", label: "Sep" },
              { id: "10", label: "Oct" },
              { id: "11", label: "Nov" },
              { id: "12", label: "Dec" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFilterMonth(m.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  filterMonth === m.id ? "bg-ink text-white" : "border border-line bg-white text-muted hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search holiday name..."
              className="w-full rounded-xl border border-line bg-pale/50 py-1.5 pl-8 pr-3 text-xs outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

        {/* Holidays Table / Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between pb-3 text-xs font-bold text-muted">
            <span>
              Showing {filteredHolidays.length} of {holidays.length} public holidays
            </span>
          </div>

          {filteredHolidays.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHolidays.map((h, i) => {
                const dateObj = new Date(h.date);
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div key={`${h.date}-${h.name}-${i}`} className="rounded-2xl border border-line bg-white p-4 shadow-card hover:border-brand/30 transition">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-black text-brand">{monthDay}</span>
                      <span className="text-xs font-bold text-muted">{dayName}</span>
                    </div>
                    <h3 className="mt-3 font-extrabold text-ink line-clamp-1">{h.name}</h3>
                    {h.localName && h.localName !== h.name && <p className="text-xs text-muted italic mt-0.5">{h.localName}</p>}
                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[11px] font-semibold text-muted">
                      <span>{h.types?.[0] || "Public Holiday"}</span>
                      <span>{h.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
              No public holidays found matching your filter.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #44 — IP Address Lookup
// ─────────────────────────────────────────────────────────────────────────────
function IpAddressLookupWorkspace() {
  const [ipInput, setIpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const lookup = useCallback(async (targetIp?: string) => {
    setLoading(true);
    setError("");
    try {
      const q = targetIp ? `?ip=${encodeURIComponent(targetIp)}` : "";
      const res = await fetch(`/api/tools/ip-lookup${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to lookup IP address.");
      setInfo(data);
      if (!targetIp && data.ip) setIpInput(data.ip);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "IP lookup failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void lookup();
  }, [lookup]);

  async function copyAll() {
    if (!info) return;
    const txt = [
      `IP: ${info.ip} (${info.version})`,
      `Location: ${info.city}, ${info.region}, ${info.country}`,
      `Coordinates: ${info.latitude}, ${info.longitude}`,
      `ISP: ${info.isp}`,
      `Organization: ${info.organization}`,
      `ASN: ${info.asn}`,
      `Timezone: ${info.timezone}`,
    ].join("\n");
    await navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setIpInput("");
    setInfo(null);
    setError("");
    void lookup();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-ink">
            IP Address (IPv4 or IPv6)
            <div className="mt-1.5 flex gap-2">
              <input
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888"
                className={`${inputClass} font-mono`}
              />
              <button
                type="button"
                onClick={() => lookup(ipInput.trim())}
                disabled={loading}
                className="gradient-bg shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand/20 hover:opacity-95 disabled:opacity-50"
              >
                Lookup
              </button>
            </div>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIpInput("");
                void lookup("");
              }}
              className="rounded-xl border border-line bg-pale px-3.5 py-2 text-xs font-bold text-ink hover:border-brand"
            >
              <Network size={14} className="inline mr-1" /> Detect My IP
            </button>
            <button type="button" onClick={reset} className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-muted hover:text-ink">
              <RotateCcw size={13} className="inline mr-1" /> Reset
            </button>
          </div>

          {loading && <p className="py-6 text-center text-sm font-semibold text-muted animate-pulse">Querying IP geolocation database…</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          {info && (
            <div className="mt-6 border-t border-line pt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-pale/60 p-4">
                  <span className="text-xs font-semibold text-muted">IP Address</span>
                  <div className="mt-1 text-lg font-black text-ink font-mono">{info.ip}</div>
                  <span className="mt-1 inline-block rounded bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">{info.version}</span>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-4">
                  <span className="text-xs font-semibold text-muted">Country</span>
                  <div className="mt-1 text-lg font-black text-ink">
                    {info.country} {info.countryCode && `(${info.countryCode})`}
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-4">
                  <span className="text-xs font-semibold text-muted">City & Region</span>
                  <div className="mt-1 text-base font-black text-ink">
                    {info.city || "Unknown City"}, {info.region || "Unknown Region"}
                  </div>
                  {info.postal && <p className="text-xs text-muted mt-0.5">Postal: {info.postal}</p>}
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-4">
                  <span className="text-xs font-semibold text-muted">Approximate Coordinates</span>
                  <div className="mt-1 text-base font-black text-ink">
                    {info.latitude?.toFixed(4)}°, {info.longitude?.toFixed(4)}°
                  </div>
                  <span className="text-[11px] text-muted">Approximate location only</span>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-pale/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">ISP:</span>
                  <span className="font-bold text-ink">{info.isp || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Organization:</span>
                  <span className="font-bold text-ink">{info.organization || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">ASN:</span>
                  <span className="font-bold text-ink">{info.asn || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Timezone:</span>
                  <span className="font-bold text-ink">{info.timezone || "Not specified"}</span>
                </div>
              </div>

              <button
                onClick={copyAll}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-ink hover:border-brand"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Details copied to clipboard!" : "Copy IP & Location Details"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Privacy Disclosures */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-pale p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <ShieldCheck size={16} className="text-brand" /> Privacy & Accuracy Notice
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            IP geolocation identifies the approximate region and registered network provider (ISP). It does not pinpoint private street addresses or individuals.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #45 — Country Information Finder
// ─────────────────────────────────────────────────────────────────────────────
function CountryInformationFinderWorkspace() {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(() => countriesData[0]);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return countriesData.filter((c) => {
      const matchRegion = selectedRegion === "ALL" || c.region === selectedRegion;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.native.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q);
      return matchRegion && matchSearch;
    });
  }, [search, selectedRegion]);

  async function copyDetails() {
    const txt = [
      `Country: ${selectedCountry.name} (${selectedCountry.native})`,
      `ISO Codes: ${selectedCountry.iso2} / ${selectedCountry.iso3}`,
      `Capital: ${selectedCountry.capital}`,
      `Region: ${selectedCountry.region} (${selectedCountry.subregion})`,
      `Population: ${selectedCountry.population.toLocaleString()}`,
      `Area: ${selectedCountry.area.toLocaleString()} km²`,
      `Currency: ${selectedCountry.currency_name} (${selectedCountry.currency}, ${selectedCountry.currency_symbol})`,
      `Calling Code: ${selectedCountry.calling_code}`,
      `Top-Level Domain: ${selectedCountry.tld}`,
      `Coordinates: ${selectedCountry.latitude}°, ${selectedCountry.longitude}°`,
    ].join("\n");
    await navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-3.5 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, capital, or code..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <div className="mobile-scroll flex gap-1">
              {["ALL", "Africa", "Americas", "Asia", "Europe", "Oceania"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRegion(r)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    selectedRegion === r ? "bg-ink text-white" : "border border-line bg-white text-muted hover:text-ink"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Country Quick Picker */}
          <div className="max-h-56 overflow-y-auto rounded-2xl border border-line bg-pale/50 p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {filtered.slice(0, 36).map((c) => (
              <button
                key={c.iso2}
                type="button"
                onClick={() => setSelectedCountry(c)}
                className={`flex items-center gap-2 rounded-xl p-2 text-left text-xs font-bold transition ${
                  selectedCountry.iso2 === c.iso2 ? "bg-brand text-white shadow-sm" : "bg-white text-ink hover:border-brand/30 border border-line/60"
                }`}
              >
                <span className="text-base">{c.emoji}</span>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Selected Country Detailed Breakdown */}
          {selectedCountry && (
            <div className="mt-6 border-t border-line pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCountry.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-black text-ink">{selectedCountry.name}</h2>
                    {selectedCountry.native && <p className="text-xs text-muted italic">{selectedCountry.native}</p>}
                  </div>
                </div>
                <button
                  onClick={copyDetails}
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-ink hover:border-brand"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Info"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Capital City</span>
                  <div className="mt-1 text-sm font-black text-ink">{selectedCountry.capital || "N/A"}</div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Region & Subregion</span>
                  <div className="mt-1 text-sm font-black text-ink">
                    {selectedCountry.region} ({selectedCountry.subregion || "N/A"})
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Population</span>
                  <div className="mt-1 text-sm font-black text-ink">{selectedCountry.population ? selectedCountry.population.toLocaleString() : "N/A"}</div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Area</span>
                  <div className="mt-1 text-sm font-black text-ink">{selectedCountry.area ? `${selectedCountry.area.toLocaleString()} km²` : "N/A"}</div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Currency</span>
                  <div className="mt-1 text-sm font-black text-ink">
                    {selectedCountry.currency_name} ({selectedCountry.currency} {selectedCountry.currency_symbol})
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Calling Code</span>
                  <div className="mt-1 text-sm font-black text-ink">{selectedCountry.calling_code || "N/A"}</div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Top-Level Domain</span>
                  <div className="mt-1 text-sm font-black text-ink font-mono">{selectedCountry.tld || "N/A"}</div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">ISO Codes</span>
                  <div className="mt-1 text-sm font-black text-ink font-mono">
                    {selectedCountry.iso2} / {selectedCountry.iso3}
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-pale/60 p-3.5">
                  <span className="text-muted font-semibold">Coordinates</span>
                  <div className="mt-1 text-sm font-black text-ink">
                    {selectedCountry.latitude.toFixed(2)}°, {selectedCountry.longitude.toFixed(2)}°
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Flag Card */}
      <aside className="space-y-4">
        {selectedCountry && (
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card text-center">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">National Flag</p>
            <div className="mt-4 flex min-h-[160px] items-center justify-center rounded-xl bg-pale p-3">
              <img
                src={`https://flagcdn.com/w320/${selectedCountry.iso2.toLowerCase()}.png`}
                alt={`${selectedCountry.name} flag`}
                className="max-h-36 max-w-full rounded-lg shadow-md object-contain"
                onError={(e) => {
                  // Fallback to emoji representation
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <p className="mt-4 text-xs font-bold text-ink">{selectedCountry.name} Official Flag</p>
          </div>
        )}

        <div className="rounded-2xl border border-line bg-pale p-5">
          <p className="text-xs font-bold text-ink">Comprehensive ISO Registry</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Includes all 250 sovereign states and dependent territories with ISO 3166-1 alpha codes.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL #46 — Sunrise & Sunset Calculator
// ─────────────────────────────────────────────────────────────────────────────
function SunriseSunsetCalculatorWorkspace() {
  const [cityQuery, setCityQuery] = useState("London");
  const [lat, setLat] = useState("51.5074");
  const [lng, setLng] = useState("-0.1278");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const calculate = useCallback(async () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError("Please provide valid numeric coordinates.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/sunrise-sunset?lat=${latNum}&lng=${lngNum}&date=${encodeURIComponent(date)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to calculate solar times.");
      setData(body);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Calculation failed.");
    } finally {
      setLoading(false);
    }
  }, [lat, lng, date]);

  useEffect(() => {
    void calculate();
  }, [lat, lng, date]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        setCityQuery("Your Location");
      },
      () => {
        setError("Location permission was denied or unavailable.");
      }
    );
  }

  function formatLocalTime(isoStr: string | null): string {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoStr;
    }
  }

  function reset() {
    setCityQuery("London");
    setLat("51.5074");
    setLng("-0.1278");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-bold text-ink">
              Latitude
              <input value={lat} onChange={(e) => setLat(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="e.g. 51.5074" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Longitude
              <input value={lng} onChange={(e) => setLng(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="e.g. -0.1278" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1.5`} />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={calculate} disabled={loading} className="gradient-bg flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/20 hover:opacity-95 disabled:opacity-50">
              <Sunrise size={15} /> {loading ? "Calculating…" : "Calculate Solar Times"}
            </button>
            <button onClick={useCurrentLocation} className="rounded-xl border border-line bg-pale px-3.5 py-2.5 text-xs font-bold text-ink hover:border-brand">
              <MapPin size={13} className="inline mr-1 text-brand" /> Use Current Location
            </button>
            <button onClick={reset} className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs font-bold text-muted hover:text-ink">
              <RotateCcw size={13} className="inline mr-1" /> Reset
            </button>
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

          {data && (
            <div className="mt-6 border-t border-line pt-6 space-y-5">
              {data.isPolar ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm font-bold">
                  {data.message}
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <Sunrise size={16} /> Sunrise
                      </div>
                      <div className="mt-2 text-2xl font-black text-ink">{formatLocalTime(data.sunrise)}</div>
                      <span className="text-[11px] text-muted">Sun rises above horizon</span>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
                        <Sunset size={16} /> Sunset
                      </div>
                      <div className="mt-2 text-2xl font-black text-ink">{formatLocalTime(data.sunset)}</div>
                      <span className="text-[11px] text-muted">Sun sinks below horizon</span>
                    </div>

                    <div className="rounded-2xl border border-line bg-pale/70 p-4">
                      <span className="text-xs font-bold text-muted">Daylight Duration</span>
                      <div className="mt-2 text-2xl font-black text-ink">{data.daylightDuration}</div>
                      <span className="text-[11px] text-muted">Total daylight hours</span>
                    </div>
                  </div>

                  {/* Twilight stages */}
                  <div className="rounded-2xl border border-line bg-pale/50 p-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">Solar & Twilight Stages (Local Time)</h4>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="flex justify-between border-b border-line/60 py-1.5">
                        <span className="text-muted">Solar Noon (Peak):</span>
                        <span className="font-bold text-ink">{formatLocalTime(data.solarNoon)}</span>
                      </div>
                      <div className="flex justify-between border-b border-line/60 py-1.5">
                        <span className="text-muted">Civil Dawn:</span>
                        <span className="font-bold text-ink">{formatLocalTime(data.civilTwilightBegin)}</span>
                      </div>
                      <div className="flex justify-between border-b border-line/60 py-1.5">
                        <span className="text-muted">Civil Dusk:</span>
                        <span className="font-bold text-ink">{formatLocalTime(data.civilTwilightEnd)}</span>
                      </div>
                      <div className="flex justify-between border-b border-line/60 py-1.5">
                        <span className="text-muted">Nautical Dawn:</span>
                        <span className="font-bold text-ink">{formatLocalTime(data.nauticalTwilightBegin)}</span>
                      </div>
                      <div className="flex justify-between border-b border-line/60 py-1.5">
                        <span className="text-muted">Nautical Dusk:</span>
                        <span className="font-bold text-ink">{formatLocalTime(data.nauticalTwilightEnd)}</span>
                      </div>
                      <div className="flex justify-between border-b border-line/60 py-1.5">
                        <span className="text-muted">Astronomical Dawn:</span>
                        <span className="font-bold text-ink">{formatLocalTime(data.astronomicalTwilightBegin)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Right Column */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-pale p-5">
          <p className="text-xs font-bold text-ink">Location & Timezone</p>
          <div className="mt-2 space-y-1 text-xs text-muted">
            <p>Coords: {parseFloat(lat).toFixed(4)}°, {parseFloat(lng).toFixed(4)}°</p>
            <p>Date: {date}</p>
            <p className="text-[11px] mt-2 leading-relaxed">
              Calculations are computed using astronomical solar zenith algorithms via Sunrise-Sunset API and converted into your browser local time.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
