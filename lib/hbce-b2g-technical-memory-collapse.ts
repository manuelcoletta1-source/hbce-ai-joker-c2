/**
 * HBCE B2G Technical Memory Collapse
 * ------------------------------------------------------------
 * Pure technical-memory collapse module for AI JOKER-C2 SaaS B2G profiles.
 *
 * Purpose:
 * - Convert a verified HBCE B2G technical document profile into a deterministic
 *   IPR-ready technical memory payload.
 * - Avoid the CORPUS quantum-state template entirely.
 * - Produce technicalMemorySummary, runtimeInputs, runtimeOutputs and
 *   futureGithubModules for later Save Chat -> IPR.
 *
 * Boundary:
 * - No quantumStates.
 * - No QSTATE.
 * - No CORPUS memory collapse.
 * - No raw-text persistence.
 * - No legal certification.
 * - OPC remains a technical proof receipt only.
 */

import {
  HBCE_B2G_OPC_BOUNDARY,
  HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION,
  HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY,
  HBCE_B2G_TECHNICAL_STACK_DEFINITIONS,
  HBCE_TECHNICAL_GOVERNANCE_MODULE,
  HBCE_TECHNICAL_GOVERNANCE_MODULE_SET,
  HBCE_RND_THEORETICAL_FOUNDATION,
  classifyHbceB2gTechnicalStackDocument,
  type HbceB2gTechnicalStackClassification,
  type HbceB2gTechnicalStackClassifierInput,
  type HbceB2gTechnicalStackDocumentKind,
  type HbceB2gTechnicalStackModule
} from "./hbce-b2g-technical-stack-classifier";

export const HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION =
  "HBCE-B2G-TECHNICAL-MEMORY-COLLAPSE-v1_0_0";

export const HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY =
  "B2G_TECHNICAL_PROFILE_MEMORY_READY" as const;

export const HBCE_B2G_TECHNICAL_MEMORY_FAIL =
  "B2G_TECHNICAL_PROFILE_MEMORY_FAIL" as const;

export type HbceB2gTechnicalMemoryStatus =
  | typeof HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
  | typeof HBCE_B2G_TECHNICAL_MEMORY_FAIL;

export type HbceB2gTechnicalMemoryFailReason =
  | "NONE"
  | "DOCUMENT_PROFILE_MISSING"
  | "DOCUMENT_PROFILE_NOT_B2G_TECHNICAL_STACK"
  | "DOCUMENT_PROFILE_MODULE_MISSING"
  | "DOCUMENT_PROFILE_CONTAMINATED_WITH_CORPUS"
  | "DOCUMENT_PROFILE_CONTAMINATED_WITH_QSTATES"
  | "DOCUMENT_PROFILE_CONTAMINATED_WITH_DCTT"
  | "DOCUMENT_KIND_NOT_TECHNICAL"
  | "CLASSIFIER_NO_MATCH"
  | "UNSUPPORTED_TECHNICAL_MODULE";

export interface HbceB2gTechnicalProfileInput extends HbceB2gTechnicalStackClassifierInput {
  documentProfileId?: string | null;
  documentProfileStatus?: string | null;
  fileHash?: string | null;
  docFamily?: string | null;
  documentKind?: string | null;
  module?: string | null;
  volume?: string | null;
  canonicalAxis?: string | null;
  fullDocumentCoverage?: boolean | null;
  documentChunksPersisted?: boolean | null;
  documentChunksPersistedCount?: number | null;
  textCoverageStatus?: string | null;
  truncationDetected?: boolean | null;
  derivedFromHumanIpr?: string | null;
  humanIpr?: string | null;
  runtimeIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  evtId?: string | null;
  opcId?: string | null;
  auditId?: string | null;
  usageId?: string | null;
}

export interface HbceB2gFutureGithubModule {
  path: string;
  role: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route?: string;
}

export interface HbceB2gTechnicalMemoryPayload {
  status: HbceB2gTechnicalMemoryStatus;
  readyForIprSave: boolean;

  memoryType: "B2G_TECHNICAL_PROFILE_MEMORY";
  memoryMode: "TECHNICAL_SYNTHESIS_ONLY";
  collapseRevision: string;
  classifierRevision: string;

  sourceDocument: string | null;
  documentProfileId: string | null;
  documentProfileStatus: string | null;
  fileHash: string | null;

  docFamily: typeof HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY | null;
  documentKind: HbceB2gTechnicalStackDocumentKind | null;
  module: HbceB2gTechnicalStackModule | null;
  volume: "N/A" | "SET" | null;
  title: string | null;
  shortTitle: string | null;
  canonicalAxis: string | null;

  technicalMemorySummary: string | null;
  runtimeInputs: string[];
  runtimeOutputs: string[];
  operationalRules: string[];
  futureGithubModules: HbceB2gFutureGithubModule[];

  classification: {
    matched: boolean;
    confidence: string;
    score: number;
    matchedSignals: string[];
    metadataLockApplied: boolean;
    metadataOverrideSource: string;
  };

  guards: {
    noRawTextPersistence: boolean;
    noQuantumStates: boolean;
    noQstateOutput: boolean;
    noCorpusCollapse: boolean;
    noSemanticEsoterologicalMemory: boolean;
    noDcttAxisForB2gTechnicalModules: boolean;
    legalCertification: false;
    opcBoundary: typeof HBCE_B2G_OPC_BOUNDARY;
  };

  coverage: {
    textCoverageStatus: string | null;
    fullDocumentCoverage: boolean | null;
    documentChunksPersisted: boolean | null;
    documentChunksPersistedCount: number | null;
    truncationDetected: boolean | null;
  };

  identity: {
    derivedFromHumanIpr: string | null;
    humanIpr: string | null;
    runtimeIpr: string | null;
    tenantId: string | null;
    workspaceId: string | null;
  };

  trace: {
    evtId: string | null;
    opcId: string | null;
    auditId: string | null;
    usageId: string | null;
  };

  savePolicy: {
    saveRaw: false;
    saveTechnicalSynthesis: true;
    saveQuantumStates: false;
    saveFinalTechnicalMemoryOnly: true;
    reusableInPrompt: true;
    legalCertification: false;
    opc: typeof HBCE_B2G_OPC_BOUNDARY;
  };

  failReason: HbceB2gTechnicalMemoryFailReason;
}

interface HbceB2gTechnicalMemoryDefinition {
  module: HbceB2gTechnicalStackModule;
  documentKind: HbceB2gTechnicalStackDocumentKind;
  title: string;
  shortTitle: string;
  canonicalAxis: string;
  technicalMemorySummary: string;
  runtimeInputs: string[];
  runtimeOutputs: string[];
  operationalRules: string[];
  futureGithubModules: HbceB2gFutureGithubModule[];
}

const B2G_TECHNICAL_MEMORY_DEFINITIONS: Record<
  HbceB2gTechnicalStackModule,
  HbceB2gTechnicalMemoryDefinition
> = {
  QPCCF_PREDICTIVE_STABILITY_ENGINE: {
    module: "QPCCF_PREDICTIVE_STABILITY_ENGINE",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    title:
      "UNI/QPCCF – Intercettazione predittiva delle collisioni e collimazione dei sistemi complessi",
    shortTitle: "QPCCF Predictive Stability Engine",
    canonicalAxis:
      "Lambda · delta · partial_t_Lambda · u(t) · EVT · OPC · AI_JOKER_C2_TECHNICAL_STACK",
    technicalMemorySummary:
      "QPCCF is the AI JOKER-C2 B2G predictive stability engine. It models system equilibrium through Lambda, detects deviations through delta, anticipates instability through partial_t_Lambda and applies u(t) as a corrective collimation signal. Its operational purpose is to intercept dynamic collisions before collapse, stabilize complex systems and emit audit-ready EVT/OPC technical proof receipts without claiming legal certification.",
    runtimeInputs: [
      "systemStateSnapshot",
      "lambdaBaseline",
      "lambdaObserved",
      "deltaThreshold",
      "partialTLambdaWindow",
      "telemetrySeries",
      "domainContext",
      "operatorPolicy",
      "humanIpr",
      "tenantId",
      "workspaceId"
    ],
    runtimeOutputs: [
      "lambdaScore",
      "deltaDeviation",
      "partialTLambdaTrend",
      "collisionRiskLevel",
      "collimationSignalUT",
      "recommendedCorrection",
      "stabilityDecision",
      "evtCandidate",
      "opcTechnicalProofReceipt"
    ],
    operationalRules: [
      "Fail closed when Lambda baseline is missing.",
      "Fail closed when delta cannot be computed.",
      "Do not emit stability approval when partial_t_Lambda is unstable above threshold.",
      "Use u(t) only as a technical correction signal, not as legal authorization.",
      "Persist only technical synthesis, not raw telemetry, unless a separate explicit data policy allows it.",
      "Every material stability decision must be traceable through EVT and OPC technical proof receipt."
    ],
    futureGithubModules: [
      {
        path: "lib/b2g-stability-engine.ts",
        role: "Core QPCCF Lambda/delta/partial_t_Lambda/u(t) computation engine."
      },
      {
        path: "app/api/v1/stability/check/route.ts",
        route: "/api/v1/stability/check",
        method: "POST",
        role: "API endpoint for technical stability check."
      },
      {
        path: "app/api/v1/collision/predict/route.ts",
        route: "/api/v1/collision/predict",
        method: "POST",
        role: "API endpoint for predictive collision risk estimation."
      },
      {
        path: "app/api/v1/collimation/apply/route.ts",
        route: "/api/v1/collimation/apply",
        method: "POST",
        role: "API endpoint for applying or simulating u(t) collimation correction."
      }
    ]
  },

  CQD_EVIDENCE_RECORD_ENGINE: {
    module: "CQD_EVIDENCE_RECORD_ENGINE",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    title: "CQD – Crocefissione Quantistica del Dato",
    shortTitle: "CQD Evidence Record Engine",
    canonicalAxis: "T · I · E · L · Hash · EVT · OPC · AI_JOKER_C2_TECHNICAL_STACK",
    technicalMemorySummary:
      "CQD is the AI JOKER-C2 B2G evidence record engine. It packages a technical data event into an auditable record composed of trace, identity, event, linkage and hash material. CQD prepares a technical proof receipt through EVT and OPC and remains outside legal certification unless integrated later with qualified trust services.",
    runtimeInputs: [
      "sourcePayloadHash",
      "operationContext",
      "actorBinding",
      "policyDecision",
      "eventTimestamp",
      "tenantId",
      "workspaceId",
      "humanIpr"
    ],
    runtimeOutputs: [
      "cqdRecordId",
      "inputHash",
      "eventHash",
      "linkageHash",
      "evtCandidate",
      "opcTechnicalProofReceipt",
      "auditBundle"
    ],
    operationalRules: [
      "Never store raw sensitive payloads by default.",
      "Hash all relevant evidence material before persistence.",
      "Bind each evidence record to human IPR, tenant and workspace.",
      "Expose legalCertification=false unless a qualified trust layer is explicitly attached.",
      "Emit OPC as technical proof receipt only."
    ],
    futureGithubModules: [
      {
        path: "lib/cqd-evidence-record.ts",
        role: "CQD evidence pack and technical record builder."
      },
      {
        path: "app/api/v1/evidence/cqd/route.ts",
        route: "/api/v1/evidence/cqd",
        method: "POST",
        role: "API endpoint for CQD technical evidence record generation."
      }
    ]
  },

  AIQ_JOKER_POLICY_TRUTH_BUS: {
    module: "AIQ_JOKER_POLICY_TRUTH_BUS",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    title: "AIQ JOKER – Policy Truth Bus",
    shortTitle: "AIQ JOKER Policy Truth Bus",
    canonicalAxis: "H · S · Q · A · Chi_tau · Policy · Fail-Closed · AI_JOKER_C2",
    technicalMemorySummary:
      "AIQ JOKER is the AI JOKER-C2 policy/truth bus. It evaluates whether a runtime request is structurally coherent, policy-admissible, traceable and safe to execute. Its function is not to generate content but to gate execution through fail-closed policy logic and computable truth constraints.",
    runtimeInputs: [
      "requestIntent",
      "actorBinding",
      "policyContext",
      "safetyConstraints",
      "traceRequirements",
      "modelRoutingContext",
      "tenantId",
      "workspaceId"
    ],
    runtimeOutputs: [
      "policyDecision",
      "truthBusDecision",
      "allowDenyReason",
      "failClosedReason",
      "requiredTrace",
      "evtCandidate",
      "opcTechnicalProofReceipt"
    ],
    operationalRules: [
      "Fail closed when identity binding is absent.",
      "Fail closed when policy context is ambiguous.",
      "Do not route to model execution until policy gate is resolved.",
      "Separate truth-bus decision from generated content.",
      "Every denial must be explainable at technical audit level."
    ],
    futureGithubModules: [
      {
        path: "lib/policy-truth-bus.ts",
        role: "AIQ JOKER policy/truth bus and fail-closed decision gate."
      },
      {
        path: "app/api/v1/policy/check/route.ts",
        route: "/api/v1/policy/check",
        method: "POST",
        role: "API endpoint for policy/truth-bus runtime checks."
      }
    ]
  },

  UFO_INTERCEPT_COLLISION_COLLIMATION_RUNTIME: {
    module: "UFO_INTERCEPT_COLLISION_COLLIMATION_RUNTIME",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    title: "UFO–INTERCEPT ΦΩ – Collision / Collimation Runtime",
    shortTitle: "UFO-INTERCEPT Collision Collimation Runtime",
    canonicalAxis: "Anomaly · Intercept · Collision · Collimation · EVT · OPC",
    technicalMemorySummary:
      "UFO-INTERCEPT is the anomaly and collision interception runtime for AI JOKER-C2 B2G. It detects operational anomalies, identifies collision patterns and prepares a controlled collimation path that can reduce instability while leaving EVT/OPC technical trace.",
    runtimeInputs: [
      "anomalySignals",
      "collisionVector",
      "systemBoundary",
      "stabilityContext",
      "operatorConstraints",
      "tenantId",
      "workspaceId",
      "humanIpr"
    ],
    runtimeOutputs: [
      "anomalyClass",
      "collisionPrediction",
      "interceptDecision",
      "collimationPlan",
      "residualRisk",
      "evtCandidate",
      "opcTechnicalProofReceipt"
    ],
    operationalRules: [
      "Do not correct an anomaly without preserving its technical trace.",
      "Fail closed when system boundary is unknown.",
      "Separate anomaly detection from intervention decision.",
      "Use collimation only within explicit operational constraints.",
      "Report residual risk after any proposed correction."
    ],
    futureGithubModules: [
      {
        path: "lib/collision-intercept-runtime.ts",
        role: "UFO-INTERCEPT anomaly, collision and collimation runtime."
      },
      {
        path: "app/api/v1/collision/predict/route.ts",
        route: "/api/v1/collision/predict",
        method: "POST",
        role: "API endpoint for collision prediction."
      },
      {
        path: "app/api/v1/collimation/apply/route.ts",
        route: "/api/v1/collimation/apply",
        method: "POST",
        role: "API endpoint for controlled collimation application."
      }
    ]
  },

  UFO_OPERATIONAL_MODULE_REGISTRY: {
    module: "UFO_OPERATIONAL_MODULE_REGISTRY",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE_SET,
    title: "MODULO UFO ΦΩ – Operational Module Registry",
    shortTitle: "UFO Operational Module Registry",
    canonicalAxis: "Module Registry · Operational Profiles · B2G Use Cases · EVT · OPC",
    technicalMemorySummary:
      "MODULO UFO is the operational module registry for AI JOKER-C2 B2G. It organizes technical modules, their runtime roles, use-case classes, activation boundaries and audit requirements so that the SaaS can expose modular capabilities without losing governance.",
    runtimeInputs: [
      "moduleDefinition",
      "moduleScope",
      "activationPolicy",
      "tenantId",
      "workspaceId",
      "operatorRole",
      "traceRequirement"
    ],
    runtimeOutputs: [
      "moduleId",
      "moduleRegistryRecord",
      "activationStatus",
      "modulePolicy",
      "evtCandidate",
      "opcTechnicalProofReceipt"
    ],
    operationalRules: [
      "Every module must have an explicit activation boundary.",
      "Every module must declare input and output contracts.",
      "Every module must declare whether it blocks, simulates or executes.",
      "Registry entries must remain audit-ready and tenant-scoped.",
      "Module registration is technical governance, not legal certification."
    ],
    futureGithubModules: [
      {
        path: "lib/operational-module-registry.ts",
        role: "B2G operational module registry and activation metadata."
      },
      {
        path: "app/api/v1/modules/register/route.ts",
        route: "/api/v1/modules/register",
        method: "POST",
        role: "API endpoint for registering governed runtime modules."
      }
    ]
  },

  CQO_RND_THEORETICAL_FOUNDATION: {
    module: "CQO_RND_THEORETICAL_FOUNDATION",
    documentKind: HBCE_RND_THEORETICAL_FOUNDATION,
    title: "Cybernetica Quantistica Opponibile – R&D Theoretical Foundation",
    shortTitle: "Cybernetica Quantistica Opponibile",
    canonicalAxis: "R&D · Cybernetic Theory · Opposability · Auditability · EVT · OPC",
    technicalMemorySummary:
      "Cybernetica Quantistica Opponibile is the R&D theoretical foundation for the AI JOKER-C2 B2G technical stack. It should be stored as research context and documentation support, not as a primary executable API route.",
    runtimeInputs: [
      "researchContext",
      "theoreticalClaim",
      "operationalMapping",
      "traceRequirement",
      "tenantId",
      "workspaceId"
    ],
    runtimeOutputs: [
      "researchSummary",
      "operationalImplication",
      "documentationAnchor",
      "evtCandidate",
      "opcTechnicalProofReceipt"
    ],
    operationalRules: [
      "Use as R&D context, not as a primary runtime actuator.",
      "Translate theory into executable modules only after explicit engineering mapping.",
      "Keep legalCertification=false.",
      "Use OPC as technical proof receipt only."
    ],
    futureGithubModules: [
      {
        path: "docs/rd/cybernetic-quantum-opponibility.md",
        role: "R&D documentation and theoretical foundation for the B2G stack."
      }
    ]
  }
};

function cleanString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function upperIncludes(value: unknown, needle: string): boolean {
  return String(value ?? "").toUpperCase().includes(needle.toUpperCase());
}

function hasCorpusContamination(input: HbceB2gTechnicalProfileInput): boolean {
  const haystack = [
    input.docFamily,
    input.documentKind,
    input.module,
    input.volume,
    input.title,
    input.canonicalAxis,
    input.header,
    input.text
  ].join("\n");

  return (
    upperIncludes(haystack, "CORPUS_ESOTEROLOGIA_ERMETICA") ||
    upperIncludes(haystack, "CORPUS ESOTEROLOGIA ERMETICA") ||
    upperIncludes(haystack, "GLOSSARIO CANONICO") ||
    upperIncludes(haystack, "FONDAZIONE DISCIPLINARE")
  );
}

function hasQstateContamination(input: HbceB2gTechnicalProfileInput): boolean {
  const haystack = [input.header, input.text].join("\n");
  return upperIncludes(haystack, "QSTATE") || upperIncludes(haystack, "QUANTUMSTATES");
}

function hasDcttContamination(input: HbceB2gTechnicalProfileInput): boolean {
  const haystack = [input.canonicalAxis, input.header, input.text].join("\n");
  return upperIncludes(haystack, "DECISIONE · COSTO · TRACCIA · TEMPO");
}

function moduleFromInputOrClassification(
  input: HbceB2gTechnicalProfileInput,
  classification: HbceB2gTechnicalStackClassification
): HbceB2gTechnicalStackModule | null {
  const explicitModule = cleanString(input.module);

  if (explicitModule && explicitModule in B2G_TECHNICAL_MEMORY_DEFINITIONS) {
    return explicitModule as HbceB2gTechnicalStackModule;
  }

  if (classification.module && classification.module in B2G_TECHNICAL_MEMORY_DEFINITIONS) {
    return classification.module;
  }

  return null;
}

function kindFromDefinition(
  definition: HbceB2gTechnicalMemoryDefinition | null
): HbceB2gTechnicalStackDocumentKind | null {
  return definition?.documentKind ?? null;
}

function selectProfileDocumentKind(
  input: HbceB2gTechnicalProfileInput,
  definition: HbceB2gTechnicalMemoryDefinition | null
): HbceB2gTechnicalStackDocumentKind | null {
  const explicitKind = cleanString(input.documentKind);

  if (
    explicitKind === HBCE_TECHNICAL_GOVERNANCE_MODULE ||
    explicitKind === HBCE_TECHNICAL_GOVERNANCE_MODULE_SET ||
    explicitKind === HBCE_RND_THEORETICAL_FOUNDATION
  ) {
    return explicitKind;
  }

  return kindFromDefinition(definition);
}

function isSupportedTechnicalKind(kind: HbceB2gTechnicalStackDocumentKind | null): boolean {
  return (
    kind === HBCE_TECHNICAL_GOVERNANCE_MODULE ||
    kind === HBCE_TECHNICAL_GOVERNANCE_MODULE_SET ||
    kind === HBCE_RND_THEORETICAL_FOUNDATION
  );
}

function buildBaseFailurePayload(
  input: HbceB2gTechnicalProfileInput,
  classification: HbceB2gTechnicalStackClassification,
  failReason: HbceB2gTechnicalMemoryFailReason
): HbceB2gTechnicalMemoryPayload {
  const module = moduleFromInputOrClassification(input, classification);
  const definition = module ? B2G_TECHNICAL_MEMORY_DEFINITIONS[module] : null;
  const documentKind = selectProfileDocumentKind(input, definition);

  return {
    status: HBCE_B2G_TECHNICAL_MEMORY_FAIL,
    readyForIprSave: false,

    memoryType: "B2G_TECHNICAL_PROFILE_MEMORY",
    memoryMode: "TECHNICAL_SYNTHESIS_ONLY",
    collapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
    classifierRevision: HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION,

    sourceDocument: cleanString(input.filename ?? input.sourceFilename),
    documentProfileId: cleanString(input.documentProfileId),
    documentProfileStatus: cleanString(input.documentProfileStatus),
    fileHash: cleanString(input.fileHash),

    docFamily:
      input.docFamily === HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY
        ? HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY
        : null,
    documentKind,
    module,
    volume: null,
    title: cleanString(input.title) ?? definition?.title ?? null,
    shortTitle: definition?.shortTitle ?? null,
    canonicalAxis: cleanString(input.canonicalAxis) ?? definition?.canonicalAxis ?? null,

    technicalMemorySummary: null,
    runtimeInputs: [],
    runtimeOutputs: [],
    operationalRules: [],
    futureGithubModules: [],

    classification: {
      matched: classification.matched,
      confidence: classification.confidence,
      score: classification.score,
      matchedSignals: classification.matchedSignals,
      metadataLockApplied: classification.metadataLockApplied,
      metadataOverrideSource: classification.metadataOverrideSource
    },

    guards: {
      noRawTextPersistence: true,
      noQuantumStates: true,
      noQstateOutput: true,
      noCorpusCollapse: true,
      noSemanticEsoterologicalMemory: true,
      noDcttAxisForB2gTechnicalModules: true,
      legalCertification: false,
      opcBoundary: HBCE_B2G_OPC_BOUNDARY
    },

    coverage: {
      textCoverageStatus: cleanString(input.textCoverageStatus),
      fullDocumentCoverage: input.fullDocumentCoverage ?? null,
      documentChunksPersisted: input.documentChunksPersisted ?? null,
      documentChunksPersistedCount: input.documentChunksPersistedCount ?? null,
      truncationDetected: input.truncationDetected ?? null
    },

    identity: {
      derivedFromHumanIpr: cleanString(input.derivedFromHumanIpr),
      humanIpr: cleanString(input.humanIpr),
      runtimeIpr: cleanString(input.runtimeIpr),
      tenantId: cleanString(input.tenantId),
      workspaceId: cleanString(input.workspaceId)
    },

    trace: {
      evtId: cleanString(input.evtId),
      opcId: cleanString(input.opcId),
      auditId: cleanString(input.auditId),
      usageId: cleanString(input.usageId)
    },

    savePolicy: {
      saveRaw: false,
      saveTechnicalSynthesis: true,
      saveQuantumStates: false,
      saveFinalTechnicalMemoryOnly: true,
      reusableInPrompt: true,
      legalCertification: false,
      opc: HBCE_B2G_OPC_BOUNDARY
    },

    failReason
  };
}

export function buildHbceB2gTechnicalMemoryCollapse(
  input: HbceB2gTechnicalProfileInput
): HbceB2gTechnicalMemoryPayload {
  const classification = classifyHbceB2gTechnicalStackDocument(input);

  if (!cleanString(input.documentProfileId)) {
    return buildBaseFailurePayload(input, classification, "DOCUMENT_PROFILE_MISSING");
  }

  if (input.docFamily !== HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY) {
    return buildBaseFailurePayload(
      input,
      classification,
      "DOCUMENT_PROFILE_NOT_B2G_TECHNICAL_STACK"
    );
  }

  const module = moduleFromInputOrClassification(input, classification);

  if (!module) {
    return buildBaseFailurePayload(input, classification, "DOCUMENT_PROFILE_MODULE_MISSING");
  }

  const definition = B2G_TECHNICAL_MEMORY_DEFINITIONS[module];

  if (!definition) {
    return buildBaseFailurePayload(input, classification, "UNSUPPORTED_TECHNICAL_MODULE");
  }

  const documentKind = selectProfileDocumentKind(input, definition);

  if (!isSupportedTechnicalKind(documentKind)) {
    return buildBaseFailurePayload(input, classification, "DOCUMENT_KIND_NOT_TECHNICAL");
  }

  if (!classification.matched) {
    return buildBaseFailurePayload(input, classification, "CLASSIFIER_NO_MATCH");
  }

  if (hasQstateContamination(input)) {
    return buildBaseFailurePayload(
      input,
      classification,
      "DOCUMENT_PROFILE_CONTAMINATED_WITH_QSTATES"
    );
  }

  if (hasCorpusContamination(input)) {
    return buildBaseFailurePayload(
      input,
      classification,
      "DOCUMENT_PROFILE_CONTAMINATED_WITH_CORPUS"
    );
  }

  if (hasDcttContamination(input)) {
    return buildBaseFailurePayload(
      input,
      classification,
      "DOCUMENT_PROFILE_CONTAMINATED_WITH_DCTT"
    );
  }

  return {
    status: HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
    readyForIprSave: true,

    memoryType: "B2G_TECHNICAL_PROFILE_MEMORY",
    memoryMode: "TECHNICAL_SYNTHESIS_ONLY",
    collapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
    classifierRevision: HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION,

    sourceDocument: cleanString(input.filename ?? input.sourceFilename),
    documentProfileId: cleanString(input.documentProfileId),
    documentProfileStatus: cleanString(input.documentProfileStatus),
    fileHash: cleanString(input.fileHash),

    docFamily: HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY,
    documentKind,
    module,
    volume: definition.module === "UFO_OPERATIONAL_MODULE_REGISTRY" ? "SET" : "N/A",
    title: definition.title,
    shortTitle: definition.shortTitle,
    canonicalAxis: definition.canonicalAxis,

    technicalMemorySummary: definition.technicalMemorySummary,
    runtimeInputs: [...definition.runtimeInputs],
    runtimeOutputs: [...definition.runtimeOutputs],
    operationalRules: [...definition.operationalRules],
    futureGithubModules: [...definition.futureGithubModules],

    classification: {
      matched: classification.matched,
      confidence: classification.confidence,
      score: classification.score,
      matchedSignals: classification.matchedSignals,
      metadataLockApplied: classification.metadataLockApplied,
      metadataOverrideSource: classification.metadataOverrideSource
    },

    guards: {
      noRawTextPersistence: true,
      noQuantumStates: true,
      noQstateOutput: true,
      noCorpusCollapse: true,
      noSemanticEsoterologicalMemory: true,
      noDcttAxisForB2gTechnicalModules: true,
      legalCertification: false,
      opcBoundary: HBCE_B2G_OPC_BOUNDARY
    },

    coverage: {
      textCoverageStatus: cleanString(input.textCoverageStatus),
      fullDocumentCoverage: input.fullDocumentCoverage ?? null,
      documentChunksPersisted: input.documentChunksPersisted ?? null,
      documentChunksPersistedCount: input.documentChunksPersistedCount ?? null,
      truncationDetected: input.truncationDetected ?? null
    },

    identity: {
      derivedFromHumanIpr: cleanString(input.derivedFromHumanIpr),
      humanIpr: cleanString(input.humanIpr),
      runtimeIpr: cleanString(input.runtimeIpr),
      tenantId: cleanString(input.tenantId),
      workspaceId: cleanString(input.workspaceId)
    },

    trace: {
      evtId: cleanString(input.evtId),
      opcId: cleanString(input.opcId),
      auditId: cleanString(input.auditId),
      usageId: cleanString(input.usageId)
    },

    savePolicy: {
      saveRaw: false,
      saveTechnicalSynthesis: true,
      saveQuantumStates: false,
      saveFinalTechnicalMemoryOnly: true,
      reusableInPrompt: true,
      legalCertification: false,
      opc: HBCE_B2G_OPC_BOUNDARY
    },

    failReason: "NONE"
  };
}

export function buildQpccfTechnicalMemoryCollapse(
  input: Omit<HbceB2gTechnicalProfileInput, "module" | "docFamily">
): HbceB2gTechnicalMemoryPayload {
  return buildHbceB2gTechnicalMemoryCollapse({
    ...input,
    docFamily: HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY,
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    module: "QPCCF_PREDICTIVE_STABILITY_ENGINE"
  });
}

export function isHbceB2gTechnicalMemoryReady(
  payload: HbceB2gTechnicalMemoryPayload
): boolean {
  return (
    payload.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY &&
    payload.readyForIprSave === true &&
    payload.failReason === "NONE" &&
    payload.guards.noQuantumStates === true &&
    payload.guards.noCorpusCollapse === true &&
    payload.savePolicy.saveRaw === false &&
    payload.savePolicy.saveTechnicalSynthesis === true
  );
}

export function listHbceB2gTechnicalMemorySupportedModules(): Array<{
  module: HbceB2gTechnicalStackModule;
  documentKind: HbceB2gTechnicalStackDocumentKind;
  title: string;
  futureGithubModules: HbceB2gFutureGithubModule[];
}> {
  return HBCE_B2G_TECHNICAL_STACK_DEFINITIONS.map((definition) => {
    const memoryDefinition = B2G_TECHNICAL_MEMORY_DEFINITIONS[definition.module];

    return {
      module: definition.module,
      documentKind: memoryDefinition.documentKind,
      title: memoryDefinition.title,
      futureGithubModules: [...memoryDefinition.futureGithubModules]
    };
  });
}

/**
 * Safe public projection for UI/API responses.
 * This intentionally excludes raw text and never emits quantumStates.
 */
export function toPublicHbceB2gTechnicalMemoryPayload(
  payload: HbceB2gTechnicalMemoryPayload
): Record<string, unknown> {
  return {
    status: payload.status,
    readyForIprSave: payload.readyForIprSave,
    memoryType: payload.memoryType,
    memoryMode: payload.memoryMode,
    collapseRevision: payload.collapseRevision,
    classifierRevision: payload.classifierRevision,
    sourceDocument: payload.sourceDocument,
    documentProfileId: payload.documentProfileId,
    documentProfileStatus: payload.documentProfileStatus,
    fileHash: payload.fileHash,
    docFamily: payload.docFamily,
    documentKind: payload.documentKind,
    module: payload.module,
    volume: payload.volume,
    title: payload.title,
    shortTitle: payload.shortTitle,
    canonicalAxis: payload.canonicalAxis,
    technicalMemorySummary: payload.technicalMemorySummary,
    runtimeInputs: payload.runtimeInputs,
    runtimeOutputs: payload.runtimeOutputs,
    operationalRules: payload.operationalRules,
    futureGithubModules: payload.futureGithubModules,
    classification: payload.classification,
    guards: payload.guards,
    coverage: payload.coverage,
    identity: payload.identity,
    trace: payload.trace,
    savePolicy: payload.savePolicy,
    failReason: payload.failReason,
    legalCertification: false,
    opc: HBCE_B2G_OPC_BOUNDARY
  };
}
