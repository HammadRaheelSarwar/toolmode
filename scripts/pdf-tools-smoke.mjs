import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  addPageNumbers,
  addWatermark,
  extractPdfText,
  inspectPdf,
  parsePageRanges,
  protectPdf,
  unlockPdf,
} from "../lib/pdf-processing.ts";

const cases = [];
async function check(name, work) {
  await work();
  cases.push(name);
  console.log(`PASSED  ${name}`);
}

function asFile(bytes, name = "sample.pdf", type = "application/pdf") {
  return new File([bytes], name, { type });
}

async function buildSample() {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (const label of ["Original page one — Café résumé", "Original page two — second paragraph"]) {
    const page = document.addPage([612, 792]);
    page.drawText(label, { x: 72, y: 700, size: 14, font });
  }
  return document.save();
}

async function readPdfText(bytes, password) {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), password, disableWorker: true });
  const document = await task.promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= document.numPages; pageNo++) {
    const page = await document.getPage(pageNo);
    const content = await page.getTextContent();
    pages.push(content.items.filter((item) => "str" in item).map((item) => item.str).join(" "));
  }
  await task.destroy();
  return pages;
}

async function readPermissions(bytes, password) {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), password, disableWorker: true });
  const document = await task.promise;
  const permissions = await document.getPermissions();
  await task.destroy();
  return permissions;
}

async function assertPdfjsRejects(bytes, password) {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), password, disableWorker: true });
  try {
    const document = await task.promise;
    await task.destroy();
    throw new Error(`Expected PDF.js to reject password ${password}, but it opened ${document.numPages} pages.`);
  } catch (error) {
    if (String(error?.message || error).startsWith("Expected PDF.js")) throw error;
  }
}

const sourceBytes = await buildSample();
const sourceFile = asFile(sourceBytes);
const baseWatermark = {
  content: "text", text: "CONFIDENTIAL", font: "Helvetica", bold: true, italic: false,
  fontSize: 30, color: "#7651E8", opacity: 0.35, rotation: 17, position: "top-center",
  margin: 32, repeat: false, scope: "all", pageRanges: "1", imageSize: 100,
};

await check("PDF integrity inspection and invalid file rejection", async () => {
  const info = await inspectPdf(sourceFile);
  assert.equal(info.pageCount, 2);
  assert.equal(info.isEncrypted, false);
  await assert.rejects(() => inspectPdf(asFile(new TextEncoder().encode("not a PDF"))), /PDF signature/);
  assert.deepEqual(parsePageRanges("1, 2-2", 2), [0, 1]);
  assert.throws(() => parsePageRanges("1, 3", 2), /between 1 and 2/);
  assert.throws(() => parsePageRanges("two", 2), /page ranges/);
});

await check("PDF Watermark text, position, opacity, rotation, repeat, and selected page", async () => {
  const blob = await addWatermark(sourceFile, { ...baseWatermark, repeat: true, scope: "selected", pageRanges: "2", position: "diagonal-center" });
  assert.ok(blob.size > sourceBytes.length);
  const pages = await readPdfText(await blob.arrayBuffer());
  assert.equal(pages.length, 2);
  assert.doesNotMatch(pages[0], /CONFIDENTIAL/);
  assert.match(pages[1], /CONFIDENTIAL/);
});

for (const extension of ["png", "jpg"]) {
  await check(`PDF Watermark valid ${extension.toUpperCase()} image embedding`, async () => {
    const imageBytes = await readFile(new URL(`./pdf-tool-fixtures/watermark.${extension}`, import.meta.url));
    const imageFile = asFile(imageBytes, `watermark.${extension}`, extension === "png" ? "image/png" : "image/jpeg");
    const blob = await addWatermark(sourceFile, { ...baseWatermark, content: "image", repeat: true, imageSize: 90, opacity: 0.6 }, imageFile);
    assert.ok(blob.size > sourceBytes.length);
    assert.equal((await readPdfText(await blob.arrayBuffer())).length, 2);
  });
}

await check("PDF Page Numbering positions, formats, Roman numerals, custom start, cover skip, and range", async () => {
  const positions = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
  const formats = ["plain", "page", "of", "page-of", "roman"];
  for (let index = 0; index < positions.length; index++) {
    const blob = await addPageNumbers(sourceFile, {
      position: positions[index], format: formats[index % formats.length], font: "Helvetica", bold: true,
      fontSize: 12, color: "#111827", prefix: index === 0 ? "[" : "", suffix: index === 0 ? "]" : "",
      margin: 24, startingNumber: index === 4 ? 7 : 1, startingPdfPage: 1, skipCover: false,
      skipPages: "", scope: "all", pageRanges: "1",
    });
    const pages = await readPdfText(await blob.arrayBuffer());
    assert.equal(pages.length, 2);
    assert.ok(pages[0].length > 0, `Number should be embedded for ${positions[index]}`);
  }
  const scoped = await addPageNumbers(sourceFile, {
    position: "bottom-right", format: "page-of", font: "TimesRoman", bold: false, fontSize: 10,
    color: "#111827", prefix: "(", suffix: ")", margin: 20, startingNumber: 5, startingPdfPage: 1,
    skipCover: true, skipPages: "", scope: "selected", pageRanges: "2",
  });
  const output = await readPdfText(await scoped.arrayBuffer());
  assert.doesNotMatch(output[0], /Page 5 of 1/);
  assert.match(output[1], /\(Page 5 of 1\)/);
});

let protectedBytes;
const userPassword = "ToolModeOn-demo-29!";
const ownerPassword = "Owner-secret-29!";
await check("Protect PDF AES-256 encryption and PDF.js correct / incorrect password verification", async () => {
  const protectedBlob = await protectPdf(sourceFile, { password: userPassword, printing: true, copying: true, editing: true, annotations: true, formFilling: true });
  protectedBytes = new Uint8Array(await protectedBlob.arrayBuffer());
  assert.equal((await inspectPdf(asFile(protectedBytes))).isEncrypted, true);
  assert.equal((await readPdfText(protectedBytes, userPassword)).length, 2);
  await assertPdfjsRejects(protectedBytes, "definitely-wrong");
  await assert.rejects(() => protectPdf(asFile(protectedBytes), { password: userPassword, printing: true, copying: true, editing: true, annotations: true, formFilling: true }), /already password protected/);
  await assert.rejects(() => protectPdf(sourceFile, { password: "short", printing: true, copying: true, editing: true, annotations: true, formFilling: true }), /at least 8/);
});

await check("Protect PDF restricted permission output with a separate owner credential", async () => {
  const protectedBlob = await protectPdf(sourceFile, { password: userPassword, ownerPassword, printing: false, copying: false, editing: false, annotations: false, formFilling: false });
  const outputBytes = new Uint8Array(await protectedBlob.arrayBuffer());
  assert.equal((await inspectPdf(asFile(outputBytes))).isEncrypted, true);
  assert.equal((await readPdfText(outputBytes, userPassword)).length, 2);
  assert.equal((await readPdfText(outputBytes, ownerPassword)).length, 2);
  const permissions = await readPermissions(outputBytes, userPassword);
  for (const flag of [pdfjs.PermissionFlag.PRINT, pdfjs.PermissionFlag.COPY, pdfjs.PermissionFlag.MODIFY_CONTENTS, pdfjs.PermissionFlag.MODIFY_ANNOTATIONS, pdfjs.PermissionFlag.FILL_INTERACTIVE_FORMS]) assert.ok(!permissions.has(flag), `Permission flag ${flag} should be disabled.`);
  const ownerUnlocked = await unlockPdf(asFile(outputBytes), ownerPassword);
  assert.equal(ownerUnlocked.wasEncrypted, true);
  assert.equal((await inspectPdf(asFile(await ownerUnlocked.blob.arrayBuffer()))).isEncrypted, false);
  await assert.rejects(() => protectPdf(sourceFile, { password: userPassword, ownerPassword: userPassword, printing: false, copying: true, editing: true, annotations: true, formFilling: true }), /separate owner password/);
});

await check("Unlock PDF with known password, wrong password rejection, and unencrypted input", async () => {
  await assert.rejects(() => unlockPdf(asFile(protectedBytes), "definitely-wrong"), /password was not accepted/);
  const unlocked = await unlockPdf(asFile(protectedBytes), userPassword);
  assert.equal(unlocked.wasEncrypted, true);
  assert.equal((await inspectPdf(asFile(await unlocked.blob.arrayBuffer()))).isEncrypted, false);
  const unlockedText = await readPdfText(await unlocked.blob.arrayBuffer());
  assert.match(unlockedText[0], /Café résumé/);
  const unchanged = await unlockPdf(sourceFile, "");
  assert.equal(unchanged.wasEncrypted, false);
  assert.equal((await readPdfText(await unchanged.blob.arrayBuffer())).length, 2);
});

await check("PDF to Text all pages, multilingual Latin text, selected pages, separators, and UTF-8 download Blob", async () => {
  const all = await extractPdfText(sourceFile, { scope: "all", pageRanges: "1", preserveLineBreaks: true, cleanSpaces: true, pageSeparators: true });
  assert.equal(all.pagesProcessed, 2);
  assert.equal(all.pagesWithText, 2);
  assert.match(all.text, /Page 1/);
  assert.match(all.text, /Café résumé/);
  assert.match(all.text, /Page 2/);
  const selected = await extractPdfText(sourceFile, { scope: "selected", pageRanges: "2", preserveLineBreaks: false, cleanSpaces: true, pageSeparators: false });
  assert.equal(selected.pagesProcessed, 1);
  assert.match(selected.text, /second paragraph/);
  assert.doesNotMatch(selected.text, /Original page one/);
  const download = new Blob([selected.text], { type: "text/plain;charset=utf-8" });
  assert.match(download.type, /charset=utf-8/);
  assert.match(await download.text(), /second paragraph/);
});

await check("PDF to Text rejects wrong passwords and scanned pages without a text layer", async () => {
  await assert.rejects(() => extractPdfText(asFile(protectedBytes), { scope: "all", pageRanges: "1", preserveLineBreaks: true, cleanSpaces: true, pageSeparators: false, password: "definitely-wrong" }));
  const document = await PDFDocument.create();
  const image = await document.embedPng(new Uint8Array(await readFile(new URL("./pdf-tool-fixtures/watermark.png", import.meta.url))));
  const page = document.addPage([612, 792]);
  page.drawImage(image, { x: 0, y: 0, width: 50, height: 50 });
  const scanned = asFile(await document.save(), "scanned.pdf");
  await assert.rejects(() => extractPdfText(scanned, { scope: "all", pageRanges: "1", preserveLineBreaks: true, cleanSpaces: true, pageSeparators: false }), /scanned PDF.*OCR/i);
});

console.log(`\n${cases.length} PDF tool smoke checks passed.`);
