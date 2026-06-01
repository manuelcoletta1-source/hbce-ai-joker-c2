import { NextRequest, NextResponse } from "next/server";

import {
  ensureHbceDatabaseReady,
  listIprChatMemorySavesFromDatabase,
  listIprMemoryRecordsFromDatabase,
  listRegisteredMemoryEventsFromDatabase,
  listDocumentProfilesFromDatabase,
  toPublicIprChatMemorySave,
  toPublicIprMemoryRecord,
  toPublicDocumentProfile,
  toPublicRegisteredMemoryEvent
} from "@/lib/ipr-database";
import {
  HBCE_DATABASE_PERSISTENCE_MODE,
  HBCE_DATABASE_SCHEMA_VERSION,
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID
} from "@/lib/ipr-database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_NAME = "HBCE IPR Memory Records Route";
const ROUTE_VERSION = "HBCE-IPR-MEMORY-RECORDS-v1.2-UNLINKED_DOCUMENT_PROFILE_VISIBILITY";
const RECORDS_ROUTE_REVISION = ROUTE_VERSION;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

type JsonRecord = Record<string, unknown>;

type RecordsRouteInput = {
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  sourceThreadId?: string | null;
  savedChatId?: string | null;
  sourceSavedChatId?: string | null;
  memoryId?: string | null;
  classification?: string | null;
  memoryStatus?: string | null;
  reusableInPrompt?: boolean | string | number | null;
  includeInactive?: boolean | string | number | null;
  includeMemorySaves?: boolean | string | number | null;
  includeRegisteredEvents?: boolean | string | number | null;
  includeDocumentProfiles?: boolean | string | number | null;
  onlyLinkedDocumentProfiles?: boolean | string | number | null;
  includeUnlinkedDocumentProfiles?: boolean | string | number | null;
  activeFilename?: string | null;
  activeFileHash?: string | null;
  expectedDocumentTitle?: string | null;
  expectedDocumentVolume?: string | null;
  expectedDocFamily?: string | null;
  strictIdentity?: boolean | string | number | null;
  limit?: number | string | null;
};

type RecordsRouteContext = {
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string | null;
  sourceThreadId: string | null;
  sourceSavedChatId: string | null;
  memoryId: string | null;
  classification: string | null;
  memoryStatus: string | null;
  reusableInPrompt: boolean | null;
  includeMemorySaves: boolean;
  includeRegisteredEvents: boolean;
  includeDocumentProfiles: boolean;
  onlyLinkedDocumentProfiles: boolean;
  includeUnlinkedDocumentProfiles: boolean;
  activeFilename: string | null;
  activeFileHash: string | null;
  expectedDocumentTitle: string | null;
  expectedDocumentVolume: string | null;
  expectedDocFamily: string | null;
  strictIdentity: boolean;
  limit: number;
};

function jsonResponse(payload: JsonRecord, init?: ResponseInit) {
  return NextResponse.json(
    {
      ...payload,
      route: ROUTE_NAME,
      routeVersion: ROUTE_VERSION,
      recordsRouteRevision: RECORDS_ROUTE_REVISION,
      schemaVersion: HBCE_DATABASE_SCHEMA_VERSION,
      persistenceMode: HBCE_DATABASE_PERSISTENCE_MODE,
      legalCertification: false,
      boundary:
        "IPR memory records retrieval is a read-only SaaS endpoint. It does not create legal certification, does not create new memory and does not replace official identity, public authority or trust-service workflows."
    },
    init
  );
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUpperString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function readHeaderString(request: NextRequest, name: string): string | null {
  return normalizeString(request.headers.get(name));
}

function readSearchString(searchParams: URLSearchParams, name: string): string | null {
  return normalizeString(searchParams.get(name));
}

function coalesceString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = normalizeString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function coalesceBoolean(defaultValue: boolean, ...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "y", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "n", "off"].includes(normalized)) {
        return false;
      }
    }
  }

  return defaultValue;
}

function coalesceOptionalBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["any", "all", "null", "none", "*"] .includes(normalized)) {
        return null;
      }
      if (["1", "true", "yes", "y", "on"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "n", "off"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

function clampLimit(value: unknown, fallback: number, max: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.round(parsed)));
}

function readInputFromSearchParams(searchParams: URLSearchParams): RecordsRouteInput {
  return {
    humanIpr: readSearchString(searchParams, "humanIpr"),
    tenantId: readSearchString(searchParams, "tenantId"),
    workspaceId: readSearchString(searchParams, "workspaceId"),
    sessionId: readSearchString(searchParams, "sessionId"),
    threadId: readSearchString(searchParams, "threadId"),
    sourceThreadId: readSearchString(searchParams, "sourceThreadId"),
    savedChatId: readSearchString(searchParams, "savedChatId"),
    sourceSavedChatId: readSearchString(searchParams, "sourceSavedChatId"),
    memoryId: readSearchString(searchParams, "memoryId"),
    classification: readSearchString(searchParams, "classification"),
    memoryStatus: readSearchString(searchParams, "memoryStatus"),
    reusableInPrompt: searchParams.get("reusableInPrompt"),
    includeInactive: searchParams.get("includeInactive"),
    includeMemorySaves: searchParams.get("includeMemorySaves"),
    includeRegisteredEvents: searchParams.get("includeRegisteredEvents"),
    includeDocumentProfiles: searchParams.get("includeDocumentProfiles"),
    onlyLinkedDocumentProfiles: searchParams.get("onlyLinkedDocumentProfiles"),
    includeUnlinkedDocumentProfiles: searchParams.get("includeUnlinkedDocumentProfiles"),
    activeFilename: readSearchString(searchParams, "activeFilename") ?? readSearchString(searchParams, "filename"),
    activeFileHash: readSearchString(searchParams, "activeFileHash") ?? readSearchString(searchParams, "fileHash"),
    expectedDocumentTitle: readSearchString(searchParams, "expectedDocumentTitle") ?? readSearchString(searchParams, "documentTitle"),
    expectedDocumentVolume: readSearchString(searchParams, "expectedDocumentVolume") ?? readSearchString(searchParams, "documentVolume") ?? readSearchString(searchParams, "volume"),
    expectedDocFamily: readSearchString(searchParams, "expectedDocFamily") ?? readSearchString(searchParams, "docFamily"),
    strictIdentity: searchParams.get("strictIdentity") ?? searchParams.get("strict"),
    limit: searchParams.get("limit")
  };
}

async function readInputFromRequest(request: NextRequest): Promise<RecordsRouteInput> {
  const searchInput = readInputFromSearchParams(new URL(request.url).searchParams);

  if (request.method !== "POST") {
    return searchInput;
  }

  try {
    const body = (await request.json()) as Partial<RecordsRouteInput> | null;
    if (!body || typeof body !== "object") {
      return searchInput;
    }

    return {
      ...searchInput,
      ...body
    };
  } catch {
    return searchInput;
  }
}

function resolveContext(request: NextRequest, input: RecordsRouteInput): RecordsRouteContext {
  const strictIdentity = coalesceBoolean(false, input.strictIdentity);
  const includeInactive = coalesceBoolean(false, input.includeInactive);

  const humanIpr = coalesceString(
    input.humanIpr,
    readHeaderString(request, "x-hbce-human-ipr"),
    readHeaderString(request, "x-ipr-human"),
    strictIdentity ? null : HBCE_SELF_PILOT_HUMAN_IPR
  );

  const tenantId = coalesceString(
    input.tenantId,
    readHeaderString(request, "x-hbce-tenant-id"),
    strictIdentity ? null : HBCE_SELF_PILOT_TENANT_ID
  );

  const workspaceId = coalesceString(
    input.workspaceId,
    readHeaderString(request, "x-hbce-workspace-id"),
    strictIdentity ? null : HBCE_SELF_PILOT_WORKSPACE_ID
  );

  const explicitMemoryStatus = normalizeUpperString(input.memoryStatus);

  return {
    humanIpr,
    tenantId,
    workspaceId,
    sessionId: coalesceString(input.sessionId, readHeaderString(request, "x-hbce-session-id")),
    sourceThreadId: coalesceString(input.sourceThreadId, input.threadId),
    sourceSavedChatId: coalesceString(input.sourceSavedChatId, input.savedChatId),
    memoryId: coalesceString(input.memoryId),
    classification: normalizeUpperString(input.classification),
    memoryStatus: includeInactive ? explicitMemoryStatus : explicitMemoryStatus || "ACTIVE",
    reusableInPrompt: coalesceOptionalBoolean(input.reusableInPrompt),
    includeMemorySaves: coalesceBoolean(true, input.includeMemorySaves),
    includeRegisteredEvents: coalesceBoolean(true, input.includeRegisteredEvents),
    includeDocumentProfiles: coalesceBoolean(true, input.includeDocumentProfiles),
    onlyLinkedDocumentProfiles: coalesceBoolean(false, input.onlyLinkedDocumentProfiles),
    includeUnlinkedDocumentProfiles: coalesceBoolean(true, input.includeUnlinkedDocumentProfiles),
    activeFilename: coalesceString(input.activeFilename),
    activeFileHash: coalesceString(input.activeFileHash),
    expectedDocumentTitle: coalesceString(input.expectedDocumentTitle),
    expectedDocumentVolume: coalesceString(input.expectedDocumentVolume),
    expectedDocFamily: coalesceString(input.expectedDocFamily),
    strictIdentity,
    limit: clampLimit(input.limit, DEFAULT_LIMIT, MAX_LIMIT)
  };
}

function getPublicString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPublicBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function matchesOptionalString(value: string | null, expected: string | null): boolean {
  return !expected || value === expected;
}

function filterPublicMemoryRecords(
  records: Record<string, unknown>[],
  context: RecordsRouteContext
): Record<string, unknown>[] {
  return records.filter((record) => {
    const memoryId = getPublicString(record, "memoryId");
    const classification = normalizeUpperString(getPublicString(record, "classification"));
    const sessionId = getPublicString(record, "sessionId");
    const reusableInPrompt = getPublicBoolean(record, "reusableInPrompt");

    return (
      matchesOptionalString(memoryId, context.memoryId) &&
      matchesOptionalString(classification, context.classification) &&
      matchesOptionalString(sessionId, context.sessionId) &&
      (context.reusableInPrompt === null || reusableInPrompt === context.reusableInPrompt)
    );
  });
}

function filterPublicMemorySaves(
  saves: Record<string, unknown>[],
  context: RecordsRouteContext
): Record<string, unknown>[] {
  return saves.filter((save) => {
    const memoryId = getPublicString(save, "memoryId");
    const savedChatId = getPublicString(save, "savedChatId");
    const sessionId = getPublicString(save, "sessionId");
    const classification = normalizeUpperString(getPublicString(save, "classification"));

    return (
      matchesOptionalString(memoryId, context.memoryId) &&
      matchesOptionalString(savedChatId, context.sourceSavedChatId) &&
      matchesOptionalString(sessionId, context.sessionId) &&
      matchesOptionalString(classification, context.classification)
    );
  });
}

function filterPublicRegisteredEvents(
  events: Record<string, unknown>[],
  context: RecordsRouteContext,
  allowedMemoryIds: Set<string>
): Record<string, unknown>[] {
  return events.filter((event) => {
    const memoryId = getPublicString(event, "memoryId");
    const sessionId = getPublicString(event, "sessionId");

    return (
      (!context.memoryId || memoryId === context.memoryId) &&
      (!allowedMemoryIds.size || (memoryId ? allowedMemoryIds.has(memoryId) : false)) &&
      matchesOptionalString(sessionId, context.sessionId)
    );
  });
}


function normalizeProfileSearchValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).toUpperCase();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeProfileSearchValue).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(normalizeProfileSearchValue).join(" ");
  }

  return "";
}

function profileSearchText(profile: Record<string, unknown>): string {
  return normalizeProfileSearchValue(profile);
}

function profileMatchesText(profile: Record<string, unknown>, expected: string | null): boolean {
  if (!expected) {
    return false;
  }

  return profileSearchText(profile).includes(expected.toUpperCase());
}

function profileMatchesActiveDocumentHints(profile: Record<string, unknown>, context: RecordsRouteContext): boolean {
  return (
    profileMatchesText(profile, context.activeFilename) ||
    profileMatchesText(profile, context.activeFileHash) ||
    profileMatchesText(profile, context.expectedDocumentTitle) ||
    profileMatchesText(profile, context.expectedDocumentVolume) ||
    profileMatchesText(profile, context.expectedDocFamily)
  );
}

function isAlienCodeVolumeFourProfile(profile: Record<string, unknown>): boolean {
  const text = profileSearchText(profile);
  const title = normalizeProfileSearchValue(profile.title);
  const volume = normalizeProfileSearchValue(profile.volume);
  const filename = normalizeProfileSearchValue(profile.filename);
  const fileName = normalizeProfileSearchValue(profile.fileName);
  const summary = normalizeProfileSearchValue(profile.summary);
  const combinedFilename = `${filename} ${fileName}`;

  const hasAlienCode =
    text.includes("ALIEN CODE") ||
    text.includes("CODICE ALIENO") ||
    text.includes("COD 1") ||
    title.includes("ALIEN") ||
    summary.includes("ALIEN");

  const hasVolumeFour =
    volume === "V4" ||
    volume === "IV" ||
    volume.includes("V4") ||
    volume.includes("VOLUME IV") ||
    text.includes("VOLUME IV") ||
    combinedFilename.includes("4D.4D") ||
    combinedFilename.includes("V4");

  return hasAlienCode && hasVolumeFour;
}

function buildDocumentProfileVisibilityReport(
  allProfiles: Record<string, unknown>[],
  visibleProfiles: Record<string, unknown>[],
  context: RecordsRouteContext,
  allowedMemoryIds: Set<string>
) {
  const visibleProfileIds = new Set(
    visibleProfiles
      .map((profile) => getPublicString(profile, "profileId") ?? getPublicString(profile, "documentProfileId"))
      .filter((profileId): profileId is string => Boolean(profileId))
  );

  const hiddenProfiles = allProfiles.filter((profile) => {
    const profileId = getPublicString(profile, "profileId") ?? getPublicString(profile, "documentProfileId");
    return profileId ? !visibleProfileIds.has(profileId) : !visibleProfiles.includes(profile);
  });

  const unlinkedProfiles = allProfiles.filter((profile) => !getPublicString(profile, "memoryId"));
  const linkedProfiles = allProfiles.filter((profile) => Boolean(getPublicString(profile, "memoryId")));
  const hiddenUnlinkedProfiles = hiddenProfiles.filter((profile) => !getPublicString(profile, "memoryId"));
  const alienCodeVolumeFourProfiles = allProfiles.filter(isAlienCodeVolumeFourProfile);
  const visibleAlienCodeVolumeFourProfiles = visibleProfiles.filter(isAlienCodeVolumeFourProfile);
  const activeDocumentHintProfiles = allProfiles.filter((profile) => profileMatchesActiveDocumentHints(profile, context));

  return {
    routeRevision: RECORDS_ROUTE_REVISION,
    status: allProfiles.length > 0 ? "AVAILABLE" : "NO_DOCUMENT_PROFILES",
    includeUnlinkedDocumentProfiles: context.includeUnlinkedDocumentProfiles,
    onlyLinkedDocumentProfiles: context.onlyLinkedDocumentProfiles,
    allowedMemoryIdCount: allowedMemoryIds.size,
    allProfileCount: allProfiles.length,
    visibleProfileCount: visibleProfiles.length,
    linkedProfileCount: linkedProfiles.length,
    unlinkedProfileCount: unlinkedProfiles.length,
    hiddenProfileCount: hiddenProfiles.length,
    hiddenUnlinkedProfileCount: hiddenUnlinkedProfiles.length,
    activeDocumentHintProfileCount: activeDocumentHintProfiles.length,
    alienCodeVolumeFour: {
      status:
        visibleAlienCodeVolumeFourProfiles.length > 0
          ? "VISIBLE"
          : alienCodeVolumeFourProfiles.length > 0
            ? "HIDDEN_BY_RECORDS_FILTER"
            : "NOT_FOUND",
      allCount: alienCodeVolumeFourProfiles.length,
      visibleCount: visibleAlienCodeVolumeFourProfiles.length,
      profiles: alienCodeVolumeFourProfiles
    },
    hiddenProfiles
  };
}

function filterPublicDocumentProfiles(
  profiles: Record<string, unknown>[],
  context: RecordsRouteContext,
  allowedMemoryIds: Set<string>
): Record<string, unknown>[] {
  return profiles.filter((profile) => {
    const memoryId = getPublicString(profile, "memoryId");
    const sourceSavedChatId = getPublicString(profile, "sourceSavedChatId");
    const sessionId = getPublicString(profile, "sessionId");
    const reusableInPrompt = getPublicBoolean(profile, "reusableInPrompt");

    const matchesActiveDocumentHints = profileMatchesActiveDocumentHints(profile, context);
    const includeUnlinked =
      context.includeUnlinkedDocumentProfiles ||
      matchesActiveDocumentHints ||
      isAlienCodeVolumeFourProfile(profile);

    return (
      (!context.memoryId || memoryId === context.memoryId || includeUnlinked) &&
      (!context.sourceSavedChatId || sourceSavedChatId === context.sourceSavedChatId || includeUnlinked) &&
      (!context.sessionId || sessionId === context.sessionId || includeUnlinked) &&
      (!context.onlyLinkedDocumentProfiles || includeUnlinked || Boolean(memoryId)) &&
      (!allowedMemoryIds.size || includeUnlinked || !memoryId || allowedMemoryIds.has(memoryId)) &&
      (context.reusableInPrompt === null || reusableInPrompt === context.reusableInPrompt)
    );
  });
}

function buildDocumentRegistrySummary(documentProfiles: Record<string, unknown>[]) {
  const linkedProfiles = documentProfiles.filter((profile) => Boolean(getPublicString(profile, "memoryId")));
  const reusableProfiles = documentProfiles.filter((profile) => getPublicBoolean(profile, "reusableInPrompt") === true);

  return {
    status: documentProfiles.length > 0 ? "AVAILABLE" : "NO_DOCUMENT_PROFILES",
    table: "document_profiles",
    rowCount: documentProfiles.length,
    profileCount: documentProfiles.length,
    linkedProfileCount: linkedProfiles.length,
    linkedMemoryCount: linkedProfiles.length,
    reusableCount: reusableProfiles.length,
    legalCertification: false,
    opc: "technical proof receipt only",
    profiles: documentProfiles
  };
}

async function buildRecordsPayload(request: NextRequest) {
  const input = await readInputFromRequest(request);
  const context = resolveContext(request, input);

  if (context.strictIdentity && !context.humanIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_IDENTITY_REQUIRED",
        error:
          "humanIpr is required when strictIdentity=true. The records route refuses unbound memory reads in strict B2G mode.",
        context: {
          humanIpr: null,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          strictIdentity: true
        }
      },
      { status: 400 }
    );
  }

  const databaseReady = await ensureHbceDatabaseReady();

  if (!databaseReady.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "DATABASE_NOT_READY",
        error:
          databaseReady.initialization.error ||
          "HBCE database is not ready for persistent IPR memory records retrieval.",
        database: {
          description: databaseReady.description,
          initialization: {
            ok: databaseReady.initialization.ok,
            status: databaseReady.initialization.status,
            rowCount: databaseReady.initialization.rowCount,
            error: databaseReady.initialization.error,
            durationMs: databaseReady.initialization.durationMs
          }
        }
      },
      { status: 503 }
    );
  }

  const memoryResult = await listIprMemoryRecordsFromDatabase({
    humanIpr: context.humanIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    sourceThreadId: context.sourceThreadId,
    sourceSavedChatId: context.sourceSavedChatId,
    reusableInPrompt: context.reusableInPrompt,
    memoryStatus: context.memoryStatus,
    limit: context.limit
  });

  if (!memoryResult.ok) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORDS_QUERY_FAILED",
        error: memoryResult.error || "Unable to query persistent IPR memory records.",
        database: {
          status: memoryResult.status,
          sqlHash: memoryResult.sqlHash,
          durationMs: memoryResult.durationMs
        }
      },
      { status: 500 }
    );
  }

  const memoryRecords = filterPublicMemoryRecords(
    memoryResult.rows.map(toPublicIprMemoryRecord),
    context
  );

  const allowedMemoryIds = new Set(
    memoryRecords
      .map((record) => getPublicString(record, "memoryId"))
      .filter((memoryId): memoryId is string => Boolean(memoryId))
  );

  const memorySavesResult = context.includeMemorySaves
    ? await listIprChatMemorySavesFromDatabase({
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        threadId: context.sourceThreadId,
        limit: context.limit
      })
    : null;

  const registeredEventsResult = context.includeRegisteredEvents
    ? await listRegisteredMemoryEventsFromDatabase({
        memoryId: context.memoryId,
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        limit: context.limit
      })
    : null;

  const documentProfilesResult = context.includeDocumentProfiles
    ? await listDocumentProfilesFromDatabase({
        humanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        includeSoftDeleted: false,
        limit: context.limit
      })
    : null;

  const memorySaves = memorySavesResult?.ok
    ? filterPublicMemorySaves(memorySavesResult.rows.map(toPublicIprChatMemorySave), context)
    : [];

  const registeredEvents = registeredEventsResult?.ok
    ? filterPublicRegisteredEvents(
        registeredEventsResult.rows.map(toPublicRegisteredMemoryEvent),
        context,
        allowedMemoryIds
      )
    : [];

  const allPublicDocumentProfiles = documentProfilesResult?.ok
    ? documentProfilesResult.rows.map(toPublicDocumentProfile)
    : [];

  const publicDocumentProfiles = documentProfilesResult?.ok
    ? filterPublicDocumentProfiles(
        allPublicDocumentProfiles,
        context,
        allowedMemoryIds
      )
    : [];

  const linkedDocumentProfiles = publicDocumentProfiles.filter((profile) => Boolean(getPublicString(profile, "memoryId")));
  const documentRegistry = buildDocumentRegistrySummary(publicDocumentProfiles);
  const documentProfileVisibility = buildDocumentProfileVisibilityReport(
    allPublicDocumentProfiles,
    publicDocumentProfiles,
    context,
    allowedMemoryIds
  );

  return jsonResponse({
    ok: true,
    status: "IPR_MEMORY_RECORDS_RETRIEVED",
    context: {
      humanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      sessionId: context.sessionId,
      sourceThreadId: context.sourceThreadId,
      sourceSavedChatId: context.sourceSavedChatId,
      memoryId: context.memoryId,
      classification: context.classification,
      memoryStatus: context.memoryStatus,
      reusableInPrompt: context.reusableInPrompt,
      includeMemorySaves: context.includeMemorySaves,
      includeRegisteredEvents: context.includeRegisteredEvents,
      includeDocumentProfiles: context.includeDocumentProfiles,
      onlyLinkedDocumentProfiles: context.onlyLinkedDocumentProfiles,
      includeUnlinkedDocumentProfiles: context.includeUnlinkedDocumentProfiles,
      activeFilename: context.activeFilename,
      activeFileHash: context.activeFileHash,
      expectedDocumentTitle: context.expectedDocumentTitle,
      expectedDocumentVolume: context.expectedDocumentVolume,
      expectedDocFamily: context.expectedDocFamily,
      strictIdentity: context.strictIdentity,
      limit: context.limit
    },
    iprMeaning: {
      identityPrimaryRecord:
        "The verified operational identity chain binding subject, tenant, workspace, runtime, EVT, OPC and audit.",
      intenzionePrimariaRadicale:
        "The primary radical intention selected from an explicitly saved chat and stored as a reusable memory synthesis, not as uncontrolled raw chat accumulation."
    },
    counts: {
      memoryRecords: memoryRecords.length,
      memorySaves: memorySaves.length,
      registeredEvents: registeredEvents.length,
      documentProfiles: publicDocumentProfiles.length,
      documentProfilesAll: allPublicDocumentProfiles.length,
      linkedDocumentProfiles: linkedDocumentProfiles.length,
      unlinkedDocumentProfiles: documentProfileVisibility.unlinkedProfileCount,
      hiddenDocumentProfiles: documentProfileVisibility.hiddenProfileCount
    },
    documentRegistry: {
      ...documentRegistry,
      visibility: documentProfileVisibility
    },
    documentProfileVisibility,
    documentProfiles: {
      ok: documentProfilesResult?.ok ?? false,
      status: documentProfilesResult?.status ?? "NOT_REQUESTED",
      rowCount: publicDocumentProfiles.length,
      rawRowCount: allPublicDocumentProfiles.length,
      linkedProfileCount: linkedDocumentProfiles.length,
      unlinkedProfileCount: documentProfileVisibility.unlinkedProfileCount,
      hiddenProfileCount: documentProfileVisibility.hiddenProfileCount,
      alienCodeVolumeFourStatus: documentProfileVisibility.alienCodeVolumeFour.status,
      error: documentProfilesResult?.error ?? null,
      sqlHash: documentProfilesResult?.sqlHash ?? null,
      durationMs: documentProfilesResult?.durationMs ?? null,
      profiles: publicDocumentProfiles
    },
    linkedDocumentProfiles,
    memoryRecords,
    memorySaves,
    registeredEvents,
    diagnostics: {
      database: {
        available: databaseReady.description.available,
        configured: databaseReady.description.configured,
        kind: databaseReady.description.kind,
        initializationStatus: databaseReady.initialization.status
      },
      query: {
        memoryRecords: {
          ok: memoryResult.ok,
          rowCount: memoryResult.rowCount,
          durationMs: memoryResult.durationMs,
          sqlHash: memoryResult.sqlHash
        },
        memorySaves: memorySavesResult
          ? {
              ok: memorySavesResult.ok,
              rowCount: memorySavesResult.rowCount,
              durationMs: memorySavesResult.durationMs,
              sqlHash: memorySavesResult.sqlHash,
              error: memorySavesResult.error
            }
          : null,
        registeredEvents: registeredEventsResult
          ? {
              ok: registeredEventsResult.ok,
              rowCount: registeredEventsResult.rowCount,
              durationMs: registeredEventsResult.durationMs,
              sqlHash: registeredEventsResult.sqlHash,
              error: registeredEventsResult.error
            }
          : null,
        documentProfiles: documentProfilesResult
          ? {
              ok: documentProfilesResult.ok,
              rowCount: documentProfilesResult.rowCount,
              visibleRowCount: publicDocumentProfiles.length,
              durationMs: documentProfilesResult.durationMs,
              sqlHash: documentProfilesResult.sqlHash,
              error: documentProfilesResult.error,
              linkedProfileCount: linkedDocumentProfiles.length,
              visibility: documentProfileVisibility
            }
          : null
      }
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    return await buildRecordsPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORDS_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory records route error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await buildRecordsPayload(request);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: "IPR_MEMORY_RECORDS_ROUTE_ERROR",
        error: error instanceof Error ? error.message : "Unknown IPR memory records route error."
      },
      { status: 500 }
    );
  }
}
