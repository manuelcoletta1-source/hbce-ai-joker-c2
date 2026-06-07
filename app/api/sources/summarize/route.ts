import { NextRequest, NextResponse } from "next/server";

import {
  buildSourceContextBlock,
  fetchSourceProfile,
  findCatalogEntryById,
  MYTHOS_SOURCE_CATALOG,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
  SOURCE_INTELLIGENCE_REVISION,
  type SourceCatalogEntry,
  type SourceProfile
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUMMARIZE_ROUTE_REVISION = "SOURCE_SUMMARIZE_GET_POST_SOURCEID_CONTENT_MODE_GUARD-v0.2" as const;

type SummarizeBody = {
  sourceId?: string;
  sourceIds?: string[] | string;
  sourceSet?: string;
  fetchLive?: boolean;
  maxTextChars?: number;
};

type SummarizeInput = {
  sourceId?: string;
  sourceIds: string[];
  sourceSet: string;
  fetchLive: boolean;
  maxTextChars: number;
};

function normalizeInputText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseMaxTextChars(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 60000;
  }
  return Math.min(Math.max(Math.floor(numeric), 1000), 500000);
}

function normalizeSourceIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeInputText).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

async function readBody(request: NextRequest): Promise<SummarizeBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as SummarizeBody) : {};
  } catch {
    return {};
  }
}

function readGetInput(request: NextRequest): SummarizeInput {
  const params = new URL(request.url).searchParams;
  const sourceId = normalizeInputText(params.get("sourceId"));
  const sourceIds = normalizeSourceIds(params.get("sourceIds"));
  if (sourceId) {
    sourceIds.unshift(sourceId);
  }

  return {
    sourceId,
    sourceIds: Array.from(new Set(sourceIds)),
    sourceSet: normalizeInputText(params.get("sourceSet")) || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    fetchLive: parseBoolean(params.get("fetchLive"), true),
    maxTextChars: parseMaxTextChars(params.get("maxTextChars"))
  };
}

function readPostInput(body: SummarizeBody): SummarizeInput {
  const sourceId = normalizeInputText(body.sourceId);
  const sourceIds = normalizeSourceIds(body.sourceIds);
  if (sourceId) {
    sourceIds.unshift(sourceId);
  }

  return {
    sourceId,
    sourceIds: Array.from(new Set(sourceIds)),
    sourceSet: normalizeInputText(body.sourceSet) || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    fetchLive: parseBoolean(body.fetchLive, true),
    maxTextChars: parseMaxTextChars(body.maxTextChars)
  };
}

function resolveEntries(input: SummarizeInput): {
  entries: SourceCatalogEntry[];
  missingSourceIds: string[];
} {
  if (input.sourceIds.length > 0) {
    const entries: SourceCatalogEntry[] = [];
    const missingSourceIds: string[] = [];

    for (const sourceId of input.sourceIds) {
      const entry = findCatalogEntryById(sourceId);
      if (entry) {
        entries.push(entry);
      } else {
        missingSourceIds.push(sourceId);
      }
    }

    return { entries, missingSourceIds };
  }

  return {
    entries: MYTHOS_SOURCE_CATALOG.filter((entry) => entry.sourceSet === input.sourceSet),
    missingSourceIds: []
  };
}

function buildUnfetchedProfile(entry: SourceCatalogEntry): SourceProfile {
  return {
    ...entry,
    fetchedAt: new Date().toISOString(),
    fetchStatus: "FETCH_SKIPPED",
    verificationStatus: "SOURCE_UNVERIFIED",
    sourceHash: "NO_LIVE_FETCH_HASH_AVAILABLE",
    contentType: "NOT_FETCHED",
    statusCode: null,
    textLength: 0,
    textPreview: "LIVE_FETCH_SKIPPED",
    binaryLength: 0,
    contentMode: "NOT_FETCHED",
    textExtractionStatus: "NOT_FETCHED",
    semanticTextReady: false,
    sourceHashMode: "SHA256_ON_STATUS_RECEIPT",
    promptInjectionRisk: "NONE_DETECTED",
    promptInjectionSignals: [],
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  };
}

async function buildSummaryResponse(input: SummarizeInput): Promise<NextResponse> {
  const { entries, missingSourceIds } = resolveEntries(input);

  if (entries.length === 0) {
    return NextResponse.json(
      {
        status: "SOURCE_SUMMARY_NOT_FOUND",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SUMMARIZE_ROUTE_REVISION,
        sourceSet: input.sourceSet,
        requestedSourceIds: input.sourceIds,
        missingSourceIds,
        sourcesRequested: 0,
        sourcesVerified: 0,
        fetchLive: input.fetchLive,
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 404 }
    );
  }

  const profiles = input.fetchLive
    ? await Promise.all(entries.map((entry) => fetchSourceProfile({ url: entry.url, maxTextChars: input.maxTextChars })))
    : entries.map(buildUnfetchedProfile);

  const contextBlock = buildSourceContextBlock(profiles);
  const sourcesVerified = profiles.filter((profile) => profile.verificationStatus === "SOURCE_VERIFIED").length;
  const sourcesSemanticTextReady = profiles.filter((profile) => profile.semanticTextReady).length;
  const pdfBinaryHashOnlySources = profiles.filter((profile) => profile.contentMode === "PDF_BINARY_HASH_ONLY").length;
  const promptInjectionRiskSources = profiles.filter((profile) => profile.promptInjectionRisk !== "NONE_DETECTED").length;

  return NextResponse.json({
    status: "SOURCE_CONTEXT_BLOCK_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    routeRevision: SUMMARIZE_ROUTE_REVISION,
    sourceSet: input.sourceSet,
    requestedSourceIds: input.sourceIds,
    missingSourceIds,
    fetchLive: input.fetchLive,
    sourcesRequested: entries.length,
    sourcesVerified,
    sourcesSemanticTextReady,
    pdfBinaryHashOnlySources,
    promptInjectionRiskSources,
    sourceContextBlock: contextBlock,
    sourceProfiles: profiles.map((profile) => ({
      ...profile,
      textPreview: profile.textPreview.slice(0, 500)
    })),
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return buildSummaryResponse(readGetInput(request));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  return buildSummaryResponse(readPostInput(body));
}
