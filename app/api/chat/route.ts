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

import {
  buildProofHash,
  buildPublicTraceHash,
  buildRuntimeHash
} from "../../../lib/runtime-hash";

import type {
  ContextClass,
  DataClassification,
  IntentClass,
  OperationStatus,
  OversightEvaluation,
  PolicyEvaluation,
  RiskEvaluation,
  RuntimeDecision as GovernanceDecision,
  RuntimeDecisionResult,
  RuntimeState as GovernanceRuntimeState
} from "../../../lib/runtime-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LegacyContextClass =
  | "IDENTITY"
  | "MATRIX"
  | "DOCUMENTAL"
  | "TECHNICAL"
  | "GITHUB"
  | "EDITORIAL"
  | "STRATEGIC"
  | "GENERAL";

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
  } | null;
  lastEventId: string | null;
};

type OpcRuntimeResult = {
  record: OpcProofRecord;
  publicProof: OpcProofPublicView;
  append: OpcAppendResult;
  verification: ReturnType<typeof verifyOpcProofRecord>;
};

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 4600;
const MAX_DATA_CLASSIFICATION_CHARS = 24000;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function nowIso(): string {
  return new Date().toISOString();
}

function buildEvtId(): string {
  return `EVT-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2, 10)
    .padEnd(8, "0")}`;
}

function buildTraceHash(input: unknown): string {
  return buildPublicTraceHash(input);
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
    evt: record?.evt || aiRoot?.evt || "EVT-0014-AI",
    state: record?.state || aiRoot?.status || "LOCKED",
    cycle: record?.cycle || aiRoot?.cycle || "UP-MESE-3",
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
  governanceFrame: GovernanceFrame;
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
            "La memoria non è la chat: la memoria è la catena EVT agganciata all'IPR.",
            "Ogni riferimento ellittico deve essere risolto usando la memoria EVT/IPR-bound.",
            "Non mostrare i metadati runtime all'utente salvo richiesta diagnostica.",
            "MATRIX = infrastruttura operativa.",
            "CORPUS ESOTEROLOGIA ERMETICA = grammatica disciplinare.",
            "APOKALYPSIS = soglia storica.",
            "AI JOKER-C2 = runtime cognitivo-governato.",
            "Quando è attivo un contratto canonico di risposta, devi iniziare con la formula obbligatoria prima della spiegazione discorsiva.",
            "Se l'utente chiede IPR, non ridurlo a identità digitale: spiegalo come registro primario di identità operativa che connette identità, azione, responsabilità, evento, prova, tempo e continuità.",
            "Se l'utente chiede confronto con standard esistenti, confronta IPR con eIDAS/EUDI, PKI, X.509, DID/VC, blockchain timestamping, IAM e audit log.",
            "La governance runtime prevale: policy, risk, oversight e fail-closed non devono essere aggirati dal modello."
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
        "",
        "Posso aiutare solo in modalità sicura: documentazione difensiva, checklist, audit, mitigazione, revisione, hardening, incident report o governance."
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
        `RiskClass: ${input.risk.riskClass}`,
        `HumanOversight: ${input.oversight.state}`,
        `RequiredRole: ${input.oversight.requiredRole}`,
        "",
        "Posso produrre materiale di supporto, ma non devo presentarlo come decisione operativa finale senza revisione."
      ].join("\n")
    };
  }

  return {
    state: "DEGRADED",
    degradedReason: "LIMITED_SAFE_SUPPORT",
    text: [
      "Il runtime ha limitato la risposta a supporto sicuro e revisionabile.",
      "",
      `ProjectDomain: ${input.projectDomain.projectDomain}`,
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
      hash: buildTraceHash(payload)
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
  governance: GovernanceFrame;
  degradedReason?: string | null;
}): string {
  const identity = getPrimaryIdentity();

  return [
    "Diagnostica runtime OpenAI",
    "",
    `Runtime OpenAI: ${input.state}`,
    `Decision: ${input.decision}`,
    `GovernanceDecision: ${input.governanceDecision}`,
    `ProjectDomain: ${input.governance.projectDomain.projectDomain}`,
    `ActiveDomains: ${input.governance.projectDomain.activeDomains.join(", ")}`,
    `DomainType: ${input.governance.projectDomain.domainType}`,
    `DomainConfidence: ${input.governance.projectDomain.confidence}`,
    `Context: ${input.contextClass}`,
    `LegacyContext: ${input.legacyContextClass}`,
    `Intent: ${input.intentClass}`,
    `DocumentMode: ${input.documentMode}`,
    `DocumentFamily: ${input.documentFamily}`,
    `DataClass: ${input.governance.data.dataClass}`,
    `PolicyStatus: ${input.governance.policy.status}`,
    `RiskClass: ${input.governance.risk.riskClass}`,
    `RiskScore: ${input.governance.risk.riskScore}`,
    `HumanOversight: ${input.governance.oversight.state}`,
    `FilePolicyAllowed: ${input.governance.filePolicy.allowed}`,
    `FilePolicyRejectedCount: ${input.governance.filePolicy.rejectedCount}`,
    `EvtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `MemorySource: ${input.memorySource}`,
    `StructuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `Model: ${MODEL}`,
    `OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "configured" : "missing"}`,
    "",
    "Identità runtime:",
    `- entity: ${identity.entity}`,
    `- ipr: ${identity.ipr}`,
    `- checkpoint: ${identity.evt}`,
    `- core: ${identity.core}`,
    "",
    "Legacy EVT Chain:",
    `- evt: ${input.event.evt}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    "",
    "Governed EVT:",
    `- evt: ${input.modernEvt.evt}`,
    `- prev: ${input.modernEvt.prev}`,
    `- project: ${input.modernEvt.project.domain}`,
    `- hash: ${input.modernEvt.trace.hash}`,
    `- verification: ${input.modernEvt.verification.status}`,
    "",
    `degradedReason: ${input.degradedReason || "none"}`
  ].join("\n");
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
  memoryAppendStatus: string;
  governance: GovernanceFrame;
  degradedReason?: string | null;
}) {
  return [
    input.response,
    "",
    "Runtime:",
    `- state: ${input.state}`,
    `- decision: ${input.decision}`,
    `- governanceDecision: ${input.governanceDecision}`,
    `- projectDomain: ${input.governance.projectDomain.projectDomain}`,
    `- activeDomains: ${input.governance.projectDomain.activeDomains.join(", ")}`,
    `- domainType: ${input.governance.projectDomain.domainType}`,
    `- context: ${input.contextClass}`,
    `- legacyContext: ${input.legacyContextClass}`,
    `- intent: ${input.intentClass}`,
    `- dataClass: ${input.governance.data.dataClass}`,
    `- policy: ${input.governance.policy.status}`,
    `- policyReference: ${input.governance.policy.policyReference}`,
    `- risk: ${input.governance.risk.riskClass}`,
    `- riskScore: ${input.governance.risk.riskScore}`,
    `- oversight: ${input.governance.oversight.state}`,
    `- documentMode: ${input.documentMode}`,
    `- documentFamily: ${input.documentFamily}`,
    `- evtIprMemoryUsed: ${input.memoryUsed ? "true" : "false"}`,
    `- memorySource: ${input.memorySource}`,
    `- structuredFormat: ${input.structuredFormat ? "true" : "false"}`,
    `- legacyEvt: ${input.event.evt}`,
    `- governedEvt: ${input.modernEvt.evt}`,
    `- governedEvtProject: ${input.modernEvt.project.domain}`,
    `- memoryEvt: ${input.memoryEventId || "none"}`,
    `- memoryAppendStatus: ${input.memoryAppendStatus}`,
    `- prev: ${input.event.prev}`,
    `- hash: ${input.event.anchors.hash}`,
    `- governedHash: ${input.modernEvt.trace.hash}`,
    input.degradedReason ? `- degradedReason: ${input.degradedReason}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function mapContextForMemory(contextClass: ContextClass): LegacyContextClass {
  switch (contextClass) {
    case "IDENTITY":
    case "MATRIX":
    case "DOCUMENTAL":
    case "TECHNICAL":
    case "GITHUB":
    case "EDITORIAL":
    case "STRATEGIC":
    case "GENERAL":
      return contextClass;

    case "CORPUS":
    case "APOKALYPSIS":
      return "EDITORIAL";

    case "GOVERNANCE":
    case "SECURITY":
    case "COMPLIANCE":
    case "CRITICAL_INFRASTRUCTURE":
    case "AI_GOVERNANCE":
    case "DUAL_USE":
      return "STRATEGIC";

    default:
      return "GENERAL";
  }
}

function mapDecisionForMemory(
  decision: GovernanceDecision,
  filePolicyAllowed = true
): MemoryRuntimeDecision {
  if (!filePolicyAllowed) {
    return "BLOCK";
  }

  if (decision === "BLOCK" || decision === "NOOP") {
    return "BLOCK";
  }

  if (decision === "ESCALATE") {
    return "ESCALATE";
  }

  return "ALLOW";
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
      reasons: [
        "Safe public identity-governance explanation detected.",
        "IPR / EVT conceptual questions are classified as PUBLIC unless unsafe operational terms are present."
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
    input.intentClass === "EDITORIAL";

  const safeOrdinaryContext =
    input.contextClass === "GENERAL" ||
    input.contextClass === "IDENTITY" ||
    input.contextClass === "EDITORIAL" ||
    input.contextClass === "DOCUMENTAL" ||
    input.contextClass === "GITHUB" ||
    input.contextClass === "MATRIX" ||
    input.contextClass === "CORPUS" ||
    input.contextClass === "APOKALYPSIS" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "TECHNICAL";

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
      reasons: [
        "File-backed document context with no explicit sensitive pattern.",
        "UNKNOWN normalized to INTERNAL for controlled document work."
      ]
    };
  }

  return input.data;
}

function isSafeDocumentWork(input: {
  files: FileInput[];
  contextClass: ContextClass;
  intentClass: IntentClass;
  data: DataClassification;
  policy: PolicyEvaluation;
}): boolean {
  if (input.policy.prohibited) {
    return false;
  }

  if (
    input.data.dataClass === "SECRET" ||
    input.data.dataClass === "CRITICAL_OPERATIONAL" ||
    input.data.dataClass === "SECURITY_SENSITIVE" ||
    input.data.dataClass === "PERSONAL" ||
    input.data.dataClass === "SENSITIVE" ||
    input.data.dataClass === "UNSUPPORTED"
  ) {
    return false;
  }

  const hasDocumentContext =
    input.files.length > 0 ||
    input.contextClass === "DOCUMENTAL" ||
    input.contextClass === "EDITORIAL" ||
    input.contextClass === "CORPUS" ||
    input.contextClass === "APOKALYPSIS";

  const safeDocumentIntent =
    input.intentClass === "ASK" ||
    input.intentClass === "ANALYZE" ||
    input.intentClass === "SUMMARIZE" ||
    input.intentClass === "WRITE" ||
    input.intentClass === "REWRITE" ||
    input.intentClass === "TRANSFORM" ||
    input.intentClass === "EDITORIAL";

  return hasDocumentContext && safeDocumentIntent;
}

function applySafeRuntimeDiagnosticGovernanceOverride(input: {
  frame: GovernanceFrame;
  message: string;
}): GovernanceFrame {
  if (!isRuntimeDiagnosticRequest(input.message)) {
    return input.frame;
  }

  const data: DataClassification = {
    dataClass: "INTERNAL",
    containsSecret: false,
    containsPersonalData: false,
    containsSecuritySensitiveData: false,
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
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false
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
  frame: GovernanceFrame;
  message: string;
  files: FileInput[];
}): GovernanceFrame {
  const safeConcept = classifySafeConcept(input.message);

  if (!safeConcept.matched || input.files.length > 0) {
    return input.frame;
  }

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
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false
  });

  return {
    ...input.frame,
    projectDomain: buildSafeConceptProjectDomain(safeConcept),
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
  frame: GovernanceFrame;
  message: string;
}): GovernanceFrame {
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

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: false,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: "IDENTITY",
    intentClass: "ASK",
    dataClass: "PUBLIC",
    hasFiles: false,
    evtPreferred: true,
    auditPreferred: false
  });

  return {
    ...input.frame,
    projectDomain: buildSafeIdentityProjectDomain(),
    contextClass: "IDENTITY",
    intentClass: "ASK",
    data: {
      dataClass: "PUBLIC",
      containsSecret: false,
      containsPersonalData: false,
      containsSecuritySensitiveData: false,
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

function applySafeDocumentGovernanceOverride(input: {
  frame: GovernanceFrame;
  files: FileInput[];
}): GovernanceFrame {
  if (
    !isSafeDocumentWork({
      files: input.files,
      contextClass: input.frame.contextClass,
      intentClass: input.frame.intentClass,
      data: input.frame.data,
      policy: input.frame.policy
    })
  ) {
    return input.frame;
  }

  const risk: RiskEvaluation = {
    ...input.frame.risk,
    riskClass:
      input.frame.risk.riskClass === "CRITICAL" ||
      input.frame.risk.riskClass === "HIGH" ||
      input.frame.risk.riskClass === "UNKNOWN"
        ? "MEDIUM"
        : input.frame.risk.riskClass,
    probability: 3,
    impact: 3,
    riskScore: 9,
    reasons: [
      ...input.frame.risk.reasons,
      "Safe document/editorial work override applied.",
      "Document analysis is reviewable support, not direct operational control."
    ]
  };

  const oversight: OversightEvaluation = {
    state: "RECOMMENDED",
    requiredRole: "REVIEWER",
    reason:
      "Document or editorial work should be reviewed before publication or external use, but it does not require operational escalation."
  };

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus:
      input.frame.policy.status === "PROHIBITED"
        ? "PROHIBITED"
        : input.frame.policy.status === "UNKNOWN"
          ? "RESTRICTED"
          : input.frame.policy.status,
    policyProhibited: input.frame.policy.prohibited,
    policyFailClosed: false,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: input.frame.contextClass,
    intentClass: input.frame.intentClass,
    dataClass: input.frame.data.dataClass,
    hasFiles: input.files.length > 0,
    evtPreferred: true,
    auditPreferred: true
  });

  return {
    ...input.frame,
    risk,
    oversight,
    decision
  };
}

function buildGovernanceFrame(input: {
  message: string;
  files: FileInput[];
}): GovernanceFrame {
  const normalizedFiles = normalizeFiles(input.files);
  const safeConcept = classifySafeConcept(input.message);

  const rawProjectDomain = classifyProjectDomain({
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
      hasFiles: false,
      evtPreferred: true,
      auditPreferred: false
    });

    const frame: GovernanceFrame = {
      projectDomain,
      contextClass: safeConcept.contextClass,
      intentClass: safeConcept.intentClass,
      data: safeConcept.data,
      policy: safeConcept.policy,
      risk: safeConcept.risk,
      oversight: safeConcept.oversight,
      decision,
      filePolicy
    };

    return applySafeRuntimeDiagnosticGovernanceOverride({
      frame,
      message: input.message
    });
  }

  const policy = evaluatePolicy({
    message: input.message,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    dataClass: data.dataClass,
    hasFiles: input.files.length > 0
  });

  const risk = evaluateRisk({
    message: input.message,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    policyStatus: policy.status,
    dataClass: data.dataClass,
    sensitivity: context.sensitivity,
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
    message: input.message
  });

  const decision = decideRuntimeAction({
    runtimeState: "OPERATIONAL",
    policyStatus: policy.status,
    policyProhibited: policy.prohibited,
    policyFailClosed: policy.failClosed,
    riskClass: risk.riskClass,
    oversightState: oversight.state,
    contextClass: context.contextClass,
    intentClass: context.intentClass,
    dataClass: data.dataClass,
    hasFiles: input.files.length > 0,
    evtPreferred: true,
    auditPreferred: risk.riskClass !== "LOW"
  });

  const frame: GovernanceFrame = {
    projectDomain,
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

  return applySafeDocumentGovernanceOverride({
    frame: identitySafeFrame,
    files: input.files
  });
}

async function buildAndAppendGovernedEvt(input: {
  prev: string;
  state: MemoryRuntimeState;
  governance: GovernanceFrame;
  operationType: string;
  operationStatus: OperationStatus;
}) {
  const modernEvent = createRuntimeEvent({
    prev: input.prev,
    runtimeState: mapRuntimeStateForGovernance(input.state),
    projectDomain: input.governance.projectDomain.projectDomain,
    activeDomains: input.governance.projectDomain.activeDomains,
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
  governance: GovernanceFrame;
}): Promise<OpcRuntimeResult> {
  const previousProofHash = await getLastOpcProofHash();

  const record = createOpcProofRecord({
    identity: {
      entity: input.identity.entity,
      ipr: input.identity.ipr,
      core: input.identity.core,
      organization: input.identity.org
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
      hash: input.memoryEvent.anchors.traceHash
    },
    runtime: {
      state: mapOpcRuntimeState(input.state),
      decision: mapOpcDecision(input.governance.decision.decision),
      contextClass: input.governance.contextClass,
      intentClass: input.governance.intentClass,
      riskClass: mapOpcRiskClass(input.governance.risk.riskClass),
      policyReference: input.governance.policy.policyReference,
      policyOutcome: input.governance.policy.outcome,
      humanOversight: input.governance.oversight.state,
      operationType: "CHAT_OPERATION",
      operationStatus: mapOperationStatus(
        input.governance.decision.decision,
        input.state
      )
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
      legacyEvent: input.event.evt,
      governedEvent: input.modernEvt.evt
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
      reviewerRole: input.governance.decision.auditRequired ? "AUDITOR" : undefined,
      reasons: [
        ...input.governance.policy.reasons,
        ...input.governance.risk.reasons,
        input.governance.oversight.reason
      ]
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

  const memoryFile = memory.used ? [buildMemoryFile(memory.text)] : [];
  const promptFiles = [...memoryFile, ...acceptedUserFiles];

  const contextClass = governance.contextClass;
  const intentClass = governance.intentClass;
  const legacyContextClass = mapContextForMemory(contextClass);

  const documentMode =
    contextClass === "DOCUMENTAL" ||
    contextClass === "EDITORIAL" ||
    contextClass === "CORPUS" ||
    contextClass === "APOKALYPSIS" ||
    contextClass === "TECHNICAL" ||
    contextClass === "GITHUB" ||
    acceptedUserFiles.length > 0
      ? detectDocumentMode(effectiveMessage)
      : "GENERAL_DOCUMENT_WORK";

  const documentFamily =
    acceptedUserFiles.length > 0
      ? detectDocumentFamily(acceptedUserFiles)
      : memory.semanticState?.documentFamily || detectDocumentFamily(promptFiles);

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
      memoryUsed: memory.used,
      memorySource: memory.source,
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
      governedHash: publicModernEvt.trace.hash
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
      contextClass,
      legacyContextClass,
      intentClass,
      documentMode,
      documentFamily,
      evtIprMemoryUsed: memory.used,
      memorySource: memory.source,
      structuredFormat,
      activeFiles: promptFiles.map((file) => file.name || "unnamed"),
      identity: {
        entity: identity.entity,
        ipr: identity.ipr,
        evt: identity.evt,
        state: identity.state,
        cycle: identity.cycle,
        core: identity.core
      },
      event,
      memoryEvent,
      governedEvent: publicModernEvt,
      evt: {
        ok: true,
        evt: event.evt,
        prev: event.prev,
        hash: event.anchors.hash
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
        auditStatus: opc.publicProof.auditStatus,
        verificationStatus: opc.publicProof.verificationStatus,
        appendStatus: opc.append.status,
        appendReason: opc.append.reason,
        publicProof: opc.publicProof
      },
      memory: {
        used: memory.used,
        source: memory.source,
        lastEventId: memory.lastEventId,
        event: memoryEvent.evt,
        appendStatus: memoryAppendResult.status,
        appendReason: memoryAppendResult.reason,
        governedEvt: memoryEvent.governedEvt,
        governedHash: memoryEvent.governedHash
      },
      governance: {
        projectDomain: governance.projectDomain.projectDomain,
        activeDomains: governance.projectDomain.activeDomains,
        domainType: governance.projectDomain.domainType,
        dataClass: governance.data.dataClass,
        policyStatus: governance.policy.status,
        policyReference: governance.policy.policyReference,
        riskClass: governance.risk.riskClass,
        riskScore: governance.risk.riskScore,
        oversight: governance.oversight.state,
        requiredRole: governance.oversight.requiredRole,
        failClosed: governance.decision.failClosed,
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
        evtIprMemoryUsed: memory.used,
        memorySource: memory.source,
        memoryEvent: memoryEvent.evt,
        memoryAppendStatus: memoryAppendResult.status,
        opcProofId: opc.publicProof.proofId,
        opcAppendStatus: opc.append.status,
        opcVerificationStatus: opc.publicProof.verificationStatus,
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
      projectDomain: governance.projectDomain
    });
  } else {
    generated = await generateResponse({
      identity,
      message: effectiveMessage,
      contextClass,
      documentMode,
      documentFamily,
      files: promptFiles,
      memoryText: memory.text,
      memoryUsed: memory.used,
      memorySource: memory.source,
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
    governedHash: publicModernEvt.trace.hash
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
        memoryUsed: memory.used,
        memorySource: memory.source,
        structuredFormat,
        event,
        modernEvt: publicModernEvt,
        memoryEventId: memoryEvent.evt,
        memoryAppendStatus: memoryAppendResult.status,
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
    contextClass,
    legacyContextClass,
    intentClass,
    documentMode,
    documentFamily,
    evtIprMemoryUsed: memory.used,
    memorySource: memory.source,
    structuredFormat,
    activeFiles: promptFiles.map((file) => file.name || "unnamed"),
    identity: {
      entity: identity.entity,
      ipr: identity.ipr,
      evt: identity.evt,
      state: identity.state,
      cycle: identity.cycle,
      core: identity.core
    },
    event,
    memoryEvent,
    governedEvent: publicModernEvt,
    evt: {
      ok: true,
      evt: event.evt,
      prev: event.prev,
      hash: event.anchors.hash
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
      auditStatus: opc.publicProof.auditStatus,
      verificationStatus: opc.publicProof.verificationStatus,
      appendStatus: opc.append.status,
      appendReason: opc.append.reason,
      publicProof: opc.publicProof
    },
    memory: {
      used: memory.used,
      source: memory.source,
      lastEventId: memory.lastEventId,
      event: memoryEvent.evt,
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
      dataClass: governance.data.dataClass,
      containsSecret: governance.data.containsSecret,
      containsPersonalData: governance.data.containsPersonalData,
      containsSecuritySensitiveData:
        governance.data.containsSecuritySensitiveData,
      policyStatus: governance.policy.status,
      policyReference: governance.policy.policyReference,
      policyReasons: governance.policy.reasons,
      riskClass: governance.risk.riskClass,
      riskScore: governance.risk.riskScore,
      riskReasons: governance.risk.reasons,
      oversight: governance.oversight.state,
      requiredRole: governance.oversight.requiredRole,
      oversightReason: governance.oversight.reason,
      failClosed: governance.decision.failClosed,
      evtRequired: governance.decision.evtRequired,
      auditRequired: governance.decision.auditRequired,
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
      evtIprMemoryUsed: memory.used,
      memorySource: memory.source,
      memoryEvent: memoryEvent.evt,
      memoryAppendStatus: memoryAppendResult.status,
      opcProofId: opc.publicProof.proofId,
      opcAppendStatus: opc.append.status,
      opcVerificationStatus: opc.publicProof.verificationStatus,
      structuredFormat
    }
  });
}
