import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FileStatus =
  | "TEXT_READY"
  | "PDF_INGESTION_READY"
  | "PDF_METADATA_ONLY"
  | "PDF_INGESTION_FAIL"
  | "REFERENCE_ONLY"
  | "REJECTED";

type FileMode =
  | "TEXT"
  | "PDF_TEXT"
  | "REFERENCE_ONLY"
  | "REJECTED";

type RuntimeFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  preview?: string;
  base64?: string;
  dataUrl?: string;
  bytes?: number[];
  buffer?: {
    data?: number[];
  };
  role?: string;
};

type StoredRuntimeFile = {
  id: string;
  name: string;
  mimeType: string;
  type: string;
  size: number;
  text: string;
  content: string;
  role: string;
  textLength: number;
  fileHash: string;
  status: FileStatus;
  mode: FileMode;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

type FilesBody = {
  sessionId?: string;
  files?: RuntimeFile[];
  replace?: boolean;
  clear?: boolean;
};

type FileStore = Map<string, StoredRuntimeFile[]>;

type PdfExtractionResult = {
  text: string;
  source: "DIRECT_TEXT" | "PDF_BINARY" | "PDF_BASE64" | "PDF_DATA_URL" | "NONE";
  hadPdfPayload: boolean;
  failed: boolean;
  reason: string;
};

declare global {
  var __HBCE_JOKER_C2_FILE_STORE__: FileStore | undefined;
}

const MAX_FILES_PER_SESSION = 12;
const MAX_TEXT_CHARS_PER_FILE = 120_000;
const MAX_TOTAL_TEXT_CHARS_PER_SESSION = 300_000;
const MAX_FILE_NAME_LENGTH = 180;

const TEXT_MIME_PREFIXES = ["text/"];

const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/xhtml+xml",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "application/csv",
  "application/ld+json",
  "application/markdown",
  "application/x-ndjson",
  "application/octet-stream"
]);

const PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
  "text/x-pdf"
]);

const REFERENCE_ONLY_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

function getFileStore(): FileStore {
  if (!globalThis.__HBCE_JOKER_C2_FILE_STORE__) {
    globalThis.__HBCE_JOKER_C2_FILE_STORE__ = new Map();
  }

  return globalThis.__HBCE_JOKER_C2_FILE_STORE__;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSessionId(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return `JOKER-SESSION-${Date.now()}`;
}

function normalizeFileName(value: unknown, index: number): string {
  if (typeof value !== "string" || !value.trim()) {
    return `file_${index + 1}`;
  }

  return value.trim().slice(0, MAX_FILE_NAME_LENGTH);
}

function inferMimeTypeFromName(name: string): string | null {
  const normalizedName = name.toLowerCase();

  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedName.endsWith(".txt")) {
    return "text/plain";
  }

  if (normalizedName.endsWith(".md") || normalizedName.endsWith(".markdown")) {
    return "application/markdown";
  }

  if (normalizedName.endsWith(".json")) {
    return "application/json";
  }

  if (normalizedName.endsWith(".csv")) {
    return "application/csv";
  }

  if (normalizedName.endsWith(".xml")) {
    return "application/xml";
  }

  if (normalizedName.endsWith(".yaml") || normalizedName.endsWith(".yml")) {
    return "application/yaml";
  }

  if (normalizedName.endsWith(".ts")) {
    return "application/typescript";
  }

  if (normalizedName.endsWith(".tsx")) {
    return "application/typescript";
  }

  if (normalizedName.endsWith(".js")) {
    return "application/javascript";
  }

  if (normalizedName.endsWith(".jsx")) {
    return "application/javascript";
  }

  return null;
}

function normalizeMimeType(file: RuntimeFile, fileName: string): string {
  const inferredFromName = inferMimeTypeFromName(fileName);

  if (inferredFromName) {
    return inferredFromName;
  }

  const mimeType =
    typeof file.mimeType === "string" && file.mimeType.trim()
      ? file.mimeType.trim()
      : typeof file.type === "string" && file.type.trim()
        ? file.type.trim()
        : "text/plain";

  return mimeType.toLowerCase();
}

function normalizeRole(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "context";
}

function buildHash(value: unknown): string {
  const normalized =
    typeof value === "string" ? value : JSON.stringify(value ?? null);

  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}

function isTextMimeType(mimeType: string): boolean {
  if (TEXT_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

function isPdfMimeType(mimeType: string, name: string): boolean {
  return PDF_MIME_TYPES.has(mimeType) || name.toLowerCase().endsWith(".pdf");
}

function isReferenceOnlyMimeType(mimeType: string): boolean {
  return REFERENCE_ONLY_MIME_TYPES.has(mimeType);
}

function isPromptTextStatus(status: FileStatus): boolean {
  return status === "TEXT_READY" || status === "PDF_INGESTION_READY";
}

function safeTrimText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .slice(0, MAX_TEXT_CHARS_PER_FILE);
}

function looksLikeDataUrl(value: string): boolean {
  return /^data:[^;]+;base64,/i.test(value.trim());
}

function looksLikePdfBinaryString(value: string): boolean {
  const trimmed = value.trimStart();

  return trimmed.startsWith("%PDF") || trimmed.includes("%PDF-");
}

function looksLikeBase64(value: string): boolean {
  const normalized = value.trim();

  if (normalized.length < 32) {
    return false;
  }

  if (normalized.includes("\n") || normalized.includes("\r")) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}

function looksLikeReadableExtractedText(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  if (looksLikeDataUrl(normalized) || looksLikePdfBinaryString(normalized)) {
    return false;
  }

  const printableCharacters = normalized
    .slice(0, 1000)
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);

      return code === 9 || code === 10 || code === 13 || (code >= 32 && code < 127);
    }).length;

  const sampleLength = Math.min(normalized.length, 1000);

  return sampleLength > 0 && printableCharacters / sampleLength > 0.75;
}

function extractDirectText(file: RuntimeFile): string {
  if (typeof file.text === "string") {
    return file.text;
  }

  if (typeof file.content === "string") {
    return file.content;
  }

  if (typeof file.preview === "string") {
    return file.preview;
  }

  return "";
}

function getDataUrlBase64(value: string): string | null {
  const match = value.trim().match(/^data:[^;]+;base64,(?<payload>.+)$/is);

  return match?.groups?.payload ? match.groups.payload.trim() : null;
}

function decodeBase64ToBuffer(value: string): Buffer | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  try {
    return Buffer.from(normalized, "base64");
  } catch {
    return null;
  }
}

function decodeRuntimeFileBuffer(file: RuntimeFile): {
  buffer: Buffer | null;
  source: PdfExtractionResult["source"];
} {
  if (Array.isArray(file.bytes) && file.bytes.length > 0) {
    return {
      buffer: Buffer.from(file.bytes),
      source: "PDF_BINARY"
    };
  }

  if (Array.isArray(file.buffer?.data) && file.buffer.data.length > 0) {
    return {
      buffer: Buffer.from(file.buffer.data),
      source: "PDF_BINARY"
    };
  }

  if (typeof file.dataUrl === "string" && file.dataUrl.trim()) {
    const payload = getDataUrlBase64(file.dataUrl);

    if (payload) {
      return {
        buffer: decodeBase64ToBuffer(payload),
        source: "PDF_DATA_URL"
      };
    }
  }

  if (typeof file.base64 === "string" && file.base64.trim()) {
    return {
      buffer: decodeBase64ToBuffer(file.base64),
      source: "PDF_BASE64"
    };
  }

  const directText = extractDirectText(file);

  if (typeof directText === "string" && directText.trim()) {
    const dataUrlPayload = getDataUrlBase64(directText);

    if (dataUrlPayload) {
      return {
        buffer: decodeBase64ToBuffer(dataUrlPayload),
        source: "PDF_DATA_URL"
      };
    }

    if (looksLikePdfBinaryString(directText)) {
      return {
        buffer: Buffer.from(directText, "latin1"),
        source: "PDF_BINARY"
      };
    }

    if (looksLikeBase64(directText)) {
      return {
        buffer: decodeBase64ToBuffer(directText),
        source: "PDF_BASE64"
      };
    }
  }

  return {
    buffer: null,
    source: "NONE"
  };
}

function decodePdfLiteralString(value: string): string {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = value[index + 1];

    if (!next) {
      continue;
    }

    if (next === "n") {
      result += "\n";
      index += 1;
      continue;
    }

    if (next === "r") {
      result += "\r";
      index += 1;
      continue;
    }

    if (next === "t") {
      result += "\t";
      index += 1;
      continue;
    }

    if (next === "b") {
      result += "\b";
      index += 1;
      continue;
    }

    if (next === "f") {
      result += "\f";
      index += 1;
      continue;
    }

    if (next === "(" || next === ")" || next === "\\") {
      result += next;
      index += 1;
      continue;
    }

    if (/[0-7]/.test(next)) {
      let octal = next;
      let offset = 2;

      while (
        offset <= 3 &&
        index + offset < value.length &&
        /[0-7]/.test(value[index + offset] || "")
      ) {
        octal += value[index + offset];
        offset += 1;
      }

      result += String.fromCharCode(Number.parseInt(octal, 8));
      index += octal.length;
      continue;
    }

    result += next;
    index += 1;
  }

  return result;
}

function decodeUtf16Be(buffer: Buffer): string {
  const chars: string[] = [];

  for (let index = 0; index + 1 < buffer.length; index += 2) {
    const code = buffer[index] * 256 + buffer[index + 1];

    if (code > 0) {
      chars.push(String.fromCharCode(code));
    }
  }

  return chars.join("");
}

function decodePdfHexString(value: string): string {
  const clean = value.replace(/\s+/g, "");

  if (!clean || clean.length < 2) {
    return "";
  }

  const padded = clean.length % 2 === 0 ? clean : `${clean}0`;

  try {
    const buffer = Buffer.from(padded, "hex");

    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return decodeUtf16Be(buffer.subarray(2));
    }

    const utf8 = buffer.toString("utf8");

    if (looksLikeReadableExtractedText(utf8)) {
      return utf8;
    }

    return buffer.toString("latin1");
  } catch {
    return "";
  }
}

function extractLiteralStringsFromPdfExpression(value: string): string[] {
  const strings: string[] = [];
  const literalRegex = /\((?:\\.|[^\\()])*\)/g;
  const hexRegex = /<([0-9a-fA-F\s]+)>/g;

  for (const match of value.matchAll(literalRegex)) {
    const literal = match[0];

    if (!literal || literal.length < 2) {
      continue;
    }

    strings.push(decodePdfLiteralString(literal.slice(1, -1)));
  }

  for (const match of value.matchAll(hexRegex)) {
    if (!match[1]) {
      continue;
    }

    strings.push(decodePdfHexString(match[1]));
  }

  return strings;
}

function extractPdfTextOperators(source: string): string {
  const parts: string[] = [];
  const tjRegex = /(\((?:\\.|[^\\()])*\)|<([0-9a-fA-F\s]+)>)\s*Tj/g;
  const arrayTjRegex = /\[(?<items>[\s\S]*?)\]\s*TJ/g;
  const quoteRegex = /(\((?:\\.|[^\\()])*\))\s*['"]/g;

  for (const match of source.matchAll(tjRegex)) {
    const expression = match[1];

    if (!expression) {
      continue;
    }

    const extracted = extractLiteralStringsFromPdfExpression(expression).join("");

    if (extracted.trim()) {
      parts.push(extracted);
    }
  }

  for (const match of source.matchAll(arrayTjRegex)) {
    const expression = match.groups?.items || "";

    if (!expression) {
      continue;
    }

    const extracted = extractLiteralStringsFromPdfExpression(expression).join("");

    if (extracted.trim()) {
      parts.push(extracted);
    }
  }

  for (const match of source.matchAll(quoteRegex)) {
    const expression = match[1];

    if (!expression) {
      continue;
    }

    const extracted = extractLiteralStringsFromPdfExpression(expression).join("");

    if (extracted.trim()) {
      parts.push(extracted);
    }
  }

  return parts.join("\n");
}

function extractPdfStreams(source: string): string[] {
  const streams: string[] = [];
  const streamRegex = /(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;

  for (const match of source.matchAll(streamRegex)) {
    const dictionary = match[1] || "";
    const streamContent = match[2] || "";

    if (!streamContent) {
      continue;
    }

    if (!/\/FlateDecode\b/.test(dictionary)) {
      streams.push(streamContent);
      continue;
    }

    try {
      const inflated = inflateSync(Buffer.from(streamContent, "latin1"));

      streams.push(inflated.toString("utf8"));
      streams.push(inflated.toString("latin1"));
    } catch {
      streams.push(streamContent);
    }
  }

  return streams;
}

function normalizeExtractedPdfText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_TEXT_CHARS_PER_FILE);
}

function extractTextFromPdfBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) {
    return "";
  }

  const latin1 = buffer.toString("latin1");
  const sources = [latin1, ...extractPdfStreams(latin1)];
  const extractedParts: string[] = [];

  for (const source of sources) {
    const extracted = extractPdfTextOperators(source);

    if (extracted.trim()) {
      extractedParts.push(extracted);
    }
  }

  return normalizeExtractedPdfText(extractedParts.join("\n"));
}

function extractPdfText(file: RuntimeFile): PdfExtractionResult {
  const directText = extractDirectText(file);

  if (looksLikeReadableExtractedText(directText)) {
    return {
      text: safeTrimText(directText),
      source: "DIRECT_TEXT",
      hadPdfPayload: true,
      failed: false,
      reason:
        "PDF text was already provided by the client and can be used as prompt context."
    };
  }

  const decoded = decodeRuntimeFileBuffer(file);

  if (!decoded.buffer) {
    return {
      text: "",
      source: "NONE",
      hadPdfPayload: false,
      failed: false,
      reason:
        "PDF file metadata was received, but no readable text, base64 payload, data URL, byte array or binary content was provided."
    };
  }

  const hasPdfHeader = decoded.buffer.subarray(0, 8).toString("latin1").includes("%PDF");
  const extractedText = extractTextFromPdfBuffer(decoded.buffer);

  if (extractedText.trim()) {
    return {
      text: extractedText,
      source: decoded.source,
      hadPdfPayload: true,
      failed: false,
      reason: hasPdfHeader
        ? "PDF payload was parsed and readable text was extracted for prompt context."
        : "PDF-like payload was parsed and readable text was extracted for prompt context."
    };
  }

  return {
    text: "",
    source: decoded.source,
    hadPdfPayload: true,
    failed: true,
    reason: hasPdfHeader
      ? "PDF payload was received, but no readable text could be extracted. The PDF may be scanned, image-only, encrypted or structurally unsupported by the lightweight parser."
      : "A payload was received for a PDF-labelled file, but no readable PDF text could be extracted."
  };
}

function normalizeSingleFile(
  file: RuntimeFile,
  index: number
): StoredRuntimeFile {
  const timestamp = nowIso();
  const name = normalizeFileName(file.name, index);
  const mimeType = normalizeMimeType(file, name);
  const role = normalizeRole(file.role);

  const rawText = extractDirectText(file);
  const normalizedText = safeTrimText(rawText);
  const hasText = normalizedText.trim().length > 0;
  const textLength = normalizedText.length;

  const declaredSize =
    typeof file.size === "number" && Number.isFinite(file.size)
      ? Math.max(0, Math.floor(file.size))
      : textLength;

  const baseId =
    typeof file.id === "string" && file.id.trim()
      ? file.id.trim()
      : `${name}:${mimeType}:${declaredSize}:${textLength}:${index}`;

  const id = buildHash(baseId).replace("sha256:", "file-").slice(0, 48);

  if (isPdfMimeType(mimeType, name)) {
    const pdfExtraction = extractPdfText(file);
    const pdfText = safeTrimText(pdfExtraction.text);
    const pdfTextLength = pdfText.length;

    if (pdfText.trim()) {
      return {
        id,
        name,
        mimeType,
        type: mimeType,
        size: declaredSize,
        text: pdfText,
        content: pdfText,
        role,
        textLength: pdfTextLength,
        fileHash: buildHash(pdfText),
        status: "PDF_INGESTION_READY",
        mode: "PDF_TEXT",
        reason: `${pdfExtraction.reason} Source=${pdfExtraction.source}. legalCertification=false. OPC=technical proof receipt only.`,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    }

    if (pdfExtraction.failed) {
      return {
        id,
        name,
        mimeType,
        type: mimeType,
        size: declaredSize,
        text: "",
        content: "",
        role,
        textLength: 0,
        fileHash: buildHash({
          name,
          mimeType,
          size: declaredSize,
          pdfIngestionFail: true,
          source: pdfExtraction.source
        }),
        status: "PDF_INGESTION_FAIL",
        mode: "REFERENCE_ONLY",
        reason: `${pdfExtraction.reason} legalCertification=false. OPC=technical proof receipt only.`,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    }

    return {
      id,
      name,
      mimeType,
      type: mimeType,
      size: declaredSize,
      text: "",
      content: "",
      role,
      textLength: 0,
      fileHash: buildHash({
        name,
        mimeType,
        size: declaredSize,
        pdfMetadataOnly: true
      }),
      status: "PDF_METADATA_ONLY",
      mode: "REFERENCE_ONLY",
      reason: `${pdfExtraction.reason} legalCertification=false. OPC=technical proof receipt only.`,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  if (hasText && isTextMimeType(mimeType)) {
    return {
      id,
      name,
      mimeType,
      type: mimeType,
      size: declaredSize,
      text: normalizedText,
      content: normalizedText,
      role,
      textLength,
      fileHash: buildHash(normalizedText),
      status: "TEXT_READY",
      mode: "TEXT",
      reason:
        "File contains readable text and can be used as prompt context. legalCertification=false. OPC=technical proof receipt only.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  if (hasText && !isReferenceOnlyMimeType(mimeType)) {
    return {
      id,
      name,
      mimeType,
      type: mimeType,
      size: declaredSize,
      text: normalizedText,
      content: normalizedText,
      role,
      textLength,
      fileHash: buildHash(normalizedText),
      status: "TEXT_READY",
      mode: "TEXT",
      reason:
        "File contains extracted text. MIME type is not explicitly text, but safe extracted text is available. legalCertification=false. OPC=technical proof receipt only.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  if (isReferenceOnlyMimeType(mimeType)) {
    return {
      id,
      name,
      mimeType,
      type: mimeType,
      size: declaredSize,
      text: "",
      content: "",
      role,
      textLength: 0,
      fileHash: buildHash({
        name,
        mimeType,
        size: declaredSize,
        referenceOnly: true
      }),
      status: "REFERENCE_ONLY",
      mode: "REFERENCE_ONLY",
      reason:
        "File is active only as a reference. It was not converted into readable prompt text. legalCertification=false. OPC=technical proof receipt only.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  return {
    id,
    name,
    mimeType,
    type: mimeType,
    size: declaredSize,
    text: "",
    content: "",
    role,
    textLength: 0,
    fileHash: buildHash({
      name,
      mimeType,
      size: declaredSize,
      rejected: true
    }),
    status: "REJECTED",
    mode: "REJECTED",
    reason:
      "File has no readable text and its MIME type is not supported as a safe reference-only file. legalCertification=false. OPC=technical proof receipt only.",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function normalizeFiles(files: unknown): StoredRuntimeFile[] {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.map((file, index) => {
    return normalizeSingleFile(file as RuntimeFile, index);
  });
}

function dedupeFiles(files: StoredRuntimeFile[]): StoredRuntimeFile[] {
  const seen = new Set<string>();
  const result: StoredRuntimeFile[] = [];

  for (const file of files) {
    const key = `${file.id}:${file.fileHash}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(file);
  }

  return result;
}

function enforceSessionLimits(files: StoredRuntimeFile[]): StoredRuntimeFile[] {
  const latestFiles = files.slice(-MAX_FILES_PER_SESSION);
  const result: StoredRuntimeFile[] = [];
  let totalTextLength = 0;

  for (let index = latestFiles.length - 1; index >= 0; index -= 1) {
    const file = latestFiles[index];

    if (!file) {
      continue;
    }

    if (!isPromptTextStatus(file.status)) {
      result.unshift(file);
      continue;
    }

    if (totalTextLength + file.textLength > MAX_TOTAL_TEXT_CHARS_PER_SESSION) {
      const downgradedStatus: FileStatus =
        file.status === "PDF_INGESTION_READY"
          ? "PDF_METADATA_ONLY"
          : "REFERENCE_ONLY";

      result.unshift({
        ...file,
        text: "",
        content: "",
        textLength: 0,
        status: downgradedStatus,
        mode: "REFERENCE_ONLY",
        reason:
          "File was converted to reference-only because the session text limit was reached. legalCertification=false. OPC=technical proof receipt only.",
        updatedAt: nowIso()
      });
      continue;
    }

    totalTextLength += file.textLength;
    result.unshift(file);
  }

  return result;
}

function mergeFiles(
  existingFiles: StoredRuntimeFile[],
  incomingFiles: StoredRuntimeFile[]
): StoredRuntimeFile[] {
  const merged = dedupeFiles([...existingFiles, ...incomingFiles]);

  return enforceSessionLimits(merged);
}

function summarizeFiles(files: StoredRuntimeFile[], includeText: boolean) {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    size: file.size,
    role: file.role,
    textLength: file.textLength,
    fileHash: file.fileHash,
    status: file.status,
    mode: file.mode,
    reason: file.reason,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    text: includeText ? file.text : undefined,
    content: includeText ? file.content : undefined
  }));
}

function buildSessionSummary(sessionId: string, files: StoredRuntimeFile[]) {
  const textReadyCount = files.filter((file) => file.status === "TEXT_READY").length;
  const pdfReadyCount = files.filter(
    (file) => file.status === "PDF_INGESTION_READY"
  ).length;
  const pdfMetadataOnlyCount = files.filter(
    (file) => file.status === "PDF_METADATA_ONLY"
  ).length;
  const pdfIngestionFailCount = files.filter(
    (file) => file.status === "PDF_INGESTION_FAIL"
  ).length;
  const referenceOnlyCount = files.filter(
    (file) => file.status === "REFERENCE_ONLY"
  ).length;
  const rejectedCount = files.filter((file) => file.status === "REJECTED").length;
  const totalTextLength = files.reduce((sum, file) => sum + file.textLength, 0);
  const promptReadyCount = files.filter((file) =>
    isPromptTextStatus(file.status)
  ).length;

  return {
    sessionId,
    count: files.length,
    promptReadyCount,
    textReadyCount,
    pdfReadyCount,
    pdfMetadataOnlyCount,
    pdfIngestionFailCount,
    referenceOnlyCount,
    rejectedCount,
    totalTextLength,
    maxFilesPerSession: MAX_FILES_PER_SESSION,
    maxTextCharsPerFile: MAX_TEXT_CHARS_PER_FILE,
    maxTotalTextCharsPerSession: MAX_TOTAL_TEXT_CHARS_PER_SESSION,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}

export async function POST(req: NextRequest) {
  let body: FilesBody;

  try {
    body = (await req.json()) as FilesBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_JSON_BODY",
        legalCertification: false,
        opc: "technical proof receipt only"
      },
      { status: 400 }
    );
  }

  const store = getFileStore();
  const sessionId = normalizeSessionId(body.sessionId);

  if (body.clear) {
    store.delete(sessionId);

    return NextResponse.json({
      ok: true,
      sessionId,
      cleared: true,
      summary: buildSessionSummary(sessionId, []),
      legalCertification: false,
      opc: "technical proof receipt only"
    });
  }

  const incomingFiles = normalizeFiles(body.files);
  const existingFiles = body.replace ? [] : store.get(sessionId) || [];
  const nextFiles = mergeFiles(existingFiles, incomingFiles);

  store.set(sessionId, nextFiles);

  return NextResponse.json({
    ok: true,
    sessionId,
    replaced: Boolean(body.replace),
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false),
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const store = getFileStore();

  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
  const includeText = url.searchParams.get("includeText") !== "false";

  const files = store.get(sessionId) || [];

  return NextResponse.json({
    ok: true,
    sessionId,
    summary: buildSessionSummary(sessionId, files),
    files: summarizeFiles(files, includeText),
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const store = getFileStore();

  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
  const fileId = url.searchParams.get("fileId");

  if (!fileId) {
    store.delete(sessionId);

    return NextResponse.json({
      ok: true,
      sessionId,
      deleted: "SESSION_FILES",
      summary: buildSessionSummary(sessionId, []),
      legalCertification: false,
      opc: "technical proof receipt only"
    });
  }

  const files = store.get(sessionId) || [];
  const nextFiles = files.filter((file) => file.id !== fileId);

  store.set(sessionId, nextFiles);

  return NextResponse.json({
    ok: true,
    sessionId,
    deleted: fileId,
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false),
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}
