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

const SOURCE_REGISTER_ROUTE_REVISION = "SOURCE_REGISTER_SOURCESET_REGISTRY_GUARD-v0.3" as const;
const SOURCESET_REGISTRY_STATUS_READY = "SOURCESET_REGISTRY_READY" as const;

type RegisterBody = {
  sourceId?: string;
  sourceSet?: string;
  url?: string;
  persistRawText?: boolean;
  timeoutMs?: number;
  maxTextChars?: number;
};

type RegisterInput = {
  sourceId: string;
  requestedSourceId: string | null;
  url: string;
  inputMode: "CATALOG_SOURCE_ID" | "CATALOG_URL" | "ADHOC_URL" | "UNKNOWN_SOURCE_ID";
  requestedSourceSet: string | null;
  sourceSetWasExplicit: boolean;
  sourceSetRegistered: boolean;
  resolvedSourceSet: string;
  registryEntry: SourceSetRegistryEntry | null;
  catalogEntry: SourceCatalogEntry | null;
  persistRawTextRequested: boolean;
  failReason?:
    | "UNKNOWN_SOURCE_SET"
    | "SOURCE_ID_NOT_FOUND"
    | "SOURCE_ID_SOURCESET_MISMATCH"
    | "URL_SOURCESET_MISMATCH"
    | "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET"
    | "URL_NOT_REGISTERED_IN_SOURCE_CATALOG";
  timeoutMs?: number;
  maxTextChars?: number;
};

async function readBody(request: NextRequest): Promise<RegisterBody> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as RegisterBody) : {};
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

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  }
  return false;
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
  persistRawText?: unknown;
  timeoutMs?: unknown;
  maxTextChars?: unknown;
}): RegisterInput | null {
  const sourceId = normalizeOptionalText(args.sourceId);
  const directUrl = normalizeOptionalText(args.url);
  const requested = resolveRequestedSourceSet(args.sourceSet);
  const persistRawTextRequested = toBoolean(args.persistRawText);
  const timeoutMs = toPositiveInteger(args.timeoutMs);
  const maxTextChars = toPositiveInteger(args.maxTextChars);

  if (requested.sourceSetWasExplicit && !requested.sourceSetRegistered) {
    return {
      sourceId: sourceId || "NO_SOURCE_ID",
      requestedSourceId: sourceId || null,
      url: directUrl,
      inputMode: sourceId ? "UNKNOWN_SOURCE_ID" : directUrl ? "ADHOC_URL" : "UNKNOWN_SOURCE_ID",
      requestedSourceSet: requested.requestedSourceSet,
      sourceSetWasExplicit: true,
      sourceSetRegistered: false,
      resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
      registryEntry: null,
      catalogEntry: null,
      persistRawTextRequested,
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
        requestedSourceId: sourceId,
        url: "",
        inputMode: "UNKNOWN_SOURCE_ID",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: requested.sourceSetWasExplicit,
        sourceSetRegistered: requested.sourceSetWasExplicit ? requested.sourceSetRegistered : false,
        resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
        registryEntry: requested.registryEntry,
        catalogEntry: null,
        persistRawTextRequested,
        failReason: "SOURCE_ID_NOT_FOUND",
        timeoutMs,
        maxTextChars
      };
    }

    const entryRegistry = registryEntryForCatalogEntry(entry);
    if (requested.sourceSetWasExplicit && requested.requestedSourceSet !== entry.sourceSet) {
      return {
        sourceId: entry.sourceId,
        requestedSourceId: sourceId,
        url: entry.url,
        inputMode: "CATALOG_SOURCE_ID",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: true,
        sourceSetRegistered: true,
        resolvedSourceSet: entry.sourceSet,
        registryEntry: requested.registryEntry,
        catalogEntry: entry,
        persistRawTextRequested,
        failReason: "SOURCE_ID_SOURCESET_MISMATCH",
        timeoutMs,
        maxTextChars
      };
    }

    return {
      sourceId: entry.sourceId,
      requestedSourceId: sourceId,
      url: entry.url,
      inputMode: "CATALOG_SOURCE_ID",
      requestedSourceSet: requested.requestedSourceSet || entry.sourceSet,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: Boolean(entryRegistry),
      resolvedSourceSet: entry.sourceSet,
      registryEntry: entryRegistry,
      catalogEntry: entry,
      persistRawTextRequested,
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
        requestedSourceId: null,
        url: entry.url,
        inputMode: "CATALOG_URL",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: true,
        sourceSetRegistered: true,
        resolvedSourceSet: entry.sourceSet,
        registryEntry: requested.registryEntry,
        catalogEntry: entry,
        persistRawTextRequested,
        failReason: "URL_SOURCESET_MISMATCH",
        timeoutMs,
        maxTextChars
      };
    }

    if (requested.sourceSetWasExplicit && !entry) {
      return {
        sourceId: "ADHOC_URL",
        requestedSourceId: null,
        url: directUrl,
        inputMode: "ADHOC_URL",
        requestedSourceSet: requested.requestedSourceSet,
        sourceSetWasExplicit: true,
        sourceSetRegistered: true,
        resolvedSourceSet: requested.requestedSourceSet || "UNKNOWN_SOURCE_SET",
        registryEntry: requested.registryEntry,
        catalogEntry: null,
        persistRawTextRequested,
        failReason: "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET",
        timeoutMs,
        maxTextChars
      };
    }

    if (!entry) {
      return {
        sourceId: "ADHOC_URL",
        requestedSourceId: null,
        url: directUrl,
        inputMode: "ADHOC_URL",
        requestedSourceSet: null,
        sourceSetWasExplicit: false,
        sourceSetRegistered: false,
        resolvedSourceSet: "ADHOC_ALLOWLISTED_SOURCE",
        registryEntry: null,
        catalogEntry: null,
        persistRawTextRequested,
        failReason: "URL_NOT_REGISTERED_IN_SOURCE_CATALOG",
        timeoutMs,
        maxTextChars
      };
    }

    return {
      sourceId: entry.sourceId,
      requestedSourceId: null,
      url: entry.url,
      inputMode: "CATALOG_URL",
      requestedSourceSet: requested.requestedSourceSet || entry.sourceSet,
      sourceSetWasExplicit: requested.sourceSetWasExplicit,
      sourceSetRegistered: Boolean(entryRegistry),
      resolvedSourceSet: entry.sourceSet,
      registryEntry: entryRegistry,
      catalogEntry: entry,
      persistRawTextRequested,
      timeoutMs,
      maxTextChars
    };
  }

  return null;
}

function sourceSetPayload(input: RegisterInput | null) {
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

function rawTextPolicyPayload(input: RegisterInput | null) {
  const requested = input?.persistRawTextRequested || false;
  return {
    persistenceMode: "PROFILE_ONLY_NO_RAW_TEXT",
    profileRegistrationMode: "CATALOG_SOURCE_PROFILE_ONLY",
    rawTextPersistenceRequested: requested,
    rawTextPersistenceApplied: false,
    rawTextPersistenceBlocked: requested,
    rawTextPersistenceBlockReason: requested ? "RAW_TEXT_PERSISTENCE_NOT_ALLOWED_IN_SOURCE_REGISTER_ROUTE" : null,
    rawTextPersistence: false
  };
}

function failureStatusCode(failReason: RegisterInput["failReason"]): number {
  switch (failReason) {
    case "UNKNOWN_SOURCE_SET":
      return 400;
    case "SOURCE_ID_NOT_FOUND":
      return 404;
    case "SOURCE_ID_SOURCESET_MISMATCH":
    case "URL_SOURCESET_MISMATCH":
    case "URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET":
    case "URL_NOT_REGISTERED_IN_SOURCE_CATALOG":
      return 409;
    default:
      return 400;
  }
}

async function runSourceRegister(input: RegisterInput | null): Promise<NextResponse> {
  if (!input) {
    return NextResponse.json(
      {
        status: "SOURCE_REGISTER_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_REGISTER_ROUTE_REVISION,
        sourceSetRegistryRevision: SOURCE_INTELLIGENCE_SOURCESET_REGISTRY_REVISION,
        sourceSetRegistryStatus: SOURCESET_REGISTRY_STATUS_READY,
        failReason: "MISSING_SOURCE_ID_OR_URL",
        acceptedInputs: ["sourceId", "url", "sourceSet", "persistRawText"],
        browserExample: "/api/sources/register?sourceSet=EU_AI_GOVERNANCE_REGULATORY_STACK&sourceId=SRC-EU-AI-OFFICE-2026",
        ...rawTextPolicyPayload(input),
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 400 }
    );
  }

  if (input.failReason) {
    return NextResponse.json(
      {
        status: "SOURCE_REGISTER_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_REGISTER_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        requestedSourceId: input.requestedSourceId,
        url: input.url || null,
        inputMode: input.inputMode,
        catalogSourceId: input.catalogEntry?.sourceId || null,
        catalogSourceSet: input.catalogEntry?.sourceSet || null,
        sourceProfilePersistable: false,
        sourceProfilePersisted: false,
        receiptCreated: false,
        failReason: input.failReason,
        ...rawTextPolicyPayload(input),
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: failureStatusCode(input.failReason) }
    );
  }

  if (!input.url || !input.catalogEntry) {
    return NextResponse.json(
      {
        status: "SOURCE_REGISTER_FAIL",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_REGISTER_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        requestedSourceId: input.requestedSourceId,
        url: input.url || null,
        inputMode: input.inputMode,
        sourceProfilePersistable: false,
        sourceProfilePersisted: false,
        receiptCreated: false,
        failReason: "SOURCE_NOT_REGISTRABLE_WITHOUT_CATALOG_ENTRY",
        ...rawTextPolicyPayload(input),
        legalCertification: false,
        opcBoundary: SOURCE_INTELLIGENCE_BOUNDARY
      },
      { status: 409 }
    );
  }

  if (!isAllowedSourceUrl(input.url)) {
    return NextResponse.json(
      {
        status: "SOURCE_REGISTER_REJECTED",
        revision: SOURCE_INTELLIGENCE_REVISION,
        routeRevision: SOURCE_REGISTER_ROUTE_REVISION,
        ...sourceSetPayload(input),
        sourceId: input.sourceId,
        requestedSourceId: input.requestedSourceId,
        url: input.url,
        inputMode: input.inputMode,
        sourceProfilePersistable: false,
        sourceProfilePersisted: false,
        receiptCreated: false,
        failReason: "URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED",
        ...rawTextPolicyPayload(input),
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
  const sourceProfilePersistable = profile.verificationStatus === "SOURCE_VERIFIED" && input.catalogEntry.sourceSet === input.resolvedSourceSet;

  return NextResponse.json({
    status: sourceProfilePersistable ? "SOURCE_PROFILE_REGISTER_READY" : "SOURCE_PROFILE_REGISTER_NOT_READY",
    revision: SOURCE_INTELLIGENCE_REVISION,
    routeRevision: SOURCE_REGISTER_ROUTE_REVISION,
    ...sourceSetPayload(input),
    sourceId: profile.sourceId,
    requestedSourceId: input.requestedSourceId,
    catalogSourceId: input.catalogEntry.sourceId,
    catalogSourceSet: input.catalogEntry.sourceSet,
    inputMode: input.inputMode,
    url: profile.url,
    domain: profile.domain,
    fetchStatus: profile.fetchStatus,
    verificationStatus: profile.verificationStatus,
    sourceHash: profile.sourceHash,
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
    sourceProfilePersistable,
    sourceProfilePersisted: false,
    sourceProfilePersistenceTarget: "OPERATOR_EXPLICIT_SAVE_OR_DATABASE_ROUTE_REQUIRED",
    receiptCreated: true,
    receipt,
    ...rawTextPolicyPayload(input),
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
    persistRawText: searchParams.get("persistRawText"),
    timeoutMs: searchParams.get("timeoutMs"),
    maxTextChars: searchParams.get("maxTextChars")
  });
  return runSourceRegister(input);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readBody(request);
  const input = buildInputFromSourceIdOrUrl(body);
  return runSourceRegister(input);
}
