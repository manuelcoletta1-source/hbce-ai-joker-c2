import { NextRequest, NextResponse } from "next/server";

import {
  getSourceSetRegistryEntry,
  getSourcesBySet,
  listSourceSetRegistry,
  normalizeSourceSetId,
  searchSourceCatalog,
  SOURCE_CATALOG_ENTRIES,
  SOURCE_INTELLIGENCE_BOUNDARY,
  SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
  SOURCE_INTELLIGENCE_REVISION,
  SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION
} from "@/lib/hbce-source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_SEARCH_ROUTE_REVISION = "SOURCE_SEARCH_SOURCESET_REGISTRY_FILTER-v0.3" as const;

type SearchBody = {
  query?: string;
  sourceSet?: string;
  domains?: string[];
  limit?: number;
  includeRegistry?: boolean;
  includeCatalog?: boolean;
};

type ResolvedSearchInput = {
  query: string;
  requestedSourceSet: string;
  sourceSet: string;
  sourceSetWasExplicit: boolean;
  domains: string[];
  limit: number;
  includeRegistry: boolean;
  includeCatalog: boolean;
};

function normalizeSearchQuery(input?: string): string {
  const value = typeof input === "string" ? input.trim() : "";
  return value || "Anthropic Mythos recursive self improvement cyber capability";
}

function normalizeDomains(input?: string[] | string | null): string[] {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];
  return Array.from(
    new Set(
      raw
        .map((domain) => String(domain || "").trim().toLowerCase().replace(/^www\./, ""))
        .filter(Boolean)
    )
  );
}

function normalizeLimit(input?: number | string | null): number {
  const parsed = Number(input || 8);
  if (!Number.isFinite(parsed)) {
    return 8;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), 20);
}

function normalizeBoolean(input: unknown, fallback = false): boolean {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    const normalized = input.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "n"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function sourceSetSummary() {
  return listSourceSetRegistry().map((entry) => ({
    sourceSet: entry.sourceSet,
    label: entry.label,
    operationalDomain: entry.operationalDomain,
    status: entry.status,
    defaultSourceCount: entry.defaultSourceIds.length,
    expectedMinimumSources: entry.expectedMinimumSources,
    riskPosture: entry.riskPosture,
    memoryProfileType: entry.memoryProfileType,
    rawTextPersistence: entry.rawTextPersistence,
    legalCertification: entry.legalCertification,
    opcBoundary: entry.opcBoundary
  }));
}

function resolvePostInput(body: SearchBody): ResolvedSearchInput {
  const explicitSourceSet = typeof body.sourceSet === "string" && body.sourceSet.trim().length > 0;
  const requestedSourceSet = explicitSourceSet ? body.sourceSet!.trim() : SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID;
  return {
    query: normalizeSearchQuery(body.query),
    requestedSourceSet,
    sourceSet: normalizeSourceSetId(requestedSourceSet),
    sourceSetWasExplicit: explicitSourceSet,
    domains: normalizeDomains(body.domains),
    limit: normalizeLimit(body.limit),
    includeRegistry: normalizeBoolean(body.includeRegistry, false),
    includeCatalog: normalizeBoolean(body.includeCatalog, false)
  };
}

function resolveGetInput(request: NextRequest): ResolvedSearchInput {
  const { searchParams } = new URL(request.url);
  const explicitSourceSet = Boolean(searchParams.get("sourceSet")?.trim());
  const requestedSourceSet = searchParams.get("sourceSet")?.trim() || SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID;
  return {
    query: normalizeSearchQuery(searchParams.get("query") || undefined),
    requestedSourceSet,
    sourceSet: normalizeSourceSetId(requestedSourceSet),
    sourceSetWasExplicit: explicitSourceSet,
    domains: normalizeDomains(searchParams.get("domains")),
    limit: normalizeLimit(searchParams.get("limit")),
    includeRegistry: normalizeBoolean(searchParams.get("includeRegistry"), false),
    includeCatalog: normalizeBoolean(searchParams.get("includeCatalog"), false)
  };
}

async function readBody(request: NextRequest): Promise<SearchBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as SearchBody) : {};
  } catch {
    return {};
  }
}

function buildSearchResponse(input: ResolvedSearchInput): NextResponse {
  const registryEntry = getSourceSetRegistryEntry(input.sourceSet);
  if (!registryEntry) {
    return NextResponse.json(
      {
        status: "SOURCE_SEARCH_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_SEARCH_ROUTE_REVISION,
        sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
        sourceSetRegistryStatus: "SOURCESET_REGISTRY_READY",
        requestedSourceSet: input.requestedSourceSet,
        sourceSet: input.sourceSet,
        sourceSetRegistered: false,
        failReason: "UNKNOWN_SOURCE_SET",
        availableSourceSets: listSourceSetRegistry().map((entry) => entry.sourceSet),
        rawTextPersistence: false,
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 400 }
    );
  }

  const catalogSourcesForSourceSet = getSourcesBySet(input.sourceSet);
  const result = searchSourceCatalog({
    query: input.query,
    sourceSet: input.sourceSet,
    domains: input.domains,
    limit: input.limit
  });

  return NextResponse.json({
    status: "SOURCE_SEARCH_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    routeRevision: SOURCE_SEARCH_ROUTE_REVISION,
    sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
    sourceSetRegistryStatus: "SOURCESET_REGISTRY_READY",
    defaultSourceSet: SOURCE_INTELLIGENCE_MYTHOS_SOURCE_SET_ID,
    requestedSourceSet: input.requestedSourceSet,
    sourceSet: input.sourceSet,
    sourceSetWasExplicit: input.sourceSetWasExplicit,
    sourceSetRegistered: true,
    sourceSetStatus: registryEntry.status,
    operationalDomain: registryEntry.operationalDomain,
    riskPosture: registryEntry.riskPosture,
    memoryProfileType: registryEntry.memoryProfileType,
    failClosedOnMissingSource: registryEntry.failClosedOnMissingSource,
    expectedMinimumSources: registryEntry.expectedMinimumSources,
    defaultSourceIds: registryEntry.defaultSourceIds,
    defaultSourceCount: registryEntry.defaultSourceIds.length,
    catalogSourcesForSourceSet: catalogSourcesForSourceSet.length,
    catalogSources: SOURCE_CATALOG_ENTRIES.length,
    query: result.query,
    domains: input.domains,
    domainFilterApplied: input.domains.length > 0,
    limit: input.limit,
    resultCount: result.resultCount,
    results: result.results.map((entry) => ({
      sourceId: entry.sourceId,
      sourceSet: entry.sourceSet,
      title: entry.title,
      url: entry.url,
      domain: entry.domain,
      publisher: entry.publisher,
      trustTier: entry.trustTier,
      topicTags: entry.topicTags,
      canonicalClaim: entry.canonicalClaim,
      relevance: entry.relevance,
      allowlisted: true
    })),
    sourceSetIds: input.includeRegistry ? listSourceSetRegistry().map((entry) => entry.sourceSet) : undefined,
    sourceSetSummary: input.includeRegistry ? sourceSetSummary() : undefined,
    catalog: input.includeCatalog ? catalogSourcesForSourceSet : undefined,
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
  return buildSearchResponse(resolveGetInput(request));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  return buildSearchResponse(resolvePostInput(body));
}
