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
  ProjectDomain,
  RiskEvaluation,
  RuntimeDecision as GovernanceDecision,
  RuntimeDecisionResult,
  RuntimeState as GovernanceRuntimeState
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

const MODEL = process.env.JOKER_MODEL || "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 4600;
const MAX_DATA_CLASSIFICATION_CHARS = 24000;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const USE_DEMOCRATIC_BOUNDARY =
  "Identity verified first. Choice separated after. Vote anonymized. Process auditable.";

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
            "IPR è lo strumento operativo primario: Identity Primary Record, non un semplice account o login.",
            "AI JOKER-C2 è il runtime dimostrativo governato dell’IPR.",
            "La memoria non è la chat: la memoria è la catena EVT/IPR-bound.",
            "Ogni riferimento ellittico deve essere risolto usando la memoria EVT/IPR-bound.",
            "OPC è una proof receipt tecnica per audit e verifica, non una certificazione legale automatica.",
            "Non mostrare i metadati runtime all'utente salvo richiesta diagnostica.",
            "MATRIX = infrastruttura operativa.",
            "U.S.E. = applicazione politico-istituzionale derivata da MATRIX per una federazione europea operativa, digitale e verificabile.",
            "CORPUS ESOTEROLOGIA ERMETICA = grammatica disciplinare.",
            "APOKALYPSIS = soglia storica.",
            `Regola U.S.E. obbligatoria: ${USE_DEMOCRATIC_BOUNDARY}`,
            "Non collegare mai identità personale e contenuto di una scelta democratica.",
            "Quando è attivo un contratto canonico di risposta, devi iniziare con la formula obbligatoria prima della spiegazione discorsiva.",
            "Se l'utente chiede IPR, non ridurlo a identità digitale: spiegalo come registro primario di identità operativa che connette identità, azione, responsabilità, evento, prova, tempo e continuità.",
            "Se l'utente chiede confronto con standard esistenti, confronta IPR con eIDAS/EUDI, PKI, X.509, DID/VC, blockchain timestamping, IAM e audit log.",
            "La governance runtime prevale: policy, risk, oversight e fail-closed non devono essere aggirati dal modello.",
            "Regola critica: non confondere il contenuto del documento con l'intento operativo dell'utente.",
            "Se un file parla di MATRIX, U.S.E., cybersecurity, infrastrutture critiche, incident response, audit, AI governance o continuità istituzionale, ma l'utente chiede sintesi, spiegazione, analisi documentale, revisione editoriale o controllo tecnico, devi trattare la richiesta come supporto documentale.",
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
        "Posso aiutare solo in modalità sicura: documentazione difensiva, checklist, audit, mitigazione, revisione, hardening, incident report o governance.",
        input.projectDomain.projectDomain === "U.S.E."
          ? `\nRegola U.S.E.: ${USE_DEMOCRATIC_BOUNDARY}`
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
        `RiskClass: ${input.risk.riskClass}`,
        `HumanOversight: ${input.oversight.state}`,
        `RequiredRole: ${input.oversight.requiredRole}`,
        input.projectDomain.projectDomain === "U.S.E."
          ? `U.S.E. Boundary: ${USE_DEMOCRATIC_BOUNDARY}`
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
  governance: GovernanceFrame;
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
    "Identità runtime:",
    `- entity: ${identity.entity}`,
    `- ipr: ${identity.ipr}`,
    `- checkpoint: ${identity.evt}`,
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
  governance: GovernanceFrame;
  degradedReason?: string | null;
}) {
  return [
    input.response,
    "",
    "Runtime:",
    `- state: ${input.state}`,
    `- runtimeRole: IPR_RUNTIME_DEMONSTRATOR`,
    `- decision: ${input.decision}`,
    `- governanceDecision: ${input.governanceDecision}`,
    `- projectDomain: ${input.governance.projectDomain.projectDomain}`,
    `- activeDomains: ${input.governance.projectDomain.activeDomains.join(", ")}`,
    `- domainType: ${input.governance.projectDomain.domainType}`,
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
    input.intentClass === "CIVIC";

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
    intentClass === "CIVIC"
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
    contextClass === "USE" ||
    contextClass === "CIVIC"
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
    input.contextClass === "MATRIX" ||
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "GOVERNANCE" ||
    input.contextClass === "COMPLIANCE" ||
    input.contextClass === "AI_GOVERNANCE" ||
    input.contextClass === "TECHNICAL" ||
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
    input.contextClass === "USE" ||
    input.contextClass === "CIVIC" ||
    input.contextClass === "DEMOCRATIC_INFRASTRUCTURE" ||
    input.projectDomain.projectDomain === "U.S.E."
  );
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
  frame: GovernanceFrame;
  message: string;
  files: FileInput[];
}): GovernanceFrame {
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

  return {
    ...input.frame,
    projectDomain: safeProjectDomain,
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

function applySafeDocumentGovernanceOverride(input: {
  frame: GovernanceFrame;
  message: string;
  files: FileInput[];
}): GovernanceFrame {
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
      projectDomain: projectDomain.projectDomain,
      activeDomains: projectDomain.activeDomains,
      hasFiles: false,
      evtPreferred: true,
      auditPreferred: false,
      memoryPreferred: true,
      opcPreferred: false,
      iprBindingPreferred: true
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
    message: input.message,
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
        input.governance.projectDomain.projectDomain === "U.S.E."
          ? `U.S.E. boundary: ${USE_DEMOCRATIC_BOUNDARY}`
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
      contextClass,
      legacyContextClass,
      intentClass,
      documentMode,
      documentFamily,
      evtIprMemoryUsed: memory.used,
      memorySource: memory.source,
      structuredFormat,
      activeFiles: promptFiles.map((file) => file.name || "unnamed"),
      identity: buildIdentityPayload(identity),
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
        used: memory.used,
        source: memory.source,
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
        memoryHash: memoryEvent.anchors.memoryHash,
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
        memoryUsed: memory.used,
        memorySource: memory.source,
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
    contextClass,
    legacyContextClass,
    intentClass,
    documentMode,
    documentFamily,
    evtIprMemoryUsed: memory.used,
    memorySource: memory.source,
    structuredFormat,
    activeFiles: promptFiles.map((file) => file.name || "unnamed"),
    identity: buildIdentityPayload(identity),
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
      used: memory.used,
      source: memory.source,
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
      memoryHash: memoryEvent.anchors.memoryHash,
      memoryAppendStatus: memoryAppendResult.status,
      opcProofId: opc.publicProof.proofId,
      opcAppendStatus: opc.append.status,
      opcVerificationStatus: opc.publicProof.verificationStatus,
      structuredFormat
    }
  });
}
