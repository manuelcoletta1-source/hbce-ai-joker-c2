export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type FileRole =
  | "context"
  | "corpus"
  | "single"
  | "reference"
  | "evidence"
  | "temporary";

type FileInput = {
  id?: string;
  name?: string;
  mimeType?: string;
  text?: string;
  content?: string;
  role?: FileRole;
};

type FilesBody = {
  sessionId?: string;
  files?: FileInput[];
};

type StoredFile = {
  id: string;
  sessionId: string;
  name: string;
  title: string;
  mimeType: string;
  text: string;
  content: string;
  hasText: boolean;
  sizeEstimate: number;
  role: FileRole;
  ingestedAt: string;
  updatedAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __HBCE_FILE_STORE__:
    | Map<string, Map<string, StoredFile>>
    | undefined;
}

function getFileStore(): Map<string, Map<string, StoredFile>> {
  if (!globalThis.__HBCE_FILE_STORE__) {
    globalThis.__HBCE_FILE_STORE__ = new Map();
  }

  return globalThis.__HBCE_FILE_STORE__;
}

function normalizeSessionId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown): FileRole {
  const allowed: FileRole[] = [
    "context",
    "corpus",
    "single",
    "reference",
    "evidence",
    "temporary"
  ];

  return allowed.includes(value as FileRole)
    ? (value as FileRole)
    : "context";
}

function cleanTitleFromName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/[()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTitle(name: string, text: string, content: string): string {
  const body = (text || content).trim();

  if (body) {
    const firstNonEmptyLine = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    if (firstNonEmptyLine && firstNonEmptyLine.length <= 160) {
      return firstNonEmptyLine;
    }
  }

  return cleanTitleFromName(name) || "Untitled file";
}

function normalizeFiles(files: unknown): FileInput[] {
  if (!Array.isArray(files)) return [];

  return files
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const file = item as FileInput;

      return {
        id: typeof file.id === "string" ? file.id.trim() : undefined,
        name:
          typeof file.name === "string" && file.name.trim()
            ? file.name.trim()
            : undefined,
        mimeType:
          typeof file.mimeType === "string" && file.mimeType.trim()
            ? file.mimeType.trim()
            : undefined,
        text: typeof file.text === "string" ? file.text : undefined,
        content: typeof file.content === "string" ? file.content : undefined,
        role: normalizeRole(file.role)
      };
    })
    .filter((file) => Boolean(file.name))
    .slice(0, 20);
}

function buildStoredFile(
  sessionId: string,
  file: FileInput,
  index: number
): StoredFile {
  const now = new Date().toISOString();
  const text = (file.text || "").trim();
  const content = (file.content || "").trim();
  const merged = text || content;
  const name = file.name || `file-${index + 1}`;

  return {
    id: file.id || `${sessionId}-file-${Date.now()}-${index + 1}`,
    sessionId,
    name,
    title: inferTitle(name, text, content),
    mimeType: file.mimeType || "application/octet-stream",
    text,
    content,
    hasText: Boolean(merged),
    sizeEstimate: merged.length,
    role: normalizeRole(file.role),
    ingestedAt: now,
    updatedAt: now
  };
}

function summarizeFile(file: StoredFile) {
  return {
    id: file.id,
    sessionId: file.sessionId,
    name: file.name,
    title: file.title,
    mimeType: file.mimeType,
    hasText: file.hasText,
    sizeEstimate: file.sizeEstimate,
    role: file.role,
    ingestedAt: file.ingestedAt,
    updatedAt: file.updatedAt
  };
}

function getSessionFilesMap(sessionId: string): Map<string, StoredFile> {
  const store = getFileStore();

  if (!store.has(sessionId)) {
    store.set(sessionId, new Map());
  }

  return store.get(sessionId)!;
}

function sortFiles(files: StoredFile[]): StoredFile[] {
  return [...files].sort((a, b) => {
    return a.ingestedAt.localeCompare(b.ingestedAt);
  });
}

export async function GET(req: NextRequest) {
  const sessionId = normalizeSessionId(
    req.nextUrl.searchParams.get("sessionId")
  );

  if (!sessionId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing sessionId"
      },
      { status: 400 }
    );
  }

  const filesMap = getSessionFilesMap(sessionId);
  const files = sortFiles(Array.from(filesMap.values()));

  return NextResponse.json({
    ok: true,
    sessionId,
    count: files.length,
    files: files.map(summarizeFile)
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FilesBody;
    const sessionId = normalizeSessionId(body.sessionId);
    const files = normalizeFiles(body.files);

    if (!sessionId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing sessionId"
        },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing files"
        },
        { status: 400 }
      );
    }

    const filesMap = getSessionFilesMap(sessionId);
    const stored = files.map((file, index) =>
      buildStoredFile(sessionId, file, index)
    );

    for (const item of stored) {
      filesMap.set(item.id, item);
    }

    const allFiles = sortFiles(Array.from(filesMap.values()));

    return NextResponse.json({
      ok: true,
      message: "Files ingested",
      sessionId,
      ingested: stored.map(summarizeFile),
      count: allFiles.length,
      files: allFiles.map(summarizeFile)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid files request"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const sessionId = normalizeSessionId(
    req.nextUrl.searchParams.get("sessionId")
  );
  const fileId = normalizeSessionId(req.nextUrl.searchParams.get("fileId"));

  if (!sessionId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing sessionId"
      },
      { status: 400 }
    );
  }

  const store = getFileStore();

  if (!store.has(sessionId)) {
    return NextResponse.json({
      ok: true,
      sessionId,
      cleared: false,
      removed: false,
      count: 0,
      files: []
    });
  }

  const filesMap = store.get(sessionId)!;

  if (fileId) {
    const removed = filesMap.delete(fileId);
    const remaining = sortFiles(Array.from(filesMap.values()));

    if (filesMap.size === 0) {
      store.delete(sessionId);
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      removed,
      cleared: false,
      count: remaining.length,
      files: remaining.map(summarizeFile)
    });
  }

  store.delete(sessionId);

  return NextResponse.json({
    ok: true,
    sessionId,
    removed: false,
    cleared: true,
    count: 0,
    files: []
  });
}
