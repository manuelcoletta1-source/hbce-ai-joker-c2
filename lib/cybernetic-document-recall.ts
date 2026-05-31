import {
  findDocumentProfilesForRecallFromDatabase,
  toPublicDocumentProfile
} from "@/lib/ipr-database";
import type { DocumentProfileDatabaseRow } from "@/lib/ipr-database";

export const CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION =
  "HBCE-CYBERNETIC-DOCUMENT-RECALL-ENGINE-v1";

export type CyberneticDocumentFileSnapshot = {
  name?: string | null;
  filename?: string | null;
};

export type CyberneticDocumentProfileRecallItem = {
  profileId: string | null;
  profileKeyHash: string | null;
  fileId: string | null;
  filename: string | null;
  fileHash: string | null;
  docFamily: string | null;
  volume: string | null;
  title: string | null;
  subtitle: string | null;
  canonicalAxis: string | null;
  summary: string | null;
  keyTerms: string[];
  semanticTerms: unknown[];
  memoryId: string | null;
  sourceSavedChatId: string | null;
  lastEvtId: string | null;
  lastOpcProofId: string | null;
  textStatus: string | null;
  textLength: number | null;
  mimeType: string | null;
  quality: string | null;
  reusableInPrompt: boolean;
  recallScore: number | null;
  profileStatus: string | null;
  updatedAt: string | null;
  publicProfile: Record<string, unknown>;
  legalCertification: false;
};

export type CyberneticDocumentProfileRecall = {
  enabled: boolean;
  injected: boolean;
  status:
    | "DOCUMENT_PROFILE_RECALL_INJECTED"
    | "DOCUMENT_PROFILE_RECALL_EMPTY"
    | "DOCUMENT_PROFILE_RECALL_QUERY_FAILED";
  source: "document_profiles";
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string;
  query: string;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  items: CyberneticDocumentProfileRecallItem[];
  profileIds: string[];
  memoryIds: string[];
  promptBlock: string;
  error: string | null;
  legalCertification: false;
};

type CyberneticHandoffContext = {
  humanIpr?: string | null;
  identityBinding?: string | null;
};

type CyberneticSaasContext = {
  tenantId?: string | null;
  workspaceId?: string | null;
};

type CyberneticIprRecallItem = {
  memoryId?: string | null;
  memoryTitle?: string | null;
  memorySummary?: string | null;
  classification?: string | null;
  quality?: string | null;
  memoryStatus?: string | null;
  sourceThreadId?: string | null;
  sourceSavedChatId?: string | null;
  sessionId?: string | null;
  lastEvtId?: string | null;
  lastOpcProofId?: string | null;
  lastOpcChainHash?: string | null;
};

type CyberneticIprRecallContext = {
  injected: boolean;
  status: string;
  sessionId: string;
  items: CyberneticIprRecallItem[];
  memoryIds: string[];
};

type CyberneticRuntimeMemoryContext = {
  memoryId?: string | null;
};

type CyberneticDocumentMemoryRecallAnswerInput = {
  recall: CyberneticIprRecallContext;
  documentProfileRecall: CyberneticDocumentProfileRecall | null;
  message: string;
  handoff: CyberneticHandoffContext;
  memory: CyberneticRuntimeMemoryContext;
  policy?: unknown;
  saasContext: CyberneticSaasContext;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function stringFromValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return stringFromValue(error) || "UNKNOWN_ERROR";
}

function truncateCyberneticDocumentPromptBlock(value: string, maxChars: number): string {
  if (!maxChars || maxChars < 1) {
    return "";
  }

  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 96))}\n...[TRUNCATED_CYBERNETIC_DOCUMENT_RECALL_BLOCK]`;
}

function documentProfileString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  const normalized = stringFromValue(value).trim();
  return normalized || null;
}

function documentProfileNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.round(Number(value));
  }

  return null;
}

function documentProfileBoolean(record: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = record[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = normalizeText(value.trim());

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

function documentProfileStringArray(value: unknown): string[] {
  const normalizeItems = (items: unknown[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of items) {
      const normalized = stringFromValue(item).trim();

      if (!normalized) {
        continue;
      }

      const key = normalizeText(normalized);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(normalized);
    }

    return result;
  };

  if (Array.isArray(value)) {
    return normalizeItems(value);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (Array.isArray(parsed)) {
        return normalizeItems(parsed);
      }
    } catch {
      return normalizeItems(value.split(/[;,\n]/g));
    }
  }

  return [];
}

function normalizeRequestedDocumentFilename(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .trim()
    .replace(/^file\s*[:=-]\s*/i, "")
    .replace(/^filename\s*[:=-]\s*/i, "")
    .replace(/[\s`'".,;:]+$/g, "")
    .slice(0, 220);

  return cleaned || null;
}

function extractRequestedDocumentFilename(message: string, files: CyberneticDocumentFileSnapshot[]): string | null {
  const normalizedMessage = normalizeText(message);

  for (const file of files) {
    const candidate = file.name || file.filename || null;

    if (candidate && normalizedMessage.includes(normalizeText(candidate))) {
      return candidate;
    }
  }

  const filePattern = /(?:file|filename|nome\s+file)?\s*[:=]?\s*([\wÀ-ÿ ._\-()]+\.(?:txt|pdf|md|markdown|json|csv|docx|doc|ts|tsx|js|jsx))/i;
  const match = message.match(filePattern);

  return normalizeRequestedDocumentFilename(match?.[1] || null);
}

function inferDocumentRecallFamily(message: string): string | null {
  const normalized = normalizeText(message);

  if (normalized.includes("apokalypsis")) {
    return "APOKALYPSIS";
  }

  if (
    normalized.includes("u.s.e") ||
    normalized.includes("united states of europe") ||
    normalized.includes("use volume") ||
    normalized.includes("voto digitale federato")
  ) {
    return "USE";
  }

  if (
    normalized.includes("matrix") ||
    normalized.includes("corpus esoterologia") ||
    normalized.includes("esoterologia ermetica") ||
    normalized.includes("lex hermeticum") ||
    normalized.includes("portale dell'anticristo") ||
    normalized.includes("portale dell’antichristo") ||
    normalized.includes("portale dell'anticristo") ||
    normalized.includes("alien code")
  ) {
    return "CORPUS_ESOTEROLOGIA_ERMETICA";
  }

  if (normalized.includes("cod 1") || normalized.includes("codice alieno")) {
    return "ALIEN_CODE";
  }

  if (normalized.includes("hbce") || normalized.includes("joker-c2") || normalized.includes("ipr")) {
    return "HBCE_OPERATIONAL_DOCUMENT";
  }

  return null;
}

function inferDocumentRecallVolume(message: string): string | null {
  const normalized = normalizeText(message);
  const romanMap: Array<[string, string]> = [
    ["volume i", "V1"],
    ["volume 1", "V1"],
    ["volumi i", "V1"],
    ["volume ii", "V2"],
    ["volume 2", "V2"],
    ["volume iii", "V3"],
    ["volume 3", "V3"],
    ["volume iv", "V4"],
    ["volume 4", "V4"],
    ["volume v", "V5"],
    ["volume 5", "V5"]
  ];

  for (const [signal, volume] of romanMap) {
    if (normalized.includes(signal)) {
      return volume;
    }
  }

  const compactMatch = normalized.match(/\bv\s*([1-5])\b/);

  if (compactMatch?.[1]) {
    return `V${compactMatch[1]}`;
  }

  return null;
}

export function extractRequestedIprMemoryIds(message: string): string[] {
  const matches = message.match(/IPR-MEM-\d{14}-[A-Z0-9]+/gi) || [];
  return Array.from(new Set(matches.map((item) => item.trim().toUpperCase())));
}

export function extractRequestedDocumentProfileIds(message: string): string[] {
  const matches = message.match(/DOC-PROFILE-[A-Z0-9]+/gi) || [];
  return Array.from(new Set(matches.map((item) => item.trim().toUpperCase())));
}

function normalizeDocumentProfileRow(row: DocumentProfileDatabaseRow): CyberneticDocumentProfileRecallItem {
  const publicProfile = toPublicDocumentProfile(row) as Record<string, unknown>;

  return {
    profileId: documentProfileString(publicProfile, "profileId"),
    profileKeyHash: documentProfileString(publicProfile, "profileKeyHash"),
    fileId: documentProfileString(publicProfile, "fileId"),
    filename: documentProfileString(publicProfile, "filename"),
    fileHash: documentProfileString(publicProfile, "fileHash"),
    docFamily: documentProfileString(publicProfile, "docFamily"),
    volume: documentProfileString(publicProfile, "volume"),
    title: documentProfileString(publicProfile, "title"),
    subtitle: documentProfileString(publicProfile, "subtitle"),
    canonicalAxis: documentProfileString(publicProfile, "canonicalAxis"),
    summary: documentProfileString(publicProfile, "summary"),
    keyTerms: documentProfileStringArray(publicProfile.keyTerms),
    semanticTerms: Array.isArray(publicProfile.semanticTerms) ? publicProfile.semanticTerms : [],
    memoryId: documentProfileString(publicProfile, "memoryId"),
    sourceSavedChatId: documentProfileString(publicProfile, "sourceSavedChatId"),
    lastEvtId: documentProfileString(publicProfile, "lastEvtId"),
    lastOpcProofId: documentProfileString(publicProfile, "lastOpcProofId"),
    textStatus: documentProfileString(publicProfile, "textStatus"),
    textLength: documentProfileNumber(publicProfile, "textLength"),
    mimeType: documentProfileString(publicProfile, "mimeType"),
    quality: documentProfileString(publicProfile, "quality"),
    reusableInPrompt: documentProfileBoolean(publicProfile, "reusableInPrompt", true),
    recallScore: documentProfileNumber(publicProfile, "recallScore"),
    profileStatus: documentProfileString(publicProfile, "profileStatus"),
    updatedAt: documentProfileString(publicProfile, "updatedAt"),
    publicProfile,
    legalCertification: false
  };
}

function dedupeDocumentProfileRecallItems(items: CyberneticDocumentProfileRecallItem[]): CyberneticDocumentProfileRecallItem[] {
  const seen = new Set<string>();
  const result: CyberneticDocumentProfileRecallItem[] = [];

  for (const item of items) {
    const key = [item.profileId, item.memoryId, item.fileHash, item.filename]
      .filter(Boolean)
      .join("|");

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function scoreDocumentProfileFallback(
  item: CyberneticDocumentProfileRecallItem,
  message: string,
  requestedMemoryIds: string[]
): number {
  const normalized = normalizeText(message);
  let score = item.recallScore ?? 0;

  if (item.memoryId && requestedMemoryIds.includes(item.memoryId.toUpperCase())) {
    score += 1000;
  }

  const haystack = normalizeText([
    item.profileId,
    item.filename,
    item.title,
    item.subtitle,
    item.docFamily,
    item.volume,
    item.canonicalAxis,
    item.summary,
    item.keyTerms.join(" ")
  ].filter(Boolean).join(" "));

  for (const signal of [
    "matrix",
    "corpus",
    "apokalypsis",
    "u.s.e",
    "dominio istituzionale",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "lex hermeticum",
    "alien code",
    "portale"
  ]) {
    if (normalized.includes(signal) && haystack.includes(signal)) {
      score += 25;
    }
  }

  if (item.textStatus === "TEXT_READY" || item.textStatus === "PDF_INGESTION_READY") {
    score += 20;
  }

  if (item.quality === "CANONICAL") {
    score += 15;
  }

  return score;
}

function buildDocumentProfilePromptBlock(items: CyberneticDocumentProfileRecallItem[], maxChars: number): string {
  if (!items.length) {
    return "";
  }

  const lines = [
    "HBCE / JOKER-C2 CYBERNETIC DOCUMENT PROFILE RECALL BLOCK",
    `Engine revision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    "Use these document profiles as reusable operational document memory, not as raw file text.",
    "The profile registry is data-driven: /api/chat must not hardcode file IDs, corpus titles, or volume templates.",
    "Boundary: legalCertification=false; OPC is a technical proof receipt only.",
    ""
  ];

  items.forEach((item, index) => {
    lines.push(`DOCUMENT PROFILE ${index + 1}`);
    lines.push(`profileId: ${item.profileId || "NO_PROFILE_ID"}`);
    lines.push(`memoryId: ${item.memoryId || "NO_LINKED_MEMORY_ID"}`);
    lines.push(`filename: ${item.filename || "NO_FILENAME"}`);
    lines.push(`fileHash: ${item.fileHash || "NO_FILE_HASH"}`);
    lines.push(`textStatus: ${item.textStatus || "UNKNOWN_TEXT_STATUS"}`);
    lines.push(`docFamily: ${item.docFamily || "UNKNOWN_DOC_FAMILY"}`);
    lines.push(`volume: ${item.volume || "UNKNOWN_VOLUME"}`);
    lines.push(`title: ${item.title || "UNKNOWN_TITLE"}`);
    lines.push(`canonicalAxis: ${item.canonicalAxis || "NO_CANONICAL_AXIS"}`);
    lines.push(`summary: ${item.summary || "NO_SUMMARY"}`);
    lines.push(`keyTerms: ${item.keyTerms.join(", ") || "NO_KEY_TERMS"}`);
    lines.push(`quality: ${item.quality || "UNKNOWN"}`);
    lines.push(`recallScore: ${String(item.recallScore ?? "NO_RECALL_SCORE")}`);
    lines.push("legalCertification: false");
    lines.push("");
  });

  return truncateCyberneticDocumentPromptBlock(lines.join("\n"), maxChars);
}

async function queryDocumentProfilesForRecall(args: {
  message: string;
  requestedMemoryId: string | null;
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  limit: number;
}): Promise<CyberneticDocumentProfileRecallItem[]> {
  const attempts: Array<{
    memoryId?: string | null;
    filename?: string | null;
    query?: string | null;
    docFamily?: string | null;
    volume?: string | null;
  }> = [];

  if (args.requestedMemoryId) {
    attempts.push({ memoryId: args.requestedMemoryId });
  }

  if (args.requestedFilename) {
    attempts.push({ filename: args.requestedFilename });
  }

  attempts.push({
    query: args.message,
    docFamily: args.requestedDocFamily,
    volume: args.requestedVolume
  });

  attempts.push({ query: args.message });

  const results: CyberneticDocumentProfileRecallItem[] = [];
  let lastError: string | null = null;

  for (const attempt of attempts) {
    const queryResult = await findDocumentProfilesForRecallFromDatabase({
      query: attempt.query ?? null,
      memoryId: attempt.memoryId ?? null,
      filename: attempt.filename ?? null,
      docFamily: attempt.docFamily ?? null,
      volume: attempt.volume ?? null,
      humanIpr: args.humanIpr,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId,
      limit: args.limit
    });

    if (!queryResult.ok) {
      lastError = queryResult.error || "DOCUMENT_PROFILE_QUERY_FAILED";
      continue;
    }

    results.push(...queryResult.rows.map(normalizeDocumentProfileRow));
  }

  const requestedMemoryIds = args.requestedMemoryId ? [args.requestedMemoryId] : [];
  const deduped = dedupeDocumentProfileRecallItems(results)
    .filter((item) => item.reusableInPrompt !== false && item.profileStatus !== "DELETED")
    .sort((a, b) =>
      scoreDocumentProfileFallback(b, args.message, requestedMemoryIds) -
      scoreDocumentProfileFallback(a, args.message, requestedMemoryIds)
    )
    .slice(0, args.limit);

  if (!deduped.length && lastError) {
    throw new Error(lastError);
  }

  return deduped;
}

function applyStrictRequestedDocumentProfileFilter(args: {
  items: CyberneticDocumentProfileRecallItem[];
  requestedProfileIds: string[];
  requestedMemoryIds: string[];
}): CyberneticDocumentProfileRecallItem[] {
  const requestedProfileSet = new Set(args.requestedProfileIds.map((item) => item.toUpperCase()));
  const requestedMemorySet = new Set(args.requestedMemoryIds.map((item) => item.toUpperCase()));

  if (!requestedProfileSet.size && !requestedMemorySet.size) {
    return args.items;
  }

  const exactItems = args.items.filter((item) => {
    const profileMatch = item.profileId ? requestedProfileSet.has(item.profileId.toUpperCase()) : false;
    const memoryMatch = item.memoryId ? requestedMemorySet.has(item.memoryId.toUpperCase()) : false;
    return profileMatch || memoryMatch;
  });

  if (exactItems.length) {
    return dedupeDocumentProfileRecallItems(exactItems);
  }

  return [];
}

function documentProfileRecallRegistryStatus(recall: CyberneticDocumentProfileRecall | null): string {
  if (!recall) {
    return "NOT_REQUESTED";
  }

  if (recall.error) {
    return "QUERY_FAILED";
  }

  if (recall.items.length) {
    return "AVAILABLE";
  }

  return "EMPTY";
}

export async function resolveCyberneticDocumentProfileRecall(args: {
  handoff: CyberneticHandoffContext;
  saasContext: CyberneticSaasContext;
  sessionId: string;
  message: string;
  files: CyberneticDocumentFileSnapshot[];
  limit: number;
  promptMaxChars: number;
}): Promise<CyberneticDocumentProfileRecall> {
  const humanIpr = args.handoff.humanIpr || null;
  const requestedMemoryIds = extractRequestedIprMemoryIds(args.message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(args.message);
  const requestedFilename = extractRequestedDocumentFilename(args.message, args.files);
  const requestedDocFamily = inferDocumentRecallFamily(args.message);
  const requestedVolume = inferDocumentRecallVolume(args.message);

  const base: Omit<CyberneticDocumentProfileRecall, "status" | "injected" | "items" | "profileIds" | "memoryIds" | "promptBlock" | "error"> = {
    enabled: true,
    source: "document_profiles",
    humanIpr,
    tenantId: args.saasContext.tenantId || null,
    workspaceId: args.saasContext.workspaceId || null,
    sessionId: args.sessionId,
    query: args.message,
    requestedMemoryIds,
    requestedProfileIds,
    requestedFilename,
    requestedDocFamily,
    requestedVolume,
    legalCertification: false
  };

  if (!humanIpr || args.handoff.identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT") {
    return {
      ...base,
      injected: false,
      status: "DOCUMENT_PROFILE_RECALL_QUERY_FAILED",
      items: [],
      profileIds: [],
      memoryIds: [],
      promptBlock: "",
      error: "Verified human IPR is required before injecting document profile recall into /api/chat."
    };
  }

  try {
    const queryLimit = Math.max(args.limit, requestedMemoryIds.length, requestedProfileIds.length, 1);
    const queriedItems = requestedMemoryIds.length > 1
      ? dedupeDocumentProfileRecallItems((
          await Promise.all(
            requestedMemoryIds.map((requestedMemoryId) =>
              queryDocumentProfilesForRecall({
                message: args.message,
                requestedMemoryId,
                requestedFilename: null,
                requestedDocFamily,
                requestedVolume,
                humanIpr,
                tenantId: args.saasContext.tenantId || null,
                workspaceId: args.saasContext.workspaceId || null,
                limit: queryLimit
              })
            )
          )
        ).flat())
      : await queryDocumentProfilesForRecall({
          message: args.message,
          requestedMemoryId: requestedMemoryIds[0] || null,
          requestedFilename,
          requestedDocFamily,
          requestedVolume,
          humanIpr,
          tenantId: args.saasContext.tenantId || null,
          workspaceId: args.saasContext.workspaceId || null,
          limit: queryLimit
        });

    const items = applyStrictRequestedDocumentProfileFilter({
      items: queriedItems,
      requestedProfileIds,
      requestedMemoryIds
    }).slice(0, queryLimit);

    const profileIds = Array.from(new Set(items.map((item) => item.profileId).filter((item): item is string => Boolean(item))));
    const memoryIds = Array.from(new Set(items.map((item) => item.memoryId).filter((item): item is string => Boolean(item))));
    const promptBlock = buildDocumentProfilePromptBlock(items, args.promptMaxChars);

    return {
      ...base,
      injected: items.length > 0,
      status: items.length > 0 ? "DOCUMENT_PROFILE_RECALL_INJECTED" : "DOCUMENT_PROFILE_RECALL_EMPTY",
      items,
      profileIds,
      memoryIds,
      promptBlock,
      error: null
    };
  } catch (error) {
    return {
      ...base,
      injected: false,
      status: "DOCUMENT_PROFILE_RECALL_QUERY_FAILED",
      items: [],
      profileIds: [],
      memoryIds: [],
      promptBlock: "",
      error: errorToMessage(error)
    };
  }
}

function selectRequestedIprRecallItem(message: string, items: CyberneticIprRecallItem[]): CyberneticIprRecallItem | null {
  const requestedIds = extractRequestedIprMemoryIds(message).map((item) => normalizeText(item));

  if (requestedIds.length > 0) {
    const exact = items.find(
      (item) => item.memoryId && requestedIds.includes(normalizeText(item.memoryId))
    );

    if (exact) {
      return exact;
    }
  }

  return items[0] || null;
}

function selectDocumentProfileRecallItem(
  documentProfileRecall: CyberneticDocumentProfileRecall | null,
  message: string
): CyberneticDocumentProfileRecallItem | null {
  if (!documentProfileRecall?.items.length) {
    return null;
  }

  const requestedMemoryIds = extractRequestedIprMemoryIds(message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(message);
  const exactProfileMatch = requestedProfileIds.length
    ? documentProfileRecall.items.find(
        (item) => item.profileId && requestedProfileIds.includes(item.profileId.toUpperCase())
      )
    : null;

  if (exactProfileMatch) {
    return exactProfileMatch;
  }

  const exactMemoryMatch = requestedMemoryIds.length
    ? documentProfileRecall.items.find(
        (item) => item.memoryId && requestedMemoryIds.includes(item.memoryId.toUpperCase())
      )
    : null;

  if (exactMemoryMatch) {
    return exactMemoryMatch;
  }

  return documentProfileRecall.items[0] || null;
}

function orderedRequestedDocumentProfileRecallItems(
  documentProfileRecall: CyberneticDocumentProfileRecall | null,
  message: string
): CyberneticDocumentProfileRecallItem[] {
  if (!documentProfileRecall?.items.length) {
    return [];
  }

  const requestedProfileIds = extractRequestedDocumentProfileIds(message);
  const requestedMemoryIds = extractRequestedIprMemoryIds(message);
  const ordered: CyberneticDocumentProfileRecallItem[] = [];
  const seen = new Set<string>();

  for (const requestedProfileId of requestedProfileIds) {
    const match = documentProfileRecall.items.find(
      (item) => item.profileId && item.profileId.toUpperCase() === requestedProfileId.toUpperCase()
    );

    if (match) {
      const key = match.profileId || match.memoryId || match.filename || requestedProfileId;
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(match);
      }
    }
  }

  for (const requestedMemoryId of requestedMemoryIds) {
    const match = documentProfileRecall.items.find(
      (item) => item.memoryId && item.memoryId.toUpperCase() === requestedMemoryId.toUpperCase()
    );

    if (match) {
      const key = match.profileId || match.memoryId || match.filename || requestedMemoryId;
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(match);
      }
    }
  }

  return ordered.length ? ordered : documentProfileRecall.items;
}

function findMatchingRecallMemoryItem(
  recall: CyberneticIprRecallContext,
  documentProfile: CyberneticDocumentProfileRecallItem
): CyberneticIprRecallItem | null {
  if (!documentProfile.memoryId) {
    return null;
  }

  return recall.items.find((item) => item.memoryId === documentProfile.memoryId) || null;
}

function serializeDocumentSemanticTerms(semanticTerms: unknown[]): string {
  const terms = semanticTerms
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object" && "term" in item) {
        return stringFromValue((item as Record<string, unknown>).term).trim();
      }

      return stringFromValue(item).trim();
    })
    .filter(Boolean);

  return terms.join(", ") || "NO_SEMANTIC_TERMS";
}

function isMultiDocumentMemoryRecallRequested(message: string): boolean {
  const normalized = normalizeText(message);

  return (
    normalized.includes("multi_document_memory_recall") ||
    normalized.includes("multi-document") ||
    normalized.includes("multi documento") ||
    normalized.includes("multi-doc") ||
    extractRequestedDocumentProfileIds(message).length > 1 ||
    extractRequestedIprMemoryIds(message).length > 1
  );
}

function buildCyberneticMultiDocumentMemoryRecallAnswer(args: CyberneticDocumentMemoryRecallAnswerInput): string {
  const requestedMemoryIds = extractRequestedIprMemoryIds(args.message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(args.message);
  const documentProfiles = orderedRequestedDocumentProfileRecallItems(args.documentProfileRecall, args.message);
  const visibleProfileIds = Array.from(
    new Set(documentProfiles.map((item) => item.profileId).filter((item): item is string => Boolean(item)))
  );
  const visibleMemoryIds = Array.from(
    new Set(documentProfiles.map((item) => item.memoryId).filter((item): item is string => Boolean(item)))
  );
  const missingProfileIds = requestedProfileIds.filter((profileId) => !visibleProfileIds.includes(profileId));
  const missingMemoryIds = requestedMemoryIds.filter((memoryId) => !visibleMemoryIds.includes(memoryId));
  const expectedProfileCount = requestedProfileIds.length || requestedMemoryIds.length || documentProfiles.length;
  const complete =
    documentProfiles.length > 0 &&
    !missingProfileIds.length &&
    !missingMemoryIds.length &&
    (expectedProfileCount === 0 || documentProfiles.length >= expectedProfileCount);
  const documentRegistryStatus = documentProfileRecallRegistryStatus(args.documentProfileRecall);
  const sections: string[] = [];

  documentProfiles.forEach((documentProfile, index) => {
    sections.push(`${index + 1}. Volume documentale richiamato`);
    sections.push(`memoryId: ${documentProfile.memoryId || "NO_MEMORY_ID"}`);
    sections.push(`documentProfileId: ${documentProfile.profileId || "NO_DOCUMENT_PROFILE_ID"}`);
    sections.push(`filename: ${documentProfile.filename || "NO_FILENAME"}`);
    sections.push(`fileHash: ${documentProfile.fileHash || "NO_FILE_HASH"}`);
    sections.push(`fileId: ${documentProfile.fileId || "NO_FILE_ID"}`);
    sections.push(`docFamily: ${documentProfile.docFamily || "UNKNOWN_DOC_FAMILY"}`);
    sections.push(`volume: ${documentProfile.volume || "UNKNOWN_VOLUME"}`);
    sections.push(`title: ${documentProfile.title || "UNKNOWN_TITLE"}`);
    sections.push(`canonicalAxis: ${documentProfile.canonicalAxis || "NO_CANONICAL_AXIS"}`);
    sections.push(`textStatus: ${documentProfile.textStatus || "UNKNOWN_TEXT_STATUS"}`);
    sections.push(`textLength: ${String(documentProfile.textLength ?? "UNKNOWN_TEXT_LENGTH")}`);
    sections.push(`quality: ${documentProfile.quality || "UNKNOWN"}`);
    sections.push(`reusableInPrompt: ${String(documentProfile.reusableInPrompt)}`);
    sections.push(`keyTerms: ${documentProfile.keyTerms.join(", ") || "NO_KEY_TERMS"}`);
    sections.push(`semanticTerms: ${serializeDocumentSemanticTerms(documentProfile.semanticTerms)}`);
    sections.push(`EVT collegato: ${documentProfile.lastEvtId || "NO_EVT_IN_RECALL_RECORD"}`);
    sections.push(`OPC collegato: ${documentProfile.lastOpcProofId || "NO_OPC_IN_RECALL_RECORD"}`);
    sections.push("");
  });

  return [
    complete ? "MULTI_DOCUMENT_MEMORY_RECALL_READY" : "MULTI_DOCUMENT_MEMORY_RECALL_PARTIAL",
    "DOCUMENT_MEMORY_RECALL_READY: true",
    "MEMORY_CHAIN_RECALL_READY: true",
    "",
    "1. Stato multi-document recall",
    `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    `documentRegistry.status: ${documentRegistryStatus}`,
    `linkedProfileCount: ${String(documentProfiles.length)}`,
    `expectedProfileCount: ${String(expectedProfileCount || documentProfiles.length)}`,
    `requestedMemoryIds: ${requestedMemoryIds.join(", ") || "NO_REQUESTED_MEMORY_IDS"}`,
    `requestedDocumentProfileIds: ${requestedProfileIds.join(", ") || "NO_REQUESTED_DOCUMENT_PROFILE_IDS"}`,
    `memoryIds: ${visibleMemoryIds.join(", ") || "NO_MEMORY_IDS"}`,
    `profileIds: ${visibleProfileIds.join(", ") || "NO_PROFILE_IDS"}`,
    `missingMemoryIds: ${missingMemoryIds.join(", ") || "NONE"}`,
    `missingProfileIds: ${missingProfileIds.join(", ") || "NONE"}`,
    `recallInjected: ${String(args.recall.injected)}`,
    `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
    `recallItemsCount: ${String(args.recall.items.length)}`,
    `documentProfileItemsCount: ${String(args.documentProfileRecall?.items.length || 0)}`,
    `strictDocumentProfileFilter: ${requestedProfileIds.length > 0 ? "REQUESTED_PROFILE_SET_APPLIED" : "NO_REQUESTED_PROFILE_ID"}`,
    "",
    "2. Profili documentali richiamati",
    sections.join("\n").trim() || "NO_DOCUMENT_PROFILES",
    "",
    "3. Collegamento HBCE",
    `Human IPR: ${args.handoff.humanIpr || "NO_HUMAN_IPR"}`,
    `Runtime memory ID: ${args.memory.memoryId || "NO_RUNTIME_MEMORY_ID"}`,
    `Tenant: ${args.saasContext.tenantId || "NO_TENANT"}`,
    `Workspace: ${args.saasContext.workspaceId || "NO_WORKSPACE"}`,
    "",
    "4. Boundary",
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}

export function buildCyberneticDocumentMemoryRecallAnswer(args: CyberneticDocumentMemoryRecallAnswerInput): string {
  if (isMultiDocumentMemoryRecallRequested(args.message)) {
    return buildCyberneticMultiDocumentMemoryRecallAnswer(args);
  }

  const primaryMemory = selectRequestedIprRecallItem(args.message, args.recall.items);
  const documentProfile = selectDocumentProfileRecallItem(args.documentProfileRecall, args.message);
  const linkedMemory = documentProfile ? findMatchingRecallMemoryItem(args.recall, documentProfile) : null;
  const memoryForStatus = linkedMemory || primaryMemory;
  const requestedMemoryIds = extractRequestedIprMemoryIds(args.message);
  const requestedProfileIds = extractRequestedDocumentProfileIds(args.message);
  const visibleDocumentProfiles = documentProfile
    ? [documentProfile]
    : args.documentProfileRecall?.items || [];
  const visibleProfileIds = Array.from(
    new Set(visibleDocumentProfiles.map((item) => item.profileId).filter((item): item is string => Boolean(item)))
  );
  const visibleLinkedProfileCount = visibleDocumentProfiles.length;

  if (!documentProfile) {
    return [
      "CYBER_DOCUMENT_MEMORY_RECALL_NOT_FOUND",
      "DOCUMENT_MEMORY_RECALL_READY: false",
      "",
      `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
      `requestedMemoryIds: ${requestedMemoryIds.join(", ") || "NO_REQUESTED_MEMORY_IDS"}`,
      `requestedDocumentProfileIds: ${requestedProfileIds.join(", ") || "NO_REQUESTED_DOCUMENT_PROFILE_IDS"}`,
      `memoryRecallStatus: ${args.recall.status}`,
      `memoryRecallInjected: ${String(args.recall.injected)}`,
      `documentProfileRecallStatus: ${args.documentProfileRecall?.status || "DOCUMENT_PROFILE_RECALL_NOT_EXECUTED"}`,
      `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
      `linkedProfileCount: ${String(args.documentProfileRecall?.items.length || 0)}`,
      `memoryIds: ${args.recall.memoryIds.join(", ") || "NO_MEMORY_IDS"}`,
      `profileIds: ${args.documentProfileRecall?.profileIds.join(", ") || "NO_PROFILE_IDS"}`,
      args.documentProfileRecall?.error ? `Errore documentRegistry: ${args.documentProfileRecall.error}` : "Errore documentRegistry: none",
      "Motivo: nessun document_profiles ACTIVE/reusableInPrompt=true risulta collegato al memoryId o documentProfileId richiesto.",
      "legalCertification=false",
      "OPC=technical proof receipt only"
    ].join("\n");
  }

  const promptEligible = memoryForStatus?.memoryStatus
    ? normalizeText(memoryForStatus.memoryStatus) === "active"
    : true;
  const linkedProfileCount = visibleLinkedProfileCount || 1;
  const documentRegistryStatus = documentProfileRecallRegistryStatus(args.documentProfileRecall);

  return [
    "CYBER_DOCUMENT_MEMORY_RECALL_READY",
    "DOCUMENT_MEMORY_RECALL_READY: true",
    "MEMORY_CHAIN_RECALL_READY: true",
    "",
    "1. Memoria IPR richiamata",
    `memoryId: ${documentProfile.memoryId || memoryForStatus?.memoryId || requestedMemoryIds[0] || "NO_MEMORY_ID"}`,
    `sourceSavedChatId: ${documentProfile.sourceSavedChatId || memoryForStatus?.sourceSavedChatId || "NO_SAVED_CHAT"}`,
    `sourceThreadId: ${memoryForStatus?.sourceThreadId || memoryForStatus?.sessionId || args.recall.sessionId}`,
    "",
    "2. Triade collegata",
    `EVT collegato: ${documentProfile.lastEvtId || memoryForStatus?.lastEvtId || "NO_EVT_IN_RECALL_RECORD"}`,
    `OPC collegato: ${documentProfile.lastOpcProofId || memoryForStatus?.lastOpcProofId || "NO_OPC_IN_RECALL_RECORD"}`,
    `OPC chain hash: ${memoryForStatus?.lastOpcChainHash || "NO_OPC_CHAIN_HASH_IN_RECALL_RECORD"}`,
    "",
    "3. Document Registry collegato",
    `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    `documentRegistry.status: ${documentRegistryStatus}`,
    `linkedProfileCount: ${String(linkedProfileCount)}`,
    `documentProfileId: ${documentProfile.profileId || requestedProfileIds[0] || "NO_DOCUMENT_PROFILE_ID"}`,
    `profileId: ${documentProfile.profileId || requestedProfileIds[0] || "NO_DOCUMENT_PROFILE_ID"}`,
    `filename: ${documentProfile.filename || "NO_FILENAME"}`,
    `fileHash: ${documentProfile.fileHash || "NO_FILE_HASH"}`,
    `fileId: ${documentProfile.fileId || "NO_FILE_ID"}`,
    `textStatus: ${documentProfile.textStatus || "UNKNOWN_TEXT_STATUS"}`,
    `textLength: ${String(documentProfile.textLength ?? "UNKNOWN_TEXT_LENGTH")}`,
    `mimeType: ${documentProfile.mimeType || "UNKNOWN_MIME_TYPE"}`,
    "",
    "4. Profilo documento",
    `docFamily: ${documentProfile.docFamily || "UNKNOWN_DOC_FAMILY"}`,
    `volume: ${documentProfile.volume || "UNKNOWN_VOLUME"}`,
    `title: ${documentProfile.title || "UNKNOWN_TITLE"}`,
    documentProfile.subtitle ? `subtitle: ${documentProfile.subtitle}` : "subtitle: none",
    `canonicalAxis: ${documentProfile.canonicalAxis || "NO_CANONICAL_AXIS"}`,
    `summary: ${documentProfile.summary || "NO_DOCUMENT_PROFILE_SUMMARY"}`,
    `keyTerms: ${documentProfile.keyTerms.join(", ") || "NO_KEY_TERMS"}`,
    `semanticTerms: ${serializeDocumentSemanticTerms(documentProfile.semanticTerms)}`,
    "",
    "5. Stato memoria e recall",
    `status memoria: ${memoryForStatus?.memoryStatus || "ACTIVE"}`,
    `promptEligible: ${String(promptEligible)}`,
    `reusableInPrompt: ${String(documentProfile.reusableInPrompt)}`,
    `quality: ${documentProfile.quality || memoryForStatus?.quality || "UNKNOWN"}`,
    `classification: ${memoryForStatus?.classification || "USER_SELECTED_CHAT_MEMORY"}`,
    `recallInjected: ${String(args.recall.injected)}`,
    `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
    `recallItemsCount: ${String(args.recall.items.length)}`,
    `memoryIds: ${args.recall.memoryIds.join(", ") || "NO_MEMORY_IDS"}`,
    `profileIds: ${visibleProfileIds.join(", ") || "NO_PROFILE_IDS"}`,
    `strictDocumentProfileFilter: ${requestedProfileIds.length > 0 ? "REQUESTED_PROFILE_ID_APPLIED" : "NO_REQUESTED_PROFILE_ID"}`,
    "",
    "6. Sintesi operativa della memoria",
    memoryForStatus?.memorySummary || memoryForStatus?.memoryTitle || documentProfile.summary || "Sintesi memoria documentale non disponibile nel record pubblico.",
    "",
    "7. Collegamento HBCE",
    `Human IPR: ${args.handoff.humanIpr || "NO_HUMAN_IPR"}`,
    `Runtime memory ID: ${args.memory.memoryId || "NO_RUNTIME_MEMORY_ID"}`,
    `Tenant: ${args.saasContext.tenantId || "NO_TENANT"}`,
    `Workspace: ${args.saasContext.workspaceId || "NO_WORKSPACE"}`,
    `Document registry: ${documentRegistryStatus}; linkedProfileCount=${String(linkedProfileCount)} after requested documentProfileId filtering.`,
    "",
    "8. Boundary",
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}
