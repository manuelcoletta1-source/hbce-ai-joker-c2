import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  text?: string;
  content?: string;
  role?: string;
};

type FilesBody = {
  sessionId?: string;
  files?: RuntimeFile[];
};

const memoryStore = new Map<string, RuntimeFile[]>();

function normalizeSessionId(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return `JOKER-SESSION-${Date.now()}`;
}

function normalizeFiles(files: unknown): RuntimeFile[] {
  if (!Array.isArray(files)) return [];

  return files.map((file, index) => {
    const item = file as RuntimeFile;

    return {
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `file-${Date.now()}-${index}`,
      name:
        typeof item.name === "string" && item.name.trim()
          ? item.name.trim()
          : `file_${index + 1}`,
      mimeType:
        typeof item.mimeType === "string" && item.mimeType.trim()
          ? item.mimeType.trim()
          : typeof item.type === "string" && item.type.trim()
            ? item.type.trim()
            : "text/plain",
      type:
        typeof item.type === "string" && item.type.trim()
          ? item.type.trim()
          : typeof item.mimeType === "string" && item.mimeType.trim()
            ? item.mimeType.trim()
            : "text/plain",
      text:
        typeof item.text === "string"
          ? item.text
          : typeof item.content === "string"
            ? item.content
            : "",
      content:
        typeof item.content === "string"
          ? item.content
          : typeof item.text === "string"
            ? item.text
            : "",
      role:
        typeof item.role === "string" && item.role.trim()
          ? item.role.trim()
          : "context"
    };
  });
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

  const sessionId = normalizeSessionId(body.sessionId);
  const incomingFiles = normalizeFiles(body.files);

  const existingFiles = memoryStore.get(sessionId) || [];
  const nextFiles = [...existingFiles, ...incomingFiles];

  memoryStore.set(sessionId, nextFiles);

  return NextResponse.json({
    ok: true,
    sessionId,
    files: nextFiles.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      type: file.type,
      role: file.role,
      textLength: file.text?.length || 0
    }))
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));

  const files = memoryStore.get(sessionId) || [];

  return NextResponse.json({
    ok: true,
    sessionId,
    files: files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      type: file.type,
      role: file.role,
      textLength: file.text?.length || 0,
      text: file.text || file.content || ""
    }))
  });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
  const fileId = url.searchParams.get("fileId");

  if (!fileId) {
    memoryStore.delete(sessionId);

    return NextResponse.json({
      ok: true,
      sessionId,
      deleted: "SESSION_FILES"
    });
  }

  const files = memoryStore.get(sessionId) || [];
  const nextFiles = files.filter((file) => file.id !== fileId);

  memoryStore.set(sessionId, nextFiles);

  return NextResponse.json({
    ok: true,
    sessionId,
    deleted: fileId
  });
}
