import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FileStatus = "TEXT_READY" | "REFERENCE_ONLY" | "REJECTED";

type FileMode = "TEXT" | "REFERENCE_ONLY" | "REJECTED";

type RuntimeFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
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

const REFERENCE_ONLY_MIME_TYPES = new Set([
  "application/pdf",
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

function normalizeMimeType(file: RuntimeFile): string {
  const mimeType =
    typeof file.mimeType === "string" && file.mimeType.trim()
      ? file.mimeType.trim()
      : typeof file.type === "string" && file.type.trim()
        ? file.type.trim()
        : "text/plain";

  return mimeType.toLowerCase();
}

function normalizeFileName(value: unknown, index: number): string {
  if (typeof value !== "string" || !value.trim()) {
    return `file_${index + 1}`;
  }

  return value.trim().slice(0, MAX_FILE_NAME_LENGTH);
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

function isReferenceOnlyMimeType(mimeType: string): boolean {
  return REFERENCE_ONLY_MIME_TYPES.has(mimeType);
}

function extractText(file: RuntimeFile): string {
  if (typeof file.text === "string") {
    return file.text;
  }

  if (typeof file.content === "string") {
    return file.content;
  }

  return "";
}

function normalizeSingleFile(
  file: RuntimeFile,
  index: number
): StoredRuntimeFile {
  const timestamp = nowIso();
  const mimeType = normalizeMimeType(file);
  const name = normalizeFileName(file.name, index);
  const rawText = extractText(file);
  const normalizedText = rawText.slice(0, MAX_TEXT_CHARS_PER_FILE);
  const hasText = normalizedText.trim().length > 0;
  const textLength = normalizedText.length;

  const baseId =
    typeof file.id === "string" && file.id.trim()
      ? file.id.trim()
      : `${name}:${mimeType}:${textLength}:${index}`;

  const id = buildHash(baseId).replace("sha256:", "file-").slice(0, 48);

  const declaredSize =
    typeof file.size === "number" && Number.isFinite(file.size)
      ? Math.max(0, Math.floor(file.size))
      : textLength;

  if (hasText && isTextMimeType(mimeType)) {
    return {
      id,
      name,
      mimeType,
      type: mimeType,
      size: declaredSize,
      text: normalizedText,
      content: normalizedText,
      role: normalizeRole(file.role),
      textLength,
      fileHash: buildHash(normalizedText),
      status: "TEXT_READY",
      mode: "TEXT",
      reason: "File contains readable text and can be used as prompt context.",
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
      role: normalizeRole(file.role),
      textLength,
      fileHash: buildHash(normalizedText),
      status: "TEXT_READY",
      mode: "TEXT",
      reason:
        "File contains extracted text. MIME type is not explicitly text, but safe extracted text is available.",
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
      role: normalizeRole(file.role),
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
        "File is active only as a reference. It was not converted into readable prompt text.",
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
    role: normalizeRole(file.role),
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
      "File has no readable text and its MIME type is not supported as a safe reference-only file.",
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

    if (file.status !== "TEXT_READY") {
      result.unshift(file);
      continue;
    }

    if (totalTextLength + file.textLength > MAX_TOTAL_TEXT_CHARS_PER_SESSION) {
      result.unshift({
        ...file,
        text: "",
        content: "",
        textLength: 0,
        status: "REFERENCE_ONLY",
        mode: "REFERENCE_ONLY",
        reason:
          "File was converted to reference-only because the session text limit was reached.",
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
  const referenceOnlyCount = files.filter(
    (file) => file.status === "REFERENCE_ONLY"
  ).length;
  const rejectedCount = files.filter((file) => file.status === "REJECTED").length;
  const totalTextLength = files.reduce((sum, file) => sum + file.textLength, 0);

  return {
    sessionId,
    count: files.length,
    textReadyCount,
    referenceOnlyCount,
    rejectedCount,
    totalTextLength,
    maxFilesPerSession: MAX_FILES_PER_SESSION,
    maxTextCharsPerFile: MAX_TEXT_CHARS_PER_FILE,
    maxTotalTextCharsPerSession: MAX_TOTAL_TEXT_CHARS_PER_SESSION
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
        error: "INVALID_JSON_BODY"
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
      summary: buildSessionSummary(sessionId, [])
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
    files: summarizeFiles(nextFiles, false)
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
    files: summarizeFiles(files, includeText)
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
      summary: buildSessionSummary(sessionId, [])
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
    files: summarizeFiles(nextFiles, false)
  });
}
