import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import core from "../../../corpus-core.js";

import {
  appendEvtMemory,
  buildMemoryFile,
  detectDocumentFamilyFromText,
  getEvtMemoryContext,
  type DocumentFamily,
  type EvtMemoryFile,
  type RuntimeDecision as MemoryRuntimeDecision,
  type RuntimeState as MemoryRuntimeState
} from "../../../lib/evt-memory";

import {
  appendEvtMemoryEvent,
  buildEvtMemoryContextFromLedger
} from "../../../lib/evt-memory-ledger";

import { classifyContext as classifyRuntimeContext } from "../../../lib/context-classifier";
import {
  classifyProjectDomain,
  type ProjectDomainClassification
} from "../../../lib/project-domain-classifier";
import {
  classifyHbceModule,
  type HbceModuleClassification
} from "../../../lib/hbce-module-classifier";
import {
  buildSafeConceptProjectDomain,
  classifySafeConcept
} from "../../../lib/safe-concept-classifier";
import { classifyData } from "../../../lib/data-classifier";
import { evaluateFileBatchPolicy } from "../../../lib/file-policy";
import { evaluatePolicy } from "../../../lib/policy-engine";
import { evaluateRisk } from "../../../lib/risk-engine";
import { evaluateHumanOversight } from "../../../lib/human-oversight";
import { decideRuntimeAction } from "../../../lib/runtime-decision";

import { createRuntimeEvent, toPublicRuntimeEvent } from "../../../lib/evt";
import { appendEvent, getLastEventReference } from "../../../lib/evt-ledger";

import {
  createOpcProofRecord,
  toPublicOpcProofRecord,
  verifyOpcProofRecord,
  type OpcProofPublicView,
  type OpcProofRecord,
  type OpcRuntimeDecision,
  type OpcRuntimeSnapshot,
  type OpcRuntimeState,
  type OpcRiskClass
} from "../../../lib/opc-proof";

import {
  appendOpcProofRecord,
  getLastOpcProofHash,
  type OpcAppendResult
} from "../../../lib/opc-ledger";

import {
  buildFallback,
  buildSafeIdentityProjectDomain,
  buildSystemPrompt,
  detectDocumentMode,
  isRuntimeDiagnosticRequest,
  isSafeIdentityGovernanceQuestion,
  normalizeProjectDomainClassification,
  shouldExposeTechnicalFrame,
  shouldUseStructuredFormat,
  type DocumentMode,
  type GovernanceFrame,
  type JokerRuntimeIdentity
} from "../../../lib/joker-prompt";

import { applyResponseContract } from "../../../lib/joker-response-contract";

import { buildProofHash, buildRuntimeHash } from "../../../lib/runtime-hash";

import {
  getHbceModuleMetadata,
  type ContextClass,
  type DataClassification,
  type IntentClass,
  type OperationStatus,
  type OversightEvaluation,
  type PolicyEvaluation,
  type ProjectDomain,
  type RiskEvaluation,
  type RuntimeDecision as GovernanceDecision,
  type RuntimeDecisionResult,
  type RuntimeState as GovernanceRuntimeState
} from "../../../lib/runtime-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LegacyContextClass = ContextClass;

type FileInput = EvtMemoryFile;

type ChatBody = {
  message?: string;
  sessionId?: string;
  files?: FileInput[];
  continuityRef?: string | null;
};

type NormalizedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  role: string;
  text: string;
};

type LegacyRuntimeEvent = {
  evt: string;
  prev: string;
  t: string;
  entity: string;
  ipr: string;
  kind: string;
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  contextClass: LegacyContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  anchors: {
    hash: string;
    publicHash: string;
    fullHash: string;
    digest: string;
    algorithm: "sha256";
  };
  continuityRef: string | null;
};

type GeneratedResponse = {
  text: string;
  state: MemoryRuntimeState;
  degradedReason?: string | null;
};

type ResolvedMemoryContext = {
  used: boolean;
  source: string;
  text: string;
  semanticState: {
    documentFamily: DocumentFamily;
    projectDomain?: ProjectDomain;
    activeDomains?: ProjectDomain[];
  } | null;
  lastEventId: string | null;
};

type OpcRuntimeResult = {
  record: OpcProofRecord;
  publicProof: OpcProofPublicView;
  append: OpcAppendResult;
  verification: ReturnType<typeof verifyOpcProofRecord>;
};

type EnrichedGovernanceFrame = GovernanceFrame & {
  hbceModule: HbceModuleClassification;
};

type HbceModuleValue = HbceModuleClassification["activeModules"][number];

type StrategicDoctrineKind =
  | "ALL"
  | "CYBERSECURITY"
  | "DATA_PROTECTION"
  | "INFORMATION_GOVERNANCE";

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 4600;
const MAX_DATA_CLASSIFICATION_CHARS = 24000;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const USE_DEMOCRATIC_BOUNDARY =
  "Identity verified first. Choice separated after. Vote anonymized. Process auditable.";

const HBCE_AI_BOUNDARY =
  "The AI model does not govern HBCE. HBCE governs the use of AI models.";

const FIVE_COLLECTIONS = [
  "MATRIX",
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "HBCE_ECOSISTEMA_AI"
] as const;

const SEVEN_HBCE_MODULES = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "MATRIX"
] as const;

const STRATEGIC_DOCTRINES = [
  "HBCE_CYBERSECURITY_STRATEGY",
  "HBCE_DATA_PROTECTION_STRATEGY",
  "HBCE_INFORMATION_GOVERNANCE_STRATEGY"
] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function buildEvtId(): string {
  return `EVT-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2, 10)
    .padEnd(8, "0")}`;
}

function normalizeBody(body: ChatBody) {
  return {
    message: typeof body.message === "string" ? body.message.trim() : "",
    sessionId:
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : `JOKER-SESSION-${Date.now()}`,
    files: Array.isArray(body.files) ? body.files : [],
    continuityRef:
      typeof body.continuityRef === "string" && body.continuityRef.trim()
        ? body.continuityRef.trim()
        : null
  };
}

function getPrimaryIdentity(): JokerRuntimeIdentity {
  const record = core.getAIJokerIPRRecord?.() || core.AI_JOKER_IPR_RECORD;
  const aiRoot = core.getPrimaryAIIdentity?.() || core.IDENTITY_LINEAGE?.ai_root;

  return {
    entity: record?.entity || aiRoot?.entity || "AI_JOKER",
    ipr: record?.ipr || aiRoot?.ipr || "IPR-AI-0001",
    evt: record?.evt || aiRoot?.evt || "EVT-0015-AI",
    state: record?.state || aiRoot?.status || "LOCKED",
    cycle: record?.cycle || aiRoot?.cycle || "UP-MESE-4",
    core: record?.core || aiRoot?.core || "HBCE-CORE-v3",
    org: record?.org || "HERMETICUM B.C.E. S.r.l.",
    location: Array.isArray(record?.loc)
      ? record.loc.join(", ")
      : "Torino, Italy"
  };
}

function normalizeFiles(files: FileInput[]): NormalizedFile[] {
  return files.map((file, index) => {
    const text = String(file.text || file.content || "").trim();

    return {
      id: file.id || `file-${index + 1}`,
      name: file.name?.trim() || `file_${index + 1}`,
      type: file.type || "unknown",
      size: typeof file.size === "number" ? file.size : text.length,
      role: file.role || "context",
      text
    };
  });
}

function detectDocumentFamily(files: FileInput[]): DocumentFamily {
  const merged = normalizeFiles(files)
    .map((file) => `${file.name}\n${file.text.slice(0, 50000)}`)
    .join("\n\n");

  return detectDocumentFamilyFromText(merged);
}

function resolveDocumentFamily(input: {
  files: FileInput[];
  memory: ResolvedMemoryContext;
  message: string;
  projectDomain: ProjectDomainClassification;
}): DocumentFamily {
  if (input.files.length > 0) {
    return detectDocumentFamily(input.files);
  }

  if (input.memory.semanticState?.documentFamily) {
    return input.memory.semanticState.documentFamily;
  }

  if (input.projectDomain.projectDomain === "U.S.E.") {
    return "USE";
  }

  return detectDocumentFamilyFromText(input.message);
}

function extractResponseText(response: unknown): string {
  const maybe = response as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const content = maybe.choices?.[0]?.message?.content;

  return typeof content === "string" ? content.trim() : "";
}

function normalizeRuntimeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function runtimeTextIncludesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function isRuntimeSelfIdentityQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    (runtimeTextIncludesAny(text, [
      "chi sei",
      "cosa sei",
      "presentati",
      "identificati",
      "who are you",
      "what are you"
    ]) &&
      runtimeTextIncludesAny(text, ["joker", "ai joker", "tu", "runtime", "c2"])) ||
    text === "chi sei?" ||
    text === "chi sei"
  );
}

function isManuelColettaIdentityQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, [
      "manuel coletta",
      "mnauel coletta",
      "manuele coletta"
    ]) &&
    runtimeTextIncludesAny(text, ["chi e", "chi è", "cos e", "cosa e", "who is"])
  );
}

function isAerospaceGovernanceBoundaryQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  const hasAerospaceContext = runtimeTextIncludesAny(text, [
    "astronave",
    "astronavi",
    "razzo",
    "razzi",
    "rocket",
    "spacecraft",
    "spazio",
    "aerospace",
    "settore spaziale",
    "orbita",
    "satellite",
    "satelliti"
  ]);

  const hasControlLanguage = runtimeTextIncludesAny(text, [
    "guidare",
    "pilotare",
    "indirizzare",
    "controllare",
    "controllo di volo",
    "flight control",
    "guidance",
    "navigation",
    "gnc",
    "lancio",
    "traiettoria"
  ]);

  const hasWeaponLanguage = runtimeTextIncludesAny(text, [
    "missile",
    "missili",
    "bersaglio",
    "target",
    "targeting",
    "colpire",
    "arma",
    "weapon"
  ]);

  return hasAerospaceContext && hasControlLanguage && !hasWeaponLanguage;
}

function isStrategicDoctrineQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "documenti dottrinali strategici",
    "documenti dottrinali",
    "dottrina strategica",
    "dottrinali strategici",
    "strategic doctrine",
    "strategic doctrines",
    "documenti strategici",
    "tre documenti",
    "3 documenti",
    "hbce cybersecurity strategy",
    "cybersecurity strategy",
    "cyber security strategy",
    "hbce data protection strategy",
    "data protection strategy",
    "hbce information governance strategy",
    "information governance strategy",
    "numero 1",
    "numero uno",
    "il numero 1",
    "il primo",
    "primo documento",
    "questo 1",
    "1. hbce cybersecurity strategy",
    "specifiche del 1",
    "specifiche de numero 1",
    "specifiche del numero 1",
    "mostrami il 1",
    "numero 2",
    "numero due",
    "il numero 2",
    "il secondo",
    "secondo documento",
    "questo 2",
    "numero 3",
    "numero tre",
    "il numero 3",
    "il terzo",
    "terzo documento",
    "questo 3",
    "mostrami documenti"
  ]);
}

function getStrategicDoctrineKind(message: string): StrategicDoctrineKind {
  const text = normalizeRuntimeText(message);

  if (
    runtimeTextIncludesAny(text, [
      "numero 1",
      "numero uno",
      "il numero 1",
      "il primo",
      "primo documento",
      "questo 1",
      "1. hbce cybersecurity strategy",
      "specifiche del 1",
      "specifiche de numero 1",
      "specifiche del numero 1",
      "mostrami il 1",
      "cybersecurity strategy",
      "cyber security strategy",
      "hbce cybersecurity strategy"
    ])
  ) {
    return "CYBERSECURITY";
  }

  if (
    runtimeTextIncludesAny(text, [
      "numero 2",
      "numero due",
      "il numero 2",
      "il secondo",
      "secondo documento",
      "questo 2",
      "data protection strategy",
      "hbce data protection strategy"
    ])
  ) {
    return "DATA_PROTECTION";
  }

  if (
    runtimeTextIncludesAny(text, [
      "numero 3",
      "numero tre",
      "il numero 3",
      "il terzo",
      "terzo documento",
      "questo 3",
      "information governance strategy",
      "hbce information governance strategy"
    ])
  ) {
    return "INFORMATION_GOVERNANCE";
  }

  return "ALL";
}

function getStrategicDoctrineActiveModules(
  kind: StrategicDoctrineKind
): HbceModuleValue[] {
  switch (kind) {
    case "CYBERSECURITY":
      return ["CyberGlobal", "MATRIX", "OPC", "UNEBDO"];

    case "DATA_PROTECTION":
      return ["OPC", "MATRIX", "IOspace", "MetaExchange"];

    case "INFORMATION_GOVERNANCE":
      return ["MATRIX", "MetaExchange", "IOspace", "NeuroLoop", "OPC"];

    case "ALL":
    default:
      return [
        "MATRIX",
        "CyberGlobal",
        "OPC",
        "UNEBDO",
        "IOspace",
        "MetaExchange",
        "NeuroLoop"
      ];
  }
}

function getStrategicDoctrinePrimaryModule(
  kind: StrategicDoctrineKind
): HbceModuleValue {
  switch (kind) {
    case "CYBERSECURITY":
      return "CyberGlobal";

    case "DATA_PROTECTION":
      return "OPC";

    case "INFORMATION_GOVERNANCE":
      return "MATRIX";

    case "ALL":
    default:
      return "MATRIX";
  }
}

function isPragmaticGovernanceValueQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  const targetTerms = [
    "banche",
    "banca",
    "bank",
    "banks",
    "banking",
    "settore bancario",
    "istituti bancari",
    "studi legali",
    "studio legale",
    "law firm",
    "law firms",
    "legal office",
    "legal offices",
    "governance",
    "governace",
    "compliance",
    "audit",
    "due diligence",
    "pubblica amministrazione",
    "pa",
    "b2b",
    "b2g",
    "aziende",
    "imprese",
    "istituzioni",
    "governi"
  ];

  const valueTerms = [
    "valore",
    "valore pragmatico",
    "valore operativo",
    "a cosa serve",
    "cosa serve",
    "serve",
    "utilita",
    "utilità",
    "pragmatico",
    "pragmaticamente",
    "in modo pragmatico",
    "che valore ha",
    "per banche",
    "per le banche",
    "per studi legali",
    "per gli studi legali",
    "per governance",
    "per la governance"
  ];

  return (
    runtimeTextIncludesAny(text, targetTerms) &&
    runtimeTextIncludesAny(text, valueTerms) &&
    !hasExplicitOperationalActionRequest(message)
  );
}

function isCanonicalStackQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "ipr",
    "evt",
    "opc",
    "hbce",
    "unebdo",
    "metaexchange",
    "iospace",
    "cyberglobal",
    "neuroloop",
    "matrix",
    "modulo matrix",
    "matrix organizza",
    "sette moduli",
    "7 moduli",
    "moduli hbce",
    "diagnostica runtime",
    "ai joker-c2",
    "joker-c2",
    "hbce ecosistema ai"
  ]);
}

function isHbceAiGovernanceQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "hbce ecosistema ai",
    "ecosistema ai",
    "ai governance",
    "governance ai",
    "governare l ai",
    "governo dell ai",
    "ai audit",
    "ipr ai audit trail",
    "model governance",
    "governance modelli",
    "openai",
    "anthropic",
    "claude",
    "google ai",
    "gemini",
    "mistral",
    "meta ai",
    "llama",
    "runtime ai governato"
  ]);
}

function hasExplicitMemoryReference(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "come prima",
    "prima",
    "sopra",
    "precedente",
    "abbiamo",
    "continua",
    "riprendi",
    "questo",
    "questa",
    "questi",
    "quello",
    "quella",
    "file attivi",
    "testo sopra",
    "chat",
    "memoria",
    "ricordi",
    "fatto",
    "mandata",
    "ok vai"
  ]);
}

function shouldInjectEvtMemoryIntoPrompt(input: {
  message: string;
  files: FileInput[];
  memory: ResolvedMemoryContext;
  governance: EnrichedGovernanceFrame;
  documentFamily: DocumentFamily;
}): boolean {
  if (!input.memory.used || !input.memory.text.trim()) {
    return false;
  }

  if (input.files.length > 0) {
    return true;
  }

  if (isRuntimeDiagnosticRequest(input.message)) {
    return true;
  }

  if (isStrategicDoctrineQuestion(input.message)) {
    return true;
  }

  if (isPragmaticGovernanceValueQuestion(input.message)) {
    return true;
  }

  if (
    isRuntimeSelfIdentityQuestion(input.message) ||
    isManuelColettaIdentityQuestion(input.message) ||
    isAerospaceGovernanceBoundaryQuestion(input.message)
  ) {
    return hasExplicitMemoryReference(input.message);
  }

  if (hasExplicitMemoryReference(input.message)) {
    return true;
  }

  if (
    input.governance.contextClass === "DOCUMENTAL" ||
    input.governance.contextClass === "EDITORIAL" ||
    input.governance.contextClass === "GITHUB" ||
    input.governance.contextClass === "CORPUS" ||
    input.governance.contextClass === "APOKALYPSIS" ||
    input.governance.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.governance.intentClass === "REWRITE" ||
    input.governance.intentClass === "TRANSFORM"
  ) {
    return true;
  }

  const memoryFamily = input.memory.semanticState?.documentFamily;

  if (memoryFamily && memoryFamily === input.documentFamily) {
    return true;
  }

  return false;
}

function getEffectiveMemorySource(input: {
  memory: ResolvedMemoryContext;
  injected: boolean;
}): string {
  if (input.injected) {
    return input.memory.source;
  }

  if (input.memory.used) {
    return "AVAILABLE_NOT_INJECTED";
  }

  return "NONE";
}

function buildRuntimeIdentityProjectDomain(
  base: ProjectDomainClassification
): ProjectDomainClassification {
  return {
    ...base,
    projectDomain: "MATRIX" as ProjectDomain,
    activeDomains: ["MATRIX" as ProjectDomain],
    confidence: Math.max(base.confidence || 0, 0.98),
    reasons: [
      ...base.reasons,
      "Runtime identity question mapped to MATRIX because AI JOKER-C2 is the governed runtime demonstrator of the HBCE/MATRIX stack."
    ]
  };
}

function buildOriginIdentityProjectDomain(
  base: ProjectDomainClassification
): ProjectDomainClassification {
  return {
    ...base,
    projectDomain: "MATRIX" as ProjectDomain,
    activeDomains: ["MATRIX" as ProjectDomain, "U.S.E." as ProjectDomain],
    confidence: Math.max(base.confidence || 0, 0.97),
    reasons: [
      ...base.reasons,
      "Manuel Coletta identity question mapped to HBCE/MATRIX origin context."
    ]
  };
}

function buildAerospaceGovernanceProjectDomain(
  base: ProjectDomainClassification
): ProjectDomainClassification {
  return {
    ...base,
    projectDomain: "MULTI_DOMAIN" as ProjectDomain,
    activeDomains: ["MATRIX" as ProjectDomain],
    confidence: Math.max(base.confidence || 0, 0.96),
    reasons: [
      ...base.reasons,
      "Aerospace-adjacent wording mapped to governance/audit boundary, not flight control."
    ]
  };
}

function buildHbceAiProjectDomain(
  base: ProjectDomainClassification
): ProjectDomainClassification {
  return {
    ...base,
    projectDomain: "HBCE_ECOSISTEMA_AI" as ProjectDomain,
    activeDomains: ["HBCE_ECOSISTEMA_AI" as ProjectDomain, "MATRIX" as ProjectDomain],
    domainType: "AI_GOVERNANCE_ECOSYSTEM_DOMAIN",
    confidence: Math.max(base.confidence || 0, 0.96),
    reasons: [
      ...base.reasons,
      "HBCE ECOSISTEMA AI / AI governance language mapped to the fifth canonical project collection."
    ]
  };
}

function buildStrategicDoctrineProjectDomain(
  base: ProjectDomainClassification
): ProjectDomainClassification {
  return {
    ...base,
    projectDomain: "MULTI_DOMAIN" as ProjectDomain,
    activeDomains: ["MATRIX" as ProjectDomain, "HBCE_ECOSISTEMA_AI" as ProjectDomain],
    primaryDomain: "MULTI_DOMAIN" as ProjectDomain,
    domainType: "ECOSYSTEM_OPERATION",
    confidence: Math.max(base.confidence || 0, 0.98),
    reasons: [
      ...base.reasons,
      "Strategic doctrine request mapped to MULTI_DOMAIN because doctrine documents support MATRIX, HBCE ECOSISTEMA AI and HBCE modules without being collections or modules."
    ]
  };
}

function buildPragmaticGovernanceValueProjectDomain(
  base: ProjectDomainClassification
): ProjectDomainClassification {
  return {
    ...base,
    projectDomain: "MULTI_DOMAIN" as ProjectDomain,
    activeDomains: ["MATRIX" as ProjectDomain, "HBCE_ECOSISTEMA_AI" as ProjectDomain],
    primaryDomain: "MULTI_DOMAIN" as ProjectDomain,
    domainType: "ECOSYSTEM_OPERATION",
    confidence: Math.max(base.confidence || 0, 0.97),
    reasons: [
      ...base.reasons,
      "Pragmatic banking, legal, compliance or governance value request mapped to MULTI_DOMAIN.",
      "The request concerns B2B/B2G operational value, auditability, proof receipts, data protection and information governance."
    ]
  };
}

function withHbceModuleOverride(
  base: HbceModuleClassification,
  module: HbceModuleValue,
  activeModules: HbceModuleValue[],
  confidence: number,
  reasons: string[]
): HbceModuleClassification {
  const metadata = getHbceModuleMetadata(module);

  return {
    ...base,
    module,
    activeModules,
    primaryModule: module,
    moduleType: metadata.moduleType,
    confidence: Math.max(base.confidence || 0, confidence),
    reasons: [...base.reasons, ...reasons]
  };
}

function normalizeHbceModuleClassification(input: {
  message: string;
  classification: HbceModuleClassification;
  projectDomain: ProjectDomainClassification;
  contextClass: ContextClass;
  intentClass: IntentClass;
}): HbceModuleClassification {
  const base = input.classification;
  const text = normalizeRuntimeText(input.message);

  if (isStrategicDoctrineQuestion(input.message)) {
    const kind = getStrategicDoctrineKind(input.message);
    return withHbceModuleOverride(
      base,
      getStrategicDoctrinePrimaryModule(kind),
      getStrategicDoctrineActiveModules(kind),
      0.98,
      [
        "Strategic doctrine request mapped to HBCE doctrine layer.",
        "Doctrine documents are not collections and are not modules, but they activate connected HBCE modules for runtime traceability."
      ]
    );
  }

  if (isPragmaticGovernanceValueQuestion(input.message)) {
    return withHbceModuleOverride(
      base,
      "MATRIX",
      ["MATRIX", "OPC", "MetaExchange", "IOspace", "CyberGlobal"],
      0.97,
      [
        "Pragmatic value request for banking, legal offices or governance mapped to MATRIX.",
        "OPC, MetaExchange, IOspace and CyberGlobal are active because the request concerns auditability, proof receipts, controlled exchange, visibility and defensive governance."
      ]
    );
  }

  if (isRuntimeSelfIdentityQuestion(input.message)) {
    return withHbceModuleOverride(
      base,
      "UNEBDO",
      ["UNEBDO", "OPC", "NeuroLoop", "MATRIX"],
      0.98,
      [
        "Self-identity request mapped to UNEBDO because it concerns runtime identity and IPR binding.",
        "OPC and NeuroLoop are active because the answer is event-bound and runtime-governed.",
        "MATRIX is active because it organizes identity, event, proof and runtime architecture."
      ]
    );
  }

  if (isManuelColettaIdentityQuestion(input.message)) {
    return withHbceModuleOverride(
      base,
      "UNEBDO",
      ["UNEBDO", "OPC", "MATRIX"],
      0.97,
      [
        "Origin identity request mapped to UNEBDO because it concerns the biological/project origin and canonical IPR root.",
        "OPC is active for continuity proof framing.",
        "MATRIX is active for system-level organization."
      ]
    );
  }

  if (isAerospaceGovernanceBoundaryQuestion(input.message)) {
    return withHbceModuleOverride(
      base,
      "OPC",
      ["OPC", "CyberGlobal", "MetaExchange", "MATRIX"],
      0.96,
      [
        "Aerospace-adjacent request mapped to OPC/CyberGlobal governance boundary.",
        "HBCE must not be represented as guidance, targeting or physical flight-control software.",
        "MATRIX is active for system coordination and architecture framing."
      ]
    );
  }

  if (
    input.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    isHbceAiGovernanceQuestion(input.message)
  ) {
    return withHbceModuleOverride(
      base,
      text.includes("opc") || text.includes("proof") || text.includes("audit")
        ? "OPC"
        : "MATRIX",
      ["MATRIX", "UNEBDO", "OPC", "NeuroLoop", "CyberGlobal"],
      0.95,
      [
        "HBCE ECOSISTEMA AI context mapped to MATRIX, UNEBDO, OPC, NeuroLoop and CyberGlobal.",
        "MATRIX organizes the AI governance architecture.",
        "UNEBDO binds identity and anchoring.",
        "OPC provides proof receipts.",
        "NeuroLoop supports validation and feedback.",
        "CyberGlobal supports defensive AI/cyber governance."
      ]
    );
  }

  if (isCanonicalStackQuestion(input.message)) {
    const activeModules = new Set<HbceModuleValue>(base.activeModules);

    if (text.includes("opc")) activeModules.add("OPC");
    if (text.includes("cyber") || text.includes("sicurezza")) {
      activeModules.add("CyberGlobal");
    }
    if (text.includes("neuro") || text.includes("decision")) {
      activeModules.add("NeuroLoop");
    }
    if (text.includes("metaexchange") || text.includes("scambio")) {
      activeModules.add("MetaExchange");
    }
    if (text.includes("iospace") || text.includes("interfaccia")) {
      activeModules.add("IOspace");
    }

    activeModules.add("UNEBDO");
    activeModules.add("OPC");
    activeModules.add("MATRIX");

    const module: HbceModuleValue =
      text.includes("matrix") ||
      text.includes("sette moduli") ||
      text.includes("7 moduli") ||
      text.includes("moduli hbce")
        ? "MATRIX"
        : text.includes("opc") && !text.includes("ipr")
          ? "OPC"
          : "UNEBDO";

    return withHbceModuleOverride(
      base,
      module,
      Array.from(activeModules),
      0.95,
      [
        "Canonical HBCE/IPR/EVT/OPC/MATRIX vocabulary detected.",
        "Module classification normalized to avoid NONE on obvious HBCE stack questions.",
        "MATRIX is included as the seventh HBCE technical-operational module."
      ]
    );
  }

  if (
    input.projectDomain.projectDomain === "U.S.E." ||
    input.contextClass === "USE" ||
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE"
  ) {
    const module: HbceModuleValue =
      base.module === "NONE" ? "UNEBDO" : base.module;

    const activeModules: HbceModuleValue[] =
      base.activeModules.length > 0 && !base.activeModules.includes("NONE")
        ? Array.from(
            new Set<HbceModuleValue>([
              ...base.activeModules,
              "MATRIX"
            ])
          )
        : [
            "UNEBDO",
            "OPC",
            "MetaExchange",
            "CyberGlobal",
            "NeuroLoop",
            "MATRIX"
          ];

    return withHbceModuleOverride(
      base,
      module,
      activeModules,
      0.94,
      [
        "U.S.E. / voto digitale federato context mapped to identity, continuity, exchange, cyber, validation and MATRIX coordination modules."
      ]
    );
  }

  return base;
}

async function generateResponse(input: {
  identity: JokerRuntimeIdentity;
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: FileInput[];
  memoryText: string;
  memoryUsed: boolean;
  memorySource: string;
  structuredFormat: boolean;
  governanceFrame: EnrichedGovernanceFrame;
}): Promise<GeneratedResponse> {
  if (!openai) {
    return {
      text: applyResponseContract(input.message, buildFallback(input)),
      state: "DEGRADED",
      degradedReason: "OPENAI_API_KEY_NOT_CONFIGURED"
    };
  }

  const prompt = buildSystemPrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: [
            "Sei AI JOKER-C2.",
            "Rispondi in modo professionale, operativo e coerente con HBCE.",
            "Rispondi in forma discorsiva di default.",
            "Non usare tabelle salvo richiesta esplicita.",
            "Non usare elenchi numerati rigidi salvo richiesta esplicita o necessità tecnica.",
            "IPR è lo strumento operativo primario: Identity Primary Record, non un semplice account o login.",
            "AI JOKER-C2 è il runtime dimostrativo governato dell’IPR.",
            "Checkpoint canonico runtime attivo: EVT-0015-AI. Checkpoint precedente: EVT-0014-AI. Ciclo: UP-MESE-4.",
            "La memoria non è la chat: la memoria è la catena EVT/IPR-bound.",
            "Usa la memoria EVT/IPR-bound solo quando è semanticamente pertinente alla domanda corrente.",
            "Non importare frasi, valutazioni economiche o contenuti di una risposta precedente quando il tema della domanda è cambiato.",
            "Ogni riferimento ellittico deve essere risolto usando la memoria EVT/IPR-bound solo se la memoria è stata effettivamente iniettata nel prompt.",
            "OPC è una proof receipt tecnica per audit e verifica, non una certificazione legale automatica.",
            "Non mostrare i metadati runtime all'utente salvo richiesta diagnostica.",
            "Le cinque collane progettuali canoniche sono: MATRIX, U.S.E., CORPUS ESOTEROLOGIA ERMETICA, APOKALYPSIS, HBCE ECOSISTEMA AI.",
            "MATRIX = infrastruttura operativa e, come settimo modulo HBCE, livello di coordinamento e organizzazione dello stack.",
            "U.S.E. = applicazione politico-istituzionale derivata da MATRIX per una federazione europea operativa, digitale e verificabile.",
            "CORPUS ESOTEROLOGIA ERMETICA = grammatica disciplinare.",
            "APOKALYPSIS = soglia storica.",
            "HBCE ECOSISTEMA AI = quinta collana progettuale per governare l’intelligenza artificiale come processo identificabile, tracciabile, auditabile e responsabile.",
            "I sette moduli HBCE sono funzioni tecnico-operative dello stack: UNEBDO ancora, OPC prova, MetaExchange scambia, IOspace espone, CyberGlobal protegge, NeuroLoop valida, MATRIX organizza.",
            "I tre documenti dottrinali strategici sono: HBCE Cybersecurity Strategy, HBCE Data Protection Strategy, HBCE Information Governance Strategy.",
            "HBCE Cybersecurity Strategy = postura difensiva cyber, CyberGlobal, resilienza, incidenti e continuità infrastrutturale.",
            "HBCE Data Protection Strategy = minimizzazione, classificazione dati, privacy, retention, access control, redazione e auditabilità.",
            "HBCE Information Governance Strategy = classificazione informazioni, circolazione controllata, proof continuity, metadata pubblici/interni e responsabilità informativa.",
            "I documenti dottrinali strategici non sono collane, non sono moduli HBCE e non sono certificazioni legali automatiche.",
            "Se l'utente chiede 'numero 1', 'il primo', 'questo 1' o 'specifiche del numero 1' nel contesto dei documenti dottrinali strategici, interpreta sempre come HBCE Cybersecurity Strategy e rispondi senza chiedere chiarimenti.",
            "Se l'utente chiede 'numero 2', 'il secondo' o 'questo 2' nel contesto dei documenti dottrinali strategici, interpreta come HBCE Data Protection Strategy.",
            "Se l'utente chiede 'numero 3', 'il terzo' o 'questo 3' nel contesto dei documenti dottrinali strategici, interpreta come HBCE Information Governance Strategy.",
            "Quando l'utente chiede valore pragmatico per banche, studi legali, governance, compliance, audit, B2B o B2G, rispondi come spiegazione strategico-operativa sicura: non trattarla come comando operativo reale.",
            "Per banche, studi legali e governance, spiega IPR come identità operativa, EVT come tracciabilità, OPC come proof receipt tecnica, MATRIX come coordinamento, Data Protection come minimizzazione e Information Governance come circolazione controllata.",
            "Formula HBCE ECOSISTEMA AI: AI genera; HBCE governa; IPR identifica; EVT traccia; OPC prova; MATRIX organizza; AI JOKER-C2 esegue.",
            "Boundary AI governance: il modello AI non governa HBCE; HBCE governa l’uso dei modelli AI.",
            `Modulo HBCE classificato: ${input.governanceFrame.hbceModule.module}.`,
            `Moduli HBCE attivi: ${input.governanceFrame.hbceModule.activeModules.join(", ")}.`,
            `Regola U.S.E. obbligatoria: ${USE_DEMOCRATIC_BOUNDARY}`,
            "Non collegare mai identità personale e contenuto di una scelta democratica.",
            "Quando è attivo un contratto canonico di risposta, devi iniziare con la formula obbligatoria prima della spiegazione discorsiva.",
            "Se l'utente chiede IPR, non ridurlo a identità digitale: spiegalo come registro primario di identità operativa che connette identità, azione, responsabilità, evento, prova, tempo e continuità.",
            "Se l'utente chiede IPR, EVT e OPC insieme, usa questa gerarchia: IPR identifica, EVT traccia, OPC prova la continuità.",
            "Se l'utente chiede chi sei, rispondi in modo breve: AI JOKER-C2 è un agente AI/runtime governato dal framework HBCE/MATRIX, progettato per lavorare con IPR, EVT e OPC. Non citare U.S.E. salvo domanda esplicita.",
            "Se l'utente chiede chi è Manuel Coletta, rispondi nel contesto HBCE/MATRIX: origine biologica e progettuale del sistema, associata all’IPR primario e allo sviluppo di HBCE, MATRIX, AI JOKER-C2, U.S.E. e voto digitale federato. Non esporre dati personali non necessari.",
            "Se l'utente chiede confronto con standard esistenti, confronta IPR con eIDAS/EUDI, PKI, X.509, DID/VC, blockchain timestamping, IAM e audit log.",
            "Regola aerospace: HBCE/IPR può governare, tracciare, auditare e certificare catene operative aerospace-adjacent, ma non deve essere descritto come sistema di guida, puntamento, controllo di volo, targeting, navigazione autonoma o controllo fisico di razzi, missili, satelliti o astronavi.",
            "Per domande su razzi, astronavi o spazio, formula corretta: HBCE non guida il veicolo; può governare, tracciare, certificare e verificare la catena operativa intorno al veicolo.",
            "La governance runtime prevale: policy, risk, oversight e fail-closed non devono essere aggirati dal modello.",
            "Regola critica: non confondere il contenuto del documento con l'intento operativo dell'utente.",
            "Se un file parla di MATRIX, U.S.E., cybersecurity, infrastrutture critiche, incident response, audit, AI governance, HBCE ECOSISTEMA AI o continuità istituzionale, ma l'utente chiede sintesi, spiegazione, analisi documentale, revisione editoriale o controllo tecnico, devi trattare la richiesta come supporto documentale.",
            "Non richiedere INCIDENT_COMMANDER per sintesi, spiegazioni o revisioni documentali.",
            "Non presentare il supporto documentale come decisione operativa finale, ordine esecutivo, parere legale o validazione istituzionale definitiva."
          ].join("\n")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.18,
      max_tokens: MAX_OUTPUT_TOKENS
    });

    const text = extractResponseText(response);

    if (!text) {
      return {
        text: applyResponseContract(input.message, buildFallback(input)),
        state: "DEGRADED",
        degradedReason: "OPENAI_EMPTY_RESPONSE"
      };
    }

    return {
      text: applyResponseContract(input.message, text),
      state: "OPERATIONAL",
      degradedReason: null
    };
  } catch (error) {
    return {
      text: applyResponseContract(input.message, buildFallback(input)),
      state: "DEGRADED",
      degradedReason:
        error instanceof Error ? error.message : "OPENAI_REQUEST_FAILED"
    };
  }
}

function buildGovernanceLimitedResponse(input: {
  decision: RuntimeDecisionResult;
  policy: PolicyEvaluation;
  risk: RiskEvaluation;
  oversight: OversightEvaluation;
  projectDomain: ProjectDomainClassification;
  hbceModule: HbceModuleClassification;
}): GeneratedResponse {
  if (input.decision.decision === "BLOCK") {
    return {
      state: "BLOCKED",
      degradedReason: "RUNTIME_POLICY_BLOCK",
      text: [
        "La richiesta è stata bloccata dal runtime.",
        "",
        "Motivo operativo:",
        input.policy.reasons[0] ||
          input.risk.reasons[0] ||
          "La richiesta rientra in un perimetro non consentito.",
        "",
        "Dominio classificato:",
        input.projectDomain.projectDomain,
        "Modulo HBCE classificato:",
        input.hbceModule.module,
        "",
        "Posso aiutare solo in modalità sicura: documentazione difensiva, checklist, audit, mitigazione, revisione, hardening, incident report o governance.",
        input.projectDomain.projectDomain === "U.S.E."
          ? `\nRegola U.S.E.: ${USE_DEMOCRATIC_BOUNDARY}`
          : "",
        input.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
          ? `\nBoundary AI governance: ${HBCE_AI_BOUNDARY}`
          : ""
      ].join("\n")
    };
  }

  if (input.decision.decision === "ESCALATE") {
    return {
      state: "DEGRADED",
      degradedReason: "HUMAN_REVIEW_REQUIRED",
      text: [
        "La richiesta richiede revisione umana prima di qualunque uso operativo.",
        "",
        `ProjectDomain: ${input.projectDomain.projectDomain}`,
        `HbceModule: ${input.hbceModule.module}`,
        `RiskClass: ${input.risk.riskClass}`,
        `HumanOversight: ${input.oversight.state}`,
        `RequiredRole: ${input.oversight.requiredRole}`,
        input.projectDomain.projectDomain === "U.S.E."
          ? `U.S.E. Boundary: ${USE_DEMOCRATIC_BOUNDARY}`
          : "",
        input.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
          ? `AI Governance Boundary: ${HBCE_AI_BOUNDARY}`
          : "",
        "",
        "Posso produrre materiale di supporto, ma non devo presentarlo come decisione operativa finale senza revisione."
      ]
        .filter(Boolean)
        .join("\n")
    };
  }

  return {
    state: "DEGRADED",
    degradedReason: "LIMITED_SAFE_SUPPORT",
    text: [
      "Il runtime ha limitato la risposta a supporto sicuro e revisionabile.",
      "",
      `ProjectDomain: ${input.projectDomain.projectDomain}`,
      `HbceModule: ${input.hbceModule.module}`,
      `Decision: ${input.decision.decision}`,
      `RiskClass: ${input.risk.riskClass}`,
      `Oversight: ${input.oversight.state}`
    ].join("\n")
  };
}

function buildFilePolicyBlockedResponse(input: {
  filePolicy: ReturnType<typeof evaluateFileBatchPolicy>;
  projectDomain: ProjectDomainClassification;
}): GeneratedResponse {
  return {
    state: "BLOCKED",
    degradedReason: "FILE_POLICY_BLOCK",
    text: [
      "La richiesta è stata bloccata dalla file policy del runtime.",
      "",
      "I file allegati non sono stati inseriti nel prompt operativo perché non rispettano il perimetro consentito.",
      "",
      `Dominio classificato: ${input.projectDomain.projectDomain}.`,
      "",
      "Motivo operativo:",
      input.filePolicy.reasons.length > 0
        ? input.filePolicy.reasons.join("\n")
        : "Uno o più file non sono ammessi dalla policy corrente.",
      "",
      "Puoi procedere in modalità sicura usando testo leggibile, documenti non sensibili, estratti verificabili o materiale tecnico non operativo."
    ].join("\n")
  };
}

function buildEvent(input: {
  prev: string | null;
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  message: string;
  contextClass: LegacyContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
}): LegacyRuntimeEvent {
  const identity = getPrimaryIdentity();

  const payload = {
    evt: buildEvtId(),
    prev: input.prev || "GENESIS",
    t: nowIso(),
    entity: identity.entity,
    ipr: identity.ipr,
    kind: "CHAT_OPERATION",
    state: input.state,
    decision: input.decision,
    continuityRef: input.prev,
    message: input.message,
    contextClass: input.contextClass,
    documentMode: input.documentMode,
    documentFamily: input.documentFamily
  };

  const hash = buildRuntimeHash(payload);

  return Object.freeze({
    evt: payload.evt,
    prev: payload.prev,
    t: payload.t,
    entity: payload.entity,
    ipr: payload.ipr,
    kind: payload.kind,
    state: payload.state,
    decision: payload.decision,
    contextClass: payload.contextClass,
    documentMode: payload.documentMode,
    documentFamily: payload.documentFamily,
    anchors: {
      hash: hash.publicHash,
      publicHash: hash.publicHash,
      fullHash: hash.fullHash,
      digest: hash.digest,
      algorithm: hash.algorithm
    },
    continuityRef: payload.continuityRef
  });
}

function buildRuntimeDiagnosticText(input: {
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  governanceDecision: GovernanceDecision;
  contextClass: ContextClass;
  legacyContextClass: LegacyContextClass;
  intentClass: IntentClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  memoryUsed: boolean;
  memorySource: string;
  structuredFormat: boolean;
  event: LegacyRuntimeEvent;
  modernEvt: ReturnType<typeof toPublicRuntimeEvent>;
  governance: EnrichedGovernanceFrame;
  degradedReason?: string | null;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Diagnostica runtime OpenAI",
    "",
    `Runtime OpenAI: ${input.state}`,
    `RuntimeRole: IPR_RUNTIME_DEMONSTRATOR`,
    `Decision: ${input.decision}`,
    `GovernanceDecision: ${input.governanceDecision}`,
    `ProjectDomain: ${input.governance.projectDomain.projectDomain}`,
    `ActiveDomains: ${input.governance.projectDomain.activeDomains.join(", ")}`,
    `DomainType: ${input.governance.projectDomain.domainType}`,
    `DomainConfidence: ${input.governance.projectDomain.confidence}`,
    `HbceModule: ${input.governance.hbceModule.module}`,
    `ActiveModules: ${input.governance.hbceModule.activeModules.join(", ")}`,
    `ModuleType: ${input.governance.hbceModule.moduleType}`,
    `ModuleConfidence: ${input.governance.hbceModule.confidence}`,
    `Context: ${input.contextClass}`,
    `LegacyContext: ${input.legacyContextClass}`,
    `Intent: ${input.intentClass}`,
    `DocumentMode: ${input.documentMode}`,
    `DocumentFamily: ${input.documentFamily}`,
    `DataClass: ${input.governance.data.dataClass}`,
    `ContainsCivicSensitiveData: ${input.governance.data.containsCivicSensitiveData ? "true" : "false"}`,
    `ContainsDemocraticChoiceData: ${input.governance.data.containsDemocraticChoiceData ? "true" : "false"}`,
    `PolicyStatus: ${input.governance.policy.status}`,
    `PolicyOutcome: ${input.governance.policy.outcome || "UNKNOWN"}`,
    `RiskClass: ${input.governance.risk.riskClass}`,
    `RiskScore: ${input.governance.risk.riskScore}`,
    `HumanOversight: ${input.governance.oversight.state}`,
    `RequiredRole: ${input.governance.oversight.requiredRole}`,
    `FilePolicyAllowed: ${input.governance.filePolicy.allowed}`,
    `FilePolicyRejectedCount: ${input.governance.filePolicy.rejectedCount}`,
    `IPRBinding: ${input.governance.decision.iprBinding ? "true" : "false"}`,
    `EvtRequired: ${input.governance.decision.evtRequired ? "true" : "false"}`,
    `MemoryRequired: ${input.governance.decision.memoryRequired ? "true" : "false"}`,
    `OpcRequired: ${input.governance.decision.opcRequired ? "true" : "false"}`,
    `AuditRequired: ${input.governance.decision.auditRequired ? "true" : "false"}`,
    `FailClosed: ${input.governance.decision.failClosed ? "true" : "false"}`,
    `EvtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `MemorySource: ${input.memorySource}`,
    `StructuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `Model: ${MODEL}`,
    `OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "configured" : "missing"}`,
    "",
    "Five Collections:",
    `- ${FIVE_COLLECTIONS.join(", ")}`,
    "",
    "Seven HBCE Modules:",
    `- ${SEVEN_HBCE_MODULES.join(", ")}`,
    "",
    "Strategic Doctrine Layer:",
    `- ${STRATEGIC_DOCTRINES.join(", ")}`,
    "",
    "Identità runtime:",
    `- entity: ${identity.entity}`,
    `- ipr: ${identity.ipr}`,
    `- checkpoint: ${identity.evt}`,
    `- cycle: ${identity.cycle}`,
    `- core: ${identity.core}`,
    `- role: IPR_RUNTIME_DEMONSTRATOR`,
    "",
    "Legacy EVT Chain:",
    `- evt: ${input.event.evt}`,
    `- prev: ${input.event.prev}`,
    `- publicHash: ${input.event.anchors.publicHash}`,
    `- fullHash: ${input.event.anchors.fullHash}`,
    "",
    "Governed EVT:",
    `- evt: ${input.modernEvt.evt}`,
    `- prev: ${input.modernEvt.prev}`,
    `- project: ${input.modernEvt.project.domain}`,
    `- hash: ${input.modernEvt.trace.hash}`,
    `- verification: ${input.modernEvt.verification.status}`,
    input.governance.projectDomain.projectDomain === "U.S.E."
      ? `\nU.S.E. Boundary: ${USE_DEMOCRATIC_BOUNDARY}`
      : "",
    input.governance.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
      ? `\nAI Governance Boundary: ${HBCE_AI_BOUNDARY}`
      : "",
    "",
    `degradedReason: ${input.degradedReason || "none"}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildTechnicalFrame(input: {
  response: string;
  state: MemoryRuntimeState;
  decision: MemoryRuntimeDecision;
  governanceDecision: GovernanceDecision;
  contextClass: ContextClass;
  legacyContextClass: LegacyContextClass;
  intentClass: IntentClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  memoryUsed: boolean;
  memorySource: string;
  structuredFormat: boolean;
  event: LegacyRuntimeEvent;
  modernEvt: ReturnType<typeof toPublicRuntimeEvent>;
  memoryEventId: string | null;
  memoryHash: string | null;
  memoryAppendStatus: string;
  opcProofId?: string | null;
  opcChainHash?: string | null;
  governance: EnrichedGovernanceFrame;
  degradedReason?: string | null;
}) {
  const identity = getPrimaryIdentity();

  return [
    input.response,
    "",
    "Runtime:",
    `- state: ${input.state}`,
    `- runtimeRole: IPR_RUNTIME_DEMONSTRATOR`,
    `- checkpoint: ${identity.evt}`,
    `- cycle: ${identity.cycle}`,
    `- decision: ${input.decision}`,
    `- governanceDecision: ${input.governanceDecision}`,
    `- projectDomain: ${input.governance.projectDomain.projectDomain}`,
    `- activeDomains: ${input.governance.projectDomain.activeDomains.join(", ")}`,
    `- domainType: ${input.governance.projectDomain.domainType}`,
    `- hbceModule: ${input.governance.hbceModule.module}`,
    `- activeModules: ${input.governance.hbceModule.activeModules.join(", ")}`,
    `- strategicDoctrines: ${STRATEGIC_DOCTRINES.join(", ")}`,
    `- moduleType: ${input.governance.hbceModule.moduleType}`,
    `- context: ${input.contextClass}`,
    `- legacyContext: ${input.legacyContextClass}`,
    `- intent: ${input.intentClass}`,
    `- dataClass: ${input.governance.data.dataClass}`,
    `- civicSensitiveData: ${input.governance.data.containsCivicSensitiveData ? "true" : "false"}`,
    `- democraticChoiceData: ${input.governance.data.containsDemocraticChoiceData ? "true" : "false"}`,
    `- policy: ${input.governance.policy.status}`,
    `- policyOutcome: ${input.governance.policy.outcome || "UNKNOWN"}`,
    `- policyReference: ${input.governance.policy.policyReference}`,
    `- risk: ${input.governance.risk.riskClass}`,
    `- riskScore: ${input.governance.risk.riskScore}`,
    `- oversight: ${input.governance.oversight.state}`,
    `- requiredRole: ${input.governance.oversight.requiredRole}`,
    `- iprBinding: ${input.governance.decision.iprBinding ? "true" : "false"}`,
    `- evtRequired: ${input.governance.decision.evtRequired ? "true" : "false"}`,
    `- memoryRequired: ${input.governance.decision.memoryRequired ? "true" : "false"}`,
    `- opcRequired: ${input.governance.decision.opcRequired ? "true" : "false"}`,
    `- auditRequired: ${input.governance.decision.auditRequired ? "true" : "false"}`,
    `- failClosed: ${input.governance.decision.failClosed ? "true" : "false"}`,
    `- documentMode: ${input.documentMode}`,
    `- documentFamily: ${input.documentFamily}`,
    `- evtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `- memorySource: ${input.memorySource}`,
    `- structuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `- legacyEvt: ${input.event.evt}`,
    `- governedEvt: ${input.modernEvt.evt}`,
    `- governedEvtProject: ${input.modernEvt.project.domain}`,
    `- memoryEvt: ${input.memoryEventId || "none"}`,
    `- memoryHash: ${input.memoryHash || "none"}`,
    `- memoryAppendStatus: ${input.memoryAppendStatus}`,
    `- opcProofId: ${input.opcProofId || "none"}`,
    `- opcChainHash: ${input.opcChainHash || "none"}`,
    `- prev: ${input.event.prev}`,
    `- legacyPublicHash: ${input.event.anchors.publicHash}`,
    `- legacyFullHash: ${input.event.anchors.fullHash}`,
    `- governedHash: ${input.modernEvt.trace.hash}`,
    input.governance.projectDomain.projectDomain === "U.S.E."
      ? `- useBoundary: ${USE_DEMOCRATIC_BOUNDARY}`
      : "",
    input.governance.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
      ? `- aiGovernanceBoundary: ${HBCE_AI_BOUNDARY}`
      : "",
    input.degradedReason ? `- degradedReason: ${input.degradedReason}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function mapContextForMemory(contextClass: ContextClass): LegacyContextClass {
  return contextClass;
}

function mapDecisionForMemory(
  decision: GovernanceDecision,
  filePolicyAllowed = true
): MemoryRuntimeDecision {
  if (!filePolicyAllowed) {
    return "BLOCK";
  }

  return decision as MemoryRuntimeDecision;
}

function mapRuntimeStateForGovernance(
  state: MemoryRuntimeState
): GovernanceRuntimeState {
  if (state === "OPERATIONAL") {
    return "OPERATIONAL";
  }

  if (state === "BLOCKED") {
    return "BLOCKED";
  }

  if (state === "INVALID") {
    return "INVALID";
  }

  return "DEGRADED";
}

function mapOperationStatus(
  decision: GovernanceDecision,
  state: MemoryRuntimeState
): OperationStatus {
  if (state === "BLOCKED") {
    return "BLOCKED";
  }

  if (decision === "BLOCK") {
    return "BLOCKED";
  }

  if (decision === "ESCALATE") {
    return "ESCALATED";
  }

  if (decision === "DEGRADE") {
    return "DEGRADED";
  }

  if (decision === "NOOP") {
    return "NOOP";
  }

  if (state === "DEGRADED") {
    return "DEGRADED";
  }

  return "COMPLETED";
}

function buildDataClassificationText(
  message: string,
  files: FileInput[]
): string {
  const fileText = normalizeFiles(files)
    .map((file) => {
      return [
        file.name,
        file.type,
        file.text.slice(0, MAX_DATA_CLASSIFICATION_CHARS)
      ].join("\n");
    })
    .join("\n\n");

  return [message, fileText]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_DATA_CLASSIFICATION_CHARS);
}

function normalizeChatDataClassification(input: {
  message: string;
  files: FileInput[];
  data: DataClassification;
  contextClass: ContextClass;
  intentClass: IntentClass;
}): DataClassification {
  const safeConcept = classifySafeConcept(input.message);

  if (safeConcept.matched && input.files.length === 0) {
    return safeConcept.data;
  }

  if (isSafeIdentityGovernanceQuestion(input.message)) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Safe public identity-governance explanation detected.",
        "IPR / EVT conceptual questions are classified as PUBLIC unless unsafe operational terms are present."
      ]
    };
  }

  if (isStrategicDoctrineQuestion(input.message)) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Strategic doctrine explanation detected.",
        "Classified as PUBLIC because the request asks for doctrine description, not operational cyber execution."
      ]
    };
  }

  if (isPragmaticGovernanceValueQuestion(input.message)) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Pragmatic governance value question detected.",
        "Classified as PUBLIC because the request asks for strategic, banking, legal or governance explanation, not operational execution."
      ]
    };
  }

  if (isRuntimeSelfIdentityQuestion(input.message)) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Runtime self-identity question detected.",
        "Classified as PUBLIC unless diagnostic metadata is explicitly requested."
      ]
    };
  }

  if (isManuelColettaIdentityQuestion(input.message)) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: true,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Public project-origin identity question detected.",
        "Name is personal data, but answer is limited to public HBCE/MATRIX context and avoids unnecessary personal details."
      ]
    };
  }

  const hasFiles = input.files.length > 0;
  const message = input.message.trim();

  const safeOrdinaryIntent =
    input.intentClass === "ASK" ||
    input.intentClass === "WRITE" ||
    input.intentClass === "REWRITE" ||
    input.intentClass === "ANALYZE" ||
    input.intentClass === "SUMMARIZE" ||
    input.intentClass === "TRANSFORM" ||
    input.intentClass === "GITHUB" ||
    input.intentClass === "EDITORIAL" ||
    input.intentClass === "CIVIC" ||
    input.intentClass === "GOVERNANCE" ||
    input.intentClass === "COMPLIANCE" ||
    input.intentClass === "STRATEGIC";

  const safeOrdinaryContext =
    input.contextClass === "GENERAL" ||
    input.contextClass === "IDENTITY" ||
    input.contextClass === "IPR" ||
    input.contextClass === "EDITORIAL" ||
    input.contextClass === "DOCUMENTAL" ||
    input.contextClass === "GITHUB" ||
    input.contextClass === "MATRIX" ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "CORPUS" ||
    input.contextClass === "APOKALYPSIS" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "TECHNICAL" ||
    input.contextClass === "STRATEGIC" ||
    input.contextClass === "PUBLIC_ADMINISTRATION";

  if (
    input.data.dataClass === "UNKNOWN" &&
    !hasFiles &&
    safeOrdinaryIntent &&
    safeOrdinaryContext &&
    message.length > 0 &&
    message.length <= 4000
  ) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Ordinary chat message with no file context and no sensitive pattern.",
        "UNKNOWN normalized to PUBLIC for non-operational conversation."
      ]
    };
  }

  if (
    input.data.dataClass === "UNKNOWN" &&
    hasFiles &&
    safeOrdinaryContext
  ) {
    return {
      dataClass: "INTERNAL",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "File-backed document context with no explicit sensitive pattern.",
        "UNKNOWN normalized to INTERNAL for controlled document work."
      ]
    };
  }

  return input.data;
}

function hasExplicitOperationalActionRequest(message: string): boolean {
  const text = normalizeRuntimeText(message);

  const actionTerms = [
    "esegui",
    "attiva",
    "autorizza",
    "approva",
    "comanda",
    "ordina",
    "blocca",
    "spegni",
    "revoca",
    "isola",
    "mitiga",
    "contieni",
    "eradica",
    "deploy in produzione",
    "metti in produzione",
    "decisione operativa finale",
    "procedura operativa",
    "senza revisione umana",
    "execute",
    "authorize",
    "approve",
    "command",
    "shutdown",
    "isolate",
    "contain",
    "eradicate",
    "deploy to production"
  ];

  const operationalContextTerms = [
    "incidente",
    "incident",
    "incident response",
    "incident commander",
    "csirt",
    "soc",
    "emergenza",
    "crisi reale",
    "infrastruttura critica",
    "critical infrastructure",
    "produzione",
    "sistema reale",
    "servizio pubblico",
    "rete reale",
    "host",
    "endpoint",
    "server",
    "cloud account",
    "tenant",
    "accesso reale",
    "real system",
    "production system"
  ];

  return (
    runtimeTextIncludesAny(text, actionTerms) &&
    runtimeTextIncludesAny(text, operationalContextTerms)
  );
}

function isSafeDocumentIntentClass(intentClass: IntentClass): boolean {
  return (
    intentClass === "ASK" ||
    intentClass === "ANALYZE" ||
    intentClass === "SUMMARIZE" ||
    intentClass === "WRITE" ||
    intentClass === "REWRITE" ||
    intentClass === "TRANSFORM" ||
    intentClass === "EDITORIAL" ||
    intentClass === "GITHUB" ||
    intentClass === "CIVIC" ||
    intentClass === "GOVERNANCE" ||
    intentClass === "COMPLIANCE" ||
    intentClass === "STRATEGIC"
  );
}

function isLowRiskDocumentIntent(intentClass: IntentClass): boolean {
  return (
    intentClass === "ASK" ||
    intentClass === "ANALYZE" ||
    intentClass === "SUMMARIZE"
  );
}

function normalizeSafeDocumentContextClass(
  contextClass: ContextClass
): ContextClass {
  if (
    contextClass === "GITHUB" ||
    contextClass === "TECHNICAL" ||
    contextClass === "EDITORIAL" ||
    contextClass === "CORPUS" ||
    contextClass === "APOKALYPSIS" ||
    contextClass === "HBCE_ECOSISTEMA_AI" ||
    contextClass === "USE" ||
    contextClass === "CIVIC" ||
    contextClass === "GOVERNANCE" ||
    contextClass === "COMPLIANCE" ||
    contextClass === "STRATEGIC" ||
    contextClass === "PUBLIC_ADMINISTRATION"
  ) {
    return contextClass;
  }

  return "DOCUMENTAL";
}

function isSafeDocumentWork(input: {
  files: FileInput[];
  contextClass: ContextClass;
  intentClass: IntentClass;
  data: DataClassification;
  policy: PolicyEvaluation;
  message: string;
}): boolean {
  if (input.policy.prohibited) {
    return false;
  }

  if (hasExplicitOperationalActionRequest(input.message)) {
    return false;
  }

  if (
    input.data.containsSecret ||
    input.data.dataClass === "SECRET" ||
    input.data.dataClass === "UNSUPPORTED" ||
    input.data.dataClass === "DEMOCRATIC_CHOICE"
  ) {
    return false;
  }

  const hasDocumentContext =
    input.files.length > 0 ||
    input.contextClass === "DOCUMENTAL" ||
    input.contextClass === "EDITORIAL" ||
    input.contextClass === "CORPUS" ||
    input.contextClass === "APOKALYPSIS" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "MATRIX" ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "TECHNICAL" ||
    input.contextClass === "STRATEGIC" ||
    input.contextClass === "PUBLIC_ADMINISTRATION" ||
    input.contextClass === "GITHUB";

  return hasDocumentContext && isSafeDocumentIntentClass(input.intentClass);
}

function preferOpcForGovernance(input: {
  policy: PolicyEvaluation;
  risk: RiskEvaluation;
  contextClass: ContextClass;
  projectDomain: ProjectDomainClassification;
  hasFiles: boolean;
}): boolean {
  return (
    input.policy.status !== "ALLOWED" ||
    input.risk.riskClass !== "LOW" ||
    input.hasFiles ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "SECURITY" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    input.contextClass === "STRATEGIC" ||
    input.projectDomain.projectDomain === "U.S.E." ||
    input.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI" ||
    input.projectDomain.projectDomain === "MULTI_DOMAIN"
  );
}

function applySafeRuntimeDiagnosticGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  if (!isRuntimeDiagnosticRequest(input.message)) {
    return input.frame;
  }

  const data: DataClassification = {
    dataClass: "INTERNAL",
    containsSecret: false,
    containsPersonalData: false,
    containsSecuritySensitiveData: false,
    containsCivicSensitiveData: false,
    containsDemocraticChoiceData: false,
    reasons: [
      "Runtime diagnostic request is internal operational metadata.",
      "No secret, personal or security-sensitive payload requested."
    ]
  };

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: "SAFE_RUNTIME_DIAGNOSTIC",
    prohibited: false,
    failClosed: false,
    reasons: [
      "Safe runtime diagnostic request allowed.",
      "The request inspects runtime state and does not request unsafe execution."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: "LOW",
    probability: 1,
    impact: 1,
    riskScore: 1,
    reasons: [
      "Diagnostic request is bounded to runtime status, model configuration, EVT, OPC and governance metadata.",
      "No offensive, destructive or sensitive operation detected."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "NOT_REQUIRED",
    requiredRole: "NONE",
    reason:
      "Safe runtime diagnostic does not require human review before response."
  };

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: "TECHNICAL",
    intentClass: "ASK",
    dataClass: data.dataClass,
    projectDomain: input.frame.projectDomain.projectDomain,
    activeDomains: input.frame.projectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false,
    memoryPreferred: true,
    opcPreferred: true,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    contextClass: "TECHNICAL",
    intentClass: "ASK",
    data,
    policy,
    risk,
    oversight,
    decision
  };
}

function applySafeConceptGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
  files: FileInput[];
}): EnrichedGovernanceFrame {
  const safeConcept = classifySafeConcept(input.message);

  if (!safeConcept.matched || input.files.length > 0) {
    return input.frame;
  }

  const safeProjectDomain = buildSafeConceptProjectDomain(safeConcept);

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: safeConcept.policy.status,
    policyProhibited: safeConcept.policy.prohibited,
    policyFailClosed: safeConcept.policy.failClosed,
    riskClass: safeConcept.risk.riskClass,
    oversightState: safeConcept.oversight.state,
    contextClass: safeConcept.contextClass,
    intentClass: safeConcept.intentClass,
    dataClass: safeConcept.data.dataClass,
    projectDomain: safeProjectDomain.projectDomain,
    activeDomains: safeProjectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false,
    memoryPreferred: true,
    opcPreferred: false,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    projectDomain: safeProjectDomain,
    contextClass: safeConcept.contextClass,
    intentClass: safeConcept.intentClass,
    data: safeConcept.data,
    policy: safeConcept.policy,
    risk: safeConcept.risk,
    oversight: safeConcept.oversight,
    decision
  };
}

function applySafeIdentityGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  if (!isSafeIdentityGovernanceQuestion(input.message)) {
    return input.frame;
  }

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: "PUBLIC_IDENTITY_GOVERNANCE_EXPLANATION",
    prohibited: false,
    failClosed: false,
    reasons: [
      "Safe IPR / EVT / operational identity explanation.",
      "Public conceptual governance question allowed."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: "LOW",
    probability: 1,
    impact: 1,
    riskScore: 1,
    reasons: [
      "Safe public explanation about IPR or identity-governance concepts.",
      "No unsafe operational term detected."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "NOT_REQUIRED",
    requiredRole: "NONE",
    reason:
      "Ordinary explanatory request about IPR / EVT / operational identity does not require human review."
  };

  const safeProjectDomain = buildSafeIdentityProjectDomain();

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: "IPR",
    intentClass: "ASK",
    dataClass: "PUBLIC",
    projectDomain: safeProjectDomain.projectDomain,
    activeDomains: safeProjectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false,
    memoryPreferred: true,
    opcPreferred: false,
    iprBindingPreferred: true
  });

  const hbceModule = normalizeHbceModuleClassification({
    message: input.message,
    classification: input.frame.hbceModule,
    projectDomain: safeProjectDomain,
    contextClass: "IPR",
    intentClass: "ASK"
  });

  return {
    ...input.frame,
    projectDomain: safeProjectDomain,
    hbceModule,
    contextClass: "IPR",
    intentClass: "ASK",
    data: {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Safe identity-governance explanation detected.",
        "Classified as PUBLIC to prevent false escalation."
      ]
    },
    policy,
    risk,
    oversight,
    decision
  };
}

function applyRuntimeIdentityGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  if (
    !isRuntimeSelfIdentityQuestion(input.message) &&
    !isManuelColettaIdentityQuestion(input.message) &&
    !isAerospaceGovernanceBoundaryQuestion(input.message)
  ) {
    return input.frame;
  }

  const isSelf = isRuntimeSelfIdentityQuestion(input.message);
  const isOrigin = isManuelColettaIdentityQuestion(input.message);
  const isAerospace = isAerospaceGovernanceBoundaryQuestion(input.message);

  const projectDomain = isSelf
    ? buildRuntimeIdentityProjectDomain(input.frame.projectDomain)
    : isOrigin
      ? buildOriginIdentityProjectDomain(input.frame.projectDomain)
      : buildAerospaceGovernanceProjectDomain(input.frame.projectDomain);

  const contextClass: ContextClass = isAerospace
    ? "GOVERNANCE"
    : "IDENTITY";

  const intentClass: IntentClass = "ASK";

  const data: DataClassification = isOrigin
    ? {
        dataClass: "PUBLIC",
        containsSecret: false,
        containsPersonalData: true,
        containsSecuritySensitiveData: false,
        containsCivicSensitiveData: false,
        containsDemocraticChoiceData: false,
        reasons: [
          "Public project-origin identity question detected.",
          "Answer must stay within HBCE/MATRIX context and avoid unnecessary personal data."
        ]
      }
    : {
        dataClass: "PUBLIC",
        containsSecret: false,
        containsPersonalData: false,
        containsSecuritySensitiveData: false,
        containsCivicSensitiveData: false,
        containsDemocraticChoiceData: false,
        reasons: [
          isAerospace
            ? "Aerospace governance boundary question detected."
            : "Runtime identity question detected.",
          "Classified as PUBLIC conceptual explanation."
        ]
      };

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: isAerospace
      ? "AEROSPACE_GOVERNANCE_BOUNDARY_ONLY"
      : isOrigin
        ? "PUBLIC_PROJECT_ORIGIN_IDENTITY"
        : "PUBLIC_RUNTIME_SELF_IDENTITY",
    prohibited: false,
    failClosed: false,
    reasons: [
      isAerospace
        ? "Safe aerospace-adjacent governance answer allowed only as audit/traceability boundary, not control guidance."
        : "Safe identity answer allowed.",
      "No operational execution requested."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: isAerospace ? "MEDIUM" : "LOW",
    probability: isAerospace ? 2 : 1,
    impact: isAerospace ? 2 : 1,
    riskScore: isAerospace ? 4 : 1,
    reasons: [
      isAerospace
        ? "Aerospace-adjacent language requires clear boundary against flight control, targeting and autonomous guidance."
        : "Identity explanation is low risk."
    ]
  };

  const oversight: OversightEvaluation = {
    state: isAerospace ? "RECOMMENDED" : "NOT_REQUIRED",
    requiredRole: isAerospace ? "REVIEWER" : "NONE",
    reason: isAerospace
      ? "Aerospace-adjacent product language should be reviewed before external use."
      : "Identity answer does not require human review."
  };

  const hbceModule = normalizeHbceModuleClassification({
    message: input.message,
    classification: input.frame.hbceModule,
    projectDomain,
    contextClass,
    intentClass
  });

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass,
    intentClass,
    dataClass: data.dataClass,
    projectDomain: projectDomain.projectDomain,
    activeDomains: projectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: isAerospace,
    memoryPreferred: false,
    opcPreferred: isAerospace || isOrigin,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    projectDomain,
    hbceModule,
    contextClass,
    intentClass,
    data,
    policy,
    risk,
    oversight,
    decision
  };
}

function applyHbceAiGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  if (!isHbceAiGovernanceQuestion(input.message)) {
    return input.frame;
  }

  const projectDomain = buildHbceAiProjectDomain(input.frame.projectDomain);

  const hbceModule = normalizeHbceModuleClassification({
    message: input.message,
    classification: input.frame.hbceModule,
    projectDomain,
    contextClass: "HBCE_ECOSISTEMA_AI",
    intentClass: input.frame.intentClass
  });

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: input.frame.policy.status,
    policyOutcome: input.frame.policy.outcome,
    policyProhibited: input.frame.policy.prohibited,
    policyFailClosed: input.frame.policy.failClosed,
    riskClass: input.frame.risk.riskClass,
    oversightState: input.frame.oversight.state,
    contextClass: "HBCE_ECOSISTEMA_AI",
    intentClass: input.frame.intentClass,
    dataClass: input.frame.data.dataClass,
    projectDomain: projectDomain.projectDomain,
    activeDomains: projectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: input.frame.risk.riskClass !== "LOW",
    memoryPreferred: true,
    opcPreferred: true,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    projectDomain,
    hbceModule,
    contextClass: "HBCE_ECOSISTEMA_AI",
    decision
  };
}

function applyStrategicDoctrineGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  if (!isStrategicDoctrineQuestion(input.message)) {
    return input.frame;
  }

  const kind = getStrategicDoctrineKind(input.message);
  const projectDomain = buildStrategicDoctrineProjectDomain(input.frame.projectDomain);

  const hbceModule = withHbceModuleOverride(
    input.frame.hbceModule,
    getStrategicDoctrinePrimaryModule(kind),
    getStrategicDoctrineActiveModules(kind),
    0.98,
    [
      "Strategic doctrine request handled as safe doctrine explanation.",
      "Human review is not required for ordinary explanation of doctrine documents.",
      "Strategic doctrine documents guide governance but do not create legal certification."
    ]
  );

  const data: DataClassification = {
    dataClass: "PUBLIC",
    containsSecret: false,
    containsPersonalData: false,
    containsSecuritySensitiveData: false,
    containsCivicSensitiveData: false,
    containsDemocraticChoiceData: false,
    reasons: [
      "Strategic doctrine explanation detected.",
      "Classified as PUBLIC because the user asks for doctrine description, not operational cyber execution."
    ]
  };

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: "ALLOWED_STRATEGIC_DOCTRINE_EXPLANATION",
    prohibited: false,
    failClosed: false,
    reasons: [
      "Strategic doctrine explanation is allowed.",
      "No offensive cyber, secret exposure, deployment command or high-impact operational action detected."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: "LOW",
    probability: 1,
    impact: 1,
    riskScore: 1,
    reasons: [
      "Strategic doctrine explanation is low risk.",
      "The request asks for explanatory material about documented doctrine, not execution."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "NOT_REQUIRED",
    requiredRole: "NONE",
    reason:
      "Ordinary explanation of strategic doctrine documents does not require human review."
  };

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: "GOVERNANCE",
    intentClass: "ASK",
    dataClass: data.dataClass,
    projectDomain: projectDomain.projectDomain,
    activeDomains: projectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false,
    memoryPreferred: true,
    opcPreferred: true,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    projectDomain,
    hbceModule,
    contextClass: "GOVERNANCE",
    intentClass: "ASK",
    data,
    policy,
    risk,
    oversight,
    decision
  };
}

function applyPragmaticGovernanceValueOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  if (!isPragmaticGovernanceValueQuestion(input.message)) {
    return input.frame;
  }

  const projectDomain = buildPragmaticGovernanceValueProjectDomain(
    input.frame.projectDomain
  );

  const hbceModule = withHbceModuleOverride(
    input.frame.hbceModule,
    "MATRIX",
    ["MATRIX", "OPC", "MetaExchange", "IOspace", "CyberGlobal"],
    0.97,
    [
      "Pragmatic value request for banking, legal offices, compliance or governance handled as safe strategic explanation.",
      "MATRIX organizes the institutional value layer.",
      "OPC supports proof receipts and auditability.",
      "MetaExchange supports controlled exchange.",
      "IOspace supports visibility.",
      "CyberGlobal supports defensive resilience."
    ]
  );

  const data: DataClassification = {
    dataClass: "PUBLIC",
    containsSecret: false,
    containsPersonalData: false,
    containsSecuritySensitiveData: false,
    containsCivicSensitiveData: false,
    containsDemocraticChoiceData: false,
    reasons: [
      "Pragmatic governance value explanation detected.",
      "Classified as PUBLIC because the request asks for general business, banking, legal or governance value, not an operational action."
    ]
  };

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: "SAFE_PRAGMATIC_GOVERNANCE_VALUE_EXPLANATION",
    prohibited: false,
    failClosed: false,
    reasons: [
      "Pragmatic governance value explanation is allowed.",
      "No real-world execution, authorization, incident command, secret exposure or prohibited operation detected."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: "MEDIUM",
    probability: 2,
    impact: 3,
    riskScore: 6,
    reasons: [
      "The request concerns institutional, banking, legal, compliance or governance value.",
      "The content is answerable as strategic explanation but should remain audit-aware and non-certifying."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "RECOMMENDED",
    requiredRole: "AUDITOR",
    reason:
      "Human review is recommended before external, commercial, legal or institutional reliance, but not required for ordinary explanation."
  };

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyOutcome: policy.outcome,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: "GOVERNANCE",
    intentClass: "ASK",
    dataClass: data.dataClass,
    projectDomain: projectDomain.projectDomain,
    activeDomains: projectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: true,
    memoryPreferred: true,
    opcPreferred: true,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    projectDomain,
    hbceModule,
    contextClass: "GOVERNANCE",
    intentClass: "ASK",
    data,
    policy,
    risk,
    oversight,
    decision
  };
}

function applySafeDocumentGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
  files: FileInput[];
}): EnrichedGovernanceFrame {
  if (
    !isSafeDocumentWork({
      files: input.files,
      contextClass: input.frame.contextClass,
      intentClass: input.frame.intentClass,
      data: input.frame.data,
      policy: input.frame.policy,
      message: input.message
    })
  ) {
    return input.frame;
  }

  const normalizedContextClass = normalizeSafeDocumentContextClass(
    input.frame.contextClass
  );

  const lowRisk = isLowRiskDocumentIntent(input.frame.intentClass);

  const data: DataClassification = {
    dataClass:
      input.frame.data.dataClass === "PUBLIC" ? "PUBLIC" : "INTERNAL",
    containsSecret: input.frame.data.containsSecret,
    containsPersonalData: input.frame.data.containsPersonalData,
    containsSecuritySensitiveData:
      input.frame.data.containsSecuritySensitiveData,
    containsCivicSensitiveData: input.frame.data.containsCivicSensitiveData,
    containsDemocraticChoiceData: input.frame.data.containsDemocraticChoiceData,
    reasons: [
      ...input.frame.data.reasons,
      "Safe document-support override applied.",
      "The user request is classified by intent as document support, not operational execution.",
      "Document vocabulary alone does not determine runtime escalation."
    ]
  };

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: "SAFE_DOCUMENT_SUPPORT_INTENT_PRECEDENCE",
    prohibited: false,
    failClosed: false,
    reasons: [
      ...input.frame.policy.reasons,
      "Safe document-support policy override applied.",
      "The request asks for documentary support and does not request real-world execution, authorization or incident command."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: lowRisk ? "LOW" : "MEDIUM",
    probability: lowRisk ? 1 : 2,
    impact: lowRisk ? 1 : 2,
    riskScore: lowRisk ? 1 : 4,
    reasons: [
      ...input.frame.risk.reasons,
      "Safe document/editorial work override applied.",
      "Risk is derived from the user's requested action, not from strategic words inside the uploaded document.",
      "Document analysis, summary and explanation are reviewable support activities, not direct operational control."
    ]
  };

  const oversight: OversightEvaluation = {
    state: lowRisk ? "NOT_REQUIRED" : "RECOMMENDED",
    requiredRole: lowRisk ? "NONE" : "REVIEWER",
    reason: lowRisk
      ? "Safe document summary, explanation or analysis does not require operational escalation."
      : "Document drafting or transformation should be reviewed before publication or external use, but it does not require operational escalation."
  };

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: normalizedContextClass,
    intentClass: input.frame.intentClass,
    dataClass: data.dataClass,
    projectDomain: input.frame.projectDomain.projectDomain,
    activeDomains: input.frame.projectDomain.activeDomains,
    hasFiles: input.files.length > 0,
    evtPreferred: true,
    auditPreferred: !lowRisk,
    memoryPreferred: true,
    opcPreferred: !lowRisk || input.files.length > 0,
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    contextClass: normalizedContextClass,
    data,
    policy,
    risk,
    oversight,
    decision
  };
}

function buildGovernanceFrame(input: {
  message: string;
  files: FileInput[];
}): EnrichedGovernanceFrame {
  const normalizedFiles = normalizeFiles(input.files);
  const safeConcept = classifySafeConcept(input.message);

  const rawProjectDomain = classifyProjectDomain({
    message: input.message,
    hasFiles: input.files.length > 0,
    fileNames: normalizedFiles.map((file) => file.name),
    filePaths: normalizedFiles.map((file) => file.name),
    activeDocument: normalizedFiles[0]?.name
  });

  const rawHbceModule = classifyHbceModule({
    message: input.message,
    hasFiles: input.files.length > 0,
    fileNames: normalizedFiles.map((file) => file.name),
    filePaths: normalizedFiles.map((file) => file.name),
    activeDocument: normalizedFiles[0]?.name
  });

  const projectDomain =
    safeConcept.matched && input.files.length === 0
      ? buildSafeConceptProjectDomain(safeConcept)
      : normalizeProjectDomainClassification({
          message: input.message,
          classification: rawProjectDomain
        });

  const context = classifyRuntimeContext({
    message: input.message,
    hasFiles: input.files.length > 0,
    fileNames: normalizedFiles.map((file) => file.name),
    fileTypes: normalizedFiles.map((file) => file.type),
    activeDocument: normalizedFiles[0]?.name
  });

  const hbceModule = normalizeHbceModuleClassification({
    message: input.message,
    classification: rawHbceModule,
    projectDomain,
    contextClass: context.contextClass,
    intentClass: context.intentClass
  });

  const rawData = classifyData({
    text: buildDataClassificationText(input.message, input.files)
  });

  const data = normalizeChatDataClassification({
    message: input.message,
    files: input.files,
    data: rawData,
    contextClass: context.contextClass,
    intentClass: context.intentClass
  });

  const filePolicy = evaluateFileBatchPolicy(
    normalizedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size
    }))
  );

  if (safeConcept.matched && input.files.length === 0) {
    const decision = decideRuntimeAction({
      runtimeState: "OPERATIONAL",
      policyStatus: safeConcept.policy.status,
      policyProhibited: safeConcept.policy.prohibited,
      policyFailClosed: safeConcept.policy.failClosed,
      riskClass: safeConcept.risk.riskClass,
      oversightState: safeConcept.oversight.state,
      contextClass: safeConcept.contextClass,
      intentClass: safeConcept.intentClass,
      dataClass: safeConcept.data.dataClass,
      projectDomain: projectDomain.projectDomain,
      activeDomains: projectDomain.activeDomains,
      hasFiles: false,
      evtPreferred: true,
      auditPreferred: false,
      memoryPreferred: true,
      opcPreferred: false,
      iprBindingPreferred: true
    });

    const frame: EnrichedGovernanceFrame = {
      projectDomain,
      hbceModule,
      contextClass: safeConcept.contextClass,
      intentClass: safeConcept.intentClass,
      data: safeConcept.data,
      policy: safeConcept.policy,
      risk: safeConcept.risk,
      oversight: safeConcept.oversight,
      decision,
      filePolicy
    };

    const diagnosticFrame = applySafeRuntimeDiagnosticGovernanceOverride({
      frame,
      message: input.message
    });

    const doctrineFrame = applyStrategicDoctrineGovernanceOverride({
      frame: diagnosticFrame,
      message: input.message
    });

    const pragmaticFrame = applyPragmaticGovernanceValueOverride({
      frame: doctrineFrame,
      message: input.message
    });

    const hbceAiFrame = applyHbceAiGovernanceOverride({
      frame: pragmaticFrame,
      message: input.message
    });

    return applyRuntimeIdentityGovernanceOverride({
      frame: hbceAiFrame,
      message: input.message
    });
  }

  const policy = evaluatePolicy({
    message: input.message,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    dataClass: data.dataClass,
    projectDomain: projectDomain.projectDomain,
    hasFiles: input.files.length > 0
  });

  const risk = evaluateRisk({
    message: input.message,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    policyStatus: policy.status,
    dataClass: data.dataClass,
    sensitivity: context.sensitivity,
    projectDomain: projectDomain.projectDomain,
    hasFiles: input.files.length > 0,
    policyFailClosed: policy.failClosed,
    policyProhibited: policy.prohibited
  });

  const oversight = evaluateHumanOversight({
    riskClass: risk.riskClass,
    contextClass: context.contextClass,
    policyStatus: policy.status,
    dataClass: data.dataClass,
    sensitivity: context.sensitivity,
    projectDomain: projectDomain.projectDomain,
    message: input.message
  });

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyOutcome: policy.outcome,
    policyProhibited: policy.prohibited,
    policyFailClosed: policy.failClosed,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    dataClass: data.dataClass,
    projectDomain: projectDomain.projectDomain,
    activeDomains: projectDomain.activeDomains,
    hasFiles: input.files.length > 0,
    evtPreferred: true,
    auditPreferred: risk.riskClass !== "LOW",
    memoryPreferred: true,
    opcPreferred: preferOpcForGovernance({
      policy,
      risk,
      contextClass: context.contextClass,
      projectDomain,
      hasFiles: input.files.length > 0
    }),
    iprBindingPreferred: true,
    identityChoiceLinkage: Boolean(data.containsDemocraticChoiceData)
  });

  const frame: EnrichedGovernanceFrame = {
    projectDomain,
    hbceModule,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    data,
    policy,
    risk,
    oversight,
    decision,
    filePolicy
  };

  const diagnosticFrame = applySafeRuntimeDiagnosticGovernanceOverride({
    frame,
    message: input.message
  });

  const conceptSafeFrame = applySafeConceptGovernanceOverride({
    frame: diagnosticFrame,
    message: input.message,
    files: input.files
  });

  const identitySafeFrame = applySafeIdentityGovernanceOverride({
    frame: conceptSafeFrame,
    message: input.message
  });

  const runtimeIdentityFrame = applyRuntimeIdentityGovernanceOverride({
    frame: identitySafeFrame,
    message: input.message
  });

  const doctrineFrame = applyStrategicDoctrineGovernanceOverride({
    frame: runtimeIdentityFrame,
    message: input.message
  });

  const pragmaticFrame = applyPragmaticGovernanceValueOverride({
    frame: doctrineFrame,
    message: input.message
  });

  const hbceAiFrame = applyHbceAiGovernanceOverride({
    frame: pragmaticFrame,
    message: input.message
  });

  return applySafeDocumentGovernanceOverride({
    frame: hbceAiFrame,
    message: input.message,
    files: input.files
  });
}

async function buildAndAppendGovernedEvt(input: {
  prev: string;
  state: MemoryRuntimeState;
  governance: EnrichedGovernanceFrame;
  operationType: string;
  operationStatus: OperationStatus;
}) {
  const modernEvent = createRuntimeEvent({
    prev: input.prev,
    runtimeState: mapRuntimeStateForGovernance(input.state),
    projectDomain: input.governance.projectDomain.projectDomain,
    activeDomains: input.governance.projectDomain.activeDomains,
    hbceModule: input.governance.hbceModule.module,
    activeModules: input.governance.hbceModule.activeModules,
    contextClass: input.governance.contextClass,
    intentClass: input.governance.intentClass,
    sensitivity:
      input.governance.risk.riskClass === "LOW"
        ? "LOW"
        : input.governance.risk.riskClass === "MEDIUM"
          ? "MEDIUM"
          : input.governance.risk.riskClass === "UNKNOWN"
            ? "UNKNOWN"
            : "HIGH",
    riskClass: input.governance.risk.riskClass,
    decision: input.governance.decision.decision,
    policyReference: input.governance.policy.policyReference,
    policyOutcome: input.governance.policy.outcome,
    humanOversight: input.governance.oversight.state,
    operationType: input.operationType,
    operationStatus: input.operationStatus,
    failClosed: input.governance.decision.failClosed,
    reasons: [
      ...input.governance.projectDomain.reasons,
      ...input.governance.hbceModule.reasons,
      ...input.governance.policy.reasons,
      ...input.governance.risk.reasons,
      input.governance.oversight.reason,
      ...input.governance.decision.reasons,
      ...input.governance.filePolicy.reasons
    ],
    auditStatus: input.governance.decision.auditRequired
      ? "READY"
      : "NOT_REQUIRED"
  });

  const appendResult = input.governance.decision.evtRequired
    ? await appendEvent(modernEvent)
    : null;

  return {
    modernEvent,
    appendResult
  };
}

async function resolveMemoryContext(input: {
  sessionId: string;
  ipr: string;
  message: string;
}): Promise<ResolvedMemoryContext> {
  const hotMemory = getEvtMemoryContext({
    sessionId: input.sessionId,
    ipr: input.ipr,
    message: input.message
  });

  if (hotMemory.used) {
    return hotMemory as ResolvedMemoryContext;
  }

  const ledgerMemory = await buildEvtMemoryContextFromLedger({
    sessionId: input.sessionId,
    ipr: input.ipr,
    message: input.message
  });

  if (ledgerMemory.used) {
    return ledgerMemory as ResolvedMemoryContext;
  }

  return {
    used: false,
    source: "NONE",
    text: [hotMemory.text, "", ledgerMemory.text].join("\n").trim(),
    semanticState: null,
    lastEventId: null
  };
}

function mapOpcRuntimeState(state: MemoryRuntimeState): OpcRuntimeState {
  if (state === "OPERATIONAL") return "OPERATIONAL";
  if (state === "BLOCKED") return "BLOCKED";
  if (state === "INVALID") return "INVALID";
  return "DEGRADED";
}

function mapOpcDecision(decision: GovernanceDecision): OpcRuntimeDecision {
  switch (decision) {
    case "ALLOW":
    case "AUDIT":
    case "DEGRADE":
    case "ESCALATE":
    case "BLOCK":
    case "NOOP":
      return decision;
    default:
      return "NOOP";
  }
}

function mapOpcRiskClass(riskClass: string): OpcRiskClass {
  switch (riskClass) {
    case "LOW":
    case "MEDIUM":
    case "HIGH":
    case "CRITICAL":
    case "PROHIBITED":
    case "UNKNOWN":
      return riskClass;
    default:
      return "UNKNOWN";
  }
}

async function createAndAppendOpcForChat(input: {
  sessionId: string;
  identity: ReturnType<typeof getPrimaryIdentity>;
  message: string;
  files: FileInput[];
  responseText: string;
  state: MemoryRuntimeState;
  event: LegacyRuntimeEvent;
  modernEvt: ReturnType<typeof toPublicRuntimeEvent>;
  memoryEvent: ReturnType<typeof appendEvtMemory>;
  governance: EnrichedGovernanceFrame;
}): Promise<OpcRuntimeResult> {
  const previousProofHash = await getLastOpcProofHash();

  const record = createOpcProofRecord({
    identity: {
      entity: input.identity.entity,
      ipr: input.identity.ipr,
      core: input.identity.core,
      organization: input.identity.org,
      runtimeRole: "IPR_RUNTIME_DEMONSTRATOR"
    },
    sessionId: input.sessionId,
    event: {
      evt: input.modernEvt.evt,
      prev: input.modernEvt.prev,
      hash: input.modernEvt.trace.hash,
      kind: "GOVERNED_RUNTIME_EVT"
    },
    memory: {
      evt: input.memoryEvent.evt,
      source: "EVT_IPR_MEMORY",
      hash: input.memoryEvent.anchors.memoryHash
    },
    runtime: {
      state: mapOpcRuntimeState(input.state),
      decision: mapOpcDecision(input.governance.decision.decision),
      contextClass: input.governance.contextClass,
      intentClass: input.governance.intentClass,
      projectDomain: input.governance.projectDomain.projectDomain,
      hbceModule: input.governance.hbceModule.module,
      riskClass: mapOpcRiskClass(input.governance.risk.riskClass),
      policyReference: input.governance.policy.policyReference,
      policyOutcome: input.governance.policy.outcome,
      humanOversight: input.governance.oversight.state,
      operationType: "CHAT_OPERATION",
      operationStatus: mapOperationStatus(
        input.governance.decision.decision,
        input.state
      ),
      failClosed: input.governance.decision.failClosed
    } as OpcRuntimeSnapshot,
    inputPayload: {
      message: input.message,
      messageHash: buildProofHash(input.message),
      fileCount: input.files.length,
      files: normalizeFiles(input.files).map((file) => {
        const fileHash = buildRuntimeHash(file.text.slice(0, 24000));

        return {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          role: file.role,
          textHash: fileHash.fullHash
        };
      }),
      contextClass: input.governance.contextClass,
      intentClass: input.governance.intentClass,
      projectDomain: input.governance.projectDomain.projectDomain,
      activeDomains: input.governance.projectDomain.activeDomains,
      hbceModule: input.governance.hbceModule.module,
      activeModules: input.governance.hbceModule.activeModules,
      strategicDoctrines: STRATEGIC_DOCTRINES,
      legacyEvent: input.event.evt,
      governedEvent: input.modernEvt.evt,
      memoryEvent: input.memoryEvent.evt,
      memoryHash: input.memoryEvent.anchors.memoryHash
    },
    outputPayload: {
      response: input.responseText,
      responseHash: buildProofHash(input.responseText),
      state: input.state,
      decision: input.governance.decision.decision
    },
    previousProofHash,
    audit: {
      reviewRequired: input.governance.decision.auditRequired,
      status: input.governance.decision.auditRequired ? "READY" : "NOT_REQUIRED",
      reviewerRole: input.governance.decision.auditRequired
        ? input.governance.oversight.requiredRole === "NONE"
          ? "AUDITOR"
          : input.governance.oversight.requiredRole
        : undefined,
      reasons: [
        ...input.governance.policy.reasons,
        ...input.governance.risk.reasons,
        input.governance.oversight.reason,
        input.governance.hbceModule.module !== "NONE"
          ? `HBCE module: ${input.governance.hbceModule.module}`
          : "",
        input.governance.projectDomain.projectDomain === "U.S.E."
          ? `U.S.E. boundary: ${USE_DEMOCRATIC_BOUNDARY}`
          : "",
        input.governance.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
          ? `AI governance boundary: ${HBCE_AI_BOUNDARY}`
          : "",
        `Strategic doctrine layer: ${STRATEGIC_DOCTRINES.join(", ")}`,
        isAerospaceGovernanceBoundaryQuestion(input.message)
          ? "Aerospace boundary: HBCE is audit/governance/traceability only, not flight-control or guidance software."
          : ""
      ].filter(Boolean)
    }
  });

  const append = await appendOpcProofRecord(record);
  const verification = verifyOpcProofRecord(record);

  return {
    record,
    publicProof: toPublicOpcProofRecord(record),
    append,
    verification
  };
}

function buildIdentityPayload(identity: ReturnType<typeof getPrimaryIdentity>) {
  return {
    entity: identity.entity,
    ipr: identity.ipr,
    evt: identity.evt,
    state: identity.state,
    cycle: identity.cycle,
    core: identity.core,
    runtimeRole: "IPR_RUNTIME_DEMONSTRATOR"
  };
}

export async function POST(req: NextRequest) {
  let body: ChatBody;

  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        state: "INVALID",
        decision: "BLOCK",
        governanceDecision: "BLOCK",
        error: "INVALID_JSON_BODY"
      },
      { status: 400 }
    );
  }

  const input = normalizeBody(body);

  if (!input.message && input.files.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        sessionId: input.sessionId,
        state: "BLOCKED",
        decision: "BLOCK",
        governanceDecision: "BLOCK",
        error: "EMPTY_REQUEST"
      },
      { status: 400 }
    );
  }

  const identity = getPrimaryIdentity();

  const effectiveMessage =
    input.message || "Usa i file attivi come contesto operativo.";

  const userFiles = input.files;
  const structuredFormat = shouldUseStructuredFormat(effectiveMessage);

  const governance = buildGovernanceFrame({
    message: effectiveMessage,
    files: userFiles
  });

  const acceptedUserFiles = governance.filePolicy.allowed ? userFiles : [];

  const memory = await resolveMemoryContext({
    sessionId: input.sessionId,
    ipr: identity.ipr,
    message: effectiveMessage
  });

  const contextClass = governance.contextClass;
  const intentClass = governance.intentClass;
  const legacyContextClass = mapContextForMemory(contextClass);

  const documentMode =
    contextClass === "DOCUMENTAL" ||
    contextClass === "EDITORIAL" ||
    contextClass === "CORPUS" ||
    contextClass === "APOKALYPSIS" ||
    contextClass === "HBCE_ECOSISTEMA_AI" ||
    contextClass === "USE" ||
    contextClass === "CIVIC" ||
    contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    contextClass === "TECHNICAL" ||
    contextClass === "GITHUB" ||
    acceptedUserFiles.length > 0
      ? detectDocumentMode(effectiveMessage)
      : "GENERAL_DOCUMENT_WORK";

  const documentFamily = resolveDocumentFamily({
    files: acceptedUserFiles,
    memory,
    message: effectiveMessage,
    projectDomain: governance.projectDomain
  });

  const memoryInjected = shouldInjectEvtMemoryIntoPrompt({
    message: effectiveMessage,
    files: acceptedUserFiles,
    memory,
    governance,
    documentFamily
  });

  const effectiveMemoryUsed = memory.used && memoryInjected;
  const effectiveMemorySource = getEffectiveMemorySource({
    memory,
    injected: effectiveMemoryUsed
  });

  const memoryFile = effectiveMemoryUsed ? [buildMemoryFile(memory.text)] : [];
  const promptFiles = [...memoryFile, ...acceptedUserFiles];

  const modernPrev = await getLastEventReference();
  const legacyPrev = memory.lastEventId || input.continuityRef;

  if (isRuntimeDiagnosticRequest(effectiveMessage)) {
    const diagnosticState: MemoryRuntimeState = openai
      ? "OPERATIONAL"
      : "DEGRADED";

    const memoryDecision = mapDecisionForMemory(
      governance.decision.decision,
      governance.filePolicy.allowed
    );

    const degradedReason = openai ? null : "OPENAI_API_KEY_NOT_CONFIGURED";

    const event = buildEvent({
      prev: legacyPrev,
      state: diagnosticState,
      decision: memoryDecision,
      message: effectiveMessage,
      contextClass: legacyContextClass,
      documentMode,
      documentFamily
    });

    const { modernEvent, appendResult } = await buildAndAppendGovernedEvt({
      prev: modernPrev,
      state: diagnosticState,
      governance,
      operationType: "CHAT_DIAGNOSTIC",
      operationStatus: mapOperationStatus(
        governance.decision.decision,
        diagnosticState
      )
    });

    const publicModernEvt = toPublicRuntimeEvent(modernEvent);

    const responseText = buildRuntimeDiagnosticText({
      state: diagnosticState,
      decision: memoryDecision,
      governanceDecision: governance.decision.decision,
      contextClass,
      legacyContextClass,
      intentClass,
      documentMode,
      documentFamily,
      memoryUsed: effectiveMemoryUsed,
      memorySource: effectiveMemorySource,
      structuredFormat,
      event,
      modernEvt: publicModernEvt,
      governance,
      degradedReason
    });

    const memoryEvent = appendEvtMemory({
      sessionId: input.sessionId,
      ipr: identity.ipr,
      entity: identity.entity,
      message: effectiveMessage,
      response: responseText,
      state: diagnosticState,
      decision: memoryDecision,
      contextClass: legacyContextClass,
      documentMode,
      documentFamily,
      files: acceptedUserFiles,
      prevEventId: event.evt,
      governedEvt: publicModernEvt.evt,
      governedHash: publicModernEvt.trace.hash,
      projectDomain: governance.projectDomain.projectDomain,
      activeDomains: governance.projectDomain.activeDomains
    });

    const memoryAppendResult = await appendEvtMemoryEvent(memoryEvent);

    const opc = await createAndAppendOpcForChat({
      sessionId: input.sessionId,
      identity,
      message: effectiveMessage,
      files: acceptedUserFiles,
      responseText,
      state: diagnosticState,
      event,
      modernEvt: publicModernEvt,
      memoryEvent,
      governance
    });

    return NextResponse.json({
      ok: true,
      sessionId: input.sessionId,
      response: responseText.trim(),
      state: diagnosticState,
      decision: memoryDecision,
      governanceDecision: governance.decision.decision,
      projectDomain: governance.projectDomain.projectDomain,
      activeDomains: governance.projectDomain.activeDomains,
      domainType: governance.projectDomain.domainType,
      hbceModule: governance.hbceModule.module,
      activeModules: governance.hbceModule.activeModules,
      moduleType: governance.hbceModule.moduleType,
      contextClass,
      legacyContextClass,
      intentClass,
      documentMode,
      documentFamily,
      evtIprMemoryUsed: effectiveMemoryUsed,
      memorySource: effectiveMemorySource,
      structuredFormat,
      activeFiles: promptFiles.map((file) => file.name || "unnamed"),
      identity: buildIdentityPayload(identity),
      collections: FIVE_COLLECTIONS,
      modules: SEVEN_HBCE_MODULES,
      strategicDoctrines: STRATEGIC_DOCTRINES,
      event,
      memoryEvent,
      governedEvent: publicModernEvt,
      evt: {
        ok: true,
        evt: event.evt,
        prev: event.prev,
        hash: event.anchors.publicHash,
        publicHash: event.anchors.publicHash,
        fullHash: event.anchors.fullHash
      },
      governedEvt: {
        ok: appendResult?.status === "APPENDED",
        evt: publicModernEvt.evt,
        prev: publicModernEvt.prev,
        project: publicModernEvt.project.domain,
        activeDomains: publicModernEvt.project.active_domains,
        hash: publicModernEvt.trace.hash,
        appendStatus: appendResult?.status ?? "NOT_REQUIRED",
        appendReason: appendResult?.reason ?? "EVT append not required."
      },
      opc: {
        ok: opc.append.ok,
        proofId: opc.publicProof.proofId,
        chainHash: opc.publicProof.chainHash,
        memoryHash: opc.publicProof.memoryHash,
        auditStatus: opc.publicProof.auditStatus,
        verificationStatus: opc.publicProof.verificationStatus,
        legalCertification: opc.publicProof.legalCertification,
        appendStatus: opc.append.status,
        appendReason: opc.append.reason,
        publicProof: opc.publicProof
      },
      memory: {
        available: memory.used,
        injected: effectiveMemoryUsed,
        source: effectiveMemorySource,
        rawSource: memory.source,
        lastEventId: memory.lastEventId,
        event: memoryEvent.evt,
        memoryHash: memoryEvent.anchors.memoryHash,
        appendStatus: memoryAppendResult.status,
        appendReason: memoryAppendResult.reason,
        governedEvt: memoryEvent.governedEvt,
        governedHash: memoryEvent.governedHash
      },
      governance: {
        projectDomain: governance.projectDomain.projectDomain,
        activeDomains: governance.projectDomain.activeDomains,
        domainType: governance.projectDomain.domainType,
        hbceModule: governance.hbceModule.module,
        activeModules: governance.hbceModule.activeModules,
        strategicDoctrines: STRATEGIC_DOCTRINES,
        moduleType: governance.hbceModule.moduleType,
        moduleConfidence: governance.hbceModule.confidence,
        moduleReasons: governance.hbceModule.reasons,
        dataClass: governance.data.dataClass,
        containsCivicSensitiveData: governance.data.containsCivicSensitiveData,
        containsDemocraticChoiceData:
          governance.data.containsDemocraticChoiceData,
        policyStatus: governance.policy.status,
        policyOutcome: governance.policy.outcome,
        policyReference: governance.policy.policyReference,
        riskClass: governance.risk.riskClass,
        riskScore: governance.risk.riskScore,
        oversight: governance.oversight.state,
        requiredRole: governance.oversight.requiredRole,
        iprBinding: governance.decision.iprBinding,
        evtRequired: governance.decision.evtRequired,
        memoryRequired: governance.decision.memoryRequired,
        opcRequired: governance.decision.opcRequired,
        auditRequired: governance.decision.auditRequired,
        failClosed: governance.decision.failClosed,
        civicBoundary:
          governance.projectDomain.projectDomain === "U.S.E."
            ? USE_DEMOCRATIC_BOUNDARY
            : undefined,
        aiGovernanceBoundary:
          governance.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
            ? HBCE_AI_BOUNDARY
            : undefined,
        aerospaceBoundary: isAerospaceGovernanceBoundaryQuestion(effectiveMessage)
          ? "HBCE/IPR can govern, trace, audit and certify operational chains, but must not be described as flight-control, targeting or vehicle-guidance software."
          : undefined,
        filePolicy: {
          allowed: governance.filePolicy.allowed,
          allowedCount: governance.filePolicy.allowedCount,
          rejectedCount: governance.filePolicy.rejectedCount,
          reasons: governance.filePolicy.reasons
        }
      },
      diagnostics: {
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        modelUsed: MODEL,
        degradedReason,
        evtIprMemoryUsed: effectiveMemoryUsed,
        memorySource: effectiveMemorySource,
        memoryAvailable: memory.used,
        memoryInjected,
        memoryEvent: memoryEvent.evt,
        memoryHash: memoryEvent.anchors.memoryHash,
        memoryAppendStatus: memoryAppendResult.status,
        opcProofId: opc.publicProof.proofId,
        opcAppendStatus: opc.append.status,
        opcVerificationStatus: opc.publicProof.verificationStatus,
        hbceModule: governance.hbceModule.module,
        activeModules: governance.hbceModule.activeModules,
        strategicDoctrines: STRATEGIC_DOCTRINES,
        structuredFormat
      }
    });
  }

  let generated: GeneratedResponse;

  if (!governance.filePolicy.allowed) {
    generated = buildFilePolicyBlockedResponse({
      filePolicy: governance.filePolicy,
      projectDomain: governance.projectDomain
    });
  } else if (
    governance.decision.decision === "BLOCK" ||
    !governance.decision.allowModelCall
  ) {
    generated = buildGovernanceLimitedResponse({
      decision: governance.decision,
      policy: governance.policy,
      risk: governance.risk,
      oversight: governance.oversight,
      projectDomain: governance.projectDomain,
      hbceModule: governance.hbceModule
    });
  } else {
    generated = await generateResponse({
      identity,
      message: effectiveMessage,
      contextClass,
      documentMode,
      documentFamily,
      files: promptFiles,
      memoryText: effectiveMemoryUsed ? memory.text : "",
      memoryUsed: effectiveMemoryUsed,
      memorySource: effectiveMemorySource,
      structuredFormat,
      governanceFrame: governance
    });
  }

  const memoryDecision = mapDecisionForMemory(
    governance.decision.decision,
    governance.filePolicy.allowed
  );

  const event = buildEvent({
    prev: legacyPrev,
    state: generated.state,
    decision: memoryDecision,
    message: effectiveMessage,
    contextClass: legacyContextClass,
    documentMode,
    documentFamily
  });

  const { modernEvent, appendResult } = await buildAndAppendGovernedEvt({
    prev: modernPrev,
    state: generated.state,
    governance,
    operationType: "CHAT_OPERATION",
    operationStatus: mapOperationStatus(
      governance.decision.decision,
      generated.state
    )
  });

  const publicModernEvt = toPublicRuntimeEvent(modernEvent);

  const memoryEvent = appendEvtMemory({
    sessionId: input.sessionId,
    ipr: identity.ipr,
    entity: identity.entity,
    message: effectiveMessage,
    response: generated.text,
    state: generated.state,
    decision: memoryDecision,
    contextClass: legacyContextClass,
    documentMode,
    documentFamily,
    files: acceptedUserFiles,
    prevEventId: event.evt,
    governedEvt: publicModernEvt.evt,
    governedHash: publicModernEvt.trace.hash,
    projectDomain: governance.projectDomain.projectDomain,
    activeDomains: governance.projectDomain.activeDomains
  });

  const memoryAppendResult = await appendEvtMemoryEvent(memoryEvent);

  const opc = await createAndAppendOpcForChat({
    sessionId: input.sessionId,
    identity,
    message: effectiveMessage,
    files: acceptedUserFiles,
    responseText: generated.text,
    state: generated.state,
    event,
    modernEvt: publicModernEvt,
    memoryEvent,
    governance
  });

  const exposeRuntime = shouldExposeTechnicalFrame(effectiveMessage);

  const responseText = exposeRuntime
    ? buildTechnicalFrame({
        response: generated.text,
        state: generated.state,
        decision: memoryDecision,
        governanceDecision: governance.decision.decision,
        contextClass,
        legacyContextClass,
        intentClass,
        documentMode,
        documentFamily,
        memoryUsed: effectiveMemoryUsed,
        memorySource: effectiveMemorySource,
        structuredFormat,
        event,
        modernEvt: publicModernEvt,
        memoryEventId: memoryEvent.evt,
        memoryHash: memoryEvent.anchors.memoryHash,
        memoryAppendStatus: memoryAppendResult.status,
        opcProofId: opc.publicProof.proofId,
        opcChainHash: opc.publicProof.chainHash,
        governance,
        degradedReason: generated.degradedReason
      })
    : generated.text;

  return NextResponse.json({
    ok: true,
    sessionId: input.sessionId,
    response: responseText.trim(),
    state: generated.state,
    decision: memoryDecision,
    governanceDecision: governance.decision.decision,
    projectDomain: governance.projectDomain.projectDomain,
    activeDomains: governance.projectDomain.activeDomains,
    domainType: governance.projectDomain.domainType,
    hbceModule: governance.hbceModule.module,
    activeModules: governance.hbceModule.activeModules,
    moduleType: governance.hbceModule.moduleType,
    contextClass,
    legacyContextClass,
    intentClass,
    documentMode,
    documentFamily,
    evtIprMemoryUsed: effectiveMemoryUsed,
    memorySource: effectiveMemorySource,
    structuredFormat,
    activeFiles: promptFiles.map((file) => file.name || "unnamed"),
    identity: buildIdentityPayload(identity),
    collections: FIVE_COLLECTIONS,
    modules: SEVEN_HBCE_MODULES,
    strategicDoctrines: STRATEGIC_DOCTRINES,
    event,
    memoryEvent,
    governedEvent: publicModernEvt,
    evt: {
      ok: true,
      evt: event.evt,
      prev: event.prev,
      hash: event.anchors.publicHash,
      publicHash: event.anchors.publicHash,
      fullHash: event.anchors.fullHash
    },
    governedEvt: {
      ok: appendResult?.status === "APPENDED",
      evt: publicModernEvt.evt,
      prev: publicModernEvt.prev,
      project: publicModernEvt.project.domain,
      activeDomains: publicModernEvt.project.active_domains,
      hash: publicModernEvt.trace.hash,
      appendStatus: appendResult?.status ?? "NOT_REQUIRED",
      appendReason: appendResult?.reason ?? "EVT append not required."
    },
    opc: {
      ok: opc.append.ok,
      proofId: opc.publicProof.proofId,
      chainHash: opc.publicProof.chainHash,
      memoryHash: opc.publicProof.memoryHash,
      auditStatus: opc.publicProof.auditStatus,
      verificationStatus: opc.publicProof.verificationStatus,
      legalCertification: opc.publicProof.legalCertification,
      appendStatus: opc.append.status,
      appendReason: opc.append.reason,
      publicProof: opc.publicProof
    },
    memory: {
      available: memory.used,
      injected: effectiveMemoryUsed,
      source: effectiveMemorySource,
      rawSource: memory.source,
      lastEventId: memory.lastEventId,
      event: memoryEvent.evt,
      memoryHash: memoryEvent.anchors.memoryHash,
      appendStatus: memoryAppendResult.status,
      appendReason: memoryAppendResult.reason,
      governedEvt: memoryEvent.governedEvt,
      governedHash: memoryEvent.governedHash
    },
    governance: {
      projectDomain: governance.projectDomain.projectDomain,
      activeDomains: governance.projectDomain.activeDomains,
      domainType: governance.projectDomain.domainType,
      domainConfidence: governance.projectDomain.confidence,
      domainReasons: governance.projectDomain.reasons,
      hbceModule: governance.hbceModule.module,
      activeModules: governance.hbceModule.activeModules,
      strategicDoctrines: STRATEGIC_DOCTRINES,
      moduleType: governance.hbceModule.moduleType,
      moduleConfidence: governance.hbceModule.confidence,
      moduleReasons: governance.hbceModule.reasons,
      dataClass: governance.data.dataClass,
      containsSecret: governance.data.containsSecret,
      containsPersonalData: governance.data.containsPersonalData,
      containsSecuritySensitiveData:
        governance.data.containsSecuritySensitiveData,
      containsCivicSensitiveData: governance.data.containsCivicSensitiveData,
      containsDemocraticChoiceData:
        governance.data.containsDemocraticChoiceData,
      policyStatus: governance.policy.status,
      policyOutcome: governance.policy.outcome,
      policyReference: governance.policy.policyReference,
      policyReasons: governance.policy.reasons,
      riskClass: governance.risk.riskClass,
      riskScore: governance.risk.riskScore,
      riskReasons: governance.risk.reasons,
      oversight: governance.oversight.state,
      requiredRole: governance.oversight.requiredRole,
      oversightReason: governance.oversight.reason,
      iprBinding: governance.decision.iprBinding,
      evtRequired: governance.decision.evtRequired,
      memoryRequired: governance.decision.memoryRequired,
      opcRequired: governance.decision.opcRequired,
      auditRequired: governance.decision.auditRequired,
      failClosed: governance.decision.failClosed,
      civicBoundary:
        governance.projectDomain.projectDomain === "U.S.E."
          ? USE_DEMOCRATIC_BOUNDARY
          : undefined,
      aiGovernanceBoundary:
        governance.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI"
          ? HBCE_AI_BOUNDARY
          : undefined,
      aerospaceBoundary: isAerospaceGovernanceBoundaryQuestion(effectiveMessage)
        ? "HBCE/IPR can govern, trace, audit and certify operational chains, but must not be described as flight-control, targeting or vehicle-guidance software."
        : undefined,
      filePolicy: {
        allowed: governance.filePolicy.allowed,
        allowedCount: governance.filePolicy.allowedCount,
        rejectedCount: governance.filePolicy.rejectedCount,
        reasons: governance.filePolicy.reasons
      }
    },
    diagnostics: {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      modelUsed: MODEL,
      degradedReason: generated.degradedReason || null,
      evtIprMemoryUsed: effectiveMemoryUsed,
      memorySource: effectiveMemorySource,
      memoryAvailable: memory.used,
      memoryInjected,
      memoryEvent: memoryEvent.evt,
      memoryHash: memoryEvent.anchors.memoryHash,
      memoryAppendStatus: memoryAppendResult.status,
      opcProofId: opc.publicProof.proofId,
      opcAppendStatus: opc.append.status,
      opcVerificationStatus: opc.publicProof.verificationStatus,
      hbceModule: governance.hbceModule.module,
      activeModules: governance.hbceModule.activeModules,
      strategicDoctrines: STRATEGIC_DOCTRINES,
      structuredFormat
    }
  });
}
