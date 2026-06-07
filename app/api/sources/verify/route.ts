import { NextRequest, NextResponse } from "next/server";

import {
  buildSourceVerificationReceipt,
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

const SOURCE_VERIFY_ROUTE_REVISION = "SOURCE_VERIFY_SOURCESET_REGISTRY_GUARD-v0.3" as const;
const SOURCESET_REGISTRY_STATUS_READY = "SOURCESET_REGISTRY_READY" as const;

type VerifyBody = {
  sourceId?: string;
  sourceSet?: string;
  url?: string;
  expectedHash?: string;
  fetch?: boolean;
  timeoutMs?: number;
  maxTextChars?: number;
};

type VerifyInput = {
  sourceId: string;
  url: string;
  inputMode: "CATALOG_SOURCE_ID" | "CATALOG_URL" | "ADHOC_URL" | "UNKNOWN_SOURCE_ID";
  requestedSourceSet: string | null;
  sourceSetWasExplicit: boolean;
  sourceSetRegistered: boolean;
  resolvedSourceSet: string;
  registryEntry: SourceSetRegistryEntry | null;
  catalogEntry: SourceCatalogEntry | null;
  expectedHash: string;
  fetchRequested: boolean;
  failReason?:
    | "UNKNOWN_SOURCE_SET"
    | "SOURCE_ID_NOT_FOUND"
    | "SOURCE_ID_SOURCESET_MISMATCH"
    | "URL_SOURCESET_MISMATCH"
    | "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET";
  timeoutMs?: number;
  maxTextChars?: number;
};

async function readBody(request: NextRequest): Promise<VerifyBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as VerifyBody) : {};
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

function toBooleanOrDefault(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
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
  expectedHash?: unknown;
  fetch?: unknown;
  timeoutMs?: unknown;
  maxTextChars?: unknown;
}): VerifyInput | null {
  const sourceId = normalizeOptionalText(args.sourceId);
  const directUrl = normalizeOptionalText(args.url);
  const expectedHash = normalizeOptionalText(args.expectedHash);
  const requested = resolveRequestedSourceSet(args.sourceSet);
  const fetchRequested = toBooleanOrDefault(args.fetch, true);
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
      expectedHash,
      fetchRequested,
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
        expectedHash,
        fetchRequested,
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
        expectedHash,
        fetchRequested,
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
      expectedHash,
      fetchRequested,
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
        expectedHash,
        fetchRequested,
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
        expectedHash,
        fetchRequested,
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
      expectedHash,
      fetchRequested,
      timeoutMs,
      maxTextChars
    };
  }

  return null;
}

function sourceSetPayload(input: VerifyInput | null) {
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

function failureStatusCode(failReason: VerifyInput["failReason"]): number {
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

async function runSourceVerify(input: VerifyInput | null): Promise<NextResponse> {
  if (!input) {
    return NextResponse.json(
      {
        status: "SOURCE_VERIFY_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_VERIFY_ROUTE_REVISION,
        sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
        sourceSetRegistryStatus: SOURCESET_REGISTRY_STATUS_READY,
        failReason: "MISSING_SOURCE_ID_OR_URL",
        acceptedInputs: ["sourceId", "url", "sourceSet", "expectedHash"],
        browserExample: "/api/sources/verify?sourceSet=EU_AI_GOVERNANCE_REGULATORY_STACK&sourceId=SRC-EU-AI-OFFICE-2026",
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
        status: "SOURCE_VERIFY_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_VERIFY_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        requestedSourceId: input.sourceId,
        url: input.url || null,
        inputMode: input.inputMode,
        catalogSourceId: input.catalogEntry?.sourceId || null,
        catalogSourceSet: input.catalogEntry?.sourceSet || null,
        expectedHash: input.expectedHash || null,
        hashMatch: null,
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
        status: "SOURCE_VERIFY_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_VERIFY_ROUTE_REVISION,
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
        status: "SOURCE_VERIFY_REJECTED",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_VERIFY_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        url: input.url,
        inputMode: input.inputMode,
        verificationStatus: "SOURCE_REJECTED",
        failReason: "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED",
        expectedHash: input.expectedHash || null,
        hashMatch: null,
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
  const receipt = buildSourceVerificationReceipt(profile);
  const hashMatch = input.expectedHash ? input.expectedHash === profile.sourceHash : null;

  return NextResponse.json({
    status: profile.verificationStatus === "SOURCE_VERIFIED" ? "SOURCE_VERIFY_READY" : "SOURCE_VERIFY_NOT_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    routeRevision: SOURCE_VERIFY_ROUTE_REVISION,
    ...sourceSetPayload(input),
    sourceId: profile.sourceId,
    requestedSourceId: input.sourceId,
    catalogSourceId: input.catalogEntry?.sourceId || null,
    catalogSourceSet: input.catalogEntry?.sourceSet || null,
    inputMode: input.inputMode,
    url: profile.url,
    domain: profile.domain,
    fetchRequested: input.fetchRequested,
    verificationStatus: profile.verificationStatus,
    fetchStatus: profile.fetchStatus,
    sourceHash: profile.sourceHash,
    expectedHash: input.expectedHash || null,
    hashMatch,
    contentType: profile.contentType,
    statusCode: profile.statusCode,
    textLength: profile.textLength,
    binaryLength: profile.binaryLength,
    contentMode: profile.contentMode,
    textExtractionStatus: profile.textExtractionStatus,
    semanticTextReady: profile.semanticTextReady,
    sourceHashMode: profile.sourceHashMode,
    promptInjectionRisk: profile.promptInjectionRisk,
    promptInjectionSignals: profile.promptInjectionSignals,
    receipt,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY,
    profile: {
      ...profile,
      textPreview: profile.textPreview.slice(0, 500)
    }
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  const input = buildInputFromSourceIdOrUrl({
    sourceId: searchParams.get("sourceId"),
    sourceSet: searchParams.get("sourceSet"),
    url: searchParams.get("url"),
    expectedHash: searchParams.get("expectedHash"),
    fetch: searchParams.get("fetch"),
    timeoutMs: searchParams.get("timeoutMs"),
    maxTextChars: searchParams.get("maxTextChars")
  });
  return runSourceVerify(input);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const input = buildInputFromSourceIdOrUrl(body);
  return runSourceVerify(input);
}
