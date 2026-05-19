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
 * - MATRIX
 *
 * MATRIX boundary:
 * MATRIX has a dual function.
 * As a project domain, MATRIX is the operational infrastructure architecture.
 * As an HBCE module, MATRIX is the system coordination and organization layer.
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
 * MATRIX organizes.
 * AI JOKER-C2 executes.
 *
 * Classifier invariant:
 * - NONE can appear only when no real HBCE module is active.
 * - If at least one real HBCE module is active, NONE is removed.
 * - If module is not NONE, moduleType must not remain the metadata of NONE.
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
  "NeuroLoop",
  "MATRIX"
];

const HBCE_MODULES: HbceModule[] = [
  "UNEBDO",
  "OPC",
  "MetaExchange",
  "IOspace",
  "CyberGlobal",
  "NeuroLoop",
  "MATRIX",
  "NONE"
];

const MODULE_KEYWORDS: Record<PrimaryHbceModule, string[]> = {
  UNEBDO: [
    "unebdo",
    "ipr",
    "identity primary record",
    "primary identity record",
    "operational identity",
    "identity record",
    "identity binding",
    "identity root",
    "ipr root",
    "ipr binding",
    "ipr registry",
    "origin identity",
    "runtime identity",
    "agent identity",
    "ai agent identity",
    "identita operativa",
    "identita primaria operativa",
    "registro identita",
    "registro primario",
    "registro primario di identita",
    "radice identitaria",
    "identita runtime",
    "identita agente",
    "origine identitaria",
    "vincolo identitario",
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
    "continuita evidenziale",
    "prova nel tempo",
    "traccia nel tempo",
    "conservazione della prova",
    "validazione della prova",
    "ancoraggio esterno"
  ],

  OPC: [
    "opc",
    "evt",
    "event trace",
    "event record",
    "verifiable event",
    "verifiable event trace",
    "runtime event",
    "governed event",
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
    "continuity proof",
    "continuity receipt",
    "compliance layer",
    "audit-ready proof",
    "technical proof receipt",
    "traccia evt",
    "evento verificabile",
    "traccia evento",
    "traccia verificabile",
    "ricevuta di prova",
    "record di prova",
    "prova operativa",
    "prova di continuita",
    "prova di continuita operativa",
    "catena di prova",
    "hash catena",
    "hash decisione",
    "hash evento",
    "hash memoria",
    "audit tecnico",
    "ricevuta tecnica",
    "proof receipt layer",
    "audit",
    "audit trail",
    "compliance",
    "conformita",
    "conformità",
    "due diligence",
    "contenzioso",
    "prova tecnica",
    "verifica documentale",
    "responsabilita",
    "responsabilità"
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
    "route exchange",
    "navigation exchange",
    "operational routing",
    "route between systems",
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
    "scambio documenti",
    "scambio audit",
    "scambio controllato",
    "scambio governato",
    "scambio tra sistemi",
    "scambio tra identita",
    "instradamento operativo",
    "routing operativo",
    "interoperabilita",
    "banche",
    "studi legali",
    "studio legale",
    "law firm",
    "law firms",
    "documenti",
    "pratiche",
    "contratti",
    "due diligence",
    "scambio documentale",
    "scambio informativo",
    "information governance"
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
    "navigation layer",
    "operational navigation",
    "navigation system",
    "navigation map",
    "workflow navigation",
    "process navigation",
    "document navigation",
    "interface navigation",
    "navigazione",
    "sistema di navigazione",
    "navigazione operativa",
    "navigazione documentale",
    "navigazione processi",
    "navigazione dei processi",
    "navigazione workflow",
    "mappa di navigazione",
    "mappa operativa",
    "spazio operativo",
    "spazio di interazione",
    "visibilita runtime",
    "interfaccia operativa",
    "dashboard runtime",
    "pannello runtime",
    "pannello ipr",
    "pannello audit",
    "vista eventi",
    "vista prove",
    "visualizzazione runtime",
    "portale",
    "sportello",
    "interfaccia banca",
    "interfaccia legale",
    "consultazione documentale",
    "audit view",
    "public safe metadata"
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
    "non offensivo",
    "banche",
    "banca",
    "banking",
    "settore bancario",
    "frodi",
    "frode",
    "rischio frodi",
    "continuita infrastrutturale",
    "incidenti cyber",
    "cyber risk"
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
    "apprendimento controllato",
    "human oversight",
    "supervisione umana",
    "review",
    "revisione",
    "validazione",
    "legal review",
    "technical review"
  ],

  MATRIX: [
    "matrix",
    "matrix module",
    "modulo matrix",
    "matrix hbce",
    "matrix organizes",
    "matrix organizza",
    "system coordination",
    "coordination layer",
    "organization layer",
    "system organization",
    "operational coordination",
    "operational organization",
    "system architecture layer",
    "architecture coordination",
    "runtime coordination",
    "ecosystem coordination",
    "hbce coordination",
    "hbce organization",
    "matrix coordination",
    "matrix organization",
    "module coordination",
    "modules coordination",
    "stack coordination",
    "stack organization",
    "coordination module",
    "organization module",
    "coordinamento sistema",
    "coordinamento operativo",
    "coordinamento moduli",
    "coordinamento dei moduli",
    "coordinamento stack",
    "coordinamento hbce",
    "organizzazione sistema",
    "organizzazione operativa",
    "organizzazione stack",
    "organizzazione hbce",
    "organizzazione ecosistema",
    "modulo di coordinamento",
    "modulo organizzativo",
    "livello organizzativo",
    "livello di coordinamento",
    "architettura sistema",
    "architettura operativa",
    "architettura hbce",
    "architettura runtime",
    "mappa sistema",
    "mappa operativa",
    "mappa moduli",
    "mappa dello stack",
    "mappa hbce",
    "runtime map",
    "module map",
    "stack map",
    "hbce map",
    "operational map",
    "seven modules",
    "sette moduli",
    "7 moduli",
    "seven hbce modules",
    "sette moduli hbce",
    "five collections seven modules",
    "cinque collane sette moduli",
    "five collections and seven modules",
    "cinque collane e sette moduli",
    "banche",
    "banca",
    "bank",
    "banks",
    "banking",
    "settore bancario",
    "studi legali",
    "studio legale",
    "law firm",
    "law firms",
    "governance",
    "compliance",
    "audit",
    "valore pragmatico",
    "valore operativo",
    "a cosa serve",
    "pragmatico",
    "governace",
    "b2b",
    "b2g",
    "pubblica amministrazione",
    "pa",
    "istituzioni",
    "governi",
    "istituzionale"
  ]
};

const MODULE_FILE_HINTS: Record<PrimaryHbceModule, string[]> = {
  UNEBDO: [
    "unebdo.md",
    "unebdo_overview.md",
    "unebdo_anchor_model.md",
    "unebdo_validation_model.md",
    "ipr.md",
    "ipr_model.md",
    "ipr_registry.md",
    "identity_primary_record.md",
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
    "proof_receipt.md",
    "evt.ts",
    "evt-ledger.ts",
    "evt_memory.md"
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
    "iprstatuspanel.tsx",
    "navigation_layer.md",
    "operational_navigation.md"
  ],

  CyberGlobal: [
    "cyberglobal.md",
    "cyberglobal_overview.md",
    "cybersecurity_governance_mapping.md",
    "defensive_security_use_cases.md",
    "critical_infrastructure_use_cases.md",
    "incident_report_template.md",
    "hbce_cybersecurity_strategy.md"
  ],

  NeuroLoop: [
    "neuroloop.md",
    "neuroloop_overview.md",
    "validation_loop.md",
    "feedback_loop.md",
    "human_oversight_model.md",
    "decision_validation.md"
  ],

  MATRIX: [
    "matrix.md",
    "matrix_overview.md",
    "matrix_module.md",
    "matrix_module_runtime_map.md",
    "matrix_coordination_layer.md",
    "matrix_system_organization.md",
    "matrix_operational_map.md",
    "matrix_runtime_map.md",
    "hbce_modules_runtime_map.md",
    "hbce_operational_stack.md",
    "five_collections_runtime_map.md",
    "system-manifest.json",
    "system/system-manifest.json",
    "hbce_data_protection_strategy.md",
    "hbce_information_governance_strategy.md"
  ]
};

const STACK_LEVEL_TERMS = [
  "hbce modules",
  "moduli hbce",
  "moduli dell hbce",
  "moduli dell hbce",
  "sette moduli",
  "7 moduli",
  "seven modules",
  "seven hbce modules",
  "sette moduli hbce",
  "hbce operational modules",
  "hbce technical modules",
  "hbce technical-operational modules",
  "stack hbce",
  "hbce stack",
  "operational stack",
  "moduli dello stack",
  "stack tecnico-operativo",
  "technical-operational stack",
  "unebdo opc metaexchange iospace cyberglobal neuroloop matrix",
  "unebdo metaexchange opc iospace cyberglobal neuroloop matrix",
  "ipr unebdo evt memory opc metaexchange iospace cyberglobal neuroloop matrix",
  "cinque collane sette moduli",
  "five collections seven modules",
  "five canonical collections seven hbce modules",
  "cinque collane canoniche sette moduli hbce"
];

const IPR_NAVIGATION_TERMS = [
  "navigazione tramite ipr",
  "navigazione con ipr",
  "sistemi di navigazione tramite ipr",
  "sistemi di navigazione con ipr",
  "sistema di navigazione tramite ipr",
  "sistema di navigazione con ipr",
  "ipr navigation",
  "ipr navigation system",
  "ipr-based navigation",
  "ipr based navigation",
  "operational navigation through ipr",
  "navigation through ipr"
];

const BANKING_LEGAL_GOVERNANCE_TERMS = [
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
  "contratti",
  "contratto",
  "contenzioso",
  "prova",
  "proof",
  "proof receipt",
  "documenti",
  "pratiche",
  "valore pragmatico",
  "valore operativo",
  "a cosa serve",
  "pragmatico",
  "responsabilita",
  "responsabilità",
  "tracciabilita",
  "tracciabilità"
];

const STRATEGIC_DOCTRINE_TERMS = [
  "documenti dottrinali strategici",
  "documenti dottrinali",
  "dottrina strategica",
  "dottrinali strategici",
  "strategic doctrine",
  "strategic doctrines",
  "hbce cybersecurity strategy",
  "cybersecurity strategy",
  "cyber security strategy",
  "hbce data protection strategy",
  "data protection strategy",
  "hbce information governance strategy",
  "information governance strategy",
  "numero 1",
  "il primo",
  "questo 1",
  "numero 2",
  "il secondo",
  "questo 2",
  "numero 3",
  "il terzo",
  "questo 3"
];

const PHYSICAL_NAVIGATION_TERMS = [
  "razzo",
  "razzi",
  "missile",
  "missili",
  "astronave",
  "astronavi",
  "spacecraft",
  "rocket",
  "satellite",
  "satelliti",
  "drone",
  "droni",
  "veicolo",
  "veicoli",
  "mezzo fisico",
  "flight control",
  "controllo di volo",
  "guidance",
  "targeting",
  "puntamento"
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
  const iprNavigationMatches = findMatches(normalizedInput, IPR_NAVIGATION_TERMS);
  const bankingLegalMatches = findMatches(
    normalizedInput,
    BANKING_LEGAL_GOVERNANCE_TERMS
  );
  const strategicDoctrineMatches = findMatches(
    normalizedInput,
    STRATEGIC_DOCTRINE_TERMS
  );
  const physicalNavigationMatches = findMatches(
    normalizedInput,
    PHYSICAL_NAVIGATION_TERMS
  );

  const moduleScores = PRIMARY_MODULES.map((module) =>
    scoreModule(normalizedInput, module, MODULE_KEYWORDS[module])
  );

  if (bankingLegalMatches.length > 0) {
    boostScore(moduleScores, "MATRIX", 12 + bankingLegalMatches.length);
    boostScore(moduleScores, "OPC", 8 + bankingLegalMatches.length);
    boostScore(moduleScores, "MetaExchange", 4 + bankingLegalMatches.length);
    boostScore(moduleScores, "IOspace", 3 + bankingLegalMatches.length);
  }

  if (strategicDoctrineMatches.length > 0) {
    boostScore(moduleScores, "MATRIX", 10 + strategicDoctrineMatches.length);
    boostScore(moduleScores, "OPC", 5 + strategicDoctrineMatches.length);
    boostScore(moduleScores, "CyberGlobal", 5 + strategicDoctrineMatches.length);
  }

  const matchedModules = moduleScores
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoreMap = toScoreMap(moduleScores);

  if (strategicDoctrineMatches.length > 0) {
    return createClassification(
      choosePrimaryDoctrineModule(normalizedInput, matchedModules),
      chooseActiveDoctrineModules(normalizedInput),
      0.97,
      [
        "Strategic doctrine language detected.",
        "Strategic doctrine documents are not HBCE modules, but activate their connected module layer for traceability.",
        ...strategicDoctrineMatches.map(
          (term) => `Matched strategic doctrine term: ${term}`
        ),
        ...collectReasons(matchedModules)
      ],
      scoreMap
    );
  }

  if (bankingLegalMatches.length > 0) {
    return createClassification(
      "MATRIX",
      ["MATRIX", "OPC", "MetaExchange", "IOspace"],
      0.95,
      [
        "Banking, legal, governance, compliance, audit or pragmatic value language detected.",
        "The request concerns operational governance value and is mapped to MATRIX, OPC, MetaExchange and IOspace.",
        ...bankingLegalMatches.map(
          (term) => `Matched banking/legal/governance term: ${term}`
        ),
        ...collectReasons(matchedModules)
      ],
      scoreMap
    );
  }

  if (stackLevelMatches.length > 0) {
    return createClassification(
      choosePrimaryModule(matchedModules, "MATRIX"),
      getDefaultActiveModules(),
      0.95,
      [
        "Input matched HBCE stack-level or seven-module language.",
        "The request concerns the HBCE module map rather than a single isolated module.",
        "MATRIX is active as the coordination and organization module of the HBCE stack.",
        ...stackLevelMatches.map((term) => `Matched stack-level term: ${term}`),
        ...collectReasons(matchedModules)
      ],
      scoreMap
    );
  }

  if (iprNavigationMatches.length > 0) {
    return createClassification(
      "UNEBDO",
      ["UNEBDO", "OPC", "MetaExchange", "IOspace", "MATRIX"],
      physicalNavigationMatches.length > 0 ? 0.9 : 0.95,
      [
        "Input matched IPR-based navigation language.",
        "IPR-based navigation is classified as operational navigation: identity, events, proof, exchange, interface and system coordination.",
        "UNEBDO anchors the IPR identity layer.",
        "OPC proves the continuity of the navigational chain.",
        "MetaExchange supports structured routing between identities, proofs, events and contexts.",
        "IOspace exposes the navigational interface and runtime view.",
        "MATRIX organizes the navigational architecture across the HBCE stack.",
        physicalNavigationMatches.length > 0
          ? "Physical-navigation vocabulary was detected; HBCE/IPR must be treated as governance, traceability and audit layer, not as vehicle-control software."
          : "",
        ...iprNavigationMatches.map((term) => `Matched IPR navigation term: ${term}`),
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
        top.module,
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
  return [...HBCE_MODULES];
}

export function getPrimaryHbceModules(): PrimaryHbceModule[] {
  return [...PRIMARY_MODULES];
}

export function getHbceModuleBinding(
  module: HbceModule,
  activeModules?: HbceModule[]
): HbceModuleBinding {
  const normalizedActiveModules = normalizeActiveModules(module, activeModules ?? []);

  return createHbceModuleBinding(
    normalizeEffectiveModule(module, normalizedActiveModules),
    normalizedActiveModules
  );
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
    const canonicalIdentityWeight =
      module === "UNEBDO" && isCanonicalIdentityKeyword(keyword) ? 5 : 0;
    const canonicalEventProofWeight =
      module === "OPC" && isCanonicalEventProofKeyword(keyword) ? 4 : 0;
    const navigationWeight =
      module === "IOspace" && isNavigationKeyword(keyword) ? 3 : 0;
    const matrixCoordinationWeight =
      module === "MATRIX" && isMatrixCoordinationKeyword(keyword) ? 5 : 0;

    return (
      total +
      baseWeight +
      explicitModuleWeight +
      canonicalIdentityWeight +
      canonicalEventProofWeight +
      navigationWeight +
      matrixCoordinationWeight
    );
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

function boostScore(
  scores: HbceModuleScore[],
  module: PrimaryHbceModule,
  amount: number
): void {
  const target = scores.find((score) => score.module === module);

  if (!target) {
    return;
  }

  target.score += amount;
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

    case "MATRIX":
      return (
        keyword === "matrix" ||
        keyword === "matrix module" ||
        keyword === "modulo matrix" ||
        keyword === "matrix organizes" ||
        keyword === "matrix organizza"
      );

    default:
      return false;
  }
}

function isCanonicalIdentityKeyword(keyword: string): boolean {
  return (
    keyword === "ipr" ||
    keyword === "identity primary record" ||
    keyword === "operational identity" ||
    keyword === "identita operativa"
  );
}

function isCanonicalEventProofKeyword(keyword: string): boolean {
  return (
    keyword === "evt" ||
    keyword === "event trace" ||
    keyword === "verifiable event trace" ||
    keyword === "operational proof of continuity" ||
    keyword === "proof receipt" ||
    keyword === "prova di continuita"
  );
}

function isNavigationKeyword(keyword: string): boolean {
  return (
    keyword === "navigazione" ||
    keyword === "sistema di navigazione" ||
    keyword === "operational navigation" ||
    keyword === "navigation system" ||
    keyword === "navigation layer"
  );
}

function isMatrixCoordinationKeyword(keyword: string): boolean {
  return (
    keyword === "matrix" ||
    keyword === "matrix module" ||
    keyword === "modulo matrix" ||
    keyword === "system coordination" ||
    keyword === "coordination layer" ||
    keyword === "organization layer" ||
    keyword === "operational coordination" ||
    keyword === "coordinamento operativo" ||
    keyword === "coordinamento moduli" ||
    keyword === "organizzazione sistema" ||
    keyword === "organizzazione ecosistema" ||
    keyword === "sette moduli" ||
    keyword === "seven modules" ||
    keyword === "banche" ||
    keyword === "studi legali" ||
    keyword === "governance" ||
    keyword === "valore pragmatico"
  );
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
  const normalizedKeywords = keywords.map((keyword) => normalizeText(keyword));
  const uniqueMatches = new Set<string>();

  for (const keyword of normalizedKeywords) {
    if (!keyword) {
      continue;
    }

    if (matchesTerm(text, keyword)) {
      uniqueMatches.add(keyword);
    }
  }

  return Array.from(uniqueMatches);
}

function matchesTerm(text: string, keyword: string): boolean {
  if (keyword.includes("/") || keyword.includes("_") || keyword.includes(".")) {
    return text.includes(keyword);
  }

  return ` ${text} `.includes(` ${keyword} `);
}

function createClassification(
  module: HbceModule,
  activeModules: HbceModule[],
  confidence: number,
  reasons: string[],
  scores: Partial<Record<PrimaryHbceModule, number>>
): HbceModuleClassification {
  const normalizedActiveModules = normalizeActiveModules(module, activeModules);
  const effectiveModule = normalizeEffectiveModule(module, normalizedActiveModules);
  const metadata = getHbceModuleMetadata(effectiveModule);

  return {
    module: effectiveModule,
    activeModules: normalizedActiveModules,
    primaryModule: effectiveModule,
    moduleType: metadata.moduleType,
    confidence: clampConfidence(confidence),
    reasons: uniqueReasons([
      ...reasons,
      effectiveModule !== module
        ? `Primary module normalized from ${module} to ${effectiveModule} because real active HBCE modules were present.`
        : "",
      normalizedActiveModules.includes("NONE") && normalizedActiveModules.length > 1
        ? "Invalid NONE plus real module state was prevented."
        : ""
    ]),
    scores
  };
}

function normalizeActiveModules(
  module: HbceModule,
  activeModules: HbceModule[]
): HbceModule[] {
  const candidates = activeModules.length > 0 ? activeModules : [module];
  const primaryActiveModules = candidates.filter(isPrimaryHbceModuleLocal);

  if (primaryActiveModules.length > 0) {
    return uniqueModules(primaryActiveModules);
  }

  if (isPrimaryHbceModuleLocal(module)) {
    return [module];
  }

  return ["NONE"];
}

function normalizeEffectiveModule(
  module: HbceModule,
  activeModules: HbceModule[]
): HbceModule {
  if (isPrimaryHbceModuleLocal(module)) {
    return module;
  }

  const firstPrimaryModule = activeModules.find(isPrimaryHbceModuleLocal);

  return firstPrimaryModule || "NONE";
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
    "NeuroLoop",
    "MATRIX"
  ];
}

function choosePrimaryModule(
  matchedModules: HbceModuleScore[],
  fallback: PrimaryHbceModule
): PrimaryHbceModule {
  const matrixMatch = matchedModules.find((module) => module.module === "MATRIX");

  if (matrixMatch) {
    return "MATRIX";
  }

  return matchedModules[0]?.module || fallback;
}

function choosePrimaryDoctrineModule(
  text: string,
  matchedModules: HbceModuleScore[]
): PrimaryHbceModule {
  if (text.includes("cybersecurity") || text.includes("cyber security")) {
    return "CyberGlobal";
  }

  if (text.includes("data protection")) {
    return "OPC";
  }

  if (text.includes("information governance")) {
    return "MATRIX";
  }

  return choosePrimaryModule(matchedModules, "MATRIX");
}

function chooseActiveDoctrineModules(text: string): HbceModule[] {
  if (text.includes("cybersecurity") || text.includes("cyber security")) {
    return ["CyberGlobal", "MATRIX", "OPC", "UNEBDO"];
  }

  if (text.includes("data protection")) {
    return ["OPC", "MATRIX", "IOspace", "MetaExchange"];
  }

  if (text.includes("information governance")) {
    return ["MATRIX", "MetaExchange", "IOspace", "NeuroLoop", "OPC"];
  }

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

function calculateConfidence(score: number, text: string): number {
  const scoreFactor = Math.min(score / 18, 1);
  const lengthFactor = Math.min(text.length / 900, 1);
  const confidence = 0.42 + scoreFactor * 0.45 + lengthFactor * 0.13;

  return clampConfidence(confidence);
}

function calculateMultiModuleConfidence(matchedModules: HbceModuleScore[]): number {
  const matchedModuleFactor = Math.min(matchedModules.length / 7, 1);
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
    NeuroLoop: 0,
    MATRIX: 0
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
