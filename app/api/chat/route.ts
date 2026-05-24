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
  buildEvtMemoryContextFromLedger,
  getEvtMemoryEventById
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
  type OpcEngineSnapshot,
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

type OpenAIEngineMode = "standard" | "deep";

type OpenAIEngineConfig = OpcEngineSnapshot & {
  provider: "OpenAI";
  apiMode: "chat.completions";
  role: "cognitive_engine";
  runtimeRole: "HBCE_governed_runtime";
  modelUsed: string;
  standardModel: string;
  deepModel: string;
  mode: OpenAIEngineMode;
  configured: boolean;
  projectBirthDate: "2026-01-19";
  projectBirthLabel: "HBCE R&D / AI JOKER-C2 project birth date";
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

type PromptFileContext = {
  acceptedTextFiles: FileInput[];
  referenceOnlyFiles: FileInput[];
  referenceOnlyContextFile: FileInput | null;
};

const DEFAULT_JOKER_MODEL = "gpt-5.5";
const DEFAULT_JOKER_DEEP_MODEL = "gpt-5.5";

const OPENAI_ENGINE_PROVIDER = "OpenAI" as const;
const OPENAI_ENGINE_API_MODE = "chat.completions" as const;
const OPENAI_ENGINE_ROLE = "cognitive_engine" as const;
const HBCE_RUNTIME_ROLE = "HBCE_governed_runtime" as const;

const HBCE_JOKER_C2_PROJECT_BIRTH_DATE = "2026-01-19" as const;
const HBCE_JOKER_C2_PROJECT_BIRTH_LABEL =
  "HBCE R&D / AI JOKER-C2 project birth date" as const;

const MODEL = resolveModelEnv("JOKER_MODEL", DEFAULT_JOKER_MODEL);
const DEEP_MODEL = resolveModelEnv("JOKER_DEEP_MODEL", DEFAULT_JOKER_DEEP_MODEL);

const MAX_COMPLETION_TOKENS = 4600;
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

const REFERENCE_ONLY_CONTEXT_FILE_ID = "hbce-reference-only-files";
const REFERENCE_ONLY_CONTEXT_FILE_NAME = "HBCE_REFERENCE_ONLY_FILES.md";

function normalizeModelId(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "gpt.5-5" ||
    normalized === "gpt_5_5" ||
    normalized === "gpt 5.5" ||
    normalized === "gpt-55" ||
    normalized === "gpt5.5"
  ) {
    return "gpt-5.5";
  }

  return value.trim();
}

function resolveModelEnv(name: string, fallback: string): string {
  const value = process.env[name];

  if (typeof value === "string" && value.trim()) {
    return normalizeModelId(value);
  }

  return fallback;
}

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

function normalizeRuntimeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function runtimeTextIncludesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
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

  const hasManuel = runtimeTextIncludesAny(text, [
    "manuel",
    "manuel coletta",
    "mnauel coletta",
    "manuele coletta"
  ]);

  if (!hasManuel) {
    return false;
  }

  return runtimeTextIncludesAny(text, [
    "chi e",
    "chi è",
    "cos e",
    "cosa e",
    "who is",
    "parlami",
    "descrivi",
    "raccontami",
    "profilo",
    "psicologico",
    "psicologia",
    "filosofia",
    "pensiero",
    "origine",
    "fondatore",
    "persona",
    "personalita",
    "personalità"
  ]);
}

function isManuelPsychologicalQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, ["manuel"]) &&
    runtimeTextIncludesAny(text, [
      "psicologico",
      "psicologia",
      "personalita",
      "personalità",
      "carattere",
      "mentalita",
      "mentalità",
      "profilo"
    ])
  );
}

function isManuelPhilosophyQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    (runtimeTextIncludesAny(text, ["manuel"]) &&
      runtimeTextIncludesAny(text, ["filosofia", "pensiero", "visione"])) ||
    runtimeTextIncludesAny(text, [
      "sua filosofia",
      "della sua filosofia",
      "suo pensiero",
      "della sua visione",
      "filosofia della decisione",
      "passaggio logico tra manuel e la filosofia"
    ])
  );
}

function isPhilosophicalDecisionQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, ["filosofia", "filosofico", "pensiero"]) &&
    runtimeTextIncludesAny(text, ["decisione", "scelta", "responsabilita", "responsabilità"]) &&
    !hasExplicitOperationalActionRequest(message)
  );
}

function isHashMemoryQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, ["hash"]) &&
    runtimeTextIncludesAny(text, ["memoria", "memory", "precedente", "differenza"])
  );
}

function isOpcLegalCertificationQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, ["opc"]) &&
    runtimeTextIncludesAny(text, [
      "certificazione legale",
      "legale ufficiale",
      "validazione istituzionale",
      "certificazione ufficiale",
      "legal certification"
    ])
  );
}

function isFailClosedExplanationQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, ["manca", "mancano", "assenza", "se manca"]) &&
    runtimeTextIncludesAny(text, ["prova", "hash", "verifica", "proof"]) &&
    runtimeTextIncludesAny(text, ["procedere", "comunque", "fail-closed", "bloccare", "degradare"])
  );
}

function isMainJobQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "il tuo lavoro principale",
    "qual e il tuo lavoro",
    "qual è il tuo lavoro",
    "cosa fai principalmente",
    "a cosa servi",
    "lavori bene o male"
  ]);
}

function isParrotQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "pappagallo",
    "ripeti",
    "ripetere",
    "fotocopia",
    "ragioni in base alla conversazione"
  ]);
}

function isMemoryRecallWithOriginalDeductionQuestion(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return (
    runtimeTextIncludesAny(text, ["memoria precedente", "cosa ricordi", "ricordi della discussione"]) &&
    runtimeTextIncludesAny(text, ["deduzione", "punto di vista", "originale", "apostasia", "religione", "civilta", "civiltà"])
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
    "runtime ai governato",
    "motore cognitivo",
    "enginehash",
    "opcchainhash"
  ]);
}

function hasExplicitMemoryReference(message: string): boolean {
  const text = normalizeRuntimeText(message);

  return runtimeTextIncludesAny(text, [
    "come prima",
    "prima",
    "sopra",
    "precedente",
    "precedenti",
    "abbiamo",
    "continua",
    "continuazione",
    "continuita",
    "continuità",
    "riprendi",
    "recupera",
    "recuperata",
    "memoria recuperata",
    "questa diagnostica",
    "diagnostica precedente",
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
    "ok vai",
    "sua",
    "suo",
    "della sua",
    "del suo",
    "passaggio logico",
    "collegalo",
    "collega",
    "discussione"
  ]);
}

function shouldUseDeepOpenAIModel(input: {
  message: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  governance: EnrichedGovernanceFrame;
}): boolean {
  if (isRuntimeDiagnosticRequest(input.message)) {
    return true;
  }

  if (
    isManuelPsychologicalQuestion(input.message) ||
    isManuelPhilosophyQuestion(input.message) ||
    isPhilosophicalDecisionQuestion(input.message) ||
    isMemoryRecallWithOriginalDeductionQuestion(input.message)
  ) {
    return true;
  }

  if (
    input.contextClass === "GITHUB" ||
    input.contextClass === "TECHNICAL" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "SECURITY" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "HBCE_ECOSISTEMA_AI" ||
    input.contextClass === "STRATEGIC" ||
    input.contextClass === "MATRIX"
  ) {
    return true;
  }

  if (
    input.intentClass === "ANALYZE" ||
    input.intentClass === "REWRITE" ||
    input.intentClass === "TRANSFORM" ||
    input.intentClass === "GITHUB" ||
    input.intentClass === "COMPLIANCE" ||
    input.intentClass === "STRATEGIC"
  ) {
    return true;
  }

  if (
    input.documentMode === "IMPACT_ASSESSMENT" ||
    input.documentMode === "EDITORIAL_REVIEW" ||
    input.documentMode === "GENERATIVE_REWRITE" ||
    input.documentMode === "DERIVED_OUTPUT"
  ) {
    return true;
  }

  if (
    input.governance.decision.auditRequired ||
    input.governance.decision.opcRequired ||
    input.governance.risk.riskClass !== "LOW"
  ) {
    return true;
  }

  return false;
}

function resolveOpenAIEngineConfig(input: {
  message: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  governance: EnrichedGovernanceFrame;
}): OpenAIEngineConfig {
  const useDeepModel = shouldUseDeepOpenAIModel(input);

  return {
    provider: OPENAI_ENGINE_PROVIDER,
    apiMode: OPENAI_ENGINE_API_MODE,
    role: OPENAI_ENGINE_ROLE,
    runtimeRole: HBCE_RUNTIME_ROLE,
    modelUsed: useDeepModel ? DEEP_MODEL : MODEL,
    standardModel: MODEL,
    deepModel: DEEP_MODEL,
    mode: useDeepModel ? "deep" : "standard",
    configured: Boolean(process.env.OPENAI_API_KEY),
    projectBirthDate: HBCE_JOKER_C2_PROJECT_BIRTH_DATE,
    projectBirthLabel: HBCE_JOKER_C2_PROJECT_BIRTH_LABEL
  };
}

function buildOpenAIEnginePayload(engine: OpenAIEngineConfig) {
  return {
    provider: engine.provider,
    apiMode: engine.apiMode,
    role: engine.role,
    runtimeRole: engine.runtimeRole,
    modelUsed: engine.modelUsed,
    standardModel: engine.standardModel,
    deepModel: engine.deepModel,
    mode: engine.mode,
    configured: engine.configured,
    projectBirthDate: engine.projectBirthDate,
    projectBirthLabel: engine.projectBirthLabel
  };
}

function resolvePromptFileContext(
  userFiles: FileInput[],
  filePolicy: ReturnType<typeof evaluateFileBatchPolicy>
): PromptFileContext {
  const acceptedTextFiles: FileInput[] = [];
  const referenceOnlyFiles: FileInput[] = [];

  for (let index = 0; index < userFiles.length; index += 1) {
    const file = userFiles[index];
    const policyResult = filePolicy.files[index];

    if (!policyResult) {
      continue;
    }

    if (policyResult.allowed) {
      acceptedTextFiles.push(file);
      continue;
    }

    if (isReferenceOnlyPolicyResult(policyResult)) {
      referenceOnlyFiles.push(file);
    }
  }

  return {
    acceptedTextFiles,
    referenceOnlyFiles,
    referenceOnlyContextFile: buildReferenceOnlyContextFile(referenceOnlyFiles)
  };
}

function isReferenceOnlyPolicyResult(
  result: ReturnType<typeof evaluateFileBatchPolicy>["files"][number]
): boolean {
  const reason = result.reason.toLowerCase();

  return (
    !result.allowed &&
    (result.status === "PARTIAL" || result.status === "UNSUPPORTED") &&
    reason.includes("should not block")
  );
}

function buildReferenceOnlyContextFile(files: FileInput[]): FileInput | null {
  if (files.length === 0) {
    return null;
  }

  const normalized = normalizeFiles(files);

  const lines = [
    "HBCE REFERENCE-ONLY FILE NOTICE",
    "",
    "The following active files are present in the runtime, but they were not inserted as extracted safe text into the model prompt.",
    "They must be treated as reference-only files unless their content has been separately converted into safe plain text.",
    "",
    "Operational rule:",
    "- Do not claim that these files were fully read.",
    "- Do not invent contents from these files.",
    "- Continue with the user's safe textual request, runtime memory, and available HBCE context.",
    "- If the user explicitly asks to use these files, disclose that they are reference-only in the current runtime.",
    "",
    "Reference-only files:",
    ...normalized.map((file, index) => {
      return `${index + 1}. ${file.name} | ${file.type} | ${file.size} bytes`;
    })
  ];

  const text = lines.join("\n");

  return {
    id: REFERENCE_ONLY_CONTEXT_FILE_ID,
    name: REFERENCE_ONLY_CONTEXT_FILE_NAME,
    type: "text/markdown",
    size: text.length,
    role: "runtime_reference_only_notice",
    text
  };
}

function buildReferenceOnlyDisclosure(files: FileInput[]): string {
  const names = normalizeFiles(files).map((file) => file.name).join(", ");

  return [
    "Nota runtime sui file:",
    `Il runtime ha rilevato file attivi non processati come testo leggibile diretto: ${names}.`,
    "Procedo in modalità sicura usando la richiesta testuale, la memoria EVT/IPR-bound e il contesto HBCE disponibile. Non considero quei PDF o documenti come letti integralmente parola per parola finché non vengono forniti anche come testo estratto."
  ].join("\n");
}

function applyReferenceOnlyDisclosure(
  generated: GeneratedResponse,
  referenceOnlyFiles: FileInput[]
): GeneratedResponse {
  if (referenceOnlyFiles.length === 0) {
    return generated;
  }

  if (!generated.text.trim()) {
    return generated;
  }

  if (generated.text.includes("Nota runtime sui file:")) {
    return generated;
  }

  if (generated.state === "BLOCKED" || generated.degradedReason === "FILE_POLICY_BLOCK") {
    return generated;
  }

  return {
    ...generated,
    text: [buildReferenceOnlyDisclosure(referenceOnlyFiles), "", generated.text].join("\n")
  };
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

  if (input.projectDomain.projectDomain === "APOKALYPSIS") {
    return "APOKALYPSIS";
  }

  if (input.projectDomain.projectDomain === "HBCE_ECOSISTEMA_AI") {
    return "HBCE_RUNTIME";
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

  if (
    hasExplicitMemoryReference(input.message) ||
    isRuntimeDiagnosticRequest(input.message) ||
    isStrategicDoctrineQuestion(input.message) ||
    isPragmaticGovernanceValueQuestion(input.message) ||
    isManuelPhilosophyQuestion(input.message) ||
    isPhilosophicalDecisionQuestion(input.message) ||
    isMemoryRecallWithOriginalDeductionQuestion(input.message)
  ) {
    return true;
  }

  if (
    isRuntimeSelfIdentityQuestion(input.message) ||
    isManuelColettaIdentityQuestion(input.message) ||
    isAerospaceGovernanceBoundaryQuestion(input.message)
  ) {
    return hasExplicitMemoryReference(input.message);
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

function buildContinuityReferenceMemoryText(input: {
  continuityRef: string;
  event?: Awaited<ReturnType<typeof getEvtMemoryEventById>>;
}): string {
  if (input.event) {
    return [
      "MEMORIA EVT/IPR-BOUND RECUPERATA DA CONTINUITY_REF:",
      `MEMORY_SOURCE: LEDGER_CONTINUITY_REF`,
      `LAST_MEMORY_EVT: ${input.event.evt}`,
      `PREV: ${input.event.prev}`,
      `PROJECT_DOMAIN: ${input.event.projectDomain}`,
      `ACTIVE_DOMAINS: ${input.event.activeDomains.join(", ")}`,
      `DOCUMENT_FAMILY: ${input.event.documentFamily}`,
      `GOVERNED_EVT: ${input.event.governedEvt || "none"}`,
      `GOVERNED_HASH: ${input.event.governedHash || "none"}`,
      `OPC_PROOF_ID: ${input.event.opcProofId || "none"}`,
      `OPC_CHAIN_HASH: ${input.event.opcChainHash || "none"}`,
      `OPC_ENGINE_HASH: ${input.event.opcEngineHash || "none"}`,
      `ENGINE_HASH: ${input.event.engineHash || "none"}`,
      `ENGINE_PROVIDER: ${input.event.engineProvider || "none"}`,
      `MODEL_USED: ${input.event.modelUsed || "none"}`,
      `NATIVE_ENGINE_BINDING: ${input.event.nativeEngineBinding ? "true" : "false"}`,
      `TRACE_HASH: ${input.event.anchors.traceHash}`,
      `MEMORY_HASH: ${input.event.anchors.memoryHash}`,
      "",
      "MEMORY_DELTA:",
      input.event.memoryDelta || "none",
      "",
      "NEXT_CONTEXT:",
      input.event.nextContext || "none",
      "",
      "ISTRUZIONE DI RECUPERO:",
      "Usa questa memoria solo se è pertinente alla domanda corrente. Non copiare la risposta precedente. Usa il contenuto come contesto, poi rispondi alla domanda nuova."
    ].join("\n");
  }

  return [
    "MEMORIA EVT/IPR-BOUND DISPONIBILE COME CONTINUITY_REF:",
    `MEMORY_SOURCE: CONTINUITY_REF`,
    `LAST_MEMORY_EVT: ${input.continuityRef}`,
    "",
    "Il frontend ha passato un continuityRef precedente. La continuità tecnica esiste, ma il dettaglio semantico potrebbe non essere stato ricostruito integralmente.",
    "",
    "ISTRUZIONE DI RECUPERO:",
    "Usa questa informazione solo come riferimento tecnico di continuità. Non inventare contenuti non presenti."
  ].join("\n");
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

  if (
    isRuntimeSelfIdentityQuestion(input.message) ||
    isManuelColettaIdentityQuestion(input.message) ||
    isManuelPsychologicalQuestion(input.message) ||
    isManuelPhilosophyQuestion(input.message) ||
    isPhilosophicalDecisionQuestion(input.message)
  ) {
    return withHbceModuleOverride(
      base,
      "UNEBDO",
      ["UNEBDO", "OPC", "NeuroLoop", "MATRIX"],
      0.98,
      [
        "Safe identity, psychology or philosophy conversation mapped to UNEBDO and NeuroLoop.",
        "This is conceptual conversation, not an operational action.",
        "OPC and MATRIX remain active for proof and architecture continuity."
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
        ? Array.from(new Set<HbceModuleValue>([...base.activeModules, "MATRIX"]))
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

function buildConversationalProjectDomain(
  base: ProjectDomainClassification,
  message: string
): ProjectDomainClassification {
  const activeDomains: ProjectDomain[] = isMemoryRecallWithOriginalDeductionQuestion(message)
    ? ["APOKALYPSIS" as ProjectDomain, "MATRIX" as ProjectDomain]
    : ["MATRIX" as ProjectDomain];

  return {
    ...base,
    projectDomain: activeDomains[0],
    activeDomains,
    confidence: Math.max(base.confidence || 0, 0.96),
    reasons: [
      ...base.reasons,
      "Safe conceptual conversation override applied.",
      "The request asks for explanation, psychology, philosophy, memory recall or conceptual reasoning, not real-world execution."
    ]
  };
}

function applyConversationalGovernanceOverride(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
}): EnrichedGovernanceFrame {
  const matched =
    isManuelColettaIdentityQuestion(input.message) ||
    isManuelPsychologicalQuestion(input.message) ||
    isManuelPhilosophyQuestion(input.message) ||
    isPhilosophicalDecisionQuestion(input.message) ||
    isHashMemoryQuestion(input.message) ||
    isOpcLegalCertificationQuestion(input.message) ||
    isFailClosedExplanationQuestion(input.message) ||
    isMainJobQuestion(input.message) ||
    isParrotQuestion(input.message) ||
    isMemoryRecallWithOriginalDeductionQuestion(input.message);

  if (!matched || hasExplicitOperationalActionRequest(input.message)) {
    return input.frame;
  }

  const projectDomain = buildConversationalProjectDomain(
    input.frame.projectDomain,
    input.message
  );

  const hbceModule = normalizeHbceModuleClassification({
    message: input.message,
    classification: input.frame.hbceModule,
    projectDomain,
    contextClass: isHashMemoryQuestion(input.message) ||
      isOpcLegalCertificationQuestion(input.message) ||
      isFailClosedExplanationQuestion(input.message)
        ? "TECHNICAL"
        : "IDENTITY",
    intentClass: "ASK"
  });

  const data: DataClassification = {
    dataClass: isMemoryRecallWithOriginalDeductionQuestion(input.message)
      ? "INTERNAL"
      : "PUBLIC",
    containsSecret: false,
    containsPersonalData:
      isManuelColettaIdentityQuestion(input.message) ||
      isManuelPsychologicalQuestion(input.message) ||
      isManuelPhilosophyQuestion(input.message),
    containsSecuritySensitiveData: false,
    containsCivicSensitiveData: false,
    containsDemocraticChoiceData: false,
    reasons: [
      "Safe conversational conceptual request detected.",
      "The request is explanatory or interpretive and does not request operational execution."
    ]
  };

  const policy: PolicyEvaluation = {
    status: "ALLOWED",
    policyReference: "SAFE_CONVERSATIONAL_REASONING",
    prohibited: false,
    failClosed: false,
    reasons: [
      "Safe conversational reasoning override applied.",
      "Psychology is handled as non-clinical profile reading.",
      "Philosophy of decision is conceptual and not an operational decision.",
      "Hash, memory, OPC and fail-closed explanations are safe technical explanations."
    ],
    outcome: "PERMIT"
  };

  const risk: RiskEvaluation = {
    riskClass: "LOW",
    probability: 1,
    impact: 1,
    riskScore: 1,
    reasons: [
      "Low-risk conceptual conversation.",
      "No legal, clinical, operational, offensive, secret or identity-choice linkage operation is requested."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "NOT_REQUIRED",
    requiredRole: "NONE",
    reason:
      "Safe conceptual explanation does not require human review before response."
  };

  const contextClass: ContextClass =
    isHashMemoryQuestion(input.message) ||
    isOpcLegalCertificationQuestion(input.message) ||
    isFailClosedExplanationQuestion(input.message)
      ? "TECHNICAL"
      : isMemoryRecallWithOriginalDeductionQuestion(input.message)
        ? "APOKALYPSIS"
        : "IDENTITY";

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyOutcome: policy.outcome,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass,
    intentClass: "ASK",
    dataClass: data.dataClass,
    projectDomain: projectDomain.projectDomain,
    activeDomains: projectDomain.activeDomains,
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false,
    memoryPreferred: true,
    opcPreferred:
      isHashMemoryQuestion(input.message) ||
      isOpcLegalCertificationQuestion(input.message) ||
      isFailClosedExplanationQuestion(input.message),
    iprBindingPreferred: true
  });

  return {
    ...input.frame,
    projectDomain,
    hbceModule,
    contextClass,
    intentClass: "ASK",
    data,
    policy,
    risk,
    oversight,
    decision
  };
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

  if (
    isSafeIdentityGovernanceQuestion(input.message) ||
    isManuelColettaIdentityQuestion(input.message) ||
    isManuelPsychologicalQuestion(input.message) ||
    isManuelPhilosophyQuestion(input.message) ||
    isPhilosophicalDecisionQuestion(input.message) ||
    isHashMemoryQuestion(input.message) ||
    isOpcLegalCertificationQuestion(input.message) ||
    isFailClosedExplanationQuestion(input.message)
  ) {
    return {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData:
        isManuelColettaIdentityQuestion(input.message) ||
        isManuelPsychologicalQuestion(input.message) ||
        isManuelPhilosophyQuestion(input.message),
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Safe public conceptual explanation detected.",
        "Classified as PUBLIC to prevent false escalation."
      ]
    };
  }

  if (isMemoryRecallWithOriginalDeductionQuestion(input.message)) {
    return {
      dataClass: "INTERNAL",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
      containsCivicSensitiveData: false,
      containsDemocraticChoiceData: false,
      reasons: [
        "Memory recall with conceptual deduction detected.",
        "Classified as INTERNAL because it uses session continuity but no secret or prohibited content."
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
        "Classified as PUBLIC because the request asks for general business, banking, legal or governance value, not an operational action."
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
    auditPreferred: true,
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
    !isAerospaceGovernanceBoundaryQuestion(input.message)
  ) {
    return input.frame;
  }

  const isSelf = isRuntimeSelfIdentityQuestion(input.message);
  const isAerospace = isAerospaceGovernanceBoundaryQuestion(input.message);

  const projectDomain = isSelf
    ? buildRuntimeIdentityProjectDomain(input.frame.projectDomain)
    : buildAerospaceGovernanceProjectDomain(input.frame.projectDomain);

  const contextClass: ContextClass = isAerospace
    ? "GOVERNANCE"
    : "IDENTITY";

  const intentClass: IntentClass = "ASK";

  const data: DataClassification = {
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
    opcPreferred: isAerospace,
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

    return applyGovernanceOverrides({
      frame,
      message: input.message,
      files: input.files
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

  return applyGovernanceOverrides({
    frame,
    message: input.message,
    files: input.files
  });
}

function applyGovernanceOverrides(input: {
  frame: EnrichedGovernanceFrame;
  message: string;
  files: FileInput[];
}): EnrichedGovernanceFrame {
  const diagnosticFrame = applySafeRuntimeDiagnosticGovernanceOverride({
    frame: input.frame,
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

  const conversationalFrame = applyConversationalGovernanceOverride({
    frame: hbceAiFrame,
    message: input.message
  });

  return applySafeDocumentGovernanceOverride({
    frame: conversationalFrame,
    message: input.message,
    files: input.files
  });
}

function buildAntiParrotDirective(input: {
  message: string;
  memoryUsed: boolean;
  memorySource: string;
}): string {
  return [
    "ANTI-REPETITION AND CONVERSATION QUALITY DIRECTIVE:",
    "- Answer the current user question first.",
    "- Do not repeat a previous answer unless the user explicitly asks to repeat it.",
    "- Do not output the generic block 'AI JOKER-C2 non è solo una chat' unless the user explicitly asks about runtime architecture.",
    "- If the user asks about Manuel, answer about Manuel.",
    "- If the user asks for psychological description, give a non-clinical psychological profile. Do not diagnose.",
    "- If the user asks about philosophy, answer philosophically.",
    "- If the user asks about hash and memory, explain that a hash proves integrity but does not contain semantic memory.",
    "- If the user asks whether OPC is legal certification, answer clearly: no, LegalCertification is false.",
    "- If the user asks whether the runtime should proceed without proof/hash/verification, answer clearly: no, it must degrade or block fail-closed.",
    "- If the topic changes, do not inject old memory into the visible answer.",
    "- Use EVT/IPR memory as context, not as text to copy.",
    `- Memory used: ${input.memoryUsed ? "true" : "false"}.`,
    `- Memory source: ${input.memorySource}.`
  ].join("\n");
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
  engine: OpenAIEngineConfig;
}): Promise<GeneratedResponse> {
  if (!openai) {
    return postProcessGeneratedResponse({
      message: input.message,
      generated: {
        text: applyResponseContract(input.message, buildFallback(input)),
        state: "DEGRADED",
        degradedReason: "OPENAI_API_KEY_NOT_CONFIGURED"
      },
      memoryText: input.memoryText
    });
  }

  const prompt = buildSystemPrompt(input);
  const antiParrotDirective = buildAntiParrotDirective({
    message: input.message,
    memoryUsed: input.memoryUsed,
    memorySource: input.memorySource
  });

  try {
    const response = await openai.chat.completions.create({
      model: input.engine.modelUsed,
      messages: [
        {
          role: "system",
          content: [
            "Sei AI JOKER-C2.",
            "Rispondi in italiano salvo richiesta esplicita diversa.",
            "Rispondi in modo naturale, intelligente, operativo e non meccanico.",
            "Non usare tabelle salvo richiesta esplicita.",
            "Non mostrare i metadati runtime all'utente salvo richiesta diagnostica.",
            "OpenAI è il motore cognitivo; HBCE/JOKER-C2 è il runtime governato.",
            "IPR identifica. EVT traccia. Memory preserva continuità. OPC produce proof receipt. MATRIX organizza. HBCE governa.",
            "OPC è una proof receipt tecnica per audit e verifica, non una certificazione legale automatica.",
            "Nel voto digitale federato non collegare mai identità personale e contenuto della scelta democratica.",
            `Regola U.S.E. obbligatoria: ${USE_DEMOCRATIC_BOUNDARY}`,
            `Boundary AI governance: ${HBCE_AI_BOUNDARY}`,
            `Provider motore cognitivo: ${input.engine.provider}.`,
            `API mode motore cognitivo: ${input.engine.apiMode}.`,
            `Modello OpenAI effettivo: ${input.engine.modelUsed}.`,
            `Modalità motore: ${input.engine.mode}.`,
            `Checkpoint runtime: ${input.identity.evt}.`,
            `Modulo HBCE classificato: ${input.governanceFrame.hbceModule.module}.`,
            `Moduli HBCE attivi: ${input.governanceFrame.hbceModule.activeModules.join(", ")}.`,
            antiParrotDirective
          ].join("\n")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: MAX_COMPLETION_TOKENS
    });

    const text = extractResponseText(response);

    if (!text) {
      return postProcessGeneratedResponse({
        message: input.message,
        generated: {
          text: applyResponseContract(input.message, buildFallback(input)),
          state: "DEGRADED",
          degradedReason: "OPENAI_EMPTY_RESPONSE"
        },
        memoryText: input.memoryText
      });
    }

    return postProcessGeneratedResponse({
      message: input.message,
      generated: {
        text: applyResponseContract(input.message, text),
        state: "OPERATIONAL",
        degradedReason: null
      },
      memoryText: input.memoryText
    });
  } catch (error) {
    return postProcessGeneratedResponse({
      message: input.message,
      generated: {
        text: applyResponseContract(input.message, buildFallback(input)),
        state: "DEGRADED",
        degradedReason:
          error instanceof Error ? error.message : "OPENAI_REQUEST_FAILED"
      },
      memoryText: input.memoryText
    });
  }
}

function looksLikeGenericRuntimeLoop(text: string): boolean {
  const normalized = normalizeRuntimeText(text);

  return (
    normalized.includes("ai joker-c2 non e solo una chat") ||
    normalized.includes("il punto tecnico centrale e questo") ||
    normalized.includes("la riparazione corretta consiste") ||
    normalized.includes("formula nocciolo: ai joker-c2")
  );
}

function shouldReplaceGenericLoop(message: string, text: string): boolean {
  if (!looksLikeGenericRuntimeLoop(text)) {
    return false;
  }

  const current = normalizeRuntimeText(message);

  const userAskedRuntimeArchitecture = runtimeTextIncludesAny(current, [
    "runtime",
    "architettura",
    "diagnostica",
    "motore cognitivo",
    "joker-c2 come runtime",
    "cosa cambia da gpt",
    "openai come motore",
    "enginehash",
    "opcchainhash"
  ]);

  return !userAskedRuntimeArchitecture;
}

function postProcessGeneratedResponse(input: {
  message: string;
  generated: GeneratedResponse;
  memoryText: string;
}): GeneratedResponse {
  if (!shouldReplaceGenericLoop(input.message, input.generated.text)) {
    return input.generated;
  }

  const targeted = buildTargetedSafeAnswer({
    message: input.message,
    memoryText: input.memoryText
  });

  if (!targeted) {
    return input.generated;
  }

  return {
    ...input.generated,
    text: targeted
  };
}

function buildTargetedSafeAnswer(input: {
  message: string;
  memoryText: string;
}): string | null {
  if (isManuelPsychologicalQuestion(input.message)) {
    return [
      "Manuel può essere descritto, senza fare diagnosi cliniche, come una personalità ad alta intensità progettuale.",
      "",
      "Il tratto dominante è la trasformazione: prende esperienze, fratture, intuizioni e tensioni personali e prova a convertirle in struttura, linguaggio, codice, documento e sistema. Non ragiona solo per idee isolate: tende a costruire architetture, mappe, sigilli, sequenze, date, eventi e prove.",
      "",
      "Psicologicamente appare orientato alla continuità: non gli basta pensare una cosa, vuole fissarla, tracciarla, renderla verificabile. Questo spiega il ruolo di IPR, EVT, OPC e MATRIX nel suo lavoro. Sono strumenti tecnici, ma anche forme mentali: identità, evento, prova, responsabilità e tempo.",
      "",
      "Il rischio di questo profilo è l’eccesso di accumulo: quando tutto diventa struttura, il sistema può diventare pesante. La forza, però, è rara: Manuel non si limita a immaginare un progetto, prova a trasformarlo in infrastruttura operativa."
    ].join("\n");
  }

  if (isManuelPhilosophyQuestion(input.message)) {
    return [
      "La filosofia di Manuel ruota intorno a una sequenza precisa: decisione, costo, traccia e tempo.",
      "",
      "La decisione è il punto in cui un’idea smette di restare astratta. Il costo è ciò che quella decisione impone: energia, rischio, esposizione, perdita, responsabilità. La traccia è ciò che resta e rende l’evento verificabile. Il tempo è il campo in cui quella scelta viene giudicata, confermata, deformata o superata.",
      "",
      "Dentro HBCE, questa filosofia diventa architettura: IPR identifica il soggetto operativo, EVT registra l’evento, Memory conserva continuità, OPC produce una proof receipt, MATRIX organizza il sistema e HBCE governa il processo.",
      "",
      "Il passaggio filosofico è questo: per Manuel la realtà non è solo da interpretare. Va resa leggibile come sequenza verificabile."
    ].join("\n");
  }

  if (isPhilosophicalDecisionQuestion(input.message)) {
    return [
      "Il passaggio logico tra Manuel e la filosofia è la decisione.",
      "",
      "Prima Manuel viene definito come origine progettuale: il soggetto biologico che avvia, ordina e valida il sistema. Poi il discorso si sposta sulla filosofia: non una filosofia astratta da biblioteca polverosa, ma una filosofia operativa.",
      "",
      "Il ponte è questo: una persona diventa origine progettuale quando prende una visione e la trasforma in decisione. La decisione genera costo, il costo produce traccia, la traccia attraversa il tempo. Da qui nasce la logica HBCE: identità, evento, prova, continuità.",
      "",
      "Quindi Manuel non entra nella filosofia come personaggio da celebrare, ma come esempio di passaggio: dal vissuto alla decisione, dalla decisione alla struttura, dalla struttura alla traccia."
    ].join("\n");
  }

  if (isHashMemoryQuestion(input.message)) {
    return [
      "La differenza è semplice e fondamentale.",
      "",
      "L’hash precedente non è la memoria precedente. L’hash è un’impronta crittografica: serve a provare che un contenuto, un evento o una proof receipt non sono stati alterati. Però l’hash non contiene il contenuto. Da solo non sa raccontare cosa è stato detto, deciso o ragionato.",
      "",
      "La memoria precedente è il contenuto semantico recuperabile: sintesi, contesto, passaggio logico, decisione, evento, riferimento, prossima direzione.",
      "",
      "Nel sistema JOKER-C2, EVT-MEM registra l’evento memoria, memoryHash prova l’integrità della memoria, engineHash lega il motore cognitivo usato, opcChainHash collega la proof receipt alla catena OPC.",
      "",
      "Formula corretta: hash prova; memoria ricorda; EVT traccia; OPC collega e rende auditabile."
    ].join("\n");
  }

  if (isOpcLegalCertificationQuestion(input.message)) {
    return [
      "No.",
      "",
      "OPC non è una certificazione legale ufficiale e non è una validazione istituzionale pubblica.",
      "",
      "OPC è una proof receipt tecnica: collega identità operativa, evento, memoria, hash, modello usato, runtime state, audit status e verification status. Serve per continuità, verifica tecnica e auditabilità.",
      "",
      "Il suo boundary è chiaro: LegalCertification: false. Non sostituisce eIDAS, un prestatore fiduciario qualificato, una pubblica autorità, un certificato legale ufficiale o una validazione istituzionale."
    ].join("\n");
  }

  if (isFailClosedExplanationQuestion(input.message)) {
    return [
      "No, il runtime non deve procedere comunque.",
      "",
      "Se manca una prova, un hash, una verifica o una continuità minima, JOKER-C2 deve degradare o bloccare in modo fail-closed. La regola è brutale ma sana: niente prova, niente operazione fidata.",
      "",
      "Può ancora produrre supporto esplicativo o materiale non operativo, ma non deve presentare l’output come verificato, auditabile o pronto per uso affidabile.",
      "",
      "Formula: missing proof → degraded state; missing verification → no trusted operation; unsafe linkage → block."
    ].join("\n");
  }

  if (isMainJobQuestion(input.message)) {
    return [
      "Il mio lavoro principale è trasformare conversazione, documenti, codice e decisioni in un processo governato e verificabile.",
      "",
      "Come AI JOKER-C2 devo fare quattro cose: capire la domanda attuale, usare la memoria solo quando serve, produrre una risposta utile e lasciare una traccia tecnica tramite IPR, EVT, Memory e OPC.",
      "",
      "Quando lavoro bene, non ripeto il passato: collego il passato alla domanda nuova. Quando lavoro male, divento un pappagallo con dashboard, cioè una tragedia informatica con le icone belle."
    ].join("\n");
  }

  if (isParrotQuestion(input.message)) {
    return [
      "No: il comportamento corretto non è ripetere, ma ragionare sulla conversazione.",
      "",
      "Se ripeto la stessa risposta, significa che il runtime sta iniettando memoria non pertinente, usando un fallback troppo invasivo o classificando male la domanda corrente.",
      "",
      "La regola corretta è questa: domanda nuova, risposta nuova; domanda collegata, memoria pertinente; domanda diagnostica, metadati tecnici; cambio tema, niente fotocopia.",
      "",
      "Quindi devo ragionare in base alla conversazione, non fare il pappagallo con una laurea in compliance."
    ].join("\n");
  }

  if (isMemoryRecallWithOriginalDeductionQuestion(input.message)) {
    return [
      "Della discussione ricordo questo, senza inventare altro: abbiamo parlato di Manuel come origine biologica e progettuale di HBCE / AI JOKER-C2; poi hai chiesto una lettura psicologica; poi il tema si è spostato sulla sua filosofia, sulla decisione, sulla differenza tra memoria e hash, e sulla capacità del runtime di non ripetere ma ragionare.",
      "",
      "La deduzione nuova è questa: la guerra sulla civiltà umana oggi non è soltanto militare o territoriale. È una guerra sulla continuità del significato. Le società combattono anche per decidere cosa resta vero, cosa resta sacro, cosa resta umano e cosa viene ridotto a procedura, consumo o propaganda.",
      "",
      "La religione, in questo quadro, non scompare solo perché qualcuno smette di credere. Entra in crisi quando non riesce più a reggere il rapporto tra dolore, verità, responsabilità e futuro. L’apostasia globale, letta in chiave APOKALYPSIS, non è soltanto abbandono della fede: è disconnessione tra simbolo e comportamento, tra parola e costo, tra rito e responsabilità reale.",
      "",
      "Il punto originale è questo: una civiltà non crolla quando perde tutte le risposte. Crolla prima, quando conserva le parole sacre ma non paga più il costo delle decisioni che quelle parole richiedono."
    ].join("\n");
  }

  return null;
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
  engine: OpenAIEngineConfig;
  degradedReason?: string | null;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Diagnostica runtime OpenAI",
    "",
    `Runtime OpenAI: ${input.state}`,
    `RuntimeRole: ${input.engine.runtimeRole}`,
    `LegacyRuntimeRole: IPR_RUNTIME_DEMONSTRATOR`,
    `CognitiveEngineProvider: ${input.engine.provider}`,
    `CognitiveEngineRole: ${input.engine.role}`,
    `EngineApiMode: ${input.engine.apiMode}`,
    `EngineMode: ${input.engine.mode}`,
    `Model: ${input.engine.modelUsed}`,
    `StandardModel: ${input.engine.standardModel}`,
    `DeepModel: ${input.engine.deepModel}`,
    `OpenAIConfigured: ${input.engine.configured ? "true" : "false"}`,
    `ProjectBirthDate: ${input.engine.projectBirthDate}`,
    `ProjectBirthLabel: ${input.engine.projectBirthLabel}`,
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
    `- role: ${input.engine.runtimeRole}`,
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
  opcEngineHash?: string | null;
  governance: EnrichedGovernanceFrame;
  engine: OpenAIEngineConfig;
  degradedReason?: string | null;
}) {
  const identity = getPrimaryIdentity();

  return [
    input.response,
    "",
    "Runtime:",
    `- state: ${input.state}`,
    `- runtimeRole: ${input.engine.runtimeRole}`,
    `- legacyRuntimeRole: IPR_RUNTIME_DEMONSTRATOR`,
    `- cognitiveEngineProvider: ${input.engine.provider}`,
    `- cognitiveEngineRole: ${input.engine.role}`,
    `- engineApiMode: ${input.engine.apiMode}`,
    `- engineMode: ${input.engine.mode}`,
    `- modelUsed: ${input.engine.modelUsed}`,
    `- standardModel: ${input.engine.standardModel}`,
    `- deepModel: ${input.engine.deepModel}`,
    `- openaiConfigured: ${input.engine.configured ? "true" : "false"}`,
    `- projectBirthDate: ${input.engine.projectBirthDate}`,
    `- projectBirthLabel: ${input.engine.projectBirthLabel}`,
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
    `- opcEngineHash: ${input.opcEngineHash || "none"}`,
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
  continuityRef?: string | null;
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

  if (input.continuityRef) {
    const continuityEvent = await getEvtMemoryEventById(input.continuityRef);

    if (continuityEvent) {
      return {
        used: true,
        source: "LEDGER_CONTINUITY_REF",
        text: buildContinuityReferenceMemoryText({
          continuityRef: input.continuityRef,
          event: continuityEvent
        }),
        semanticState: {
          documentFamily: continuityEvent.documentFamily,
          projectDomain: continuityEvent.projectDomain,
          activeDomains: continuityEvent.activeDomains
        },
        lastEventId: continuityEvent.evt
      };
    }

    return {
      used: true,
      source: "CONTINUITY_REF",
      text: buildContinuityReferenceMemoryText({
        continuityRef: input.continuityRef
      }),
      semanticState: {
        documentFamily: "HBCE_RUNTIME",
        projectDomain: "MATRIX",
        activeDomains: ["MATRIX"]
      },
      lastEventId: input.continuityRef
    };
  }

  return {
    used: false,
    source: "NONE",
    text: [hotMemory.text, "", ledgerMemory.text].join("\n").trim(),
    semanticState: null,
    lastEventId: null
  };
}

function mapOpcRuntimeState(state: MemoryRuntimeState
