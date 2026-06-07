import { NextRequest, NextResponse } from "next/server";

import {
  fetchSourceProfile,
  findCatalogEntryById,
  isAllowedSourceUrl,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_REVISION
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type FetchBody = {
  sourceId?: string;
  url?: string;
  timeoutMs?: number;
  maxTextChars?: number;
};

type FetchInput = {
  sourceId: string;
  url: string;
  timeoutMs?: number;
  maxTextChars?: number;
};

async function readBody(request: NextRequest): Promise<FetchBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as FetchBody) : {};
  } catch {
    return {};
  }
}

function normalizeOptionalText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

function buildInputFromSourceIdOrUrl(args: {
  sourceId?: unknown;
  url?: unknown;
  timeoutMs?: unknown;
  maxTextChars?: unknown;
}): FetchInput | null {
  const sourceId = normalizeOptionalText(args.sourceId);
  const directUrl = normalizeOptionalText(args.url);

  if (sourceId) {
    const entry = findCatalogEntryById(sourceId);
    if (!entry) {
      return {
        sourceId,
        url: "",
        timeoutMs: toPositiveInteger(args.timeoutMs),
        maxTextChars: toPositiveInteger(args.maxTextChars)
      };
    }
    return {
      sourceId: entry.sourceId,
      url: entry.url,
      timeoutMs: toPositiveInteger(args.timeoutMs),
      maxTextChars: toPositiveInteger(args.maxTextChars)
    };
  }

  if (directUrl) {
    return {
      sourceId: "ADHOC_URL",
      url: directUrl,
      timeoutMs: toPositiveInteger(args.timeoutMs),
      maxTextChars: toPositiveInteger(args.maxTextChars)
    };
  }

  return null;
}

async function runSourceFetch(input: FetchInput | null): Promise<NextResponse> {
  if (!input) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        failReason: "MISSING_SOURCE_ID_OR_URL",
        acceptedInputs: ["sourceId", "url"],
        browserExample: "/api/sources/fetch?sourceId=SRC-ANTHROPIC-RSI-2026",
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 400 }
    );
  }

  if (!input.url) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        sourceId: input.sourceId,
        failReason: "SOURCE_ID_NOT_FOUND",
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 404 }
    );
  }

  if (!isAllowedSourceUrl(input.url)) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_BLOCKED",
        revision: SOURCE_INTELLIGENCE_REVISION,
        sourceId: input.sourceId,
        url: input.url,
        failReason: "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED",
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 403 }
    );
  }

  const profile = await fetchSourceProfile({
    url: input.url,
    timeoutMs: input.timeoutMs,
    maxTextChars: input.maxTextChars
  });

  return NextResponse.json({
    status: profile.fetchStatus === "FETCH_READY" ? "SOURCE_FETCH_READY" : "SOURCE_FETCH_NOT_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    sourceId: profile.sourceId,
    sourceSet: profile.sourceSet,
    url: profile.url,
    domain: profile.domain,
    fetchStatus: profile.fetchStatus,
    verificationStatus: profile.verificationStatus,
    sourceHash: profile.sourceHash,
    contentType: profile.contentType,
    statusCode: profile.statusCode,
    textLength: profile.textLength,
    textPreview: profile.textPreview,
    promptInjectionRisk: profile.promptInjectionRisk,
    promptInjectionSignals: profile.promptInjectionSignals,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY,
    profile
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  const input = buildInputFromSourceIdOrUrl({
    sourceId: searchParams.get("sourceId"),
    url: searchParams.get("url"),
    timeoutMs: searchParams.get("timeoutMs"),
    maxTextChars: searchParams.get("maxTextChars")
  });
  return runSourceFetch(input);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const input = buildInputFromSourceIdOrUrl(body);
  return runSourceFetch(input);
}
