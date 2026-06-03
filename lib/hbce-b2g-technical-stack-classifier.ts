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

export const HBCE_B2G_TECHNICAL_STACK_CLASSIFIER_REVISION =
  "HBCE-B2G-TECHNICAL-STACK-CLASSIFIER-v1_0_0";

export const HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY =
  "HBCE_JOKER_C2_B2G_TECHNICAL_STACK" as const;

export const HBCE_TECHNICAL_GOVERNANCE_MODULE =
  "TECHNICAL_GOVERNANCE_MODULE" as const;

export const HBCE_TECHNICAL_GOVERNANCE_MODULE_SET =
  "TECHNICAL_GOVERNANCE_MODULE_SET" as const;

export const HBCE_RND_THEORETICAL_FOUNDATION =
  "RND_THEORETICAL_FOUNDATION" as const;

export const HBCE_B2G_LEGAL_CERTIFICATION = false as const;

export const HBCE_B2G_OPC_BOUNDARY = "technical proof receipt only" as const;

export type HbceB2gTechnicalStackDocFamily =
  typeof HBCE_B2G_TECHNICAL_STACK_DOC_FAMILY;

export type HbceB2gTechnicalStackDocumentKind =
  | typeof HBCE_TECHNICAL_GOVERNANCE_MODULE
  | typeof HBCE_TECHNICAL_GOVERNANCE_MODULE_SET
  | typeof HBCE_RND_THEORETICAL_FOUNDATION;

export type HbceB2gTechnicalStackModule =
  | "QPCCF_PREDICTIVE_STABILITY_ENGINE"
  | "CQD_EVIDENCE_RECORD_ENGINE"
  | "AIQ_JOKER_POLICY_TRUTH_BUS"
  | "UFO_INTERCEPT_COLLISION_COLLIMATION_RUNTIME"
  | "UFO_OPERATIONAL_MODULE_REGISTRY"
  | "CQO_RND_THEORETICAL_FOUNDATION";

export type HbceB2gTechnicalStackConfidence =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CANONICAL";

export interface HbceB2gTechnicalStackClassifierInput {
  filename?: string | null;
  sourceFilename?: string | null;
  title?: string | null;
  header?: string | null;
  text?: string | null;
  mimeType?: string | null;
}

export interface HbceB2gTechnicalStackClassification {
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
export const HBCE_B2G_TECHNICAL_STACK_DEFINITIONS: readonly ModuleDefinition[] = [
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

export function normalizeHbceClassifierText(value: unknown): string {
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

export function buildHbceClassifierHaystack(
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

export function classifyHbceB2gTechnicalStackDocument(
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

export function isHbceB2gTechnicalStackDocument(
  input: HbceB2gTechnicalStackClassifierInput
): boolean {
  return classifyHbceB2gTechnicalStackDocument(input).matched;
}

export function isQpccfPredictiveStabilityDocument(
  input: HbceB2gTechnicalStackClassifierInput
): boolean {
  const classification = classifyHbceB2gTechnicalStackDocument(input);
  return classification.module === "QPCCF_PREDICTIVE_STABILITY_ENGINE";
}

export function buildHbceB2gTechnicalStackProfileMetadata(
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
export function maybeApplyHbceB2gTechnicalStackMetadata<T extends Record<string, unknown>>(
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
export function assertQpccfMetadataIsNotContaminated(
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
