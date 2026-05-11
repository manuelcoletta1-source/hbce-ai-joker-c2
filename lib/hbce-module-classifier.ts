/**
 * AI JOKER-C2 HBCE Module Classifier
 *
 * Deterministic HBCE module classifier for the HERMETICUM B.C.E. runtime.
 *
 * This module classifies requests into HBCE technical-operational modules.
 *
 * Important boundary:
 * HBCE modules are not project domains.
 * HBCE modules are not book collections.
 * HBCE modules are technical-operational functions of the HBCE stack.
 *
 * Project domains are handled by:
 * - lib/project-domain-classifier.ts
 *
 * HBCE modules are handled here:
 * - UNEBDO
 * - OPC
 * - MetaExchange
 * - IOspace
 * - CyberGlobal
 * - NeuroLoop
 *
 * Canonical relation:
 * IPR identifies.
 * UNEBDO anchors.
 * EVT traces.
 * Memory continues.
 * OPC proves.
 * MetaExchange exchanges.
 * IOspace exposes.
 * CyberGlobal protects.
 * NeuroLoop validates.
 * AI JOKER-C2 executes.
 * MATRIX organizes.
 */

import {
  createHbceModuleBinding,
  getHbceModuleMetadata,
  type HbceModule,
  type HbceModuleBinding,
  type HbceModuleClassification,
  type HbceModuleMetadata,
  type PrimaryHbceModule
} from "./runtime-types";

export type {
  HbceModule,
  HbceModuleBinding,
  HbceModuleClassification,
  HbceModuleMetadata,
  HbceModuleType,
  PrimaryHbceModule
} from "./runtime-types";

export type HbceModuleClassifierInput = {
  message?: string;
  route?: string;
  fileName?: string;
  fileNames?: string[];
  filePath?: string;
  filePaths?: string[];
  documentTitle?: string;
  activeDocument?: string;
  activeSection?: string;
  hasFiles?: boolean;
};

export type HbceModuleScore = {
  module: PrimaryHbceModule;
  score: number;
  matches: string[];
  reasons: string[];
};

const PRIMARY_MODULES: PrimaryHbceModule[] = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop"
];

const HBCE_MODULES: HbceModule[] = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "NONE"
];

const MODULE_KEYWORDS: Record<PrimaryHbceModule, string[]> = {
  UNEBDO: [
    "unebdo",
    "anchoring",
    "anchor",
    "external anchor",
    "timestamp",
    "timestamping",
    "long term archive",
    "long-term archive",
    "long term continuity",
    "evidentiary continuity",
    "evidence continuity",
    "validation continuity",
    "proof anchoring",
    "chain anchoring",
    "bitcoin anchor",
    "ethereum anchor",
    "ipfs anchor",
    "ipfs cid",
    "filecoin",
    "hash anchor",
    "temporal anchor",
    "ancoraggio",
    "ancoraggio temporale",
    "validazione",
    "continuita probatoria",
    "continuità probatoria",
    "continuita evidenziale",
    "continuità evidenziale",
    "prova nel tempo",
    "traccia nel tempo",
    "conservazione della prova",
    "validazione della prova",
    "ancoraggio esterno"
  ],

  OPC: [
    "opc",
    "operational proof",
    "operational proof and compliance",
    "operational proof compliance",
    "operational proof of continuity",
    "proof receipt",
    "proof record",
    "opc proof",
    "opc proof receipt",
    "opc proof record",
    "audit receipt",
    "chain hash",
    "previous proof hash",
    "decision hash",
    "event hash",
    "memory hash",
    "input hash",
    "output hash",
    "proof chain",
    "receipt",
    "compliance layer",
    "audit-ready proof",
    "technical proof receipt",
    "ricevuta di prova",
    "record di prova",
    "prova operativa",
    "prova di continuita",
    "prova di continuità",
    "catena di prova",
    "hash catena",
    "hash decisione",
    "hash evento",
    "hash memoria",
    "audit tecnico",
    "ricevuta tecnica",
    "proof receipt layer"
  ],

  MetaExchange: [
    "metaexchange",
    "meta exchange",
    "structured exchange",
    "exchange layer",
    "proof exchange",
    "identity exchange",
    "event exchange",
    "document exchange",
    "audit exchange",
    "context exchange",
    "node exchange",
    "exchange between identities",
    "exchange between proofs",
    "exchange between events",
    "exchange between documents",
    "interoperable exchange",
    "controlled exchange",
    "governed exchange",
    "scambio strutturato",
    "livello di scambio",
    "scambio prove",
    "scambio eventi",
    "scambio identita",
    "scambio identità",
    "scambio documenti",
    "scambio audit",
    "scambio controllato",
    "scambio governato",
    "interoperabilita",
    "interoperabilità"
  ],

  IOspace: [
    "iospace",
    "io space",
    "iospace dashboard",
    "io space dashboard",
    "dashboard",
    "runtime dashboard",
    "runtime visibility",
    "visibility layer",
    "operational visibility",
    "operational interface",
    "interaction space",
    "runtime view",
    "event viewer",
    "proof viewer",
    "memory viewer",
    "audit dashboard",
    "proof receipt card",
    "event chain viewer",
    "runtime status panel",
    "ipr status panel",
    "project domain panel",
    "spazio operativo",
    "spazio di interazione",
    "visibilita runtime",
    "visibilità runtime",
    "interfaccia operativa",
    "dashboard runtime",
    "pannello runtime",
    "pannello ipr",
    "pannello audit",
    "vista eventi",
    "vista prove",
    "visualizzazione runtime"
  ],

  CyberGlobal: [
    "cyberglobal",
    "cyber global",
    "cybersecurity",
    "cyber security",
    "defensive cybersecurity",
    "defensive cyber",
    "cyber resilience",
    "resilience",
    "resilienza",
    "security posture",
    "risk mapping",
    "incident report",
    "incident response",
    "security governance",
    "critical infrastructure resilience",
    "threat mapping",
    "risk register",
    "hardening",
    "remediation",
    "defensive audit",
    "security audit",
    "infrastructure protection",
    "protezione sistemica",
    "cybersicurezza",
    "cibersicurezza",
    "sicurezza informatica",
    "cyber difensiva",
    "cybersecurity difensiva",
    "resilienza digitale",
    "resilienza infrastrutturale",
    "mappatura rischio",
    "mappatura rischi",
    "rapporto incidente",
    "gestione incidente",
    "governance sicurezza",
    "infrastrutture critiche",
    "protezione infrastrutture",
    "difensivo",
    "non offensivo"
  ],

  NeuroLoop: [
    "neuroloop",
    "neuro loop",
    "validation loop",
    "feedback loop",
    "review loop",
    "human review loop",
    "decision loop",
    "cognitive loop",
    "reasoning checkpoint",
    "validation checkpoint",
    "review checkpoint",
    "decision pattern",
    "repeated decision pattern",
    "reviewable uncertainty",
    "escalation history",
    "human oversight feedback",
    "controlled feedback",
    "controlled learning",
    "validation trail",
    "ciclo di validazione",
    "ciclo feedback",
    "ciclo di feedback",
    "ciclo decisionale",
    "ciclo cognitivo",
    "validazione cognitiva",
    "checkpoint ragionamento",
    "checkpoint validazione",
    "incertezza revisionabile",
    "storico escalation",
    "revisione umana",
    "feedback controllato",
    "apprendimento controllato"
  ]
};

const MODULE_FILE_HINTS: Record<PrimaryHbceModule, string[]> = {
  UNEBDO: [
    "unebdo.md",
    "unebdo_overview.md",
    "unebdo_anchor_model.md",
    "unebdo_validation_model.md",
    "anchoring_model.md",
    "evidentiary_continuity.md"
  ],

  OPC: [
    "opc_proof_layer.md",
    "opc_proof_receipt_model.md",
    "opc-proof.ts",
    "opc-ledger.ts",
    "opc_types.ts",
    "opc-proof-record.schema.json",
    "proofreceiptcard.tsx",
    "proof_receipt.md"
  ],

  MetaExchange: [
    "metaexchange.md",
    "metaexchange_overview.md",
    "metaexchange_model.md",
    "exchange_layer.md",
    "structured_exchange.md"
  ],

  IOspace: [
    "iospace.md",
    "iospace_dashboard.md",
    "iospacedashboard.tsx",
    "runtime_dashboard.md",
    "eventchainviewer.tsx",
    "runtimestatuspanel.tsx",
    "iprstatuspanel.tsx"
  ],

  CyberGlobal: [
    "cyberglobal.md",
    "cyberglobal_overview.md",
    "cybersecurity_governance_mapping.md",
    "defensive_security_use_cases.md",
    "critical_infrastructure_use_cases.md",
    "incident_report_template.md"
  ],

  NeuroLoop: [
    "neuroloop.md",
    "neuroloop_overview.md",
    "validation_loop.md",
    "feedback_loop.md",
    "human_oversight_model.md",
    "decision_validation.md"
  ]
};

const STACK_LEVEL_TERMS = [
  "hbce modules",
  "moduli hbce",
  "moduli dell hbce",
  "moduli dell'hbce",
  "sei moduli",
  "6 moduli",
  "six modules",
  "hbce operational modules",
  "hbce technical modules",
  "hbce technical-operational modules",
  "stack hbce",
  "hbce stack",
  "operational stack",
  "moduli dello stack",
  "stack tecnico-operativo",
  "technical-operational stack",
  "unebdo opc metaexchange iospace cyberglobal neuroloop",
  "unebdo metaexchange opc iospace cyberglobal neuroloop"
];

export function classifyHbceModule(
  input: HbceModuleClassifierInput | string
): HbceModuleClassification {
  const normalizedInput = normalizeInput(input);

  if (!normalizedInput.trim()) {
    return createClassification(
      "NONE",
      ["NONE"],
      0.2,
      ["No meaningful input was provided."],
      createEmptyScores()
    );
  }

  const fileBasedClassification = classifyByFilePath(normalizedInput);

  if (fileBasedClassification) {
    return fileBasedClassification;
  }

  const stackLevelMatches = findMatches(normalizedInput, STACK_LEVEL_TERMS);
  const moduleScores = PRIMARY_MODULES.map((module) =>
    scoreModule(normalizedInput, module, MODULE_KEYWORDS[module])
  );

  const matchedModules = moduleScores
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoreMap = toScoreMap(moduleScores);

  if (stackLevelMatches.length > 0) {
    return createClassification(
      "NONE",
      getDefaultActiveModules(),
      0.94,
      [
        "Input matched HBCE stack-level or six-module language.",
        "The request concerns the HBCE module map rather than a single module.",
        ...stackLevelMatches.map((term) => `Matched stack-level term: ${term}`),
        ...collectReasons(matchedModules)
      ],
      scoreMap
    );
  }

  if (matchedModules.length >= 2) {
    const top = matchedModules[0];
    const second = matchedModules[1];

    if (shouldClassifyAsMultiModule(top.score, second.score)) {
      return createClassification(
        "NONE",
        matchedModules.map((result) => result.module),
        calculateMultiModuleConfidence(matchedModules),
        [
          "More than one HBCE module matched with sufficient strength.",
          "The request concerns multiple HBCE technical-operational modules.",
          ...collectReasons(matchedModules)
        ],
        scoreMap
      );
    }
  }

  if (matchedModules.length === 0) {
    return createClassification(
      "NONE",
      ["NONE"],
      0.45,
      ["No HBCE module keyword matched; defaulted to NONE."],
      scoreMap
    );
  }

  const best = matchedModules[0];

  return createClassification(
    best.module,
    [best.module],
    calculateConfidence(best.score, normalizedInput),
    best.reasons.length > 0
      ? best.reasons
      : [`Classified as ${best.module} by highest HBCE module score.`],
    scoreMap
  );
}

export function classifyHbceModuleFromMessage(
  message: string
): HbceModuleClassification {
  return classifyHbceModule({ message });
}

export function getCanonicalHbceModules(): HbceModule[] {
  return [
    "UNEBDO",
    "OPC",
    "MetaExchange",
    "IOspace",
    "CyberGlobal",
    "NeuroLoop",
    "NONE"
  ];
}

export function getPrimaryHbceModules(): PrimaryHbceModule[] {
  return [...PRIMARY_MODULES];
}

export function getHbceModuleBinding(
  module: HbceModule,
  activeModules?: HbceModule[]
): HbceModuleBinding {
  return createHbceModuleBinding(module, activeModules);
}

export function getHbceModuleClassificationMetadata(
  module: HbceModule
): HbceModuleMetadata {
  return getHbceModuleMetadata(module);
}

function classifyByFilePath(
  normalizedInput: string
): HbceModuleClassification | null {
  const scoreMap = createEmptyScores();

  for (const module of PRIMARY_MODULES) {
    const matchedFile = MODULE_FILE_HINTS[module].find((file) =>
      normalizedInput.includes(normalizeText(file))
    );

    if (!matchedFile) {
      continue;
    }

    scoreMap[module] = 10;

    return createClassification(
      module,
      [module],
      0.94,
      [
        `HBCE module file detected: ${matchedFile}`,
        `File path maps to the ${module} technical-operational module.`
      ],
      scoreMap
    );
  }

  return null;
}

function scoreModule(
  text: string,
  module: PrimaryHbceModule,
  keywords: string[]
): HbceModuleScore {
  const matches = findMatches(text, keywords);

  const score = matches.reduce((total, keyword) => {
    const wordCount = keyword.split(" ").filter(Boolean).length;
    const baseWeight = wordCount >= 3 ? 4 : wordCount === 2 ? 3 : 1;
    const explicitModuleWeight = isExplicitModuleName(module, keyword) ? 6 : 0;

    return total + baseWeight + explicitModuleWeight;
  }, 0);

  return {
    module,
    score,
    matches,
    reasons:
      score > 0
        ? [`${module} matched: ${matches.join(", ")}`]
        : []
  };
}

function isExplicitModuleName(
  module: PrimaryHbceModule,
  keyword: string
): boolean {
  switch (module) {
    case "UNEBDO":
      return keyword === "unebdo";

    case "OPC":
      return keyword === "opc" || keyword.startsWith("opc ");

    case "MetaExchange":
      return keyword === "metaexchange" || keyword === "meta exchange";

    case "IOspace":
      return keyword === "iospace" || keyword === "io space";

    case "CyberGlobal":
      return keyword === "cyberglobal" || keyword === "cyber global";

    case "NeuroLoop":
      return keyword === "neuroloop" || keyword === "neuro loop";

    default:
      return false;
  }
}

function shouldClassifyAsMultiModule(
  topScore: number,
  secondScore: number
): boolean {
  if (topScore <= 0 || secondScore <= 0) {
    return false;
  }

  if (secondScore >= 5) {
    return true;
  }

  return secondScore / topScore >= 0.5;
}

function normalizeInput(input: HbceModuleClassifierInput | string): string {
  if (typeof input === "string") {
    return normalizeText(input);
  }

  const parts = [
    input.message,
    input.route,
    input.fileName,
    ...(input.fileNames ?? []),
    input.filePath,
    ...(input.filePaths ?? []),
    input.documentTitle,
    input.activeDocument,
    input.activeSection,
    input.hasFiles ? "has files document file upload" : ""
  ];

  return normalizeText(parts.filter(Boolean).join(" "));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatches(text: string, keywords: string[]): string[] {
  return keywords
    .map((keyword) => normalizeText(keyword))
    .filter((keyword) => keyword.length > 0 && text.includes(keyword));
}

function createClassification(
  module: HbceModule,
  activeModules: HbceModule[],
  confidence: number,
  reasons: string[],
  scores: Partial<Record<PrimaryHbceModule, number>>
): HbceModuleClassification {
  const metadata = getHbceModuleMetadata(module);

  return {
    module,
    activeModules: normalizeActiveModules(module, activeModules),
    primaryModule: module,
    moduleType: metadata.moduleType,
    confidence: clampConfidence(confidence),
    reasons: uniqueReasons(reasons),
    scores
  };
}

function normalizeActiveModules(
  module: HbceModule,
  activeModules: HbceModule[]
): HbceModule[] {
  if (activeModules.length === 0) {
    return module === "NONE" ? ["NONE"] : [module];
  }

  const primaryActiveModules = activeModules.filter(isPrimaryHbceModuleLocal);

  if (primaryActiveModules.length === 0) {
    return module === "NONE" ? ["NONE"] : [module];
  }

  return uniqueModules(primaryActiveModules);
}

function isPrimaryHbceModuleLocal(value: HbceModule): value is PrimaryHbceModule {
  return PRIMARY_MODULES.includes(value as PrimaryHbceModule);
}

function getDefaultActiveModules(): HbceModule[] {
  return [
    "UNEBDO",
    "OPC",
    "MetaExchange",
    "IOspace",
    "CyberGlobal",
    "NeuroLoop"
  ];
}

function calculateConfidence(score: number, text: string): number {
  const scoreFactor = Math.min(score / 18, 1);
  const lengthFactor = Math.min(text.length / 900, 1);
  const confidence = 0.42 + scoreFactor * 0.45 + lengthFactor * 0.13;

  return clampConfidence(confidence);
}

function calculateMultiModuleConfidence(matchedModules: HbceModuleScore[]): number {
  const matchedModuleFactor = Math.min(matchedModules.length / 6, 1);
  const topScoreFactor = Math.min((matchedModules[0]?.score || 0) / 18, 1);
  const confidence = 0.68 + matchedModuleFactor * 0.18 + topScoreFactor * 0.1;

  return clampConfidence(confidence);
}

function clampConfidence(value: number): number {
  return Number(Math.max(0.2, Math.min(value, 0.98)).toFixed(2));
}

function collectReasons(results: HbceModuleScore[]): string[] {
  return results.flatMap((result) => result.reasons);
}

function createEmptyScores(): Partial<Record<PrimaryHbceModule, number>> {
  return {
    UNEBDO: 0,
    OPC: 0,
    MetaExchange: 0,
    IOspace: 0,
    CyberGlobal: 0,
    NeuroLoop: 0
  };
}

function toScoreMap(
  scores: HbceModuleScore[]
): Partial<Record<PrimaryHbceModule, number>> {
  return scores.reduce<Partial<Record<PrimaryHbceModule, number>>>(
    (accumulator, score) => {
      accumulator[score.module] = score.score;
      return accumulator;
    },
    createEmptyScores()
  );
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}

function uniqueModules<T extends HbceModule>(modules: T[]): T[] {
  return Array.from(new Set(modules));
}
