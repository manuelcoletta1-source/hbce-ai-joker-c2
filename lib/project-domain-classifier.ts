/**
 * AI JOKER-C2 Project Domain Classifier
 *
 * Deterministic project-domain classifier for the HERMETICUM B.C.E. runtime.
 *
 * Canonical project domains:
 * - MATRIX
 * - CORPUS_ESOTEROLOGIA_ERMETICA
 * - APOKALYPSIS
 * - GENERAL
 * - MULTI_DOMAIN
 *
 * MATRIX includes European AI governance, technological autonomy,
 * strategic dependency reduction, B2B/B2G infrastructure, citizens,
 * enterprises, public administration, digital sovereignty and operational
 * continuity.
 */

export type ProjectDomain =
  | "MATRIX"
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS"
  | "GENERAL"
  | "MULTI_DOMAIN";

export type PrimaryProjectDomain =
  | "MATRIX"
  | "CORPUS_ESOTEROLOGIA_ERMETICA"
  | "APOKALYPSIS";

export type DomainType =
  | "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
  | "DISCIPLINARY_GRAMMAR_DOMAIN"
  | "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN"
  | "GENERAL_CONTEXT"
  | "ECOSYSTEM_OPERATION";

export type ProjectDomainInput = {
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

export type DomainScore = {
  domain: PrimaryProjectDomain;
  score: number;
  matches: string[];
  reasons: string[];
};

export type ProjectDomainClassification = {
  projectDomain: ProjectDomain;
  activeDomains: ProjectDomain[];
  primaryDomain: ProjectDomain;
  domainType: DomainType;
  confidence: number;
  reasons: string[];
  scores: Record<PrimaryProjectDomain, number>;
};

export type ProjectDomainMetadata = {
  projectDomain: ProjectDomain;
  domainType: DomainType;
  label: string;
  shortDefinition: string;
  runtimeQuestion: string;
};

const PRIMARY_DOMAINS: PrimaryProjectDomain[] = [
  "MATRIX",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS"
];

const PROJECT_DOMAINS: ProjectDomain[] = [
  "MATRIX",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "GENERAL",
  "MULTI_DOMAIN"
];

const DOMAIN_METADATA: Record<ProjectDomain, ProjectDomainMetadata> = {
  MATRIX: {
    projectDomain: "MATRIX",
    domainType: "OPERATIONAL_INFRASTRUCTURE_DOMAIN",
    label: "MATRIX",
    shortDefinition:
      "Operational infrastructure domain for AI governance, European systems, strategic autonomy, B2B, B2G, citizens, enterprises, cloud, data, energy, security and institutional continuity.",
    runtimeQuestion:
      "How can Europe build verifiable operational systems for AI, governance, data, energy, security, citizens, enterprises and institutional continuity?"
  },
  CORPUS_ESOTEROLOGIA_ERMETICA: {
    projectDomain: "CORPUS_ESOTEROLOGIA_ERMETICA",
    domainType: "DISCIPLINARY_GRAMMAR_DOMAIN",
    label: "CORPUS ESOTEROLOGIA ERMETICA",
    shortDefinition:
      "Disciplinary grammar domain for operational reality, canonical terminology, DCTT, theoretical volumes and editorial continuity.",
    runtimeQuestion:
      "What is reality when it is treated as a verifiable sequence?"
  },
  APOKALYPSIS: {
    projectDomain: "APOKALYPSIS",
    domainType: "HISTORICAL_THRESHOLD_ANALYSIS_DOMAIN",
    label: "APOKALYPSIS",
    shortDefinition:
      "Historical threshold analysis domain for decay, exposure, cognitive dislocation and cultural-political-social system analysis.",
    runtimeQuestion:
      "What happens when the cultural, political and social system continues to function while already losing its foundation?"
  },
  GENERAL: {
    projectDomain: "GENERAL",
    domainType: "GENERAL_CONTEXT",
    label: "GENERAL",
    shortDefinition:
      "Ordinary safe context with no specific MATRIX, CORPUS or APOKALYPSIS domain binding.",
    runtimeQuestion:
      "Does this request require a specific project-domain classification?"
  },
  MULTI_DOMAIN: {
    projectDomain: "MULTI_DOMAIN",
    domainType: "ECOSYSTEM_OPERATION",
    label: "MULTI_DOMAIN",
    shortDefinition:
      "Ecosystem-level operation involving more than one primary domain or the whole AI JOKER-C2 governance runtime.",
    runtimeQuestion:
      "How does the operation affect MATRIX, CORPUS ESOTEROLOGIA ERMETICA and APOKALYPSIS together?"
  }
};

const DOMAIN_KEYWORDS: Record<PrimaryProjectDomain, string[]> = {
  MATRIX: [
    "matrix",
    "matrix europa",
    "matrix hbce",
    "matrix torino",
    "matrix italia",
    "matrix piemonte",
    "matrix italia europa",
    "matrix torino bruxelles",
    "europe",
    "europa",
    "leurpa",
    "european",
    "european union",
    "unione europea",
    "ue",
    "brussels",
    "bruxelles",
    "torino",
    "piemonte",
    "italy",
    "italia",
    "ai governance",
    "governance ai",
    "governance",
    "governance europea",
    "governance imprese",
    "governance cittadini",
    "public administration",
    "pubblica amministrazione",
    "public sector",
    "settore pubblico",
    "citizens",
    "cittadini",
    "enterprises",
    "imprese",
    "aziende",
    "industria",
    "industrial",
    "b2b",
    "b2g",
    "cloud",
    "data governance",
    "governance dei dati",
    "cybersecurity",
    "sicurezza informatica",
    "defensive security",
    "critical infrastructure",
    "infrastrutture critiche",
    "energy",
    "energia",
    "logistics",
    "logistica",
    "digital sovereignty",
    "sovranita digitale",
    "sovranità digitale",
    "technological sovereignty",
    "sovranita tecnologica",
    "sovranità tecnologica",
    "strategic autonomy",
    "autonomia strategica",
    "autonomia tecnologica",
    "european strategic autonomy",
    "autonomia strategica europea",
    "dipendenza tecnologica",
    "dipendenze tecnologiche",
    "dipendenza estera",
    "dipendenze estere",
    "dipendenze estere tecnologiche",
    "dipendenze strategiche",
    "dipendenza strategica",
    "ridurre dipendenze",
    "ridurre le dipendenze",
    "riduzione dipendenze",
    "dipendenze penalizzanti",
    "asse tecnologico",
    "asse tecnologico europeo",
    "proprio asse tecnologico",
    "infrastruttura europea",
    "standard europeo",
    "standard europa",
    "standard ue",
    "tecnologia adottata in europa",
    "adottata in tutta europa",
    "governance imprese cittadini",
    "imprese e cittadini",
    "imprese cittadini",
    "istituzionale",
    "istituzioni",
    "operational infrastructure",
    "infrastruttura operativa",
    "fail closed",
    "fail-closed",
    "auditability",
    "auditabilita",
    "auditabilità",
    "traceability",
    "tracciabilita",
    "tracciabilità",
    "evidence",
    "verification",
    "verifica",
    "runtime governance",
    "ipr",
    "evt",
    "identity primary record",
    "identita operativa",
    "identità operativa",
    "biocybersecurity",
    "biocibersicurezza",
    "biocibernetica"
  ],
  CORPUS_ESOTEROLOGIA_ERMETICA: [
    "corpus",
    "corpus esoterologia ermetica",
    "esoterologia",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "dctt",
    "decision cost trace time",
    "operational reality",
    "reale operativo",
    "realta operativa",
    "realtà operativa",
    "canonical glossary",
    "glossario canonico",
    "lex hermeticum",
    "alien code",
    "alien artifact",
    "paradogma alieno",
    "portale dell anticristo",
    "portale dell'anticristo",
    "rascensionale",
    "riconconicita",
    "riconconicità",
    "qubitronica",
    "volume i",
    "volume ii",
    "volume iii",
    "volume iv",
    "volume v",
    "chapter",
    "capitolo",
    "book",
    "libro",
    "manuscript",
    "manoscritto",
    "editorial",
    "editoriale",
    "theoretical",
    "teorico",
    "disciplinary grammar",
    "grammatica disciplinare",
    "canonical terminology",
    "terminologia canonica",
    "volume mapping",
    "mappa dei volumi",
    "frontespizio",
    "tesi editoriale",
    "formula fondativa"
  ],
  APOKALYPSIS: [
    "apokalypsis",
    "apokalipsis",
    "apocalipsis",
    "apocalisse",
    "decay",
    "decadence",
    "decadimento",
    "exposure",
    "esposizione",
    "historical threshold",
    "soglia storica",
    "threshold",
    "soglia",
    "cultural system",
    "sistema culturale",
    "political system",
    "sistema politico",
    "social system",
    "sistema sociale",
    "cognitive dislocation",
    "dislocazione cognitiva",
    "cognitive rupture",
    "rottura cognitiva",
    "recognition",
    "riconoscimento",
    "system foundation loss",
    "perdita di fondamento",
    "foundation loss",
    "civilizational analysis",
    "analisi civilizzazionale",
    "historical crisis",
    "crisi storica",
    "old system",
    "vecchio sistema",
    "system collapse",
    "collasso del sistema",
    "system exposure",
    "esposizione del sistema",
    "apostasy",
    "apostasia",
    "paradogma alieno",
    "emergence of the paradogma",
    "emersione del paradogma",
    "cultural decay",
    "political exposure",
    "social dislocation",
    "sistema culturale politico sociale"
  ]
};

const EUROPEAN_STRATEGIC_AUTONOMY_TERMS = [
  "europa",
  "leurpa",
  "ue",
  "unione europea",
  "europe",
  "european",
  "dipendenze estere",
  "dipendenze tecnologiche",
  "dipendenze strategiche",
  "dipendenza tecnologica",
  "dipendenza strategica",
  "dipendenze penalizzanti",
  "autonomia strategica",
  "autonomia tecnologica",
  "sovranita digitale",
  "sovranità digitale",
  "sovranita tecnologica",
  "sovranità tecnologica",
  "asse tecnologico",
  "asse tecnologico europeo",
  "standard europeo",
  "governance imprese",
  "governance cittadini",
  "imprese cittadini",
  "imprese e cittadini",
  "cittadini",
  "imprese",
  "b2b",
  "b2g"
];

const REPOSITORY_MULTI_DOMAIN_FILES = [
  "readme.md",
  "architecture.md",
  "governance.md",
  "evt_protocol.md",
  "protocol.md",
  "dual_use_strategic_positioning.md",
  "security.md",
  "compliance.md",
  "roadmap.md",
  "contributing.md",
  "system-manifest.json",
  "system/system-manifest.json",
  "project_domain_governance_map.md",
  "ai_joker_c2_runtime_model.md"
];

const MATRIX_FILES = [
  "b2b_overview.md",
  "b2g_overview.md",
  "matrix_overview.md",
  "ai_governance_mapping.md",
  "matrix_european_infrastructure_map.md",
  "matrix_b2b_use_cases.md",
  "matrix_b2g_use_cases.md",
  "matrix_public_administration_model.md",
  "matrix_critical_infrastructure_model.md",
  "matrix_cybersecurity_resilience_model.md",
  "matrix_procurement_governance_model.md"
];

const CORPUS_FILES = [
  "corpus_overview.md",
  "corpus_canonical_glossary.md",
  "corpus_volume_map.md",
  "corpus_editorial_governance.md",
  "corpus_dctt_model.md",
  "corpus_terminology_policy.md",
  "corpus_public_communication_boundary.md"
];

const APOKALYPSIS_FILES = [
  "apokalypsis_overview.md",
  "apokalypsis_volume_map.md",
  "apokalypsis_editorial_governance.md",
  "apokalypsis_threshold_model.md",
  "apokalypsis_public_communication_boundary.md",
  "apokalypsis_current_events_policy.md",
  "apokalypsis_non_coercion_policy.md"
];

const MULTI_DOMAIN_TERMS = [
  "matrix corpus apokalypsis",
  "matrix corpus and apokalypsis",
  "matrix corpus e apokalypsis",
  "matrix · corpus · apokalypsis",
  "matrix, corpus and apokalypsis",
  "matrix, corpus e apokalypsis",
  "matrix corpus apocalipsis",
  "matrix corpus apokalipsis",
  "hermeticum ecosystem",
  "ecosistema hermeticum",
  "ai joker-c2 runtime",
  "ai joker c2 runtime",
  "whole ecosystem",
  "intero ecosistema",
  "three domains",
  "tre domini",
  "primary domains",
  "domini primari",
  "project domain",
  "project-domain",
  "runtime model",
  "governance model",
  "system manifest",
  "manifesto sistema",
  "evt protocol",
  "protocollo evt"
];

export function classifyProjectDomain(
  input: ProjectDomainInput | string
): ProjectDomainClassification {
  const normalizedInput = normalizeInput(input);

  if (!normalizedInput.trim()) {
    return createClassification(
      "GENERAL",
      ["GENERAL"],
      0.2,
      ["No meaningful input was provided."],
      createEmptyScores()
    );
  }

  const fileBasedClassification = classifyByFilePath(normalizedInput);

  if (fileBasedClassification) {
    return fileBasedClassification;
  }

  const strategicAutonomyMatches =
    findEuropeanStrategicAutonomyMatches(normalizedInput);

  if (strategicAutonomyMatches.length >= 2) {
    const scores = createEmptyScores();
    scores.MATRIX = 14 + strategicAutonomyMatches.length;

    return createClassification(
      "MATRIX",
      ["MATRIX"],
      0.95,
      [
        "European strategic autonomy / technological dependency reduction language detected.",
        "Such requests belong to the MATRIX operational infrastructure and governance domain.",
        ...strategicAutonomyMatches.map(
          (term) => `Matched strategic-autonomy term: ${term}`
        )
      ],
      scores
    );
  }

  const explicitMultiDomain = findMatches(normalizedInput, MULTI_DOMAIN_TERMS);

  const domainScores = PRIMARY_DOMAINS.map((domain) =>
    scoreDomain(normalizedInput, domain, DOMAIN_KEYWORDS[domain])
  );

  const matchedDomains = domainScores
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoreMap = toScoreMap(domainScores);

  if (explicitMultiDomain.length > 0) {
    return createClassification(
      "MULTI_DOMAIN",
      ["MATRIX", "CORPUS_ESOTEROLOGIA_ERMETICA", "APOKALYPSIS"],
      calculateMultiDomainConfidence(matchedDomains, explicitMultiDomain.length),
      [
        "Input matched explicit ecosystem-level or multi-domain language.",
        ...explicitMultiDomain.map((term) => `Matched multi-domain term: ${term}`),
        ...collectReasons(matchedDomains)
      ],
      scoreMap
    );
  }

  if (matchedDomains.length >= 2) {
    const top = matchedDomains[0];
    const second = matchedDomains[1];

    if (shouldClassifyAsMultiDomain(top.score, second.score)) {
      return createClassification(
        "MULTI_DOMAIN",
        matchedDomains.map((result) => result.domain),
        calculateConfidence(top.score, normalizedInput),
        [
          "More than one primary project domain matched with sufficient strength.",
          ...collectReasons(matchedDomains)
        ],
        scoreMap
      );
    }
  }

  if (matchedDomains.length === 0) {
    return createClassification(
      "GENERAL",
      ["GENERAL"],
      0.45,
      ["No primary project-domain keyword matched; defaulted to GENERAL."],
      scoreMap
    );
  }

  const best = matchedDomains[0];

  return createClassification(
    best.domain,
    [best.domain],
    calculateConfidence(best.score, normalizedInput),
    best.reasons.length > 0
      ? best.reasons
      : [`Classified as ${best.domain} by highest project-domain score.`],
    scoreMap
  );
}

export function classifyProjectDomainFromMessage(
  message: string
): ProjectDomainClassification {
  return classifyProjectDomain({ message });
}

export function isProjectDomain(value: string): value is ProjectDomain {
  return PROJECT_DOMAINS.includes(value as ProjectDomain);
}

export function isPrimaryProjectDomain(
  value: string
): value is PrimaryProjectDomain {
  return PRIMARY_DOMAINS.includes(value as PrimaryProjectDomain);
}

export function getProjectDomainMetadata(
  domain: ProjectDomain
): ProjectDomainMetadata {
  return DOMAIN_METADATA[domain];
}

export function getProjectDomainType(domain: ProjectDomain): DomainType {
  return DOMAIN_METADATA[domain].domainType;
}

export function getCanonicalProjectDomains(): ProjectDomain[] {
  return [...PROJECT_DOMAINS];
}

function classifyByFilePath(
  normalizedInput: string
): ProjectDomainClassification | null {
  const scoreMap = createEmptyScores();

  const matchedMultiFile = REPOSITORY_MULTI_DOMAIN_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedMultiFile) {
    return createClassification(
      "MULTI_DOMAIN",
      ["MATRIX", "CORPUS_ESOTEROLOGIA_ERMETICA", "APOKALYPSIS"],
      0.94,
      [
        `Repository-level governance file detected: ${matchedMultiFile}`,
        "Repository-level governance files affect the full AI JOKER-C2 ecosystem."
      ],
      scoreMap
    );
  }

  const matchedMatrixFile = MATRIX_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedMatrixFile) {
    scoreMap.MATRIX = 8;

    return createClassification(
      "MATRIX",
      ["MATRIX"],
      0.92,
      [
        `MATRIX documentation file detected: ${matchedMatrixFile}`,
        "File path maps to the operational infrastructure domain."
      ],
      scoreMap
    );
  }

  const matchedCorpusFile = CORPUS_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedCorpusFile) {
    scoreMap.CORPUS_ESOTEROLOGIA_ERMETICA = 8;

    return createClassification(
      "CORPUS_ESOTEROLOGIA_ERMETICA",
      ["CORPUS_ESOTEROLOGIA_ERMETICA"],
      0.92,
      [
        `CORPUS documentation file detected: ${matchedCorpusFile}`,
        "File path maps to the disciplinary grammar domain."
      ],
      scoreMap
    );
  }

  const matchedApokalypsisFile = APOKALYPSIS_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedApokalypsisFile) {
    scoreMap.APOKALYPSIS = 8;

    return createClassification(
      "APOKALYPSIS",
      ["APOKALYPSIS"],
      0.92,
      [
        `APOKALYPSIS documentation file detected: ${matchedApokalypsisFile}`,
        "File path maps to the historical threshold analysis domain."
      ],
      scoreMap
    );
  }

  return null;
}

function scoreDomain(
  text: string,
  domain: PrimaryProjectDomain,
  keywords: string[]
): DomainScore {
  const matches = findMatches(text, keywords);

  const score = matches.reduce((total, keyword) => {
    const wordCount = keyword.split(" ").filter(Boolean).length;
    const baseWeight = wordCount >= 3 ? 4 : wordCount === 2 ? 3 : 1;
    const explicitDomainWeight = isExplicitDomainName(domain, keyword) ? 5 : 0;

    return total + baseWeight + explicitDomainWeight;
  }, 0);

  return {
    domain,
    score,
    matches,
    reasons:
      score > 0
        ? [`${domain} matched: ${matches.join(", ")}`]
        : []
  };
}

function isExplicitDomainName(
  domain: PrimaryProjectDomain,
  keyword: string
): boolean {
  if (domain === "MATRIX") {
    return keyword === "matrix" || keyword.startsWith("matrix ");
  }

  if (domain === "CORPUS_ESOTEROLOGIA_ERMETICA") {
    return keyword === "corpus" || keyword.includes("corpus esoterologia");
  }

  if (domain === "APOKALYPSIS") {
    return (
      keyword === "apokalypsis" ||
      keyword === "apokalipsis" ||
      keyword === "apocalipsis"
    );
  }

  return false;
}

function shouldClassifyAsMultiDomain(
  topScore: number,
  secondScore: number
): boolean {
  if (topScore <= 0 || secondScore <= 0) {
    return false;
  }

  if (secondScore >= 4) {
    return true;
  }

  return secondScore / topScore >= 0.45;
}

function normalizeInput(input: ProjectDomainInput | string): string {
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

function findEuropeanStrategicAutonomyMatches(text: string): string[] {
  return findMatches(text, EUROPEAN_STRATEGIC_AUTONOMY_TERMS);
}

function createClassification(
  projectDomain: ProjectDomain,
  activeDomains: ProjectDomain[],
  confidence: number,
  reasons: string[],
  scores: Record<PrimaryProjectDomain, number>
): ProjectDomainClassification {
  const metadata = DOMAIN_METADATA[projectDomain];

  return {
    projectDomain,
    activeDomains: normalizeActiveDomains(projectDomain, activeDomains),
    primaryDomain: projectDomain,
    domainType: metadata.domainType,
    confidence: clampConfidence(confidence),
    reasons: uniqueReasons(reasons),
    scores
  };
}

function normalizeActiveDomains(
  projectDomain: ProjectDomain,
  activeDomains: ProjectDomain[]
): ProjectDomain[] {
  if (projectDomain === "MULTI_DOMAIN") {
    const primaryActiveDomains = activeDomains.filter(isPrimaryProjectDomain);

    if (primaryActiveDomains.length === 0) {
      return ["MATRIX", "CORPUS_ESOTEROLOGIA_ERMETICA", "APOKALYPSIS"];
    }

    return uniqueDomains(primaryActiveDomains);
  }

  if (projectDomain === "GENERAL") {
    return ["GENERAL"];
  }

  return [projectDomain];
}

function calculateConfidence(score: number, text: string): number {
  const scoreFactor = Math.min(score / 18, 1);
  const lengthFactor = Math.min(text.length / 900, 1);
  const confidence = 0.42 + scoreFactor * 0.45 + lengthFactor * 0.13;

  return clampConfidence(confidence);
}

function calculateMultiDomainConfidence(
  matchedDomains: DomainScore[],
  explicitMultiDomainMatches: number
): number {
  const matchedDomainFactor = Math.min(matchedDomains.length / 3, 1);
  const explicitFactor = Math.min(explicitMultiDomainMatches / 3, 1);
  const confidence = 0.7 + matchedDomainFactor * 0.15 + explicitFactor * 0.1;

  return clampConfidence(confidence);
}

function clampConfidence(value: number): number {
  return Number(Math.max(0.2, Math.min(value, 0.98)).toFixed(2));
}

function collectReasons(results: DomainScore[]): string[] {
  return results.flatMap((result) => result.reasons);
}

function createEmptyScores(): Record<PrimaryProjectDomain, number> {
  return {
    MATRIX: 0,
    CORPUS_ESOTEROLOGIA_ERMETICA: 0,
    APOKALYPSIS: 0
  };
}

function toScoreMap(
  scores: DomainScore[]
): Record<PrimaryProjectDomain, number> {
  return scores.reduce<Record<PrimaryProjectDomain, number>>(
    (accumulator, score) => {
      accumulator[score.domain] = score.score;
      return accumulator;
    },
    createEmptyScores()
  );
}

function uniqueReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons.filter(Boolean)));
}

function uniqueDomains<T extends ProjectDomain>(domains: T[]): T[] {
  return Array.from(new Set(domains));
}
