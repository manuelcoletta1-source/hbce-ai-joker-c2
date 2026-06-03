import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";

import {
  ensureHbceDatabaseReady,
  listDocumentProfilesFromDatabase,
  queryHbceDatabase,
  toPublicDocumentProfile,
  upsertDocumentProfileToDatabase,
  type DocumentProfileDatabaseInput
} from "@/lib/ipr-database";
import {
  HBCE_SELF_PILOT_HUMAN_IPR,
  HBCE_SELF_PILOT_TENANT_ID,
  HBCE_SELF_PILOT_WORKSPACE_ID
} from "@/lib/ipr-database-schema";


/* --------------------------------------------------------------------------
 * INLINE HBCE B2G TECHNICAL STACK CLASSIFIER + TECHNICAL MEMORY COLLAPSE
 * Single-file deploy variant: no extra modified lib files required.
 * -------------------------------------------------------------------------- */

/**
 * HBCE B2G Technical Stack Classifier
 * ------------------------------------------------------------
 * Pure metadata classifier for AI JOKER-C2 SaaS B2G technical modules.
 *
 * Purpose:
 * - Classify QPCCF / CQD / AIQ JOKER / UFO-INTERCEPT / MODULO UFO / CQO
 *   before generic Corpus, MATRIX or HBCE operational fallbacks.
 * - Keep QPCCF out of CORPUS, V1, FOUNDATIONAL_VOLUME and generic MATRIX buckets.
 * - Provide deterministic metadata usable by app/api/files/route.ts.
 *
 * Boundary:
 * - This module does not persist memory.
 * - This module does not generate EVT/OPC.
 * - This module does not claim legal certification.
 */

const HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION =
  "HBCE-B2G-TECHNICAL-STACK-CLASSIFIER-v1_0_0";

const HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY =
  "HBCE_JOKER_C2_B2G_TECHNICAL_STACK" as const;

const HBCE_TECHNICAL_GOVERNANCE_MODULE =
  "TECHNICAL_GOVERNANCE_MODULE" as const;

const HBCE_TECHNICAL_GOVERNANCE_MODULE_SET =
  "TECHNICAL_GOVERNANCE_MODULE_SET" as const;

const HBCE_RND_THEORETICAL_FOUNDATION =
  "RND_THEORETICAL_FOUNDATION" as const;

const HBCE_B2G_LEGAL_CERTIFICATION = false as const;

const HBCE_B2G_OPC_BOUNDARY = "technical proof receipt only" as const;

type HbceB2gTechnicalStackDocFamily =
  typeof HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY;

type HbceB2gTechnicalStackDocumentKind =
  | typeof HBCE_TECHNICAL_GOVERNANCE_MODULE
  | typeof HBCE_TECHNICAL_GOVERNANCE_MODULE_SET
  | typeof HBCE_RND_THEORETICAL_FOUNDATION;

type HbceB2gTechnicalStackModule =
  | "QPCCF_PREDICTIVE_STABILITY_ENGINE"
  | "CQD_EVIDENCE_RECORD_ENGINE"
  | "AIQ_JOKER_POLICY_TRUTH_BUS"
  | "UFO_INTERCEPT_COLLISION_COLLIMATION_RUNTIME"
  | "UFO_OPERATIONAL_MODULE_REGISTRY"
  | "CQO_RND_THEORETICAL_FOUNDATION";

type HbceB2gTechnicalStackConfidence =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CANONICAL";

interface HbceB2gTechnicalStackClassifierInput {
  filename?: string | null;
  sourceFilename?: string | null;
  title?: string | null;
  header?: string | null;
  text?: string | null;
  mimeType?: string | null;
}

interface HbceB2gTechnicalStackClassification {
  matched: boolean;
  classifierRevision: string;
  confidence: HbceB2gTechnicalStackConfidence;
  score: number;
  module: HbceB2gTechnicalStackModule | null;
  docFamily: HbceB2gTechnicalStackDocFamily | null;
  documentKind: HbceB2gTechnicalStackDocumentKind | null;
  volume: "N/A" | "SET" | null;
  title: string | null;
  shortTitle: string | null;
  canonicalAxis: string | null;
  summary: string | null;
  keyTerms: string[];
  matchedSignals: string[];
  negativeGuards: {
    notCorpus: boolean;
    notMatrixDocument: boolean;
    notFoundationalVolume: boolean;
    notV1: boolean;
  };
  legalCertification: false;
  opcBoundary: typeof HBCE_B2G_OPC_BOUNDARY;
  metadataLockApplied: boolean;
  metadataOverrideSource: "HBCE_B2G_TECHNICAL_STACK_CLASSIFIER" | "NONE";
  failReason: "NONE" | "NO_B2G_TECHNICAL_STACK_MATCH";
}

interface ModuleDefinition {
  module: HbceB2gTechnicalStackModule;
  documentKind: HbceB2gTechnicalStackDocumentKind;
  volume: "N/A" | "SET";
  title: string;
  shortTitle: string;
  canonicalAxis: string;
  summary: string;
  keyTerms: string[];
  primarySignals: string[];
  secondarySignals: string[];
  antiSignals?: string[];
}

/**
 * Classifier definitions.
 * Order matters: QPCCF is first because generic MATRIX/HBCE fallbacks elsewhere
 * can otherwise steal the document when the text contains broad governance terms.
 */
const HBCE_B2G_TECHNICAL_STACK_DEFINITIONS: readonly ModuleDefinition[] = [
  {
    module: "QPCCF_PREDICTIVE_STABILITY_ENGINE",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    volume: "N/A",
    title:
      "UNI/QPCCF – Intercettazione predittiva delle collisioni e collimazione dei sistemi complessi",
    shortTitle: "QPCCF Predictive Stability Engine",
    canonicalAxis:
      "Lambda · delta · partial_t_Lambda · u(t) · EVT · OPC · AI_JOKER_C2_TECHNICAL_STACK",
    summary:
      "Modulo tecnico B2G per stabilità predittiva, rilevazione delle collisioni dinamiche e collimazione dei sistemi complessi tramite Lambda, delta, partial_t_Lambda e u(t).",
    keyTerms: [
      "QPCCF",
      "Lambda",
      "delta",
      "partial_t_Lambda",
      "u(t)",
      "collisione dinamica",
      "collimazione",
      "stabilità predittiva",
      "Digital Twin",
      "LBM",
      "CFD",
      "EVT",
      "OPC"
    ],
    primarySignals: [
      "qpccf",
      "uni/qpccf",
      "intercettazione predittiva",
      "intercettazione predittiva delle collisioni",
      "collimazione dei sistemi complessi",
      "modello lambda",
      "modello λ",
      "predictive stability engine"
    ],
    secondarySignals: [
      "\\lambda(t)",
      "λ(t)",
      "lambda(t)",
      "1+\\delta(t)",
      "1+δ(t)",
      "delta(t)",
      "\\partial_t\\lambda",
      "∂tλ",
      "partial_t_lambda",
      "u(t)",
      "\\widehat{\\lambda}",
      "stabilità operativa",
      "collisione",
      "|\\delta(t)| > 0.003",
      "|δ(t)| > 0.003",
      "|\\lambda(t)-1|\\le 0.003",
      "|λ(t)-1|≤0.003",
      "digital twin",
      "lattice boltzmann",
      "lbm",
      "cfd"
    ]
  },
  {
    module: "CQD_EVIDENCE_RECORD_ENGINE",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    volume: "N/A",
    title: "CQD – Crocefissione Quantistica del Dato",
    shortTitle: "CQD Evidence Record Engine",
    canonicalAxis: "T · I · E · L · Hash · EVT · OPC · AI_JOKER_C2_TECHNICAL_STACK",
    summary:
      "Modulo tecnico B2G per impacchettamento della prova tecnica del dato, record evidence e verifica auditabile tramite hash, evento e ricevuta tecnica.",
    keyTerms: [
      "CQD",
      "Crocefissione Quantistica del Dato",
      "evidence record",
      "hash",
      "EVT",
      "OPC",
      "technical proof receipt"
    ],
    primarySignals: [
      "cqd",
      "crocefissione quantistica del dato",
      "croceffissione quantistica del dato",
      "quantistica del dato",
      "evidence record"
    ],
    secondarySignals: [
      "technical proof receipt",
      "hash",
      "input hash",
      "output hash",
      "event hash",
      "opponibile",
      "audit",
      "evt",
      "opc"
    ]
  },
  {
    module: "AIQ_JOKER_POLICY_TRUTH_BUS",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    volume: "N/A",
    title: "AIQ JOKER – Policy Truth Bus",
    shortTitle: "AIQ JOKER Policy Truth Bus",
    canonicalAxis: "H · S · Q · A · Chi_tau · Policy · Fail-Closed · AI_JOKER_C2",
    summary:
      "Modulo tecnico B2G per policy bus, verità computabile, controllo fail-closed e valutazione della coerenza operativa delle richieste AI.",
    keyTerms: [
      "AIQ JOKER",
      "policy bus",
      "truth runtime",
      "fail-closed",
      "governance",
      "AI JOKER-C2"
    ],
    primarySignals: [
      "aiq joker",
      "🜏 aiq joker",
      "policy truth bus",
      "truth runtime",
      "joker policy"
    ],
    secondarySignals: [
      "m = h",
      "χτ",
      "chi_tau",
      "fail-closed",
      "policy",
      "truth",
      "runtime",
      "governance"
    ]
  },
  {
    module: "UFO_INTERCEPT_COLLISION_COLLIMATION_RUNTIME",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    volume: "N/A",
    title: "UFO–INTERCEPT ΦΩ – Collision / Collimation Runtime",
    shortTitle: "UFO-INTERCEPT Collision Collimation Runtime",
    canonicalAxis: "Anomaly · Intercept · Collision · Collimation · EVT · OPC",
    summary:
      "Modulo tecnico B2G per intercettazione di anomalie, collisioni operative e ritorno controllato verso uno stato stabile.",
    keyTerms: [
      "UFO-INTERCEPT",
      "anomaly intercept",
      "collision",
      "collimation",
      "runtime",
      "EVT",
      "OPC"
    ],
    primarySignals: [
      "ufo-intercept",
      "ufo–intercept",
      "ufo intercept",
      "intercept φ",
      "intercept φω",
      "collision collimation runtime"
    ],
    secondarySignals: [
      "anomalia",
      "anomaly",
      "intercettazione",
      "collisione",
      "collimazione",
      "runtime",
      "evt",
      "opc"
    ]
  },
  {
    module: "UFO_OPERATIONAL_MODULE_REGISTRY",
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE_SET,
    volume: "SET",
    title: "MODULO UFO ΦΩ – Operational Module Registry",
    shortTitle: "UFO Operational Module Registry",
    canonicalAxis: "Module Registry · Operational Profiles · B2G Use Cases · EVT · OPC",
    summary:
      "Registro modulare operativo per profili B2G, domini di applicazione e configurazione dei moduli UFO nel runtime JOKER-C2.",
    keyTerms: [
      "MODULO UFO",
      "module registry",
      "B2G",
      "operational profiles",
      "UFO-A",
      "UFO-C",
      "UFO-E",
      "UFO-S"
    ],
    primarySignals: [
      "modulo ufo",
      "ufo φ",
      "ufo φω",
      "operational module registry",
      "module registry"
    ],
    secondarySignals: [
      "ufo-a",
      "ufo-c",
      "ufo-e",
      "ufo-s",
      "moduli",
      "registry",
      "use-case",
      "b2g"
    ]
  },
  {
    module: "CQO_RND_THEORETICAL_FOUNDATION",
    documentKind: HBCE_RND_THEORETICAL_FOUNDATION,
    volume: "N/A",
    title: "Cybernetica Quantistica Opponibile – R&D Theoretical Foundation",
    shortTitle: "Cybernetica Quantistica Opponibile",
    canonicalAxis: "R&D · Cybernetic Theory · Opposability · Auditability · EVT · OPC",
    summary:
      "Fondamento teorico R&D dello stack tecnico HBCE/JOKER-C2, usato come whitepaper e base dottrinale non primaria per le API.",
    keyTerms: [
      "Cybernetica Quantistica Opponibile",
      "CQO",
      "R&D",
      "opponibilità",
      "auditability",
      "EVT",
      "OPC"
    ],
    primarySignals: [
      "cybernetica quantistica opponibile",
      "cibernetica quantistica opponibile",
      "cqo",
      "quantistica opponibile"
    ],
    secondarySignals: [
      "opponibilità",
      "opponibile",
      "ricerca",
      "r&d",
      "whitepaper",
      "audit",
      "evt",
      "opc"
    ]
  }
] as const;

function normalizeHbceClassifierText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\u0000/g, " ")
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildHbceClassifierHaystack(
  input: HbceB2gTechnicalStackClassifierInput
): string {
  return normalizeHbceClassifierText(
    [
      input.filename,
      input.sourceFilename,
      input.title,
      input.header,
      input.text,
      input.mimeType
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function collectMatchedSignals(haystack: string, signals: readonly string[]): string[] {
  const matches: string[] = [];

  for (const signal of signals) {
    const normalizedSignal = normalizeHbceClassifierText(signal);
    if (normalizedSignal && haystack.includes(normalizedSignal)) {
      matches.push(signal);
    }
  }

  return Array.from(new Set(matches));
}

function scoreDefinition(
  haystack: string,
  definition: ModuleDefinition
): { score: number; matchedSignals: string[] } {
  const primaryMatches = collectMatchedSignals(haystack, definition.primarySignals);
  const secondaryMatches = collectMatchedSignals(haystack, definition.secondarySignals);
  const antiMatches = collectMatchedSignals(haystack, definition.antiSignals ?? []);

  const score = primaryMatches.length * 10 + secondaryMatches.length * 3 - antiMatches.length * 12;

  return {
    score,
    matchedSignals: [...primaryMatches, ...secondaryMatches]
  };
}

function confidenceFromScore(score: number): HbceB2gTechnicalStackConfidence {
  if (score >= 25) return "CANONICAL";
  if (score >= 16) return "HIGH";
  if (score >= 9) return "MEDIUM";
  if (score >= 4) return "LOW";
  return "NONE";
}

function classifyHbceB2gTechnicalStackDocument(
  input: HbceB2gTechnicalStackClassifierInput
): HbceB2gTechnicalStackClassification {
  const haystack = buildHbceClassifierHaystack(input);

  let bestDefinition: ModuleDefinition | null = null;
  let bestScore = 0;
  let bestSignals: string[] = [];

  for (const definition of HBCE_B2G_TECHNICAL_STACK_DEFINITIONS) {
    const candidate = scoreDefinition(haystack, definition);

    if (candidate.score > bestScore) {
      bestDefinition = definition;
      bestScore = candidate.score;
      bestSignals = candidate.matchedSignals;
    }
  }

  const confidence = confidenceFromScore(bestScore);
  const matched = Boolean(bestDefinition && bestScore >= 9);

  if (!matched || !bestDefinition) {
    return {
      matched: false,
      classifierRevision: HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION,
      confidence: "NONE",
      score: bestScore,
      module: null,
      docFamily: null,
      documentKind: null,
      volume: null,
      title: null,
      shortTitle: null,
      canonicalAxis: null,
      summary: null,
      keyTerms: [],
      matchedSignals: bestSignals,
      negativeGuards: {
        notCorpus: true,
        notMatrixDocument: false,
        notFoundationalVolume: false,
        notV1: false
      },
      legalCertification: HBCE_B2G_LEGAL_CERTIFICATION,
      opcBoundary: HBCE_B2G_OPC_BOUNDARY,
      metadataLockApplied: false,
      metadataOverrideSource: "NONE",
      failReason: "NO_B2G_TECHNICAL_STACK_MATCH"
    };
  }

  return {
    matched: true,
    classifierRevision: HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION,
    confidence,
    score: bestScore,
    module: bestDefinition.module,
    docFamily: HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY,
    documentKind: bestDefinition.documentKind,
    volume: bestDefinition.volume,
    title: bestDefinition.title,
    shortTitle: bestDefinition.shortTitle,
    canonicalAxis: bestDefinition.canonicalAxis,
    summary: bestDefinition.summary,
    keyTerms: [...bestDefinition.keyTerms],
    matchedSignals: bestSignals,
    negativeGuards: {
      notCorpus: true,
      notMatrixDocument: bestDefinition.module === "QPCCF_PREDICTIVE_STABILITY_ENGINE",
      notFoundationalVolume: bestDefinition.module === "QPCCF_PREDICTIVE_STABILITY_ENGINE",
      notV1: bestDefinition.module === "QPCCF_PREDICTIVE_STABILITY_ENGINE"
    },
    legalCertification: HBCE_B2G_LEGAL_CERTIFICATION,
    opcBoundary: HBCE_B2G_OPC_BOUNDARY,
    metadataLockApplied: true,
    metadataOverrideSource: "HBCE_B2G_TECHNICAL_STACK_CLASSIFIER",
    failReason: "NONE"
  };
}

function isHbceB2gTechnicalStackDocument(
  input: HbceB2gTechnicalStackClassifierInput
): boolean {
  return classifyHbceB2gTechnicalStackDocument(input).matched;
}

function isQpccfPredictiveStabilityDocument(
  input: HbceB2gTechnicalStackClassifierInput
): boolean {
  const classification = classifyHbceB2gTechnicalStackDocument(input);
  return classification.module === "QPCCF_PREDICTIVE_STABILITY_ENGINE";
}

function buildHbceB2gTechnicalStackProfileMetadata(
  input: HbceB2gTechnicalStackClassifierInput
): Record<string, unknown> | null {
  const classification = classifyHbceB2gTechnicalStackDocument(input);

  if (!classification.matched) {
    return null;
  }

  return {
    classifierRevision: classification.classifierRevision,
    docFamily: classification.docFamily,
    documentKind: classification.documentKind,
    module: classification.module,
    volume: classification.volume,
    title: classification.title,
    shortTitle: classification.shortTitle,
    canonicalAxis: classification.canonicalAxis,
    summary: classification.summary,
    keyTerms: classification.keyTerms,
    matchedSignals: classification.matchedSignals,
    confidence: classification.confidence,
    score: classification.score,
    metadataLockApplied: classification.metadataLockApplied,
    metadataOverrideSource: classification.metadataOverrideSource,
    negativeGuards: classification.negativeGuards,
    legalCertification: classification.legalCertification,
    opcBoundary: classification.opcBoundary
  };
}

/**
 * Convenience helper for route-level precedence:
 * call this before generic Corpus / Matrix / HBCE fallback inference.
 */
function maybeApplyHbceB2gTechnicalStackMetadata<T extends Record<string, unknown>>(
  baseProfile: T,
  input: HbceB2gTechnicalStackClassifierInput
): T & Record<string, unknown> {
  const metadata = buildHbceB2gTechnicalStackProfileMetadata(input);

  if (!metadata) {
    return baseProfile;
  }

  return {
    ...baseProfile,
    ...metadata,
    profileStatus: baseProfile.profileStatus ?? "ACTIVE",
    quality: baseProfile.quality ?? "CANONICAL",
    reusableInPrompt: baseProfile.reusableInPrompt ?? true
  };
}

/**
 * Fail-closed guard for QPCCF contamination detection.
 * Useful in tests after classification.
 */
function assertQpccfMetadataIsNotContaminated(
  metadata: Record<string, unknown>
): { ok: boolean; failReason: "NONE" | "QPCCF_METADATA_CONTAMINATED" } {
  const module = String(metadata.module ?? "");
  const docFamily = String(metadata.docFamily ?? "");
  const title = String(metadata.title ?? "");
  const volume = String(metadata.volume ?? "");
  const documentKind = String(metadata.documentKind ?? "");

  const isQpccf = module === "QPCCF_PREDICTIVE_STABILITY_ENGINE";

  if (!isQpccf) {
    return { ok: true, failReason: "NONE" };
  }

  const contaminated =
    docFamily !== HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY ||
    volume !== "N/A" ||
    title === "MATRIX" ||
    title === "HBCE JOKER-C2 CLEAN RUNTIME TEXT" ||
    documentKind === "FOUNDATIONAL_VOLUME";

  return contaminated
    ? { ok: false, failReason: "QPCCF_METADATA_CONTAMINATED" }
    : { ok: true, failReason: "NONE" };
}


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

const HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION =
  "HBCE-B2G-TECHNICAL-MEMORY-COLLAPSE-v1_0_0";

const HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY =
  "B2G_TECHNICAL_PROFILE_MEMORY_READY" as const;

const HBCE_B2G_TECHNICAL_MEMORY_FAIL =
  "B2G_TECHNICAL_PROFILE_MEMORY_FAIL" as const;

type HbceB2gTechnicalMemoryStatus =
  | typeof HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
  | typeof HBCE_B2G_TECHNICAL_MEMORY_FAIL;

type HbceB2gTechnicalMemoryFailReason =
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

interface HbceB2gTechnicalProfileInput extends HbceB2gTechnicalStackClassifierInput {
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

interface HbceB2gFutureGithubModule {
  path: string;
  role: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route?: string;
}

interface HbceB2gTechnicalMemoryPayload {
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

function buildHbceB2gTechnicalMemoryCollapse(
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

function buildQpccfTechnicalMemoryCollapse(
  input: Omit<HbceB2gTechnicalProfileInput, "module" | "docFamily">
): HbceB2gTechnicalMemoryPayload {
  return buildHbceB2gTechnicalMemoryCollapse({
    ...input,
    docFamily: HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY,
    documentKind: HBCE_TECHNICAL_GOVERNANCE_MODULE,
    module: "QPCCF_PREDICTIVE_STABILITY_ENGINE"
  });
}

function isHbceB2gTechnicalMemoryReady(
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

function listHbceB2gTechnicalMemorySupportedModules(): Array<{
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
function toPublicHbceB2gTechnicalMemoryPayload(
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


/* --------------------------------------------------------------------------
 * END INLINE HBCE B2G TECHNICAL STACK BLOCK
 * -------------------------------------------------------------------------- */



export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const FILE_ROUTE_REVISION = "HBCE-API-FILES-DOCUMENT-PROFILE-REGISTRY-v2-DOCUMENT_PROFILE_CANONICAL_FIX-v3-ALIEN_CODE_V4_PROFILE_FIX-v4-PORTALE_V5_EMPTY_RESPONSE_GUARD-v5_1-LONG_DOCUMENT_FULL_INGESTION_ENGINE-v6_0-LONG_DOCUMENT_PERSISTENT_CHUNKS-v6_1-SELF_DIAGNOSTIC_ENDPOINT-v6_2-LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_3-QPCCF_TECHNICAL_STACK_METADATA_LOCK-v6_4-B2G_TECHNICAL_STACK_CLASSIFIER_LIB-v6_5-B2G_TECHNICAL_MEMORY_COLLAPSE-v6_6-B2G_TECHNICAL_MEMORY_PAYLOAD_EXPOSURE-v6_7_1-SINGLE_FILE";
const DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION = "LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_3";
const DOCUMENT_CHUNK_PERSISTENCE_SCOPE = "HUMAN_IPR_TENANT_WORKSPACE_PROFILE_FILE_ID_FILE_HASH_CHUNK";
const DOCUMENT_CHUNK_DEPLOY_PROOF_REVISION = "FILES_ROUTE_DEPLOY_PROOF_AND_CHUNK_DB_DIAGNOSTIC-v6_3_3";


type FileStatus =
  | "TEXT_READY"
  | "PDF_INGESTION_READY"
  | "PDF_METADATA_ONLY"
  | "PDF_INGESTION_FAIL"
  | "REFERENCE_ONLY"
  | "REJECTED";


type FileMode =
  | "TEXT"
  | "PDF_TEXT"
  | "REFERENCE_ONLY"
  | "REJECTED";


type TextSourceKind =
  | "TEXT"
  | "CONTENT"
  | "PREVIEW"
  | "PDF_DIRECT_TEXT"
  | "PDF_BINARY"
  | "PDF_BASE64"
  | "PDF_DATA_URL"
  | "NONE";


type TextCoverageStatus =
  | "TEXT_READY_FULL"
  | "TEXT_READY_PARTIAL"
  | "TEXT_PREVIEW_ONLY"
  | "TEXT_EMPTY"
  | "TEXT_UNSUPPORTED";


type LongDocumentMode =
  | "INLINE_TEXT"
  | "CHUNKED_FULL_TEXT"
  | "PREVIEW_ONLY"
  | "REFERENCE_ONLY"
  | "REJECTED";


type DocumentOutlineEntry = {
  index: number;
  sectionType: "TITLE" | "PART" | "CHAPTER" | "MAJOR_SECTION" | "SUBSECTION" | "APPENDIX" | "GLOSSARY_ENTRY" | "CONCLUSION" | "BOUNDARY" | "SECTION";
  label: string;
  lineNumber: number;
  charStart: number;
  headingPath: string;
};


type DocumentOutlineSummary = {
  outlineStatus: "READY" | "EMPTY";
  partsDetected: number;
  chaptersDetected: number;
  appendicesDetected: number;
  firstSectionDetected: string | null;
  lastSectionDetected: string | null;
  lastAppendixDetected: string | null;
  boundaryDetected: boolean;
  conclusionDetected: boolean;
  entries: DocumentOutlineEntry[];
};


type LongDocumentChunk = {
  id: string;
  documentProfileId: string | null;
  fileId: string;
  filename: string;
  fileHash: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  text: string;
  textHash: string;
  headingPath: string | null;
  sectionType: string | null;
  createdAt: string;
};


type DocumentChunkPersistenceStatus =
  | "PERSISTED"
  | "DATABASE_NOT_READY"
  | "PERSISTENCE_FAILED"
  | "SKIPPED";


type DocumentChunkPersistenceResult = {
  attempted: boolean;
  ok: boolean;
  status: DocumentChunkPersistenceStatus;
  table: "document_text_chunks";
  documentProfileId: string | null;
  fileId: string;
  filename: string;
  fileHash: string;
  chunkCount: number;
  persistedCount: number;
  insertedCount: number;
  databaseVerified: boolean;
  verificationCount: number;
  persistenceRevision: string;
  persistenceScope: string;
  derivedFromHumanIpr: string | null;
  tenantId: string | null;
  workspaceId: string | null;
  fullDocumentCoverage: boolean;
  textCoverageStatus: TextCoverageStatus;
  error: string | null;
  sqlHash: string | null;
  verificationSqlHash: string | null;
  durationMs: number;
};


type DocumentProfilePersistenceStatus =
  | "PERSISTED"
  | "DATABASE_NOT_READY"
  | "PERSISTENCE_FAILED"
  | "SKIPPED";


type RuntimeFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  text?: string;
  content?: string;
  preview?: string;
  base64?: string;
  dataUrl?: string;
  bytes?: number[];
  buffer?: {
    data?: number[];
  };
  role?: string;
};


type StoredRuntimeFile = {
  id: string;
  name: string;
  mimeType: string;
  type: string;
  size: number;
  text: string;
  content: string;
  role: string;
  textLength: number;
  fullTextLength: number;
  promptTextLength: number;
  sourceFileHash: string;
  normalizedTextHash: string;
  runtimePromptTextHash: string;
  sourceByteLength: number;
  normalizedTextLength: number;
  textSourceKind: TextSourceKind;
  textCoverageStatus: TextCoverageStatus;
  fullDocumentCoverage: boolean;
  fullDocumentCoverageReason: string;
  longDocumentMode: LongDocumentMode;
  documentOutline: DocumentOutlineSummary;
  documentChunkCount: number;
  documentChunks: LongDocumentChunk[];
  documentChunksPersisted?: boolean | null;
  documentChunksPersistedCount?: number | null;
  documentChunkPersistenceStatus?: DocumentChunkPersistenceStatus | null;
  documentChunkPersistenceReason?: string | null;
  documentChunkPersistenceError?: string | null;
  documentChunkPersistenceRevision?: string | null;
  documentChunkPersistenceScope?: string | null;
  documentChunkDerivedFromHumanIpr?: string | null;
  documentChunkDatabaseVerified?: boolean | null;
  documentChunkVerificationCount?: number | null;
  documentChunkVerificationSqlHash?: string | null;
  fileHash: string;
  status: FileStatus;
  mode: FileMode;
  reason: string;
  documentProfileId?: string | null;
  documentProfileStatus?: DocumentProfilePersistenceStatus | null;
  documentProfileHash?: string | null;
  documentProfileReason?: string | null;
  b2gTechnicalMemory?: Record<string, unknown> | null;
  b2gTechnicalMemoryStatus?: string | null;
  b2gTechnicalMemoryReady?: boolean | null;
  b2gTechnicalMemoryReadyForIprSave?: boolean | null;
  b2gTechnicalMemoryFailReason?: string | null;
  b2gTechnicalMemoryCollapseRevision?: string | null;
  createdAt: string;
  updatedAt: string;
};


type FilesBody = {
  sessionId?: string;
  threadId?: string;
  humanIpr?: string;
  runtimeIpr?: string;
  tenantId?: string;
  workspaceId?: string;
  sourceKind?: string;
  files?: RuntimeFile[];
  replace?: boolean;
  clear?: boolean;
};

type DocumentProfilePersistenceResult = {
  fileId: string;
  filename: string;
  fileHash: string;
  attempted: boolean;
  ok: boolean;
  status: DocumentProfilePersistenceStatus;
  rowCount: number;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
  profile: Record<string, unknown> | null;
  chunks: DocumentChunkPersistenceResult | null;
  technicalMemory: Record<string, unknown> | null;
  input: {
    docFamily: string | null;
    volume: string | null;
    title: string | null;
    canonicalAxis: string | null;
    keyTerms: string[];
    reusableInPrompt: boolean;
    textCoverageStatus: TextCoverageStatus;
    fullDocumentCoverage: boolean;
    chunkCount: number;
    outlineStatus: DocumentOutlineSummary["outlineStatus"];
    partsDetected: number;
    chaptersDetected: number;
    appendicesDetected: number;
  };
};

type DocumentProfileContext = {
  sessionId: string;
  threadId?: string | null;
  humanIpr: string;
  runtimeIpr: string;
  tenantId: string;
  workspaceId: string;
  sourceKind: string;
};


type CanonicalCorpusVolumeProfile = {
  volume: "V1" | "V2" | "V3" | "V4" | "V5";
  title: string;
  summary: string;
  keyTerms: string[];
};

const DOCUMENT_PROFILE_CANONICAL_FIX_REVISION = "DOCUMENT_PROFILE_PORTALE_V5_EMPTY_RESPONSE_GUARD_v5_1-QPCCF_TECHNICAL_STACK_METADATA_LOCK_v6_4-B2G_TECHNICAL_STACK_CLASSIFIER_LIB_v6_5-B2G_TECHNICAL_MEMORY_COLLAPSE_v6_6-B2G_TECHNICAL_MEMORY_PAYLOAD_EXPOSURE_v6_7_1_SINGLE_FILE";
const QPCCF_TECHNICAL_STACK_METADATA_LOCK_REVISION = "QPCCF_TECHNICAL_STACK_METADATA_LOCK_v6_4";
const QPCCF_DOC_FAMILY = "HBCE_JOKER_C2_B2G_TECHNICAL_STACK";
const QPCCF_DOCUMENT_KIND = "TECHNICAL_GOVERNANCE_MODULE";
const QPCCF_MODULE = "QPCCF_PREDICTIVE_STABILITY_ENGINE";
const QPCCF_VOLUME = "N/A";
const QPCCF_TITLE = "UNI/QPCCF – Intercettazione predittiva delle collisioni e collimazione dei sistemi complessi";
const QPCCF_CANONICAL_AXIS = "Lambda · delta · partial_t_Lambda · u(t) · EVT · OPC · AI_JOKER_C2_TECHNICAL_STACK";
const QPCCF_EXPECTED_SOURCE_HASH = "sha256:cf30e54ce29f4f51b4370990d8229b183320b857deb628e1abb505149c03731c";
const QPCCF_KEY_TERMS = [
  "QPCCF",
  "Predictive Stability Engine",
  "Lambda",
  "delta",
  "partial_t_Lambda",
  "u(t)",
  "Intercettazione predittiva",
  "Collisioni",
  "Collimazione",
  "Stabilità predittiva",
  "Digital Twin",
  "LBM",
  "CFD",
  "EVT",
  "OPC",
  "MATRIX"
];

const CANONICAL_CORPUS_VOLUME_PROFILES: Record<CanonicalCorpusVolumeProfile["volume"], CanonicalCorpusVolumeProfile> = {
  V1: {
    volume: "V1",
    title: "ESOTEROLOGIA",
    summary:
      "Profilo documento ESOTEROLOGIA Volume I del CORPUS ESOTEROLOGIA ERMETICA: fonda il criterio del Reale operativo e l'asse Decisione · Costo · Traccia · Tempo come grammatica di verificazione della realtà operativa.",
    keyTerms: [
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Reale operativo",
      "Corpus Esoterologia Ermetica",
      "Esoterologia",
      "Scienza esoterologica",
      "Soglia di realtà",
      "Traccia opponibile",
      "IPR"
    ]
  },
  V2: {
    volume: "V2",
    title: "MATRIX / 05-04-2026",
    summary:
      "Profilo documento MATRIX / 05-04-2026 Volume II del CORPUS ESOTEROLOGIA ERMETICA: trasferisce la griglia Decisione · Costo · Traccia · Tempo nel dominio istituzionale, leggendo istituzioni, Stato, esecuzione, fiscalità, debito, sicurezza, forza, conflitto, decadimento e ordine globale come sequenze operative distribuite.",
    keyTerms: [
      "Matrix",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Reale operativo",
      "Corpus Esoterologia Ermetica",
      "Esoterologia",
      "Dominio istituzionale",
      "Istituzione come sequenza distribuita",
      "Stato come configurazione operativa",
      "Esecuzione",
      "Fiscalità",
      "Debito",
      "Sicurezza",
      "Forza",
      "Conflitto",
      "Decadimento",
      "Ordine globale",
      "Regime di validità",
      "Verificabilità distribuita",
      "IPR",
      "MATRIX"
    ]
  },
  V3: {
    volume: "V3",
    title: "LEX HERMETICUM",
    summary:
      "Profilo documento LEX HERMETICUM Volume III del CORPUS ESOTEROLOGIA ERMETICA: formalizza validità, opponibilità, responsabilità, traccia e decadimento nel dominio istituzionale, con l'asse Decisione · Costo · Traccia · Tempo come criterio operativo.",
    keyTerms: [
      "Lex Hermeticum",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Regime di validità",
      "Validità operativa",
      "Opponibilità",
      "Responsabilità",
      "Traccia opponibile",
      "Decadimento",
      "Corpus Esoterologia Ermetica",
      "Esoterologia",
      "IPR",
      "EVT",
      "OPC"
    ]
  },
  V4: {
    volume: "V4",
    title: "ALIEN CODE",
    summary:
      "Profilo documento ALIEN CODE Volume IV del CORPUS ESOTEROLOGIA ERMETICA: formalizza il framework operativo per la tracciabilità rascensionale, l'interfaccia rascensionale e l'accoppiamento organismo-sistema attraverso Decisione · Costo · Traccia · Tempo.",
    keyTerms: [
      "Alien Code",
      "Codice alieno",
      "Volume IV",
      "Framework operativo per la tracciabilità rascensionale",
      "Tracciabilità rascensionale",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Interfaccia rascensionale",
      "Unità qubitronica",
      "Riconconicità organismo-sistema",
      "Accoppiamento organismo-sistema",
      "Accoppiamento forzato",
      "Fallimento del coupling",
      "Soglia di realtà",
      "Evento operativo",
      "Campo rascensionale",
      "Loop biocibernetico",
      "Traccia opponibile",
      "Decadimento",
      "Corpus Esoterologia Ermetica",
      "IPR"
    ]
  },
  V5: {
    volume: "V5",
    title: "IL PORTALE DELL’ANTICRISTO",
    summary:
      "Profilo documento IL PORTALE DELL’ANTICRISTO Volume V del CORPUS ESOTEROLOGIA ERMETICA: tratta Apocalisse come regime di esposizione, Anticristo come configurazione di rottura del campo umano e Portale come soglia operativa verificabile tramite Decisione · Costo · Traccia · Tempo.",
    keyTerms: [
      "Il Portale dell’Anticristo",
      "Apocalisse",
      "Anticristo",
      "Portale",
      "Regime di esposizione",
      "Soglia operativa",
      "Decisione",
      "Costo",
      "Traccia",
      "Tempo",
      "Reale operativo",
      "Traccia opponibile",
      "Continuità esposta",
      "Scienza esoterologica",
      "Informazione come incidenza sul campo umano",
      "Corpus Esoterologia Ermetica",
      "IPR"
    ]
  }
};


type FileStore = Map<string, StoredRuntimeFile[]>;
type DocumentChunkStore = Map<string, LongDocumentChunk[]>;


type PdfExtractionResult = {
  text: string;
  source: "DIRECT_TEXT" | "PDF_BINARY" | "PDF_BASE64" | "PDF_DATA_URL" | "NONE";
  hadPdfPayload: boolean;
  failed: boolean;
  reason: string;
};


declare global {
  var __HBCE_JOKER_C2_FILE_STORE__: FileStore | undefined;
  var __HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__: DocumentChunkStore | undefined;
}


const MAX_FILES_PER_SESSION = 12;
const MAX_TEXT_CHARS_PER_FILE = 20_000_000;
const MAX_TOTAL_TEXT_CHARS_PER_SESSION = 20_000_000;
const MAX_FILE_NAME_LENGTH = 180;
const LONG_DOCUMENT_CHUNK_TARGET_CHARS = 24_000;
const LONG_DOCUMENT_CHUNK_OVERLAP_CHARS = 600;
const LONG_DOCUMENT_CHUNK_INSERT_BATCH_SIZE = 16;
const FULL_DOCUMENT_OUTLINE_MAX_ENTRIES = 256;


const TEXT_MIME_PREFIXES = ["text/"];


const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/typescript",
  "application/xml",
  "application/xhtml+xml",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "application/csv",
  "application/ld+json",
  "application/markdown",
  "application/x-ndjson",
  "application/octet-stream"
]);


const PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
  "text/x-pdf"
]);


const REFERENCE_ONLY_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);


const CANONICAL_AXIS_DCTT = "Decisione · Costo · Traccia · Tempo";

const DOCUMENT_KEY_TERM_CANDIDATES = [
  "Matrix",
  "Decisione",
  "Costo",
  "Traccia",
  "Tempo",
  "Reale operativo",
  "Corpus Esoterologia Ermetica",
  "Esoterologia",
  "Dominio istituzionale",
  "Istituzione come sequenza distribuita",
  "Stato come configurazione operativa",
  "Esecuzione",
  "Fiscalità",
  "Debito",
  "Sicurezza",
  "Forza",
  "Conflitto",
  "Decadimento",
  "Ordine globale",
  "Regime di validità",
  "Traccia opponibile",
  "Verificabilità distribuita",
  "APOKALYPSIS",
  "U.S.E.",
  "Sovranità digitale",
  "Voto digitale federato",
  "Alien Code",
  "COD 1 Alieno",
  "Interfaccia rascensionale",
  "Il Portale dell’Anticristo",
  "Apocalisse",
  "Anticristo",
  "Portale",
  "Regime di esposizione",
  "Soglia operativa",
  "Apostasia globale",
  "1110 giorni",
  "Irreintegrabilità",
  "IPR",
  "EVT",
  "OPC",
  "MATRIX"
];


function getFileStore(): FileStore {
  if (!globalThis.__HBCE_JOKER_C2_FILE_STORE__) {
    globalThis.__HBCE_JOKER_C2_FILE_STORE__ = new Map();
  }


  return globalThis.__HBCE_JOKER_C2_FILE_STORE__;
}


function getDocumentChunkStore(): DocumentChunkStore {
  if (!globalThis.__HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__) {
    globalThis.__HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__ = new Map();
  }


  return globalThis.__HBCE_JOKER_C2_DOCUMENT_CHUNK_STORE__;
}


function nowIso(): string {
  return new Date().toISOString();
}


function normalizeSessionId(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }


  return `JOKER-SESSION-${Date.now()}`;
}


function normalizeFileName(value: unknown, index: number): string {
  if (typeof value !== "string" || !value.trim()) {
    return `file_${index + 1}`;
  }


  return value.trim().slice(0, MAX_FILE_NAME_LENGTH);
}


function inferMimeTypeFromName(name: string): string | null {
  const normalizedName = name.toLowerCase();


  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }


  if (normalizedName.endsWith(".txt")) {
    return "text/plain";
  }


  if (normalizedName.endsWith(".md") || normalizedName.endsWith(".markdown")) {
    return "application/markdown";
  }


  if (normalizedName.endsWith(".json")) {
    return "application/json";
  }


  if (normalizedName.endsWith(".csv")) {
    return "application/csv";
  }


  if (normalizedName.endsWith(".xml")) {
    return "application/xml";
  }


  if (normalizedName.endsWith(".yaml") || normalizedName.endsWith(".yml")) {
    return "application/yaml";
  }


  if (normalizedName.endsWith(".ts")) {
    return "application/typescript";
  }


  if (normalizedName.endsWith(".tsx")) {
    return "application/typescript";
  }


  if (normalizedName.endsWith(".js")) {
    return "application/javascript";
  }


  if (normalizedName.endsWith(".jsx")) {
    return "application/javascript";
  }


  return null;
}


function normalizeMimeType(file: RuntimeFile, fileName: string): string {
  const inferredFromName = inferMimeTypeFromName(fileName);


  if (inferredFromName) {
    return inferredFromName;
  }


  const mimeType =
    typeof file.mimeType === "string" && file.mimeType.trim()
      ? file.mimeType.trim()
      : typeof file.type === "string" && file.type.trim()
        ? file.type.trim()
        : "text/plain";


  return mimeType.toLowerCase();
}


function normalizeRole(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }


  return "context";
}


function buildHash(value: unknown): string {
  const normalized =
    typeof value === "string" ? value : JSON.stringify(value ?? null);


  return `sha256:${createHash("sha256").update(normalized).digest("hex")}`;
}


function isTextMimeType(mimeType: string): boolean {
  if (TEXT_MIME_TYPES.has(mimeType)) {
    return true;
  }


  return TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}


function isPdfMimeType(mimeType: string, name: string): boolean {
  return PDF_MIME_TYPES.has(mimeType) || name.toLowerCase().endsWith(".pdf");
}


function isReferenceOnlyMimeType(mimeType: string): boolean {
  return REFERENCE_ONLY_MIME_TYPES.has(mimeType);
}


function isPromptTextStatus(status: FileStatus): boolean {
  return status === "TEXT_READY" || status === "PDF_INGESTION_READY";
}


function safeTrimText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}


function looksLikeDataUrl(value: string): boolean {
  return /^data:[^;]+;base64,/i.test(value.trim());
}


function looksLikePdfBinaryString(value: string): boolean {
  const trimmed = value.trimStart();


  return trimmed.startsWith("%PDF") || trimmed.includes("%PDF-");
}


function looksLikeBase64(value: string): boolean {
  const normalized = value.trim();


  if (normalized.length < 32) {
    return false;
  }


  if (normalized.includes("\n") || normalized.includes("\r")) {
    return false;
  }


  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
}


function looksLikeReadableExtractedText(value: string): boolean {
  const normalized = value.trim();


  if (!normalized) {
    return false;
  }


  if (looksLikeDataUrl(normalized) || looksLikePdfBinaryString(normalized)) {
    return false;
  }


  const printableCharacters = normalized
    .slice(0, 1000)
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);


      return code === 9 || code === 10 || code === 13 || (code >= 32 && code < 127);
    }).length;


  const sampleLength = Math.min(normalized.length, 1000);


  return sampleLength > 0 && printableCharacters / sampleLength > 0.75;
}


function extractDirectTextWithSource(file: RuntimeFile): { text: string; source: TextSourceKind } {
  if (typeof file.text === "string") {
    return { text: file.text, source: "TEXT" };
  }


  if (typeof file.content === "string") {
    return { text: file.content, source: "CONTENT" };
  }


  if (typeof file.preview === "string") {
    return { text: file.preview, source: "PREVIEW" };
  }


  return { text: "", source: "NONE" };
}


function extractDirectText(file: RuntimeFile): string {
  return extractDirectTextWithSource(file).text;
}


function getDataUrlBase64(value: string): string | null {
  const match = value.trim().match(/^data:[^;]+;base64,(?<payload>.+)$/is);


  return match?.groups?.payload ? match.groups.payload.trim() : null;
}


function decodeBase64ToBuffer(value: string): Buffer | null {
  const normalized = value.trim();


  if (!normalized) {
    return null;
  }


  try {
    return Buffer.from(normalized, "base64");
  } catch {
    return null;
  }
}


function decodeRuntimeFileBuffer(file: RuntimeFile): {
  buffer: Buffer | null;
  source: PdfExtractionResult["source"];
} {
  if (Array.isArray(file.bytes) && file.bytes.length > 0) {
    return {
      buffer: Buffer.from(file.bytes),
      source: "PDF_BINARY"
    };
  }


  if (Array.isArray(file.buffer?.data) && file.buffer.data.length > 0) {
    return {
      buffer: Buffer.from(file.buffer.data),
      source: "PDF_BINARY"
    };
  }


  if (typeof file.dataUrl === "string" && file.dataUrl.trim()) {
    const payload = getDataUrlBase64(file.dataUrl);


    if (payload) {
      return {
        buffer: decodeBase64ToBuffer(payload),
        source: "PDF_DATA_URL"
      };
    }
  }


  if (typeof file.base64 === "string" && file.base64.trim()) {
    return {
      buffer: decodeBase64ToBuffer(file.base64),
      source: "PDF_BASE64"
    };
  }


  const directText = extractDirectText(file);


  if (typeof directText === "string" && directText.trim()) {
    const dataUrlPayload = getDataUrlBase64(directText);


    if (dataUrlPayload) {
      return {
        buffer: decodeBase64ToBuffer(dataUrlPayload),
        source: "PDF_DATA_URL"
      };
    }


    if (looksLikePdfBinaryString(directText)) {
      return {
        buffer: Buffer.from(directText, "latin1"),
        source: "PDF_BINARY"
      };
    }


    if (looksLikeBase64(directText)) {
      return {
        buffer: decodeBase64ToBuffer(directText),
        source: "PDF_BASE64"
      };
    }
  }


  return {
    buffer: null,
    source: "NONE"
  };
}


function decodePdfLiteralString(value: string): string {
  let result = "";


  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];


    if (char !== "\\") {
      result += char;
      continue;
    }


    const next = value[index + 1];


    if (!next) {
      continue;
    }


    if (next === "n") {
      result += "\n";
      index += 1;
      continue;
    }


    if (next === "r") {
      result += "\r";
      index += 1;
      continue;
    }


    if (next === "t") {
      result += "\t";
      index += 1;
      continue;
    }


    if (next === "b") {
      result += "\b";
      index += 1;
      continue;
    }


    if (next === "f") {
      result += "\f";
      index += 1;
      continue;
    }


    if (next === "(" || next === ")" || next === "\\") {
      result += next;
      index += 1;
      continue;
    }


    if (/[0-7]/.test(next)) {
      let octal = next;
      let offset = 2;


      while (
        offset <= 3 &&
        index + offset < value.length &&
        /[0-7]/.test(value[index + offset] || "")
      ) {
        octal += value[index + offset];
        offset += 1;
      }


      result += String.fromCharCode(Number.parseInt(octal, 8));
      index += octal.length;
      continue;
    }


    result += next;
    index += 1;
  }


  return result;
}


function decodeUtf16Be(buffer: Buffer): string {
  const chars: string[] = [];


  for (let index = 0; index + 1 < buffer.length; index += 2) {
    const code = buffer[index] * 256 + buffer[index + 1];


    if (code > 0) {
      chars.push(String.fromCharCode(code));
    }
  }


  return chars.join("");
}


function decodePdfHexString(value: string): string {
  const clean = value.replace(/\s+/g, "");


  if (!clean || clean.length < 2) {
    return "";
  }


  const padded = clean.length % 2 === 0 ? clean : `${clean}0`;


  try {
    const buffer = Buffer.from(padded, "hex");


    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      return decodeUtf16Be(buffer.subarray(2));
    }


    const utf8 = buffer.toString("utf8");


    if (looksLikeReadableExtractedText(utf8)) {
      return utf8;
    }


    return buffer.toString("latin1");
  } catch {
    return "";
  }
}


function extractLiteralStringsFromPdfExpression(value: string): string[] {
  const strings: string[] = [];
  const literalRegex = /\((?:\\.|[^\\()])*\)/g;
  const hexRegex = /<([0-9a-fA-F\s]+)>/g;


  for (const match of value.matchAll(literalRegex)) {
    const literal = match[0];


    if (!literal || literal.length < 2) {
      continue;
    }


    strings.push(decodePdfLiteralString(literal.slice(1, -1)));
  }


  for (const match of value.matchAll(hexRegex)) {
    if (!match[1]) {
      continue;
    }


    strings.push(decodePdfHexString(match[1]));
  }


  return strings;
}


function extractPdfTextOperators(source: string): string {
  const parts: string[] = [];
  const tjRegex = /(\((?:\\.|[^\\()])*\)|<([0-9a-fA-F\s]+)>)\s*Tj/g;
  const arrayTjRegex = /\[(?<items>[\s\S]*?)\]\s*TJ/g;
  const quoteRegex = /(\((?:\\.|[^\\()])*\))\s*['"]/g;


  for (const match of source.matchAll(tjRegex)) {
    const expression = match[1];


    if (!expression) {
      continue;
    }


    const extracted = extractLiteralStringsFromPdfExpression(expression).join("");


    if (extracted.trim()) {
      parts.push(extracted);
    }
  }


  for (const match of source.matchAll(arrayTjRegex)) {
    const expression = match.groups?.items || "";


    if (!expression) {
      continue;
    }


    const extracted = extractLiteralStringsFromPdfExpression(expression).join("");


    if (extracted.trim()) {
      parts.push(extracted);
    }
  }


  for (const match of source.matchAll(quoteRegex)) {
    const expression = match[1];


    if (!expression) {
      continue;
    }


    const extracted = extractLiteralStringsFromPdfExpression(expression).join("");


    if (extracted.trim()) {
      parts.push(extracted);
    }
  }


  return parts.join("\n");
}


function extractPdfStreams(source: string): string[] {
  const streams: string[] = [];
  const streamRegex = /(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;


  for (const match of source.matchAll(streamRegex)) {
    const dictionary = match[1] || "";
    const streamContent = match[2] || "";


    if (!streamContent) {
      continue;
    }


    if (!/\/FlateDecode\b/.test(dictionary)) {
      streams.push(streamContent);
      continue;
    }


    try {
      const inflated = inflateSync(Buffer.from(streamContent, "latin1"));


      streams.push(inflated.toString("utf8"));
      streams.push(inflated.toString("latin1"));
    } catch {
      streams.push(streamContent);
    }
  }


  return streams;
}


function normalizeExtractedPdfText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_TEXT_CHARS_PER_FILE);
}


function extractTextFromPdfBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) {
    return "";
  }


  const latin1 = buffer.toString("latin1");
  const sources = [latin1, ...extractPdfStreams(latin1)];
  const extractedParts: string[] = [];


  for (const source of sources) {
    const extracted = extractPdfTextOperators(source);


    if (extracted.trim()) {
      extractedParts.push(extracted);
    }
  }


  return normalizeExtractedPdfText(extractedParts.join("\n"));
}


function extractPdfText(file: RuntimeFile): PdfExtractionResult {
  const directText = extractDirectText(file);


  if (looksLikeReadableExtractedText(directText)) {
    return {
      text: safeTrimText(directText),
      source: "DIRECT_TEXT",
      hadPdfPayload: true,
      failed: false,
      reason:
        "PDF text was already provided by the client and can be used as prompt context."
    };
  }


  const decoded = decodeRuntimeFileBuffer(file);


  if (!decoded.buffer) {
    return {
      text: "",
      source: "NONE",
      hadPdfPayload: false,
      failed: false,
      reason:
        "PDF file metadata was received, but no readable text, base64 payload, data URL, byte array or binary content was provided."
    };
  }


  const hasPdfHeader = decoded.buffer.subarray(0, 8).toString("latin1").includes("%PDF");
  const extractedText = extractTextFromPdfBuffer(decoded.buffer);


  if (extractedText.trim()) {
    return {
      text: extractedText,
      source: decoded.source,
      hadPdfPayload: true,
      failed: false,
      reason: hasPdfHeader
        ? "PDF payload was parsed and readable text was extracted for prompt context."
        : "PDF-like payload was parsed and readable text was extracted for prompt context."
    };
  }


  return {
    text: "",
    source: decoded.source,
    hadPdfPayload: true,
    failed: true,
    reason: hasPdfHeader
      ? "PDF payload was received, but no readable text could be extracted. The PDF may be scanned, image-only, encrypted or structurally unsupported by the lightweight parser."
      : "A payload was received for a PDF-labelled file, but no readable PDF text could be extracted."
  };
}




function normalizeHeadingLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}


function normalizeOutlineSearchText(value: string): string {
  return normalizeSearchText(value);
}


function findCorpusBodyStartLine(lines: string[]): number {
  const premessaIndex = lines.findIndex((line) => /^\s*PREMESSA\s*$/i.test(line));
  const searchStart = premessaIndex >= 0 ? premessaIndex + 1 : 0;
  const firstBodyMajor = lines.findIndex((line, index) =>
    index >= searchStart && /^\s*0\.\s+ATTO DI APERTURA\s*$/i.test(line)
  );


  if (firstBodyMajor >= 0) {
    return firstBodyMajor;
  }


  return premessaIndex >= 0 ? premessaIndex : 0;
}


function isInsideGlossaryTable(lines: string[], index: number): boolean {
  for (let cursor = index; cursor >= Math.max(0, index - 40); cursor -= 1) {
    const line = normalizeHeadingLabel(lines[cursor] ?? "");


    if (/^GLOSSARIO CANONICO DEL CORPUS$/i.test(line) || /^N\.\s*\|\s*A\s*\|\s*B\s*\|/i.test(line)) {
      return true;
    }


    if (/^15\.2\s+Protocollo di citazione interna del glossario/i.test(line)) {
      return false;
    }
  }


  return false;
}


function classifyOutlineLine(line: string, lines: string[] = [], index = 0): DocumentOutlineEntry["sectionType"] | null {
  const normalized = normalizeHeadingLabel(line);


  if (!normalized) {
    return null;
  }


  if (/^boundary operativo$/i.test(normalized)) {
    return "BOUNDARY";
  }


  if (/^parte\s+[ivxlcdm]+\b/i.test(normalized)) {
    return "PART";
  }


  if (/^\d{1,2}\.\s+[A-ZÀ-Ú][A-ZÀ-Ú0-9\s·,–—\-’']+$/u.test(normalized)) {
    return "MAJOR_SECTION";
  }


  if (/^\d{1,2}\.\d+\s+/.test(normalized)) {
    if (isInsideGlossaryTable(lines, index)) {
      return "GLOSSARY_ENTRY";
    }


    return normalized.startsWith("15.") ? "APPENDIX" : "SUBSECTION";
  }


  if (/^(\d+\.\s*)?capitolo\s+[ivxlcdm]+\b/i.test(normalized) || /^\d+\.\s*capitolo\s+/i.test(normalized)) {
    return "CHAPTER";
  }


  if (/^a\.\d+\b/i.test(normalized)) {
    return "APPENDIX";
  }


  if (/^conclusione\b/i.test(normalized)) {
    return "CONCLUSION";
  }


  if (/^hbce ecosistema ai$/i.test(normalized)) {
    return "TITLE";
  }


  return null;
}


function extractDocumentOutline(text: string): DocumentOutlineSummary {
  const entries: DocumentOutlineEntry[] = [];
  const allLines = text.split("\n");
  const bodyStartLine = findCorpusBodyStartLine(allLines);
  const bodyStartChar = allLines.slice(0, bodyStartLine).reduce((sum, line) => sum + line.length + 1, 0);
  const lines = allLines.slice(bodyStartLine);
  let charCursor = bodyStartChar;
  let currentPart: string | null = null;
  let currentChapter: string | null = null;


  for (let localIndex = 0; localIndex < lines.length; localIndex += 1) {
    const rawLine = lines[localIndex] ?? "";
    const label = normalizeHeadingLabel(rawLine);
    const absoluteLineIndex = bodyStartLine + localIndex;
    const sectionType = classifyOutlineLine(label, allLines, absoluteLineIndex);


    if (sectionType && sectionType !== "GLOSSARY_ENTRY" && entries.length < FULL_DOCUMENT_OUTLINE_MAX_ENTRIES) {
      if (sectionType === "PART" || sectionType === "MAJOR_SECTION") {
        currentPart = label;
        currentChapter = null;
      }


      if (sectionType === "CHAPTER" || sectionType === "SUBSECTION") {
        currentChapter = label;
      }


      const headingPath = [currentPart, currentChapter, sectionType === "APPENDIX" ? label : null]
        .filter(Boolean)
        .join(" / ") || label;


      entries.push({
        index: entries.length,
        sectionType,
        label,
        lineNumber: absoluteLineIndex + 1,
        charStart: charCursor,
        headingPath
      });
    }


    charCursor += rawLine.length + 1;
  }


  const majorSections = entries.filter((entry) => entry.sectionType === "MAJOR_SECTION");
  const partSections = entries.filter((entry) => entry.sectionType === "PART");
  const subsections = entries.filter((entry) => entry.sectionType === "SUBSECTION" || entry.sectionType === "CHAPTER");
  const appendices = entries.filter((entry) => entry.sectionType === "APPENDIX");
  const boundaryDetected = entries.some((entry) => entry.sectionType === "BOUNDARY");
  const conclusionDetected = entries.some((entry) => entry.sectionType === "CONCLUSION") || /Formula canonica finale/i.test(text);
  const mainSectionEntries = majorSections.length > 0 ? majorSections : partSections;
  const lastMainSection = mainSectionEntries[mainSectionEntries.length - 1] ?? entries[entries.length - 1] ?? null;


  return {
    outlineStatus: entries.length > 0 ? "READY" : "EMPTY",
    partsDetected: majorSections.length > 0 ? majorSections.length : partSections.length,
    chaptersDetected: subsections.length + appendices.length,
    appendicesDetected: appendices.length,
    firstSectionDetected: mainSectionEntries[0]?.label ?? entries[0]?.label ?? null,
    lastSectionDetected: lastMainSection?.label ?? null,
    lastAppendixDetected: appendices[appendices.length - 1]?.label ?? null,
    boundaryDetected,
    conclusionDetected,
    entries
  };
}


function findHeadingForChunk(outline: DocumentOutlineSummary, charStart: number): { headingPath: string | null; sectionType: string | null } {
  let selected: DocumentOutlineEntry | null = null;


  for (const entry of outline.entries) {
    if (entry.charStart <= charStart) {
      selected = entry;
      continue;
    }


    break;
  }


  return {
    headingPath: selected?.headingPath ?? selected?.label ?? null,
    sectionType: selected?.sectionType ?? null
  };
}


function buildLongDocumentChunks(file: Pick<StoredRuntimeFile, "id" | "name" | "fileHash" | "text" | "documentOutline">): LongDocumentChunk[] {
  const text = file.text;


  if (!text.trim()) {
    return [];
  }


  const chunks: LongDocumentChunk[] = [];
  let charStart = 0;
  const createdAt = nowIso();


  while (charStart < text.length) {
    let charEnd = Math.min(text.length, charStart + LONG_DOCUMENT_CHUNK_TARGET_CHARS);


    if (charEnd < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", charEnd);
      const lineBreak = text.lastIndexOf("\n", charEnd);
      const breakPoint = paragraphBreak > charStart + 8000 ? paragraphBreak : lineBreak > charStart + 8000 ? lineBreak : -1;


      if (breakPoint > charStart) {
        charEnd = breakPoint;
      }
    }


    const chunkText = text.slice(charStart, charEnd).trim();


    if (chunkText) {
      const heading = findHeadingForChunk(file.documentOutline, charStart);
      const textHash = buildHash(chunkText);
      const id = buildHash({
        fileId: file.id,
        fileHash: file.fileHash,
        chunkIndex: chunks.length,
        charStart,
        charEnd,
        textHash
      }).replace("sha256:", "docchunk-").slice(0, 48);


      chunks.push({
        id,
        documentProfileId: null,
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        chunkIndex: chunks.length,
        charStart,
        charEnd,
        text: chunkText,
        textHash,
        headingPath: heading.headingPath,
        sectionType: heading.sectionType,
        createdAt
      });
    }


    if (charEnd >= text.length) {
      break;
    }


    charStart = Math.max(charEnd - LONG_DOCUMENT_CHUNK_OVERLAP_CHARS, charStart + 1);
  }


  return chunks;
}


function classifyTextCoverage(source: TextSourceKind, textLength: number): {
  textCoverageStatus: TextCoverageStatus;
  fullDocumentCoverage: boolean;
  fullDocumentCoverageReason: string;
  longDocumentMode: LongDocumentMode;
} {
  if (textLength <= 0) {
    return {
      textCoverageStatus: "TEXT_EMPTY",
      fullDocumentCoverage: false,
      fullDocumentCoverageReason: "No readable text was extracted from the file payload.",
      longDocumentMode: "REFERENCE_ONLY"
    };
  }


  if (source === "PREVIEW") {
    return {
      textCoverageStatus: "TEXT_PREVIEW_ONLY",
      fullDocumentCoverage: false,
      fullDocumentCoverageReason: "Only file.preview was provided by the client; full document coverage cannot be claimed from preview text.",
      longDocumentMode: "PREVIEW_ONLY"
    };
  }


  return {
    textCoverageStatus: "TEXT_READY_FULL",
    fullDocumentCoverage: true,
    fullDocumentCoverageReason: "Full text payload was available to /api/files and no per-file text cap was applied.",
    longDocumentMode: textLength > LONG_DOCUMENT_CHUNK_TARGET_CHARS ? "CHUNKED_FULL_TEXT" : "INLINE_TEXT"
  };
}


function buildStoredRuntimeFileBase(args: {
  id: string;
  name: string;
  mimeType: string;
  declaredSize: number;
  text: string;
  role: string;
  status: FileStatus;
  mode: FileMode;
  reason: string;
  textSourceKind: TextSourceKind;
  timestamp: string;
}): StoredRuntimeFile {
  const coverage = classifyTextCoverage(args.textSourceKind, args.text.length);
  const documentOutline = extractDocumentOutline(args.text);
  const sourceFileHash = buildHash(args.text || {
    name: args.name,
    mimeType: args.mimeType,
    size: args.declaredSize,
    status: args.status
  });
  const normalizedTextHash = buildHash(args.text);
  const runtimePromptTextHash = buildHash(args.text);
  const provisionalFile: Pick<StoredRuntimeFile, "id" | "name" | "fileHash" | "text" | "documentOutline"> = {
    id: args.id,
    name: args.name,
    fileHash: sourceFileHash,
    text: args.text,
    documentOutline
  };
  const documentChunks = isPromptTextStatus(args.status) ? buildLongDocumentChunks(provisionalFile) : [];


  return {
    id: args.id,
    name: args.name,
    mimeType: args.mimeType,
    type: args.mimeType,
    size: args.declaredSize,
    text: args.text,
    content: args.text,
    role: args.role,
    textLength: args.text.length,
    fullTextLength: args.text.length,
    promptTextLength: args.text.length,
    sourceFileHash,
    normalizedTextHash,
    runtimePromptTextHash,
    sourceByteLength: Buffer.byteLength(args.text, "utf8"),
    normalizedTextLength: args.text.length,
    textSourceKind: args.textSourceKind,
    textCoverageStatus: coverage.textCoverageStatus,
    fullDocumentCoverage: coverage.fullDocumentCoverage,
    fullDocumentCoverageReason: coverage.fullDocumentCoverageReason,
    longDocumentMode: coverage.longDocumentMode,
    documentOutline,
    documentChunkCount: documentChunks.length,
    documentChunks,
    fileHash: provisionalFile.fileHash,
    status: args.status,
    mode: args.mode,
    reason: `${args.reason} FullDocumentCoverage=${coverage.fullDocumentCoverage ? "true" : "false"}. TextCoverageStatus=${coverage.textCoverageStatus}. legalCertification=false. OPC=technical proof receipt only.`,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };
}


function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeContextString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }


  return fallback;
}


function buildDocumentProfileContext(body: FilesBody, sessionId: string): DocumentProfileContext {
  return {
    sessionId,
    threadId: typeof body.threadId === "string" && body.threadId.trim() ? body.threadId.trim() : sessionId,
    humanIpr: normalizeContextString(body.humanIpr, HBCE_SELF_PILOT_HUMAN_IPR),
    runtimeIpr: normalizeContextString(body.runtimeIpr, "IPR-AI-0001"),
    tenantId: normalizeContextString(body.tenantId, HBCE_SELF_PILOT_TENANT_ID),
    workspaceId: normalizeContextString(body.workspaceId, HBCE_SELF_PILOT_WORKSPACE_ID),
    sourceKind: normalizeContextString(body.sourceKind, "FILE_UPLOAD")
  };
}


function extractFirstNonEmptyLines(text: string, limit: number): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
}


function includesAll(normalized: string, terms: string[]): boolean {
  return terms.every((term) => normalized.includes(normalizeSearchText(term)));
}


function buildQpccfSearchCorpus(file: StoredRuntimeFile): string {
  return normalizeSearchText(`${file.name}\n${file.text.slice(0, 50000)}`);
}


function isQpccfTechnicalStackDocument(file: StoredRuntimeFile): boolean {
  return classifyHbceB2gTechnicalStackFile(file).module === QPCCF_MODULE;
}


function qpccfTechnicalStackSummary(): string {
  return "Profilo documento UNI/QPCCF del Technical Governance Stack HBCE/JOKER-C2 B2G: modulo QPCCF Predictive Stability Engine per identificare, quantificare e correggere deviazioni dinamiche di sistemi complessi tramite Lambda, delta, partial_t_Lambda e u(t), producendo stabilità predittiva, audit tecnico e integrazione con EVT, OPC e MATRIX. legalCertification=false; OPC=technical proof receipt only.";
}


function buildQpccfTechnicalStackMetadata(file: StoredRuntimeFile): Record<string, unknown> {
  const libClassification = classifyHbceB2gTechnicalStackFile(file);
  const libMetadata = buildHbceB2gTechnicalStackProfileMetadata({
    filename: file.name,
    sourceFilename: file.name,
    title: QPCCF_TITLE,
    header: file.text.slice(0, 12000),
    text: file.text.slice(0, 60000),
    mimeType: file.mimeType
  }) ?? {};

  return {
    ...libMetadata,
    b2gTechnicalStackClassifierRevision: HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION,
    b2gTechnicalStackClassifierMatched: libClassification.matched,
    b2gTechnicalStackClassifierConfidence: libClassification.confidence,
    b2gTechnicalStackClassifierScore: libClassification.score,
    b2gTechnicalStackClassifierSignals: libClassification.matchedSignals,
    qpccfTechnicalStackMetadataLockApplied: true,
    qpccfTechnicalStackMetadataLockRevision: QPCCF_TECHNICAL_STACK_METADATA_LOCK_REVISION,
    qpccfExpectedDocFamily: QPCCF_DOC_FAMILY,
    qpccfExpectedDocumentKind: QPCCF_DOCUMENT_KIND,
    qpccfExpectedModule: QPCCF_MODULE,
    qpccfExpectedVolume: QPCCF_VOLUME,
    qpccfExpectedTitle: QPCCF_TITLE,
    qpccfExpectedCanonicalAxis: QPCCF_CANONICAL_AXIS,
    qpccfExpectedSourceHash: QPCCF_EXPECTED_SOURCE_HASH,
    qpccfRuntimeFileHash: `sha256:${file.fileHash}`,
    qpccfHashMatchesExpected: `sha256:${file.fileHash}` === QPCCF_EXPECTED_SOURCE_HASH,
    canonicalProfileApplied: true,
    canonicalProfileRevision: QPCCF_TECHNICAL_STACK_METADATA_LOCK_REVISION,
    canonicalVolume: QPCCF_VOLUME,
    canonicalTitle: QPCCF_TITLE,
    canonicalDocumentKind: QPCCF_DOCUMENT_KIND,
    technicalStackModule: QPCCF_MODULE,
    contaminationWithCorpus: false,
    contaminationWithMatrix: false,
    contaminationWithV1: false,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}

function classifyHbceB2gTechnicalStackFile(file: StoredRuntimeFile): HbceB2gTechnicalStackClassification {
  return classifyHbceB2gTechnicalStackDocument({
    filename: file.name,
    sourceFilename: file.name,
    title: extractFirstNonEmptyLines(file.text, 3).join(" | "),
    header: file.text.slice(0, 12000),
    text: file.text.slice(0, 60000),
    mimeType: file.mimeType
  });
}

function getHbceB2gTechnicalStackClassification(file: StoredRuntimeFile): HbceB2gTechnicalStackClassification | null {
  const classification = classifyHbceB2gTechnicalStackFile(file);
  return classification.matched ? classification : null;
}

function isHbceB2gTechnicalStackFile(file: StoredRuntimeFile): boolean {
  return Boolean(getHbceB2gTechnicalStackClassification(file));
}



function inferCanonicalCorpusVolumeProfile(file: StoredRuntimeFile): CanonicalCorpusVolumeProfile | null {
  const normalizedName = normalizeSearchText(file.name);
  const normalizedHead = normalizeSearchText(`${file.name}\n${file.text.slice(0, 16000)}`);
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 30000)}`);

  const explicitV5ByFilename =
    normalizedName.includes("5e 5e il portale dell anticristo") ||
    includesAll(normalizedName, ["portale", "anticristo"]);

  const explicitV5ByHeader =
    includesAll(normalizedHead, ["il portale dell anticristo", "volume v"]) ||
    includesAll(normalizedHead, ["il portale dell anticristo", "volume 5"]) ||
    includesAll(normalizedHead, ["apocalisse", "regime di esposizione"]) ||
    includesAll(normalizedHead, ["anticristo", "configurazione di rottura"]) ||
    includesAll(normalizedHead, ["portale", "soglia operativa"]);

  // V5 must be resolved before the V4 semantic guard. Volume V can quote or reuse
  // V4 terms while closing the Corpus sequence, so filename/header identity wins.
  if (
    explicitV5ByFilename ||
    explicitV5ByHeader ||
    normalized.includes("il portale dell anticristo") ||
    includesAll(normalized, ["anticristo", "portale", "apocalisse"]) ||
    includesAll(normalized, ["apostasia globale", "1110 giorni"]) ||
    includesAll(normalized, ["sigillo del volume", "chiusura del portale"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V5;
  }

  const explicitV4ByFilename =
    normalizedName.includes("4d 4d alien code") ||
    includesAll(normalizedName, ["alien code", "tracciabilita rascensionale"]) ||
    includesAll(normalizedName, ["codice alieno", "tracciabilita rascensionale"]);

  const explicitV4ByHeader =
    includesAll(normalizedHead, ["alien code", "volume iv"]) ||
    includesAll(normalizedHead, ["alien code", "volume 4"]) ||
    includesAll(normalizedHead, ["codice alieno", "volume iv"]) ||
    includesAll(normalizedHead, ["framework operativo", "tracciabilita rascensionale"]) ||
    includesAll(normalizedHead, ["alien code", "accoppiamento organismo sistema"]);

  if (
    explicitV4ByFilename ||
    explicitV4ByHeader ||
    normalized.includes("framework operativo per la tracciabilita rascensionale") ||
    includesAll(normalized, ["alien code", "interfaccia rascensionale"]) ||
    includesAll(normalized, ["codice alieno", "interfaccia rascensionale"]) ||
    includesAll(normalized, ["unita qubitronica", "riconconicita"]) ||
    includesAll(normalized, ["accoppiamento organismo sistema", "fallimento del coupling"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V4;
  }

  if (
    normalizedName.includes("3c 3c lex hermeticum") ||
    normalized.includes("lex hermeticum") ||
    includesAll(normalized, ["regime di validita", "opponibilita", "responsabilita"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V3;
  }


  if (
    normalizedName.includes("2b 2b matrix") ||
    normalized.includes("matrix 05 04 2026") ||
    includesAll(normalized, ["dominio istituzionale", "fiscalita", "debito"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V2;
  }


  if (
    normalizedName.includes("1a 1a corpus esoterologia ermetica") ||
    includesAll(normalizedName, ["corpus esoterologia ermetica"]) ||
    includesAll(normalized, ["corpus esoterologia ermetica", "volume i", "esoterologia"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V1;
  }


  return null;
}

function inferDocumentFamily(file: StoredRuntimeFile): string | null {
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 12000)}`);
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (isQpccfTechnicalStackDocument(file)) {
    return QPCCF_DOC_FAMILY;
  }


  if (canonicalCorpusProfile) {
    return "CORPUS_ESOTEROLOGIA_ERMETICA";
  }


  if (normalized.includes("apokalypsis")) {
    return "APOKALYPSIS";
  }


  if (
    normalized.includes("u s e") ||
    normalized.includes("united states of europe") ||
    normalized.includes("emergenza europea") ||
    normalized.includes("sovranita digitale europea") ||
    normalized.includes("voto digitale federato") ||
    normalized.includes("costituzione operativa europea")
  ) {
    return "USE";
  }


  if (
    normalized.includes("corpus esoterologia ermetica") ||
    normalized.includes("esoterologia") ||
    normalized.includes("decisione costo traccia tempo") ||
    normalized.includes("matrix 05 04 2026") ||
    includesAll(normalized, ["matrix", "05", "04", "2026"])
  ) {
    return "CORPUS_ESOTEROLOGIA_ERMETICA";
  }


  if (
    normalized.includes("alien code") ||
    normalized.includes("cod 1 alieno") ||
    normalized.includes("codice alieno")
  ) {
    return "ALIEN_CODE";
  }


  if (normalized.includes("hermeticum") || normalized.includes("hbce")) {
    return "HBCE_OPERATIONAL_DOCUMENT";
  }


  return null;
}


function inferDocumentVolume(file: StoredRuntimeFile): string | null {
  const b2gTechnicalStackClassification = getHbceB2gTechnicalStackClassification(file);
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (b2gTechnicalStackClassification?.volume) {
    return b2gTechnicalStackClassification.volume;
  }


  if (canonicalCorpusProfile) {
    return canonicalCorpusProfile.volume;
  }


  const raw = `${file.name}\n${file.text.slice(0, 16000)}`;
  const normalized = normalizeSearchText(raw);
  const directMatch = raw.match(/\bVolume\s+(I{1,3}|IV|V|VI{0,3}|IX|X|1|2|3|4|5|6|7|8|9|10)\b/i);


  if (directMatch?.[1]) {
    const token = directMatch[1].toUpperCase();
    const romanMap: Record<string, string> = {
      I: "V1",
      II: "V2",
      III: "V3",
      IV: "V4",
      V: "V5",
      VI: "V6",
      VII: "V7",
      VIII: "V8",
      IX: "V9",
      X: "V10"
    };


    return romanMap[token] || `V${token}`;
  }


  if (normalized.includes("2b 2b matrix") || normalized.includes("matrix 05 04 2026")) {
    return "V2";
  }


  if (normalized.includes("1a 1a corpus") || includesAll(normalized, ["corpus", "volume", "i"])) {
    return "V1";
  }


  const filenameVolume = file.name.match(/(?:^|[_\-\s])(?:vol(?:ume)?[_\-\s]*)?(\d{1,2}|I{1,3}|IV|V)(?:[_\-\s]|\.)/i);


  if (filenameVolume?.[1]) {
    const token = filenameVolume[1].toUpperCase();
    const romanMap: Record<string, string> = {
      I: "V1",
      II: "V2",
      III: "V3",
      IV: "V4",
      V: "V5"
    };


    return romanMap[token] || `V${token}`;
  }


  return null;
}


function inferDocumentTitle(file: StoredRuntimeFile): string | null {
  const b2gTechnicalStackClassification = getHbceB2gTechnicalStackClassification(file);
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (b2gTechnicalStackClassification?.title) {
    return b2gTechnicalStackClassification.title;
  }


  if (canonicalCorpusProfile) {
    return canonicalCorpusProfile.title;
  }


  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 12000)}`);
  const lines = extractFirstNonEmptyLines(file.text, 10);


  if (normalized.includes("matrix 05 04 2026") || includesAll(normalized, ["matrix", "05", "04", "2026"])) {
    return "MATRIX / 05-04-2026";
  }


  if (normalized.includes("corpus esoterologia ermetica") && normalized.includes("esoterologia")) {
    return "ESOTEROLOGIA";
  }


  if (normalized.includes("apokalypsis")) {
    const volume = inferDocumentVolume(file);


    return volume ? `APOKALYPSIS ${volume}` : "APOKALYPSIS";
  }


  if (normalized.includes("u s e") || normalized.includes("united states of europe")) {
    const volume = inferDocumentVolume(file);


    return volume ? `U.S.E. ${volume}` : "U.S.E.";
  }


  const titleLine = lines.find((line) => {
    const normalizedLine = normalizeSearchText(line);


    return normalizedLine.length >= 4 && normalizedLine.length <= 120;
  });


  return titleLine || file.name;
}


function inferCanonicalAxis(file: StoredRuntimeFile): string | null {
  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 20000)}`);


  if (isQpccfTechnicalStackDocument(file)) {
    return QPCCF_CANONICAL_AXIS;
  }


  if (includesAll(normalized, ["decisione", "costo", "traccia", "tempo"])) {
    return CANONICAL_AXIS_DCTT;
  }


  if (normalized.includes("ipr") && normalized.includes("evt") && normalized.includes("opc")) {
    return "IPR · EVT · OPC";
  }


  return null;
}


function collectDocumentKeyTerms(file: StoredRuntimeFile): string[] {
  const b2gTechnicalStackClassification = getHbceB2gTechnicalStackClassification(file);
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (b2gTechnicalStackClassification) {
    return Array.from(new Set(b2gTechnicalStackClassification.keyTerms)).slice(0, 32);
  }


  if (canonicalCorpusProfile) {
    return Array.from(new Set(canonicalCorpusProfile.keyTerms)).slice(0, 32);
  }


  const normalized = normalizeSearchText(`${file.name}\n${file.text.slice(0, 30000)}`);
  const terms = DOCUMENT_KEY_TERM_CANDIDATES.filter((term) => {
    return normalized.includes(normalizeSearchText(term));
  });


  if (inferDocumentFamily(file) === "CORPUS_ESOTEROLOGIA_ERMETICA") {
    for (const term of ["Decisione", "Costo", "Traccia", "Tempo"]) {
      if (!terms.includes(term)) {
        terms.push(term);
      }
    }
  }


  return Array.from(new Set(terms)).slice(0, 32);
}


function buildDocumentSummary(file: StoredRuntimeFile): string {
  const b2gTechnicalStackClassification = getHbceB2gTechnicalStackClassification(file);
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);


  if (b2gTechnicalStackClassification?.summary) {
    return b2gTechnicalStackClassification.summary;
  }


  const family = inferDocumentFamily(file);
  const volume = inferDocumentVolume(file);
  const title = inferDocumentTitle(file);
  const keyTerms = collectDocumentKeyTerms(file).slice(0, 10);


  if (!isPromptTextStatus(file.status)) {
    return `Documento registrato come ${file.status}. Il file resta tracciabile per hash e metadati, ma non contiene testo pronto per il prompt.`;
  }


  if (canonicalCorpusProfile) {
    return canonicalCorpusProfile.summary;
  }


  if (title === "MATRIX / 05-04-2026") {
    return "Profilo documento MATRIX / 05-04-2026: Volume II del CORPUS ESOTEROLOGIA ERMETICA. Trasferisce la griglia Decisione · Costo · Traccia · Tempo nel dominio istituzionale, leggendo istituzioni, Stato, esecuzione, fiscalità, debito, sicurezza, forza, conflitto, decadimento e ordine globale come sequenze operative distribuite.";
  }


  if (family === "CORPUS_ESOTEROLOGIA_ERMETICA" && volume === "V1") {
    return "Profilo documento CORPUS ESOTEROLOGIA ERMETICA Volume I: fonda il criterio del Reale operativo e l'asse Decisione · Costo · Traccia · Tempo come grammatica di verificazione della realtà operativa.";
  }


  const extracted = extractFirstNonEmptyLines(file.text, 4).join(" ").slice(0, 700);


  return [
    `Profilo documento${title ? ` ${title}` : ""}${volume ? ` ${volume}` : ""}.`,
    family ? `Famiglia: ${family}.` : "Famiglia: non classificata automaticamente.",
    keyTerms.length ? `Termini: ${keyTerms.join(", ")}.` : "Termini: non determinati automaticamente.",
    extracted ? `Estratto operativo: ${extracted}` : ""
  ].filter(Boolean).join(" ").slice(0, 1200);
}


function describeDocumentChunkPersistenceReason(chunks: DocumentChunkPersistenceResult | null | undefined): string | null {
  if (!chunks) {
    return null;
  }


  if (!chunks.attempted) {
    return "SKIPPED_NO_PROMPT_TEXT_OR_NO_CHUNKS";
  }


  if (chunks.ok && chunks.databaseVerified && chunks.persistedCount === chunks.chunkCount) {
    return "DATABASE_VERIFIED";
  }


  if (chunks.status === "DATABASE_NOT_READY") {
    return "DATABASE_NOT_READY";
  }


  if (chunks.databaseVerified && chunks.persistedCount !== chunks.chunkCount) {
    return "DATABASE_COUNT_MISMATCH";
  }


  return chunks.error || "DOCUMENT_CHUNK_PERSISTENCE_FAILED";
}


function buildDocumentChunkPersistenceProofMetadata(chunks: DocumentChunkPersistenceResult | null | undefined): Record<string, unknown> {
  return {
    documentChunksPersisted: chunks?.ok ?? false,
    documentChunksPersistedCount: chunks?.persistedCount ?? 0,
    documentChunkPersistenceAttempted: chunks?.attempted ?? false,
    documentChunkPersistenceStatus: chunks?.status ?? null,
    documentChunkPersistenceReason: describeDocumentChunkPersistenceReason(chunks),
    documentChunkPersistenceError: chunks?.error ?? null,
    documentChunkPersistenceRevision: chunks?.persistenceRevision ?? DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
    documentChunkPersistenceScope: chunks?.persistenceScope ?? DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
    documentChunkDatabaseVerified: chunks?.databaseVerified ?? false,
    documentChunkVerificationCount: chunks?.verificationCount ?? 0,
    documentChunkVerificationSqlHash: chunks?.verificationSqlHash ?? null,
    documentChunkInsertedCount: chunks?.insertedCount ?? 0,
    documentChunkExpectedCount: chunks?.chunkCount ?? 0,
    documentChunkDerivedFromHumanIpr: chunks?.derivedFromHumanIpr ?? null,
    derivedFromHumanIpr: chunks?.derivedFromHumanIpr ?? null,
    tenantId: chunks?.tenantId ?? null,
    workspaceId: chunks?.workspaceId ?? null,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


function applyDocumentChunkPersistenceProofToInput(
  input: DocumentProfileDatabaseInput,
  chunks: DocumentChunkPersistenceResult | null
): DocumentProfileDatabaseInput {
  const existingMetadata =
    input.documentMetadata && typeof input.documentMetadata === "object"
      ? input.documentMetadata as Record<string, unknown>
      : {};


  return {
    ...input,
    documentMetadata: {
      ...existingMetadata,
      ...buildDocumentChunkPersistenceProofMetadata(chunks),
      routeVersion: FILE_ROUTE_REVISION,
      postUploadChunkProofRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION
    }
  };
}


function withDocumentChunkPersistenceProof<T extends Record<string, unknown> | null>(
  profile: T,
  chunks: DocumentChunkPersistenceResult | null
): T {
  if (!profile) {
    return profile;
  }


  const existingMetadata =
    profile.documentMetadata && typeof profile.documentMetadata === "object"
      ? profile.documentMetadata as Record<string, unknown>
      : {};


  return {
    ...profile,
    documentMetadata: {
      ...existingMetadata,
      ...buildDocumentChunkPersistenceProofMetadata(chunks),
      routeVersion: FILE_ROUTE_REVISION,
      postUploadChunkProofRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION
    }
  } as T;
}


function buildDocumentProfileInput(
  file: StoredRuntimeFile,
  context: DocumentProfileContext
): DocumentProfileDatabaseInput {
  const canonicalCorpusProfile = inferCanonicalCorpusVolumeProfile(file);
  const b2gTechnicalStackClassification = getHbceB2gTechnicalStackClassification(file);
  const qpccfTechnicalStackProfile = b2gTechnicalStackClassification?.module === QPCCF_MODULE;
  const b2gTechnicalStackProfile = Boolean(b2gTechnicalStackClassification);
  const docFamily = inferDocumentFamily(file);
  const volume = inferDocumentVolume(file);
  const title = inferDocumentTitle(file);
  const canonicalAxis = inferCanonicalAxis(file);
  const keyTerms = collectDocumentKeyTerms(file);
  const reusableInPrompt = isPromptTextStatus(file.status);


  return {
    fileId: file.id,
    filename: file.name,
    fileHash: file.fileHash,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    humanIpr: context.humanIpr,
    runtimeIpr: context.runtimeIpr,
    sessionId: context.sessionId,
    threadId: context.threadId ?? context.sessionId,
    sourceKind: context.sourceKind,
    textStatus: file.status,
    textLength: file.textLength,
    mimeType: file.mimeType,
    docFamily,
    volume,
    title,
    subtitle: null,
    canonicalAxis,
    summary: buildDocumentSummary(file),
    keyTerms,
    semanticTerms: keyTerms.map((term) => ({ term, source: "AUTO_PROFILE" })),
    documentMetadata: {
      routeVersion: FILE_ROUTE_REVISION,
      canonicalProfileRevision: DOCUMENT_PROFILE_CANONICAL_FIX_REVISION,
      canonicalProfileApplied: Boolean(canonicalCorpusProfile) || b2gTechnicalStackProfile,
      canonicalVolume: b2gTechnicalStackClassification?.volume ?? canonicalCorpusProfile?.volume ?? null,
      canonicalTitle: b2gTechnicalStackClassification?.title ?? canonicalCorpusProfile?.title ?? null,
      canonicalDocumentKind: b2gTechnicalStackClassification?.documentKind ?? (canonicalCorpusProfile ? "CANONICAL_CORPUS_VOLUME" : null),
      technicalStackModule: b2gTechnicalStackClassification?.module ?? null,
      b2gTechnicalStackClassifierRevision: b2gTechnicalStackClassification ? HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION : null,
      b2gTechnicalStackMetadataLockApplied: b2gTechnicalStackProfile,
      b2gTechnicalStackMetadataLockConfidence: b2gTechnicalStackClassification?.confidence ?? null,
      b2gTechnicalStackMetadataLockScore: b2gTechnicalStackClassification?.score ?? null,
      b2gTechnicalStackMetadataLockSignals: b2gTechnicalStackClassification?.matchedSignals ?? [],
      b2gTechnicalStackExpectedProfile: b2gTechnicalStackClassification ? buildHbceB2gTechnicalStackProfileMetadata({
        filename: file.name,
        sourceFilename: file.name,
        title,
        header: file.text.slice(0, 12000),
        text: file.text.slice(0, 60000),
        mimeType: file.mimeType
      }) : null,
      qpccfTechnicalStackMetadataLockApplied: qpccfTechnicalStackProfile,
      qpccfTechnicalStackMetadataLockRevision: qpccfTechnicalStackProfile ? QPCCF_TECHNICAL_STACK_METADATA_LOCK_REVISION : null,
      qpccfExpectedProfile: qpccfTechnicalStackProfile ? buildQpccfTechnicalStackMetadata(file) : null,
      alienCodeV4GuardApplied: canonicalCorpusProfile?.volume === "V4",
      portaleV5GuardApplied: canonicalCorpusProfile?.volume === "V5",
      alienCodeV4ExpectedProfile:
        canonicalCorpusProfile?.volume === "V4"
          ? {
              title: CANONICAL_CORPUS_VOLUME_PROFILES.V4.title,
              volume: CANONICAL_CORPUS_VOLUME_PROFILES.V4.volume,
              docFamily: "CORPUS_ESOTEROLOGIA_ERMETICA",
              canonicalAxis: CANONICAL_AXIS_DCTT
            }
          : null,
      portaleV5ExpectedProfile:
        canonicalCorpusProfile?.volume === "V5"
          ? {
              title: CANONICAL_CORPUS_VOLUME_PROFILES.V5.title,
              volume: CANONICAL_CORPUS_VOLUME_PROFILES.V5.volume,
              docFamily: "CORPUS_ESOTEROLOGIA_ERMETICA",
              canonicalAxis: CANONICAL_AXIS_DCTT
            }
          : null,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      sourceFileHash: file.sourceFileHash,
      normalizedTextHash: file.normalizedTextHash,
      runtimePromptTextHash: file.runtimePromptTextHash,
      sourceByteLength: file.sourceByteLength,
      normalizedTextLength: file.normalizedTextLength,
      mimeType: file.mimeType,
      type: file.type,
      size: file.size,
      role: file.role,
      status: file.status,
      mode: file.mode,
      reason: file.reason,
      textLength: file.textLength,
      fullTextLength: file.fullTextLength,
      promptTextLength: file.promptTextLength,
      textStoredInProfile: false,
      textSourceKind: file.textSourceKind,
      textCoverageStatus: file.textCoverageStatus,
      fullDocumentCoverage: file.fullDocumentCoverage,
      fullDocumentCoverageReason: file.fullDocumentCoverageReason,
      longDocumentMode: file.longDocumentMode,
      documentChunkCount: file.documentChunkCount,
      documentChunksPersisted: file.documentChunksPersisted ?? null,
      documentChunksPersistedCount: file.documentChunksPersistedCount ?? null,
      documentOutline: {
        outlineStatus: file.documentOutline.outlineStatus,
        partsDetected: file.documentOutline.partsDetected,
        chaptersDetected: file.documentOutline.chaptersDetected,
        appendicesDetected: file.documentOutline.appendicesDetected,
        firstSectionDetected: file.documentOutline.firstSectionDetected,
        lastSectionDetected: file.documentOutline.lastSectionDetected,
        lastAppendixDetected: file.documentOutline.lastAppendixDetected,
        boundaryDetected: file.documentOutline.boundaryDetected,
        conclusionDetected: file.documentOutline.conclusionDetected,
        entries: file.documentOutline.entries
      },
      sourceKind: context.sourceKind,
      legalCertification: false,
      opc: "technical proof receipt only"
    },
    profileStatus: "ACTIVE",
    quality: reusableInPrompt ? "CANONICAL" : "METADATA_ONLY",
    reusableInPrompt,
    lastSeenAt: nowIso(),
    createdAt: file.createdAt,
    deletedAt: null
  };
}



function buildB2gTechnicalMemoryCollapseForFile(
  file: StoredRuntimeFile,
  context: DocumentProfileContext,
  documentProfileId: string | null,
  documentProfileStatus: DocumentProfilePersistenceStatus | "PERSISTED" | null,
  chunks: DocumentChunkPersistenceResult | null
): Record<string, unknown> | null {
  const classification = getHbceB2gTechnicalStackClassification(file);

  if (!classification) {
    return null;
  }

  const payload = buildHbceB2gTechnicalMemoryCollapse({
    filename: file.name,
    sourceFilename: file.name,
    title: classification.title ?? inferDocumentTitle(file),
    header: file.text.slice(0, 12000),
    text: file.text.slice(0, 60000),
    mimeType: file.mimeType,
    documentProfileId,
    documentProfileStatus,
    fileHash: file.fileHash,
    docFamily: classification.docFamily ?? inferDocumentFamily(file),
    documentKind: classification.documentKind ?? QPCCF_DOCUMENT_KIND,
    module: classification.module ?? undefined,
    volume: classification.volume ?? inferDocumentVolume(file),
    canonicalAxis: classification.canonicalAxis ?? inferCanonicalAxis(file),
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    documentChunksPersisted: chunks?.ok ?? file.documentChunksPersisted ?? false,
    documentChunksPersistedCount: chunks?.persistedCount ?? file.documentChunksPersistedCount ?? null,
    truncationDetected: file.fullDocumentCoverage !== true,
    derivedFromHumanIpr: chunks?.derivedFromHumanIpr ?? context.humanIpr,
    humanIpr: context.humanIpr,
    runtimeIpr: context.runtimeIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    evtId: null,
    opcId: null,
    auditId: null,
    usageId: null
  });

  return toPublicHbceB2gTechnicalMemoryPayload(payload);
}


function readTechnicalMemoryString(
  technicalMemory: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = technicalMemory?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}


function readTechnicalMemoryGuardBoolean(
  technicalMemory: Record<string, unknown> | null | undefined,
  key: string
): boolean | null {
  const guards = technicalMemory?.guards;

  if (!guards || typeof guards !== "object") {
    return null;
  }

  const value = (guards as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : null;
}


function buildB2gTechnicalMemoryPromptBridge(
  technicalMemory: Record<string, unknown> | null | undefined
): string | null {
  if (!technicalMemory) {
    return null;
  }

  const status = readTechnicalMemoryString(technicalMemory, "status");
  const module = readTechnicalMemoryString(technicalMemory, "module");
  const docFamily = readTechnicalMemoryString(technicalMemory, "docFamily");
  const documentKind = readTechnicalMemoryString(technicalMemory, "documentKind");
  const failReason = readTechnicalMemoryString(technicalMemory, "failReason");

  if (!status) {
    return null;
  }

  return [
    "B2G_TECHNICAL_PROFILE_MEMORY_READY",
    `status=${status}`,
    `docFamily=${docFamily ?? "UNKNOWN"}`,
    `documentKind=${documentKind ?? "UNKNOWN"}`,
    `module=${module ?? "UNKNOWN"}`,
    `noQuantumStates=${readTechnicalMemoryGuardBoolean(technicalMemory, "noQuantumStates") === true}`,
    `noCorpusCollapse=${readTechnicalMemoryGuardBoolean(technicalMemory, "noCorpusCollapse") === true}`,
    `failReason=${failReason ?? "UNKNOWN"}`,
    "legalCertification=false",
    "OPC=technical proof receipt only"
  ].join("\n");
}


function applyB2gTechnicalMemoryCollapseToInput(
  input: DocumentProfileDatabaseInput,
  technicalMemory: Record<string, unknown> | null
): DocumentProfileDatabaseInput {
  if (!technicalMemory) {
    return input;
  }

  const existingMetadata =
    input.documentMetadata && typeof input.documentMetadata === "object"
      ? input.documentMetadata as Record<string, unknown>
      : {};

  return {
    ...input,
    documentMetadata: {
      ...existingMetadata,
      b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
      b2gTechnicalMemoryStatus: technicalMemory.status ?? null,
      b2gTechnicalMemoryReady: technicalMemory.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
      b2gTechnicalMemoryReadyForIprSave: technicalMemory.readyForIprSave === true,
      b2gTechnicalMemoryFailReason: technicalMemory.failReason ?? null,
      b2gTechnicalMemoryType: technicalMemory.memoryType ?? "B2G_TECHNICAL_PROFILE_MEMORY",
      b2gTechnicalMemoryMode: technicalMemory.memoryMode ?? "TECHNICAL_SYNTHESIS_ONLY",
      b2gTechnicalMemoryNoQuantumStates: true,
      b2gTechnicalMemoryNoQstateOutput: true,
      b2gTechnicalMemoryNoCorpusCollapse: true,
      b2gTechnicalMemoryNoRawTextPersistence: true,
      b2gTechnicalMemoryNoSemanticEsoterologicalMemory: true,
      b2gTechnicalMemory: technicalMemory,
      legalCertification: false,
      opc: "technical proof receipt only"
    }
  };
}


function buildDocumentProfilePersistenceInputSummary(input: DocumentProfileDatabaseInput, file: StoredRuntimeFile) {
  return {
    docFamily: input.docFamily ?? null,
    volume: input.volume ?? null,
    title: input.title ?? null,
    canonicalAxis: input.canonicalAxis ?? null,
    keyTerms: input.keyTerms ?? [],
    reusableInPrompt: input.reusableInPrompt !== false,
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    chunkCount: file.documentChunkCount,
    outlineStatus: file.documentOutline.outlineStatus,
    partsDetected: file.documentOutline.partsDetected,
    chaptersDetected: file.documentOutline.chaptersDetected,
    appendicesDetected: file.documentOutline.appendicesDetected
  };
}


function canonicalCorpusProfileFromFilenameForRead(value: unknown): CanonicalCorpusVolumeProfile | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalizedName = normalizeSearchText(value);

  if (
    normalizedName.includes("5e 5e il portale dell anticristo") ||
    includesAll(normalizedName, ["portale", "anticristo"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V5;
  }

  if (
    normalizedName.includes("4d 4d alien code") ||
    includesAll(normalizedName, ["alien code", "tracciabilita rascensionale"]) ||
    includesAll(normalizedName, ["codice alieno", "tracciabilita rascensionale"])
  ) {
    return CANONICAL_CORPUS_VOLUME_PROFILES.V4;
  }

  return null;
}

function isQpccfFilenameOrMetadataForRead(profile: Record<string, unknown>): boolean {
  const filename = `${profile.filename ?? profile.fileName ?? ""}`;
  const title = `${profile.title ?? ""}`;
  const docFamily = `${profile.docFamily ?? ""}`;
  const metadata = profile.documentMetadata && typeof profile.documentMetadata === "object"
    ? profile.documentMetadata as Record<string, unknown>
    : {};
  const metadataTitle = `${metadata.canonicalTitle ?? metadata.qpccfExpectedTitle ?? ""}`;
  const metadataModule = `${metadata.technicalStackModule ?? metadata.qpccfExpectedModule ?? ""}`;
  const normalized = normalizeSearchText(`${filename}\n${title}\n${docFamily}\n${metadataTitle}\n${metadataModule}`);

  return (
    normalized.includes("qpccf") ||
    normalized.includes("predictive stability engine") ||
    includesAll(normalized, ["intercettazione predittiva", "collisioni", "collimazione"])
  );
}


function canonicalizeQpccfPublicDocumentProfileForRead<T extends Record<string, unknown>>(profile: T): T {
  const existingMetadata =
    profile.documentMetadata && typeof profile.documentMetadata === "object"
      ? profile.documentMetadata as Record<string, unknown>
      : {};

  return {
    ...profile,
    docFamily: QPCCF_DOC_FAMILY,
    volume: QPCCF_VOLUME,
    title: QPCCF_TITLE,
    canonicalAxis: QPCCF_CANONICAL_AXIS,
    summary: qpccfTechnicalStackSummary(),
    keyTerms: Array.from(new Set(QPCCF_KEY_TERMS)).slice(0, 32),
    documentMetadata: {
      ...existingMetadata,
      ...buildQpccfTechnicalStackMetadata({
        id: `${profile.fileId ?? "READ_PROFILE"}`,
        name: `${profile.filename ?? profile.fileName ?? "QPCCF"}`,
        mimeType: `${profile.mimeType ?? "text/plain"}`,
        type: `${profile.type ?? "text/plain"}`,
        size: typeof profile.size === "number" ? profile.size : 0,
        text: "",
        content: "",
        role: `${profile.role ?? "document"}`,
        textLength: typeof profile.textLength === "number" ? profile.textLength : 0,
        fullTextLength: typeof profile.fullTextLength === "number" ? profile.fullTextLength : 0,
        promptTextLength: typeof profile.promptTextLength === "number" ? profile.promptTextLength : 0,
        sourceFileHash: `${profile.fileHash ?? ""}`,
        normalizedTextHash: `${profile.fileHash ?? ""}`,
        runtimePromptTextHash: `${profile.fileHash ?? ""}`,
        sourceByteLength: typeof profile.size === "number" ? profile.size : 0,
        normalizedTextLength: typeof profile.textLength === "number" ? profile.textLength : 0,
        textSourceKind: "TEXT",
        textCoverageStatus: "TEXT_READY_FULL",
        fullDocumentCoverage: true,
        fullDocumentCoverageReason: "QPCCF_READ_GUARD",
        longDocumentMode: "CHUNKED_FULL_TEXT",
        documentOutline: {
          outlineStatus: "READY",
          partsDetected: 0,
          chaptersDetected: 0,
          appendicesDetected: 0,
          firstSectionDetected: null,
          lastSectionDetected: null,
          lastAppendixDetected: null,
          boundaryDetected: false,
          conclusionDetected: false,
          entries: []
        },
        documentChunkCount: typeof existingMetadata.documentChunkCount === "number" ? existingMetadata.documentChunkCount : 0,
        documentChunks: [],
        fileHash: `${profile.fileHash ?? ""}`.replace(/^sha256:/, ""),
        status: "TEXT_READY",
        mode: "TEXT",
        reason: "QPCCF_READ_GUARD",
        createdAt: `${profile.createdAt ?? nowIso()}`,
        updatedAt: `${profile.updatedAt ?? nowIso()}`
      }),
      canonicalProfileReadGuardApplied: true,
      qpccfTechnicalStackReadGuardApplied: true,
      legalCertification: false,
      opc: "technical proof receipt only"
    }
  } as T;
}


function canonicalizePublicDocumentProfileForRead<T extends Record<string, unknown>>(profile: T): T {
  if (isQpccfFilenameOrMetadataForRead(profile)) {
    return canonicalizeQpccfPublicDocumentProfileForRead(profile);
  }

  const filename = profile.filename ?? profile.fileName;
  const canonicalProfile = canonicalCorpusProfileFromFilenameForRead(filename);

  if (!canonicalProfile) {
    return profile;
  }

  const existingMetadata =
    profile.documentMetadata && typeof profile.documentMetadata === "object"
      ? profile.documentMetadata as Record<string, unknown>
      : {};

  return {
    ...profile,
    docFamily: "CORPUS_ESOTEROLOGIA_ERMETICA",
    volume: canonicalProfile.volume,
    title: canonicalProfile.title,
    canonicalAxis: CANONICAL_AXIS_DCTT,
    summary: canonicalProfile.summary,
    keyTerms: Array.from(new Set(canonicalProfile.keyTerms)).slice(0, 32),
    documentMetadata: {
      ...existingMetadata,
      canonicalProfileRevision: DOCUMENT_PROFILE_CANONICAL_FIX_REVISION,
      canonicalProfileApplied: true,
      canonicalProfileReadGuardApplied: true,
      canonicalVolume: canonicalProfile.volume,
      canonicalTitle: canonicalProfile.title,
      canonicalDocumentKind: "CANONICAL_CORPUS_VOLUME",
      portaleV5GuardApplied: canonicalProfile.volume === "V5",
      alienCodeV4GuardApplied: canonicalProfile.volume === "V4",
      legalCertification: false,
      opc: "technical proof receipt only"
    }
  };
}


type DocumentTextChunkTableStep = {
  name: string;
  ok: boolean;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
};


async function runDocumentTextChunkSchemaStep(name: string, sql: string): Promise<DocumentTextChunkTableStep> {
  const startedAt = Date.now();


  try {
    const result = await queryHbceDatabase(sql);


    return {
      name,
      ok: result.ok,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      name,
      ok: false,
      error: error instanceof Error ? error.message : `${name}_FAILED`,
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


async function ensureDocumentTextChunksTable(): Promise<{ ok: boolean; error: string | null; sqlHash: string | null; durationMs: number }> {
  const startedAt = Date.now();
  const steps: DocumentTextChunkTableStep[] = [];


  const schemaStatements: Array<[string, string]> = [
    [
      "create_table",
      `CREATE TABLE IF NOT EXISTS document_text_chunks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        human_ipr TEXT NOT NULL,
        runtime_ipr TEXT NOT NULL,
        document_profile_id TEXT,
        file_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_hash TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        char_start INTEGER NOT NULL,
        char_end INTEGER NOT NULL,
        text_hash TEXT NOT NULL,
        heading_path TEXT,
        section_type TEXT,
        text TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    ],
    ["add_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS id TEXT"],
    ["add_tenant_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS tenant_id TEXT"],
    ["add_workspace_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS workspace_id TEXT"],
    ["add_human_ipr", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS human_ipr TEXT"],
    ["add_runtime_ipr", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS runtime_ipr TEXT"],
    ["add_document_profile_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS document_profile_id TEXT"],
    ["add_file_id", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS file_id TEXT"],
    ["add_filename", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS filename TEXT"],
    ["add_file_hash", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS file_hash TEXT"],
    ["add_chunk_index", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER"],
    ["add_char_start", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS char_start INTEGER"],
    ["add_char_end", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS char_end INTEGER"],
    ["add_text_hash", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS text_hash TEXT"],
    ["add_heading_path", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS heading_path TEXT"],
    ["add_section_type", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS section_type TEXT"],
    ["add_text", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS text TEXT"],
    ["add_metadata", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb"],
    ["add_created_at", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
    ["add_updated_at", "ALTER TABLE document_text_chunks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"],
    [
      "profile_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_profile ON document_text_chunks (tenant_id, workspace_id, document_profile_id, chunk_index)"
    ],
    [
      "file_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_file ON document_text_chunks (tenant_id, workspace_id, file_id, file_hash, chunk_index)"
    ],
    [
      "human_ipr_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_human_ipr ON document_text_chunks (human_ipr, tenant_id, workspace_id, file_id)"
    ],
    [
      "scope_unique_index",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_document_text_chunks_scope_unique ON document_text_chunks (tenant_id, workspace_id, human_ipr, file_id, file_hash, chunk_index, text_hash)"
    ],
    [
      "text_hash_index",
      "CREATE INDEX IF NOT EXISTS idx_document_text_chunks_text_hash ON document_text_chunks (text_hash)"
    ]
  ];


  for (const [name, sql] of schemaStatements) {
    const step = await runDocumentTextChunkSchemaStep(name, sql);
    steps.push(step);


    if (!step.ok) {
      return {
        ok: false,
        error: `DOCUMENT_TEXT_CHUNKS_SCHEMA_STEP_FAILED:${name}:${step.error || "UNKNOWN_ERROR"}`,
        sqlHash: step.sqlHash,
        durationMs: Date.now() - startedAt
      };
    }
  }


  return {
    ok: true,
    error: null,
    sqlHash: buildHash(steps.map((step) => `${step.name}:${step.sqlHash || "NO_SQL_HASH"}`).join("|")),
    durationMs: Date.now() - startedAt
  };
}


async function countPersistedDocumentChunksForFile(
  file: StoredRuntimeFile,
  context: DocumentProfileContext
): Promise<{ ok: boolean; count: number; error: string | null; sqlHash: string | null; durationMs: number }> {
  const startedAt = Date.now();
  const sql = `
    SELECT COUNT(*)::int AS count
    FROM document_text_chunks
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND human_ipr = $3
      AND file_id = $4
      AND file_hash = $5
  `;


  try {
    const result = await queryHbceDatabase(sql, [
      context.tenantId,
      context.workspaceId,
      context.humanIpr,
      file.id,
      file.fileHash
    ]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const rawCount = row?.count;
    const count = typeof rawCount === "number" ? rawCount : Number(rawCount || 0);


    return {
      ok: result.ok,
      count: Number.isFinite(count) ? count : 0,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: error instanceof Error ? error.message : "DOCUMENT_TEXT_CHUNK_COUNT_QUERY_FAILED",
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


async function persistDocumentChunksForFile(
  file: StoredRuntimeFile,
  context: DocumentProfileContext,
  documentProfileId: string | null
): Promise<DocumentChunkPersistenceResult> {
  const startedAt = Date.now();


  storeRuntimeDocumentChunks(file, documentProfileId);


  if (!isPromptTextStatus(file.status) || file.documentChunks.length === 0) {
    return {
      attempted: false,
      ok: true,
      status: "SKIPPED",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: 0,
      persistedCount: 0,
      insertedCount: 0,
      databaseVerified: true,
      verificationCount: 0,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: null,
      sqlHash: null,
      verificationSqlHash: null,
      durationMs: 0
    };
  }


  const table = await ensureDocumentTextChunksTable();


  if (!table.ok) {
    return {
      attempted: true,
      ok: false,
      status: "DATABASE_NOT_READY",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: file.documentChunks.length,
      persistedCount: 0,
      insertedCount: 0,
      databaseVerified: false,
      verificationCount: 0,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: table.error,
      sqlHash: table.sqlHash,
      verificationSqlHash: null,
      durationMs: table.durationMs
    };
  }


  try {
    const deleteResult = await queryHbceDatabase(
      `DELETE FROM document_text_chunks
       WHERE tenant_id = $1
         AND workspace_id = $2
         AND human_ipr = $3
         AND file_id = $4
         AND file_hash = $5`,
      [context.tenantId, context.workspaceId, context.humanIpr, file.id, file.fileHash]
    );


    if (!deleteResult.ok) {
      throw new Error(deleteResult.error || "DOCUMENT_TEXT_CHUNKS_DELETE_FAILED");
    }


    let insertedCount = 0;
    let lastSqlHash: string | null = deleteResult.sqlHash;


    for (let index = 0; index < file.documentChunks.length; index += LONG_DOCUMENT_CHUNK_INSERT_BATCH_SIZE) {
      const batch = file.documentChunks.slice(index, index + LONG_DOCUMENT_CHUNK_INSERT_BATCH_SIZE);


      for (const chunk of batch) {
        const databaseChunkId = buildHash({
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          humanIpr: context.humanIpr,
          fileId: chunk.fileId,
          fileHash: chunk.fileHash,
          chunkIndex: chunk.chunkIndex,
          textHash: chunk.textHash
        }).replace("sha256:", "docchunk-").slice(0, 56);
        const metadata = {
          routeVersion: FILE_ROUTE_REVISION,
          chunkPersistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
          deployProofRevision: DOCUMENT_CHUNK_DEPLOY_PROOF_REVISION,
          persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
          derivedFromHumanIpr: context.humanIpr,
          tenantId: context.tenantId,
          workspaceId: context.workspaceId,
          runtimeIpr: context.runtimeIpr,
          documentProfileId,
          sourceRuntimeChunkId: chunk.id,
          databaseChunkId,
          sourceKind: context.sourceKind,
          sourceFileHash: file.sourceFileHash,
          normalizedTextHash: file.normalizedTextHash,
          runtimePromptTextHash: file.runtimePromptTextHash,
          textCoverageStatus: file.textCoverageStatus,
          fullDocumentCoverage: file.fullDocumentCoverage,
          fullDocumentCoverageReason: file.fullDocumentCoverageReason,
          longDocumentMode: file.longDocumentMode,
          outlineStatus: file.documentOutline.outlineStatus,
          partsDetected: file.documentOutline.partsDetected,
          chaptersDetected: file.documentOutline.chaptersDetected,
          appendicesDetected: file.documentOutline.appendicesDetected,
          firstSectionDetected: file.documentOutline.firstSectionDetected,
          lastSectionDetected: file.documentOutline.lastSectionDetected,
          lastAppendixDetected: file.documentOutline.lastAppendixDetected,
          legalCertification: false,
          opc: "technical proof receipt only"
        };


        const result = await queryHbceDatabase(
          `
            INSERT INTO document_text_chunks (
              id, tenant_id, workspace_id, human_ipr, runtime_ipr, document_profile_id,
              file_id, filename, file_hash, chunk_index, char_start, char_end, text_hash,
              heading_path, section_type, text, metadata, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17::jsonb, $18, $19
            )
          `,
          [
            databaseChunkId,
            context.tenantId,
            context.workspaceId,
            context.humanIpr,
            context.runtimeIpr,
            documentProfileId,
            chunk.fileId,
            chunk.filename,
            chunk.fileHash,
            chunk.chunkIndex,
            chunk.charStart,
            chunk.charEnd,
            chunk.textHash,
            chunk.headingPath,
            chunk.sectionType,
            chunk.text,
            JSON.stringify(metadata),
            chunk.createdAt,
            nowIso()
          ]
        );


        lastSqlHash = result.sqlHash;
        if (!result.ok) {
          throw new Error(result.error || "DOCUMENT_TEXT_CHUNK_INSERT_FAILED");
        }


        insertedCount += 1;
      }
    }


    const verified = await countPersistedDocumentChunksForFile(file, context);
    lastSqlHash = verified.sqlHash || lastSqlHash;


    if (!verified.ok) {
      return {
        attempted: true,
        ok: false,
        status: "PERSISTENCE_FAILED",
        table: "document_text_chunks",
        documentProfileId,
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        chunkCount: file.documentChunks.length,
        persistedCount: insertedCount,
        insertedCount,
        databaseVerified: false,
        verificationCount: 0,
        persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
        persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
        derivedFromHumanIpr: context.humanIpr,
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        fullDocumentCoverage: file.fullDocumentCoverage,
        textCoverageStatus: file.textCoverageStatus,
        error: verified.error || "DOCUMENT_TEXT_CHUNK_VERIFICATION_QUERY_FAILED",
        sqlHash: lastSqlHash,
        verificationSqlHash: verified.sqlHash,
        durationMs: Date.now() - startedAt
      };
    }


    const persistedCount = verified.count;
    const ok = persistedCount === file.documentChunks.length;


    return {
      attempted: true,
      ok,
      status: ok ? "PERSISTED" : "PERSISTENCE_FAILED",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: file.documentChunks.length,
      persistedCount,
      insertedCount,
      databaseVerified: true,
      verificationCount: persistedCount,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: ok ? null : `DOCUMENT_TEXT_CHUNK_COUNT_MISMATCH:inserted=${insertedCount};verified=${persistedCount};expected=${file.documentChunks.length}`,
      sqlHash: lastSqlHash,
      verificationSqlHash: verified.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      status: "PERSISTENCE_FAILED",
      table: "document_text_chunks",
      documentProfileId,
      fileId: file.id,
      filename: file.name,
      fileHash: file.fileHash,
      chunkCount: file.documentChunks.length,
      persistedCount: 0,
      insertedCount: 0,
      databaseVerified: false,
      verificationCount: 0,
      persistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
      persistenceScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      derivedFromHumanIpr: context.humanIpr,
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      fullDocumentCoverage: file.fullDocumentCoverage,
      textCoverageStatus: file.textCoverageStatus,
      error: error instanceof Error ? error.message : "DOCUMENT_TEXT_CHUNK_PERSISTENCE_FAILED",
      sqlHash: null,
      verificationSqlHash: null,
      durationMs: Date.now() - startedAt
    };
  }
}


function buildDeterministicDocumentProfileId(file: StoredRuntimeFile, context: DocumentProfileContext): string {
  return buildHash({
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    humanIpr: context.humanIpr,
    fileId: file.id,
    fileHash: file.fileHash,
    filename: file.name
  }).replace("sha256:", "DOC-PROFILE-").slice(0, 28).toUpperCase();
}


function extractPersistedDocumentProfileId(
  publicProfile: Record<string, unknown> | null,
  row: Record<string, unknown> | null | undefined,
  file: StoredRuntimeFile,
  context: DocumentProfileContext
): string {
  const candidates = [
    publicProfile?.profileId,
    publicProfile?.documentProfileId,
    publicProfile?.id,
    row?.profile_id,
    row?.profileId,
    row?.document_profile_id,
    row?.id
  ];


  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }


  return buildDeterministicDocumentProfileId(file, context);
}


function withResolvedPublicProfileId<T extends Record<string, unknown> | null>(
  profile: T,
  profileId: string
): T {
  if (!profile) {
    return profile;
  }


  return {
    ...profile,
    profileId,
    documentProfileId: profile.documentProfileId ?? profileId
  } as T;
}


function storeRuntimeDocumentChunks(file: StoredRuntimeFile, documentProfileId: string | null): void {
  const store = getDocumentChunkStore();
  const key = `${file.id}:${file.fileHash}`;
  const chunks = file.documentChunks.map((chunk) => ({
    ...chunk,
    documentProfileId
  }));


  store.set(key, chunks);
}


async function persistDocumentProfilesForSession(
  files: StoredRuntimeFile[],
  context: DocumentProfileContext
): Promise<DocumentProfilePersistenceResult[]> {
  if (files.length === 0) {
    return [];
  }


  const readiness = await ensureHbceDatabaseReady();


  if (!readiness.ok) {
    return files.map((file) => {
      const input = buildDocumentProfileInput(file, context);


      return {
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: false,
        status: "DATABASE_NOT_READY",
        rowCount: 0,
        error: readiness.initialization.error || readiness.description.status,
        sqlHash: readiness.initialization.sqlHash,
        durationMs: readiness.initialization.durationMs,
        profile: null,
        chunks: null,
        technicalMemory: null,
        input: buildDocumentProfilePersistenceInputSummary(input, file)
      };
    });
  }


  const results: DocumentProfilePersistenceResult[] = [];


  for (const file of files) {
    const input = buildDocumentProfileInput(file, context);


    try {
      const result = await upsertDocumentProfileToDatabase(input);
      const row = result.rows[0] as Record<string, unknown> | undefined;
      const canonicalPublicProfile = row
        ? canonicalizePublicDocumentProfileForRead(toPublicDocumentProfile(row) as Record<string, unknown>)
        : null;
      const resolvedProfileId = extractPersistedDocumentProfileId(canonicalPublicProfile, row, file, context);
      const chunks = await persistDocumentChunksForFile(file, context, resolvedProfileId);
      const technicalMemory = buildB2gTechnicalMemoryCollapseForFile(
        file,
        context,
        resolvedProfileId,
        "PERSISTED",
        chunks
      );
      const proofInput = applyB2gTechnicalMemoryCollapseToInput(
        applyDocumentChunkPersistenceProofToInput(input, chunks),
        technicalMemory
      );
      const proofResult = await upsertDocumentProfileToDatabase(proofInput);
      const proofRow = proofResult.rows[0] as Record<string, unknown> | undefined;
      const proofPublicProfile = proofRow
        ? canonicalizePublicDocumentProfileForRead(toPublicDocumentProfile(proofRow) as Record<string, unknown>)
        : canonicalPublicProfile;
      const publicProfile = withDocumentChunkPersistenceProof(
        withResolvedPublicProfileId(proofPublicProfile, resolvedProfileId),
        chunks
      );
      const profileOk = result.ok && result.rowCount > 0;
      const proofOk = proofResult.ok && proofResult.rowCount > 0;


      results.push({
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: profileOk && chunks.ok && proofOk,
        status: profileOk && proofOk ? "PERSISTED" : "PERSISTENCE_FAILED",
        rowCount: proofResult.rowCount || result.rowCount,
        error: result.error || chunks.error || proofResult.error,
        sqlHash: proofResult.sqlHash || chunks.sqlHash || result.sqlHash,
        durationMs: result.durationMs + chunks.durationMs + proofResult.durationMs,
        profile: publicProfile,
        chunks,
        technicalMemory,
        input: buildDocumentProfilePersistenceInputSummary(proofInput, file)
      });
    } catch (error) {
      results.push({
        fileId: file.id,
        filename: file.name,
        fileHash: file.fileHash,
        attempted: true,
        ok: false,
        status: "PERSISTENCE_FAILED",
        rowCount: 0,
        error: error instanceof Error ? error.message : "UNKNOWN_DOCUMENT_PROFILE_ERROR",
        sqlHash: null,
        durationMs: 0,
        profile: null,
        chunks: null,
        technicalMemory: null,
        input: buildDocumentProfilePersistenceInputSummary(input, file)
      });
    }
  }


  return results;
}


function attachDocumentProfileResults(
  files: StoredRuntimeFile[],
  profileResults: DocumentProfilePersistenceResult[]
): StoredRuntimeFile[] {
  const byFileId = new Map(profileResults.map((result) => [result.fileId, result]));


  return files.map((file) => {
    const result = byFileId.get(file.id);


    if (!result) {
      return {
        ...file,
        documentProfileStatus: "SKIPPED",
        documentProfileReason: "No document profile persistence result was produced for this file."
      };
    }


    return {
      ...file,
      documentProfileId:
        typeof result.profile?.profileId === "string" ? result.profile.profileId : null,
      documentProfileStatus: result.status,
      documentProfileHash:
        typeof result.profile?.profileHash === "string" ? result.profile.profileHash : null,
      documentProfileReason: result.ok
        ? "Document profile persisted in the cybernetic document registry."
        : result.error || "Document profile persistence did not complete.",
      documentChunksPersisted: result.chunks?.ok ?? false,
      documentChunksPersistedCount: result.chunks?.persistedCount ?? 0,
      documentChunkPersistenceStatus: result.chunks?.status ?? null,
      documentChunkPersistenceReason: describeDocumentChunkPersistenceReason(result.chunks),
      documentChunkPersistenceError: result.chunks?.error ?? null,
      documentChunkPersistenceRevision: result.chunks?.persistenceRevision ?? null,
      documentChunkPersistenceScope: result.chunks?.persistenceScope ?? null,
      documentChunkDerivedFromHumanIpr: result.chunks?.derivedFromHumanIpr ?? null,
      documentChunkDatabaseVerified: result.chunks?.databaseVerified ?? null,
      documentChunkVerificationCount: result.chunks?.verificationCount ?? null,
      documentChunkVerificationSqlHash: result.chunks?.verificationSqlHash ?? null,
      b2gTechnicalMemory: result.technicalMemory,
      b2gTechnicalMemoryStatus: readTechnicalMemoryString(result.technicalMemory, "status"),
      b2gTechnicalMemoryReady:
        result.technicalMemory?.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
      b2gTechnicalMemoryReadyForIprSave: result.technicalMemory?.readyForIprSave === true,
      b2gTechnicalMemoryFailReason: readTechnicalMemoryString(result.technicalMemory, "failReason"),
      b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION
    };
  });
}


function normalizeSingleFile(
  file: RuntimeFile,
  index: number
): StoredRuntimeFile {
  const timestamp = nowIso();
  const name = normalizeFileName(file.name, index);
  const mimeType = normalizeMimeType(file, name);
  const role = normalizeRole(file.role);
  const directText = extractDirectTextWithSource(file);
  const rawText = directText.text;
  const normalizedText = safeTrimText(rawText);
  const hasText = normalizedText.trim().length > 0;
  const textLength = normalizedText.length;


  const declaredSize =
    typeof file.size === "number" && Number.isFinite(file.size)
      ? Math.max(0, Math.floor(file.size))
      : textLength;


  const baseId =
    typeof file.id === "string" && file.id.trim()
      ? file.id.trim()
      : `${name}:${mimeType}:${declaredSize}:${textLength}:${index}`;


  const id = buildHash(baseId).replace("sha256:", "file-").slice(0, 48);


  if (isPdfMimeType(mimeType, name)) {
    const pdfExtraction = extractPdfText(file);
    const pdfText = safeTrimText(pdfExtraction.text);
    const pdfTextLength = pdfText.length;
    const pdfSourceKind: TextSourceKind =
      pdfExtraction.source === "DIRECT_TEXT"
        ? "PDF_DIRECT_TEXT"
        : pdfExtraction.source === "PDF_BINARY"
          ? "PDF_BINARY"
          : pdfExtraction.source === "PDF_BASE64"
            ? "PDF_BASE64"
            : pdfExtraction.source === "PDF_DATA_URL"
              ? "PDF_DATA_URL"
              : "NONE";


    if (pdfText.trim()) {
      return buildStoredRuntimeFileBase({
        id,
        name,
        mimeType,
        declaredSize,
        text: pdfText,
        role,
        status: "PDF_INGESTION_READY",
        mode: "PDF_TEXT",
        textSourceKind: pdfSourceKind,
        reason: `${pdfExtraction.reason} Source=${pdfExtraction.source}.`,
        timestamp
      });
    }


    if (pdfExtraction.failed) {
      return buildStoredRuntimeFileBase({
        id,
        name,
        mimeType,
        declaredSize,
        text: "",
        role,
        status: "PDF_INGESTION_FAIL",
        mode: "REFERENCE_ONLY",
        textSourceKind: "NONE",
        reason: pdfExtraction.reason,
        timestamp
      });
    }


    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: "",
      role,
      status: "PDF_METADATA_ONLY",
      mode: "REFERENCE_ONLY",
      textSourceKind: "NONE",
      reason: pdfExtraction.reason,
      timestamp
    });
  }


  if (hasText && isTextMimeType(mimeType)) {
    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: normalizedText,
      role,
      status: "TEXT_READY",
      mode: "TEXT",
      textSourceKind: directText.source,
      reason: "File contains readable text and can be used as prompt context.",
      timestamp
    });
  }


  if (hasText && !isReferenceOnlyMimeType(mimeType)) {
    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: normalizedText,
      role,
      status: "TEXT_READY",
      mode: "TEXT",
      textSourceKind: directText.source,
      reason: "File contains extracted text. MIME type is not explicitly text, but safe extracted text is available.",
      timestamp
    });
  }


  if (isReferenceOnlyMimeType(mimeType)) {
    return buildStoredRuntimeFileBase({
      id,
      name,
      mimeType,
      declaredSize,
      text: "",
      role,
      status: "REFERENCE_ONLY",
      mode: "REFERENCE_ONLY",
      textSourceKind: "NONE",
      reason: "File is active only as a reference. It was not converted into readable prompt text.",
      timestamp
    });
  }


  return buildStoredRuntimeFileBase({
    id,
    name,
    mimeType,
    declaredSize,
    text: "",
    role,
    status: "REJECTED",
    mode: "REJECTED",
    textSourceKind: "NONE",
    reason: "File has no readable text and its MIME type is not supported as a safe reference-only file.",
    timestamp
  });
}


function normalizeFiles(files: unknown): StoredRuntimeFile[] {
  if (!Array.isArray(files)) {
    return [];
  }


  return files.map((file, index) => {
    return normalizeSingleFile(file as RuntimeFile, index);
  });
}


function dedupeFiles(files: StoredRuntimeFile[]): StoredRuntimeFile[] {
  const seen = new Set<string>();
  const result: StoredRuntimeFile[] = [];


  for (const file of files) {
    const key = `${file.id}:${file.fileHash}`;


    if (seen.has(key)) {
      continue;
    }


    seen.add(key);
    result.push(file);
  }


  return result;
}


function enforceSessionLimits(files: StoredRuntimeFile[]): StoredRuntimeFile[] {
  const latestFiles = files.slice(-MAX_FILES_PER_SESSION);
  const result: StoredRuntimeFile[] = [];
  let totalTextLength = 0;


  for (let index = latestFiles.length - 1; index >= 0; index -= 1) {
    const file = latestFiles[index];


    if (!file) {
      continue;
    }


    if (!isPromptTextStatus(file.status)) {
      result.unshift(file);
      continue;
    }


    if (totalTextLength + file.textLength > MAX_TOTAL_TEXT_CHARS_PER_SESSION) {
      const downgradedStatus: FileStatus =
        file.status === "PDF_INGESTION_READY"
          ? "PDF_METADATA_ONLY"
          : "REFERENCE_ONLY";


      result.unshift({
        ...file,
        text: "",
        content: "",
        textLength: 0,
        status: downgradedStatus,
        mode: "REFERENCE_ONLY",
        reason:
          "File was converted to reference-only because the session text limit was reached. legalCertification=false. OPC=technical proof receipt only.",
        updatedAt: nowIso()
      });
      continue;
    }


    totalTextLength += file.textLength;
    result.unshift(file);
  }


  return result;
}


function mergeFiles(
  existingFiles: StoredRuntimeFile[],
  incomingFiles: StoredRuntimeFile[]
): StoredRuntimeFile[] {
  const merged = dedupeFiles([...existingFiles, ...incomingFiles]);


  return enforceSessionLimits(merged);
}


function summarizeFiles(files: StoredRuntimeFile[], includeText: boolean, includeChunks = false) {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    type: file.type,
    size: file.size,
    role: file.role,
    textLength: file.textLength,
    fullTextLength: file.fullTextLength,
    promptTextLength: file.promptTextLength,
    sourceFileHash: file.sourceFileHash,
    normalizedTextHash: file.normalizedTextHash,
    runtimePromptTextHash: file.runtimePromptTextHash,
    sourceByteLength: file.sourceByteLength,
    normalizedTextLength: file.normalizedTextLength,
    textSourceKind: file.textSourceKind,
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    fullDocumentCoverageReason: file.fullDocumentCoverageReason,
    longDocumentMode: file.longDocumentMode,
    documentChunkCount: file.documentChunkCount,
    documentChunksPersisted: file.documentChunksPersisted ?? null,
    documentChunksPersistedCount: file.documentChunksPersistedCount ?? null,
    documentChunkPersistenceStatus: file.documentChunkPersistenceStatus ?? null,
    documentChunkPersistenceReason: file.documentChunkPersistenceReason ?? null,
    documentChunkPersistenceError: file.documentChunkPersistenceError ?? null,
    documentChunkPersistenceRevision: file.documentChunkPersistenceRevision ?? null,
    documentChunkPersistenceScope: file.documentChunkPersistenceScope ?? null,
    documentChunkDerivedFromHumanIpr: file.documentChunkDerivedFromHumanIpr ?? null,
    documentChunkDatabaseVerified: file.documentChunkDatabaseVerified ?? null,
    documentChunkVerificationCount: file.documentChunkVerificationCount ?? null,
    documentOutline: {
      outlineStatus: file.documentOutline.outlineStatus,
      partsDetected: file.documentOutline.partsDetected,
      chaptersDetected: file.documentOutline.chaptersDetected,
      appendicesDetected: file.documentOutline.appendicesDetected,
      firstSectionDetected: file.documentOutline.firstSectionDetected,
      lastSectionDetected: file.documentOutline.lastSectionDetected,
      lastAppendixDetected: file.documentOutline.lastAppendixDetected,
      boundaryDetected: file.documentOutline.boundaryDetected,
      conclusionDetected: file.documentOutline.conclusionDetected,
      entries: file.documentOutline.entries
    },
    fileHash: file.fileHash,
    status: file.status,
    mode: file.mode,
    reason: file.reason,
    documentProfileId: file.documentProfileId ?? null,
    documentProfileStatus: file.documentProfileStatus ?? null,
    documentProfileHash: file.documentProfileHash ?? null,
    documentProfileReason: file.documentProfileReason ?? null,
    b2gTechnicalMemory: file.b2gTechnicalMemory ?? null,
    b2gTechnicalMemoryStatus: file.b2gTechnicalMemoryStatus ?? null,
    b2gTechnicalMemoryReady: file.b2gTechnicalMemoryReady === true,
    b2gTechnicalMemoryReadyForIprSave: file.b2gTechnicalMemoryReadyForIprSave === true,
    b2gTechnicalMemoryFailReason: file.b2gTechnicalMemoryFailReason ?? null,
    b2gTechnicalMemoryCollapseRevision: file.b2gTechnicalMemoryCollapseRevision ?? null,
    b2gTechnicalMemoryPromptBridge: buildB2gTechnicalMemoryPromptBridge(file.b2gTechnicalMemory),
    b2gTechnicalMemoryGuards: {
      noQuantumStates: readTechnicalMemoryGuardBoolean(file.b2gTechnicalMemory, "noQuantumStates"),
      noQstateOutput: readTechnicalMemoryGuardBoolean(file.b2gTechnicalMemory, "noQstateOutput"),
      noCorpusCollapse: readTechnicalMemoryGuardBoolean(file.b2gTechnicalMemory, "noCorpusCollapse"),
      noSemanticEsoterologicalMemory: readTechnicalMemoryGuardBoolean(
        file.b2gTechnicalMemory,
        "noSemanticEsoterologicalMemory"
      ),
      noDcttAxisForB2gTechnicalModules: readTechnicalMemoryGuardBoolean(
        file.b2gTechnicalMemory,
        "noDcttAxisForB2gTechnicalModules"
      )
    },
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    text: includeText ? file.text : undefined,
    content: includeText ? file.content : undefined,
    documentChunks: includeChunks
      ? file.documentChunks.map((chunk) => ({
          id: chunk.id,
          chunkIndex: chunk.chunkIndex,
          charStart: chunk.charStart,
          charEnd: chunk.charEnd,
          textHash: chunk.textHash,
          headingPath: chunk.headingPath,
          sectionType: chunk.sectionType,
          text: includeText ? chunk.text : undefined
        }))
      : undefined
  }));
}




type DatabaseObjectDiagnostic = {
  requestedName: string;
  available: boolean;
  status: "AVAILABLE" | "NOT_FOUND" | "QUERY_FAILED";
  resolvedName: string | null;
  error: string | null;
  sqlHash: string | null;
  durationMs: number;
};


type FilesRouteDiagnosticContext = {
  sessionId: string;
  files: StoredRuntimeFile[];
  humanIpr: string;
  tenantId: string;
  workspaceId: string;
  publicDocumentProfiles?: Record<string, unknown>[];
};


function isAffirmativeSearchParam(value: string | null): boolean {
  if (!value) {
    return false;
  }


  const normalized = value.trim().toLowerCase();


  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}


function getLatestRuntimeFile(files: StoredRuntimeFile[]): StoredRuntimeFile | null {
  return files.length > 0 ? files[files.length - 1] ?? null : null;
}


function buildDiagnosticFileSnapshot(file: StoredRuntimeFile | null) {
  if (!file) {
    return null;
  }


  return {
    fileId: file.id,
    filename: file.name,
    mimeType: file.mimeType,
    size: file.size,
    status: file.status,
    mode: file.mode,
    textLength: file.textLength,
    fullTextLength: file.fullTextLength,
    promptTextLength: file.promptTextLength,
    sourceFileHash: file.sourceFileHash,
    normalizedTextHash: file.normalizedTextHash,
    runtimePromptTextHash: file.runtimePromptTextHash,
    sourceByteLength: file.sourceByteLength,
    normalizedTextLength: file.normalizedTextLength,
    fileHash: file.fileHash,
    textSourceKind: file.textSourceKind,
    textCoverageStatus: file.textCoverageStatus,
    fullDocumentCoverage: file.fullDocumentCoverage,
    fullDocumentCoverageReason: file.fullDocumentCoverageReason,
    longDocumentMode: file.longDocumentMode,
    documentProfileId: file.documentProfileId ?? null,
    documentProfileStatus: file.documentProfileStatus ?? null,
    documentProfileHash: file.documentProfileHash ?? null,
    documentProfileReason: file.documentProfileReason ?? null,
    b2gTechnicalMemory: file.b2gTechnicalMemory ?? null,
    b2gTechnicalMemoryStatus: file.b2gTechnicalMemoryStatus ?? null,
    b2gTechnicalMemoryReady: file.b2gTechnicalMemoryReady === true,
    b2gTechnicalMemoryReadyForIprSave: file.b2gTechnicalMemoryReadyForIprSave === true,
    b2gTechnicalMemoryFailReason: file.b2gTechnicalMemoryFailReason ?? null,
    b2gTechnicalMemoryCollapseRevision: file.b2gTechnicalMemoryCollapseRevision ?? null,
    b2gTechnicalMemoryPromptBridge: buildB2gTechnicalMemoryPromptBridge(file.b2gTechnicalMemory),
    b2gTechnicalMemoryGuards: {
      noQuantumStates: readTechnicalMemoryGuardBoolean(file.b2gTechnicalMemory, "noQuantumStates"),
      noQstateOutput: readTechnicalMemoryGuardBoolean(file.b2gTechnicalMemory, "noQstateOutput"),
      noCorpusCollapse: readTechnicalMemoryGuardBoolean(file.b2gTechnicalMemory, "noCorpusCollapse"),
      noSemanticEsoterologicalMemory: readTechnicalMemoryGuardBoolean(
        file.b2gTechnicalMemory,
        "noSemanticEsoterologicalMemory"
      ),
      noDcttAxisForB2gTechnicalModules: readTechnicalMemoryGuardBoolean(
        file.b2gTechnicalMemory,
        "noDcttAxisForB2gTechnicalModules"
      )
    },
    documentChunkCount: file.documentChunkCount,
    documentChunksPersisted: file.documentChunksPersisted ?? null,
    documentChunksPersistedCount: file.documentChunksPersistedCount ?? null,
    documentChunkPersistenceStatus: file.documentChunkPersistenceStatus ?? null,
    documentChunkPersistenceReason: file.documentChunkPersistenceReason ?? null,
    documentChunkPersistenceError: file.documentChunkPersistenceError ?? null,
    documentChunkPersistenceRevision: file.documentChunkPersistenceRevision ?? null,
    documentChunkPersistenceScope: file.documentChunkPersistenceScope ?? null,
    documentChunkDerivedFromHumanIpr: file.documentChunkDerivedFromHumanIpr ?? null,
    documentChunkDatabaseVerified: file.documentChunkDatabaseVerified ?? null,
    documentChunkVerificationCount: file.documentChunkVerificationCount ?? null,
    documentChunkVerificationSqlHash: file.documentChunkVerificationSqlHash ?? null,
    outlineStatus: file.documentOutline.outlineStatus,
    majorSectionsDetected: file.documentOutline.partsDetected,
    subsectionsDetected: file.documentOutline.chaptersDetected,
    appendicesDetected: file.documentOutline.appendicesDetected,
    glossaryEntriesDetected: countCorpusGlossaryEntries(file.text),
    firstSectionDetected: file.documentOutline.firstSectionDetected,
    lastSectionDetected: file.documentOutline.lastSectionDetected,
    lastAppendixDetected: file.documentOutline.lastAppendixDetected,
    boundaryDetected: file.documentOutline.boundaryDetected,
    conclusionDetected: file.documentOutline.conclusionDetected,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


function countCorpusGlossaryEntries(text: string): number {
  const lines = text.split("\n");
  let count = 0;
  let inGlossary = false;


  for (const rawLine of lines) {
    const line = normalizeHeadingLabel(rawLine);


    if (/^GLOSSARIO CANONICO DEL CORPUS$/i.test(line) || /^N\.\s*\|\s*A\s*\|\s*B\s*\|/i.test(line)) {
      inGlossary = true;
      continue;
    }


    if (inGlossary && /^15\.2\s+Protocollo di citazione interna del glossario/i.test(line)) {
      break;
    }


    if (inGlossary && /^\d+\.\d+\s+/.test(line)) {
      count += 1;
    }
  }


  return count;
}


async function checkDatabaseObjectAvailability(requestedName: string): Promise<DatabaseObjectDiagnostic> {
  const sql = "SELECT to_regclass($1) AS object_name";
  const startedAt = Date.now();


  try {
    const result = await queryHbceDatabase(sql, [requestedName]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const resolvedName = typeof row?.object_name === "string" ? row.object_name : null;


    return {
      requestedName,
      available: result.ok && Boolean(resolvedName),
      status: !result.ok ? "QUERY_FAILED" : resolvedName ? "AVAILABLE" : "NOT_FOUND",
      resolvedName,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      requestedName,
      available: false,
      status: "QUERY_FAILED",
      resolvedName: null,
      error: error instanceof Error ? error.message : "DATABASE_OBJECT_DIAGNOSTIC_FAILED",
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}


function readRecordString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];


  return typeof value === "string" && value.trim() ? value.trim() : null;
}


function readRecordNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  const numeric = typeof value === "number" ? value : Number(value);


  return Number.isFinite(numeric) ? numeric : null;
}


function readProfileMetadata(profile: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!profile || !profile.documentMetadata || typeof profile.documentMetadata !== "object") {
    return {};
  }


  return profile.documentMetadata as Record<string, unknown>;
}


function chooseLatestCanonicalDocumentProfile(
  profiles: Record<string, unknown>[] | null | undefined
): Record<string, unknown> | null {
  if (!profiles || profiles.length === 0) {
    return null;
  }


  const canonicalFullTextProfiles = profiles.filter((profile) => {
    const metadata = readProfileMetadata(profile);


    return (
      readRecordString(profile, "humanIpr") === HBCE_SELF_PILOT_HUMAN_IPR &&
      readRecordString(metadata, "textCoverageStatus") === "TEXT_READY_FULL" &&
      readRecordString(metadata, "longDocumentMode") === "CHUNKED_FULL_TEXT"
    );
  });


  return canonicalFullTextProfiles[0] ?? profiles[0] ?? null;
}


async function countPersistedDocumentChunksForProfile(
  profile: Record<string, unknown> | null,
  context: FilesRouteDiagnosticContext
): Promise<{ ok: boolean; count: number; error: string | null; sqlHash: string | null; durationMs: number }> {
  const startedAt = Date.now();


  if (!profile) {
    return {
      ok: false,
      count: 0,
      error: "DOCUMENT_PROFILE_NOT_AVAILABLE",
      sqlHash: null,
      durationMs: 0
    };
  }


  const profileId = readRecordString(profile, "profileId") || readRecordString(profile, "documentProfileId");
  const fileId = readRecordString(profile, "fileId");
  const fileHash = readRecordString(profile, "fileHash");
  const humanIpr = readRecordString(profile, "humanIpr") || context.humanIpr;
  const tenantId = readRecordString(profile, "tenantId") || context.tenantId;
  const workspaceId = readRecordString(profile, "workspaceId") || context.workspaceId;


  if (!profileId || !fileId || !fileHash || !humanIpr || !tenantId || !workspaceId) {
    const missingScope = [
      !profileId ? "documentProfileId" : null,
      !fileId ? "fileId" : null,
      !fileHash ? "fileHash" : null,
      !humanIpr ? "humanIpr" : null,
      !tenantId ? "tenantId" : null,
      !workspaceId ? "workspaceId" : null
    ].filter(Boolean).join(",");


    return {
      ok: false,
      count: 0,
      error: `DOCUMENT_PROFILE_CHUNK_COUNT_MISSING_SCOPE:${missingScope || "UNKNOWN"}`,
      sqlHash: null,
      durationMs: Date.now() - startedAt
    };
  }


  const sql = `
    SELECT COUNT(*)::int AS count
    FROM document_text_chunks
    WHERE tenant_id = $1
      AND workspace_id = $2
      AND human_ipr = $3
      AND document_profile_id = $4
      AND file_id = $5
      AND file_hash = $6
  `;


  try {
    const result = await queryHbceDatabase(sql, [tenantId, workspaceId, humanIpr, profileId, fileId, fileHash]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const count = Number(row?.count ?? 0);


    return {
      ok: result.ok,
      count: Number.isFinite(count) ? count : 0,
      error: result.error,
      sqlHash: result.sqlHash,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      error: error instanceof Error ? error.message : "DOCUMENT_PROFILE_CHUNK_COUNT_QUERY_FAILED",
      sqlHash: buildHash(sql),
      durationMs: Date.now() - startedAt
    };
  }
}

function buildDiagnosticDocumentProfileSnapshot(
  profile: Record<string, unknown> | null,
  persistedCount: number | null = null
) {
  if (!profile) {
    return null;
  }


  const metadata = readProfileMetadata(profile);
  const expectedCount = readRecordNumber(metadata, "documentChunkCount") ?? readRecordNumber(profile, "documentChunkCount") ?? 0;
  const metadataPersistedCount = readRecordNumber(metadata, "documentChunksPersistedCount");
  const effectivePersistedCount = persistedCount ?? metadataPersistedCount ?? 0;
  const metadataPersisted = metadata.documentChunksPersisted === true;
  const countMatchesExpected = expectedCount > 0 && effectivePersistedCount === expectedCount;
  const databaseVerified = metadata.documentChunkDatabaseVerified === true && countMatchesExpected;


  return {
    profileId: readRecordString(profile, "profileId") || readRecordString(profile, "documentProfileId"),
    fileId: readRecordString(profile, "fileId"),
    filename: readRecordString(profile, "filename"),
    fileHash: readRecordString(profile, "fileHash"),
    humanIpr: readRecordString(profile, "humanIpr"),
    tenantId: readRecordString(profile, "tenantId"),
    workspaceId: readRecordString(profile, "workspaceId"),
    textStatus: readRecordString(profile, "textStatus"),
    textLength: readRecordNumber(profile, "textLength"),
    docFamily: readRecordString(profile, "docFamily"),
    volume: readRecordString(profile, "volume"),
    title: readRecordString(profile, "title"),
    profileStatus: readRecordString(profile, "profileStatus"),
    b2gTechnicalMemoryStatus: readRecordString(metadata, "b2gTechnicalMemoryStatus"),
    b2gTechnicalMemoryReady: metadata.b2gTechnicalMemoryReady === true,
    b2gTechnicalMemoryReadyForIprSave: metadata.b2gTechnicalMemoryReadyForIprSave === true,
    b2gTechnicalMemoryFailReason: readRecordString(metadata, "b2gTechnicalMemoryFailReason"),
    b2gTechnicalMemoryCollapseRevision: readRecordString(metadata, "b2gTechnicalMemoryCollapseRevision"),
    routeVersion: readRecordString(metadata, "routeVersion"),
    textCoverageStatus: readRecordString(metadata, "textCoverageStatus"),
    fullDocumentCoverage: metadata.fullDocumentCoverage === true,
    longDocumentMode: readRecordString(metadata, "longDocumentMode"),
    documentChunkCount: expectedCount,
    documentChunksPersisted: metadataPersisted && countMatchesExpected,
    documentChunksPersistedCount: effectivePersistedCount,
    documentChunkCountMatchesExpected: countMatchesExpected,
    documentChunkDiagnosticScope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
    documentChunkPersistenceStatus: readRecordString(metadata, "documentChunkPersistenceStatus"),
    documentChunkPersistenceReason: readRecordString(metadata, "documentChunkPersistenceReason"),
    documentChunkPersistenceError: readRecordString(metadata, "documentChunkPersistenceError"),
    documentChunkPersistenceRevision: readRecordString(metadata, "documentChunkPersistenceRevision"),
    documentChunkDatabaseVerified: databaseVerified,
    documentChunkDerivedFromHumanIpr: readRecordString(metadata, "documentChunkDerivedFromHumanIpr") || readRecordString(metadata, "derivedFromHumanIpr"),
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


async function buildFilesRouteSelfDiagnostic(context: FilesRouteDiagnosticContext) {
  const latestFile = getLatestRuntimeFile(context.files);
  const readiness = await ensureHbceDatabaseReady().catch((error) => ({
    ok: false,
    description: {
      status: "DATABASE_READY_CHECK_FAILED",
      configured: false,
      available: false
    },
    initialization: {
      ok: false,
      error: error instanceof Error ? error.message : "DATABASE_READY_CHECK_FAILED",
      sqlHash: null,
      durationMs: 0
    }
  }));
  const documentProfilesTable = await checkDatabaseObjectAvailability("public.document_profiles");
  const documentTextChunksTable = await checkDatabaseObjectAvailability("public.document_text_chunks");
  const documentTextChunksProfileIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_profile");
  const documentTextChunksFileIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_file");
  const documentTextChunksHumanIprIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_human_ipr");
  const documentTextChunksScopeUniqueIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_scope_unique");
  const documentTextChunksTextHashIndex = await checkDatabaseObjectAvailability("public.idx_document_text_chunks_text_hash");
  const runtimeChunkStoreCount = Array.from(getDocumentChunkStore().values()).reduce((sum, chunks) => sum + chunks.length, 0);
  const totalDocumentChunks = context.files.reduce((sum, file) => sum + file.documentChunkCount, 0);
  const persistedDocumentChunks = context.files.reduce((sum, file) => sum + (file.documentChunksPersistedCount ?? 0), 0);
  const latestDocumentProfile = chooseLatestCanonicalDocumentProfile(context.publicDocumentProfiles);
  const latestDocumentProfileChunkCount = await countPersistedDocumentChunksForProfile(latestDocumentProfile, context);
  const latestDocumentProfileSnapshot = buildDiagnosticDocumentProfileSnapshot(
    latestDocumentProfile,
    latestDocumentProfileChunkCount.ok ? latestDocumentProfileChunkCount.count : null
  );
  const missingCriticalFields: string[] = [];


  if (!latestFile && !latestDocumentProfileSnapshot) {
    missingCriticalFields.push("latestFile|latestDocumentProfile");
  }


  if (latestFile && !latestFile.documentProfileId) {
    missingCriticalFields.push("latestFile.documentProfileId");
  }


  if (latestFile && latestFile.documentChunkCount > 0 && !latestFile.documentChunksPersisted) {
    missingCriticalFields.push("latestFile.documentChunksPersisted");
  }


  if (latestFile && !latestFile.sourceFileHash) {
    missingCriticalFields.push("latestFile.sourceFileHash");
  }


  if (latestFile && !latestFile.normalizedTextHash) {
    missingCriticalFields.push("latestFile.normalizedTextHash");
  }


  if (latestFile && !latestFile.runtimePromptTextHash) {
    missingCriticalFields.push("latestFile.runtimePromptTextHash");
  }


  const failReasons = [
    !readiness.ok ? "DATABASE_NOT_READY" : null,
    !documentProfilesTable.available ? "DOCUMENT_PROFILES_TABLE_NOT_AVAILABLE" : null,
    !documentTextChunksTable.available ? "DOCUMENT_TEXT_CHUNKS_TABLE_NOT_AVAILABLE" : null,
    latestFile && latestFile.fullDocumentCoverage !== true ? "LATEST_FILE_FULL_DOCUMENT_COVERAGE_FALSE" : null,
    latestFile && latestFile.longDocumentMode === "CHUNKED_FULL_TEXT" && latestFile.documentChunkCount <= 0 ? "LATEST_FILE_CHUNKS_NOT_BUILT" : null,
    latestFile && latestFile.documentChunkCount > 0 && latestFile.documentChunksPersisted !== true ? "LATEST_FILE_CHUNKS_NOT_PERSISTED" : null,
    !latestFile && latestDocumentProfileSnapshot && latestDocumentProfileSnapshot.documentChunkCount > 0 && latestDocumentProfileSnapshot.documentChunksPersisted !== true ? "LATEST_DOCUMENT_PROFILE_CHUNKS_NOT_PERSISTED" : null,
    !latestFile && latestDocumentProfileSnapshot && latestDocumentProfileSnapshot.documentChunkCount > 0 && latestDocumentProfileSnapshot.documentChunksPersistedCount !== latestDocumentProfileSnapshot.documentChunkCount ? "LATEST_DOCUMENT_PROFILE_CHUNK_COUNT_MISMATCH" : null,
    latestDocumentProfile && !latestDocumentProfileChunkCount.ok ? "LATEST_DOCUMENT_PROFILE_CHUNK_COUNT_QUERY_FAILED" : null,
    missingCriticalFields.length > 0 ? `MISSING_CRITICAL_FIELDS:${missingCriticalFields.join(",")}` : null
  ].filter(Boolean) as string[];


  return {
    status: "FILES_ROUTE_DIAGNOSTIC_READY",
    routeAlive: true,
    endpoint: "HBCE_FILES_INGESTION",
    fileRouteRevision: FILE_ROUTE_REVISION,
    routeVersion: FILE_ROUTE_REVISION,
    selfDiagnosticRevision: "FILES_ROUTE_SELF_DIAGNOSTIC_ENDPOINT-v6_2-LONG_DOCUMENT_CHUNK_DATABASE_PERSISTENCE_HARDENING-v6_3_3",
    documentChunkDatabasePersistenceRevision: DOCUMENT_CHUNK_DATABASE_PERSISTENCE_REVISION,
    sessionId: context.sessionId,
    activeFileCount: context.files.length,
    activeFilesVisibleCount: context.files.length,
    includeChunksSupported: true,
    includeProfilesSupported: true,
    includeDiagnosticsSupported: true,
    sourceFileHashSupported: true,
    normalizedTextHashSupported: true,
    runtimePromptTextHashSupported: true,
    documentOutlineSupported: true,
    canonicalOutlineDetectorActive: true,
    longDocumentChunkingSupported: true,
    b2gTechnicalMemoryCollapseSupported: true,
    b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
    b2gTechnicalMemoryStatusReady: HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
    b2gTechnicalMemoryNoQuantumStates: true,
    b2gTechnicalMemoryNoCorpusCollapse: true,
    runtimeChunkStoreCount,
    totalDocumentChunks,
    persistedDocumentChunks,
    latestDocumentProfile: latestDocumentProfileSnapshot,
    latestCanonicalProfile: latestDocumentProfileSnapshot,
    latestProfileChunkPersistence: {
      ok: latestDocumentProfileChunkCount.ok,
      count: latestDocumentProfileChunkCount.count,
      expectedCount: latestDocumentProfileSnapshot?.documentChunkCount ?? null,
      countMatchesExpected: latestDocumentProfileSnapshot?.documentChunkCountMatchesExpected ?? false,
      scope: DOCUMENT_CHUNK_PERSISTENCE_SCOPE,
      error: latestDocumentProfileChunkCount.error,
      sqlHash: latestDocumentProfileChunkCount.sqlHash,
      durationMs: latestDocumentProfileChunkCount.durationMs
    },
    database: {
      configured: Boolean(readiness.description.configured),
      available: Boolean(readiness.ok && readiness.description.available),
      status: readiness.description.status,
      initializationOk: readiness.initialization.ok,
      initializationError: readiness.initialization.error,
      initializationSqlHash: readiness.initialization.sqlHash,
      initializationDurationMs: readiness.initialization.durationMs
    },
    tables: {
      documentProfiles: documentProfilesTable,
      documentTextChunks: documentTextChunksTable
    },
    indexes: {
      documentTextChunksProfile: documentTextChunksProfileIndex,
      documentTextChunksFile: documentTextChunksFileIndex,
      documentTextChunksHumanIpr: documentTextChunksHumanIprIndex,
      documentTextChunksScopeUnique: documentTextChunksScopeUniqueIndex,
      documentTextChunksTextHash: documentTextChunksTextHashIndex
    },
    latestFile: buildDiagnosticFileSnapshot(latestFile),
    files: context.files.map((file) => buildDiagnosticFileSnapshot(file)),
    failClosed: failReasons.length > 0,
    failReason: failReasons.length > 0 ? failReasons.join("|") : "NONE",
    documentMemoryReady: failReasons.length === 0,
    memorySaveAllowed: failReasons.length === 0,
    noIprSaveAllowedDuringDiagnostic: true,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}

function buildSessionSummary(sessionId: string, files: StoredRuntimeFile[]) {
  const textReadyCount = files.filter((file) => file.status === "TEXT_READY").length;
  const pdfReadyCount = files.filter(
    (file) => file.status === "PDF_INGESTION_READY"
  ).length;
  const pdfMetadataOnlyCount = files.filter(
    (file) => file.status === "PDF_METADATA_ONLY"
  ).length;
  const pdfIngestionFailCount = files.filter(
    (file) => file.status === "PDF_INGESTION_FAIL"
  ).length;
  const referenceOnlyCount = files.filter(
    (file) => file.status === "REFERENCE_ONLY"
  ).length;
  const rejectedCount = files.filter((file) => file.status === "REJECTED").length;
  const totalTextLength = files.reduce((sum, file) => sum + file.textLength, 0);
  const promptReadyCount = files.filter((file) =>
    isPromptTextStatus(file.status)
  ).length;
  const fullDocumentCoverageCount = files.filter((file) => file.fullDocumentCoverage).length;
  const partialDocumentCoverageCount = files.filter(
    (file) => isPromptTextStatus(file.status) && !file.fullDocumentCoverage
  ).length;
  const totalDocumentChunks = files.reduce((sum, file) => sum + file.documentChunkCount, 0);
  const persistedDocumentChunks = files.reduce(
    (sum, file) => sum + (file.documentChunksPersistedCount ?? 0),
    0
  );
  const b2gTechnicalMemoryCount = files.filter((file) => Boolean(file.b2gTechnicalMemory)).length;
  const b2gTechnicalMemoryReadyCount = files.filter(
    (file) => file.b2gTechnicalMemoryStatus === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
  ).length;


  return {
    sessionId,
    count: files.length,
    promptReadyCount,
    textReadyCount,
    pdfReadyCount,
    pdfMetadataOnlyCount,
    pdfIngestionFailCount,
    referenceOnlyCount,
    rejectedCount,
    totalTextLength,
    fullDocumentCoverageCount,
    partialDocumentCoverageCount,
    totalDocumentChunks,
    persistedDocumentChunks,
    b2gTechnicalMemoryCount,
    b2gTechnicalMemoryReadyCount,
    b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
    maxFilesPerSession: MAX_FILES_PER_SESSION,
    maxTextCharsPerFile: MAX_TEXT_CHARS_PER_FILE,
    maxTotalTextCharsPerSession: MAX_TOTAL_TEXT_CHARS_PER_SESSION,
    routeVersion: FILE_ROUTE_REVISION,
    longDocumentEngine: "LONG_DOCUMENT_FULL_INGESTION_ENGINE-v6_3_3_CHUNK_DB_SCOPE_DEDUP",
    documentRegistry: "DOCUMENT_PROFILES",
    documentTextChunks: "document_text_chunks",
    cyberneticMethod: "FILE_UPLOAD_TO_FULL_TEXT_CHUNKS_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
    b2gTechnicalMemoryCollapse: "B2G_TECHNICAL_PROFILE_MEMORY_READY",
    b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
    legalCertification: false,
    opc: "technical proof receipt only"
  };
}


export async function POST(req: NextRequest) {
  let body: FilesBody;


  try {
    body = (await req.json()) as FilesBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_JSON_BODY",
        legalCertification: false,
        opc: "technical proof receipt only"
      },
      { status: 400 }
    );
  }


  const store = getFileStore();
  const sessionId = normalizeSessionId(body.sessionId);


  if (body.clear) {
    store.delete(sessionId);


    return NextResponse.json({
      ok: true,
      endpoint: "HBCE_FILES_INGESTION",
      routeVersion: FILE_ROUTE_REVISION,
      sessionId,
      cleared: true,
      documentRegistryPreserved: true,
      reason:
        "Session file cache cleared. Persisted document profiles are preserved as audit-ready cybernetic registry entries.",
      summary: buildSessionSummary(sessionId, []),
      legalCertification: false,
      opc: "technical proof receipt only"
    });
  }


  const incomingFiles = normalizeFiles(body.files);
  const existingFiles = body.replace ? [] : store.get(sessionId) || [];
  const mergedFiles = mergeFiles(existingFiles, incomingFiles);
  const context = buildDocumentProfileContext(body, sessionId);
  const documentProfiles = await persistDocumentProfilesForSession(mergedFiles, context);
  const nextFiles = attachDocumentProfileResults(mergedFiles, documentProfiles);


  store.set(sessionId, nextFiles);


  const selfDiagnostic = await buildFilesRouteSelfDiagnostic({
    sessionId,
    files: nextFiles,
    humanIpr: context.humanIpr,
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    publicDocumentProfiles: documentProfiles
      .map((profile) => profile.profile)
      .filter((profile): profile is Record<string, unknown> => Boolean(profile))
  });


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    replaced: Boolean(body.replace),
    cyberneticMethod: "FILE_UPLOAD_TO_FULL_TEXT_CHUNKS_TO_DOCUMENT_PROFILE_TO_DYNAMIC_RECALL",
    documentRegistry: {
      table: "document_profiles",
      attempted: documentProfiles.length > 0,
      persistedCount: documentProfiles.filter((profile) => profile.ok).length,
      failedCount: documentProfiles.filter((profile) => !profile.ok).length,
      profileStatuses: documentProfiles.map((profile) => ({
        fileId: profile.fileId,
        filename: profile.filename,
        ok: profile.ok,
        status: profile.status,
        profileId:
          typeof profile.profile?.profileId === "string" ? profile.profile.profileId : null,
        docFamily: profile.input.docFamily,
        volume: profile.input.volume,
        title: profile.input.title,
        canonicalAxis: profile.input.canonicalAxis,
        reusableInPrompt: profile.input.reusableInPrompt,
        textCoverageStatus: profile.input.textCoverageStatus,
        fullDocumentCoverage: profile.input.fullDocumentCoverage,
        chunkCount: profile.input.chunkCount,
        outlineStatus: profile.input.outlineStatus,
        partsDetected: profile.input.partsDetected,
        chaptersDetected: profile.input.chaptersDetected,
        appendicesDetected: profile.input.appendicesDetected,
        chunksPersisted: profile.chunks?.ok ?? false,
        chunksPersistedCount: profile.chunks?.persistedCount ?? 0,
        chunkPersistenceStatus: profile.chunks?.status ?? null,
        chunkPersistenceReason: describeDocumentChunkPersistenceReason(profile.chunks),
        chunkPersistenceError: profile.chunks?.error ?? null,
        chunkPersistenceRevision: profile.chunks?.persistenceRevision ?? null,
        chunkDatabaseVerified: profile.chunks?.databaseVerified ?? null,
        chunkVerificationCount: profile.chunks?.verificationCount ?? null,
        derivedFromHumanIpr: profile.chunks?.derivedFromHumanIpr ?? null,
        b2gTechnicalMemoryReady: profile.technicalMemory?.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY,
        b2gTechnicalMemoryStatus:
          typeof profile.technicalMemory?.status === "string" ? profile.technicalMemory.status : null,
        b2gTechnicalMemoryFailReason:
          typeof profile.technicalMemory?.failReason === "string" ? profile.technicalMemory.failReason : null,
        b2gTechnicalMemoryReadyForIprSave: profile.technicalMemory?.readyForIprSave === true,
        b2gTechnicalMemoryCollapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
        alienCodeV4ProfileDetected:
          profile.input.docFamily === "CORPUS_ESOTEROLOGIA_ERMETICA" &&
          profile.input.volume === "V4" &&
          typeof profile.input.title === "string" &&
          normalizeSearchText(profile.input.title).includes("alien code"),
        error: profile.error
      }))
    },
    documentTextChunks: {
      table: "document_text_chunks",
      attempted: documentProfiles.some((profile) => profile.chunks?.attempted),
      persistedCount: documentProfiles.reduce((sum, profile) => sum + (profile.chunks?.persistedCount ?? 0), 0),
      expectedCount: documentProfiles.reduce((sum, profile) => sum + (profile.chunks?.chunkCount ?? 0), 0),
      failedCount: documentProfiles.filter((profile) => profile.chunks && !profile.chunks.ok).length,
      runtimeChunkStoreCount: Array.from(getDocumentChunkStore().values()).reduce((sum, chunks) => sum + chunks.length, 0),
      statuses: documentProfiles.map((profile) => profile.chunks).filter(Boolean)
    },
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false, false),
    documentProfiles,
    b2gTechnicalMemories: documentProfiles
      .map((profile) => profile.technicalMemory)
      .filter((technicalMemory): technicalMemory is Record<string, unknown> => Boolean(technicalMemory)),
    b2gTechnicalMemorySummary: {
      attemptedCount: documentProfiles.filter((profile) => Boolean(profile.technicalMemory)).length,
      readyCount: documentProfiles.filter(
        (profile) => profile.technicalMemory?.status === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
      ).length,
      failCount: documentProfiles.filter(
        (profile) =>
          Boolean(profile.technicalMemory) &&
          profile.technicalMemory?.status !== HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
      ).length,
      runtimeFileBridgeCount: nextFiles.filter((file) => Boolean(file.b2gTechnicalMemory)).length,
      runtimeFileBridgeReadyCount: nextFiles.filter(
        (file) => file.b2gTechnicalMemoryStatus === HBCE_B2G_TECHNICAL_MEMORY_STATUS_READY
      ).length,
      collapseRevision: HBCE_B2G_TECHNICAL_MEMORY_COLLAPSE_REVISION,
      payloadExposureRevision: "B2G_TECHNICAL_MEMORY_PAYLOAD_EXPOSURE-v6_7",
      noQuantumStates: true,
      noCorpusCollapse: true,
      legalCertification: false,
      opc: "technical proof receipt only"
    },
    b2gTechnicalMemoryPromptBridge: nextFiles
      .map((file) => buildB2gTechnicalMemoryPromptBridge(file.b2gTechnicalMemory))
      .filter((bridge): bridge is string => Boolean(bridge)),
    selfDiagnostic,
    diagnostic: selfDiagnostic,
    filesRouteDiagnostic: selfDiagnostic,
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}


export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const store = getFileStore();


  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
  const includeText = url.searchParams.get("includeText") !== "false";
  const includeProfiles = url.searchParams.get("includeProfiles") !== "false";
  const includeChunks = url.searchParams.get("includeChunks") === "true";
  const includeDiagnostics =
    isAffirmativeSearchParam(url.searchParams.get("diagnostic")) ||
    isAffirmativeSearchParam(url.searchParams.get("includeDiagnostics")) ||
    isAffirmativeSearchParam(url.searchParams.get("selfDiagnostic"));
  const humanIpr = url.searchParams.get("humanIpr") || HBCE_SELF_PILOT_HUMAN_IPR;
  const tenantId = url.searchParams.get("tenantId") || HBCE_SELF_PILOT_TENANT_ID;
  const workspaceId = url.searchParams.get("workspaceId") || HBCE_SELF_PILOT_WORKSPACE_ID;


  const files = store.get(sessionId) || [];
  const documentProfiles = includeProfiles
    ? await listDocumentProfilesFromDatabase({
        humanIpr,
        tenantId,
        workspaceId,
        includeSoftDeleted: false,
        limit: 50
      }).then((result) => ({
        ok: result.ok,
        status: result.status,
        rowCount: result.rowCount,
        error: result.error,
        sqlHash: result.sqlHash,
        durationMs: result.durationMs,
        profiles: result.rows
          .map((row) => toPublicDocumentProfile(row) as Record<string, unknown>)
          .map(canonicalizePublicDocumentProfileForRead)
      })).catch((error) => ({
        ok: false,
        status: "QUERY_FAILED",
        rowCount: 0,
        error: error instanceof Error ? error.message : "DOCUMENT_PROFILE_QUERY_FAILED",
        sqlHash: null,
        durationMs: 0,
        profiles: []
      }))
    : null;
  const selfDiagnostic = includeDiagnostics
    ? await buildFilesRouteSelfDiagnostic({
        sessionId,
        files,
        humanIpr,
        tenantId,
        workspaceId,
        publicDocumentProfiles:
          documentProfiles && Array.isArray(documentProfiles.profiles)
            ? documentProfiles.profiles
            : []
      })
    : null;


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    summary: buildSessionSummary(sessionId, files),
    files: summarizeFiles(files, includeText, includeChunks),
    documentProfiles,
    b2gTechnicalMemories:
      documentProfiles && Array.isArray(documentProfiles.profiles)
        ? documentProfiles.profiles
            .map((profile) => {
              const metadata =
                profile.documentMetadata && typeof profile.documentMetadata === "object"
                  ? profile.documentMetadata as Record<string, unknown>
                  : {};
              return metadata.b2gTechnicalMemory && typeof metadata.b2gTechnicalMemory === "object"
                ? metadata.b2gTechnicalMemory as Record<string, unknown>
                : null;
            })
            .filter((technicalMemory): technicalMemory is Record<string, unknown> => Boolean(technicalMemory))
        : [],
    runtimeFileB2gTechnicalMemories: files
      .map((file) => file.b2gTechnicalMemory)
      .filter((technicalMemory): technicalMemory is Record<string, unknown> => Boolean(technicalMemory)),
    b2gTechnicalMemoryPromptBridge: files
      .map((file) => buildB2gTechnicalMemoryPromptBridge(file.b2gTechnicalMemory))
      .filter((bridge): bridge is string => Boolean(bridge)),
    selfDiagnostic,
    diagnostic: selfDiagnostic,
    filesRouteDiagnostic: selfDiagnostic,
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}


export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const store = getFileStore();


  const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
  const fileId = url.searchParams.get("fileId");


  if (!fileId) {
    store.delete(sessionId);


    return NextResponse.json({
      ok: true,
      endpoint: "HBCE_FILES_INGESTION",
      routeVersion: FILE_ROUTE_REVISION,
      sessionId,
      deleted: "SESSION_FILES",
      documentRegistryPreserved: true,
      reason:
        "Session file cache deleted. Persisted document profiles are preserved for IPR/EVT/OPC continuity.",
      summary: buildSessionSummary(sessionId, []),
      legalCertification: false,
      opc: "technical proof receipt only"
    });
  }


  const files = store.get(sessionId) || [];
  const nextFiles = files.filter((file) => file.id !== fileId);


  store.set(sessionId, nextFiles);


  return NextResponse.json({
    ok: true,
    endpoint: "HBCE_FILES_INGESTION",
    routeVersion: FILE_ROUTE_REVISION,
    sessionId,
    deleted: fileId,
    documentRegistryPreserved: true,
    reason:
      "Runtime file removed from the active session cache. Persisted document profile remains available for dynamic recall and audit continuity.",
    summary: buildSessionSummary(sessionId, nextFiles),
    files: summarizeFiles(nextFiles, false),
    legalCertification: false,
    opc: "technical proof receipt only"
  });
}
