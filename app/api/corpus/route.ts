export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type CorpusAttachmentInput = {
  id?: string;
  name?: string;
  mimeType?: string;
  text?: string;
  content?: string;
};

type StoredCorpusDocument = {
  id: string;
  name: string;
  title: string;
  mimeType: string;
  hasText: boolean;
  sizeEstimate: number;
  text: string;
  content: string;
  ingestedAt: string;
};

type SessionCorpus = {
  sessionId: string;
  documents: StoredCorpusDocument[];
  updatedAt: string;
};

type CorpusBody = {
  sessionId?: string;
  attachments?: CorpusAttachmentInput[];
};

declare global {
  // eslint-disable-next-line no-var
  var __HBCE_CORPUS_STORE__: Map<string, SessionCorpus> | undefined;
}

function getCorpusStore(): Map<string, SessionCorpus> {
  if (!globalThis.__HBCE_CORPUS_STORE__) {
    globalThis.__HBCE_CORPUS_STORE__ = new Map<string, SessionCorpus>();
  }

  return globalThis.__HBCE_CORPUS_STORE__;
}

function normalizeSessionId(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeAttachments(
  attachments: CorpusAttachmentInput[] | undefined
): CorpusAttachmentInput[] {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      name: typeof item.name === "string" ? item.name : undefined,
      mimeType: typeof item.mimeType === "string" ? item.mimeType : undefined,
      text: typeof item.text === "string" ? item.text : undefined,
      content: typeof item.content === "string" ? item.content : undefined
    }))
    .slice(0, 12);
}

function cleanTitleFromName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/[()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferTitle(name?: string, text?: string, content?: string): string {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "";
  const body = (text || content || "").trim();

  if (body) {
    const firstNonEmptyLine = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    if (firstNonEmptyLine && firstNonEmptyLine.length <= 140) {
      return firstNonEmptyLine;
    }
  }

  if (safeName) {
    return cleanTitleFromName(safeName);
  }

  return "Untitled corpus document";
}

function buildStoredDocument(
  attachment: CorpusAttachmentInput,
  index: number
): StoredCorpusDocument {
  const text = (attachment.text || "").trim();
  const content = (attachment.content || "").trim();
  const merged = text || content;
  const now = new Date().toISOString();

  return {
    id: attachment.id?.trim() || `corpus-doc-${Date.now()}-${index + 1}`,
    name: attachment.name?.trim() || `document-${index + 1}`,
    title: inferTitle(attachment.name, text, content),
    mimeType: attachment.mimeType?.trim() || "application/octet-stream",
    hasText: Boolean(merged),
    sizeEstimate: merged.length,
    text,
    content,
    ingestedAt: now
  };
}

function uniqueDocumentsById(
  docs: StoredCorpusDocument[]
): StoredCorpusDocument[] {
  const seen = new Map<string, StoredCorpusDocument>();

  for (const doc of docs) {
    seen.set(doc.id, doc);
  }

  return Array.from(seen.values());
}

function summarizeCorpus(corpus: SessionCorpus) {
  return {
    sessionId: corpus.sessionId,
    documents: corpus.documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      title: doc.title,
      mimeType: doc.mimeType,
      hasText: doc.hasText,
      sizeEstimate: doc.sizeEstimate,
      ingestedAt: doc.ingestedAt
    })),
    count: corpus.documents.length,
    updatedAt: corpus.updatedAt
  };
}

export async function GET(req: NextRequest) {
  const sessionId = normalizeSessionId(req.nextUrl.searchParams.get("sessionId"));

  if (!sessionId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing sessionId"
      },
      { status: 400 }
    );
  }

  const store = getCorpusStore();
  const corpus = store.get(sessionId);

  return NextResponse.json({
    ok: true,
    sessionId,
    corpus: corpus ? summarizeCorpus(corpus) : null
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CorpusBody;
    const sessionId = normalizeSessionId(body.sessionId);
    const attachments = normalizeAttachments(body.attachments);

    if (!sessionId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing sessionId"
        },
        { status: 400 }
      );
    }

    if (attachments.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing attachments"
        },
        { status: 400 }
      );
    }

    const incomingDocs = attachments.map(buildStoredDocument);
    const store = getCorpusStore();
    const existing = store.get(sessionId);

    const mergedDocuments = uniqueDocumentsById([
      ...(existing?.documents || []),
      ...incomingDocs
    ]);

    const updatedCorpus: SessionCorpus = {
      sessionId,
      documents: mergedDocuments,
      updatedAt: new Date().toISOString()
    };

    store.set(sessionId, updatedCorpus);

    return NextResponse.json({
      ok: true,
      message: "Corpus ingested",
      corpus: summarizeCorpus(updatedCorpus)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid corpus request"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const sessionId = normalizeSessionId(req.nextUrl.searchParams.get("sessionId"));

  if (!sessionId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing sessionId"
      },
      { status: 400 }
    );
  }

  const store = getCorpusStore();
  const existed = store.delete(sessionId);

  return NextResponse.json({
    ok: true,
    cleared: existed,
    sessionId
  });
}
