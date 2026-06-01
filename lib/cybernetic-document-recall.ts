import {
  findDocumentProfilesForRecallFromDatabase,
  listDocumentProfilesFromDatabase,
  toPublicDocumentProfile
} from "@/lib/ipr-database";
import type { DocumentProfileDatabaseRow } from "@/lib/ipr-database";

export const CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION =
  "HBCE-CYBERNETIC-DOCUMENT-RECALL-ENGINE-v4-LINKED_PROFILE_DIRECT_MATCH";

export type CyberneticDocumentFileSnapshot = {
  name?: string | null;
  filename?: string | null;
};

export type CyberneticDocumentRecallPolicyMode =
  | "STRICT"
  | "PARTIAL_ALLOWED"
  | "FAIL_CLOSED_ON_MISSING";

export type CyberneticDocumentProjectContext = {
  projectId?: string | null;
  projectKey?: string | null;
  projectName?: string | null;
  documentModuleId?: string | null;
  documentModuleName?: string | null;
  docFamily?: string | null;
};

export type CyberneticDocumentRecallConfig = {
  projectContext?: CyberneticDocumentProjectContext | null;
  policyMode?: CyberneticDocumentRecallPolicyMode | null;
  maxDocumentCount?: number | null;
  promptMaxChars?: number | null;
  allowedDocFamilies?: string[] | null;
  requireVerifiedIpr?: boolean | null;
  requireTenantScope?: boolean | null;
  requireWorkspaceScope?: boolean | null;
  requireProjectScope?: boolean | null;
  allowCrossTenantRecall?: boolean | null;
  allowCrossWorkspaceRecall?: boolean | null;
  allowCrossProjectRecall?: boolean | null;
  failClosedOnMissingRequestedIds?: boolean | null;
  orderedRecall?: boolean | null;
};

type ResolvedCyberneticDocumentRecallConfig = {
  projectContext: Required<Pick<CyberneticDocumentProjectContext, "projectId" | "projectKey" | "projectName" | "documentModuleId" | "documentModuleName" | "docFamily">>;
  policyMode: CyberneticDocumentRecallPolicyMode;
  maxDocumentCount: number;
  promptMaxChars: number | null;
  allowedDocFamilies: string[];
  requireVerifiedIpr: boolean;
  requireTenantScope: boolean;
  requireWorkspaceScope: boolean;
  requireProjectScope: boolean;
  allowCrossTenantRecall: boolean;
  allowCrossWorkspaceRecall: boolean;
  allowCrossProjectRecall: boolean;
  failClosedOnMissingRequestedIds: boolean;
  orderedRecall: boolean;
};

type CyberneticDocumentRecallIsolationReport = {
  tenantScoped: boolean;
  workspaceScoped: boolean;
  projectScoped: boolean;
  docFamilyScoped: boolean;
  rejectedByTenant: number;
  rejectedByWorkspace: number;
  rejectedByProject: number;
  rejectedByDocFamily: number;
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
    | "DOCUMENT_PROFILE_RECALL_FAIL_CLOSED"
    | "DOCUMENT_PROFILE_RECALL_QUERY_FAILED";
  source: "document_profiles";
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  documentModuleId: string | null;
  sessionId: string;
  query: string;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  requestedProjectId: string | null;
  requestedDocumentModuleId: string | null;
  recallPolicyMode: CyberneticDocumentRecallPolicyMode;
  maxDocumentCount: number;
  allowedDocFamilies: string[];
  missingMemoryIds: string[];
  missingProfileIds: string[];
  failClosed: boolean;
  failClosedReason: string | null;
  isolation: CyberneticDocumentRecallIsolationReport;
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
  projectId?: string | null;
  documentModuleId?: string | null;
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
  projectContext?: CyberneticDocumentProjectContext | null;
  recallConfig?: CyberneticDocumentRecallConfig | null;
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

const DEFAULT_CYBERNETIC_DOCUMENT_RECALL_MAX_DOCUMENT_COUNT = 8;
const DEFAULT_CYBERNETIC_DOCUMENT_RECALL_PROMPT_MAX_CHARS = 18000;

function normalizeNullableText(value: unknown): string | null {
  const normalized = stringFromValue(value).trim();
  return normalized || null;
}

function normalizeDocumentScopeId(value: unknown): string | null {
  const normalized = normalizeNullableText(value);
  return normalized ? normalized.trim() : null;
}

function normalizeDocumentFamily(value: unknown): string | null {
  const normalized = normalizeNullableText(value);
  return normalized ? normalized.trim().toUpperCase() : null;
}

function boundedPositiveInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.min(max, Math.max(min, Math.round(Number(value))));
  }

  return fallback;
}

function mergeCyberneticProjectContext(
  saasContext: CyberneticSaasContext,
  directProjectContext?: CyberneticDocumentProjectContext | null,
  configProjectContext?: CyberneticDocumentProjectContext | null,
  inferredDocFamily?: string | null
): Required<Pick<CyberneticDocumentProjectContext, "projectId" | "projectKey" | "projectName" | "documentModuleId" | "documentModuleName" | "docFamily">> {
  return {
    projectId: normalizeDocumentScopeId(directProjectContext?.projectId)
      || normalizeDocumentScopeId(configProjectContext?.projectId)
      || normalizeDocumentScopeId(saasContext.projectId),
    projectKey: normalizeDocumentScopeId(directProjectContext?.projectKey)
      || normalizeDocumentScopeId(configProjectContext?.projectKey)
      || null,
    projectName: normalizeDocumentScopeId(directProjectContext?.projectName)
      || normalizeDocumentScopeId(configProjectContext?.projectName)
      || null,
    documentModuleId: normalizeDocumentScopeId(directProjectContext?.documentModuleId)
      || normalizeDocumentScopeId(configProjectContext?.documentModuleId)
      || normalizeDocumentScopeId(saasContext.documentModuleId)
      || "HBCE-CYBERNETIC-DOCUMENT-MODULE-DEFAULT",
    documentModuleName: normalizeDocumentScopeId(directProjectContext?.documentModuleName)
      || normalizeDocumentScopeId(configProjectContext?.documentModuleName)
      || "HBCE Cybernetic Document Module",
    docFamily: normalizeDocumentFamily(directProjectContext?.docFamily)
      || normalizeDocumentFamily(configProjectContext?.docFamily)
      || normalizeDocumentFamily(inferredDocFamily)
  };
}

function resolveCyberneticDocumentRecallConfig(args: {
  saasContext: CyberneticSaasContext;
  projectContext?: CyberneticDocumentProjectContext | null;
  recallConfig?: CyberneticDocumentRecallConfig | null;
  inferredDocFamily?: string | null;
  promptMaxChars: number;
  limit: number;
}): ResolvedCyberneticDocumentRecallConfig {
  const projectContext = mergeCyberneticProjectContext(
    args.saasContext,
    args.projectContext || null,
    args.recallConfig?.projectContext || null,
    args.inferredDocFamily || null
  );
  const allowedDocFamilies = (args.recallConfig?.allowedDocFamilies || [])
    .map(normalizeDocumentFamily)
    .filter((item): item is string => Boolean(item));

  if (projectContext.docFamily && !allowedDocFamilies.includes(projectContext.docFamily)) {
    allowedDocFamilies.push(projectContext.docFamily);
  }

  const maxDocumentCount = boundedPositiveInteger(
    args.recallConfig?.maxDocumentCount ?? args.limit,
    DEFAULT_CYBERNETIC_DOCUMENT_RECALL_MAX_DOCUMENT_COUNT,
    1,
    50
  );
  const promptMaxChars = boundedPositiveInteger(
    args.recallConfig?.promptMaxChars ?? args.promptMaxChars,
    DEFAULT_CYBERNETIC_DOCUMENT_RECALL_PROMPT_MAX_CHARS,
    0,
    120000
  );
  const policyMode = args.recallConfig?.policyMode || "FAIL_CLOSED_ON_MISSING";

  return {
    projectContext,
    policyMode,
    maxDocumentCount,
    promptMaxChars,
    allowedDocFamilies,
    requireVerifiedIpr: args.recallConfig?.requireVerifiedIpr !== false,
    requireTenantScope: args.recallConfig?.requireTenantScope !== false,
    requireWorkspaceScope: args.recallConfig?.requireWorkspaceScope !== false,
    requireProjectScope: args.recallConfig?.requireProjectScope === true,
    allowCrossTenantRecall: args.recallConfig?.allowCrossTenantRecall === true,
    allowCrossWorkspaceRecall: args.recallConfig?.allowCrossWorkspaceRecall === true,
    allowCrossProjectRecall: args.recallConfig?.allowCrossProjectRecall === true,
    failClosedOnMissingRequestedIds: args.recallConfig?.failClosedOnMissingRequestedIds
      ?? policyMode !== "PARTIAL_ALLOWED",
    orderedRecall: args.recallConfig?.orderedRecall !== false
  };
}

function publicProfileStringFromAliases(
  item: CyberneticDocumentProfileRecallItem,
  aliases: string[]
): string | null {
  for (const alias of aliases) {
    const direct = (item as unknown as Record<string, unknown>)[alias];
    const directValue = normalizeNullableText(direct);

    if (directValue) {
      return directValue;
    }

    const publicValue = normalizeNullableText(item.publicProfile?.[alias]);

    if (publicValue) {
      return publicValue;
    }
  }

  return null;
}

function hasConflictingScopeValue(args: {
  item: CyberneticDocumentProfileRecallItem;
  expected: string | null;
  aliases: string[];
  requireValue: boolean;
}): boolean {
  if (!args.expected) {
    return false;
  }

  const actual = publicProfileStringFromAliases(args.item, args.aliases);

  if (!actual) {
    return args.requireValue;
  }

  return normalizeText(actual) !== normalizeText(args.expected);
}

function applyCyberneticDocumentRecallIsolation(args: {
  items: CyberneticDocumentProfileRecallItem[];
  saasContext: CyberneticSaasContext;
  config: ResolvedCyberneticDocumentRecallConfig;
}): { items: CyberneticDocumentProfileRecallItem[]; isolation: CyberneticDocumentRecallIsolationReport } {
  const tenantId = normalizeDocumentScopeId(args.saasContext.tenantId);
  const workspaceId = normalizeDocumentScopeId(args.saasContext.workspaceId);
  const projectId = args.config.projectContext.projectId;
  const allowedDocFamilySet = new Set(args.config.allowedDocFamilies.map((item) => normalizeText(item)));
  const isolation: CyberneticDocumentRecallIsolationReport = {
    tenantScoped: Boolean(tenantId) && !args.config.allowCrossTenantRecall,
    workspaceScoped: Boolean(workspaceId) && !args.config.allowCrossWorkspaceRecall,
    projectScoped: Boolean(projectId) && !args.config.allowCrossProjectRecall,
    docFamilyScoped: allowedDocFamilySet.size > 0,
    rejectedByTenant: 0,
    rejectedByWorkspace: 0,
    rejectedByProject: 0,
    rejectedByDocFamily: 0
  };
  const filtered: CyberneticDocumentProfileRecallItem[] = [];

  for (const item of args.items) {
    if (isolation.tenantScoped && hasConflictingScopeValue({
      item,
      expected: tenantId,
      aliases: ["tenantId", "tenant_id", "tenant"],
      requireValue: false
    })) {
      isolation.rejectedByTenant += 1;
      continue;
    }

    if (isolation.workspaceScoped && hasConflictingScopeValue({
      item,
      expected: workspaceId,
      aliases: ["workspaceId", "workspace_id", "workspace"],
      requireValue: false
    })) {
      isolation.rejectedByWorkspace += 1;
      continue;
    }

    if (isolation.projectScoped && hasConflictingScopeValue({
      item,
      expected: projectId,
      aliases: ["projectId", "project_id", "projectKey", "project_key"],
      requireValue: args.config.requireProjectScope
    })) {
      isolation.rejectedByProject += 1;
      continue;
    }

    if (isolation.docFamilyScoped) {
      const docFamily = item.docFamily ? normalizeText(item.docFamily) : null;

      if (docFamily && !allowedDocFamilySet.has(docFamily)) {
        isolation.rejectedByDocFamily += 1;
        continue;
      }
    }

    filtered.push(item);
  }

  return { items: filtered, isolation };
}

function emptyCyberneticDocumentRecallIsolationReport(): CyberneticDocumentRecallIsolationReport {
  return {
    tenantScoped: false,
    workspaceScoped: false,
    projectScoped: false,
    docFamilyScoped: false,
    rejectedByTenant: 0,
    rejectedByWorkspace: 0,
    rejectedByProject: 0,
    rejectedByDocFamily: 0
  };
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

export function extractRequestedSavedChatIds(message: string): string[] {
  const matches = message.match(/IPR-CHAT-SAVE-\d{14}-[A-Z0-9]+/gi) || [];
  return Array.from(new Set(matches.map((item) => item.trim().toUpperCase())));
}

function normalizeDirectLookupToken(value: string | null | undefined): string | null {
  const normalized = normalizeNullableText(value);

  return normalized ? normalized.toUpperCase() : null;
}

function directLookupSet(values: Array<string | null | undefined>): Set<string> {
  return new Set(
    values
      .map(normalizeDirectLookupToken)
      .filter((item): item is string => Boolean(item))
  );
}

function directLookupHasExactValue(values: Array<string | null | undefined>, lookup: Set<string>): boolean {
  if (!lookup.size) {
    return false;
  }

  return values.some((value) => {
    const normalized = normalizeDirectLookupToken(value);
    return normalized ? lookup.has(normalized) : false;
  });
}

function documentProfileScopeConflicts(args: {
  item: CyberneticDocumentProfileRecallItem;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
}): boolean {
  const expectedTenantId = normalizeDocumentScopeId(args.tenantId);
  const expectedWorkspaceId = normalizeDocumentScopeId(args.workspaceId);
  const expectedHumanIpr = normalizeDocumentScopeId(args.humanIpr);

  if (expectedTenantId && hasConflictingScopeValue({
    item: args.item,
    expected: expectedTenantId,
    aliases: ["tenantId", "tenant_id", "tenant"],
    requireValue: false
  })) {
    return true;
  }

  if (expectedWorkspaceId && hasConflictingScopeValue({
    item: args.item,
    expected: expectedWorkspaceId,
    aliases: ["workspaceId", "workspace_id", "workspace"],
    requireValue: false
  })) {
    return true;
  }

  if (expectedHumanIpr && hasConflictingScopeValue({
    item: args.item,
    expected: expectedHumanIpr,
    aliases: ["humanIpr", "human_ipr", "ipr", "subjectIpr"],
    requireValue: false
  })) {
    return true;
  }

  return false;
}

function documentProfileMatchesLinkedDirectRequest(args: {
  item: CyberneticDocumentProfileRecallItem;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  requestedSavedChatIds: string[];
  sessionId: string | null;
  requestedFilename: string | null;
}): boolean {
  const requestedMemorySet = directLookupSet(args.requestedMemoryIds);
  const requestedProfileSet = directLookupSet(args.requestedProfileIds);
  const requestedSavedChatSet = directLookupSet(args.requestedSavedChatIds);
  const requestedSessionSet = directLookupSet([args.sessionId]);
  const requestedFilename = normalizeText(args.requestedFilename || "");

  if (directLookupHasExactValue([args.item.profileId], requestedProfileSet)) {
    return true;
  }

  if (directLookupHasExactValue([args.item.memoryId], requestedMemorySet)) {
    return true;
  }

  if (directLookupHasExactValue([args.item.sourceSavedChatId], requestedSavedChatSet)) {
    return true;
  }

  if (directLookupHasExactValue([
    documentProfileString(args.item.publicProfile, "sessionId"),
    documentProfileString(args.item.publicProfile, "threadId")
  ], requestedSessionSet)) {
    return true;
  }

  if (requestedFilename) {
    const filename = normalizeText(args.item.filename || "");
    return Boolean(filename && filename.includes(requestedFilename));
  }

  return false;
}

function isActiveReusableDocumentProfileRecallItem(item: CyberneticDocumentProfileRecallItem): boolean {
  return item.reusableInPrompt !== false && item.profileStatus !== "DELETED";
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
  requestedProfileId: string | null;
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

  if (args.requestedProfileId) {
    attempts.push({ query: args.requestedProfileId });
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
    .filter(isActiveReusableDocumentProfileRecallItem)
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

async function queryDocumentProfilesByLinkedDirectMatch(args: {
  message: string;
  requestedMemoryIds: string[];
  requestedProfileIds: string[];
  requestedFilename: string | null;
  requestedDocFamily: string | null;
  requestedVolume: string | null;
  humanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  sessionId: string | null;
  limit: number;
}): Promise<CyberneticDocumentProfileRecallItem[]> {
  const requestedSavedChatIds = extractRequestedSavedChatIds(args.message);
  const explicitLookupRequested = Boolean(
    args.requestedMemoryIds.length
    || args.requestedProfileIds.length
    || requestedSavedChatIds.length
    || args.requestedFilename
  );

  if (!explicitLookupRequested) {
    return [];
  }

  const scopeAttempts: Array<{
    humanIpr: string | null;
    tenantId: string | null;
    workspaceId: string | null;
  }> = [
    {
      humanIpr: args.humanIpr,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId
    },
    {
      humanIpr: null,
      tenantId: args.tenantId,
      workspaceId: args.workspaceId
    },
    {
      humanIpr: args.humanIpr,
      tenantId: null,
      workspaceId: null
    },
    {
      humanIpr: null,
      tenantId: null,
      workspaceId: null
    }
  ];

  const results: CyberneticDocumentProfileRecallItem[] = [];
  const seenScopeKeys = new Set<string>();
  let lastError: string | null = null;

  for (const scope of scopeAttempts) {
    const scopeKey = [
      scope.humanIpr || "NO_HUMAN_IPR",
      scope.tenantId || "NO_TENANT",
      scope.workspaceId || "NO_WORKSPACE"
    ].join("|");

    if (seenScopeKeys.has(scopeKey)) {
      continue;
    }

    seenScopeKeys.add(scopeKey);

    const queryResult = await listDocumentProfilesFromDatabase({
      humanIpr: scope.humanIpr,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      includeSoftDeleted: false,
      limit: Math.max(args.limit, args.requestedMemoryIds.length + args.requestedProfileIds.length + requestedSavedChatIds.length, 50)
    });

    if (!queryResult.ok) {
      lastError = queryResult.error || "DOCUMENT_PROFILE_DIRECT_LOOKUP_FAILED";
      continue;
    }

    const normalizedRows = queryResult.rows
      .map(normalizeDocumentProfileRow)
      .filter(isActiveReusableDocumentProfileRecallItem)
      .filter((item) =>
        documentProfileMatchesLinkedDirectRequest({
          item,
          requestedMemoryIds: args.requestedMemoryIds,
          requestedProfileIds: args.requestedProfileIds,
          requestedSavedChatIds,
          sessionId: args.sessionId,
          requestedFilename: args.requestedFilename
        })
      )
      .filter((item) => !documentProfileScopeConflicts({
        item,
        humanIpr: args.humanIpr,
        tenantId: args.tenantId,
        workspaceId: args.workspaceId
      }));

    results.push(...normalizedRows);
  }

  const deduped = dedupeDocumentProfileRecallItems(results)
    .sort((a, b) =>
      scoreDocumentProfileFallback(b, args.message, args.requestedMemoryIds) -
      scoreDocumentProfileFallback(a, args.message, args.requestedMemoryIds)
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

function orderedDocumentProfileRecallItemsFromRequests(args: {
  items: CyberneticDocumentProfileRecallItem[];
  requestedProfileIds: string[];
  requestedMemoryIds: string[];
}): CyberneticDocumentProfileRecallItem[] {
  if (!args.items.length) {
    return [];
  }

  const ordered: CyberneticDocumentProfileRecallItem[] = [];
  const seen = new Set<string>();

  const pushOnce = (item: CyberneticDocumentProfileRecallItem, fallbackKey: string): void => {
    const key = item.profileId || item.memoryId || item.fileHash || item.filename || fallbackKey;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    ordered.push(item);
  };

  for (const requestedProfileId of args.requestedProfileIds) {
    const match = args.items.find(
      (item) => item.profileId && item.profileId.toUpperCase() === requestedProfileId.toUpperCase()
    );

    if (match) {
      pushOnce(match, requestedProfileId);
    }
  }

  for (const requestedMemoryId of args.requestedMemoryIds) {
    const match = args.items.find(
      (item) => item.memoryId && item.memoryId.toUpperCase() === requestedMemoryId.toUpperCase()
    );

    if (match) {
      pushOnce(match, requestedMemoryId);
    }
  }

  for (const item of args.items) {
    pushOnce(item, item.profileId || item.memoryId || item.filename || "DOCUMENT_PROFILE");
  }

  return ordered;
}

function documentProfileRecallRegistryStatus(recall: CyberneticDocumentProfileRecall | null): string {
  if (!recall) {
    return "NOT_REQUESTED";
  }

  if (recall.failClosed) {
    return "FAIL_CLOSED";
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
  projectContext?: CyberneticDocumentProjectContext | null;
  recallConfig?: CyberneticDocumentRecallConfig | null;
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
  const inferredDocFamily = inferDocumentRecallFamily(args.message);
  const config = resolveCyberneticDocumentRecallConfig({
    saasContext: args.saasContext,
    projectContext: args.projectContext || null,
    recallConfig: args.recallConfig || null,
    inferredDocFamily,
    promptMaxChars: args.promptMaxChars,
    limit: args.limit
  });
  const requestedDocFamily = inferredDocFamily || config.projectContext.docFamily;
  const requestedVolume = inferDocumentRecallVolume(args.message);
  const maxDocumentCount = Math.max(
    config.maxDocumentCount,
    requestedMemoryIds.length,
    requestedProfileIds.length,
    1
  );

  const base: Omit<CyberneticDocumentProfileRecall, "status" | "injected" | "items" | "profileIds" | "memoryIds" | "promptBlock" | "error"> = {
    enabled: true,
    source: "document_profiles",
    humanIpr,
    tenantId: args.saasContext.tenantId || null,
    workspaceId: args.saasContext.workspaceId || null,
    projectId: config.projectContext.projectId,
    documentModuleId: config.projectContext.documentModuleId,
    sessionId: args.sessionId,
    query: args.message,
    requestedMemoryIds,
    requestedProfileIds,
    requestedFilename,
    requestedDocFamily,
    requestedVolume,
    requestedProjectId: config.projectContext.projectId,
    requestedDocumentModuleId: config.projectContext.documentModuleId,
    recallPolicyMode: config.policyMode,
    maxDocumentCount,
    allowedDocFamilies: config.allowedDocFamilies,
    missingMemoryIds: [],
    missingProfileIds: [],
    failClosed: false,
    failClosedReason: null,
    isolation: emptyCyberneticDocumentRecallIsolationReport(),
    legalCertification: false
  };

  if (config.requireVerifiedIpr && (!humanIpr || args.handoff.identityBinding !== "IPR_VERIFIED_BIOLOGICAL_SUBJECT")) {
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
    const queryLimit = Math.min(maxDocumentCount, 50);
    let queriedItems: CyberneticDocumentProfileRecallItem[] = [];

    if (requestedMemoryIds.length > 1) {
      queriedItems = dedupeDocumentProfileRecallItems((
        await Promise.all(
          requestedMemoryIds.map((requestedMemoryId) =>
            queryDocumentProfilesForRecall({
              message: args.message,
              requestedMemoryId,
              requestedProfileId: null,
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
      ).flat());
    } else if (requestedProfileIds.length > 1) {
      queriedItems = dedupeDocumentProfileRecallItems((
        await Promise.all(
          requestedProfileIds.map((requestedProfileId) =>
            queryDocumentProfilesForRecall({
              message: args.message,
              requestedMemoryId: null,
              requestedProfileId,
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
      ).flat());
    } else {
      queriedItems = await queryDocumentProfilesForRecall({
        message: args.message,
        requestedMemoryId: requestedMemoryIds[0] || null,
        requestedProfileId: requestedProfileIds[0] || null,
        requestedFilename,
        requestedDocFamily,
        requestedVolume,
        humanIpr,
        tenantId: args.saasContext.tenantId || null,
        workspaceId: args.saasContext.workspaceId || null,
        limit: queryLimit
      });
    }

    const directLinkedItems = await queryDocumentProfilesByLinkedDirectMatch({
      message: args.message,
      requestedMemoryIds,
      requestedProfileIds,
      requestedFilename,
      requestedDocFamily,
      requestedVolume,
      humanIpr,
      tenantId: args.saasContext.tenantId || null,
      workspaceId: args.saasContext.workspaceId || null,
      sessionId: args.sessionId || null,
      limit: queryLimit
    });
    queriedItems = dedupeDocumentProfileRecallItems([
      ...directLinkedItems,
      ...queriedItems
    ]);

    const strictItems = applyStrictRequestedDocumentProfileFilter({
      items: queriedItems,
      requestedProfileIds,
      requestedMemoryIds
    });
    const isolated = applyCyberneticDocumentRecallIsolation({
      items: strictItems,
      saasContext: args.saasContext,
      config
    });
    const explicitDirectMatchAvailable = strictItems.some((item) =>
      documentProfileMatchesLinkedDirectRequest({
        item,
        requestedMemoryIds,
        requestedProfileIds,
        requestedSavedChatIds: extractRequestedSavedChatIds(args.message),
        sessionId: args.sessionId || null,
        requestedFilename
      })
    );
    const isolatedItems = isolated.items.length || !explicitDirectMatchAvailable
      ? isolated.items
      : strictItems.filter((item) =>
          !documentProfileScopeConflicts({
            item,
            humanIpr,
            tenantId: args.saasContext.tenantId || null,
            workspaceId: args.saasContext.workspaceId || null
          })
        );
    const orderedItems = config.orderedRecall
      ? orderedDocumentProfileRecallItemsFromRequests({
          items: isolatedItems,
          requestedProfileIds,
          requestedMemoryIds
        })
      : isolatedItems;
    const items = orderedItems.slice(0, queryLimit);
    const profileIds = Array.from(new Set(items.map((item) => item.profileId).filter((item): item is string => Boolean(item))));
    const memoryIds = Array.from(new Set(items.map((item) => item.memoryId).filter((item): item is string => Boolean(item))));
    const memoryIdSet = new Set(memoryIds.map((memoryId) => memoryId.toUpperCase()));
    const profileIdSet = new Set(profileIds.map((profileId) => profileId.toUpperCase()));
    const missingMemoryIds = requestedMemoryIds.filter((memoryId) => !memoryIdSet.has(memoryId.toUpperCase()));
    const missingProfileIds = requestedProfileIds.filter((profileId) => !profileIdSet.has(profileId.toUpperCase()));
    const explicitRequestCount = requestedMemoryIds.length + requestedProfileIds.length;
    const failClosed = Boolean(
      explicitRequestCount > 0
      && config.failClosedOnMissingRequestedIds
      && (missingMemoryIds.length > 0 || missingProfileIds.length > 0)
    );
    const failClosedReason = failClosed
      ? "Requested document memory/profile set is incomplete under the active recall policy. Prompt injection blocked."
      : null;
    const injectableItems = failClosed ? [] : items;
    const promptBlock = buildDocumentProfilePromptBlock(injectableItems, config.promptMaxChars ?? args.promptMaxChars);

    return {
      ...base,
      injected: injectableItems.length > 0,
      status: failClosed
        ? "DOCUMENT_PROFILE_RECALL_FAIL_CLOSED"
        : injectableItems.length > 0
          ? "DOCUMENT_PROFILE_RECALL_INJECTED"
          : "DOCUMENT_PROFILE_RECALL_EMPTY",
      items: injectableItems,
      profileIds: Array.from(new Set(injectableItems.map((item) => item.profileId).filter((item): item is string => Boolean(item)))),
      memoryIds: Array.from(new Set(injectableItems.map((item) => item.memoryId).filter((item): item is string => Boolean(item)))),
      missingMemoryIds,
      missingProfileIds,
      failClosed,
      failClosedReason,
      isolation: isolated.isolation,
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

  return orderedDocumentProfileRecallItemsFromRequests({
    items: documentProfileRecall.items,
    requestedProfileIds: extractRequestedDocumentProfileIds(message),
    requestedMemoryIds: extractRequestedIprMemoryIds(message)
  });
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
  const missingProfileIds = args.documentProfileRecall?.missingProfileIds?.length
    ? args.documentProfileRecall.missingProfileIds
    : requestedProfileIds.filter((profileId) => !visibleProfileIds.includes(profileId));
  const missingMemoryIds = args.documentProfileRecall?.missingMemoryIds?.length
    ? args.documentProfileRecall.missingMemoryIds
    : requestedMemoryIds.filter((memoryId) => !visibleMemoryIds.includes(memoryId));
  const expectedProfileCount = requestedProfileIds.length || requestedMemoryIds.length || documentProfiles.length;
  const failClosed = Boolean(args.documentProfileRecall?.failClosed);
  const complete =
    !failClosed &&
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
    failClosed
      ? "MULTI_DOCUMENT_MEMORY_RECALL_FAIL_CLOSED"
      : complete
        ? "MULTI_DOCUMENT_MEMORY_RECALL_READY"
        : "MULTI_DOCUMENT_MEMORY_RECALL_PARTIAL",
    `DOCUMENT_MEMORY_RECALL_READY: ${String(!failClosed && documentProfiles.length > 0)}`,
    "MEMORY_CHAIN_RECALL_READY: true",
    "",
    "1. Stato multi-document recall",
    `engineRevision: ${CYBERNETIC_DOCUMENT_RECALL_ENGINE_REVISION}`,
    `documentRegistry.status: ${documentRegistryStatus}`,
    `recallPolicyMode: ${args.documentProfileRecall?.recallPolicyMode || "UNSPECIFIED"}`,
    `projectId: ${args.documentProfileRecall?.projectId || args.saasContext.projectId || args.projectContext?.projectId || "NO_PROJECT_ID"}`,
    `documentModuleId: ${args.documentProfileRecall?.documentModuleId || args.saasContext.documentModuleId || args.projectContext?.documentModuleId || "NO_DOCUMENT_MODULE_ID"}`,
    `linkedProfileCount: ${String(documentProfiles.length)}`,
    `expectedProfileCount: ${String(expectedProfileCount || documentProfiles.length)}`,
    `maxDocumentCount: ${String(args.documentProfileRecall?.maxDocumentCount || "NO_MAX_DOCUMENT_COUNT")}`,
    `requestedMemoryIds: ${requestedMemoryIds.join(", ") || "NO_REQUESTED_MEMORY_IDS"}`,
    `requestedDocumentProfileIds: ${requestedProfileIds.join(", ") || "NO_REQUESTED_DOCUMENT_PROFILE_IDS"}`,
    `memoryIds: ${visibleMemoryIds.join(", ") || "NO_MEMORY_IDS"}`,
    `profileIds: ${visibleProfileIds.join(", ") || "NO_PROFILE_IDS"}`,
    `missingMemoryIds: ${missingMemoryIds.join(", ") || "NONE"}`,
    `missingProfileIds: ${missingProfileIds.join(", ") || "NONE"}`,
    `failClosed: ${String(failClosed)}`,
    `failClosedReason: ${args.documentProfileRecall?.failClosedReason || "NONE"}`,
    `recallInjected: ${String(args.recall.injected)}`,
    `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
    `recallItemsCount: ${String(args.recall.items.length)}`,
    `documentProfileItemsCount: ${String(args.documentProfileRecall?.items.length || 0)}`,
    `strictDocumentProfileFilter: ${requestedProfileIds.length > 0 ? "REQUESTED_PROFILE_SET_APPLIED" : "NO_REQUESTED_PROFILE_ID"}`,
    "",
    "2. Scope isolation",
    `tenantScoped: ${String(args.documentProfileRecall?.isolation.tenantScoped || false)}`,
    `workspaceScoped: ${String(args.documentProfileRecall?.isolation.workspaceScoped || false)}`,
    `projectScoped: ${String(args.documentProfileRecall?.isolation.projectScoped || false)}`,
    `docFamilyScoped: ${String(args.documentProfileRecall?.isolation.docFamilyScoped || false)}`,
    `rejectedByTenant: ${String(args.documentProfileRecall?.isolation.rejectedByTenant || 0)}`,
    `rejectedByWorkspace: ${String(args.documentProfileRecall?.isolation.rejectedByWorkspace || 0)}`,
    `rejectedByProject: ${String(args.documentProfileRecall?.isolation.rejectedByProject || 0)}`,
    `rejectedByDocFamily: ${String(args.documentProfileRecall?.isolation.rejectedByDocFamily || 0)}`,
    "",
    "3. Profili documentali richiamati",
    sections.join("\n").trim() || "NO_DOCUMENT_PROFILES",
    "",
    "4. Collegamento HBCE",
    `Human IPR: ${args.handoff.humanIpr || "NO_HUMAN_IPR"}`,
    `Runtime memory ID: ${args.memory.memoryId || "NO_RUNTIME_MEMORY_ID"}`,
    `Tenant: ${args.saasContext.tenantId || "NO_TENANT"}`,
    `Workspace: ${args.saasContext.workspaceId || "NO_WORKSPACE"}`,
    "",
    "5. Boundary",
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
      `documentRegistry.status: ${documentProfileRecallRegistryStatus(args.documentProfileRecall)}`,
      `recallPolicyMode: ${args.documentProfileRecall?.recallPolicyMode || "UNSPECIFIED"}`,
      `projectId: ${args.documentProfileRecall?.projectId || args.saasContext.projectId || args.projectContext?.projectId || "NO_PROJECT_ID"}`,
      `documentModuleId: ${args.documentProfileRecall?.documentModuleId || args.saasContext.documentModuleId || args.projectContext?.documentModuleId || "NO_DOCUMENT_MODULE_ID"}`,
      `failClosed: ${String(args.documentProfileRecall?.failClosed || false)}`,
      `failClosedReason: ${args.documentProfileRecall?.failClosedReason || "NONE"}`,
      `requestedMemoryIds: ${requestedMemoryIds.join(", ") || "NO_REQUESTED_MEMORY_IDS"}`,
      `requestedDocumentProfileIds: ${requestedProfileIds.join(", ") || "NO_REQUESTED_DOCUMENT_PROFILE_IDS"}`,
      `memoryRecallStatus: ${args.recall.status}`,
      `memoryRecallInjected: ${String(args.recall.injected)}`,
      `documentProfileRecallStatus: ${args.documentProfileRecall?.status || "DOCUMENT_PROFILE_RECALL_NOT_EXECUTED"}`,
      `documentProfileRecallInjected: ${String(args.documentProfileRecall?.injected || false)}`,
      `linkedProfileCount: ${String(args.documentProfileRecall?.items.length || 0)}`,
      `memoryIds: ${args.recall.memoryIds.join(", ") || "NO_MEMORY_IDS"}`,
      `profileIds: ${args.documentProfileRecall?.profileIds.join(", ") || "NO_PROFILE_IDS"}`,
      `missingMemoryIds: ${args.documentProfileRecall?.missingMemoryIds.join(", ") || "NONE"}`,
      `missingProfileIds: ${args.documentProfileRecall?.missingProfileIds.join(", ") || "NONE"}`,
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
    `recallPolicyMode: ${args.documentProfileRecall?.recallPolicyMode || "UNSPECIFIED"}`,
    `projectId: ${args.documentProfileRecall?.projectId || args.saasContext.projectId || args.projectContext?.projectId || "NO_PROJECT_ID"}`,
    `documentModuleId: ${args.documentProfileRecall?.documentModuleId || args.saasContext.documentModuleId || args.projectContext?.documentModuleId || "NO_DOCUMENT_MODULE_ID"}`,
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
    `missingMemoryIds: ${args.documentProfileRecall?.missingMemoryIds.join(", ") || "NONE"}`,
    `missingProfileIds: ${args.documentProfileRecall?.missingProfileIds.join(", ") || "NONE"}`,
    `failClosed: ${String(args.documentProfileRecall?.failClosed || false)}`,
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

