import { PDFDocument, StandardFonts, degrees, rgb } from "@cantoo/pdf-lib";

export type PdfPosition = "top-left" | "top-center" | "top-right" | "center" | "bottom-left" | "bottom-center" | "bottom-right" | "diagonal-center";
export type PageScope = "all" | "selected";
export type PdfFontName = "Helvetica" | "TimesRoman" | "Courier";

export type WatermarkOptions = {
  content: "text" | "image";
  text: string;
  font: PdfFontName;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: PdfPosition;
  margin: number;
  repeat: boolean;
  scope: PageScope;
  pageRanges: string;
  imageSize: number;
};

export type NumberingOptions = {
  position: Exclude<PdfPosition, "center" | "diagonal-center">;
  format: "plain" | "page" | "of" | "page-of" | "roman";
  font: PdfFontName;
  bold: boolean;
  fontSize: number;
  color: string;
  prefix: string;
  suffix: string;
  margin: number;
  startingNumber: number;
  startingPdfPage: number;
  skipCover: boolean;
  skipPages: string;
  scope: PageScope;
  pageRanges: string;
};

export type ProtectOptions = {
  password: string;
  ownerPassword?: string;
  printing: boolean;
  copying: boolean;
  editing: boolean;
  annotations: boolean;
  formFilling: boolean;
};

export type TextExtractionOptions = {
  scope: PageScope;
  pageRanges: string;
  preserveLineBreaks: boolean;
  cleanSpaces: boolean;
  pageSeparators: boolean;
  password?: string;
};

const PDF_MIME = "application/pdf";
const STANDARD_FONT = {
  Helvetica: { regular: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold, italic: StandardFonts.HelveticaOblique, boldItalic: StandardFonts.HelveticaBoldOblique },
  TimesRoman: { regular: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold, italic: StandardFonts.TimesRomanItalic, boldItalic: StandardFonts.TimesRomanBoldItalic },
  Courier: { regular: StandardFonts.Courier, bold: StandardFonts.CourierBold, italic: StandardFonts.CourierOblique, boldItalic: StandardFonts.CourierBoldOblique },
} as const;

export type PdfInspection = { pageCount: number; isEncrypted: boolean };

export async function inspectPdf(file: File): Promise<PdfInspection> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfHeader(bytes)) throw new Error("This file does not contain a valid PDF signature. Choose a PDF document.");
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    const pageCount = doc.getPageCount();
    if (!pageCount) throw new Error("This PDF does not contain any pages.");
    return { pageCount, isEncrypted: doc.isEncrypted };
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("does not contain any pages")) throw cause;
    throw new Error("This PDF is corrupted or uses an unsupported PDF feature. Try another file.");
  }
}

export function hasPdfHeader(bytes: Uint8Array): boolean {
  const headerLimit = Math.min(bytes.length, 1024);
  for (let index = 0; index <= headerLimit - 5; index++) {
    if (bytes[index] === 0x25 && bytes[index + 1] === 0x50 && bytes[index + 2] === 0x44 && bytes[index + 3] === 0x46 && bytes[index + 4] === 0x2d) return true;
  }
  return false;
}

export function parsePageRanges(value: string, pageCount: number): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error("This PDF does not contain any pages.");
  const segments = value.split(",").map((part) => part.trim());
  if (!segments.length || segments.some((part) => !part)) throw new Error("Enter pages as a list such as 1, 3-5.");
  const pages = new Set<number>();
  for (const segment of segments) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(segment);
    if (!match) throw new Error("Enter page ranges using numbers and hyphens, such as 1, 3-5.");
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > pageCount) throw new Error(`Page ranges must be between 1 and ${pageCount}.`);
    for (let page = start; page <= end; page++) pages.add(page - 1);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function selectedPages(scope: PageScope, ranges: string, pageCount: number): number[] {
  return scope === "all" ? Array.from({ length: pageCount }, (_, index) => index) : parsePageRanges(ranges, pageCount);
}

function parseColor(hex: string) {
  const normalized = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : "5B46D8";
  return rgb(parseInt(normalized.slice(0, 2), 16) / 255, parseInt(normalized.slice(2, 4), 16) / 255, parseInt(normalized.slice(4, 6), 16) / 255);
}

async function embedFont(document: PDFDocument, name: PdfFontName, bold: boolean, italic = false) {
  const variants = STANDARD_FONT[name] || STANDARD_FONT.Helvetica;
  const selected = bold && italic ? variants.boldItalic : bold ? variants.bold : italic ? variants.italic : variants.regular;
  return document.embedFont(selected);
}

function placements(position: PdfPosition | "pattern", width: number, height: number, objectWidth: number, objectHeight: number, margin: number) {
  const inset = Math.max(0, margin);
  const left = inset;
  const right = Math.max(inset, width - objectWidth - inset);
  const centerX = Math.max(0, (width - objectWidth) / 2);
  const bottom = inset;
  const top = Math.max(inset, height - objectHeight - inset);
  const centerY = Math.max(0, (height - objectHeight) / 2);
  if (position === "top-left") return [{ x: left, y: top }];
  if (position === "top-center") return [{ x: centerX, y: top }];
  if (position === "top-right") return [{ x: right, y: top }];
  if (position === "bottom-left") return [{ x: left, y: bottom }];
  if (position === "bottom-center") return [{ x: centerX, y: bottom }];
  if (position === "bottom-right") return [{ x: right, y: bottom }];
  if (position === "center") return [{ x: centerX, y: centerY }];
  if (position === "diagonal-center") return [{ x: centerX, y: centerY }];
  const stepX = Math.max(objectWidth * 1.8, width * 0.42);
  const stepY = Math.max(objectHeight * 3, height * 0.22);
  const points: Array<{ x: number; y: number }> = [];
  for (let y = inset; y <= height - objectHeight - inset; y += stepY) {
    for (let x = inset; x <= width - objectWidth - inset; x += stepX) points.push({ x, y });
  }
  return points.length ? points : [{ x: centerX, y: centerY }];
}

function validatePdfOutput(bytes: Uint8Array) {
  if (bytes.length < 20 || !hasPdfHeader(bytes)) throw new Error("The processed output failed PDF integrity validation.");
}

export async function addWatermark(file: File, options: WatermarkOptions, imageFile?: File | null, password?: string): Promise<Blob> {
  const source = await PDFDocument.load(await file.arrayBuffer(), password !== undefined ? { password } : {});
  const pages = source.getPages();
  if (!pages.length) throw new Error("This PDF does not contain any pages.");
  const targets = selectedPages(options.scope, options.pageRanges, pages.length);
  const opacity = clamp(options.opacity, 0.05, 1);
  const rotation = Number.isFinite(options.rotation) ? clamp(options.rotation, -360, 360) : 0;
  const margin = clamp(options.margin, 0, 200);
  const color = parseColor(options.color);
  if (options.content === "text") {
    const text = options.text.trim();
    if (!text) throw new Error("Enter watermark text before processing.");
    const font = await embedFont(source, options.font, options.bold, options.italic);
    const size = clamp(options.fontSize, 6, 160);
    for (const index of targets) {
      const page = pages[index];
      const { width, height } = page.getSize();
      const textWidth = Math.max(1, font.widthOfTextAtSize(text, size));
      const textHeight = size;
      const points = options.repeat ? placements("pattern", width, height, textWidth, textHeight, margin) : placements(options.position, width, height, textWidth, textHeight, margin);
      for (const point of points) page.drawText(text, { ...point, font, size, color, opacity, rotate: degrees(rotation), maxWidth: Math.max(textWidth, width * 0.9) });
    }
  } else {
    if (!imageFile) throw new Error("Choose a PNG or JPG image for the watermark.");
    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    if (isPng(imageBytes)) {
      const image = await source.embedPng(imageBytes);
      await placeWatermarkImage(pages, targets, image, options, opacity, rotation, margin);
    } else if (isJpeg(imageBytes)) {
      const image = await source.embedJpg(imageBytes);
      await placeWatermarkImage(pages, targets, image, options, opacity, rotation, margin);
    } else throw new Error("Watermark images must be valid PNG or JPEG files.");
  }
  const bytes = await source.save({ useObjectStreams: true });
  validatePdfOutput(bytes);
  await verifyPdfBytes(bytes, pages.length);
  return new Blob([bytes as BlobPart], { type: PDF_MIME });
}

async function placeWatermarkImage(pages: ReturnType<PDFDocument["getPages"]>, targets: number[], image: Awaited<ReturnType<PDFDocument["embedPng"]>>, options: WatermarkOptions, opacity: number, rotation: number, margin: number) {
  const desiredWidth = clamp(options.imageSize, 24, 600);
  const ratio = image.height / image.width;
  const desiredHeight = desiredWidth * ratio;
  for (const index of targets) {
    const page = pages[index];
    const { width, height } = page.getSize();
    const actualWidth = Math.min(desiredWidth, width * 0.82);
    const actualHeight = actualWidth * ratio;
    const points = options.repeat ? placements("pattern", width, height, actualWidth, actualHeight, margin) : placements(options.position, width, height, actualWidth, actualHeight, margin);
    for (const point of points) page.drawImage(image, { ...point, width: actualWidth, height: actualHeight, opacity, rotate: degrees(rotation) });
  }
}

function isPng(bytes: Uint8Array) { return bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a; }
function isJpeg(bytes: Uint8Array) { return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; }

export async function addPageNumbers(file: File, options: NumberingOptions, password?: string): Promise<Blob> {
  const document = await PDFDocument.load(await file.arrayBuffer(), password !== undefined ? { password } : {});
  const pages = document.getPages();
  let targets = selectedPages(options.scope, options.pageRanges, pages.length).filter((index) => index + 1 >= clamp(options.startingPdfPage, 1, pages.length));
  if (options.skipCover) targets = targets.filter((index) => index !== 0);
  if (options.skipPages.trim()) {
    const skipped = new Set(parsePageRanges(options.skipPages, pages.length));
    targets = targets.filter((index) => !skipped.has(index));
  }
  if (!targets.length) throw new Error("Your page selection leaves no pages to number.");
  const font = await embedFont(document, options.font, options.bold);
  const size = clamp(options.fontSize, 6, 72);
  const margin = clamp(options.margin, 0, 200);
  const color = parseColor(options.color);
  const total = targets.length;
  const firstNumber = clamp(options.startingNumber, 1, 1_000_000);
  targets.forEach((pageIndex, order) => {
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const current = firstNumber + order;
    let label = options.format === "roman" ? toRoman(current) : String(current);
    if (options.format === "page" || options.format === "page-of") label = `Page ${label}`;
    if (options.format === "of" || options.format === "page-of") label += ` of ${options.format === "page-of" ? total : total}`;
    label = `${options.prefix}${label}${options.suffix}`;
    const textWidth = font.widthOfTextAtSize(label, size);
    const x = options.position.endsWith("center") ? (width - textWidth) / 2 : options.position.endsWith("right") ? width - textWidth - margin : margin;
    const y = options.position.startsWith("top") ? height - size - margin : margin;
    page.drawText(label, { x: Math.max(0, x), y: Math.max(0, y), font, size, color });
  });
  const bytes = await document.save({ useObjectStreams: true });
  validatePdfOutput(bytes);
  await verifyPdfBytes(bytes, pages.length);
  return new Blob([bytes as BlobPart], { type: PDF_MIME });
}

function toRoman(value: number): string {
  if (value < 1 || value > 3999) throw new Error("Roman numeral numbering supports values from 1 to 3,999.");
  const symbols: Array<[number, string]> = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let remaining = value;
  let roman = "";
  for (const [amount, numeral] of symbols) while (remaining >= amount) { roman += numeral; remaining -= amount; }
  return roman;
}

export async function protectPdf(file: File, options: ProtectOptions): Promise<Blob> {
  if (options.password.length < 8) throw new Error("Use an open password with at least 8 characters.");
  const document = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  if (document.isEncrypted) throw new Error("This PDF is already password protected. Unlock it first or use the original PDF.");
  const restricted = !options.printing || !options.copying || !options.editing || !options.annotations || !options.formFilling;
  const ownerPassword = options.ownerPassword || options.password;
  if (restricted && (ownerPassword.length < 8 || ownerPassword === options.password)) throw new Error("Set a separate owner password of at least 8 characters when restricting PDF permissions.");
  document.encrypt({
    userPassword: options.password,
    ownerPassword,
    permissions: {
      printing: options.printing ? "highResolution" : false,
      copying: options.copying,
      modifying: options.editing,
      annotating: options.annotations,
      fillingForms: options.formFilling,
    },
    algorithm: "AES-256",
  });
  const bytes = await document.save({ useObjectStreams: true });
  validatePdfOutput(bytes);
  const verified = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  if (!verified.isEncrypted || verified.getPageCount() !== document.getPageCount()) throw new Error("The output did not pass the encryption verification check.");
  try {
    await PDFDocument.load(bytes, { password: options.password, updateMetadata: false });
  } catch {
    throw new Error("The generated PDF did not accept the supplied password. No output was created.");
  }
  return new Blob([bytes as BlobPart], { type: PDF_MIME });
}

export async function unlockPdf(file: File, password: string): Promise<{ blob: Blob; wasEncrypted: boolean }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfHeader(bytes)) throw new Error("This file does not contain a valid PDF signature. Choose a PDF document.");
  const inspection = await inspectPdf(file);
  if (inspection.isEncrypted && !password) throw new Error("This PDF is encrypted. Enter the password you are authorized to use.");
  let document: PDFDocument;
  try {
    document = inspection.isEncrypted
      ? await PDFDocument.load(bytes, { password, updateMetadata: false })
      : await PDFDocument.load(bytes, { updateMetadata: false });
  } catch {
    throw new Error("The password was not accepted, or this PDF uses unsupported encryption. No output was created.");
  }
  const pageCount = document.getPageCount();
  // Rebuild the page tree in a fresh document. Serializing a decrypted input in
  // place can retain the source encryption dictionary in some PDF revisions.
  const cleanDocument = await PDFDocument.create();
  const cleanPages = await cleanDocument.copyPages(document, document.getPageIndices());
  cleanPages.forEach((page) => cleanDocument.addPage(page));
  const output = await cleanDocument.save({ useObjectStreams: true });
  validatePdfOutput(output);
  const verified = await PDFDocument.load(output, { ignoreEncryption: true, updateMetadata: false });
  if (verified.isEncrypted || verified.getPageCount() !== pageCount) throw new Error("The saved copy did not pass the unencrypted output check.");
  await verifyPdfBytes(output, pageCount);
  return { blob: new Blob([output as BlobPart], { type: PDF_MIME }), wasEncrypted: inspection.isEncrypted };
}

export async function extractPdfText(file: File, options: TextExtractionOptions): Promise<{ text: string; pagesProcessed: number; pagesWithText: number; pageCount: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfHeader(bytes)) throw new Error("This file does not contain a valid PDF signature. Choose a PDF document.");
  const pdfjs = await loadPdfJsForProcessing();
  const loadingTask = pdfjs.getDocument({ data: bytes, password: options.password, ...(typeof window === "undefined" ? { disableWorker: true } : {}) });
  let document: Awaited<typeof loadingTask.promise> | undefined;
  try {
    document = await loadingTask.promise;
    const targets = selectedPages(options.scope, options.pageRanges, document.numPages);
    const extracted: string[] = [];
    let pagesWithText = 0;
    for (const index of targets) {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();
      const items = content.items.filter((item) => "str" in item) as Array<{ str: string; hasEOL?: boolean }>;
      let pageText = "";
      for (const item of items) {
        const fragment = item.str || "";
        if (!fragment) continue;
        if (pageText && !/[\s\n]$/.test(pageText)) pageText += item.hasEOL ? "\n" : " ";
        pageText += fragment;
        if (item.hasEOL) pageText += "\n";
      }
      if (!options.preserveLineBreaks) pageText = pageText.replace(/\s*\n\s*/g, " ");
      if (options.cleanSpaces) pageText = pageText.replace(/[\t\u00a0 ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      else pageText = pageText.trim();
      if (pageText) pagesWithText++;
      if (options.pageSeparators) extracted.push(`--- Page ${index + 1} ---${pageText ? `\n${pageText}` : "\n[No selectable text on this page]"}`);
      else if (pageText) extracted.push(pageText);
    }
    const text = extracted.join(options.pageSeparators ? "\n\n" : options.preserveLineBreaks ? "\n\n" : "\n").trim();
    if (!pagesWithText) throw new Error("No selectable text was found. This may be a scanned PDF; OCR is required to extract text from page images.");
    return { text, pagesProcessed: targets.length, pagesWithText, pageCount: document.numPages };
  } catch (cause) {
    if (cause instanceof Error && (cause.message.includes("page ranges") || cause.message.includes("Page ranges") || cause.message.includes("No selectable text"))) throw cause;
    if (cause instanceof Error && /password/i.test(cause.message)) throw new Error("This PDF is password protected. Enter the correct password and try again.");
    throw cause;
  } finally {
    await loadingTask.destroy();
  }
}

async function verifyPdfBytes(bytes: Uint8Array, expectedPageCount?: number) {
  const pdfjs = await loadPdfJsForProcessing();
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), ...(typeof window === "undefined" ? { disableWorker: true } : {}) });
  const document = await task.promise;
  if (document.numPages < 1 || (expectedPageCount !== undefined && document.numPages !== expectedPageCount)) throw new Error("The processed PDF page-count check failed.");
  await task.destroy();
}

async function loadPdfJsForProcessing() {
  if (typeof window === "undefined") return import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
  return pdfjs;
}

function clamp(value: number, min: number, max: number) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return min;
  return Math.max(min, Math.min(max, normalized));
}
