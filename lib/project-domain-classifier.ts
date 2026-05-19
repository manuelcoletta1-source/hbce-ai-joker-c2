/**
 * AI JOKER-C2 Project Domain Classifier
 *
 * Deterministic project-domain classifier for the HERMETICUM B.C.E. runtime.
 *
 * This classifier handles project domains and editorial/strategic collections.
 * It does not replace the HBCE module classifier.
 *
 * Canonical project domains:
 * - MATRIX
 * - U.S.E.
 * - CORPUS_ESOTEROLOGIA_ERMETICA
 * - APOKALYPSIS
 * - HBCE_ECOSISTEMA_AI
 * - GENERAL
 * - MULTI_DOMAIN
 *
 * Boundary:
 * MATRIX has a dual function.
 * As a project domain, MATRIX is the operational infrastructure architecture.
 * As an HBCE module, MATRIX is the system coordination and organization layer.
 * The module function is handled by lib/hbce-module-classifier.ts.
 */

import type {
  DomainType,
  PrimaryProjectDomain,
  ProjectDomain,
  ProjectDomainClassification,
  ProjectDomainMetadata
} from "./runtime-types";

export type {
  DomainType,
  PrimaryProjectDomain,
  ProjectDomain,
  ProjectDomainClassification,
  ProjectDomainMetadata
} from "./runtime-types";

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

const PRIMARY_DOMAINS: PrimaryProjectDomain[] = [
  "MATRIX",
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "HBCE_ECOSISTEMA_AI"
];

const PROJECT_DOMAINS: ProjectDomain[] = [
  "MATRIX",
  "U.S.E.",
  "CORPUS_ESOTEROLOGIA_ERMETICA",
  "APOKALYPSIS",
  "HBCE_ECOSISTEMA_AI",
  "GENERAL",
  "MULTI_DOMAIN"
];

const DOMAIN_METADATA: Record<ProjectDomain, ProjectDomainMetadata> = {
  MATRIX: {
    projectDomain: "MATRIX",
    domainType: "OPERATIONAL_INFRASTRUCTURE_DOMAIN",
    label: "MATRIX",
    shortDefinition:
      "Operational infrastructure architecture for AI governance, European systems, strategic autonomy, B2B, B2G, citizens, enterprises, cloud, data, energy, security and institutional continuity.",
    runtimeQuestion:
      "How can Europe build verifiable operational systems for AI, governance, data, energy, security, citizens, enterprises and institutional continuity?"
  },
  "U.S.E.": {
    projectDomain: "U.S.E.",
    domainType: "FEDERATED_EUROPEAN_INSTITUTIONAL_APPLICATION_DOMAIN",
    label: "U.S.E. — United States of Europe",
    shortDefinition:
      "MATRIX-derived political-institutional application domain for a federated operational Europe, digital sovereignty, federated digital voting, public consultation, democratic infrastructure and civic audit safeguards.",
    runtimeQuestion:
      "How can MATRIX be applied to design the United States of Europe as a federated, operational, sovereign, digital and verifiable institutional system?",
    parentDomain: "MATRIX"
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
  HBCE_ECOSISTEMA_AI: {
    projectDomain: "HBCE_ECOSISTEMA_AI",
    domainType: "AI_GOVERNANCE_ECOSYSTEM_DOMAIN",
    label: "HBCE ECOSISTEMA AI",
    shortDefinition:
      "AI governance ecosystem collection explaining how artificial intelligence is governed through HBCE, IPR, EVT, OPC, MATRIX and AI JOKER-C2.",
    runtimeQuestion:
      "How can artificial intelligence be governed as an identifiable, traceable, auditable and responsible operational process?",
    parentDomain: "MATRIX"
  },
  GENERAL: {
    projectDomain: "GENERAL",
    domainType: "GENERAL_CONTEXT",
    label: "GENERAL",
    shortDefinition:
      "Ordinary safe context with no specific MATRIX, U.S.E., CORPUS, APOKALYPSIS or HBCE ECOSISTEMA AI domain binding.",
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
      "How does the operation affect MATRIX, U.S.E., CORPUS ESOTEROLOGIA ERMETICA, APOKALYPSIS and HBCE ECOSISTEMA AI together?"
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
    "matrix ai governance",
    "matrix governance",
    "operational infrastructure",
    "infrastruttura operativa",
    "infrastruttura europea",
    "architettura operativa",
    "architettura infrastrutturale",
    "architettura hbce",
    "sistema operativo europeo",
    "hbce stack",
    "stack hbce",
    "operational stack",
    "technical-operational stack",
    "stack tecnico-operativo",
    "moduli hbce",
    "sette moduli",
    "7 moduli",
    "seven modules",
    "seven hbce modules",
    "modulo matrix",
    "matrix module",
    "system coordination",
    "coordinamento sistema",
    "coordinamento operativo",
    "organizzazione sistema",
    "organizzazione ecosistema",
    "unebdo",
    "metaexchange",
    "meta exchange",
    "iospace",
    "io space",
    "cyberglobal",
    "cyber global",
    "neuroloop",
    "neuro loop",
    "robot",
    "robotica",
    "robotics",
    "vehicle",
    "vehicles",
    "veicolo",
    "veicoli",
    "autonomous vehicle",
    "autonomous vehicles",
    "veicolo autonomo",
    "veicoli autonomi",
    "autonomous system",
    "autonomous systems",
    "sistema autonomo",
    "sistemi autonomi",
    "automation",
    "automazione",
    "decision loop",
    "feedback loop",
    "validation loop",
    "ciclo decisionale",
    "ciclo di validazione",
    "feedback controllato",
    "europe",
    "europa",
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
    "sovranita tecnologica",
    "technological sovereignty",
    "strategic autonomy",
    "autonomia strategica",
    "autonomia tecnologica",
    "european strategic autonomy",
    "autonomia strategica europea",
    "dipendenza tecnologica",
    "dipendenze tecnologiche",
    "dipendenza estera",
    "dipendenze estere",
    "dipendenze strategiche",
    "dipendenza strategica",
    "ridurre dipendenze",
    "riduzione dipendenze",
    "asse tecnologico",
    "asse tecnologico europeo",
    "standard europeo",
    "standard europa",
    "standard ue",
    "istituzionale",
    "istituzioni",
    "fail closed",
    "fail-closed",
    "auditability",
    "auditabilita",
    "traceability",
    "tracciabilita",
    "evidence",
    "verification",
    "verifica",
    "runtime governance",
    "runtime diagnostic",
    "runtime diagnostics",
    "diagnostic runtime",
    "diagnostica runtime",
    "diagnostica joker",
    "joker runtime",
    "joker-c2 runtime",
    "ai joker-c2 runtime",
    "hbce runtime",
    "runtime status",
    "runtime state",
    "governed runtime",
    "governed ai runtime",
    "ipr runtime demonstrator",
    "biocybersecurity",
    "biocibersicurezza",
    "biocibernetica"
  ],
  "U.S.E.": [
    "u.s.e.",
    "u.s.e",
    "united states of europe",
    "stati uniti d europa",
    "stati uniti europa",
    "stati uniti europei",
    "federated europe",
    "federated operational europe",
    "federazione europea",
    "federazione operativa europea",
    "european federation",
    "federated european",
    "federazione europea digitale",
    "costituzione operativa europea",
    "european operational constitution",
    "federated digital vote",
    "federated digital voting",
    "federated vote",
    "federated voting",
    "federal voting",
    "voto digitale federato",
    "voto federato",
    "voto federale",
    "sistema di voto federato",
    "democratic infrastructure",
    "infrastruttura democratica",
    "infrastruttura democratica digitale",
    "public consultation",
    "consultazione pubblica",
    "referendum infrastructure",
    "infrastruttura referendaria",
    "referendum digitale",
    "direct legislative participation",
    "partecipazione legislativa diretta",
    "democrazia verificabile",
    "verifiable democracy",
    "democrazia legislativa",
    "democrazia diretta",
    "democrazia ibrida",
    "civic participation",
    "partecipazione civica",
    "public decision",
    "decisione pubblica",
    "public decision system",
    "sistema decisionale pubblico",
    "identita operativa europea",
    "audit pubblico",
    "process auditable",
    "vote anonymized",
    "choice separated",
    "identity verified first",
    "identity verified first choice separated after vote anonymized process auditable",
    "civil protection",
    "protezione civile",
    "emergency coordination",
    "coordinamento emergenze",
    "regional national european",
    "regionale nazionale europeo",
    "multi level governance",
    "governance multilivello",
    "european public decision",
    "decisione pubblica europea",
    "citizen identity",
    "identita cittadino",
    "participation rights",
    "diritti di partecipazione",
    "constitutional operational",
    "costituzionale operativo",
    "sovereign digital europe",
    "europa digitale sovrana"
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
    "canonical glossary",
    "glossario canonico",
    "lex hermeticum",
    "alien code",
    "alien artifact",
    "paradogma alieno",
    "portale dell anticristo",
    "rascensionale",
    "riconconicita",
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
  ],
  HBCE_ECOSISTEMA_AI: [
    "hbce ecosistema ai",
    "ecosistema ai",
    "ecosistema dell ai",
    "ecosistema artificiale",
    "hbce ai",
    "hbce artificial intelligence",
    "ai ecosystem",
    "ai governance ecosystem",
    "governo dell ai",
    "governare l ai",
    "governance dell ai",
    "ai governance",
    "governance ai",
    "artificial intelligence governance",
    "intelligenza artificiale governata",
    "ai governata",
    "governed ai",
    "governed artificial intelligence",
    "ai non governata",
    "intelligenza artificiale non governata",
    "ai safety",
    "ai risk",
    "rischio ai",
    "sicurezza ai",
    "human oversight ai",
    "controllo umano ai",
    "fail closed ai",
    "fail-closed ai",
    "ai audit",
    "audit ai",
    "audit dell ai",
    "ipr ai audit trail",
    "ai audit trail",
    "ai assisted audit",
    "ai proof",
    "prova dell ai",
    "traccia dell ai",
    "responsabilita dell ai",
    "ai accountability",
    "ai responsibility",
    "model governance",
    "governance modelli",
    "provider governance",
    "external ai models",
    "modelli ai esterni",
    "modelli esterni",
    "openai",
    "anthropic",
    "claude",
    "google ai",
    "gemini",
    "meta ai",
    "llama",
    "mistral",
    "proprietary hbce ai",
    "ai proprietaria hbce",
    "hybrid ai architecture",
    "architettura ai ibrida",
    "ai genera hbce governa",
    "ai generates hbce governs",
    "ai genera",
    "hbce governa",
    "ipr identifica",
    "evt traccia",
    "opc prova",
    "matrix organizza",
    "ai joker-c2 esegue",
    "joker-c2 esegue",
    "hbce ecosistema ai volume",
    "volume hbce ecosistema ai",
    "ipr identita operativa dell ai",
    "evt opc traccia e prova dell ai",
    "matrix ai governance",
    "ai joker-c2 volume",
    "governare intelligenza artificiale",
    "processo ai auditabile",
    "processo ai tracciabile",
    "processo ai identificabile",
    "processo ai responsabile",
    "runtime ai governato",
    "runtime governato ai"
  ]
};

const RUNTIME_DIAGNOSTIC_TERMS = [
  "diagnostica runtime",
  "runtime diagnostic",
  "runtime diagnostics",
  "diagnostic runtime",
  "joker diagnostic",
  "diagnostica joker",
  "joker runtime",
  "joker-c2 runtime",
  "ai joker-c2 runtime",
  "hbce runtime",
  "runtime status",
  "runtime state",
  "governed runtime",
  "runtime report",
  "runtime check",
  "check runtime",
  "runtime openai",
  "diagnostica openai",
  "fammi una diagnostica",
  "diagnostica"
];

const IPR_OPERATIONAL_TERMS = [
  "ipr",
  "identity primary record",
  "identita primaria operativa",
  "identita operativa",
  "ipr runtime",
  "ipr runtime demonstrator",
  "ipr product",
  "ipr prodotto",
  "ipr proof",
  "operational identity",
  "operational proof",
  "proof instrument",
  "strumento operativo",
  "strumento di prova",
  "identity proof",
  "identity binding",
  "ipr binding",
  "ipra",
  "ipr-ai-0001"
];

const HBCE_PROOF_LAYER_TERMS = [
  "evt",
  "event trace",
  "verifiable event trace",
  "evt protocol",
  "protocollo evt",
  "evt continuity",
  "continuita evt",
  "evt ipr memory",
  "evt/ipr memory",
  "evt ipr bound memory",
  "memory evt",
  "opc",
  "opc proof",
  "opc proof receipt",
  "proof receipt",
  "operational proof",
  "operational proof compliance",
  "operational proof and compliance",
  "proof record",
  "audit receipt",
  "audit trail",
  "iospace",
  "hbce operational stack",
  "operational stack",
  "proof chain",
  "chain hash"
];

const EUROPEAN_STRATEGIC_AUTONOMY_TERMS = [
  "europa",
  "ue",
  "unione europea",
  "europe",
  "european",
  "dipendenze estere",
  "dipendenze tecnologiche",
  "dipendenze strategiche",
  "dipendenza tecnologica",
  "dipendenza strategica",
  "autonomia strategica",
  "autonomia tecnologica",
  "sovranita digitale",
  "sovranita tecnologica",
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

const AI_GOVERNANCE_TERMS = [
  "ai governance",
  "governance ai",
  "governo dell ai",
  "governare l ai",
  "ai audit",
  "audit ai",
  "ai safety",
  "ai risk",
  "rischio ai",
  "human oversight ai",
  "modelli ai",
  "openai",
  "anthropic",
  "claude",
  "google ai",
  "gemini",
  "mistral",
  "meta ai",
  "llama"
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
  "ai_joker_c2_runtime_model.md",
  "hbce_operational_stack.md",
  "five_collections_runtime_map.md",
  "hbce_modules_runtime_map.md"
];

const MATRIX_FILES = [
  "b2b_overview.md",
  "b2g_overview.md",
  "matrix_overview.md",
  "ai_governance_mapping.md",
  "ipr_product_overview.md",
  "ipr_runtime_demonstrator.md",
  "matrix_european_infrastructure_map.md",
  "matrix_b2b_use_cases.md",
  "matrix_b2g_use_cases.md",
  "matrix_public_administration_model.md",
  "matrix_critical_infrastructure_model.md",
  "matrix_cybersecurity_resilience_model.md",
  "matrix_procurement_governance_model.md",
  "matrix_module_runtime_map.md"
];

const USE_FILES = [
  "use_overview.md",
  "u.s.e._overview.md",
  "united_states_of_europe.md",
  "use_democratic_infrastructure_boundary.md",
  "use_federated_digital_vote_safeguards.md",
  "use_digital_sovereignty.md",
  "use_constitutional_operational_model.md",
  "use_public_consultation_model.md",
  "use_referendum_infrastructure.md",
  "use_civic_governance.md"
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

const HBCE_ECOSISTEMA_AI_FILES = [
  "hbce_ecosistema_ai.md",
  "hbce_ecosistema_ai_collection.md",
  "hbce_ai_governance.md",
  "hbce_ai_volume_map.md",
  "hbce_ai_runtime_governance.md",
  "hbce_ai_audit_trail.md",
  "ipr_ai_audit_trail.md",
  "ai_governance_ecosystem.md",
  "ai_joker_c2_governed_runtime.md",
  "matrix_ai_governance.md"
];

const MULTI_DOMAIN_TERMS = [
  "matrix use corpus apokalypsis hbce ecosistema ai",
  "matrix u.s.e. corpus apokalypsis hbce ecosistema ai",
  "matrix corpus apokalypsis hbce ecosistema ai",
  "five collections",
  "cinque collane",
  "cinque domini",
  "five canonical collections",
  "cinque collane canoniche",
  "five project collections",
  "cinque collane progettuali",
  "matrix use corpus apokalypsis",
  "matrix u.s.e. corpus apokalypsis",
  "matrix corpus apokalypsis",
  "matrix corpus and apokalypsis",
  "matrix corpus e apokalypsis",
  "matrix corpus apocalipsis",
  "matrix corpus apokalipsis",
  "hermeticum ecosystem",
  "ecosistema hermeticum",
  "ai joker-c2 runtime",
  "ai joker c2 runtime",
  "whole ecosystem",
  "intero ecosistema",
  "four domains",
  "quattro domini",
  "four collections",
  "quattro collane",
  "primary domains",
  "domini primari",
  "project domain",
  "project-domain",
  "runtime model",
  "governance model",
  "system manifest",
  "manifesto sistema",
  "hbce operational stack",
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

  const runtimeDiagnosticMatches = findMatches(
    normalizedInput,
    RUNTIME_DIAGNOSTIC_TERMS
  );

  if (runtimeDiagnosticMatches.length > 0) {
    const scores = createEmptyScores();
    scores.MATRIX = 16 + runtimeDiagnosticMatches.length;

    return createClassification(
      "MATRIX",
      ["MATRIX"],
      0.96,
      [
        "Runtime diagnostic language detected.",
        "AI JOKER-C2 runtime diagnostics belong to the MATRIX/HBCE operational infrastructure domain.",
        ...runtimeDiagnosticMatches.map(
          (term) => `Matched runtime diagnostic term: ${term}`
        )
      ],
      scores
    );
  }

  const explicitMultiDomain = findMatches(normalizedInput, MULTI_DOMAIN_TERMS);
  const iprMatches = findMatches(normalizedInput, IPR_OPERATIONAL_TERMS);
  const proofLayerMatches = findMatches(normalizedInput, HBCE_PROOF_LAYER_TERMS);
  const strategicAutonomyMatches =
    findEuropeanStrategicAutonomyMatches(normalizedInput);
  const aiGovernanceMatches = findMatches(normalizedInput, AI_GOVERNANCE_TERMS);

  const domainScores = PRIMARY_DOMAINS.map((domain) =>
    scoreDomain(normalizedInput, domain, DOMAIN_KEYWORDS[domain])
  );

  if (iprMatches.length > 0) {
    boostScore(domainScores, "MATRIX", 8 + iprMatches.length);
  }

  if (proofLayerMatches.length > 0) {
    boostScore(domainScores, "MATRIX", 5 + proofLayerMatches.length);
  }

  if (strategicAutonomyMatches.length >= 2) {
    boostScore(domainScores, "MATRIX", 14 + strategicAutonomyMatches.length);
  }

  if (aiGovernanceMatches.length >= 2) {
    boostScore(
      domainScores,
      "HBCE_ECOSISTEMA_AI",
      12 + aiGovernanceMatches.length
    );
  }

  const matchedDomains = domainScores
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoreMap = toScoreMap(domainScores);

  if (explicitMultiDomain.length > 0) {
    return createClassification(
      "MULTI_DOMAIN",
      getDefaultActiveDomains(),
      calculateMultiDomainConfidence(matchedDomains, explicitMultiDomain.length),
      [
        "Input matched explicit ecosystem-level or multi-domain language.",
        ...explicitMultiDomain.map((term) => `Matched multi-domain term: ${term}`),
        ...formatIprAndProofReasons(iprMatches, proofLayerMatches),
        ...formatAiGovernanceReasons(aiGovernanceMatches),
        ...collectReasons(matchedDomains)
      ],
      scoreMap
    );
  }

  if (
    aiGovernanceMatches.length >= 2 &&
    !hasUseSignal(normalizedInput) &&
    !hasCorpusSignal(normalizedInput) &&
    !hasApokalypsisSignal(normalizedInput)
  ) {
    return createClassification(
      "HBCE_ECOSISTEMA_AI",
      ["HBCE_ECOSISTEMA_AI"],
      0.95,
      [
        "AI governance, model governance or AI audit language detected.",
        "Such requests belong to the HBCE ECOSISTEMA AI project collection.",
        ...formatAiGovernanceReasons(aiGovernanceMatches),
        ...formatIprAndProofReasons(iprMatches, proofLayerMatches)
      ],
      scoreMap
    );
  }

  if (strategicAutonomyMatches.length >= 2 && !hasUseSignal(normalizedInput)) {
    return createClassification(
      "MATRIX",
      ["MATRIX"],
      0.95,
      [
        "European strategic autonomy or technological dependency reduction language detected.",
        "Such requests belong to the MATRIX operational infrastructure and governance domain.",
        ...strategicAutonomyMatches.map(
          (term) => `Matched strategic-autonomy term: ${term}`
        ),
        ...formatIprAndProofReasons(iprMatches, proofLayerMatches)
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
          ...formatIprAndProofReasons(iprMatches, proofLayerMatches),
          ...formatAiGovernanceReasons(aiGovernanceMatches),
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
    [
      ...(best.reasons.length > 0
        ? best.reasons
        : [`Classified as ${best.domain} by highest project-domain score.`]),
      ...formatIprAndProofReasons(iprMatches, proofLayerMatches),
      ...formatAiGovernanceReasons(aiGovernanceMatches)
    ],
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

  const matchedUseFile = USE_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedUseFile) {
    scoreMap["U.S.E."] = 10;

    return createClassification(
      "U.S.E.",
      ["U.S.E."],
      0.94,
      [
        `U.S.E. documentation file detected: ${matchedUseFile}`,
        "File path maps to the MATRIX-derived political-institutional application domain."
      ],
      scoreMap
    );
  }

  const matchedHbceAiFile = HBCE_ECOSISTEMA_AI_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedHbceAiFile) {
    scoreMap.HBCE_ECOSISTEMA_AI = 12;

    return createClassification(
      "HBCE_ECOSISTEMA_AI",
      ["HBCE_ECOSISTEMA_AI"],
      0.95,
      [
        `HBCE ECOSISTEMA AI documentation file detected: ${matchedHbceAiFile}`,
        "File path maps to the AI governance ecosystem project collection."
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
        `MATRIX or IPR documentation file detected: ${matchedMatrixFile}`,
        "File path maps to the operational infrastructure and IPR runtime domain."
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

  const matchedMultiFile = REPOSITORY_MULTI_DOMAIN_FILES.find((file) =>
    normalizedInput.includes(file)
  );

  if (matchedMultiFile) {
    return createClassification(
      "MULTI_DOMAIN",
      getDefaultActiveDomains(),
      0.94,
      [
        `Repository-level governance file detected: ${matchedMultiFile}`,
        "Repository-level governance files affect the full AI JOKER-C2 ecosystem."
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

function boostScore(
  scores: DomainScore[],
  domain: PrimaryProjectDomain,
  amount: number
): void {
  const target = scores.find((score) => score.domain === domain);

  if (!target) {
    return;
  }

  target.score += amount;
}

function isExplicitDomainName(
  domain: PrimaryProjectDomain,
  keyword: string
): boolean {
  if (domain === "MATRIX") {
    return keyword === "matrix" || keyword.startsWith("matrix ");
  }

  if (domain === "U.S.E.") {
    return (
      keyword === "u.s.e." ||
      keyword === "u.s.e" ||
      keyword === "united states of europe" ||
      keyword === "stati uniti d europa"
    );
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

  if (domain === "HBCE_ECOSISTEMA_AI") {
    return (
      keyword === "hbce ecosistema ai" ||
      keyword === "ecosistema ai" ||
      keyword === "hbce ai" ||
      keyword === "ai governance ecosystem"
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

  if (secondScore >= 5) {
    return true;
  }

  return secondScore / topScore >= 0.45;
}

function hasUseSignal(text: string): boolean {
  return findMatches(text, DOMAIN_KEYWORDS["U.S.E."]).length > 0;
}

function hasCorpusSignal(text: string): boolean {
  return findMatches(text, DOMAIN_KEYWORDS.CORPUS_ESOTEROLOGIA_ERMETICA).length > 0;
}

function hasApokalypsisSignal(text: string): boolean {
  return findMatches(text, DOMAIN_KEYWORDS.APOKALYPSIS).length > 0;
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

function findEuropeanStrategicAutonomyMatches(text: string): string[] {
  return findMatches(text, EUROPEAN_STRATEGIC_AUTONOMY_TERMS);
}

function createClassification(
  projectDomain: ProjectDomain,
  activeDomains: ProjectDomain[],
  confidence: number,
  reasons: string[],
  scores: Partial<Record<PrimaryProjectDomain, number>>
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
      return getDefaultActiveDomains();
    }

    return uniqueDomains(primaryActiveDomains);
  }

  if (projectDomain === "GENERAL") {
    return ["GENERAL"];
  }

  return [projectDomain];
}

function getDefaultActiveDomains(): ProjectDomain[] {
  return [
    "MATRIX",
    "U.S.E.",
    "CORPUS_ESOTEROLOGIA_ERMETICA",
    "APOKALYPSIS",
    "HBCE_ECOSISTEMA_AI"
  ];
}

function calculateConfidence(score: number, text: string): number {
  const scoreFactor = Math.min(score / 20, 1);
  const lengthFactor = Math.min(text.length / 900, 1);
  const confidence = 0.42 + scoreFactor * 0.45 + lengthFactor * 0.13;

  return clampConfidence(confidence);
}

function calculateMultiDomainConfidence(
  matchedDomains: DomainScore[],
  explicitMultiDomainMatches: number
): number {
  const matchedDomainFactor = Math.min(matchedDomains.length / 5, 1);
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

function formatIprAndProofReasons(
  iprMatches: string[],
  proofLayerMatches: string[]
): string[] {
  const reasons: string[] = [];

  if (iprMatches.length > 0) {
    reasons.push(
      "IPR operational identity or proof-instrument language detected; routed through the MATRIX/HBCE operational infrastructure layer."
    );
    reasons.push(...iprMatches.map((term) => `Matched IPR term: ${term}`));
  }

  if (proofLayerMatches.length > 0) {
    reasons.push(
      "EVT, memory, OPC or proof-layer language detected; routed through the MATRIX/HBCE operational infrastructure layer."
    );
    reasons.push(
      ...proofLayerMatches.map((term) => `Matched proof-layer term: ${term}`)
    );
  }

  return reasons;
}

function formatAiGovernanceReasons(aiGovernanceMatches: string[]): string[] {
  const reasons: string[] = [];

  if (aiGovernanceMatches.length > 0) {
    reasons.push(
      "AI governance or model governance language detected; routed through HBCE ECOSISTEMA AI when no stronger collection boundary prevails."
    );
    reasons.push(
      ...aiGovernanceMatches.map((term) => `Matched AI governance term: ${term}`)
    );
  }

  return reasons;
}

function createEmptyScores(): Partial<Record<PrimaryProjectDomain, number>> {
  return {
    MATRIX: 0,
    "U.S.E.": 0,
    CORPUS_ESOTEROLOGIA_ERMETICA: 0,
    APOKALYPSIS: 0,
    HBCE_ECOSISTEMA_AI: 0
  };
}

function toScoreMap(
  scores: DomainScore[]
): Partial<Record<PrimaryProjectDomain, number>> {
  return scores.reduce<Partial<Record<PrimaryProjectDomain, number>>>(
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

export { DOMAIN_METADATA, PROJECT_DOMAINS, PRIMARY_DOMAINS };
