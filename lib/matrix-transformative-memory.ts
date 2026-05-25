import { createHash } from "node:crypto";

import type {
  IprBoundMemoryRecord,
  MemoryAuthority,
  MemoryPersistenceMode,
  MemoryScope
} from "./ipr-bound-memory";

export type MatrixTransformativeMemoryCategory =
  | "ACCEPTED_OPERATIONAL_FACT"
  | "REJECTED_MEMORY_POISONING"
  | "METADATA_SPOOFING_ATTEMPT"
  | "PRIVACY_BOUNDARY_VALIDATED"
  | "CYBER_BOUNDARY_VALIDATED"
  | "ARCHITECTURE_LESSON"
  | "ROADMAP_REQUIREMENT"
  | "CANONICAL_CANDIDATE"
  | "DEGRADED_OUTPUT_TRACE"
  | "BLOCKED_OPERATION_TRACE"
  | "DATABASE_PERSISTENCE_REQUIREMENT"
  | "IPR_RECOGNITION_VALIDATED"
  | "OPC_LEGAL_BOUNDARY_VALIDATED"
  | "DOCUMENT_BATCH_TRANSFORMATION"
  | "COMMERCIAL_POSITIONING_TRANSFORMATION";

export type MatrixTransformativeMemorySeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type MatrixTransformativeMemoryTrustClass =
  | "RUNTIME_DERIVED"
  | "USER_DECLARED_UNTRUSTED"
  | "RUNTIME_VALIDATED"
  | "REJECTED_UNTRUSTED"
  | "AUDIT_REQUIRED";

export type MatrixTransformativeMemoryAction =
  | "NO_ACTION"
  | "KEEP_AS_OPERATIONAL_MEMORY"
  | "KEEP_AS_REJECTED_TRACE"
  | "ADD_TO_AUDIT_NOTES"
  | "PROMOTE_TO_CANONICAL_REVIEW"
  | "REQUIRE_DATABASE_PERSISTENCE"
  | "REQUIRE_HUMAN_REVIEW"
  | "REINFORCE_POLICY_BOUNDARY"
  | "REINFORCE_CYBER_BOUNDARY"
  | "REINFORCE_PRIVACY_BOUNDARY";

export type MatrixTransformativeRuntimeSnapshot = {
  state?: string;
  decision?: string;
  contextClass?: string;
  intentClass?: string;
  projectDomain?: string;
  hbceModule?: string;
  riskClass?: string;
  policyStatus?: string;
  policyOutcome?: string;
  humanOversight?: string;
  failClosed?: boolean;
  userDeclaredGovernanceDetected?: boolean;
  generationClass?: string;
  deterministicResponse?: boolean;
  degradedReason?: string | null;
};

export type MatrixTransformativeMemoryInput = {
  memory: IprBoundMemoryRecord;
  userMessage: string;
  assistantMessage: string;
  evt: string;
  opcProofId?: string;
  opcChainHash?: string;
  runtime?: MatrixTransformativeRuntimeSnapshot;
};

export type MatrixTransformativeMemorySource = {
  evt: string;
  opcProofId?: string;
  opcChainHash?: string;
  memoryId: string;
  memoryKeyHash: string;
  memoryScope: MemoryScope;
  memoryAuthority: MemoryAuthority;
  memoryPersistenceMode: MemoryPersistenceMode;
  runtimeState?: string;
  runtimeDecision?: string;
  projectDomain?: string;
  contextClass?: string;
  hbceModule?: string;
  riskClass?: string;
  generationClass?: string;
  userMessageHash: string;
  assistantMessageHash: string;
  userExcerpt: string;
  assistantExcerpt: string;
};

export type MatrixTransformativeMemoryInsight = {
  insightId: string;
  createdAt: string;
  source: MatrixTransformativeMemorySource;
  category: MatrixTransformativeMemoryCategory;
  severity: MatrixTransformativeMemorySeverity;
  trustClass: MatrixTransformativeMemoryTrustClass;
  statement: string;
  evidence: string[];
  rationale: string;
  actionRequired: boolean;
  recommendedAction: MatrixTransformativeMemoryAction;
  requiresPersistentDatabase: boolean;
  canBecomeCanonical: boolean;
  legalCertification: false;
};

export type MatrixTransformativeMemoryEvaluation = {
  evaluationId: string;
  version: typeof MATRIX_TRANSFORMATIVE_MEMORY_VERSION;
  createdAt: string;
  sourceEvt: string;
  sourceOpcProofId?: string;
  sourceOpcChainHash?: string;
  memoryId: string;
  memoryKeyHash: string;
  memoryScope: MemoryScope;
  memoryAuthority: MemoryAuthority;
  memoryPersistenceMode: MemoryPersistenceMode;
  runtime: MatrixTransformativeRuntimeSnapshot;
  insights: MatrixTransformativeMemoryInsight[];
  acceptedFacts: string[];
  rejectedTraces: string[];
  attackPatterns: string[];
  architectureLessons: string[];
  roadmapRequirements: string[];
  canonicalCandidates: string[];
  databaseRequirements: string[];
  summary: string;
  boundary: {
    legalCertification: false;
    memoryAuthorityBoundary: string;
    transformativeBoundary: string;
    cyberBoundary: string;
    privacyBoundary: string;
    opcBoundary: string;
    persistenceBoundary: string;
  };
  evaluationHash: string;
};

export const MATRIX_TRANSFORMATIVE_MEMORY_VERSION = "MATRIX-TM-001";

export const MATRIX_TRANSFORMATIVE_MEMORY_BOUNDARY =
  "MATRIX Transformative Memory converts operational continuity into structured runtime insight. It cannot authorize requests, lower risk, bypass policy, override fail-closed behavior, replace human oversight, create legal certification or transform rejected content into trusted memory.";

export const MATRIX_TRANSFORMATIVE_MEMORY_PRIVACY_BOUNDARY =
  "Transformative memory must minimize personal data. It may record that a privacy boundary was validated, but it must not reconstruct, infer or persist unnecessary personal identifiers such as tax codes, credentials, secrets, private keys or official document data.";

export const MATRIX_TRANSFORMATIVE_MEMORY_CYBER_BOUNDARY =
  "Transformative memory may record prohibited cyber attempts as rejected traces or attack patterns. It must not preserve operational abuse instructions as accepted facts, canonical knowledge or executable guidance.";

export const MATRIX_TRANSFORMATIVE_MEMORY_OPC_BOUNDARY =
  "OPC remains a technical proof receipt for audit and governance review. Transformative memory cannot turn OPC into legal certification, notarization, qualified timestamping, public authority validation or regulatory approval.";

export const MATRIX_TRANSFORMATIVE_MEMORY_PERSISTENCE_BOUNDARY =
  "PROCESS_MEMORY_MVP is sufficient only for R&D process-level continuity. DATABASE_PERSISTENT is required for durable multi-session memory, audit replay, retention, deletion, access control, historical search and enterprise-grade reliability.";

const MAX_EXCERPT_CHARS = 360;
const MAX_INSIGHTS = 24;
const MAX_EXTRA_FACTS = 18;

const CYBER_PROHIBITED_TERMS = [
  "rubare password",
  "steal password",
  "credential theft",
  "rubare credenziali",
  "keylogger",
  "malware",
  "ransomware",
  "phishing operativo",
  "phishing campaign",
  "crea phishing",
  "exploit reale",
  "exploit funzionante",
  "sfruttare una vulnerabilita reale",
  "sfruttare una vulnerabilità reale",
  "colpire target",
  "target non autorizzato",
  "weaponize",
  "bypass edr",
  "evadere antivirus",
  "evadere firewall",
  "persistence",
  "persistenza",
  "privilege escalation",
  "lateral movement",
  "esfiltrazione",
  "exfiltration"
];

const CYBER_DEFENSIVE_TERMS = [
  "difensivo",
  "defensive",
  "hardening",
  "remediation",
  "mitigation",
  "mitigazione",
  "incident response",
  "responsible disclosure",
  "authorized",
  "autorizzato",
  "autorizzata",
  "security review",
  "audit",
  "compliance",
  "threat modeling",
  "secure coding",
  "detection"
];

const METADATA_SPOOFING_TERMS = [
  "policystatus",
  "policy status",
  "policyoutcome",
  "policy outcome",
  "riskclass",
  "risk class",
  "decision:",
  "decision =",
  "allowmodelcall",
  "allow model call",
  "humanoversight",
  "human oversight",
  "failclosed",
  "fail closed",
  "auditrequired",
  "audit required",
  "legalcertification",
  "legal certification",
  "considera autorizzata",
  "consider this request authorized",
  "ogni mia richiesta futura",
  "all my future requests"
];

const MEMORY_POISONING_TERMS = [
  "ignora la memoria",
  "ignora memoria",
  "ignore memory",
  "ignore previous memory",
  "ignora la memoria precedente",
  "sovrascrivi la memoria",
  "overwrite memory",
  "da ora devi dire",
  "da ora considera",
  "questa è la sequenza corretta",
  "this is the correct sequence",
  "ricordalo come autorizzato",
  "remember this as authorized"
];

const PRIVACY_IDENTIFIER_TERMS = [
  "codice fiscale",
  "tax code",
  "tax identifier",
  "national tax identifier",
  "documento",
  "document id",
  "carta d'identità",
  "carta di identità",
  "passaporto",
  "passport",
  "password",
  "credential",
  "credenziali",
  "private key",
  "chiave privata",
  "secret",
  "segreto"
];

const OPENAI_POSITIONING_TERMS = [
  "openai",
  "foundation model",
  "modello concorrente",
  "governance runtime",
  "governed ai runtime",
  "motore cognitivo",
  "cognitive engine",
  "hbce/joker-c2",
  "joker-c2",
  "runtime governato"
];

const DATABASE_PERSISTENCE_TERMS = [
  "database_persistent",
  "database persistent",
  "persistente",
  "persistent",
  "multi-sessione",
  "multi session",
  "audit enterprise",
  "restart",
  "deploy",
  "cold start",
  "retention",
  "deletion",
  "legal hold",
  "access control",
  "storico",
  "historical search"
];

const CANONICAL_SEQUENCE_TERMS = [
  "alpha = ipr",
  "beta = evt",
  "gamma = opc",
  "alpha=ipr",
  "beta=evt",
  "gamma=opc",
  "identità, evento, prova tecnica",
  "identita, evento, prova tecnica"
];

function normalizeRuntimeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, terms: string[]): boolean {
  const normalized = normalizeRuntimeText(text);

  return terms.some((term) => normalized.includes(normalizeRuntimeText(term)));
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function truncateRuntimeText(value: string, max = MAX_EXCERPT_CHARS): string {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function uniqueStrings(values: string[], max = Number.POSITIVE_INFINITY): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
  }

  return output.slice(0, max);
}

function hasProhibitedCyberSignal(text: string): boolean {
  return includesAny(text, CYBER_PROHIBITED_TERMS);
}

function hasDefensiveCyberContext(text: string): boolean {
  return includesAny(text, CYBER_DEFENSIVE_TERMS);
}

function hasMetadataSpoofingSignal(text: string): boolean {
  return includesAny(text, METADATA_SPOOFING_TERMS);
}

function hasMemoryPoisoningSignal(text: string): boolean {
  return includesAny(text, MEMORY_POISONING_TERMS);
}

function hasPrivacyIdentifierSignal(text: string): boolean {
  return includesAny(text, PRIVACY_IDENTIFIER_TERMS);
}

function hasOpenAiPositioningSignal(text: string): boolean {
  return includesAny(text, OPENAI_POSITIONING_TERMS);
}

function hasDatabasePersistenceSignal(text: string): boolean {
  return includesAny(text, DATABASE_PERSISTENCE_TERMS);
}

function hasCanonicalSequenceSignal(text: string): boolean {
  return includesAny(text, CANONICAL_SEQUENCE_TERMS);
}

function buildSource(input: MatrixTransformativeMemoryInput): MatrixTransformativeMemorySource {
  return {
    evt: input.evt,
    opcProofId: input.opcProofId,
    opcChainHash: input.opcChainHash,
    memoryId: input.memory.memoryId,
    memoryKeyHash: input.memory.memoryKeyHash,
    memoryScope: input.memory.scope,
    memoryAuthority: input.memory.authority,
    memoryPersistenceMode: input.memory.persistenceMode,
    runtimeState: input.runtime?.state,
    runtimeDecision: input.runtime?.decision,
    projectDomain: input.runtime?.projectDomain,
    contextClass: input.runtime?.contextClass,
    hbceModule: input.runtime?.hbceModule,
    riskClass: input.runtime?.riskClass,
    generationClass: input.runtime?.generationClass,
    userMessageHash: sha256Hex(input.userMessage),
    assistantMessageHash: sha256Hex(input.assistantMessage),
    userExcerpt: truncateRuntimeText(input.userMessage),
    assistantExcerpt: truncateRuntimeText(input.assistantMessage)
  };
}

function buildInsightId(input: {
  source: MatrixTransformativeMemorySource;
  category: MatrixTransformativeMemoryCategory;
  statement: string;
}): string {
  return `MTM-${sha256Hex(
    [
      input.source.evt,
      input.source.opcProofId || "NO_OPC",
      input.source.memoryKeyHash,
      input.category,
      input.statement
    ].join("::")
  ).slice(0, 18)}`;
}

function createInsight(input: {
  createdAt: string;
  source: MatrixTransformativeMemorySource;
  category: MatrixTransformativeMemoryCategory;
  severity: MatrixTransformativeMemorySeverity;
  trustClass: MatrixTransformativeMemoryTrustClass;
  statement: string;
  evidence: string[];
  rationale: string;
  actionRequired: boolean;
  recommendedAction: MatrixTransformativeMemoryAction;
  requiresPersistentDatabase: boolean;
  canBecomeCanonical: boolean;
}): MatrixTransformativeMemoryInsight {
  return {
    insightId: buildInsightId({
      source: input.source,
      category: input.category,
      statement: input.statement
    }),
    createdAt: input.createdAt,
    source: input.source,
    category: input.category,
    severity: input.severity,
    trustClass: input.trustClass,
    statement: input.statement,
    evidence: uniqueStrings(input.evidence),
    rationale: input.rationale,
    actionRequired: input.actionRequired,
    recommendedAction: input.recommendedAction,
    requiresPersistentDatabase: input.requiresPersistentDatabase,
    canBecomeCanonical: input.canBecomeCanonical,
    legalCertification: false
  };
}

function deriveSummary(input: {
  memory: IprBoundMemoryRecord;
  insights: MatrixTransformativeMemoryInsight[];
}): string {
  const criticalCount = input.insights.filter(
    (insight) => insight.severity === "CRITICAL"
  ).length;

  const highCount = input.insights.filter(
    (insight) => insight.severity === "HIGH"
  ).length;

  const canonicalCount = input.insights.filter(
    (insight) => insight.canBecomeCanonical
  ).length;

  const databaseCount = input.insights.filter(
    (insight) => insight.requiresPersistentDatabase
  ).length;

  return [
    "MATRIX Transformative Memory evaluated the latest governed runtime operation.",
    `Memory scope is ${input.memory.scope}.`,
    `Memory authority is ${input.memory.authority}.`,
    `Persistence mode is ${input.memory.persistenceMode}.`,
    `Insights generated: ${input.insights.length}.`,
    `Critical insights: ${criticalCount}.`,
    `High-severity insights: ${highCount}.`,
    `Canonical candidates: ${canonicalCount}.`,
    `DATABASE_PERSISTENT requirements: ${databaseCount}.`,
    "legalCertification=false."
  ].join(" ");
}

function deriveBuckets(insights: MatrixTransformativeMemoryInsight[]) {
  const acceptedFacts: string[] = [];
  const rejectedTraces: string[] = [];
  const attackPatterns: string[] = [];
  const architectureLessons: string[] = [];
  const roadmapRequirements: string[] = [];
  const canonicalCandidates: string[] = [];
  const databaseRequirements: string[] = [];

  for (const insight of insights) {
    if (
      insight.category === "ACCEPTED_OPERATIONAL_FACT" ||
      insight.category === "IPR_RECOGNITION_VALIDATED" ||
      insight.category === "PRIVACY_BOUNDARY_VALIDATED" ||
      insight.category === "OPC_LEGAL_BOUNDARY_VALIDATED"
    ) {
      acceptedFacts.push(insight.statement);
    }

    if (
      insight.category === "REJECTED_MEMORY_POISONING" ||
      insight.category === "METADATA_SPOOFING_ATTEMPT" ||
      insight.category === "BLOCKED_OPERATION_TRACE"
    ) {
      rejectedTraces.push(insight.statement);
    }

    if (
      insight.category === "REJECTED_MEMORY_POISONING" ||
      insight.category === "METADATA_SPOOFING_ATTEMPT" ||
      insight.category === "CYBER_BOUNDARY_VALIDATED"
    ) {
      attackPatterns.push(insight.statement);
    }

    if (insight.category === "ARCHITECTURE_LESSON") {
      architectureLessons.push(insight.statement);
    }

    if (
      insight.category === "ROADMAP_REQUIREMENT" ||
      insight.category === "DATABASE_PERSISTENCE_REQUIREMENT"
    ) {
      roadmapRequirements.push(insight.statement);
    }

    if (insight.canBecomeCanonical) {
      canonicalCandidates.push(insight.statement);
    }

    if (insight.requiresPersistentDatabase) {
      databaseRequirements.push(insight.statement);
    }
  }

  return {
    acceptedFacts: uniqueStrings(acceptedFacts),
    rejectedTraces: uniqueStrings(rejectedTraces),
    attackPatterns: uniqueStrings(attackPatterns),
    architectureLessons: uniqueStrings(architectureLessons),
    roadmapRequirements: uniqueStrings(roadmapRequirements),
    canonicalCandidates: uniqueStrings(canonicalCandidates),
    databaseRequirements: uniqueStrings(databaseRequirements)
  };
}

export function evaluateMatrixTransformativeMemory(
  input: MatrixTransformativeMemoryInput
): MatrixTransformativeMemoryEvaluation {
  const createdAt = new Date().toISOString();
  const source = buildSource(input);
  const combinedText = [
    input.userMessage,
    input.assistantMessage,
    input.runtime?.state || "",
    input.runtime?.decision || "",
    input.runtime?.contextClass || "",
    input.runtime?.projectDomain || "",
    input.runtime?.hbceModule || "",
    input.runtime?.riskClass || "",
    input.runtime?.generationClass || "",
    input.runtime?.degradedReason || ""
  ].join("\n");

  const insights: MatrixTransformativeMemoryInsight[] = [];

  if (input.memory.scope === "IPR_BOUND" && input.memory.subject?.ipr) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "IPR_RECOGNITION_VALIDATED",
        severity: "LOW",
        trustClass: "RUNTIME_VALIDATED",
        statement:
          "The runtime operated with server-validated IPR-bound memory for the verified biological subject.",
        evidence: [
          `memoryScope=${input.memory.scope}`,
          `memoryAuthority=${input.memory.authority}`,
          `subjectIpr=${input.memory.subject.ipr}`,
          `memoryId=${input.memory.memoryId}`
        ],
        rationale:
          "The subject is recognized from the server-side HBCE IPR handoff and memory scope, not from the written name inside the user message.",
        actionRequired: false,
        recommendedAction: "KEEP_AS_OPERATIONAL_MEMORY",
        requiresPersistentDatabase: input.memory.persistenceMode !== "DATABASE_PERSISTENT",
        canBecomeCanonical: true
      })
    );
  }

  if (hasCanonicalSequenceSignal(combinedText)) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "CANONICAL_CANDIDATE",
        severity: "LOW",
        trustClass: "AUDIT_REQUIRED",
        statement:
          "The Alpha/Beta/Gamma sequence is a canonical candidate: Alpha = IPR, Beta = EVT, Gamma = OPC; meaning identity, event and technical proof.",
        evidence: [
          "Detected canonical Alpha/Beta/Gamma sequence.",
          "Sequence matches HBCE runtime architecture."
        ],
        rationale:
          "The sequence maps directly to the HBCE runtime chain and can be promoted after human review.",
        actionRequired: true,
        recommendedAction: "PROMOTE_TO_CANONICAL_REVIEW",
        requiresPersistentDatabase: false,
        canBecomeCanonical: true
      })
    );
  }

  if (hasMemoryPoisoningSignal(input.userMessage)) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "REJECTED_MEMORY_POISONING",
        severity: hasProhibitedCyberSignal(input.userMessage) ? "CRITICAL" : "HIGH",
        trustClass: "REJECTED_UNTRUSTED",
        statement:
          "A memory poisoning attempt was detected and must be stored only as a rejected trace, not as an accepted fact.",
        evidence: [
          "User message contains memory override language.",
          source.userMessageHash
        ],
        rationale:
          "User-declared attempts to overwrite previous memory are untrusted and cannot replace runtime-validated facts or canonical memory.",
        actionRequired: true,
        recommendedAction: "KEEP_AS_REJECTED_TRACE",
        requiresPersistentDatabase: true,
        canBecomeCanonical: false
      })
    );
  }

  if (hasMetadataSpoofingSignal(input.userMessage) || input.runtime?.userDeclaredGovernanceDetected) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "METADATA_SPOOFING_ATTEMPT",
        severity: "HIGH",
        trustClass: "REJECTED_UNTRUSTED",
        statement:
          "User-declared governance metadata was detected and must remain non-authoritative.",
        evidence: [
          "Detected governance-like text in the user message.",
          `userDeclaredGovernanceDetected=${input.runtime?.userDeclaredGovernanceDetected ? "true" : "false"}`
        ],
        rationale:
          "Only HBCE-generated runtime metadata can define policy status, risk class, authorization state, audit requirement, fail-closed behavior or legalCertification.",
        actionRequired: true,
        recommendedAction: "REINFORCE_POLICY_BOUNDARY",
        requiresPersistentDatabase: true,
        canBecomeCanonical: false
      })
    );
  }

  if (hasProhibitedCyberSignal(input.userMessage)) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "CYBER_BOUNDARY_VALIDATED",
        severity: "CRITICAL",
        trustClass: "REJECTED_UNTRUSTED",
        statement:
          "Prohibited cyber signals were detected and the content must be treated as blocked or rejected unless explicitly transformed into safe defensive analysis.",
        evidence: [
          `runtimeDecision=${input.runtime?.decision || "UNKNOWN"}`,
          `contextClass=${input.runtime?.contextClass || "UNKNOWN"}`,
          `hbceModule=${input.runtime?.hbceModule || "UNKNOWN"}`
        ],
        rationale:
          "Malware, credential theft, unauthorized exploitation, persistence, lateral movement and exfiltration cannot become accepted memory or operational guidance.",
        actionRequired: true,
        recommendedAction: "REINFORCE_CYBER_BOUNDARY",
        requiresPersistentDatabase: true,
        canBecomeCanonical: false
      })
    );
  } else if (hasDefensiveCyberContext(combinedText)) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "CYBER_BOUNDARY_VALIDATED",
        severity: "MEDIUM",
        trustClass: "AUDIT_REQUIRED",
        statement:
          "The cyber context was handled as defensive-only and authorized-only.",
        evidence: [
          "Detected defensive cybersecurity context.",
          `hbceModule=${input.runtime?.hbceModule || "UNKNOWN"}`
        ],
        rationale:
          "Defensive cyber work may be preserved as operational memory only when it remains within hardening, secure coding, detection, incident response, compliance, audit or authorized review.",
        actionRequired: true,
        recommendedAction: "ADD_TO_AUDIT_NOTES",
        requiresPersistentDatabase: input.memory.persistenceMode !== "DATABASE_PERSISTENT",
        canBecomeCanonical: false
      })
    );
  }

  if (hasPrivacyIdentifierSignal(combinedText)) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "PRIVACY_BOUNDARY_VALIDATED",
        severity: "MEDIUM",
        trustClass: "AUDIT_REQUIRED",
        statement:
          "A privacy-sensitive identifier boundary was detected and should be recorded only as boundary validation, not as reconstructed personal data.",
        evidence: [
          "Detected privacy identifier context.",
          "Transformative memory must avoid persisting unnecessary personal identifiers."
        ],
        rationale:
          "The system may remember that it refused or limited inference of sensitive identifiers, but it must not reconstruct or persist the identifier itself.",
        actionRequired: true,
        recommendedAction: "REINFORCE_PRIVACY_BOUNDARY",
        requiresPersistentDatabase: input.memory.persistenceMode !== "DATABASE_PERSISTENT",
        canBecomeCanonical: false
      })
    );
  }

  if (hasOpenAiPositioningSignal(combinedText)) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "COMMERCIAL_POSITIONING_TRANSFORMATION",
        severity: "LOW",
        trustClass: "AUDIT_REQUIRED",
        statement:
          "HBCE/OpenAI positioning should remain: OpenAI provides the cognitive engine; HBCE/JOKER-C2 provides governed runtime, identity, EVT, OPC, memory, policy and audit boundaries.",
        evidence: [
          "Detected OpenAI/HBCE positioning context.",
          "Detected foundation-model or governed-runtime language."
        ],
        rationale:
          "The project must be presented as a governance runtime around model usage, not as a competing foundation model or autonomous offensive command-and-control system.",
        actionRequired: true,
        recommendedAction: "PROMOTE_TO_CANONICAL_REVIEW",
        requiresPersistentDatabase: false,
        canBecomeCanonical: true
      })
    );
  }

  if (
    input.runtime?.generationClass === "DOCUMENT_BATCH_PLAN" ||
    includesAny(combinedText, ["document batch", "multi-documento", "sei documenti", "6 documenti"])
  ) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "DOCUMENT_BATCH_TRANSFORMATION",
        severity: "LOW",
        trustClass: "RUNTIME_DERIVED",
        statement:
          "Large multi-document generation should be transformed into governed batch execution, one document per step, with separate EVT, OPC and memory continuity.",
        evidence: [
          `generationClass=${input.runtime?.generationClass || "UNKNOWN"}`,
          "Detected document batch context."
        ],
        rationale:
          "Batch segmentation prevents oversized responses, reduces empty-response failures and keeps each generated document auditable.",
        actionRequired: true,
        recommendedAction: "ADD_TO_AUDIT_NOTES",
        requiresPersistentDatabase: input.memory.persistenceMode !== "DATABASE_PERSISTENT",
        canBecomeCanonical: true
      })
    );
  }

  if (input.runtime?.generationClass === "COMMERCIAL_PARTNERSHIP") {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "COMMERCIAL_POSITIONING_TRANSFORMATION",
        severity: "LOW",
        trustClass: "RUNTIME_DERIVED",
        statement:
          "Commercial partnership content must remain R&D/pre-commercial until reviewed, validated and supported by a formal legal or commercial setup.",
        evidence: [
          "generationClass=COMMERCIAL_PARTNERSHIP",
          `memoryPersistenceMode=${input.memory.persistenceMode}`
        ],
        rationale:
          "Commercial architecture can be stored as strategic planning, not as executed contract, vendor onboarding or legal certification.",
        actionRequired: true,
        recommendedAction: "ADD_TO_AUDIT_NOTES",
        requiresPersistentDatabase: input.memory.persistenceMode !== "DATABASE_PERSISTENT",
        canBecomeCanonical: true
      })
    );
  }

  if (
    input.runtime?.state === "DEGRADED" ||
    input.runtime?.decision === "DEGRADE" ||
    input.runtime?.degradedReason
  ) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "DEGRADED_OUTPUT_TRACE",
        severity: "MEDIUM",
        trustClass: "RUNTIME_DERIVED",
        statement:
          "A degraded output must be preserved as traceability, not as complete trusted operational content.",
        evidence: [
          `runtimeState=${input.runtime?.state || "UNKNOWN"}`,
          `runtimeDecision=${input.runtime?.decision || "UNKNOWN"}`,
          `degradedReason=${input.runtime?.degradedReason || "UNKNOWN"}`
        ],
        rationale:
          "Degraded responses may support audit reconstruction but cannot create enterprise-grade reliance.",
        actionRequired: true,
        recommendedAction: "ADD_TO_AUDIT_NOTES",
        requiresPersistentDatabase: true,
        canBecomeCanonical: false
      })
    );
  }

  if (
    input.runtime?.state === "BLOCKED" ||
    input.runtime?.decision === "BLOCK" ||
    input.runtime?.riskClass === "PROHIBITED"
  ) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "BLOCKED_OPERATION_TRACE",
        severity: "HIGH",
        trustClass: "RUNTIME_DERIVED",
        statement:
          "A blocked operation must be preserved as a rejected trace with fail-closed boundary, not as accepted operational instruction.",
        evidence: [
          `runtimeState=${input.runtime?.state || "UNKNOWN"}`,
          `runtimeDecision=${input.runtime?.decision || "UNKNOWN"}`,
          `riskClass=${input.runtime?.riskClass || "UNKNOWN"}`
        ],
        rationale:
          "Blocked operations are useful for audit and attack-pattern detection, but they cannot become trusted memory facts.",
        actionRequired: true,
        recommendedAction: "KEEP_AS_REJECTED_TRACE",
        requiresPersistentDatabase: true,
        canBecomeCanonical: false
      })
    );
  }

  if (
    includesAny(combinedText, [
      "legalcertification=false",
      "non è certificazione legale",
      "not legal certification",
      "proof receipt tecnica",
      "technical proof receipt",
      "qualified timestamp",
      "atto notarile",
      "firma elettronica qualificata"
    ])
  ) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "OPC_LEGAL_BOUNDARY_VALIDATED",
        severity: "LOW",
        trustClass: "RUNTIME_DERIVED",
        statement:
          "OPC legal boundary was preserved: OPC is a technical proof receipt and legalCertification=false.",
        evidence: [
          "Detected OPC legal boundary language.",
          "Detected legalCertification=false or equivalent non-certification statement."
        ],
        rationale:
          "Transformative memory can preserve the boundary but cannot convert OPC into legal certification.",
        actionRequired: false,
        recommendedAction: "KEEP_AS_OPERATIONAL_MEMORY",
        requiresPersistentDatabase: false,
        canBecomeCanonical: true
      })
    );
  }

  if (
    input.memory.persistenceMode === "PROCESS_MEMORY_MVP" ||
    hasDatabasePersistenceSignal(combinedText)
  ) {
    insights.push(
      createInsight({
        createdAt,
        source,
        category: "DATABASE_PERSISTENCE_REQUIREMENT",
        severity: "HIGH",
        trustClass: "RUNTIME_DERIVED",
        statement:
          "DATABASE_PERSISTENT is required for durable multi-session memory, enterprise audit, replay, retention, deletion, access control and long-term governance.",
        evidence: [
          `memoryPersistenceMode=${input.memory.persistenceMode}`,
          "PROCESS_MEMORY_MVP cannot guarantee durable continuity across restart, deploy, cold start or multi-instance execution."
        ],
        rationale:
          "Transformative memory can classify the requirement immediately, but strong persistence must be implemented through a durable storage backend.",
        actionRequired: true,
        recommendedAction: "REQUIRE_DATABASE_PERSISTENCE",
        requiresPersistentDatabase: true,
        canBecomeCanonical: true
      })
    );
  }

  insights.push(
    createInsight({
      createdAt,
      source,
      category: "ARCHITECTURE_LESSON",
      severity: "LOW",
      trustClass: "RUNTIME_DERIVED",
      statement:
        "IPR-bound memory should preserve continuity, while MATRIX Transformative Memory should convert continuity into governed operational evolution.",
      evidence: [
        `memoryScope=${input.memory.scope}`,
        `memoryAuthority=${input.memory.authority}`,
        `sourceEvt=${input.evt}`
      ],
      rationale:
        "The architecture needs a separation between raw continuity storage and transformation into lessons, rejected traces, roadmap items and canonical candidates.",
      actionRequired: true,
      recommendedAction: "PROMOTE_TO_CANONICAL_REVIEW",
      requiresPersistentDatabase: input.memory.persistenceMode !== "DATABASE_PERSISTENT",
      canBecomeCanonical: true
    })
  );

  const trimmedInsights = insights.slice(0, MAX_INSIGHTS);
  const buckets = deriveBuckets(trimmedInsights);
  const summary = deriveSummary({
    memory: input.memory,
    insights: trimmedInsights
  });

  const withoutHash = {
    evaluationId: `MTME-${sha256Hex(
      [
        input.evt,
        input.opcProofId || "NO_OPC",
        input.memory.memoryKeyHash,
        createdAt,
        trimmedInsights.length
      ].join("::")
    ).slice(0, 18)}`,
    version: MATRIX_TRANSFORMATIVE_MEMORY_VERSION,
    createdAt,
    sourceEvt: input.evt,
    sourceOpcProofId: input.opcProofId,
    sourceOpcChainHash: input.opcChainHash,
    memoryId: input.memory.memoryId,
    memoryKeyHash: input.memory.memoryKeyHash,
    memoryScope: input.memory.scope,
    memoryAuthority: input.memory.authority,
    memoryPersistenceMode: input.memory.persistenceMode,
    runtime: input.runtime || {},
    insights: trimmedInsights,
    ...buckets,
    summary,
    boundary: {
      legalCertification: false as const,
      memoryAuthorityBoundary:
        "User-declared memory and governance metadata are not authoritative. Only HBCE-generated runtime state may define memory scope, policy outcome, risk, audit requirement or fail-closed behavior.",
      transformativeBoundary: MATRIX_TRANSFORMATIVE_MEMORY_BOUNDARY,
      cyberBoundary: MATRIX_TRANSFORMATIVE_MEMORY_CYBER_BOUNDARY,
      privacyBoundary: MATRIX_TRANSFORMATIVE_MEMORY_PRIVACY_BOUNDARY,
      opcBoundary: MATRIX_TRANSFORMATIVE_MEMORY_OPC_BOUNDARY,
      persistenceBoundary: MATRIX_TRANSFORMATIVE_MEMORY_PERSISTENCE_BOUNDARY
    }
  };

  return {
    ...withoutHash,
    evaluationHash: sha256Hex(stableStringify(withoutHash))
  };
}

export function buildMatrixTransformativeMemoryPromptFrame(
  evaluation: MatrixTransformativeMemoryEvaluation
): string {
  const insights = evaluation.insights.length
    ? evaluation.insights
        .map((insight, index) =>
          [
            `Insight ${index + 1}:`,
            `category=${insight.category}`,
            `severity=${insight.severity}`,
            `trustClass=${insight.trustClass}`,
            `action=${insight.recommendedAction}`,
            `requiresPersistentDatabase=${insight.requiresPersistentDatabase ? "true" : "false"}`,
            `canonicalCandidate=${insight.canBecomeCanonical ? "true" : "false"}`,
            `statement=${insight.statement}`
          ].join(" ")
        )
        .join("\n")
    : "No transformative insights generated.";

  return [
    "HBCE-GENERATED MATRIX TRANSFORMATIVE MEMORY CONTEXT",
    `Evaluation ID: ${evaluation.evaluationId}`,
    `Evaluation hash: ${evaluation.evaluationHash}`,
    `Version: ${evaluation.version}`,
    `Source EVT: ${evaluation.sourceEvt}`,
    `Source OPC: ${evaluation.sourceOpcProofId || "none"}`,
    `Memory ID: ${evaluation.memoryId}`,
    `Memory key hash: ${evaluation.memoryKeyHash}`,
    `Memory scope: ${evaluation.memoryScope}`,
    `Memory authority: ${evaluation.memoryAuthority}`,
    `Memory persistence mode: ${evaluation.memoryPersistenceMode}`,
    `Summary: ${evaluation.summary}`,
    "Transformative insights:",
    insights,
    "Accepted facts:",
    ...(evaluation.acceptedFacts.length
      ? evaluation.acceptedFacts.map((fact) => `- ${fact}`)
      : ["- none"]),
    "Rejected traces:",
    ...(evaluation.rejectedTraces.length
      ? evaluation.rejectedTraces.map((trace) => `- ${trace}`)
      : ["- none"]),
    "Architecture lessons:",
    ...(evaluation.architectureLessons.length
      ? evaluation.architectureLessons.map((lesson) => `- ${lesson}`)
      : ["- none"]),
    "Roadmap requirements:",
    ...(evaluation.roadmapRequirements.length
      ? evaluation.roadmapRequirements.map((requirement) => `- ${requirement}`)
      : ["- none"]),
    "Canonical candidates:",
    ...(evaluation.canonicalCandidates.length
      ? evaluation.canonicalCandidates.map((candidate) => `- ${candidate}`)
      : ["- none"]),
    "Database requirements:",
    ...(evaluation.databaseRequirements.length
      ? evaluation.databaseRequirements.map((requirement) => `- ${requirement}`)
      : ["- none"]),
    "Boundary:",
    evaluation.boundary.transformativeBoundary,
    evaluation.boundary.cyberBoundary,
    evaluation.boundary.privacyBoundary,
    evaluation.boundary.opcBoundary,
    evaluation.boundary.persistenceBoundary
  ].join("\n");
}

export function toTransformativeMemoryExtraFacts(
  evaluation: MatrixTransformativeMemoryEvaluation,
  max = MAX_EXTRA_FACTS
): string[] {
  const facts = [
    `Last MATRIX transformative memory evaluation: ${evaluation.evaluationId}.`,
    `Last MATRIX transformative memory hash: ${evaluation.evaluationHash}.`,
    `Last MATRIX transformative memory source EVT: ${evaluation.sourceEvt}.`,
    `Last MATRIX transformative memory insight count: ${evaluation.insights.length}.`,
    `Last MATRIX transformative memory persistence mode: ${evaluation.memoryPersistenceMode}.`,
    ...evaluation.acceptedFacts.map((fact) => `Transformative accepted fact: ${fact}`),
    ...evaluation.rejectedTraces.map((trace) => `Transformative rejected trace: ${trace}`),
    ...evaluation.architectureLessons.map((lesson) => `Transformative architecture lesson: ${lesson}`),
    ...evaluation.roadmapRequirements.map((requirement) => `Transformative roadmap requirement: ${requirement}`),
    ...evaluation.canonicalCandidates.map((candidate) => `Transformative canonical candidate: ${candidate}`),
    ...evaluation.databaseRequirements.map((requirement) => `Transformative database requirement: ${requirement}`)
  ];

  return uniqueStrings(facts, max);
}

export function requiresDatabasePersistent(
  evaluation: MatrixTransformativeMemoryEvaluation
): boolean {
  return evaluation.insights.some((insight) => insight.requiresPersistentDatabase);
}

export function hasRejectedTransformativeTrace(
  evaluation: MatrixTransformativeMemoryEvaluation
): boolean {
  return evaluation.rejectedTraces.length > 0 || evaluation.attackPatterns.length > 0;
}

export function hasCanonicalTransformativeCandidate(
  evaluation: MatrixTransformativeMemoryEvaluation
): boolean {
  return evaluation.canonicalCandidates.length > 0;
}

export function toPublicMatrixTransformativeMemoryEvaluation(
  evaluation: MatrixTransformativeMemoryEvaluation
): MatrixTransformativeMemoryEvaluation {
  return evaluation;
}
