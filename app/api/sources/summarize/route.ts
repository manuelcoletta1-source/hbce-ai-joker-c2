import { NextRequest, NextResponse } from "next/server";

import {
  buildSourceContextBlock,
  fetchSourceProfile,
  findCatalogEntryById,
  findCatalogEntryByUrl,
  getDefaultSourceIdsForSourceSet,
  getSourceSetRegistryEntry,
  getSourcesBySet,
  isAllowedSourceUrl,
  listSourceSetRegistry,
  normalizeSourceSetId,
  SOURCE_CATALOG_ENTRIES,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
  SOURCE_INTELLIGENCE_REVISION,
  SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION
} from "@/lib/hbce-source-intelligence";
import type { SourceCatalogEntry, SourceProfile, SourceSetRegistryEntry } from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOURCE_SUMMARIZE_ROUTE_REVISION = "SOURCE_SUMMARIZE_SOURCESET_REGISTRY_GUARD-v0.3" as const;
const SOURCESET_REGISTRY_STATUS_READY = "SOURCESET_REGISTRY_READY" as const;

type SummarizeBody = {
  sourceId?: string;
  sourceIds?: string[] | string;
  sourceSet?: string;
  url?: string;
  urls?: string[] | string;
  fetchLive?: boolean;
  timeoutMs?: number;
  maxTextChars?: number;
  includeProfiles?: boolean;
  includeContextBlock?: boolean;
  useFullCatalog?: boolean;
};

type SummarizeFailReason =
  | "UNKNOWN_SOURCE_SET"
  | "SOURCE_ID_NOT_FOUND"
  | "SOURCE_ID_SOURCESET_MISMATCH"
  | "URL_SOURCESET_MISMATCH"
  | "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET"
  | "URL_NOT_REGISTERED_IN_SOURCE_CATALOG"
  | "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED"
  | "MIXED_SOURCESET_INPUT_NOT_ALLOWED"
  | "NO_SOURCES_RESOLVED";

type ResolvedSummarizeInput = {
  sourceId: string | null;
  sourceIds: string[];
  requestedSourceIds: string[];
  url: string | null;
  urls: string[];
  requestedUrls: string[];
  inputMode: "CATALOG_SOURCE_ID" | "CATALOG_URL" | "SOURCESET_DEFAULTS" | "SOURCESET_FULL_CATALOG" | "UNKNOWN_SOURCE_ID" | "ADHOC_URL";
  requestedSourceSet: string | null;
  sourceSetWasExplicit: boolean;
  sourceSetRegistered: boolean;
  resolvedSourceSet: string;
  registryEntry: SourceSetRegistryEntry | null;
  entries: SourceCatalogEntry[];
  missingSourceIds: string[];
  rejectedUrls: string[];
  catalogSourceSets: string[];
  fetchLive: boolean;
  timeoutMs?: number;
  maxTextChars?: number;
  includeProfiles: boolean;
  includeContextBlock: boolean;
  useFullCatalog: boolean;
  failReason?: SummarizeFailReason;
};

async function readBody(request: NextRequest): Promise<SummarizeBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as SummarizeBody) : {};
  } catch {
    return {};
  }
}

function normalizeOptionalText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeOptionalText).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toPositiveInteger(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
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

function registryEntryForSourceSet(sourceSet: string): SourceSetRegistryEntry | null {
  return getSourceSetRegistryEntry(sourceSet);
}

function unresolvedInput(args: {
  sourceId?: unknown;
  sourceIds?: unknown;
  sourceSet?: unknown;
  url?: unknown;
  urls?: unknown;
  fetchLive?: unknown;
  timeoutMs?: unknown;
  maxTextChars?: unknown;
  includeProfiles?: unknown;
  includeContextBlock?: unknown;
  useFullCatalog?: unknown;
}): Omit<ResolvedSummarizeInput, "entries" | "missingSourceIds" | "rejectedUrls" | "catalogSourceSets" | "resolvedSourceSet" | "registryEntry" | "sourceSetRegistered" | "inputMode"> & {
  requested: ReturnType<typeof resolveRequestedSourceSet>;
} {
  const sourceId = normalizeOptionalText(args.sourceId);
  const sourceIds = normalizeTextList(args.sourceIds);
  if (sourceId) {
    sourceIds.unshift(sourceId);
  }

  const url = normalizeOptionalText(args.url);
  const urls = normalizeTextList(args.urls);
  if (url) {
    urls.unshift(url);
  }

  return {
    sourceId: sourceId || null,
    sourceIds: unique(sourceIds),
    requestedSourceIds: unique(sourceIds),
    url: url || null,
    urls: unique(urls),
    requestedUrls: unique(urls),
    requestedSourceSet: null,
    sourceSetWasExplicit: false,
    fetchLive: toBoolean(args.fetchLive, true),
    timeoutMs: toPositiveInteger(args.timeoutMs),
    maxTextChars: toPositiveInteger(args.maxTextChars),
    includeProfiles: toBoolean(args.includeProfiles, true),
    includeContextBlock: toBoolean(args.includeContextBlock, true),
    useFullCatalog: toBoolean(args.useFullCatalog, false),
    requested: resolveRequestedSourceSet(args.sourceSet)
  };
}

function resolveSourceEntries(args: Parameters<typeof unresolvedInput>[0]): ResolvedSummarizeInput {
  const base = unresolvedInput(args);
  const requested = base.requested;

  const defaultSourceSet = SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID;
  const requestedOrDefaultSourceSet = requested.requestedSourceSet || defaultSourceSet;

  if (requested.sourceSetWasExplicit && !requested.sourceSetRegistered) {
    return {
      ...base,
      requestedSourceSet: requested.requestedSourceSet,
      sourceSetWasExplicit: true,
      sourceSetRegistered: false,
      resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
      registryEntry: null,
      entries: [],
      missingSourceIds: [],
      rejectedUrls: [],
      catalogSourceSets: [],
      inputMode: base.sourceIds.length ? "UNKNOWN_SOURCE_ID" : base.urls.length ? "ADHOC_URL" : "SOURCESET_DEFAULTS",
      failReason: "UNKNOWN_SOURCE_SET"
    };
  }

  const entries: SourceCatalogEntry[] = [];
  const missingSourceIds: string[] = [];
  const rejectedUrls: string[] = [];
  let inputMode: ResolvedSummarizeInput["inputMode"] = "SOURCESET_DEFAULTS";

  if (base.sourceIds.length > 0) {
    inputMode = "CATALOG_SOURCE_ID";
    for (const requestedSourceId of base.sourceIds) {
      const entry = findCatalogEntryById(requestedSourceId);
      if (entry) {
        entries.push(entry);
      } else {
        missingSourceIds.push(requestedSourceId);
      }
    }
  }

  if (base.urls.length > 0) {
    inputMode = entries.length > 0 ? inputMode : "CATALOG_URL";
    for (const requestedUrl of base.urls) {
      const entry = findCatalogEntryByUrl(requestedUrl);
      if (!entry) {
        rejectedUrls.push(requestedUrl);
      } else {
        entries.push(entry);
      }
    }
  }

  if (missingSourceIds.length > 0) {
    return {
      ...base,
      requestedSourceSet: requested.requestedSourceSet,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: requested.sourceSetWasExplicit ? requested.sourceSetRegistered : false,
      resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
      registryEntry: requested.registryEntry,
      entries,
      missingSourceIds,
      rejectedUrls,
      catalogSourceSets: unique(entries.map((entry) => entry.sourceSet)),
      inputMode: "UNKNOWN_SOURCE_ID",
      failReason: "SOURCE_ID_NOT_FOUND"
    };
  }

  if (rejectedUrls.length > 0) {
    const failReason: SummarizeFailReason = requested.sourceSetWasExplicit
      ? "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET"
      : "URL_NOT_REGISTERED_IN_SOURCE_CATALOG";
    return {
      ...base,
      requestedSourceSet: requested.requestedSourceSet,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: requested.sourceSetWasExplicit ? requested.sourceSetRegistered : false,
      resolvedSourceSet: requested.requestedSourceSet || "ADHOC_ALLOWLISTED_SOURCE",
      registryEntry: requested.registryEntry,
      entries,
      missingSourceIds,
      rejectedUrls,
      catalogSourceSets: unique(entries.map((entry) => entry.sourceSet)),
      inputMode: "ADHOC_URL",
      failReason
    };
  }

  if (entries.length === 0) {
    const registryEntry = requested.registryEntry || registryEntryForSourceSet(requestedOrDefaultSourceSet);
    if (!registryEntry) {
      return {
        ...base,
        requestedSourceSet: requested.requestedSourceSet || requestedOrDefaultSourceSet,
        sourceSetWasExplicit: requested.sourceSetWasExplicit,
        sourceSetRegistered: false,
        resolvedSourceSet: requestedOrDefaultSourceSet,
        registryEntry: null,
        entries: [],
        missingSourceIds: [],
        rejectedUrls: [],
        catalogSourceSets: [],
        inputMode: "SOURCESET_DEFAULTS",
        failReason: "UNKNOWN_SOURCE_SET"
      };
    }

    const sourceSetEntries = base.useFullCatalog
      ? getSourcesBySet(registryEntry.sourceSet)
      : getDefaultSourceIdsForSourceSet(registryEntry.sourceSet)
          .map((defaultSourceId) => findCatalogEntryById(defaultSourceId))
          .filter((entry): entry is SourceCatalogEntry => Boolean(entry));

    return {
      ...base,
      requestedSourceSet: requested.requestedSourceSet || registryEntry.sourceSet,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: true,
      resolvedSourceSet: registryEntry.sourceSet,
      registryEntry,
      entries: sourceSetEntries,
      missingSourceIds: [],
      rejectedUrls: [],
      catalogSourceSets: [registryEntry.sourceSet],
      inputMode: base.useFullCatalog ? "SOURCESET_FULL_CATALOG" : "SOURCESET_DEFAULTS",
      failReason: sourceSetEntries.length ? undefined : "NO_SOURCES_RESOLVED"
    };
  }

  const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.sourceId, entry])).values());
  const catalogSourceSets = unique(uniqueEntries.map((entry) => entry.sourceSet));

  if (requested.sourceSetWasExplicit && catalogSourceSets.some((sourceSet) => sourceSet !== requested.requestedSourceSet)) {
    const failReason: SummarizeFailReason = base.urls.length > 0 && base.sourceIds.length === 0
      ? "URL_SOURCESET_MISMATCH"
      : "SOURCE_ID_SOURCESET_MISMATCH";
    const resolvedSourceSet = catalogSourceSets.find((sourceSet) => sourceSet !== requested.requestedSourceSet) || catalogSourceSets[0] || requested.requestedSourceSet || "UNKNOWN_SOURCE_SET";
    return {
      ...base,
      requestedSourceSet: requested.requestedSourceSet,
      sourceSetWasExplicit: true,
      sourceSetRegistered: true,
      resolvedSourceSet,
      registryEntry: requested.registryEntry,
      entries: uniqueEntries,
      missingSourceIds: [],
      rejectedUrls: [],
      catalogSourceSets,
      inputMode,
      failReason
    };
  }

  if (!requested.sourceSetWasExplicit && catalogSourceSets.length > 1) {
    return {
      ...base,
      requestedSourceSet: null,
      sourceSetWasExplicit: false,
      sourceSetRegistered: false,
      resolvedSourceSet: "MIXED_SOURCESETS",
      registryEntry: null,
      entries: uniqueEntries,
      missingSourceIds: [],
      rejectedUrls: [],
      catalogSourceSets,
      inputMode,
      failReason: "MIXED_SOURCESET_INPUT_NOT_ALLOWED"
    };
  }

  const resolvedSourceSet = requested.requestedSourceSet || catalogSourceSets[0] || defaultSourceSet;
  const registryEntry = requested.registryEntry || registryEntryForSourceSet(resolvedSourceSet);

  return {
    ...base,
    requestedSourceSet: requested.requestedSourceSet || resolvedSourceSet,
    sourceSetWasExplicit: requested.sourceSetWasExplicit,
    sourceSetRegistered: Boolean(registryEntry),
    resolvedSourceSet,
    registryEntry,
    entries: uniqueEntries,
    missingSourceIds: [],
    rejectedUrls: [],
    catalogSourceSets,
    inputMode,
    failReason: registryEntry ? undefined : "UNKNOWN_SOURCE_SET"
  };
}

function sourceSetPayload(input: ResolvedSummarizeInput) {
  const registryEntry = input.registryEntry;
  return {
    sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    sourceSetRegistryStatus: SOURCESET_REGISTRY_STATUS_READY,
    requestedSourceSet: input.requestedSourceSet,
    sourceSet: input.resolvedSourceSet,
    sourceSetWasExplicit: input.sourceSetWasExplicit,
    sourceSetRegistered: input.sourceSetRegistered,
    sourceSetStatus: registryEntry?.status || null,
    operationalDomain: registryEntry?.operationalDomain || null,
    riskPosture: registryEntry?.riskPosture || null,
    memoryProfileType: registryEntry?.memoryProfileType || null,
    failClosedOnMissingSource: registryEntry?.failClosedOnMissingSource ?? true,
    expectedMinimumSources: registryEntry?.expectedMinimumSources || null,
    defaultSourceIds: registryEntry?.defaultSourceIds || [],
    defaultSourceCount: registryEntry?.defaultSourceIds.length || 0,
    availableSourceSets: availableSourceSets()
  };
}

function unfetchedProfile(entry: SourceCatalogEntry): SourceProfile {
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

function failureStatusCode(failReason: SummarizeFailReason): number {
  switch (failReason) {
    case "UNKNOWN_SOURCE_SET":
      return 400;
    case "SOURCE_ID_NOT_FOUND":
      return 404;
    case "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED":
      return 403;
    case "SOURCE_ID_SOURCESET_MISMATCH":
    case "URL_SOURCESET_MISMATCH":
    case "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET":
    case "URL_NOT_REGISTERED_IN_SOURCE_CATALOG":
    case "MIXED_SOURCESET_INPUT_NOT_ALLOWED":
    case "NO_SOURCES_RESOLVED":
      return 409;
    default:
      return 400;
  }
}

function profilePublicPayload(profile: SourceProfile) {
  return {
    ...profile,
    textPreview: profile.textPreview.slice(0, 500)
  };
}

function buildOperationalSummary(input: ResolvedSummarizeInput, profiles: SourceProfile[]): string {
  const verified = profiles.filter((profile) => profile.verificationStatus === "SOURCE_VERIFIED");
  const semantic = profiles.filter((profile) => profile.semanticTextReady);
  const pdfBinary = profiles.filter((profile) => profile.contentMode === "PDF_BINARY_HASH_ONLY");
  const risk = profiles.filter((profile) => profile.promptInjectionRisk !== "NONE_DETECTED");
  const lines = [
    "SOURCE_INTELLIGENCE_OPERATIONAL_SUMMARY_READY",
    "revision=" + SOURCE_INTELLIGENCE_REVISION,
    "routeRevision=" + SOURCE_SUMMARIZE_ROUTE_REVISION,
    "sourceSet=" + input.resolvedSourceSet,
    "sourcesRequested=" + String(input.entries.length),
    "sourcesVerified=" + String(verified.length),
    "sourcesSemanticTextReady=" + String(semantic.length),
    "pdfBinaryHashOnlySources=" + String(pdfBinary.length),
    "promptInjectionRiskSources=" + String(risk.length),
    "rawTextPersistence=false",
    "legalCertification=false",
    "OPC=technical proof receipt only",
    "\nCLAIMS:"
  ];

  for (const profile of profiles) {
    lines.push("- [" + profile.sourceId + "] " + profile.canonicalClaim);
  }

  if (pdfBinary.length > 0) {
    lines.push("\nPDF_BOUNDARY:");
    for (const profile of pdfBinary) {
      lines.push("- [" + profile.sourceId + "] PDF_BINARY_HASH_ONLY; semantic extraction not performed in this layer.");
    }
  }

  if (risk.length > 0) {
    lines.push("\nPROMPT_INJECTION_SIGNALS:");
    for (const profile of risk) {
      lines.push("- [" + profile.sourceId + "] " + profile.promptInjectionSignals.join(", "));
    }
  }

  return lines.join("\n");
}

async function runSourceSummarize(input: ResolvedSummarizeInput): Promise<NextResponse> {
  if (input.failReason) {
    return NextResponse.json(
      {
        status: "SOURCE_SUMMARIZE_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_SUMMARIZE_ROUTE_REVISION,
        ...sourceSetPayload(input),
        inputMode: input.inputMode,
        requestedSourceIds: input.requestedSourceIds,
        requestedUrls: input.requestedUrls,
        resolvedSourceIds: input.entries.map((entry) => entry.sourceId),
        catalogSourceSets: input.catalogSourceSets,
        missingSourceIds: input.missingSourceIds,
        rejectedUrls: input.rejectedUrls,
        sourcesRequested: input.entries.length,
        sourcesVerified: 0,
        fetchLive: input.fetchLive,
        failReason: input.failReason,
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: failureStatusCode(input.failReason) }
    );
  }

  const disallowedEntry = input.entries.find((entry) => !isAllowedSourceUrl(entry.url));
  if (disallowedEntry) {
    return NextResponse.json(
      {
        status: "SOURCE_SUMMARIZE_REJECTED",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_SUMMARIZE_ROUTE_REVISION,
        ...sourceSetPayload(input),
        inputMode: input.inputMode,
        sourceId: disallowedEntry.sourceId,
        url: disallowedEntry.url,
        domain: disallowedEntry.domain,
        sourcesRequested: input.entries.length,
        sourcesVerified: 0,
        failReason: "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED",
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 403 }
    );
  }

  const profiles = input.fetchLive
    ? await Promise.all(
        input.entries.map((entry) =>
          fetchSourceProfile({
            url: entry.url,
            timeoutMs: input.timeoutMs,
            maxTextChars: input.maxTextChars
          })
        )
      )
    : input.entries.map(unfetchedProfile);

  const sourcesVerified = profiles.filter((profile) => profile.verificationStatus === "SOURCE_VERIFIED").length;
  const sourcesSemanticTextReady = profiles.filter((profile) => profile.semanticTextReady).length;
  const pdfBinaryHashOnlySources = profiles.filter((profile) => profile.contentMode === "PDF_BINARY_HASH_ONLY").length;
  const promptInjectionRiskSources = profiles.filter((profile) => profile.promptInjectionRisk !== "NONE_DETECTED").length;
  const fetchFailedSources = profiles.filter((profile) => profile.fetchStatus === "FETCH_FAILED").length;
  const fetchBlockedSources = profiles.filter((profile) => profile.fetchStatus === "FETCH_BLOCKED").length;

  const contextBlock = buildSourceContextBlock(profiles);
  const operationalSummary = buildOperationalSummary(input, profiles);

  return NextResponse.json({
    status: "SOURCE_SUMMARY_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    routeRevision: SOURCE_SUMMARIZE_ROUTE_REVISION,
    ...sourceSetPayload(input),
    inputMode: input.inputMode,
    requestedSourceIds: input.requestedSourceIds,
    requestedUrls: input.requestedUrls,
    resolvedSourceIds: input.entries.map((entry) => entry.sourceId),
    catalogSourceSets: input.catalogSourceSets,
    catalogSources: SOURCE_CATALOG_ENTRIES.length,
    catalogSourcesForSourceSet: getSourcesBySet(input.resolvedSourceSet).length,
    fetchLive: input.fetchLive,
    sourcesRequested: input.entries.length,
    sourcesVerified,
    sourcesSemanticTextReady,
    pdfBinaryHashOnlySources,
    promptInjectionRiskSources,
    fetchFailedSources,
    fetchBlockedSources,
    summaryMode: "CATALOG_SOURCE_PROFILE_CONTEXT_ONLY",
    sourceContextBlock: input.includeContextBlock ? contextBlock : undefined,
    operationalSummary,
    sourceProfiles: input.includeProfiles ? profiles.map(profilePublicPayload) : undefined,
    fetchMode: "SERVER_SIDE_CONTROLLED",
    egressPolicy: "ALLOWLIST_ONLY",
    rawTextPersistence: false,
    promptInjectionScreening: "READY",
    sourceHashing: "SHA256_ON_FETCHED_TEXT_OR_BINARY_BODY",
    pdfBoundary: "PDF_BINARY_HASH_ONLY_UNTIL_EXPLICIT_TEXT_EXTRACTION",
    memoryProfilePolicy: "EXPLICIT_OPERATOR_SAVE_ONLY",
    legalCertification: false,
    opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  const input = resolveSourceEntries({
    sourceId: searchParams.get("sourceId"),
    sourceIds: searchParams.get("sourceIds"),
    sourceSet: searchParams.get("sourceSet"),
    url: searchParams.get("url"),
    urls: searchParams.get("urls"),
    fetchLive: searchParams.get("fetchLive"),
    timeoutMs: searchParams.get("timeoutMs"),
    maxTextChars: searchParams.get("maxTextChars"),
    includeProfiles: searchParams.get("includeProfiles"),
    includeContextBlock: searchParams.get("includeContextBlock"),
    useFullCatalog: searchParams.get("useFullCatalog")
  });
  return runSourceSummarize(input);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const input = resolveSourceEntries(body);
  return runSourceSummarize(input);
}
