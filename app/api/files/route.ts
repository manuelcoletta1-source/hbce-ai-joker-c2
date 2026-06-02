import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";

import {
  ensureHbceDatabaseReady,
  listDocumentProfilesFromDatabase,
  queryHbceDatabase,
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


const FILE_ROUTE_REVISION = "HBCE-API-FILES-DOCUMENT-PROFILE-REGISTRY-v2-DOCUMENT_PROFILE_CANONICAL_FIX-v3-ALIEN_CODE_V4_PROFILE_FIX-v4-PORTALE_V5_EMPTY_RESPONSE_GUARD-v5_1-LONG_DOCUMENT_FULL_INGESTION_ENGINE-v6_0-LONG_DOCUMENT_PERSISTENT_CHUNKS-v6_1-SELF_DIAGNOSTIC_ENDPOINT-v6_2-LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_2";
const DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION = "LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_2";
const DOCUMENT_CHUNK_PERSISTENCE_SCOPE = "HUMAN_IPR_TENANT_WORKSPACE_FILE_HASH_CHUNK";
const DOCUMENT_CHUNK_DEPLOY_PROOF_REVISION = "FILES_ROUTE_DEPLOY_PROOF_AND_CHUNK_DB_DIAGNOSTIC-v6_3_2";


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


type TextSourceKind =
  | "TEXT"
  | "CONTENT"
  | "PREVIEW"
  | "PDF_DIRECT_TEXT"
  | "PDF_BINARY"
  | "PDF_BASE64"
  | "PDF_DATA_URL"
  | "NONE";


type TextCoverageStatus =
  | "TEXT_READY_FULL"
  | "TEXT_READY_PARTIAL"
  | "TEXT_PREVIEW_ONLY"
  | "TEXT_EMPTY"
  | "TEXT_UNSUPPORTED";


type LongDocumentMode =
  | "INLINE_TEXT"
  | "CHUNKED_FULL_TEXT"
  | "PREVIEW_ONLY"
  | "REFERENCE_ONLY"
  | "REJECTED";


type DocumentOutlineEntry = {
  index: number;
  sectionType: "TITLE" | "PART" | "CHAPTER" | "MAJOR_SECTION" | "SUBSECTION" | "APPENDIX" | "GLOSSARY_ENTRY" | "CONCLUSION" | "BOUNDARY" | "SECTION";
  label: string;
  lineNumber: number;
  charStart: number;
  headingPath: string;
};


type DocumentOutlineSummary = {
  outlineStatus: "READY" | "EMPTY";
  partsDetected: number;
  chaptersDetected: number;
  appendicesDetected: number;
  firstSectionDetected: string | null;
  lastSectionDetected: string | null;
  lastAppendixDetected: string | null;
  boundaryDetected: boolean;
  conclusionDetected: boolean;
  entries: DocumentOutlineEntry[];
};


type LongDocumentChunk = {
  id: string;
  documentProfileId: string | null;
  fileId: string;
  filename: string;
  fileHash: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  text: string;
  textHash: string;
  headingPath: string | null;
  sectionType: string | null;
  createdAt: string;
};


type DocumentChunkPersistenceStatus =
  | "PERSISTED"
  | "DATABASE_NOT_READY"
  | "PERSISTENCE_FAILED"
  | "SKIPPED";


type DocumentChunkPersistenceResult = {
  attempted: boolean;
  ok: boolean;
  status: DocumentChunkPersistenceStatus;
  table: "document_text_chunks";
  documentProfileId: string | null;
  fileId: string;
  filename: string;
  fileHash: string;
  chunkCount: number;
  persistedCount: number;
  insertedCount: number;
  databaseVerified: boolean;
  verificationCount: number;
  persistenceRevision: string;
  persistenceScope: string;
  derivedFromHumanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  fullDocumentCoverage: boolean;
  textCoverageStatus: TextCoverageStatus;
  error: string | null;
  sqlHash: string | null;
  verificationSqlHash: string | null;
  durationMs: number;
};


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
  fullTextLength: number;
  promptTextLength: number;
  sourceFileHash: string;
  normalizedTextHash: string;
  runtimePromptTextHash: string;
  sourceByteLength: number;
  normalizedTextLength: number;
  textSourceKind: TextSourceKind;
  textCoverageStatus: TextCoverageStatus;
  fullDocumentCoverage: boolean;
  fullDocumentCoverageReason: string;
  longDocumentMode: LongDocumentMode;
  documentOutline: DocumentOutlineSummary;
  documentChunkCount: number;
  documentChunks: LongDocumentChunk[];
  documentChunksPersisted?: boolean | null;
  documentChunksPersistedCount?: number | null;
  documentChunkPersistenceStatus?: DocumentChunkPersistenceStatus | null;
  documentChunkPersistenceReason?: string | null;
  documentChunkPersistenceError?: string | null;
  documentChunkPersistenceRevision?: string | null;
  documentChunkPersistenceScope?: string | null;
  documentChunkDerivedFromHumanIpr?: string | null;
  documentChunkDatabaseVerified?: boolean | null;
  documentChunkVerificationCount?: number | null;
  documentChunkVerificationSqlHash?: string | null;
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
  chunks: DocumentChunkPersistenceResult | null;
  input: {
    docFamily: string | null;
    volume: string | null;
    title: string | null;
    canonicalAxis: string | null;
    keyTerms: string[];
    reusableInPrompt: boolean;
    textCoverageStatus: TextCoverageStatus;
    fullDocumentCoverage: boolean;
    chunkCount: number;
    outlineStatus: DocumentOutlineSummary["outlineStatus"];
    partsDetected: number;
    chaptersDetected: number;
    appendicesDetected: number;
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
  volume: "V1" | "V2" | "V3" | "V4" | "V5";
  title: string;
  summary: string;
  keyTerms: string[];
};

const DOCUMENT_PROFILE_CANONICAL_FIX_REVISION = "DOCUMENT_PROFILE_PORTALE_V5_EMPTY_RESPONSE_GUARD_v5_1";

const CANONICAL_CORPUS_VOLUME_PROFILES: Record<CanonicalCorpusVolumeProfile["volume"], CanonicalCorpusVolumeProfile> = {
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
    title: "ALIEN CODE",
    summary:
      "Profilo documento ALIEN CODE Volume IV del CORPUS ESOTEROLOGIA ERMETICA: formalizza il framework operativo per la tracciabilità rascensionale, l'interfaccia rascensionale e l'accoppiamento organismo-sistema attraverso Decisione · Costo · Traccia · Tempo.",
    keyTerms: [
      "Alien Code",
      "Codice alieno",
      "Volume IV",
      "Framework operativo per la tracciabilità rascensionale",
      "Tracciabilità rascensionale",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Interfaccia rascensionale",
      "Unità qubitronica",
      "Riconconicità organismo-sistema",
      "Accoppiamento organismo-sistema",
      "Accoppiamento forzato",
      "Fallimento del coupling",
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
type DocumentChunkStore = Map<string, LongDocumentChunk[]>;


type PdfExtractionResult = {
  text: string;
  source: "DIRECT_TEXT" | "PDF_BINARY" | "PDF_BASE64" | "PDF_DATA_URL" | "NONE";
  hadPdfPayload: boolean;
  failed: boolean;
  reason: string;
};


declare global {
  var __HBCE_JOKER_C2_FILE_STORE__: FileStore | undefined;
  var __HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__: DocumentChunkStore | undefined;
}


const MAX_FILES_PER_SESSION = 12;
const MAX_TEXT_CHARS_PER_FILE = 20_000_000;
const MAX_TOTAL_TEXT_CHARS_PER_SESSION = 20_000_000;
const MAX_FILE_NAME_LENGTH = 180;
const LONG_DOCUMENT_CHUNK_TARGET_CHARS = 24_000;
const LONG_DOCUMENT_CHUNK_OVERLAP_CHARS = 600;
const LONG_DOCUMENT_CHUNK_INSERT_BATCH_SIZE = 16;
const FULL_DOCUMENT_OUTLINE_MAX_ENTRIES = 256;


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
  "Il Portale dell’Anticristo",
  "Apocalisse",
  "Anticristo",
  "Portale",
  "Regime di esposizione",
  "Soglia operativa",
  "Apostasia globale",
  "1110 giorni",
  "Irreintegrabilità",
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


function getDocumentChunkStore(): DocumentChunkStore {
  if (!globalThis.__HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__) {
    globalThis.__HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__ = new Map();
  }


  return globalThis.__HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__;
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
    .replace(/\r/g, "\n");
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


function extractDirectTextWithSource(file: RuntimeFile): { text: string; source: TextSourceKind } {
  if (typeof file.text === "string") {
    return { text: file.text, source: "TEXT" };
  }


  if (typeof file.content === "string") {
    return { text: file.content, source: "CONTENT" };
  }


  if (typeof file.preview === "string") {
    return { text: file.preview, source: "PREVIEW" };
  }


  return { text: "", source: "NONE" };
}


function extractDirectText(file: RuntimeFile): string {
  return extractDirectTextWithSource(file).text;
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




function normalizeHeadingLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}


function normalizeOutlineSearchText(value: string): string {
  return normalizeSearchText(value);
}


function findCorpusBodyStartLine(lines: string[]): number {
  const premessaIndex = lines.findIndex((line) => /^\s*PREMESSA\s*$/i.test(line));
  const searchStart = premessaIndex >= 0 ? premessaIndex + 1 : 0;
  const firstBodyMajor = lines.findIndex((line, index) =>
    index >= searchStart && /^\s*0\.\s+ATTO DI APERTURA\s*$/i.test(line)
  );


  if (firstBodyMajor >= 0) {
    return firstBodyMajor;
  }


  return premessaIndex >= 0 ? premessaIndex : 0;
}


function isInsideGlossaryTable(lines: string[], index: number): boolean {
  for (let cursor = index; cursor >= Math.max(0, index - 40); cursor -= 1) {
    const line = normalizeHeadingLabel(lines[cursor] ?? "");


    if (/^GLOSSARIO CANONICO DEL CORPUS$/i.test(line) || /^N\.\s*\|\s*A\s*\|\s*B\s*\|/i.test(line)) {
      return true;
    }


    if (/^15\.2\s+Protocollo di citazione interna del glossario/i.test(line)) {
      return false;
    }
  }


  return false;
}


function classifyOutlineLine(line: string, lines: string[] = [], index = 0): DocumentOutlineEntry["sectionType"] | null {
  const normalized = normalizeHeadingLabel(line);


  if (!normalized) {
    return null;
  }


  if (/^boundary operativo$/i.test(normalized)) {
    return "BOUNDARY";
  }


  if (/^parte\s+[ivxlcdm]+\b/i.test(normalized)) {
    return "PART";
  }


  if (/^\d{1,2}\.\s+[A-ZÀ-Ú][A-ZÀ-Ú0-9\s·,–—\-’']+$/u.test(normalized)) {
    return "MAJOR_SECTION";
  }


  if (/^\d{1,2}\.\d+\s+/.test(normalized)) {
    if (isInsideGlossaryTable(lines, index)) {
      return "GLOSSARY_ENTRY";
    }


    return normalized.startsWith("15.") ? "APPENDIX" : "SUBSECTION";
  }


  if (/^(\d+\.\s*)?capitolo\s+[ivxlcdm]+\b/i.test(normalized) || /^\d+\.\s*capitolo\s+/i.test(normalized)) {
    return "CHAPTER";
  }


  if (/^a\.\d+\b/i.test(normalized)) {
    return "APPENDIX";
  }


  if (/^conclusione\b/i.test(normalized)) {
    return "CONCLUSION";
  }


  if (/^hbce ecosistema ai$/i.test(normalized)) {
    return "TITLE";
  }


  return null;
}


function extractDocumentOutline(text: string): DocumentOutlineSummary {
  const entries: DocumentOutlineEntry[] = [];
  const allLines = text.split("\n");
  const bodyStartLine = findCorpusBodyStartLine(allLines);
  const bodyStartChar = allLines.slice(0, bodyStartLine).reduce((sum, line) => sum + line.length + 1, 0);
  const lines = allLines.slice(bodyStartLine);
  let charCursor = bodyStartChar;
  let currentPart: string | null = null;
  let currentChapter: string | null = null;


  for (let localIndex = 0; localIndex < lines.length; localIndex += 1) {
    const rawLine = lines[localIndex] ?? "";
    const label = normalizeHeadingLabel(rawLine);
    const absoluteLineIndex = bodyStartLine + localIndex;
    const sectionType = classifyOutlineLine(label, allLines, absoluteLineIndex);


    if (sectionType && sectionType !== "GLOSSARY_ENTRY" && entries.length < FULL_DOCUMENT_OUTLINE_MAX_ENTRIES) {
      if (sectionType === "PART" || sectionType === "MAJOR_SECTION") {
        currentPart = label;
        currentChapter = null;
      }


      if (sectionType === "CHAPTER" || sectionType === "SUBSECTION") {
        currentChapter = label;
      }


      const headingPath = [currentPart, currentChapter, sectionType === "APPENDIX" ? label : null]
        .filter(Boolean)
        .join(" / ") || label;


      entries.push({
        index: entries.length,
        sectionType,
        label,
        lineNumber: absoluteLineIndex + 1,
        charStart: charCursor,
        headingPath
      });
    }


    charCursor += rawLine.length + 1;
  }


  const majorSections = entries.filter((entry) => entry.sectionType === "MAJOR_SECTION");
  const partSections = entries.filter((entry) => entry.sectionType === "PART");
  const subsections = entries.filter((entry) => entry.sectionType === "SUBSECTION" || entry.sectionType === "CHAPTER");
  const appendices = entries.filter((entry) => entry.sectionType === "APPENDIX");
  const boundaryDetected = entries.some((entry) => entry.sectionType === "BOUNDARY");
  const conclusionDetected = entries.some((entry) => entry.sectionType === "CONCLUSION") || /Formula canonica finale/i.test(text);
  const mainSectionEntries = majorSections.length > 0 ? majorSections : partSections;
  const lastMainSection = mainSectionEntries[mainSectionEntries.length - 1] ?? entries[entries.length - 1] ?? null;


  return {
    outlineStatus: entries.length > 0 ? "READY" : "EMPTY",
    partsDetected: majorSections.length > 0 ? majorSections.length : partSections.length,
    chaptersDetected: subsections.length + appendices.length,
    appendicesDetected: appendices.length,
    firstSectionDetected: mainSectionEntries[0]?.label ?? entries[0]?.label ?? null,
    lastSectionDetected: lastMainSection?.label ?? null,
    lastAppendixDetected: appendices[appendices.length - 1]?.label ?? null,
    boundaryDetected,
    conclusionDetected,
    entries
  };
}


function findHeadingForChunk(outline: DocumentOutlineSummary, charStart: number): { headingPath: string | null; sectionType: string | null } {
  let selected: DocumentOutlineEntry | null = null;


  for (const entry of outline.entries) {
    if (entry.charStart <= charStart) {
      selected = entry;
      continue;
    }


    break;
  }


  return {
    headingPath: selected?.headingPath ?? selected?.label ?? null,
    sectionType: selected?.sectionType ?? null
  };
}


function buildLongDocumentChunks(file: Pick<StoredRuntimeFile, "id" | "name" | "fileHash" | "text" | "documentOutline">): LongDocumentChunk[] {
  const text = file.text;


  if (!text.trim()) {
    return [];
  }


  const chunks: LongDocumentChunk[] = [];
  let charStart = 0;
  const createdAt = nowIso();


  while (charStart < text.length) {
    let charEnd = Math.min(text.length, charStart + LONG_DOCUMENT_CHUNK_TARGET_CHARS);


    if (charEnd < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", charEnd);
      const lineBreak = text.lastIndexOf("\n", charEnd);
      const breakPoint = paragraphBreak > charStart + 8000 ? paragraphBreak : lineBreak > charStart + 8000 ? lineBreak : -1;


      if (breakPoint > charStart) {
        charEnd = breakPoint;
      }
    }


    const chunkText = text.slice(charStart, charEnd).trim();


    if (chunkText) {
      const heading = findHeadingForChunk(file.documentOutline, charStart);
      const textHash = buildHash(chunkText);
      const id = buildHash({
        fileId: file.id,
        fileHash: file.fileHash,
        chunkIndex: chunks.length,
        charStart,
        charEnd,
        textHash
      }).replace("sha256:", "docchunk-").slice(0, 48);


      chunks.push({
        id,
        documentProfileId: null,
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        chunkIndex: chunks.length,
        charStart,
        charEnd,
        text: chunkText,
        textHash,
        headingPath: heading.headingPath,
        sectionType: heading.sectionType,
        createdAt
      });
    }


    if (charEnd >= text.length) {
      break;
    }


    charStart = Math.max(charEnd - LONG_DOCUMENT_CHUNK_OVERLAP_CHARS, charStart + 1);
  }


  return chunks;
}


function classifyTextCoverage(source: TextSourceKind, textLength: number): {
  textCoverageStatus: TextCoverageStatus;
  fullDocumentCoverage: boolean;
  fullDocumentCoverageReason: string;
  longDocumentMode: LongDocumentMode;
} {
  if (textLength <= 0) {
    return {
      textCoverageStatus: "TEXT_EMPTY",
      fullDocumentCoverage: false,
      fullDocumentCoverageReason: "No readable text was extracted from the file payload.",
      longDocumentMode: "REFERENCE_ONLY"
    };
  }


  if (source === "PREVIEW") {
    return {
      textCoverageStatus: "TEXT_PREVIEW_ONLY",
      fullDocumentCoverage: false,
      fullDocumentCoverageReason: "Only file.preview was provided by the client; full document coverage cannot be claimed from preview text.",
      longDocumentMode: "PREVIEW_ONLY"
    };
  }


  return {
    textCoverageStatus: "TEXT_READY_FULL",
    fullDocumentCoverage: true,
    fullDocumentCoverageReason: "Full text payload was available to /api/files and no per-file text cap was applied.",
    longDocumentMode: textLength > LONG_DOCUMENT_CHUNK_TARGET_CHARS ? "CHUNKED_FULL_TEXT" : "INLINE_TEXT"
  };
}


function buildStoredRuntimeFileBase(args: {
  id: string;
  name: string;
  mimeType: string;
  declaredSize: number;
  text: string;
  role: string;
  status: FileStatus;
  mode: FileMode;
  reason: string;
  textSourceKind: TextSourceKind;
  timestamp: string;
}): StoredRuntimeFile {
  const coverage = classifyTextCoverage(args.textSourceKind, args.text.length);
  const documentOutline = extractDocumentOutline(args.text);
  const sourceFileHash = buildHash(args.text || {
    name: args.name,
    mimeType: args.mimeType,
    size: args.declaredSize,
    status: args.status
  });
  const normalizedTextHash = buildHash(args.text);
  const runtimePromptTextHash = buildHash(args.text);
  const provisionalFile: Pick<StoredRuntimeFile, "id" | "name" | "fileHash" | "text" | "documentOutline"> = {
    id: args.id,
    name: args.name,
    fileHash: sourceFileHash,
    text: args.text,
    documentOutline
  };
  const documentChunks = isPromptTextStatus(args.status) ? buildLongDocumentChunks(provisionalFile) : [];


  return {
    id: args.id,
    name: args.name,
    mimeType: args.mimeType,
    type: args.mimeType,
    size: args.declaredSize,
    text: args.text,
    content: args.text,
    role: args.role,
    textLength: args.text.length,
    fullTextLength: args.text.length,
    promptTextLength: args.text.length,
    sourceFileHash,
    normalizedTextHash,
    runtimePromptTextHash,
    sourceByteLength: Buffer.byteLength(args.text, "utf8"),
    normalizedTextLength: args.text.length,
    textSourceKind: args.textSourceKind,
    textCoverageStatus: coverage.textCoverageStatus,
    fullDocumentCoverage: coverage.fullDocumentCoverage,
    fullDocumentCoverageReason: coverage.fullDocumentCoverageReason,
    longDocumentMode: coverage.longDocumentMode,
    documentOutline,
    documentChunkCount: documentChunks.length,
    documentChunks,
    fileHash: provisionalFile.fileHash,
    status: args.status,
    mode: args.mode,
    reason: `${args.reason} FullDocumentCoverage=${coverage.fullDocumentCoverage ? "true" : "false"}. TextCoverageStatus=${coverage.textCoverageStatus}. legalCertification=false. OPC=technical proof receipt only.`,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
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



function inferCanonicalCorpusVolumeProfile(file: StoredRuntimeFile): CanonicalCorpusVolumeProfile | null {
  const normalizedName = normalizeSearchText(file.name);
  const normalizedHead = normalizeSearchText(`${file.name}\n${file.text.slice(0, 16000)}`);
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 30000)}`);

  const explicitV5ByFilename =
    normalizedName.includes("5e 5e il portale dell anticristo") ||
    includesAll(normalizedName, ["portale", "anticristo"]);

  const explicitV5ByHeader =
    includesAll(normalizedHead, ["il portale dell anticristo", "volume v"]) ||
    includesAll(normalizedHead, ["il portale dell anticristo", "volume 5"]) ||
    includesAll(normalizedHead, ["apocalisse", "regime di esposizione"]) ||
    includesAll(normalizedHead, ["anticristo", "configurazione di rottura"]) ||
    includesAll(normalizedHead, ["portale", "soglia operativa"]);

  // V5 must be resolved before the V4 semantic guard. Volume V can quote or reuse
  // V4 terms while closing the Corpus sequence, so filename/header identity wins.
  if (
    explicitV5ByFilename ||
    explicitV5ByHeader ||
    normalized.includes("il portale dell anticristo") ||
    includesAll(normalized, ["anticristo", "portale", "apocalisse"]) ||
    includesAll(normalized, ["apostasia globale", "1110 giorni"]) ||
    includesAll(normalized, ["sigillo del volume", "chiusura del portale"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V5;
  }

  const explicitV4ByFilename =
    normalizedName.includes("4d 4d alien code") ||
    includesAll(normalizedName, ["alien code", "tracciabilita rascensionale"]) ||
    includesAll(normalizedName, ["codice alieno", "tracciabilita rascensionale"]);

  const explicitV4ByHeader =
    includesAll(normalizedHead, ["alien code", "volume iv"]) ||
    includesAll(normalizedHead, ["alien code", "volume 4"]) ||
    includesAll(normalizedHead, ["codice alieno", "volume iv"]) ||
    includesAll(normalizedHead, ["framework operativo", "tracciabilita rascensionale"]) ||
    includesAll(normalizedHead, ["alien code", "accoppiamento organismo sistema"]);

  if (
    explicitV4ByFilename ||
    explicitV4ByHeader ||
    normalized.includes("framework operativo per la tracciabilita rascensionale") ||
    includesAll(normalized, ["alien code", "interfaccia rascensionale"]) ||
    includesAll(normalized, ["codice alieno", "interfaccia rascensionale"]) ||
    includesAll(normalized, ["unita qubitronica", "riconconicita"]) ||
    includesAll(normalized, ["accoppiamento organismo sistema", "fallimento del coupling"])
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


function describeDocumentChunkPersistenceReason(chunks: DocumentChunkPersistenceResult | null | undefined): string | null {
  if (!chunks) {
    return null;
  }


  if (!chunks.attempted) {
    return "SKIPPED_NO_PROMPT_TEXT_OR_NO_CHUNKS";
  }


  if (chunks.ok && chunks.databaseVerified && chunks.persistedCount === chunks.chunkCount) {
    return "DATABASE_VERIFIED";
  }


  if (chunks.status === "DATABASE_NOT_READY") {
    return "DATABASE_NOT_READY";
  }


  if (chunks.databaseVerified && chunks.persistedCount !== chunks.chunkCount) {
    return "DATABASE_COUNT_MISMATCH";
  }


  return chunks.error || "DOCUMENT_CHUNK_PERSISTENCE_FAILED";
}


function buildDocumentChunkPersistenceProofMetadata(chunks: DocumentChunkPersistenceResult | null | undefined): Record<string, unknown> {
  return {
    documentChunksPersisted: chunks?.ok ?? false,
    documentChunksPersistedCount: chunks?.persistedCount ?? 0,
    documentChunkPersistenceAttempted: chunks?.attempted ?? false,
    documentChunkPersistenceStatus: chunks?.status ?? null,
    documentChunkPersistenceReason: describeDocumentChunkPersistenceReason(chunks),
    documentChunkPersistenceError: chunks?.error ?? null,
    documentChunkPersistenceRevision: chunks?.persistenceRevision ?? DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
    documentChunkPersistenceScope: chunks?.persistenceScope ?? DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
    documentChunkDatabaseVerified: chunks?.databaseVerified ?? false,
    documentChunkVerificationCount: chunks?.verificationCount ?? 0,
    documentChunkVerificationSqlHash: chunks?.verificationSqlHash ?? null,
    documentChunkInsertedCount: chunks?.insertedCount ?? 0,
    documentChunkExpectedCount: chunks?.chunkCount ?? 0,
    documentChunkDerivedFromHumanIpr: chunks?.derivedFromHumanIpr ?? null,
    derivedFromHumanIpr: chunks?.derivedFromHumanIpr ?? null,
    tenantId: chunks?.tenantId ?? null,
    workspaceId: chunks?.workspaceId ?? null,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


function applyDocumentChunkPersistenceProofToInput(
  input: DocumentProfileDatabaseInput,
  chunks: DocumentChunkPersistenceResult | null
): DocumentProfileDatabaseInput {
  const existingMetadata =
    input.documentMetadata && typeof input.documentMetadata === "object"
      ? input.documentMetadata as Record<string, unknown>
      : {};


  return {
    ...input,
    documentMetadata: {
      ...existingMetadata,
      ...buildDocumentChunkPersistenceProofMetadata(chunks),
      routeVersion: FILE_ROUTE_REVISION,
      postUploadChunkProofRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION
    }
  };
}


function withDocumentChunkPersistenceProof<T extends Record<string, unknown> | null>(
  profile: T,
  chunks: DocumentChunkPersistenceResult | null
): T {
  if (!profile) {
    return profile;
  }


  const existingMetadata =
    profile.documentMetadata && typeof profile.documentMetadata === "object"
      ? profile.documentMetadata as Record<string, unknown>
      : {};


  return {
    ...profile,
    documentMetadata: {
      ...existingMetadata,
      ...buildDocumentChunkPersistenceProofMetadata(chunks),
      routeVersion: FILE_ROUTE_REVISION,
      postUploadChunkProofRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION
    }
  } as T;
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
      canonicalVolume: canonicalCorpusProfile?.volume ?? null,
      canonicalTitle: canonicalCorpusProfile?.title ?? null,
      canonicalDocumentKind: canonicalCorpusProfile ? "CANONICAL_CORPUS_VOLUME" : null,
      alienCodeV4GuardApplied: canonicalCorpusProfile?.volume === "V4",
      portaleV5GuardApplied: canonicalCorpusProfile?.volume === "V5",
      alienCodeV4ExpectedProfile:
        canonicalCorpusProfile?.volume === "V4"
          ? {
              title: CANONICAL_CORPUS_VOLUME_PROFILES.V4.title,
              volume: CANONICAL_CORPUS_VOLUME_PROFILES.V4.volume,
              docFamily: "CORPUS_ESOTEROLOGIA_ERMETICA",
              canonicalAxis: CANONICAL_AXIS_DCTT
            }
          : null,
      portaleV5ExpectedProfile:
        canonicalCorpusProfile?.volume === "V5"
          ? {
              title: CANONICAL_CORPUS_VOLUME_PROFILES.V5.title,
              volume: CANONICAL_CORPUS_VOLUME_PROFILES.V5.volume,
              docFamily: "CORPUS_ESOTEROLOGIA_ERMETICA",
              canonicalAxis: CANONICAL_AXIS_DCTT
            }
          : null,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      sourceFileHash: file.sourceFileHash,
      normalizedTextHash: file.normalizedTextHash,
      runtimePromptTextHash: file.runtimePromptTextHash,
      sourceByteLength: file.sourceByteLength,
      normalizedTextLength: file.normalizedTextLength,
      mimeType: file.mimeType,
      type: file.type,
      size: file.size,
      role: file.role,
      status: file.status,
      mode: file.mode,
      reason: file.reason,
      textLength: file.textLength,
      fullTextLength: file.fullTextLength,
      promptTextLength: file.promptTextLength,
      textStoredInProfile: false,
      textSourceKind: file.textSourceKind,
      textCoverageStatus: file.textCoverageStatus,
      fullDocumentCoverage: file.fullDocumentCoverage,
      fullDocumentCoverageReason: file.fullDocumentCoverageReason,
      longDocumentMode: file.longDocumentMode,
      documentChunkCount: file.documentChunkCount,
      documentChunksPersisted: file.documentChunksPersisted ?? null,
      documentChunksPersistedCount: file.documentChunksPersistedCount ?? null,
      documentOutline: {
        outlineStatus: file.documentOutline.outlineStatus,
        partsDetected: file.documentOutline.partsDetected,
        chaptersDetected: file.documentOutline.chaptersDetected,
        appendicesDetected: file.documentOutline.appendicesDetected,
        firstSectionDetected: file.documentOutline.firstSectionDetected,
        lastSectionDetected: file.documentOutline.lastSectionDetected,
        lastAppendixDetected: file.documentOutline.lastAppendixDetected,
        boundaryDetected: file.documentOutline.boundaryDetected,
        conclusionDetected: file.documentOutline.conclusionDetected,
        entries: file.documentOutline.entries
      },
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


function buildDocumentProfilePersistenceInputSummary(input: DocumentProfileDatabaseInput, file: StoredRuntimeFile) {
  return {
    docFamily: input.docFamily ?? null,
    volume: input.volume ?? null,
    title: input.title ?? null,
    canonicalAxis: input.canonicalAxis ?? null,
    keyTerms: input.keyTerms ?? [],
    reusableInPrompt: input.reusableInPrompt !== false,
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    chunkCount: file.documentChunkCount,
    outlineStatus: file.documentOutline.outlineStatus,
    partsDetected: file.documentOutline.partsDetected,
    chaptersDetected: file.documentOutline.chaptersDetected,
    appendicesDetected: file.documentOutline.appendicesDetected
  };
}


function canonicalCorpusProfileFromFilenameForRead(value: unknown): CanonicalCorpusVolumeProfile | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalizedName = normalizeSearchText(value);

  if (
    normalizedName.includes("5e 5e il portale dell anticristo") ||
    includesAll(normalizedName, ["portale", "anticristo"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V5;
  }

  if (
    normalizedName.includes("4d 4d alien code") ||
    includesAll(normalizedName, ["alien code", "tracciabilita rascensionale"]) ||
    includesAll(normalizedName, ["codice alieno", "tracciabilita rascensionale"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V4;
  }

  return null;
}

function canonicalizePublicDocumentProfileForRead<T extends Record<string, unknown>>(profile: T): T {
  const filename = profile.filename ?? profile.fileName;
  const canonicalProfile = canonicalCorpusProfileFromFilenameForRead(filename);

  if (!canonicalProfile) {
    return profile;
  }

  const existingMetadata =
    profile.documentMetadata && typeof profile.documentMetadata === "object"
      ? profile.documentMetadata as Record<string, unknown>
      : {};

  return {
    ...profile,
    docFamily: "CORPUS_ESOTEROLOGIA_ERMETICA",
    volume: canonicalProfile.volume,
    title: canonicalProfile.title,
    canonicalAxis: CANONICAL_AXIS_DCTT,
    summary: canonicalProfile.summary,
    keyTerms: Array.from(new Set(canonicalProfile.keyTerms)).slice(0, 32),
    documentMetadata: {
      ...existingMetadata,
      canonicalProfileRevision: DOCUMENT_PROFILE_CANONICAL_FIX_REVISION,
      canonicalProfileApplied: true,
      canonicalProfileReadGuardApplied: true,
      canonicalVolume: canonicalProfile.volume,
      canonicalTitle: canonicalProfile.title,
      canonicalDocumentKind: "CANONICAL_CORPUS_VOLUME",
      portaleV5GuardApplied: canonicalProfile.volume === "V5",
      alienCodeV4GuardApplied: canonicalProfile.volume === "V4",
      legalCertification: false,
      opc: "technical proof receipt only"
    }
  };
}


type DocumentTextChunkTableStep = {
  name: string;
  ok: boolean;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
};


async function runDocumentTextChunkSchemaStep(name: string, sql: string): Promise<DocumentTextChunkTableStep> {
  const startedAt = Date.now();


  try {
    const result = await queryHbceDatabase(sql);


    return {
      name,
      ok: result.ok,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      name,
      ok: false,
      error: error instanceof Error ? error.message : `${name}_FAILED`,
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


async function ensureDocumentTextChunksTable(): Promise<{ ok: boolean; error: string | null; sqlHash: string | null; durationMs: number }> {
  const startedAt = Date.now();
  const steps: DocumentTextChunkTableStep[] = [];


  const schemaStatements: Array<[string, string]> = [
    [
      "create_table",
      `CREATE TABLE IF NOT EXISTS document_text_chunks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        human_ipr TEXT NOT NULL,
        runtime_ipr TEXT NOT NULL,
        document_profile_id TEXT,
        file_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        char_start INTEGER NOT NULL,
        char_end INTEGER NOT NULL,
        text_hash TEXT NOT NULL,
        heading_path TEXT,
        section_type TEXT,
        text TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    ],
    ["add_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS id TEXT"],
    ["add_tenant_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS tenant_id TEXT"],
    ["add_workspace_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS workspace_id TEXT"],
    ["add_human_ipr", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS human_ipr TEXT"],
    ["add_runtime_ipr", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS runtime_ipr TEXT"],
    ["add_document_profile_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS document_profile_id TEXT"],
    ["add_file_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS file_id TEXT"],
    ["add_filename", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS filename TEXT"],
    ["add_file_hash", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS file_hash TEXT"],
    ["add_chunk_index", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER"],
    ["add_char_start", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS char_start INTEGER"],
    ["add_char_end", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS char_end INTEGER"],
    ["add_text_hash", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS text_hash TEXT"],
    ["add_heading_path", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS heading_path TEXT"],
    ["add_section_type", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS section_type TEXT"],
    ["add_text", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS text TEXT"],
    ["add_metadata", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb"],
    ["add_created_at", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
    ["add_updated_at", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
    [
      "profile_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_profile ON document_text_chunks (tenant_id, workspace_id, document_profile_id, chunk_index)"
    ],
    [
      "file_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_file ON document_text_chunks (tenant_id, workspace_id, file_id, file_hash, chunk_index)"
    ],
    [
      "human_ipr_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_human_ipr ON document_text_chunks (human_ipr, tenant_id, workspace_id, file_id)"
    ],
    [
      "scope_unique_index",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_document_text_chunks_scope_unique ON document_text_chunks (tenant_id, workspace_id, human_ipr, file_id, file_hash, chunk_index, text_hash)"
    ],
    [
      "text_hash_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_text_hash ON document_text_chunks (text_hash)"
    ]
  ];


  for (const [name, sql] of schemaStatements) {
    const step = await runDocumentTextChunkSchemaStep(name, sql);
    steps.push(step);


    if (!step.ok) {
      return {
        ok: false,
        error: `DOCUMENT_TEXT_CHUNKS_SCHEMA_STEP_FAILED:${name}:${step.error || "UNKNOWN_ERROR"}`,
        sqlHash: step.sqlHash,
        durationMs: Date.now() - startedAt
      };
    }
  }


  return {
    ok: true,
    error: null,
    sqlHash: buildHash(steps.map((step) => `${step.name}:${step.sqlHash || "NO_SQL_HASH"}`).join("|")),
    durationMs: Date.now() - startedAt
  };
}


async function countPersistedDocumentChunksForFile(
  file: StoredRuntimeFile,
  context: DocumentProfileContext
): Promise<{ ok: boolean; count: number; error: string | null; sqlHash: string | null; durationMs: number }> {
  const startedAt = Date.now();
  const sql = `
    SELECT COUNT(*)::int AS count
    FROM document_text_chunks
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND human_ipr = $3
      AND file_id = $4
      AND file_hash = $5
  `;


  try {
    const result = await queryHbceDatabase(sql, [
      context.tenantId,
      context.workspaceId,
      context.humanIpr,
      file.id,
      file.fileHash
    ]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const rawCount = row?.count;
    const count = typeof rawCount === "number" ? rawCount : Number(rawCount || 0);


    return {
      ok: result.ok,
      count: Number.isFinite(count) ? count : 0,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: error instanceof Error ? error.message : "DOCUMENT_TEXT_CHUNK_COUNT_QUERY_FAILED",
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


async function persistDocumentChunksForFile(
  file: StoredRuntimeFile,
  context: DocumentProfileContext,
  documentProfileId: string | null
): Promise<DocumentChunkPersistenceResult> {
  const startedAt = Date.now();


  storeRuntimeDocumentChunks(file, documentProfileId);


  if (!isPromptTextStatus(file.status) || file.documentChunks.length === 0) {
    return {
      attempted: false,
      ok: true,
      status: "SKIPPED",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: 0,
      persistedCount: 0,
      insertedCount: 0,
      databaseVerified: true,
      verificationCount: 0,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: null,
      sqlHash: null,
      verificationSqlHash: null,
      durationMs: 0
    };
  }


  const table = await ensureDocumentTextChunksTable();


  if (!table.ok) {
    return {
      attempted: true,
      ok: false,
      status: "DATABASE_NOT_READY",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: file.documentChunks.length,
      persistedCount: 0,
      insertedCount: 0,
      databaseVerified: false,
      verificationCount: 0,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: table.error,
      sqlHash: table.sqlHash,
      verificationSqlHash: null,
      durationMs: table.durationMs
    };
  }


  try {
    const deleteResult = await queryHbceDatabase(
      `DELETE FROM document_text_chunks
       WHERE tenant_id = $1
         AND workspace_id = $2
         AND human_ipr = $3
         AND file_id = $4
         AND file_hash = $5`,
      [context.tenantId, context.workspaceId, context.humanIpr, file.id, file.fileHash]
    );


    if (!deleteResult.ok) {
      throw new Error(deleteResult.error || "DOCUMENT_TEXT_CHUNKS_DELETE_FAILED");
    }


    let insertedCount = 0;
    let lastSqlHash: string | null = deleteResult.sqlHash;


    for (let index = 0; index < file.documentChunks.length; index += LONG_DOCUMENT_CHUNK_INSERT_BATCH_SIZE) {
      const batch = file.documentChunks.slice(index, index + LONG_DOCUMENT_CHUNK_INSERT_BATCH_SIZE);


      for (const chunk of batch) {
        const databaseChunkId = buildHash({
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          humanIpr: context.humanIpr,
          fileId: chunk.fileId,
          fileHash: chunk.fileHash,
          chunkIndex: chunk.chunkIndex,
          textHash: chunk.textHash
        }).replace("sha256:", "docchunk-").slice(0, 56);
        const metadata = {
          routeVersion: FILE_ROUTE_REVISION,
          chunkPersistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
          deployProofRevision: DOCUMENT_CHUNK_DEPLOY_PROOF_REVISION,
          persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
          derivedFromHumanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          runtimeIpr: context.runtimeIpr,
          documentProfileId,
          sourceRuntimeChunkId: chunk.id,
          databaseChunkId,
          sourceKind: context.sourceKind,
          sourceFileHash: file.sourceFileHash,
          normalizedTextHash: file.normalizedTextHash,
          runtimePromptTextHash: file.runtimePromptTextHash,
          textCoverageStatus: file.textCoverageStatus,
          fullDocumentCoverage: file.fullDocumentCoverage,
          fullDocumentCoverageReason: file.fullDocumentCoverageReason,
          longDocumentMode: file.longDocumentMode,
          outlineStatus: file.documentOutline.outlineStatus,
          partsDetected: file.documentOutline.partsDetected,
          chaptersDetected: file.documentOutline.chaptersDetected,
          appendicesDetected: file.documentOutline.appendicesDetected,
          firstSectionDetected: file.documentOutline.firstSectionDetected,
          lastSectionDetected: file.documentOutline.lastSectionDetected,
          lastAppendixDetected: file.documentOutline.lastAppendixDetected,
          legalCertification: false,
          opc: "technical proof receipt only"
        };


        const result = await queryHbceDatabase(
          `
            INSERT INTO document_text_chunks (
              id, tenant_id, workspace_id, human_ipr, runtime_ipr, document_profile_id,
              file_id, filename, file_hash, chunk_index, char_start, char_end, text_hash,
              heading_path, section_type, text, metadata, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17::jsonb, $18, $19
            )
          `,
          [
            databaseChunkId,
            context.tenantId,
            context.workspaceId,
            context.humanIpr,
            context.runtimeIpr,
            documentProfileId,
            chunk.fileId,
            chunk.filename,
            chunk.fileHash,
            chunk.chunkIndex,
            chunk.charStart,
            chunk.charEnd,
            chunk.textHash,
            chunk.headingPath,
            chunk.sectionType,
            chunk.text,
            JSON.stringify(metadata),
            chunk.createdAt,
            nowIso()
          ]
        );


        lastSqlHash = result.sqlHash;
        if (!result.ok) {
          throw new Error(result.error || "DOCUMENT_TEXT_CHUNK_INSERT_FAILED");
        }


        insertedCount += 1;
      }
    }


    const verified = await countPersistedDocumentChunksForFile(file, context);
    lastSqlHash = verified.sqlHash || lastSqlHash;


    if (!verified.ok) {
      return {
        attempted: true,
        ok: false,
        status: "PERSISTENCE_FAILED",
        table: "document_text_chunks",
        documentProfileId,
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        chunkCount: file.documentChunks.length,
        persistedCount: insertedCount,
        insertedCount,
        databaseVerified: false,
        verificationCount: 0,
        persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
        persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
        derivedFromHumanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        fullDocumentCoverage: file.fullDocumentCoverage,
        textCoverageStatus: file.textCoverageStatus,
        error: verified.error || "DOCUMENT_TEXT_CHUNK_VERIFICATION_QUERY_FAILED",
        sqlHash: lastSqlHash,
        verificationSqlHash: verified.sqlHash,
        durationMs: Date.now() - startedAt
      };
    }


    const persistedCount = verified.count;
    const ok = persistedCount === file.documentChunks.length;


    return {
      attempted: true,
      ok,
      status: ok ? "PERSISTED" : "PERSISTENCE_FAILED",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: file.documentChunks.length,
      persistedCount,
      insertedCount,
      databaseVerified: true,
      verificationCount: persistedCount,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: ok ? null : `DOCUMENT_TEXT_CHUNK_COUNT_MISMATCH:inserted=${insertedCount};verified=${persistedCount};expected=${file.documentChunks.length}`,
      sqlHash: lastSqlHash,
      verificationSqlHash: verified.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      status: "PERSISTENCE_FAILED",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: file.documentChunks.length,
      persistedCount: 0,
      insertedCount: 0,
      databaseVerified: false,
      verificationCount: 0,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: error instanceof Error ? error.message : "DOCUMENT_TEXT_CHUNK_PERSISTENCE_FAILED",
      sqlHash: null,
      verificationSqlHash: null,
      durationMs: Date.now() - startedAt
    };
  }
}


function buildDeterministicDocumentProfileId(file: StoredRuntimeFile, context: DocumentProfileContext): string {
  return buildHash({
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    humanIpr: context.humanIpr,
    fileId: file.id,
    fileHash: file.fileHash,
    filename: file.name
  }).replace("sha256:", "DOC-PROFILE-").slice(0, 28).toUpperCase();
}


function extractPersistedDocumentProfileId(
  publicProfile: Record<string, unknown> | null,
  row: Record<string, unknown> | null | undefined,
  file: StoredRuntimeFile,
  context: DocumentProfileContext
): string {
  const candidates = [
    publicProfile?.profileId,
    publicProfile?.documentProfileId,
    publicProfile?.id,
    row?.profile_id,
    row?.profileId,
    row?.document_profile_id,
    row?.id
  ];


  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }


  return buildDeterministicDocumentProfileId(file, context);
}


function withResolvedPublicProfileId<T extends Record<string, unknown> | null>(
  profile: T,
  profileId: string
): T {
  if (!profile) {
    return profile;
  }


  return {
    ...profile,
    profileId,
    documentProfileId: profile.documentProfileId ?? profileId
  } as T;
}


function storeRuntimeDocumentChunks(file: StoredRuntimeFile, documentProfileId: string | null): void {
  const store = getDocumentChunkStore();
  const key = `${file.id}:${file.fileHash}`;
  const chunks = file.documentChunks.map((chunk) => ({
    ...chunk,
    documentProfileId
  }));


  store.set(key, chunks);
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
        chunks: null,
        input: buildDocumentProfilePersistenceInputSummary(input, file)
      };
    });
  }


  const results: DocumentProfilePersistenceResult[] = [];


  for (const file of files) {
    const input = buildDocumentProfileInput(file, context);


    try {
      const result = await upsertDocumentProfileToDatabase(input);
      const row = result.rows[0] as Record<string, unknown> | undefined;
      const canonicalPublicProfile = row
        ? canonicalizePublicDocumentProfileForRead(toPublicDocumentProfile(row) as Record<string, unknown>)
        : null;
      const resolvedProfileId = extractPersistedDocumentProfileId(canonicalPublicProfile, row, file, context);
      const chunks = await persistDocumentChunksForFile(file, context, resolvedProfileId);
      const proofInput = applyDocumentChunkPersistenceProofToInput(input, chunks);
      const proofResult = await upsertDocumentProfileToDatabase(proofInput);
      const proofRow = proofResult.rows[0] as Record<string, unknown> | undefined;
      const proofPublicProfile = proofRow
        ? canonicalizePublicDocumentProfileForRead(toPublicDocumentProfile(proofRow) as Record<string, unknown>)
        : canonicalPublicProfile;
      const publicProfile = withDocumentChunkPersistenceProof(
        withResolvedPublicProfileId(proofPublicProfile, resolvedProfileId),
        chunks
      );
      const profileOk = result.ok && result.rowCount > 0;
      const proofOk = proofResult.ok && proofResult.rowCount > 0;


      results.push({
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: profileOk && chunks.ok && proofOk,
        status: profileOk && proofOk ? "PERSISTED" : "PERSISTENCE_FAILED",
        rowCount: proofResult.rowCount || result.rowCount,
        error: result.error || chunks.error || proofResult.error,
        sqlHash: proofResult.sqlHash || chunks.sqlHash || result.sqlHash,
        durationMs: result.durationMs + chunks.durationMs + proofResult.durationMs,
        profile: publicProfile,
        chunks,
        input: buildDocumentProfilePersistenceInputSummary(proofInput, file)
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
        chunks: null,
        input: buildDocumentProfilePersistenceInputSummary(input, file)
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
        : result.error || "Document profile persistence did not complete.",
      documentChunksPersisted: result.chunks?.ok ?? false,
      documentChunksPersistedCount: result.chunks?.persistedCount ?? 0,
      documentChunkPersistenceStatus: result.chunks?.status ?? null,
      documentChunkPersistenceReason: describeDocumentChunkPersistenceReason(result.chunks),
      documentChunkPersistenceError: result.chunks?.error ?? null,
      documentChunkPersistenceRevision: result.chunks?.persistenceRevision ?? null,
      documentChunkPersistenceScope: result.chunks?.persistenceScope ?? null,
      documentChunkDerivedFromHumanIpr: result.chunks?.derivedFromHumanIpr ?? null,
      documentChunkDatabaseVerified: result.chunks?.databaseVerified ?? null,
      documentChunkVerificationCount: result.chunks?.verificationCount ?? null,
      documentChunkVerificationSqlHash: result.chunks?.verificationSqlHash ?? null
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
  const directText = extractDirectTextWithSource(file);
  const rawText = directText.text;
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
    const pdfSourceKind: TextSourceKind =
      pdfExtraction.source === "DIRECT_TEXT"
        ? "PDF_DIRECT_TEXT"
        : pdfExtraction.source === "PDF_BINARY"
          ? "PDF_BINARY"
          : pdfExtraction.source === "PDF_BASE64"
            ? "PDF_BASE64"
            : pdfExtraction.source === "PDF_DATA_URL"
              ? "PDF_DATA_URL"
              : "NONE";


    if (pdfText.trim()) {
      return buildStoredRuntimeFileBase({
        id,
        name,
        mimeType,
        declaredSize,
        text: pdfText,
        role,
        status: "PDF_INGESTION_READY",
        mode: "PDF_TEXT",
        textSourceKind: pdfSourceKind,
        reason: `${pdfExtraction.reason} Source=${pdfExtraction.source}.`,
        timestamp
      });
    }


    if (pdfExtraction.failed) {
      return buildStoredRuntimeFileBase({
        id,
        name,
        mimeType,
        declaredSize,
        text: "",
        role,
        status: "PDF_INGESTION_FAIL",
        mode: "REFERENCE_ONLY",
        textSourceKind: "NONE",
        reason: pdfExtraction.reason,
        timestamp
      });
    }


    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: "",
      role,
      status: "PDF_METADATA_ONLY",
      mode: "REFERENCE_ONLY",
      textSourceKind: "NONE",
      reason: pdfExtraction.reason,
      timestamp
    });
  }


  if (hasText && isTextMimeType(mimeType)) {
    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: normalizedText,
      role,
      status: "TEXT_READY",
      mode: "TEXT",
      textSourceKind: directText.source,
      reason: "File contains readable text and can be used as prompt context.",
      timestamp
    });
  }


  if (hasText && !isReferenceOnlyMimeType(mimeType)) {
    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: normalizedText,
      role,
      status: "TEXT_READY",
      mode: "TEXT",
      textSourceKind: directText.source,
      reason: "File contains extracted text. MIME type is not explicitly text, but safe extracted text is available.",
      timestamp
    });
  }


  if (isReferenceOnlyMimeType(mimeType)) {
    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: "",
      role,
      status: "REFERENCE_ONLY",
      mode: "REFERENCE_ONLY",
      textSourceKind: "NONE",
      reason: "File is active only as a reference. It was not converted into readable prompt text.",
      timestamp
    });
  }


  return buildStoredRuntimeFileBase({
    id,
    name,
    mimeType,
    declaredSize,
    text: "",
    role,
    status: "REJECTED",
    mode: "REJECTED",
    textSourceKind: "NONE",
    reason: "File has no readable text and its MIME type is not supported as a safe reference-only file.",
    timestamp
  });
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


function summarizeFiles(files: StoredRuntimeFile[], includeText: boolean, includeChunks = false) {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    size: file.size,
    role: file.role,
    textLength: file.textLength,
    fullTextLength: file.fullTextLength,
    promptTextLength: file.promptTextLength,
    sourceFileHash: file.sourceFileHash,
    normalizedTextHash: file.normalizedTextHash,
    runtimePromptTextHash: file.runtimePromptTextHash,
    sourceByteLength: file.sourceByteLength,
    normalizedTextLength: file.normalizedTextLength,
    textSourceKind: file.textSourceKind,
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    fullDocumentCoverageReason: file.fullDocumentCoverageReason,
    longDocumentMode: file.longDocumentMode,
    documentChunkCount: file.documentChunkCount,
    documentChunksPersisted: file.documentChunksPersisted ?? null,
    documentChunksPersistedCount: file.documentChunksPersistedCount ?? null,
    documentChunkPersistenceStatus: file.documentChunkPersistenceStatus ?? null,
    documentChunkPersistenceReason: file.documentChunkPersistenceReason ?? null,
    documentChunkPersistenceError: file.documentChunkPersistenceError ?? null,
    documentChunkPersistenceRevision: file.documentChunkPersistenceRevision ?? null,
    documentChunkPersistenceScope: file.documentChunkPersistenceScope ?? null,
    documentChunkDerivedFromHumanIpr: file.documentChunkDerivedFromHumanIpr ?? null,
    documentChunkDatabaseVerified: file.documentChunkDatabaseVerified ?? null,
    documentChunkVerificationCount: file.documentChunkVerificationCount ?? null,
    documentOutline: {
      outlineStatus: file.documentOutline.outlineStatus,
      partsDetected: file.documentOutline.partsDetected,
      chaptersDetected: file.documentOutline.chaptersDetected,
      appendicesDetected: file.documentOutline.appendicesDetected,
      firstSectionDetected: file.documentOutline.firstSectionDetected,
      lastSectionDetected: file.documentOutline.lastSectionDetected,
      lastAppendixDetected: file.documentOutline.lastAppendixDetected,
      boundaryDetected: file.documentOutline.boundaryDetected,
      conclusionDetected: file.documentOutline.conclusionDetected,
      entries: file.documentOutline.entries
    },
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
    content: includeText ? file.content : undefined,
    documentChunks: includeChunks
      ? file.documentChunks.map((chunk) => ({
          id: chunk.id,
          chunkIndex: chunk.chunkIndex,
          charStart: chunk.charStart,
          charEnd: chunk.charEnd,
          textHash: chunk.textHash,
          headingPath: chunk.headingPath,
          sectionType: chunk.sectionType,
          text: includeText ? chunk.text : undefined
        }))
      : undefined
  }));
}




type DatabaseObjectDiagnostic = {
  requestedName: string;
  available: boolean;
  status: "AVAILABLE" | "NOT_FOUND" | "QUERY_FAILED";
  resolvedName: string | null;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
};


type FilesRouteDiagnosticContext = {
  sessionId: string;
  files: StoredRuntimeFile[];
  humanIpr: string;
  tenantId: string;
  workspaceId: string;
  publicDocumentProfiles?: Record<string, unknown>[];
};


function isAffirmativeSearchParam(value: string | null): boolean {
  if (!value) {
    return false;
  }


  const normalized = value.trim().toLowerCase();


  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}


function getLatestRuntimeFile(files: StoredRuntimeFile[]): StoredRuntimeFile | null {
  return files.length > 0 ? files[files.length - 1] ?? null : null;
}


function buildDiagnosticFileSnapshot(file: StoredRuntimeFile | null) {
  if (!file) {
    return null;
  }


  return {
    fileId: file.id,
    filename: file.name,
    mimeType: file.mimeType,
    size: file.size,
    status: file.status,
    mode: file.mode,
    textLength: file.textLength,
    fullTextLength: file.fullTextLength,
    promptTextLength: file.promptTextLength,
    sourceFileHash: file.sourceFileHash,
    normalizedTextHash: file.normalizedTextHash,
    runtimePromptTextHash: file.runtimePromptTextHash,
    sourceByteLength: file.sourceByteLength,
    normalizedTextLength: file.normalizedTextLength,
    fileHash: file.fileHash,
    textSourceKind: file.textSourceKind,
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    fullDocumentCoverageReason: file.fullDocumentCoverageReason,
    longDocumentMode: file.longDocumentMode,
    documentProfileId: file.documentProfileId ?? null,
    documentProfileStatus: file.documentProfileStatus ?? null,
    documentProfileHash: file.documentProfileHash ?? null,
    documentProfileReason: file.documentProfileReason ?? null,
    documentChunkCount: file.documentChunkCount,
    documentChunksPersisted: file.documentChunksPersisted ?? null,
    documentChunksPersistedCount: file.documentChunksPersistedCount ?? null,
    documentChunkPersistenceStatus: file.documentChunkPersistenceStatus ?? null,
    documentChunkPersistenceReason: file.documentChunkPersistenceReason ?? null,
    documentChunkPersistenceError: file.documentChunkPersistenceError ?? null,
    documentChunkPersistenceRevision: file.documentChunkPersistenceRevision ?? null,
    documentChunkPersistenceScope: file.documentChunkPersistenceScope ?? null,
    documentChunkDerivedFromHumanIpr: file.documentChunkDerivedFromHumanIpr ?? null,
    documentChunkDatabaseVerified: file.documentChunkDatabaseVerified ?? null,
    documentChunkVerificationCount: file.documentChunkVerificationCount ?? null,
    documentChunkVerificationSqlHash: file.documentChunkVerificationSqlHash ?? null,
    outlineStatus: file.documentOutline.outlineStatus,
    majorSectionsDetected: file.documentOutline.partsDetected,
    subsectionsDetected: file.documentOutline.chaptersDetected,
    appendicesDetected: file.documentOutline.appendicesDetected,
    glossaryEntriesDetected: countCorpusGlossaryEntries(file.text),
    firstSectionDetected: file.documentOutline.firstSectionDetected,
    lastSectionDetected: file.documentOutline.lastSectionDetected,
    lastAppendixDetected: file.documentOutline.lastAppendixDetected,
    boundaryDetected: file.documentOutline.boundaryDetected,
    conclusionDetected: file.documentOutline.conclusionDetected,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


function countCorpusGlossaryEntries(text: string): number {
  const lines = text.split("\n");
  let count = 0;
  let inGlossary = false;


  for (const rawLine of lines) {
    const line = normalizeHeadingLabel(rawLine);


    if (/^GLOSSARIO CANONICO DEL CORPUS$/i.test(line) || /^N\.\s*\|\s*A\s*\|\s*B\s*\|/i.test(line)) {
      inGlossary = true;
      continue;
    }


    if (inGlossary && /^15\.2\s+Protocollo di citazione interna del glossario/i.test(line)) {
      break;
    }


    if (inGlossary && /^\d+\.\d+\s+/.test(line)) {
      count += 1;
    }
  }


  return count;
}


async function checkDatabaseObjectAvailability(requestedName: string): Promise<DatabaseObjectDiagnostic> {
  const sql = "SELECT to_regclass($1) AS object_name";
  const startedAt = Date.now();


  try {
    const result = await queryHbceDatabase(sql, [requestedName]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const resolvedName = typeof row?.object_name === "string" ? row.object_name : null;


    return {
      requestedName,
      available: result.ok && Boolean(resolvedName),
      status: !result.ok ? "QUERY_FAILED" : resolvedName ? "AVAILABLE" : "NOT_FOUND",
      resolvedName,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      requestedName,
      available: false,
      status: "QUERY_FAILED",
      resolvedName: null,
      error: error instanceof Error ? error.message : "DATABASE_OBJECT_DIAGNOSTIC_FAILED",
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


function readRecordString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];


  return typeof value === "string" && value.trim() ? value.trim() : null;
}


function readRecordNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  const numeric = typeof value === "number" ? value : Number(value);


  return Number.isFinite(numeric) ? numeric : null;
}


function readProfileMetadata(profile: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!profile || !profile.documentMetadata || typeof profile.documentMetadata !== "object") {
    return {};
  }


  return profile.documentMetadata as Record<string, unknown>;
}


function chooseLatestCanonicalDocumentProfile(
  profiles: Record<string, unknown>[] | null | undefined
): Record<string, unknown> | null {
  if (!profiles || profiles.length === 0) {
    return null;
  }


  const canonicalFullTextProfiles = profiles.filter((profile) => {
    const metadata = readProfileMetadata(profile);


    return (
      readRecordString(profile, "humanIpr") === HBCE_SELF_PILOT_HUMAN_IPR &&
      readRecordString(metadata, "textCoverageStatus") === "TEXT_READY_FULL" &&
      readRecordString(metadata, "longDocumentMode") === "CHUNKED_FULL_TEXT"
    );
  });


  return canonicalFullTextProfiles[0] ?? profiles[0] ?? null;
}


async function countPersistedDocumentChunksForProfile(
  profile: Record<string, unknown> | null,
  context: FilesRouteDiagnosticContext
): Promise<{ ok: boolean; count: number; error: string | null; sqlHash: string | null; durationMs: number }> {
  const startedAt = Date.now();


  if (!profile) {
    return {
      ok: false,
      count: 0,
      error: "DOCUMENT_PROFILE_NOT_AVAILABLE",
      sqlHash: null,
      durationMs: 0
    };
  }


  const profileId = readRecordString(profile, "profileId") || readRecordString(profile, "documentProfileId");
  const fileHash = readRecordString(profile, "fileHash");
  const humanIpr = readRecordString(profile, "humanIpr") || context.humanIpr;
  const tenantId = readRecordString(profile, "tenantId") || context.tenantId;
  const workspaceId = readRecordString(profile, "workspaceId") || context.workspaceId;


  if (!profileId || !fileHash || !humanIpr || !tenantId || !workspaceId) {
    return {
      ok: false,
      count: 0,
      error: "DOCUMENT_PROFILE_CHUNK_COUNT_MISSING_SCOPE",
      sqlHash: null,
      durationMs: Date.now() - startedAt
    };
  }


  const sql = `
    SELECT COUNT(*)::int AS count
    FROM document_text_chunks
    WHERE document_profile_id = $1
      AND file_hash = $2
      AND human_ipr = $3
      AND tenant_id = $4
      AND workspace_id = $5
  `;


  try {
    const result = await queryHbceDatabase(sql, [profileId, fileHash, humanIpr, tenantId, workspaceId]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const count = Number(row?.count ?? 0);


    return {
      ok: result.ok,
      count: Number.isFinite(count) ? count : 0,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: error instanceof Error ? error.message : "DOCUMENT_PROFILE_CHUNK_COUNT_QUERY_FAILED",
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


function buildDiagnosticDocumentProfileSnapshot(
  profile: Record<string, unknown> | null,
  persistedCount: number | null = null
) {
  if (!profile) {
    return null;
  }


  const metadata = readProfileMetadata(profile);
  const expectedCount = readRecordNumber(metadata, "documentChunkCount") ?? readRecordNumber(profile, "documentChunkCount") ?? 0;
  const metadataPersistedCount = readRecordNumber(metadata, "documentChunksPersistedCount");
  const effectivePersistedCount = persistedCount ?? metadataPersistedCount ?? 0;
  const metadataPersisted = metadata.documentChunksPersisted === true;
  const databaseVerified = metadata.documentChunkDatabaseVerified === true || (expectedCount > 0 && effectivePersistedCount === expectedCount);


  return {
    profileId: readRecordString(profile, "profileId") || readRecordString(profile, "documentProfileId"),
    fileId: readRecordString(profile, "fileId"),
    filename: readRecordString(profile, "filename"),
    fileHash: readRecordString(profile, "fileHash"),
    humanIpr: readRecordString(profile, "humanIpr"),
    tenantId: readRecordString(profile, "tenantId"),
    workspaceId: readRecordString(profile, "workspaceId"),
    textStatus: readRecordString(profile, "textStatus"),
    textLength: readRecordNumber(profile, "textLength"),
    docFamily: readRecordString(profile, "docFamily"),
    volume: readRecordString(profile, "volume"),
    title: readRecordString(profile, "title"),
    profileStatus: readRecordString(profile, "profileStatus"),
    routeVersion: readRecordString(metadata, "routeVersion"),
    textCoverageStatus: readRecordString(metadata, "textCoverageStatus"),
    fullDocumentCoverage: metadata.fullDocumentCoverage === true,
    longDocumentMode: readRecordString(metadata, "longDocumentMode"),
    documentChunkCount: expectedCount,
    documentChunksPersisted: metadataPersisted || (expectedCount > 0 && effectivePersistedCount === expectedCount),
    documentChunksPersistedCount: effectivePersistedCount,
    documentChunkPersistenceStatus: readRecordString(metadata, "documentChunkPersistenceStatus"),
    documentChunkPersistenceReason: readRecordString(metadata, "documentChunkPersistenceReason"),
    documentChunkPersistenceError: readRecordString(metadata, "documentChunkPersistenceError"),
    documentChunkPersistenceRevision: readRecordString(metadata, "documentChunkPersistenceRevision"),
    documentChunkDatabaseVerified: databaseVerified,
    documentChunkDerivedFromHumanIpr: readRecordString(metadata, "documentChunkDerivedFromHumanIpr") || readRecordString(metadata, "derivedFromHumanIpr"),
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


async function buildFilesRouteSelfDiagnostic(context: FilesRouteDiagnosticContext) {
  const latestFile = getLatestRuntimeFile(context.files);
  const readiness = await ensureHbceDatabaseReady().catch((error) => ({
    ok: false,
    description: {
      status: "DATABASE_READY_CHECK_FAILED",
      configured: false,
      available: false
    },
    initialization: {
      ok: false,
      error: error instanceof Error ? error.message : "DATABASE_READY_CHECK_FAILED",
      sqlHash: null,
      durationMs: 0
    }
  }));
  const documentProfilesTable = await checkDatabaseObjectAvailability("public.document_profiles");
  const documentTextChunksTable = await checkDatabaseObjectAvailability("public.document_text_chunks");
  const documentTextChunksProfileIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_profile");
  const documentTextChunksFileIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_file");
  const documentTextChunksHumanIprIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_human_ipr");
  const documentTextChunksScopeUniqueIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_scope_unique");
  const documentTextChunksTextHashIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_text_hash");
  const runtimeChunkStoreCount = Array.from(getDocumentChunkStore().values()).reduce((sum, chunks) => sum + chunks.length, 0);
  const totalDocumentChunks = context.files.reduce((sum, file) => sum + file.documentChunkCount, 0);
  const persistedDocumentChunks = context.files.reduce((sum, file) => sum + (file.documentChunksPersistedCount ?? 0), 0);
  const latestDocumentProfile = chooseLatestCanonicalDocumentProfile(context.publicDocumentProfiles);
  const latestDocumentProfileChunkCount = await countPersistedDocumentChunksForProfile(latestDocumentProfile, context);
  const latestDocumentProfileSnapshot = buildDiagnosticDocumentProfileSnapshot(
    latestDocumentProfile,
    latestDocumentProfileChunkCount.ok ? latestDocumentProfileChunkCount.count : null
  );
  const missingCriticalFields: string[] = [];


  if (!latestFile && !latestDocumentProfileSnapshot) {
    missingCriticalFields.push("latestFile|latestDocumentProfile");
  }


  if (latestFile && !latestFile.documentProfileId) {
    missingCriticalFields.push("latestFile.documentProfileId");
  }


  if (latestFile && latestFile.documentChunkCount > 0 && !latestFile.documentChunksPersisted) {
    missingCriticalFields.push("latestFile.documentChunksPersisted");
  }


  if (latestFile && !latestFile.sourceFileHash) {
    missingCriticalFields.push("latestFile.sourceFileHash");
  }


  if (latestFile && !latestFile.normalizedTextHash) {
    missingCriticalFields.push("latestFile.normalizedTextHash");
  }


  if (latestFile && !latestFile.runtimePromptTextHash) {
    missingCriticalFields.push("latestFile.runtimePromptTextHash");
  }


  const failReasons = [
    !readiness.ok ? "DATABASE_NOT_READY" : null,
    !documentProfilesTable.available ? "DOCUMENT_PROFILES_TABLE_NOT_AVAILABLE" : null,
    !documentTextChunksTable.available ? "DOCUMENT_TEXT_CHUNKS_TABLE_NOT_AVAILABLE" : null,
    latestFile && latestFile.fullDocumentCoverage !== true ? "LATEST_FILE_FULL_DOCUMENT_COVERAGE_FALSE" : null,
    latestFile && latestFile.longDocumentMode === "CHUNKED_FULL_TEXT" && latestFile.documentChunkCount <= 0 ? "LATEST_FILE_CHUNKS_NOT_BUILT" : null,
    latestFile && latestFile.documentChunkCount > 0 && latestFile.documentChunksPersisted !== true ? "LATEST_FILE_CHUNKS_NOT_PERSISTED" : null,
    !latestFile && latestDocumentProfileSnapshot && latestDocumentProfileSnapshot.documentChunkCount > 0 && latestDocumentProfileSnapshot.documentChunksPersisted !== true ? "LATEST_DOCUMENT_PROFILE_CHUNKS_NOT_PERSISTED" : null,
    latestDocumentProfile && !latestDocumentProfileChunkCount.ok ? "LATEST_DOCUMENT_PROFILE_CHUNK_COUNT_QUERY_FAILED" : null,
    missingCriticalFields.length > 0 ? `MISSING_CRITICAL_FIELDS:${missingCriticalFields.join(",")}` : null
  ].filter(Boolean) as string[];


  return {
    status: "FILES_ROUTE_DIAGNOSTIC_READY",
    routeAlive: true,
    endpoint: "HBCE_FILES_INGESTION",
    fileRouteRevision: FILE_ROUTE_REVISION,
    routeVersion: FILE_ROUTE_REVISION,
    selfDiagnosticRevision: "FILES_ROUTE_SELF_DIAGNOSTIC_ENDPOINT-v6_2-LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_2",
    documentChunkDatabasePersistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
    sessionId: context.sessionId,
    activeFileCount: context.files.length,
    activeFilesVisibleCount: context.files.length,
    includeChunksSupported: true,
    includeProfilesSupported: true,
    includeDiagnosticsSupported: true,
    sourceFileHashSupported: true,
    normalizedTextHashSupported: true,
    runtimePromptTextHashSupported: true,
    documentOutlineSupported: true,
    canonicalOutlineDetectorActive: true,
    longDocumentChunkingSupported: true,
    runtimeChunkStoreCount,
    totalDocumentChunks,
    persistedDocumentChunks,
    latestDocumentProfile: latestDocumentProfileSnapshot,
    latestCanonicalProfile: latestDocumentProfileSnapshot,
    latestProfileChunkPersistence: {
      ok: latestDocumentProfileChunkCount.ok,
      count: latestDocumentProfileChunkCount.count,
      error: latestDocumentProfileChunkCount.error,
      sqlHash: latestDocumentProfileChunkCount.sqlHash,
      durationMs: latestDocumentProfileChunkCount.durationMs
    },
    database: {
      configured: Boolean(readiness.description.configured),
      available: Boolean(readiness.ok && readiness.description.available),
      status: readiness.description.status,
      initializationOk: readiness.initialization.ok,
      initializationError: readiness.initialization.error,
      initializationSqlHash: readiness.initialization.sqlHash,
      initializationDurationMs: readiness.initialization.durationMs
    },
    tables: {
      documentProfiles: documentProfilesTable,
      documentTextChunks: documentTextChunksTable
    },
    indexes: {
      documentTextChunksProfile: documentTextChunksProfileIndex,
      documentTextChunksFile: documentTextChunksFileIndex,
      documentTextChunksHumanIpr: documentTextChunksHumanIprIndex,
      documentTextChunksScopeUnique: documentTextChunksScopeUniqueIndex,
      documentTextChunksTextHash: documentTextChunksTextHashIndex
    },
    latestFile: buildDiagnosticFileSnapshot(latestFile),
    files: context.files.map((file) => buildDiagnosticFileSnapshot(file)),
    failClosed: failReasons.length > 0,
    failReason: failReasons.length > 0 ? failReasons.join("|") : "NONE",
    documentMemoryReady: failReasons.length === 0,
    memorySaveAllowed: failReasons.length === 0,
    noIprSaveAllowedDuringDiagnostic: true,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
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
  const fullDocumentCoverageCount = files.filter((file) => file.fullDocumentCoverage).length;
  const partialDocumentCoverageCount = files.filter(
    (file) => isPromptTextStatus(file.status) && !file.fullDocumentCoverage
  ).length;
  const totalDocumentChunks = files.reduce((sum, file) => sum + file.documentChunkCount, 0);
  const persistedDocumentChunks = files.reduce(
    (sum, file) => sum + (file.documentChunksPersistedCount ?? 0),
    0
  );


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
    fullDocumentCoverageCount,
    partialDocumentCoverageCount,
    totalDocumentChunks,
    persistedDocumentChunks,
    maxFilesPerSession: MAX_FILES_PER_SESSION,
    maxTextCharsPerFile: MAX_TEXT_CHARS_PER_FILE,
    maxTotalTextCharsPerSession: MAX_TOTAL_TEXT_CHARS_PER_SESSION,
    routeVersion: FILE_ROUTE_REVISION,
    longDocumentEngine: "LONG_DOCUMENT_FULL_INGESTION_ENGINE-v6_3_2_POST_UPLOAD_CHUNK_PROOF",
    documentRegistry: "DOCUMENT_PROFILES",
    documentTextChunks: "document_text_chunks",
    cyberneticMethod: "FILE_UPLOAD_TO_FULL_TEXT_CHUNKS_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
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


  const selfDiagnostic = await buildFilesRouteSelfDiagnostic({
    sessionId,
    files: nextFiles,
    humanIpr: context.humanIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    publicDocumentProfiles: documentProfiles
      .map((profile) => profile.profile)
      .filter((profile): profile is Record<string, unknown> => Boolean(profile))
  });


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    replaced: Boolean(body.replace),
    cyberneticMethod: "FILE_UPLOAD_TO_FULL_TEXT_CHUNKS_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
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
        textCoverageStatus: profile.input.textCoverageStatus,
        fullDocumentCoverage: profile.input.fullDocumentCoverage,
        chunkCount: profile.input.chunkCount,
        outlineStatus: profile.input.outlineStatus,
        partsDetected: profile.input.partsDetected,
        chaptersDetected: profile.input.chaptersDetected,
        appendicesDetected: profile.input.appendicesDetected,
        chunksPersisted: profile.chunks?.ok ?? false,
        chunksPersistedCount: profile.chunks?.persistedCount ?? 0,
        chunkPersistenceStatus: profile.chunks?.status ?? null,
        chunkPersistenceReason: describeDocumentChunkPersistenceReason(profile.chunks),
        chunkPersistenceError: profile.chunks?.error ?? null,
        chunkPersistenceRevision: profile.chunks?.persistenceRevision ?? null,
        chunkDatabaseVerified: profile.chunks?.databaseVerified ?? null,
        chunkVerificationCount: profile.chunks?.verificationCount ?? null,
        derivedFromHumanIpr: profile.chunks?.derivedFromHumanIpr ?? null,
        alienCodeV4ProfileDetected:
          profile.input.docFamily === "CORPUS_ESOTEROLOGIA_ERMETICA" &&
          profile.input.volume === "V4" &&
          typeof profile.input.title === "string" &&
          normalizeSearchText(profile.input.title).includes("alien code"),
        error: profile.error
      }))
    },
    documentTextChunks: {
      table: "document_text_chunks",
      attempted: documentProfiles.some((profile) => profile.chunks?.attempted),
      persistedCount: documentProfiles.reduce((sum, profile) => sum + (profile.chunks?.persistedCount ?? 0), 0),
      expectedCount: documentProfiles.reduce((sum, profile) => sum + (profile.chunks?.chunkCount ?? 0), 0),
      failedCount: documentProfiles.filter((profile) => profile.chunks && !profile.chunks.ok).length,
      runtimeChunkStoreCount: Array.from(getDocumentChunkStore().values()).reduce((sum, chunks) => sum + chunks.length, 0),
      statuses: documentProfiles.map((profile) => profile.chunks).filter(Boolean)
    },
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false, false),
    documentProfiles,
    selfDiagnostic,
    diagnostic: selfDiagnostic,
    filesRouteDiagnostic: selfDiagnostic,
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
  const includeChunks = url.searchParams.get("includeChunks") === "true";
  const includeDiagnostics =
    isAffirmativeSearchParam(url.searchParams.get("diagnostic")) ||
    isAffirmativeSearchParam(url.searchParams.get("includeDiagnostics")) ||
    isAffirmativeSearchParam(url.searchParams.get("selfDiagnostic"));
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
        profiles: result.rows
          .map((row) => toPublicDocumentProfile(row) as Record<string, unknown>)
          .map(canonicalizePublicDocumentProfileForRead)
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
  const selfDiagnostic = includeDiagnostics
    ? await buildFilesRouteSelfDiagnostic({
        sessionId,
        files,
        humanIpr,
        tenantId,
        workspaceId,
        publicDocumentProfiles:
          documentProfiles && Array.isArray(documentProfiles.profiles)
            ? documentProfiles.profiles
            : []
      })
    : null;


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    summary: buildSessionSummary(sessionId, files),
    files: summarizeFiles(files, includeText, includeChunks),
    documentProfiles,
    selfDiagnostic,
    diagnostic: selfDiagnostic,
    filesRouteDiagnostic: selfDiagnostic,
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
