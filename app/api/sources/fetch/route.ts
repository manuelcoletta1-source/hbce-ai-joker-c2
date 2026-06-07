import { NextRequest, NextResponse } from "next/server";

import {
  fetchSourceProfile,
  findCatalogEntryById,
  findCatalogEntryByUrl,
  getSourceSetRegistryEntry,
  isAllowedSourceUrl,
  listSourceSetRegistry,
  normalizeSourceSetId,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_REVISION,
  SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION
} from "@/lib/hbce-source-intelligence";
import type { SourceCatalogEntry, SourceSetRegistryEntry } from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOURCE_FETCH_ROUTE_REVISION = "SOURCE_FETCH_SOURCESET_REGISTRY_GUARD-v0.3" as const;
const SOURCESET_REGISTRY_STATUS_READY = "SOURCESET_REGISTRY_READY" as const;

type FetchBody = {
  sourceId?: string;
  sourceSet?: string;
  url?: string;
  timeoutMs?: number;
  maxTextChars?: number;
};

type FetchInput = {
  sourceId: string;
  url: string;
  inputMode: "CATALOG_SOURCE_ID" | "CATALOG_URL" | "ADHOC_URL" | "UNKNOWN_SOURCE_ID";
  requestedSourceSet: string | null;
  sourceSetWasExplicit: boolean;
  sourceSetRegistered: boolean;
  resolvedSourceSet: string;
  registryEntry: SourceSetRegistryEntry | null;
  catalogEntry: SourceCatalogEntry | null;
  failReason?:
    | "UNKNOWN_SOURCE_SET"
    | "SOURCE_ID_NOT_FOUND"
    | "SOURCE_ID_SOURCESET_MISMATCH"
    | "URL_SOURCESET_MISMATCH"
    | "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET";
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

function availableSourceSets(): string[] {
  return listSourceSetRegistry().map((entry) => entry.sourceSet);
}

function resolveRequestedSourceSet(value: unknown): {
  requestedSourceSet: string | null;
  sourceSetWasExplicit: boolean;
  registryEntry: SourceSetRegistryEntry | null;
  sourceSetRegistered: boolean;
} {
  const raw = normalizeOptionalText(value);
  const sourceSetWasExplicit = raw.length > 0;
  const requestedSourceSet = sourceSetWasExplicit ? normalizeSourceSetId(raw) : null;
  const registryEntry = requestedSourceSet ? getSourceSetRegistryEntry(requestedSourceSet) : null;
  return {
    requestedSourceSet,
    sourceSetWasExplicit,
    registryEntry,
    sourceSetRegistered: Boolean(registryEntry)
  };
}

function registryEntryForCatalogEntry(entry: SourceCatalogEntry | null): SourceSetRegistryEntry | null {
  return entry ? getSourceSetRegistryEntry(entry.sourceSet) : null;
}

function buildInputFromSourceIdOrUrl(args: {
  sourceId?: unknown;
  sourceSet?: unknown;
  url?: unknown;
  timeoutMs?: unknown;
  maxTextChars?: unknown;
}): FetchInput | null {
  const sourceId = normalizeOptionalText(args.sourceId);
  const directUrl = normalizeOptionalText(args.url);
  const requested = resolveRequestedSourceSet(args.sourceSet);
  const timeoutMs = toPositiveInteger(args.timeoutMs);
  const maxTextChars = toPositiveInteger(args.maxTextChars);

  if (requested.sourceSetWasExplicit && !requested.sourceSetRegistered) {
    return {
      sourceId: sourceId || "NO_SOURCE_ID",
      url: directUrl,
      inputMode: sourceId ? "UNKNOWN_SOURCE_ID" : directUrl ? "ADHOC_URL" : "UNKNOWN_SOURCE_ID",
      requestedSourceSet: requested.requestedSourceSet,
      sourceSetWasExplicit: true,
      sourceSetRegistered: false,
      resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
      registryEntry: null,
      catalogEntry: null,
      failReason: "UNKNOWN_SOURCE_SET",
      timeoutMs,
      maxTextChars
    };
  }

  if (sourceId) {
    const entry = findCatalogEntryById(sourceId);
    if (!entry) {
      return {
        sourceId,
        url: "",
        inputMode: "UNKNOWN_SOURCE_ID",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: requested.sourceSetWasExplicit,
        sourceSetRegistered: requested.sourceSetWasExplicit ? requested.sourceSetRegistered : false,
        resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
        registryEntry: requested.registryEntry,
        catalogEntry: null,
        failReason: "SOURCE_ID_NOT_FOUND",
        timeoutMs,
        maxTextChars
      };
    }

    const entryRegistry = registryEntryForCatalogEntry(entry);
    if (requested.sourceSetWasExplicit && requested.requestedSourceSet !== entry.sourceSet) {
      return {
        sourceId: entry.sourceId,
        url: entry.url,
        inputMode: "CATALOG_SOURCE_ID",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: true,
        sourceSetRegistered: true,
        resolvedSourceSet: entry.sourceSet,
        registryEntry: requested.registryEntry,
        catalogEntry: entry,
        failReason: "SOURCE_ID_SOURCESET_MISMATCH",
        timeoutMs,
        maxTextChars
      };
    }

    return {
      sourceId: entry.sourceId,
      url: entry.url,
      inputMode: "CATALOG_SOURCE_ID",
      requestedSourceSet: requested.requestedSourceSet || entry.sourceSet,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: Boolean(entryRegistry),
      resolvedSourceSet: entry.sourceSet,
      registryEntry: entryRegistry,
      catalogEntry: entry,
      timeoutMs,
      maxTextChars
    };
  }

  if (directUrl) {
    const entry = findCatalogEntryByUrl(directUrl);
    const entryRegistry = registryEntryForCatalogEntry(entry);

    if (requested.sourceSetWasExplicit && entry && requested.requestedSourceSet !== entry.sourceSet) {
      return {
        sourceId: entry.sourceId,
        url: entry.url,
        inputMode: "CATALOG_URL",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: true,
        sourceSetRegistered: true,
        resolvedSourceSet: entry.sourceSet,
        registryEntry: requested.registryEntry,
        catalogEntry: entry,
        failReason: "URL_SOURCESET_MISMATCH",
        timeoutMs,
        maxTextChars
      };
    }

    if (requested.sourceSetWasExplicit && !entry) {
      return {
        sourceId: "ADHOC_URL",
        url: directUrl,
        inputMode: "ADHOC_URL",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: true,
        sourceSetRegistered: true,
        resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
        registryEntry: requested.registryEntry,
        catalogEntry: null,
        failReason: "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET",
        timeoutMs,
        maxTextChars
      };
    }

    return {
      sourceId: entry?.sourceId || "ADHOC_URL",
      url: entry?.url || directUrl,
      inputMode: entry ? "CATALOG_URL" : "ADHOC_URL",
      requestedSourceSet: requested.requestedSourceSet || entry?.sourceSet || null,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: entry ? Boolean(entryRegistry) : false,
      resolvedSourceSet: entry?.sourceSet || "ADHOC_ALLOWLISTED_SOURCE",
      registryEntry: entryRegistry,
      catalogEntry: entry || null,
      timeoutMs,
      maxTextChars
    };
  }

  return null;
}

function sourceSetPayload(input: FetchInput | null) {
  const registryEntry = input?.registryEntry || null;
  return {
    sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    sourceSetRegistryStatus: SOURCESET_REGISTRY_STATUS_READY,
    requestedSourceSet: input?.requestedSourceSet || null,
    sourceSet: input?.resolvedSourceSet || null,
    sourceSetWasExplicit: input?.sourceSetWasExplicit || false,
    sourceSetRegistered: input?.sourceSetRegistered || false,
    sourceSetStatus: registryEntry?.status || null,
    operationalDomain: registryEntry?.operationalDomain || null,
    riskPosture: registryEntry?.riskPosture || null,
    memoryProfileType: registryEntry?.memoryProfileType || null,
    failClosedOnMissingSource: registryEntry?.failClosedOnMissingSource ?? true,
    availableSourceSets: availableSourceSets()
  };
}

function failureStatusCode(failReason: FetchInput["failReason"]): number {
  switch (failReason) {
    case "UNKNOWN_SOURCE_SET":
      return 400;
    case "SOURCE_ID_NOT_FOUND":
      return 404;
    case "SOURCE_ID_SOURCESET_MISMATCH":
    case "URL_SOURCESET_MISMATCH":
    case "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET":
      return 409;
    default:
      return 400;
  }
}

async function runSourceFetch(input: FetchInput | null): Promise<NextResponse> {
  if (!input) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_FETCH_ROUTE_REVISION,
        sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
        sourceSetRegistryStatus: SOURCESET_REGISTRY_STATUS_READY,
        failReason: "MISSING_SOURCE_ID_OR_URL",
        acceptedInputs: ["sourceId", "url", "sourceSet"],
        browserExample: "/api/sources/fetch?sourceId=SRC-ANTHROPIC-RSI-2026",
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 400 }
    );
  }

  if (input.failReason) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_FETCH_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        url: input.url || null,
        inputMode: input.inputMode,
        catalogSourceId: input.catalogEntry?.sourceId || null,
        catalogSourceSet: input.catalogEntry?.sourceSet || null,
        failReason: input.failReason,
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: failureStatusCode(input.failReason) }
    );
  }

  if (!input.url) {
    return NextResponse.json(
      {
        status: "SOURCE_FETCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_FETCH_ROUTE_REVISION,
        ...sourceSetPayload(input),
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
        routeRevision: SOURCE_FETCH_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        url: input.url,
        inputMode: input.inputMode,
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
    routeRevision: SOURCE_FETCH_ROUTE_REVISION,
    ...sourceSetPayload(input),
    sourceId: profile.sourceId,
    requestedSourceId: input.sourceId,
    catalogSourceId: input.catalogEntry?.sourceId || null,
    catalogSourceSet: input.catalogEntry?.sourceSet || null,
    inputMode: input.inputMode,
    url: profile.url,
    domain: profile.domain,
    fetchStatus: profile.fetchStatus,
    verificationStatus: profile.verificationStatus,
    sourceHash: profile.sourceHash,
    contentType: profile.contentType,
    statusCode: profile.statusCode,
    textLength: profile.textLength,
    textPreview: profile.textPreview,
    binaryLength: profile.binaryLength,
    contentMode: profile.contentMode,
    textExtractionStatus: profile.textExtractionStatus,
    semanticTextReady: profile.semanticTextReady,
    sourceHashMode: profile.sourceHashMode,
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
    sourceSet: searchParams.get("sourceSet"),
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
