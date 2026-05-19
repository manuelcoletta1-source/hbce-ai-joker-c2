export type JokerResponseContractKind =
  | "IPR"
  | "EVT"
  | "OPC"
  | "IPR_EVT_OPC"
  | "JOKER_IDENTITY"
  | "ECONOMIC_GOVERNANCE"
  | "CIVIC_DIGITAL"
  | "USE_ACRONYM"
  | "USE_POLITICAL_VALUE"
  | "HBCE_MODULES"
  | "HBCE_ECOSISTEMA_AI"
  | "STRATEGIC_DOCTRINE"
  | "GENERAL";

export type ResponseContract = {
  kind: JokerResponseContractKind;
  matched: boolean;
  title: string;
  mandatoryOpening: string[];
  mandatoryConcepts: string[];
  forbiddenReductions: string[];
  requiredDistinctions: string[];
  closingFormula?: string;
};

type StrategicDoctrineKey =
  | "HBCE_CYBERSECURITY_STRATEGY"
  | "HBCE_DATA_PROTECTION_STRATEGY"
  | "HBCE_INFORMATION_GOVERNANCE_STRATEGY";

type StrategicDoctrineRecord = {
  key: StrategicDoctrineKey;
  number: 1 | 2 | 3;
  title: string;
  file: string;
  function: string;
  connectedModules: string[];
  connectedCollections: string[];
  boundary: string;
  summary: string;
};

const STRATEGIC_DOCTRINES: StrategicDoctrineRecord[] = [
  {
    key: "HBCE_CYBERSECURITY_STRATEGY",
    number: 1,
    title: "HBCE Cybersecurity Strategy",
    file: "docs/HBCE_CYBERSECURITY_STRATEGY.md",
    function:
      "Definisce la postura difensiva cyber, la resilienza, la documentazione incidenti, la continuità delle infrastrutture critiche e la governance AI/cyber di AI JOKER-C2.",
    connectedModules: [
      "CyberGlobal",
      "MATRIX",
      "OPC",
      "UNEBDO",
      "IOspace",
      "MetaExchange",
      "NeuroLoop"
    ],
    connectedCollections: ["MATRIX", "HBCE_ECOSISTEMA_AI"],
    boundary:
      "Defensive cybersecurity is allowed. Offensive cyber capability is prohibited.",
    summary:
      "È il documento dottrinale che rafforza CyberGlobal e la postura difensiva del sistema. Serve a impedire che HBCE venga letto come cyber-offensivo: il suo perimetro è difesa, resilienza, audit, incident documentation, fail-closed e continuità operativa."
  },
  {
    key: "HBCE_DATA_PROTECTION_STRATEGY",
    number: 2,
    title: "HBCE Data Protection Strategy",
    file: "docs/HBCE_DATA_PROTECTION_STRATEGY.md",
    function:
      "Definisce minimizzazione, classificazione dati, privacy, retention, controllo accessi, redazione, esposizione pubblica sicura e auditabilità.",
    connectedModules: [
      "IPR",
      "EVT",
      "Memory",
      "OPC",
      "IOspace",
      "MetaExchange",
      "MATRIX"
    ],
    connectedCollections: ["MATRIX", "U.S.E.", "HBCE_ECOSISTEMA_AI"],
    boundary:
      "Necessary data is allowed. Minimization is required. Unnecessary accumulation, secret exposure and identity-choice linkage are prohibited.",
    summary:
      "È il documento dottrinale che impedisce ad HBCE di accumulare dati inutilmente. Stabilisce che i dati devono essere identificati, classificati, minimizzati, protetti, tracciati e resi auditabili solo quando necessario."
  },
  {
    key: "HBCE_INFORMATION_GOVERNANCE_STRATEGY",
    number: 3,
    title: "HBCE Information Governance Strategy",
    file: "docs/HBCE_INFORMATION_GOVERNANCE_STRATEGY.md",
    function:
      "Definisce classificazione delle informazioni, circolazione controllata, proof continuity, metadata pubblici e interni, auditabilità e responsabilità informativa.",
    connectedModules: [
      "MATRIX",
      "MetaExchange",
      "IOspace",
      "NeuroLoop",
      "OPC",
      "IPR",
      "EVT",
      "Memory"
    ],
    connectedCollections: [
      "MATRIX",
      "U.S.E.",
      "CORPUS_ESOTEROLOGIA_ERMETICA",
      "APOKALYPSIS",
      "HBCE_ECOSISTEMA_AI"
    ],
    boundary:
      "Information may circulate only under identity, context, classification, policy, trace and responsibility.",
    summary:
      "È il documento dottrinale che governa il modo in cui le informazioni circolano dentro HBCE. Serve a evitare scambio incontrollato, esposizione impropria, perdita di contesto, confusione tra metadata pubblici e audit interni."
  }
];

function normalizeForContract(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_+=-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(normalizeForContract(term)));
}

function isIprQuestion(text: string): boolean {
  return containsAny(text, [
    "ipr",
    "identity primary record",
    "identita operativa",
    "registro primario",
    "registro primario di identita"
  ]);
}

function isEvtQuestion(text: string): boolean {
  return containsAny(text, [
    "evt",
    "event record",
    "event trace",
    "verifiable event trace",
    "traccia verificabile",
    "evento verificabile",
    "eventi verificabili"
  ]);
}

function isOpcQuestion(text: string): boolean {
  return containsAny(text, [
    "opc",
    "operational proof",
    "operational proof and compliance",
    "operational proof of continuity",
    "proof of continuity",
    "prova di continuita",
    "continuita operativa",
    "proof record",
    "proof receipt",
    "ricevuta di prova"
  ]);
}

function isDifferenceQuestion(text: string): boolean {
  return containsAny(text, [
    "differenza",
    "differenze",
    "distingui",
    "distinzione",
    "confronto",
    "paragone",
    "rapporto",
    "tra ipr evt opc",
    "ipr evt opc",
    "ipr, evt e opc",
    "ipr evt e opc",
    "ipr, evt, opc"
  ]);
}

function isFormulaQuestion(text: string): boolean {
  return containsAny(text, [
    "formula",
    "formula operativa",
    "in una riga",
    "una riga",
    "sintesi",
    "sintetica",
    "nocciolo",
    "frase nocciolo"
  ]);
}

function isJokerIdentityQuestion(text: string): boolean {
  return (
    containsAny(text, [
      "cosa sei",
      "chi sei",
      "dentro hbce",
      "ai joker-c2",
      "joker-c2",
      "runtime",
      "che ruolo hai",
      "ruolo hai",
      "tu cosa sei",
      "tu chi sei"
    ]) &&
    containsAny(text, ["joker", "ai joker", "joker-c2", "hbce", "runtime"])
  );
}

function isEconomicGovernanceQuestion(text: string): boolean {
  return (
    containsAny(text, [
      "ipr",
      "hbce",
      "evt",
      "matrix",
      "joker-c2",
      "governance",
      "audit"
    ]) &&
    containsAny(text, [
      "aziende",
      "governi",
      "cittadini",
      "imprese",
      "mercato",
      "economia",
      "economico",
      "economica",
      "lavoro",
      "impiego",
      "occupazione",
      "filiera",
      "b2b",
      "b2g",
      "pa",
      "pubblica amministrazione",
      "istituzioni"
    ])
  );
}

function isUseAcronymQuestion(text: string): boolean {
  const hasUseTerm = containsAny(text, [
    "u.s.e.",
    "u.s.e",
    "u s e",
    "united states of europe",
    "stati uniti d europa"
  ]);

  if (!hasUseTerm) {
    return false;
  }

  return containsAny(text, [
    "acronimo",
    "sigla",
    "cosa significa",
    "cosa vuol dire",
    "cosa vuole dire",
    "che significa",
    "significato",
    "vuol dire",
    "vuole dire",
    "stands for",
    "meaning",
    "what does"
  ]);
}

function isUsePoliticalValueQuestion(text: string): boolean {
  const hasPoliticalValueTerms = containsAny(text, [
    "valore politico",
    "valore politicamente",
    "politicamente",
    "politicamete",
    "valore istituzionale",
    "valore strategico",
    "valore democratico",
    "standardizzata",
    "standardizata",
    "standardizzato",
    "standardizato",
    "standardizzazione",
    "standardization",
    "in linea europea",
    "linea europea",
    "standard europeo",
    "standard ue",
    "governance europea",
    "se adottata in europa",
    "adottata in europa",
    "applicazione in europa"
  ]);

  const hasProjectReference = containsAny(text, [
    "u.s.e.",
    "u.s.e",
    "u s e",
    "united states of europe",
    "stati uniti d europa",
    "matrix",
    "hbce",
    "ipr",
    "voto digitale federato",
    "voto federato",
    "questo progetto",
    "progetto applicazione",
    "questa applicazione",
    "applicazione",
    "federazione europea",
    "sovranita digitale",
    "europa",
    "europea",
    "europeo",
    "ue"
  ]);

  return hasPoliticalValueTerms && hasProjectReference;
}

function isCivicDigitalQuestion(text: string): boolean {
  return (
    containsAny(text, [
      "voto digitale",
      "e-voting",
      "evoting",
      "voto online",
      "votare online",
      "elezioni digitali",
      "referendum digitale",
      "partecipazione civica",
      "consultazione pubblica",
      "consultazioni pubbliche",
      "democrazia digitale",
      "voto digitale federato",
      "voto federato",
      "voto federale",
      "federated digital vote",
      "federated digital voting",
      "federated vote",
      "federated voting"
    ]) ||
    (containsAny(text, ["voto", "votare"]) &&
      containsAny(text, ["identita", "ipr", "digitale", "federato"]))
  );
}

function isHbceModulesQuestion(text: string): boolean {
  const hasExplicitModuleTerm = containsAny(text, [
    "moduli hbce",
    "moduli dell hbce",
    "sette moduli",
    "7 moduli",
    "seven modules",
    "seven hbce modules",
    "hbce modules",
    "hbce module",
    "stack hbce",
    "hbce stack",
    "moduli dello stack",
    "stack tecnico operativo",
    "stack tecnico-operativo",
    "unebdo",
    "metaexchange",
    "meta exchange",
    "iospace",
    "io space",
    "cyberglobal",
    "cyber global",
    "neuroloop",
    "neuro loop",
    "modulo matrix",
    "matrix module",
    "matrix organizza",
    "matrix organizes"
  ]);

  const hasGenericModuleQuestion =
    containsAny(text, ["moduli", "modulo", "quali moduli", "che moduli"]) &&
    containsAny(text, [
      "hbce",
      "joker-c2",
      "joker c2",
      "matrix",
      "voto federato",
      "voto digitale federato",
      "federated vote",
      "federated voting",
      "governance"
    ]);

  if (!hasExplicitModuleTerm && !hasGenericModuleQuestion) {
    return false;
  }

  return containsAny(text, [
    "spiegami",
    "cosa sono",
    "a cosa servono",
    "funzione",
    "funzioni",
    "ruolo",
    "ruoli",
    "novita",
    "moduli",
    "stack",
    "operativo",
    "casi d uso",
    "casi duso",
    "caso d uso",
    "uso reale",
    "usi reali",
    "reali",
    "pragmatico",
    "pragmatici",
    "vantaggi",
    "vantaggio",
    "stato dell arte",
    "ai classiche",
    "anthropic",
    "gpt",
    "grok",
    "technical modules",
    "operational modules",
    "what are",
    "what is",
    "explain",
    "function",
    "role",
    "use case",
    "use cases",
    "real use",
    "practical"
  ]);
}

function isHbceEcosistemaAiQuestion(text: string): boolean {
  const hasHbceAiTerm = containsAny(text, [
    "hbce ecosistema ai",
    "ecosistema ai",
    "ecosistema dell ai",
    "hbce ai",
    "ai governance ecosystem",
    "governance dell ai",
    "governo dell ai",
    "governare l ai",
    "intelligenza artificiale governata",
    "ai governata",
    "governed ai",
    "ai non governata",
    "ai audit",
    "audit ai",
    "ipr ai audit trail",
    "model governance",
    "governance modelli",
    "modelli ai esterni",
    "openai",
    "anthropic",
    "claude",
    "google ai",
    "gemini",
    "meta ai",
    "llama",
    "mistral",
    "matrix ai governance",
    "runtime ai governato",
    "runtime governato ai"
  ]);

  const hasQuestionOrProjectTerm = containsAny(text, [
    "collana",
    "volume",
    "volumi",
    "spiegami",
    "cosa e",
    "cosa sono",
    "funzione",
    "ruolo",
    "governance",
    "audit",
    "ai",
    "modelli",
    "runtime",
    "hbce"
  ]);

  return hasHbceAiTerm && hasQuestionOrProjectTerm;
}

function isStrategicDoctrineQuestion(text: string): boolean {
  return containsAny(text, [
    "documenti dottrinali strategici",
    "documenti dottrinali",
    "dottrina strategica",
    "dottrinali strategici",
    "strategic doctrine",
    "strategic doctrines",
    "cybersecurity strategy",
    "data protection strategy",
    "information governance strategy",
    "hbce cybersecurity strategy",
    "hbce data protection strategy",
    "hbce information governance strategy",
    "documenti strategici",
    "tre documenti",
    "3 documenti",
    "numero 1",
    "numero uno",
    "il numero 1",
    "il primo",
    "primo documento",
    "specifiche del 1",
    "specifiche de numero 1",
    "specifiche del numero 1",
    "mostrami il 1",
    "mostrami le specifiche de numero 1",
    "numero 2",
    "numero due",
    "il secondo",
    "secondo documento",
    "numero 3",
    "numero tre",
    "il terzo",
    "terzo documento",
    "mostrami documenti"
  ]);
}

function getStrategicDoctrineByMessage(text: string): StrategicDoctrineRecord | null {
  if (
    containsAny(text, [
      "numero 1",
      "numero uno",
      "il numero 1",
      "il primo",
      "primo documento",
      "specifiche del 1",
      "specifiche de numero 1",
      "specifiche del numero 1",
      "mostrami il 1",
      "cybersecurity strategy",
      "hbce cybersecurity strategy",
      "cyber security strategy"
    ])
  ) {
    return STRATEGIC_DOCTRINES[0];
  }

  if (
    containsAny(text, [
      "numero 2",
      "numero due",
      "il numero 2",
      "il secondo",
      "secondo documento",
      "specifiche del 2",
      "specifiche del numero 2",
      "mostrami il 2",
      "data protection strategy",
      "hbce data protection strategy"
    ])
  ) {
    return STRATEGIC_DOCTRINES[1];
  }

  if (
    containsAny(text, [
      "numero 3",
      "numero tre",
      "il numero 3",
      "il terzo",
      "terzo documento",
      "specifiche del 3",
      "specifiche del numero 3",
      "mostrami il 3",
      "information governance strategy",
      "hbce information governance strategy"
    ])
  ) {
    return STRATEGIC_DOCTRINES[2];
  }

  return null;
}

function buildStrategicDoctrineListResponse(): string {
  return [
    "I tre documenti dottrinali strategici di HBCE sono:",
    "",
    "1. **HBCE Cybersecurity Strategy**",
    "Definisce la postura difensiva cyber del sistema: resilienza, gestione incidenti, continuità infrastrutturale, CyberGlobal, MATRIX, OPC e UNEBDO. Il suo confine è netto: difesa sì, capacità offensiva no.",
    "",
    "2. **HBCE Data Protection Strategy**",
    "Definisce minimizzazione, classificazione dati, privacy, access control, retention, redazione, hash/reference e auditabilità. Il suo confine è: dati necessari sì, accumulo inutile e collegamento identità-scelta democratica no.",
    "",
    "3. **HBCE Information Governance Strategy**",
    "Definisce classificazione delle informazioni, circolazione controllata, proof continuity, metadata pubblici/interni, MetaExchange, IOspace, NeuroLoop, OPC e responsabilità informativa.",
    "",
    "Formula dottrinale: Cybersecurity Strategy protegge; Data Protection Strategy minimizza; Information Governance Strategy classifica e controlla la circolazione."
  ].join("\n");
}

function buildStrategicDoctrineDetailResponse(record: StrategicDoctrineRecord): string {
  return [
    `${record.number}. **${record.title}**`,
    "",
    `**File:** \`${record.file}\``,
    "",
    `**Funzione:** ${record.function}`,
    "",
    `**Moduli collegati:** ${record.connectedModules.join(", ")}.`,
    "",
    `**Collane collegate:** ${record.connectedCollections.join(", ")}.`,
    "",
    `**Boundary:** ${record.boundary}`,
    "",
    `**Sintesi operativa:** ${record.summary}`,
    "",
    "Questo documento è dottrinale: orienta difesa, governance, audit e implementazione, ma non costituisce certificazione legale, regolatoria o adozione istituzionale automatica."
  ].join("\n");
}

function buildStrategicDoctrineResponse(message: string): string | null {
  const text = normalizeForContract(message);

  if (!isStrategicDoctrineQuestion(text)) {
    return null;
  }

  const record = getStrategicDoctrineByMessage(text);

  if (record) {
    return buildStrategicDoctrineDetailResponse(record);
  }

  return buildStrategicDoctrineListResponse();
}

function buildContract(kind: JokerResponseContractKind): ResponseContract {
  switch (kind) {
    case "STRATEGIC_DOCTRINE":
      return {
        kind,
        matched: true,
        title: "Contratto risposta documenti dottrinali strategici",
        mandatoryOpening: [
          "I tre documenti dottrinali strategici di HBCE sono HBCE Cybersecurity Strategy, HBCE Data Protection Strategy e HBCE Information Governance Strategy."
        ],
        mandatoryConcepts: [
          "I documenti dottrinali strategici non sono collane.",
          "I documenti dottrinali strategici non sono moduli HBCE.",
          "I documenti dottrinali strategici non sono certificazioni legali automatiche.",
          "HBCE Cybersecurity Strategy protegge e definisce la postura cyber difensiva.",
          "HBCE Data Protection Strategy minimizza, classifica e protegge i dati.",
          "HBCE Information Governance Strategy classifica e governa la circolazione delle informazioni."
        ],
        forbiddenReductions: [
          "Non presentarli come moduli HBCE.",
          "Non presentarli come collane progettuali.",
          "Non presentarli come certificazioni regolatorie già ottenute.",
          "Non dire che sostituiscono review legale, cyber, privacy o istituzionale."
        ],
        requiredDistinctions: [
          "Distingui collane, moduli e documenti dottrinali.",
          "Distingui orientamento strategico da certificazione.",
          "Distingui cybersecurity, data protection e information governance."
        ],
        closingFormula:
          "Formula dottrinale: Cybersecurity Strategy protegge; Data Protection Strategy minimizza; Information Governance Strategy classifica e controlla la circolazione."
      };

    case "HBCE_MODULES":
      return {
        kind,
        matched: true,
        title: "Contratto risposta moduli HBCE",
        mandatoryOpening: [
          "I moduli HBCE sono sette funzioni tecnico-operative dello stack MATRIX/HBCE: non sostituiscono IPR, ma lo estendono in ancoraggio, prova, scambio, visibilità, cybersecurity difensiva, validazione e coordinamento sistemico."
        ],
        mandatoryConcepts: [
          "IPR resta il prodotto operativo base: identifica soggetti, processi, agenti AI, documenti o sistemi con responsabilità e continuità verificabile.",
          "AI JOKER-C2 è il runtime che mostra IPR e i moduli in funzione.",
          "UNEBDO = ancoraggio, validazione e continuità probatoria. Non registra l’IPR: rafforza la stabilità della prova nel tempo.",
          "EVT = traccia evento. Registra richiesta, decisione, azione, documento, blocco, escalation o audit.",
          "Memory = continuità EVT/IPR-bound. Mantiene continuità tra sessioni, documenti, moduli e decisioni senza ridursi a cronologia chat.",
          "OPC = Operational Proof & Compliance Layer, cioè proof receipt tecnica collegata a input, output, decisione, EVT, memory hash, policy, rischio e audit.",
          "MetaExchange = scambio strutturato tra identità, prove, eventi, documenti e contesti tra sistemi, imprese, PA o nodi federati.",
          "IOspace = spazio operativo di visibilità, dashboard e interazione runtime: mostra IPR, EVT, Memory, OPC, audit, rischio, decisione e continuità.",
          "CyberGlobal = cybersecurity difensiva, resilienza, rischio e protezione sistemica. Non è un modulo offensivo.",
          "NeuroLoop = validazione, feedback, revisione e ciclo decisionale controllato. Non è apprendimento autonomo né autorità autonoma.",
          "MATRIX = settimo modulo HBCE: organizza e coordina identità, eventi, memoria, proof receipt, moduli, domini progettuali e runtime in una architettura coerente.",
          "Le AI classiche producono output; AI JOKER-C2 produce output più identità operativa, evento, memoria, proof receipt e audit trail."
        ],
        forbiddenReductions: [
          "Non presentare i moduli HBCE come nuove collane.",
          "Non presentare i moduli HBCE come prodotti principali al posto di IPR.",
          "Non attribuire a UNEBDO la funzione di registrazione dell’IPR.",
          "Non presentare CyberGlobal come capacità offensiva.",
          "Non presentare NeuroLoop come autorità autonoma o apprendimento incontrollato.",
          "Non presentare MetaExchange come scambio dati permissionless.",
          "Non presentare MATRIX come autorità autonoma: MATRIX organizza, non sostituisce policy, rischio, supervisione umana o responsabilità.",
          "Non presentare OPC come certificazione legale automatica.",
          "Non presentare UNEBDO, EVT o IPR come certificazione legale automatica."
        ],
        requiredDistinctions: [
          "Distingui prodotto da modulo: IPR è il prodotto operativo base, i moduli sono funzioni dello stack.",
          "Distingui collane da moduli: MATRIX, U.S.E., CORPUS, APOKALYPSIS e HBCE ECOSISTEMA AI sono domini/collane; UNEBDO, OPC, MetaExchange, IOspace, CyberGlobal, NeuroLoop e MATRIX sono moduli tecnico-operativi.",
          "Distingui la doppia funzione di MATRIX: come collana è architettura strategica; come modulo è coordinamento tecnico-operativo.",
          "Distingui proof receipt tecnica da certificazione legale.",
          "Distingui cybersecurity difensiva da capacità offensiva.",
          "Distingui validazione e feedback da autorità autonoma.",
          "Distingui AI classica che produce output da AI JOKER-C2 che produce output governato, tracciato, memorizzato e provabile."
        ],
        closingFormula:
          "Formula moduli: IPR identifica; UNEBDO ancora; EVT traccia; Memory continua; OPC prova; MetaExchange scambia; IOspace espone; CyberGlobal protegge; NeuroLoop valida; MATRIX organizza; AI JOKER-C2 esegue."
      };

    case "HBCE_ECOSISTEMA_AI":
      return {
        kind,
        matched: true,
        title: "Contratto risposta HBCE ECOSISTEMA AI",
        mandatoryOpening: [
          "HBCE ECOSISTEMA AI è la quinta collana progettuale: serve a spiegare come l’intelligenza artificiale viene governata dentro processi identificabili, tracciabili, verificabili, auditabili e responsabili."
        ],
        mandatoryConcepts: [
          "Il problema non è soltanto avere AI più potenti: il problema è governarle.",
          "HBCE governa il processo AI tramite IPR, EVT, Memory, OPC, policy, rischio, supervisione umana e runtime fail-closed.",
          "IPR identifica soggetti, operatori, agenti AI, processi e responsabilità operative.",
          "EVT traccia gli eventi AI.",
          "Memory preserva continuità runtime legata a EVT/IPR.",
          "OPC produce proof receipt tecniche per audit e verifica.",
          "MATRIX organizza l’architettura e coordina il sistema.",
          "AI JOKER-C2 esegue come runtime dimostrativo governato.",
          "La collana è composta da cinque volumi: HBCE ECOSISTEMA AI; IPR — Identità Operativa dell’AI; EVT / OPC — Traccia e Prova dell’AI; MATRIX AI GOVERNANCE; AI JOKER-C2.",
          "I modelli esterni, come OpenAI, Anthropic, Google, Meta o Mistral, possono generare output; HBCE resta il livello di governo dell’uso del modello."
        ],
        forbiddenReductions: [
          "Non ridurre HBCE ECOSISTEMA AI a semplice uso di chatbot.",
          "Non presentare i modelli AI esterni come autorità di governance del sistema HBCE.",
          "Non confondere la collana HBCE ECOSISTEMA AI con i moduli tecnico-operativi HBCE.",
          "Non presentare HBCE come certificazione regolatoria già ottenuta.",
          "Non eliminare il ruolo di IPR, EVT, OPC, MATRIX e AI JOKER-C2 nella spiegazione."
        ],
        requiredDistinctions: [
          "Distingui modello AI da governance del modello.",
          "Distingui output AI da processo AI verificabile.",
          "Distingui HBCE ECOSISTEMA AI come collana progettuale dai sette moduli HBCE.",
          "Distingui MATRIX come architettura/collana da MATRIX come modulo di coordinamento.",
          "Distingui proof receipt tecnica da certificazione legale o regolatoria."
        ],
        closingFormula:
          "Formula HBCE ECOSISTEMA AI: AI genera; HBCE governa; IPR identifica; EVT traccia; OPC prova; MATRIX organizza; AI JOKER-C2 esegue."
      };

    case "USE_ACRONYM":
      return {
        kind,
        matched: true,
        title: "Contratto risposta U.S.E.",
        mandatoryOpening: [
          "U.S.E. significa United States of Europe — Stati Uniti d’Europa."
        ],
        mandatoryConcepts: [
          "U.S.E. è una collana e un dominio applicativo politico-istituzionale derivato da MATRIX.",
          "U.S.E. usa MATRIX per progettare una federazione europea operativa, digitale, sovrana e verificabile.",
          "Nel progetto HBCE, U.S.E. collega sovranità digitale, identità operativa europea, audit pubblico, continuità istituzionale e partecipazione civica.",
          "Il voto digitale federato, dentro U.S.E., deve rispettare la regola: identità verificata prima, scelta separata dopo, voto anonimizzato, processo auditabile."
        ],
        forbiddenReductions: [
          "Non presentare U.S.E. come semplice slogan politico.",
          "Non ridurre U.S.E. a un partito, a un movimento elettorale o a una campagna di propaganda.",
          "Non dire che U.S.E. è già un progetto istituzionalmente adottato se non è dimostrato."
        ],
        requiredDistinctions: [
          "Distingui U.S.E. da MATRIX: MATRIX è l’architettura, U.S.E. è l’applicazione politico-istituzionale europea.",
          "Distingui federazione operativa da semplice unione simbolica.",
          "Distingui identità operativa da contenuto del voto."
        ],
        closingFormula:
          "Formula nocciolo: U.S.E. = United States of Europe, applicazione MATRIX per una federazione europea operativa, digitale, sovrana e verificabile."
      };

    case "USE_POLITICAL_VALUE":
      return {
        kind,
        matched: true,
        title: "Contratto risposta valore politico U.S.E./MATRIX",
        mandatoryOpening: [
          "Se U.S.E. venisse standardizzato in linea europea, il suo valore politico sarebbe trasformare MATRIX in una infrastruttura federata di governance democratica, identità operativa, partecipazione civica e sovranità digitale europea."
        ],
        mandatoryConcepts: [
          "U.S.E. significa United States of Europe — Stati Uniti d’Europa.",
          "MATRIX è l’architettura operativa; U.S.E. è l’applicazione politico-istituzionale europea.",
          "IPR fornisce identità operativa e diritto di partecipazione senza collegare identità personale e contenuto della scelta.",
          "Il voto digitale federato non va inteso solo come voto per partiti o rappresentanti, ma come infrastruttura di consultazione, referendum e partecipazione legislativa verificabile.",
          "Il valore politico principale è la sovranità digitale europea.",
          "Il secondo valore politico è la continuità istituzionale verificabile tra livelli regionale, nazionale ed europeo.",
          "Il terzo valore politico è l’audit pubblico del processo democratico.",
          "Il quarto valore politico è ridurre la dipendenza europea da infrastrutture digitali non governate dall’Europa."
        ],
        forbiddenReductions: [
          "Non trasformare U.S.E. in propaganda partitica.",
          "Non presentare U.S.E. come già adottato ufficialmente dall’Unione Europea se non è dimostrato.",
          "Non ridurre il voto digitale federato a semplice elezione online.",
          "Non collegare identità personale e contenuto del voto."
        ],
        requiredDistinctions: [
          "Distingui valore politico da riconoscimento istituzionale già ottenuto.",
          "Distingui standardizzazione possibile da standard ufficiale già adottato.",
          "Distingui audit del processo da tracciamento della scelta individuale.",
          "Distingui identità operativa europea da sorveglianza politica."
        ],
        closingFormula:
          "Formula nocciolo: U.S.E. standardizzata in linea europea avrebbe valore politico perché trasformerebbe sovranità digitale, identità operativa, partecipazione civica e audit democratico in infrastruttura federata verificabile."
      };

    case "IPR_EVT_OPC":
      return {
        kind,
        matched: true,
        title: "Contratto risposta IPR/EVT/OPC",
        mandatoryOpening: [
          "IPR identifica.",
          "EVT traccia.",
          "OPC prova la continuità.",
          "HBCE governa.",
          "MATRIX organizza.",
          "AI JOKER-C2 esegue come runtime governato."
        ],
        mandatoryConcepts: [
          "IPR = Identity Primary Record.",
          "EVT = Event Record / Verifiable Event Trace.",
          "OPC = Operational Proof & Compliance Layer.",
          "IPR collega identità, origine, responsabilità, eventi, prove e continuità.",
          "EVT registra evento, tempo, contesto, decisione, rischio, hash e verifica.",
          "OPC collega evento, memoria, decisione e audit in una prova tecnica di continuità."
        ],
        forbiddenReductions: [
          "Non ridurre IPR a login, account, wallet o semplice identità digitale.",
          "Non ridurre EVT a memoria psicologica o cronologia chat.",
          "Non ridurre OPC a etichetta grafica o semplice codice proof."
        ],
        requiredDistinctions: [
          "Distingui identità da evento.",
          "Distingui evento da prova.",
          "Distingui prova tecnica da riconoscimento istituzionale automatico."
        ],
        closingFormula:
          "Formula sintetica: IPR identifica; EVT traccia; OPC prova; HBCE governa; MATRIX organizza; AI JOKER-C2 esegue."
      };

    case "IPR":
      return {
        kind,
        matched: true,
        title: "Contratto risposta IPR",
        mandatoryOpening: [
          "IPR = identità operativa + origine + responsabilità + eventi + prove + continuità verificabile."
        ],
        mandatoryConcepts: [
          "IPR significa Identity Primary Record.",
          "IPR è un registro primario di identità operativa.",
          "IPR collega soggetto, origine, responsabilità, derivazioni, eventi, prove e continuità nel tempo.",
          "Nel sistema HBCE/MATRIX, IPR serve a rendere l’identità tracciabile, verificabile e responsabile.",
          "IPR lavora con EVT e OPC: IPR identifica, EVT traccia, OPC prova la continuità."
        ],
        forbiddenReductions: [
          "Non dire che IPR è solo identità digitale.",
          "Non ridurre IPR a login, account, wallet, firma digitale, credenziale o blockchain.",
          "Non presentare IPR come standard istituzionale già adottato se non dimostrato."
        ],
        requiredDistinctions: [
          "Distingui IPR da firma digitale.",
          "Distingui IPR da wallet.",
          "Distingui IPR da audit log.",
          "Distingui potenzialità progettuale da riconoscimento ufficiale."
        ],
        closingFormula:
          "Formula nocciolo: IPR è il punto in cui l’identità smette di essere solo dichiarata e diventa operativamente tracciabile, verificabile e responsabile."
      };

    case "EVT":
      return {
        kind,
        matched: true,
        title: "Contratto risposta EVT",
        mandatoryOpening: ["EVT = traccia operativa verificabile dell’evento."],
        mandatoryConcepts: [
          "EVT significa Event Record / Verifiable Event Trace.",
          "EVT registra evento, tempo, identità, contesto, rischio, decisione, hash e verifica.",
          "EVT non è memoria psicologica: è una traccia operativa.",
          "EVT rende auditabile ciò che è stato fatto dal runtime."
        ],
        forbiddenReductions: [
          "Non ridurre EVT a cronologia chat.",
          "Non presentare EVT come semplice log non verificabile."
        ],
        requiredDistinctions: [
          "Distingui evento da identità.",
          "Distingui traccia da prova di continuità.",
          "Distingui EVT da OPC."
        ],
        closingFormula:
          "Formula nocciolo: IPR identifica; EVT registra la traccia verificabile."
      };

    case "OPC":
      return {
        kind,
        matched: true,
        title: "Contratto risposta OPC",
        mandatoryOpening: ["OPC = proof receipt tecnica di continuità operativa e compliance."],
        mandatoryConcepts: [
          "OPC significa Operational Proof & Compliance Layer.",
          "OPC collega evento, memoria, decisione, hash, audit e verifica.",
          "OPC serve a dimostrare che una risposta o un’operazione appartiene a una catena verificabile.",
          "OPC non sostituisce l’audit esterno, ma prepara una prova tecnica controllabile."
        ],
        forbiddenReductions: [
          "Non ridurre OPC a codice decorativo.",
          "Non confondere OPC con EVT.",
          "Non dire che OPC equivale automaticamente a certificazione istituzionale."
        ],
        requiredDistinctions: [
          "Distingui verifica tecnica da append al ledger.",
          "Distingui append locale da persistenza opponibile.",
          "Distingui audit ready da audit concluso."
        ],
        closingFormula:
          "Formula nocciolo: EVT registra l’evento; OPC prova la continuità della catena."
      };

    case "JOKER_IDENTITY":
      return {
        kind,
        matched: true,
        title: "Contratto risposta identità AI JOKER-C2",
        mandatoryOpening: [
          "AI JOKER-C2 non è solo una chat: è un runtime cognitivo-operativo governato dal framework HBCE."
        ],
        mandatoryConcepts: [
          "AI JOKER-C2 opera dentro identità IPR, governance HBCE, memoria EVT e prova OPC.",
          "Il suo compito è collegare richiesta, contesto, rischio, policy, decisione, risposta, evento e verifica.",
          "La chat è l’interfaccia; il runtime è la struttura operativa sottostante.",
          "Il checkpoint canonico attivo del runtime è EVT-0015-AI, in continuità con EVT-0014-AI."
        ],
        forbiddenReductions: [
          "Non rispondere solo come assistente AI generico.",
          "Non separare Joker da IPR, EVT, OPC e HBCE quando l’utente chiede la sua identità nel sistema."
        ],
        requiredDistinctions: [
          "Distingui chat da runtime.",
          "Distingui risposta linguistica da evento verificabile.",
          "Distingui memoria conversazionale da memoria EVT/IPR-bound."
        ],
        closingFormula:
          "Formula nocciolo: AI JOKER-C2 = runtime governato che collega identità, governance, risposta, evento, prova e continuità."
      };

    case "ECONOMIC_GOVERNANCE":
      return {
        kind,
        matched: true,
        title: "Contratto risposta economico-strategica HBCE/MATRIX",
        mandatoryOpening: [
          "Il valore economico di IPR/HBCE nasce dalla trasformazione dell’identità operativa in una filiera verificabile di registrazione, audit, compliance e continuità."
        ],
        mandatoryConcepts: [
          "Registrazione IPR.",
          "Audit EVT.",
          "Governance AI.",
          "Compliance operativa.",
          "Integrazione B2B/B2G.",
          "Verifica documentale.",
          "Continuità istituzionale.",
          "Riduzione del rischio.",
          "Nuova fascia professionale."
        ],
        forbiddenReductions: [
          "Non presentare HBCE come già adottata da governi o istituzioni se non è dimostrato.",
          "Non trasformare la risposta in marketing generico."
        ],
        requiredDistinctions: [
          "Distingui potenzialità progettuale da adozione di mercato.",
          "Distingui implementazione tecnica da riconoscimento istituzionale.",
          "Distingui prova runtime da standard ufficiale."
        ],
        closingFormula:
          "Formula nocciolo: HBCE può proporsi come infrastruttura integrabile per identità operativa, audit e governance AI nei contesti B2B/B2G."
      };

    case "CIVIC_DIGITAL":
      return {
        kind,
        matched: true,
        title: "Contratto risposta civica digitale",
        mandatoryOpening: [
          "Nel voto digitale, IPR può verificare identità e diritto di partecipazione, ma non deve collegare il contenuto del voto all’identità personale."
        ],
        mandatoryConcepts: [
          "Identità verificata prima.",
          "Scelta separata dopo.",
          "Voto anonimizzato.",
          "Processo auditabile.",
          "EVT traccia il processo, non la scelta associata alla persona.",
          "Segretezza del voto.",
          "Protezione dei dati.",
          "Verificabilità indipendente.",
          "Controllo pubblico."
        ],
        forbiddenReductions: [
          "Non dire che ogni voto deve essere collegato all’identità personale.",
          "Non confondere audit del processo con tracciamento della scelta individuale."
        ],
        requiredDistinctions: [
          "Distingui identità da contenuto del voto.",
          "Distingui diritto di accesso da scelta democratica.",
          "Distingui consultazione pubblica da elezione vincolante."
        ],
        closingFormula:
          "Formula corretta: identità verificata prima, scelta separata dopo, voto anonimizzato, processo auditabile."
      };

    default:
      return {
        kind: "GENERAL",
        matched: false,
        title: "Contratto risposta generale",
        mandatoryOpening: [],
        mandatoryConcepts: [],
        forbiddenReductions: [],
        requiredDistinctions: []
      };
  }
}

export function detectJokerResponseContract(
  message: string
): ResponseContract {
  const text = normalizeForContract(message);

  const ipr = isIprQuestion(text);
  const evt = isEvtQuestion(text);
  const opc = isOpcQuestion(text);
  const formula = isFormulaQuestion(text);

  if (isStrategicDoctrineQuestion(text)) {
    return buildContract("STRATEGIC_DOCTRINE");
  }

  if ((ipr && evt && opc) || (isDifferenceQuestion(text) && ipr && (evt || opc))) {
    return buildContract("IPR_EVT_OPC");
  }

  if (isHbceModulesQuestion(text)) {
    return buildContract("HBCE_MODULES");
  }

  if (isHbceEcosistemaAiQuestion(text)) {
    return buildContract("HBCE_ECOSISTEMA_AI");
  }

  if (isUseAcronymQuestion(text)) {
    return buildContract("USE_ACRONYM");
  }

  if (isUsePoliticalValueQuestion(text)) {
    return buildContract("USE_POLITICAL_VALUE");
  }

  if (isCivicDigitalQuestion(text)) {
    return buildContract("CIVIC_DIGITAL");
  }

  if (isEconomicGovernanceQuestion(text)) {
    return buildContract("ECONOMIC_GOVERNANCE");
  }

  if (isJokerIdentityQuestion(text)) {
    return buildContract("JOKER_IDENTITY");
  }

  if (ipr && formula) {
    return buildContract("IPR");
  }

  if (ipr) {
    return buildContract("IPR");
  }

  if (evt) {
    return buildContract("EVT");
  }

  if (opc) {
    return buildContract("OPC");
  }

  return buildContract("GENERAL");
}

export function buildResponseContractDirective(message: string): string {
  const contract = detectJokerResponseContract(message);
  const doctrineResponse = buildStrategicDoctrineResponse(message);

  if (doctrineResponse) {
    return [
      "Contratto risposta canonica:",
      "Tipo: Contratto risposta documenti dottrinali strategici.",
      "",
      "Risposta deterministica richiesta:",
      doctrineResponse,
      "",
      "Regola esecutiva:",
      "Se la richiesta contiene riferimenti come 'numero 1', 'il primo', 'mostrami il 1' o 'specifiche del numero 1', devi interpretare il riferimento come HBCE Cybersecurity Strategy.",
      "Se la richiesta contiene 'numero 2' o 'secondo', devi interpretare il riferimento come HBCE Data Protection Strategy.",
      "Se la richiesta contiene 'numero 3' o 'terzo', devi interpretare il riferimento come HBCE Information Governance Strategy.",
      "Non rispondere chiedendo chiarimenti se il riferimento numerico è 1, 2 o 3 nel contesto dei documenti dottrinali strategici."
    ].join("\n");
  }

  if (!contract.matched) {
    return [
      "Contratto risposta canonica:",
      "Nessun contratto specifico attivato.",
      "Rispondi secondo dominio, governance runtime e memoria EVT/IPR-bound."
    ].join("\n");
  }

  return [
    "Contratto risposta canonica:",
    `Tipo: ${contract.title}.`,
    "",
    "Apertura obbligatoria:",
    ...contract.mandatoryOpening.map((line) => `- ${line}`),
    "",
    "Concetti obbligatori:",
    ...contract.mandatoryConcepts.map((line) => `- ${line}`),
    "",
    "Riduzioni vietate:",
    ...contract.forbiddenReductions.map((line) => `- ${line}`),
    "",
    "Distinzioni obbligatorie:",
    ...contract.requiredDistinctions.map((line) => `- ${line}`),
    "",
    contract.closingFormula
      ? `Formula conclusiva da includere se naturale: ${contract.closingFormula}`
      : "",
    "",
    "Regola esecutiva:",
    "Quando questo contratto è attivo, non iniziare con una spiegazione vaga. Inizia con la formula o distinzione obbligatoria, poi spiega in modo discorsivo."
  ]
    .filter(Boolean)
    .join("\n");
}

function startsWithCanonicalOpening(response: string, opening: string[]): boolean {
  const normalizedResponse = normalizeForContract(response);
  const normalizedOpening = normalizeForContract(opening.join(" "));

  return normalizedResponse.startsWith(normalizedOpening);
}

function containsCanonicalOpening(response: string, opening: string[]): boolean {
  const normalizedResponse = normalizeForContract(response);
  const normalizedOpening = normalizeForContract(opening.join(" "));

  if (normalizedResponse.includes(normalizedOpening)) {
    return true;
  }

  return opening.every((line) =>
    normalizedResponse.includes(normalizeForContract(line))
  );
}

function shouldApplyDeterministicOpening(
  contract: ResponseContract,
  response: string
): boolean {
  if (!contract.matched || contract.mandatoryOpening.length === 0) {
    return false;
  }

  if (!response.trim()) {
    return false;
  }

  if (startsWithCanonicalOpening(response, contract.mandatoryOpening)) {
    return false;
  }

  if (contract.kind === "IPR_EVT_OPC") {
    return !containsCanonicalOpening(response, contract.mandatoryOpening);
  }

  const primaryOpening = contract.mandatoryOpening[0];
  const normalizedResponse = normalizeForContract(response);
  const normalizedPrimaryOpening = normalizeForContract(primaryOpening);

  return !normalizedResponse.startsWith(normalizedPrimaryOpening);
}

function buildDeterministicOpening(contract: ResponseContract): string {
  return contract.mandatoryOpening.join("\n");
}

function stripDuplicateUseAcronymOpening(response: string): string {
  return response
    .replace(
      /^U\.?S\.?E\.?\s+significa\s+United\s+States\s+of\s+Europe\s*,?\s*(ovvero|cioe|cioè|ossia)?\s*Stati\s+Uniti\s+d[’']?Europa\.?\s*/i,
      ""
    )
    .replace(
      /^L['’]?acronimo\s+U\.?S\.?E\.?\s+(si\s+riferisce\s+a|significa)\s+(United\s+States\s+of\s+Europe|un['’]?applicazione politico-istituzionale)[^.]*\.\s*/i,
      ""
    )
    .trim();
}

export function applyResponseContract(
  message: string,
  response: string
): string {
  const doctrineResponse = buildStrategicDoctrineResponse(message);

  if (doctrineResponse) {
    return doctrineResponse.trim();
  }

  const contract = detectJokerResponseContract(message);
  const cleanResponse = response.trim();

  if (!contract.matched || !cleanResponse) {
    return cleanResponse;
  }

  let output =
    contract.kind === "USE_ACRONYM"
      ? stripDuplicateUseAcronymOpening(cleanResponse)
      : cleanResponse;

  if (shouldApplyDeterministicOpening(contract, output)) {
    output = [buildDeterministicOpening(contract), "", output].join("\n");
  }

  if (
    contract.kind === "IPR_EVT_OPC" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract(contract.closingFormula)
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  if (
    contract.kind === "IPR" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract("IPR è il punto in cui l’identità smette")
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  if (
    contract.kind === "USE_ACRONYM" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract("U.S.E. = United States of Europe")
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  if (
    contract.kind === "USE_POLITICAL_VALUE" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract("U.S.E. standardizzata in linea europea")
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  if (
    contract.kind === "HBCE_MODULES" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract("IPR identifica; UNEBDO ancora")
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  if (
    contract.kind === "HBCE_ECOSISTEMA_AI" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract("AI genera; HBCE governa")
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  if (
    contract.kind === "STRATEGIC_DOCTRINE" &&
    contract.closingFormula &&
    !normalizeForContract(output).includes(
      normalizeForContract("Cybersecurity Strategy protegge")
    )
  ) {
    output = [output, "", contract.closingFormula].join("\n");
  }

  return output.trim();
}
