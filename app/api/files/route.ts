import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";

import {
  ensureHbceDatabaseReady,
  listDocumentProfilesFromDatabase,
  toPublicDocumentProfile,
  upsertDocumentProfileToDatabase,
  type DocumentProfileDatabaseInput
} from "@/lib/ipr-database";
import {
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID
} from "@/lib/ipr-database-schema";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const FILE_ROUTE_REVISION = "HBCE-API-FILES-DOCUMENT-PROFILE-REGISTRY-v2-DOCUMENT_PROFILE_CANONICAL_FIX-v3-GLOSSARY_CANONICAL_FIX-v4";


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


type DocumentProfilePersistenceStatus =
  | "PERSISTED"
  | "DATABASE_NOT_READY"
  | "PERSISTENCE_FAILED"
  | "SKIPPED";


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
  documentProfileId?: string | null;
  documentProfileStatus?: DocumentProfilePersistenceStatus | null;
  documentProfileHash?: string | null;
  documentProfileReason?: string | null;
  createdAt: string;
  updatedAt: string;
};


type FilesBody = {
  sessionId?: string;
  threadId?: string;
  humanIpr?: string;
  runtimeIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  sourceKind?: string;
  files?: RuntimeFile[];
  replace?: boolean;
  clear?: boolean;
};

type DocumentProfilePersistenceResult = {
  fileId: string;
  filename: string;
  fileHash: string;
  attempted: boolean;
  ok: boolean;
  status: DocumentProfilePersistenceStatus;
  rowCount: number;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
  profile: Record<string, unknown> | null;
  input: {
    docFamily: string | null;
    volume: string | null;
    title: string | null;
    canonicalAxis: string | null;
    keyTerms: string[];
    reusableInPrompt: boolean;
  };
};

type DocumentProfileContext = {
  sessionId: string;
  threadId?: string | null;
  humanIpr: string;
  runtimeIpr: string;
  tenantId: string;
  workspaceId: string;
  sourceKind: string;
};


type CanonicalCorpusVolumeProfile = {
  volume: "GLOSSARY" | "V1" | "V2" | "V3" | "V4" | "V5";
  title: string;
  summary: string;
  keyTerms: string[];
  canonicalDocumentKind?: string;
};

const DOCUMENT_PROFILE_CANONICAL_FIX_REVISION = "DOCUMENT_PROFILE_GLOSSARY_CANONICAL_FIX_v4";

const CANONICAL_CORPUS_GLOSSARY_PROFILE: CanonicalCorpusVolumeProfile = {
  volume: "GLOSSARY",
  title: "GLOSSARIO CANONICO DEL CORPUS",
  canonicalDocumentKind: "CANONICAL_GLOSSARY",
  summary:
    "Profilo documento GLOSSARIO CANONICO DEL CORPUS: lessico canonico trasversale del CORPUS ESOTEROLOGIA ERMETICA, con mappatura delle voci operative, appartenenza primaria ai volumi e sviluppo secondario V1-V5. Stabilizza l'asse Decisione · Costo · Traccia · Tempo, IPR-CEE, Rascensionale, Alien Code e le soglie operative come vocabolario riusabile del runtime.",
  keyTerms: [
    "Glossario Canonico del Corpus",
    "Esoterologia",
    "IPR-CEE",
    "Decisione",
    "Costo",
    "Traccia",
    "Tempo",
    "Rascensionale",
    "Innesco rascensionale",
    "Soglia operativa",
    "Soglia fail-closed",
    "Sigillo operativo",
    "Traccia opponibile",
    "Codice alieno / Alien Code",
    "Interfaccia rascensionale",
    "Accoppiamento organismo-sistema",
    "Riconconicità organismo-sistema",
    "Unità qubitronica",
    "Corpus Esoterologia Ermetica",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "IPR",
    "EVT",
    "OPC"
  ]
};

const CANONICAL_CORPUS_VOLUME_PROFILES: Record<"V1" | "V2" | "V3" | "V4" | "V5", CanonicalCorpusVolumeProfile> = {
  V1: {
    volume: "V1",
    title: "ESOTEROLOGIA",
    summary:
      "Profilo documento ESOTEROLOGIA Volume I del CORPUS ESOTEROLOGIA ERMETICA: fonda il criterio del Reale operativo e l'asse Decisione · Costo · Traccia · Tempo come grammatica di verificazione della realtà operativa.",
    keyTerms: [
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Reale operativo",
      "Corpus Esoterologia Ermetica",
      "Esoterologia",
      "Scienza esoterologica",
      "Soglia di realtà",
      "Traccia opponibile",
      "IPR"
    ]
  },
  V2: {
    volume: "V2",
    title: "MATRIX / 05-04-2026",
    summary:
      "Profilo documento MATRIX / 05-04-2026 Volume II del CORPUS ESOTEROLOGIA ERMETICA: trasferisce la griglia Decisione · Costo · Traccia · Tempo nel dominio istituzionale, leggendo istituzioni, Stato, esecuzione, fiscalità, debito, sicurezza, forza, conflitto, decadimento e ordine globale come sequenze operative distribuite.",
    keyTerms: [
      "Matrix",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Reale operativo",
      "Corpus Esoterologia Ermetica",
      "Esoterologia",
      "Dominio istituzionale",
      "Istituzione come sequenza distribuita",
      "Stato come configurazione operativa",
      "Esecuzione",
      "Fiscalità",
      "Debito",
      "Sicurezza",
      "Forza",
      "Conflitto",
      "Decadimento",
      "Ordine globale",
      "Regime di validità",
      "Verificabilità distribuita",
      "IPR",
      "MATRIX"
    ]
  },
  V3: {
    volume: "V3",
    title: "LEX HERMETICUM",
    summary:
      "Profilo documento LEX HERMETICUM Volume III del CORPUS ESOTEROLOGIA ERMETICA: formalizza validità, opponibilità, responsabilità, traccia e decadimento nel dominio istituzionale, con l'asse Decisione · Costo · Traccia · Tempo come criterio operativo.",
    keyTerms: [
      "Lex Hermeticum",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Regime di validità",
      "Validità operativa",
      "Opponibilità",
      "Responsabilità",
      "Traccia opponibile",
      "Decadimento",
      "Corpus Esoterologia Ermetica",
      "Esoterologia",
      "IPR",
      "EVT",
      "OPC"
    ]
  },
  V4: {
    volume: "V4",
    title: "ALIEN CODE — FRAMEWORK OPERATIVO PER LA TRACCIABILITÀ RASCENSIONALE",
    summary:
      "Profilo documento ALIEN CODE Volume IV del CORPUS ESOTEROLOGIA ERMETICA: definisce il framework operativo per la tracciabilità rascensionale, l'interfaccia rascensionale e l'accoppiamento organismo-sistema attraverso Decisione · Costo · Traccia · Tempo.",
    keyTerms: [
      "Alien Code",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Interfaccia rascensionale",
      "Unità qubitronica",
      "Riconconicità organismo-sistema",
      "Accoppiamento organismo-sistema",
      "Soglia di realtà",
      "Evento operativo",
      "Campo rascensionale",
      "Loop biocibernetico",
      "Traccia opponibile",
      "Decadimento",
      "Corpus Esoterologia Ermetica",
      "IPR"
    ]
  },
  V5: {
    volume: "V5",
    title: "IL PORTALE DELL’ANTICRISTO",
    summary:
      "Profilo documento IL PORTALE DELL’ANTICRISTO Volume V del CORPUS ESOTEROLOGIA ERMETICA: tratta Apocalisse come regime di esposizione, Anticristo come configurazione di rottura del campo umano e Portale come soglia operativa verificabile tramite Decisione · Costo · Traccia · Tempo.",
    keyTerms: [
      "Il Portale dell’Anticristo",
      "Apocalisse",
      "Anticristo",
      "Portale",
      "Regime di esposizione",
      "Soglia operativa",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Reale operativo",
      "Traccia opponibile",
      "Continuità esposta",
      "Scienza esoterologica",
      "Informazione come incidenza sul campo umano",
      "Corpus Esoterologia Ermetica",
      "IPR"
    ]
  }
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


const CANONICAL_AXIS_DCTT = "Decisione · Costo · Traccia · Tempo";

const DOCUMENT_KEY_TERM_CANDIDATES = [
  "Glossario Canonico del Corpus",
  "IPR-CEE",
  "Soglia fail-closed",
  "Sigillo operativo",
  "Codice alieno / Alien Code",
  "Accoppiamento organismo-sistema",
  "Rascensionale",
  "Innesco rascensionale",
  "Matrix",
  "Decisione",
  "Costo",
  "Traccia",
  "Tempo",
  "Reale operativo",
  "Corpus Esoterologia Ermetica",
  "Esoterologia",
  "Dominio istituzionale",
  "Istituzione come sequenza distribuita",
  "Stato come configurazione operativa",
  "Esecuzione",
  "Fiscalità",
  "Debito",
  "Sicurezza",
  "Forza",
  "Conflitto",
  "Decadimento",
  "Ordine globale",
  "Regime di validità",
  "Traccia opponibile",
  "Verificabilità distribuita",
  "APOKALYPSIS",
  "U.S.E.",
  "Sovranità digitale",
  "Voto digitale federato",
  "Alien Code",
  "COD 1 Alieno",
  "Interfaccia rascensionale",
  "IPR",
  "EVT",
  "OPC",
  "MATRIX"
];


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



function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeContextString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }


  return fallback;
}


function buildDocumentProfileContext(body: FilesBody, sessionId: string): DocumentProfileContext {
  return {
    sessionId,
    threadId: typeof body.threadId === "string" && body.threadId.trim() ? body.threadId.trim() : sessionId,
    humanIpr: normalizeContextString(body.humanIpr, HBCE_SELF_PILOT_HUMAN_IPR),
    runtimeIpr: normalizeContextString(body.runtimeIpr, "IPR-AI-0001"),
    tenantId: normalizeContextString(body.tenantId, HBCE_SELF_PILOT_TENANT_ID),
    workspaceId: normalizeContextString(body.workspaceId, HBCE_SELF_PILOT_WORKSPACE_ID),
    sourceKind: normalizeContextString(body.sourceKind, "FILE_UPLOAD")
  };
}


function extractFirstNonEmptyLines(text: string, limit: number): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
}


function includesAll(normalized: string, terms: string[]): boolean {
  return terms.every((term) => normalized.includes(normalizeSearchText(term)));
}



function isCanonicalCorpusGlossary(file: StoredRuntimeFile): boolean {
  const normalizedName = normalizeSearchText(file.name);
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 60000)}`);

  const hasExplicitGlossaryTitle =
    normalizedName.includes("glossario canonico del corpus") ||
    normalized.includes("glossario canonico del corpus");

  const hasCanonicalGlossaryStructure =
    normalized.includes("con volume di appartenenza primaria") ||
    normalized.includes("n a b c d e v vs");

  const hasCrossVolumeCanonicalLexicon =
    includesAll(normalized, ["ipr cee", "decisione", "costo", "traccia", "tempo"]) &&
    includesAll(normalized, ["soglia fail closed", "dio"]);

  return Boolean(hasExplicitGlossaryTitle && (hasCanonicalGlossaryStructure || hasCrossVolumeCanonicalLexicon));
}


function inferCanonicalCorpusVolumeProfile(file: StoredRuntimeFile): CanonicalCorpusVolumeProfile | null {
  const normalizedName = normalizeSearchText(file.name);
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 30000)}`);


  if (isCanonicalCorpusGlossary(file)) {
    return CANONICAL_CORPUS_GLOSSARY_PROFILE;
  }


  if (
    normalizedName.includes("5e 5e il portale dell anticristo") ||
    normalized.includes("il portale dell anticristo") ||
    includesAll(normalized, ["anticristo", "portale", "apocalisse"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V5;
  }


  if (
    normalizedName.includes("4d 4d alien code") ||
    normalized.includes("framework operativo per la tracciabilita rascensionale") ||
    includesAll(normalized, ["alien code", "interfaccia rascensionale"]) ||
    includesAll(normalized, ["unita qubitronica", "riconconicita"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V4;
  }


  if (
    normalizedName.includes("3c 3c lex hermeticum") ||
    normalized.includes("lex hermeticum") ||
    includesAll(normalized, ["regime di validita", "opponibilita", "responsabilita"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V3;
  }


  if (
    normalizedName.includes("2b 2b matrix") ||
    normalized.includes("matrix 05 04 2026") ||
    includesAll(normalized, ["dominio istituzionale", "fiscalita", "debito"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V2;
  }


  if (
    normalizedName.includes("1a 1a corpus esoterologia ermetica") ||
    includesAll(normalizedName, ["corpus esoterologia ermetica"]) ||
    includesAll(normalized, ["corpus esoterologia ermetica", "volume i", "esoterologia"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V1;
  }


  return null;
}


function inferDocumentFamily(file: StoredRuntimeFile): string | null {
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 12000)}`);
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (canonicalCorpusProfile) {
    return "CORPUS_ESOTEROLOGIA_ERMETICA";
  }


  if (normalized.includes("apokalypsis")) {
    return "APOKALYPSIS";
  }


  if (
    normalized.includes("u s e") ||
    normalized.includes("united states of europe") ||
    normalized.includes("emergenza europea") ||
    normalized.includes("sovranita digitale europea") ||
    normalized.includes("voto digitale federato") ||
    normalized.includes("costituzione operativa europea")
  ) {
    return "USE";
  }


  if (
    normalized.includes("corpus esoterologia ermetica") ||
    normalized.includes("esoterologia") ||
    normalized.includes("decisione costo traccia tempo") ||
    normalized.includes("matrix 05 04 2026") ||
    includesAll(normalized, ["matrix", "05", "04", "2026"])
  ) {
    return "CORPUS_ESOTEROLOGIA_ERMETICA";
  }


  if (
    normalized.includes("alien code") ||
    normalized.includes("cod 1 alieno") ||
    normalized.includes("codice alieno")
  ) {
    return "ALIEN_CODE";
  }


  if (normalized.includes("hermeticum") || normalized.includes("hbce")) {
    return "HBCE_OPERATIONAL_DOCUMENT";
  }


  return null;
}


function inferDocumentVolume(file: StoredRuntimeFile): string | null {
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (canonicalCorpusProfile) {
    return canonicalCorpusProfile.volume;
  }


  const raw = `${file.name}\n${file.text.slice(0, 16000)}`;
  const normalized = normalizeSearchText(raw);
  const directMatch = raw.match(/\bVolume\s+(I{1,3}|IV|V|VI{0,3}|IX|X|1|2|3|4|5|6|7|8|9|10)\b/i);


  if (directMatch?.[1]) {
    const token = directMatch[1].toUpperCase();
    const romanMap: Record<string, string> = {
      I: "V1",
      II: "V2",
      III: "V3",
      IV: "V4",
      V: "V5",
      VI: "V6",
      VII: "V7",
      VIII: "V8",
      IX: "V9",
      X: "V10"
    };


    return romanMap[token] || `V${token}`;
  }


  if (normalized.includes("2b 2b matrix") || normalized.includes("matrix 05 04 2026")) {
    return "V2";
  }


  if (normalized.includes("1a 1a corpus") || includesAll(normalized, ["corpus", "volume", "i"])) {
    return "V1";
  }


  const filenameVolume = file.name.match(/(?:^|[_\-\s])(?:vol(?:ume)?[_\-\s]*)?(\d{1,2}|I{1,3}|IV|V)(?:[_\-\s]|\.)/i);


  if (filenameVolume?.[1]) {
    const token = filenameVolume[1].toUpperCase();
    const romanMap: Record<string, string> = {
      I: "V1",
      II: "V2",
      III: "V3",
      IV: "V4",
      V: "V5"
    };


    return romanMap[token] || `V${token}`;
  }


  return null;
}


function inferDocumentTitle(file: StoredRuntimeFile): string | null {
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (canonicalCorpusProfile) {
    return canonicalCorpusProfile.title;
  }


  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 12000)}`);
  const lines = extractFirstNonEmptyLines(file.text, 10);


  if (normalized.includes("matrix 05 04 2026") || includesAll(normalized, ["matrix", "05", "04", "2026"])) {
    return "MATRIX / 05-04-2026";
  }


  if (normalized.includes("corpus esoterologia ermetica") && normalized.includes("esoterologia")) {
    return "ESOTEROLOGIA";
  }


  if (normalized.includes("apokalypsis")) {
    const volume = inferDocumentVolume(file);


    return volume ? `APOKALYPSIS ${volume}` : "APOKALYPSIS";
  }


  if (normalized.includes("u s e") || normalized.includes("united states of europe")) {
    const volume = inferDocumentVolume(file);


    return volume ? `U.S.E. ${volume}` : "U.S.E.";
  }


  const titleLine = lines.find((line) => {
    const normalizedLine = normalizeSearchText(line);


    return normalizedLine.length >= 4 && normalizedLine.length <= 120;
  });


  return titleLine || file.name;
}


function inferCanonicalAxis(file: StoredRuntimeFile): string | null {
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 20000)}`);


  if (includesAll(normalized, ["decisione", "costo", "traccia", "tempo"])) {
    return CANONICAL_AXIS_DCTT;
  }


  if (normalized.includes("ipr") && normalized.includes("evt") && normalized.includes("opc")) {
    return "IPR · EVT · OPC";
  }


  return null;
}


function collectDocumentKeyTerms(file: StoredRuntimeFile): string[] {
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (canonicalCorpusProfile) {
    return Array.from(new Set(canonicalCorpusProfile.keyTerms)).slice(0, 32);
  }


  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 30000)}`);
  const terms = DOCUMENT_KEY_TERM_CANDIDATES.filter((term) => {
    return normalized.includes(normalizeSearchText(term));
  });


  if (inferDocumentFamily(file) === "CORPUS_ESOTEROLOGIA_ERMETICA") {
    for (const term of ["Decisione", "Costo", "Traccia", "Tempo"]) {
      if (!terms.includes(term)) {
        terms.push(term);
      }
    }
  }


  return Array.from(new Set(terms)).slice(0, 32);
}


function buildDocumentSummary(file: StoredRuntimeFile): string {
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);
  const family = inferDocumentFamily(file);
  const volume = inferDocumentVolume(file);
  const title = inferDocumentTitle(file);
  const keyTerms = collectDocumentKeyTerms(file).slice(0, 10);


  if (!isPromptTextStatus(file.status)) {
    return `Documento registrato come ${file.status}. Il file resta tracciabile per hash e metadati, ma non contiene testo pronto per il prompt.`;
  }


  if (canonicalCorpusProfile) {
    return canonicalCorpusProfile.summary;
  }


  if (title === "MATRIX / 05-04-2026") {
    return "Profilo documento MATRIX / 05-04-2026: Volume II del CORPUS ESOTEROLOGIA ERMETICA. Trasferisce la griglia Decisione · Costo · Traccia · Tempo nel dominio istituzionale, leggendo istituzioni, Stato, esecuzione, fiscalità, debito, sicurezza, forza, conflitto, decadimento e ordine globale come sequenze operative distribuite.";
  }


  if (family === "CORPUS_ESOTEROLOGIA_ERMETICA" && volume === "V1") {
    return "Profilo documento CORPUS ESOTEROLOGIA ERMETICA Volume I: fonda il criterio del Reale operativo e l'asse Decisione · Costo · Traccia · Tempo come grammatica di verificazione della realtà operativa.";
  }


  const extracted = extractFirstNonEmptyLines(file.text, 4).join(" ").slice(0, 700);


  return [
    `Profilo documento${title ? ` ${title}` : ""}${volume ? ` ${volume}` : ""}.`,
    family ? `Famiglia: ${family}.` : "Famiglia: non classificata automaticamente.",
    keyTerms.length ? `Termini: ${keyTerms.join(", ")}.` : "Termini: non determinati automaticamente.",
    extracted ? `Estratto operativo: ${extracted}` : ""
  ].filter(Boolean).join(" ").slice(0, 1200);
}


function buildDocumentProfileInput(
  file: StoredRuntimeFile,
  context: DocumentProfileContext
): DocumentProfileDatabaseInput {
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);
  const docFamily = inferDocumentFamily(file);
  const volume = inferDocumentVolume(file);
  const title = inferDocumentTitle(file);
  const canonicalAxis = inferCanonicalAxis(file);
  const keyTerms = collectDocumentKeyTerms(file);
  const reusableInPrompt = isPromptTextStatus(file.status);


  return {
    fileId: file.id,
    filename: file.name,
    fileHash: file.fileHash,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    humanIpr: context.humanIpr,
    runtimeIpr: context.runtimeIpr,
    sessionId: context.sessionId,
    threadId: context.threadId ?? context.sessionId,
    sourceKind: context.sourceKind,
    textStatus: file.status,
    textLength: file.textLength,
    mimeType: file.mimeType,
    docFamily,
    volume,
    title,
    subtitle: null,
    canonicalAxis,
    summary: buildDocumentSummary(file),
    keyTerms,
    semanticTerms: keyTerms.map((term) => ({ term, source: "AUTO_PROFILE" })),
    documentMetadata: {
      routeVersion: FILE_ROUTE_REVISION,
      canonicalProfileRevision: DOCUMENT_PROFILE_CANONICAL_FIX_REVISION,
      canonicalProfileApplied: Boolean(canonicalCorpusProfile),
      canonicalDocumentKind: canonicalCorpusProfile?.canonicalDocumentKind ?? null,
      canonicalVolume: canonicalCorpusProfile?.volume ?? null,
      canonicalTitle: canonicalCorpusProfile?.title ?? null,
      glossaryGuardApplied: canonicalCorpusProfile?.canonicalDocumentKind === "CANONICAL_GLOSSARY",
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      mimeType: file.mimeType,
      type: file.type,
      size: file.size,
      role: file.role,
      status: file.status,
      mode: file.mode,
      reason: file.reason,
      textLength: file.textLength,
      textStoredInProfile: false,
      sourceKind: context.sourceKind,
      legalCertification: false,
      opc: "technical proof receipt only"
    },
    profileStatus: "ACTIVE",
    quality: reusableInPrompt ? "CANONICAL" : "METADATA_ONLY",
    reusableInPrompt,
    lastSeenAt: nowIso(),
    createdAt: file.createdAt,
    deletedAt: null
  };
}


async function persistDocumentProfilesForSession(
  files: StoredRuntimeFile[],
  context: DocumentProfileContext
): Promise<DocumentProfilePersistenceResult[]> {
  if (files.length === 0) {
    return [];
  }


  const readiness = await ensureHbceDatabaseReady();


  if (!readiness.ok) {
    return files.map((file) => {
      const input = buildDocumentProfileInput(file, context);


      return {
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: false,
        status: "DATABASE_NOT_READY",
        rowCount: 0,
        error: readiness.initialization.error || readiness.description.status,
        sqlHash: readiness.initialization.sqlHash,
        durationMs: readiness.initialization.durationMs,
        profile: null,
        input: {
          docFamily: input.docFamily ?? null,
          volume: input.volume ?? null,
          title: input.title ?? null,
          canonicalAxis: input.canonicalAxis ?? null,
          keyTerms: input.keyTerms ?? [],
          reusableInPrompt: input.reusableInPrompt !== false
        }
      };
    });
  }


  const results: DocumentProfilePersistenceResult[] = [];


  for (const file of files) {
    const input = buildDocumentProfileInput(file, context);


    try {
      const result = await upsertDocumentProfileToDatabase(input);
      const row = result.rows[0];
      const publicProfile = row ? toPublicDocumentProfile(row) : null;


      results.push({
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: result.ok && result.rowCount > 0,
        status: result.ok && result.rowCount > 0 ? "PERSISTED" : "PERSISTENCE_FAILED",
        rowCount: result.rowCount,
        error: result.error,
        sqlHash: result.sqlHash,
        durationMs: result.durationMs,
        profile: publicProfile,
        input: {
          docFamily: input.docFamily ?? null,
          volume: input.volume ?? null,
          title: input.title ?? null,
          canonicalAxis: input.canonicalAxis ?? null,
          keyTerms: input.keyTerms ?? [],
          reusableInPrompt: input.reusableInPrompt !== false
        }
      });
    } catch (error) {
      results.push({
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: false,
        status: "PERSISTENCE_FAILED",
        rowCount: 0,
        error: error instanceof Error ? error.message : "UNKNOWN_DOCUMENT_PROFILE_ERROR",
        sqlHash: null,
        durationMs: 0,
        profile: null,
        input: {
          docFamily: input.docFamily ?? null,
          volume: input.volume ?? null,
          title: input.title ?? null,
          canonicalAxis: input.canonicalAxis ?? null,
          keyTerms: input.keyTerms ?? [],
          reusableInPrompt: input.reusableInPrompt !== false
        }
      });
    }
  }


  return results;
}


function attachDocumentProfileResults(
  files: StoredRuntimeFile[],
  profileResults: DocumentProfilePersistenceResult[]
): StoredRuntimeFile[] {
  const byFileId = new Map(profileResults.map((result) => [result.fileId, result]));


  return files.map((file) => {
    const result = byFileId.get(file.id);


    if (!result) {
      return {
        ...file,
        documentProfileStatus: "SKIPPED",
        documentProfileReason: "No document profile persistence result was produced for this file."
      };
    }


    return {
      ...file,
      documentProfileId:
        typeof result.profile?.profileId === "string" ? result.profile.profileId : null,
      documentProfileStatus: result.status,
      documentProfileHash:
        typeof result.profile?.profileHash === "string" ? result.profile.profileHash : null,
      documentProfileReason: result.ok
        ? "Document profile persisted in the cybernetic document registry."
        : result.error || "Document profile persistence did not complete."
    };
  });
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
    documentProfileId: file.documentProfileId ?? null,
    documentProfileStatus: file.documentProfileStatus ?? null,
    documentProfileHash: file.documentProfileHash ?? null,
    documentProfileReason: file.documentProfileReason ?? null,
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
    routeVersion: FILE_ROUTE_REVISION,
    documentRegistry: "DOCUMENT_PROFILES",
    cyberneticMethod: "FILE_UPLOAD_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
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
      endpoint: "HBCE_FILES_INGESTION",
      routeVersion: FILE_ROUTE_REVISION,
      sessionId,
      cleared: true,
      documentRegistryPreserved: true,
      reason:
        "Session file cache cleared. Persisted document profiles are preserved as audit-ready cybernetic registry entries.",
      summary: buildSessionSummary(sessionId, []),
      legalCertification: false,
      opc: "technical proof receipt only"
    });
  }


  const incomingFiles = normalizeFiles(body.files);
  const existingFiles = body.replace ? [] : store.get(sessionId) || [];
  const mergedFiles = mergeFiles(existingFiles, incomingFiles);
  const context = buildDocumentProfileContext(body, sessionId);
  const documentProfiles = await persistDocumentProfilesForSession(mergedFiles, context);
  const nextFiles = attachDocumentProfileResults(mergedFiles, documentProfiles);


  store.set(sessionId, nextFiles);


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    replaced: Boolean(body.replace),
    cyberneticMethod: "FILE_UPLOAD_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
    documentRegistry: {
      table: "document_profiles",
      attempted: documentProfiles.length > 0,
      persistedCount: documentProfiles.filter((profile) => profile.ok).length,
      failedCount: documentProfiles.filter((profile) => !profile.ok).length,
      profileStatuses: documentProfiles.map((profile) => ({
        fileId: profile.fileId,
        filename: profile.filename,
        ok: profile.ok,
        status: profile.status,
        profileId:
          typeof profile.profile?.profileId === "string" ? profile.profile.profileId : null,
        docFamily: profile.input.docFamily,
        volume: profile.input.volume,
        title: profile.input.title,
        canonicalAxis: profile.input.canonicalAxis,
        reusableInPrompt: profile.input.reusableInPrompt,
        error: profile.error
      }))
    },
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false),
    documentProfiles,
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const store = getFileStore();


  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
  const includeText = url.searchParams.get("includeText") !== "false";
  const includeProfiles = url.searchParams.get("includeProfiles") !== "false";
  const humanIpr = url.searchParams.get("humanIpr") || HBCE_SELF_PILOT_HUMAN_IPR;
  const tenantId = url.searchParams.get("tenantId") || HBCE_SELF_PILOT_TENANT_ID;
  const workspaceId = url.searchParams.get("workspaceId") || HBCE_SELF_PILOT_WORKSPACE_ID;


  const files = store.get(sessionId) || [];
  const documentProfiles = includeProfiles
    ? await listDocumentProfilesFromDatabase({
        humanIpr,
        tenantId,
        workspaceId,
        includeSoftDeleted: false,
        limit: 50
      }).then((result) => ({
        ok: result.ok,
        status: result.status,
        rowCount: result.rowCount,
        error: result.error,
        sqlHash: result.sqlHash,
        durationMs: result.durationMs,
        profiles: result.rows.map(toPublicDocumentProfile)
      })).catch((error) => ({
        ok: false,
        status: "QUERY_FAILED",
        rowCount: 0,
        error: error instanceof Error ? error.message : "DOCUMENT_PROFILE_QUERY_FAILED",
        sqlHash: null,
        durationMs: 0,
        profiles: []
      }))
    : null;


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    summary: buildSessionSummary(sessionId, files),
    files: summarizeFiles(files, includeText),
    documentProfiles,
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
      endpoint: "HBCE_FILES_INGESTION",
      routeVersion: FILE_ROUTE_REVISION,
      sessionId,
      deleted: "SESSION_FILES",
      documentRegistryPreserved: true,
      reason:
        "Session file cache deleted. Persisted document profiles are preserved for IPR/EVT/OPC continuity.",
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
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    deleted: fileId,
    documentRegistryPreserved: true,
    reason:
      "Runtime file removed from the active session cache. Persisted document profile remains available for dynamic recall and audit continuity.",
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false),
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}
