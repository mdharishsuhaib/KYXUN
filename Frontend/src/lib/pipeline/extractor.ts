/**
 * KYXUN DOCUMENT EXTRACTOR
 *
 * Stage 1: Extract raw text from uploaded files, page-by-page where possible.
 * Returns an array of pages so downstream cleaners/chunkers retain page numbers.
 */

import { inflateRawSync } from "zlib";
import mammoth from "mammoth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RawPage {
  pageNumber: number;  // 1-indexed
  text: string;
  source: string;      // file name
}

export interface ExtractionResult {
  fileName: string;
  fileType: string;
  pages: RawPage[];
  totalCharacters: number;
}

// ── Main extractor ─────────────────────────────────────────────────────────────

export async function extractFile(file: File): Promise<ExtractionResult | null> {
  const buf = await file.arrayBuffer();
  const bytes = Buffer.from(buf);
  const name = file.name;

  // PDF — use pdf-parse for page-level extraction
  if (file.type === "application/pdf" || /\.pdf$/i.test(name)) {
    return extractPDF(bytes, name);
  }

  // Plain text / markdown / CSV
  if (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    file.type === "text/markdown" ||
    /\.(txt|md|csv|log)$/i.test(name)
  ) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    if (text.trim().length < 20) return null;
    return textToPages(text.slice(0, 200000), name, file.type);
  }

  // Word / ODT — prefer structured XML extraction for DOCX, fallback to binary text
  if (
    /\.docx$/i.test(name) ||
    file.type.includes("word") ||
    file.type.includes("opendocument")
  ) {
    const docxText = await extractDocxText(bytes);
    if (docxText) return textToPages(docxText, name, file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (/\.docx$/i.test(name) || file.type.includes("wordprocessingml")) return null;
    return extractBinary(bytes, name, file.type, 80000);
  }

  // Presentations (PPTX/PPT/ODP)
  if (
    /\.pptx$/i.test(name) ||
    file.type.includes("presentation") ||
    file.type.includes("powerpoint")
  ) {
    const pptxText = extractPptxText(bytes);
    if (pptxText) return textToPages(pptxText, name, file.type || "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    return extractBinary(bytes, name, file.type, 80000);
  }

  // Legacy Office formats: best-effort text extraction
  if (/\.(doc|ppt|rtf|odt|odf|pps)$/i.test(name)) {
    return extractBinary(bytes, name, file.type, 80000);
  }

  // Spreadsheets
  if (
    /\.(xlsx?|ods|numbers)$/i.test(name) ||
    file.type.includes("spreadsheet")
  ) {
    return extractBinary(bytes, name, file.type, 60000);
  }

  return null;
}

// ── PDF extraction with page boundaries ───────────────────────────────────────

async function extractPDF(bytes: Buffer, fileName: string): Promise<ExtractionResult | null> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const pages: RawPage[] = [];

    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    const fullData = await parser.getText();
    await parser.destroy();

    if (!fullData.text || fullData.text.length < 20) return null;

    // pdf-parse returns numpages — split by approximate equal chunks per page
    const numPages: number = (fullData as any).numpages || 1;
    const fullText = fullData.text;

    if (numPages <= 1) {
      pages.push({ pageNumber: 1, text: fullText.slice(0, 200000), source: fileName });
    } else {
      // Try to split on form-feed character (\f) which pdf-parse uses as page delimiter
      const pageSplits = fullText.split(/\f/);
      if (pageSplits.length >= numPages) {
        pageSplits.forEach((pageText, i) => {
          const trimmed = pageText.trim();
          if (trimmed.length > 0) {
            pages.push({ pageNumber: i + 1, text: trimmed, source: fileName });
          }
        });
      } else {
        // Fall back to equal-length splits
        const charsPerPage = Math.ceil(fullText.length / numPages);
        for (let i = 0; i < numPages; i++) {
          const start = i * charsPerPage;
          const end = Math.min(start + charsPerPage, fullText.length);
          const pageText = fullText.slice(start, end).trim();
          if (pageText.length > 0) {
            pages.push({ pageNumber: i + 1, text: pageText, source: fileName });
          }
        }
      }
    }

    const totalCharacters = pages.reduce((sum, p) => sum + p.text.length, 0);
    return { fileName, fileType: "application/pdf", pages, totalCharacters };
  } catch (e) {
    console.warn("[extractor] PDF parse failed, falling back to binary:", e);
    // Fallback: treat as binary
    const buf = bytes;
    const raw = buf.toString("binary");
    const text = cleanBinaryText(raw, 90000);
    if (text.length < 40) return null;
    return textToPages(text, fileName, "application/pdf");
  }
}

// ── Binary extraction for legacy Office files ───────────────────────────────

function extractBinary(bytes: Buffer, fileName: string, fileType: string, maxChars: number): ExtractionResult | null {
  const raw = bytes.toString("binary");
  const text = cleanBinaryText(raw, maxChars);
  if (text.length < 40) return null;
  return textToPages(text, fileName, fileType);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function extractDocxText(bytes: Buffer): Promise<string | null> {
  try {
    const result = await mammoth.extractRawText({ buffer: bytes });
    const text = result.value.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return text.length > 20 ? text : null;
  } catch (error) {
    console.warn("[extractor] Mammoth DOCX extraction failed:", error);
    return null;
  }
}

function extractPptxText(bytes: Buffer): string | null {
  const entries = readZipEntries(bytes);
  const slideEntries = Array.from(entries.entries())
    .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .map(([, content]) => content);

  if (slideEntries.length === 0) return null;

  const merged = slideEntries.map((content) => extractXmlText(content.toString("utf8"))).filter(Boolean).join("\n\n");
  return merged.trim().length > 20 ? merged : null;
}

function readZipEntries(bytes: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    if (bytes.readUInt32LE(offset) !== 0x04034b50) break;

    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const compressedSize = bytes.readUInt32LE(offset + 18);
    const compressionMethod = bytes.readUInt16LE(offset + 8);
    const fileNameBuffer = bytes.subarray(offset + 30, offset + 30 + nameLength);
    const fileName = fileNameBuffer.toString("utf8");
    const dataStart = offset + 30 + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > bytes.length) break;

    const compressed = bytes.subarray(dataStart, dataEnd);
    let content: Buffer;

    if (compressionMethod === 0) {
      content = compressed;
    } else if (compressionMethod === 8) {
      content = inflateRawSync(compressed);
    } else {
      offset = dataEnd;
      continue;
    }

    entries.set(fileName, content);
    offset = dataEnd;
  }

  return entries;
}

function extractXmlText(xml: string): string {
  const readable = xml
    .replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi, (_, inner: string) => inner)
    .replace(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi, (_, inner: string) => inner)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  return readable;
}

/** Extract printable ASCII runs from a binary buffer */
function cleanBinaryText(raw: string, maxChars: number): string {
  const runs = (raw.match(/[\x20-\x7E\t\r\n]{4,}/g) ?? [])
    .join("\n")
    .replace(/[ \t]{3,}/g, " ")   // collapse multiple spaces
    .replace(/\n{4,}/g, "\n\n\n") // collapse excessive blank lines
    .trim();
  return runs.slice(0, maxChars);
}

/** Split a long text into pseudo-pages of ~2000 chars, preserving paragraph boundaries */
function textToPages(text: string, fileName: string, fileType: string): ExtractionResult {
  const PAGE_SIZE = 2000; // characters per pseudo-page
  const paragraphs = text.split(/\n{2,}/);
  const pages: RawPage[] = [];
  let currentPage = "";
  let pageNum = 1;

  for (const para of paragraphs) {
    if ((currentPage + "\n\n" + para).length > PAGE_SIZE && currentPage.length > 0) {
      pages.push({ pageNumber: pageNum++, text: currentPage.trim(), source: fileName });
      currentPage = para;
    } else {
      currentPage = currentPage ? currentPage + "\n\n" + para : para;
    }
  }
  if (currentPage.trim().length > 0) {
    pages.push({ pageNumber: pageNum, text: currentPage.trim(), source: fileName });
  }

  const totalCharacters = pages.reduce((sum, p) => sum + p.text.length, 0);
  return { fileName, fileType, pages, totalCharacters };
}
