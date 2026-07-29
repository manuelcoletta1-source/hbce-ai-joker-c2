export const ARCHITECTURE_VERSION = "1.0.0" as const;

export type ArchitectureLayer =
  | "FRAMEWORK"
  | "IDENTITY_AUTHORITY"
  | "CONTEXT"
  | "EPISTEMIC"
  | "GOVERNANCE"
  | "EXECUTION"
  | "CONTINUITY_PROOF"
  | "LEARNING_OVERSIGHT";

export type ModuleMode =
  | "GATE"
  | "ENGINE"
  | "REGISTRY"
  | "SERVICE"
  | "FRAMEWORK"
  | "MONITOR";

export type FailurePolicy =
  | "FAIL_CLOSED"
  | "REQUIRE_HUMAN"
  | "DEGRADED_READ_ONLY"
  | "RECORD_ONLY";

export type RuntimeModuleId =
  | "MATRIX_FRAMEWORK"
  | "IPR"
  | "AUTHORITY"
  | "UNEBDO_CONTEXT"
  | "IOSPACE"
  | "MISSION"
  | "CLAIM_EVIDENCE"
  | "MATRIX_ENGINE"
  | "SRSC"
  | "QIV"
  | "DIABLO"
  | "CYBERGLOBAL_PRE_GATE"
  | "JOKER_C2_RUNTIME"
  | "CYBERGLOBAL_MONITOR"
  | "EVT"
  | "UNEBDO_ANCHOR"
  | "MEMORY"
  | "METAEXCHANGE"
  | "OPC"
  | "AUDIT_REPLAY"
  | "NEUROLOOP"
  | "HUMAN_OVERSIGHT";

export interface RuntimeModuleDefinition {
  id: RuntimeModuleId;
  name: string;
  question: string;
  responsibility: string;
  layer: ArchitectureLayer;
  mode: ModuleMode;
  required: boolean;
  failurePolicy: FailurePolicy;
  dependencies: readonly RuntimeModuleId[];
  mustNotClaim: readonly string[];
}

export const RUNTIME_ARCHITECTURE: Readonly<
  Record<RuntimeModuleId, RuntimeModuleDefinition>
> = {
  MATRIX_FRAMEWORK: {
    id: "MATRIX_FRAMEWORK",
    name: "MATRIX Framework",
    question: "Quale grammatica governa l'intero sistema?",
    responsibility:
      "Definisce identità, autorità, causalità, responsabilità, costo, prova, continuità e audit.",
    layer: "FRAMEWORK",
    mode: "FRAMEWORK",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: [],
    mustNotClaim: [
      "sovranità politica",
      "autorità giuridica autonoma",
      "verità assoluta",
    ],
  },

  IPR: {
    id: "IPR",
    name: "Identity Primary Record",
    question: "Chi esiste e chi risponde?",
    responsibility:
      "Identifica il soggetto operativo e collega origine, responsabilità e continuità.",
    layer: "IDENTITY_AUTHORITY",
    mode: "REGISTRY",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["MATRIX_FRAMEWORK"],
    mustNotClaim: [
      "personalità giuridica automatica",
      "autorizzazione implicita",
      "coscienza artificiale",
    ],
  },

  AUTHORITY: {
    id: "AUTHORITY",
    name: "Authority Engine",
    question: "Che cosa può fare il soggetto?",
    responsibility:
      "Verifica delega, permessi, risorse, durata, scopo e revoca dell'autorità.",
    layer: "IDENTITY_AUTHORITY",
    mode: "GATE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["IPR"],
    mustNotClaim: [
      "autorità derivata dalla sola identità",
      "permesso permanente",
    ],
  },

  UNEBDO_CONTEXT: {
    id: "UNEBDO_CONTEXT",
    name: "UNEBDO Context",
    question: "Quando e dove deve avvenire l'operazione?",
    responsibility:
      "Definisce il contesto spazio-temporale previsto senza dichiararlo come evento osservato.",
    layer: "CONTEXT",
    mode: "SERVICE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["IPR", "AUTHORITY"],
    mustNotClaim: [
      "evento già avvenuto",
      "coordinate fisiche equivalenti a coordinate digitali",
    ],
  },

  IOSPACE: {
    id: "IOSPACE",
    name: "IOSPACE",
    question: "In quale perimetro operativo può avvenire l'interazione?",
    responsibility:
      "Definisce tenant, sessione, rete, dispositivo, strumenti, ambiente e confini autorizzati.",
    layer: "CONTEXT",
    mode: "SERVICE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["AUTHORITY", "UNEBDO_CONTEXT"],
    mustNotClaim: [
      "coordinate fisiche certificate",
      "accesso implicito a ogni risorsa",
    ],
  },

  MISSION: {
    id: "MISSION",
    name: "Mission Engine",
    question: "Perché deve agire?",
    responsibility:
      "Formalizza obiettivo, intenzione, limiti, costo massimo e criterio di completamento.",
    layer: "CONTEXT",
    mode: "ENGINE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["IPR", "AUTHORITY", "IOSPACE"],
    mustNotClaim: [
      "obiettivo illimitato",
      "delega non verificata",
      "successo senza criterio misurabile",
    ],
  },

  CLAIM_EVIDENCE: {
    id: "CLAIM_EVIDENCE",
    name: "Claim and Evidence Engine",
    question: "Che cosa viene affermato e su quali evidenze?",
    responsibility:
      "Collega claim, fonti, controevidenze, stato epistemico, incertezza e falsificazione.",
    layer: "EPISTEMIC",
    mode: "ENGINE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["MISSION"],
    mustNotClaim: [
      "certezza senza evidenza",
      "fonte uguale a prova conclusiva",
      "hash uguale a verità",
    ],
  },

  MATRIX_ENGINE: {
    id: "MATRIX_ENGINE",
    name: "MATRIX Causal Engine",
    question: "Che cosa sta realmente accadendo nel sistema?",
    responsibility:
      "Ricostruisce attori, decisioni, meccanismi, effetti, costi, responsabilità e lacune.",
    layer: "EPISTEMIC",
    mode: "ENGINE",
    required: true,
    failurePolicy: "DEGRADED_READ_ONLY",
    dependencies: ["CLAIM_EVIDENCE"],
    mustNotClaim: [
      "causalità da sola correlazione",
      "previsione certa",
      "assenza di prova come prova di assenza",
    ],
  },

  SRSC: {
    id: "SRSC",
    name: "SRSC Interpretation Engine",
    question: "Come viene costruita e interpretata la rappresentazione?",
    responsibility:
      "Distingue osservazione, rappresentazione, inferenza, convinzione, ipotesi e scenario.",
    layer: "EPISTEMIC",
    mode: "ENGINE",
    required: true,
    failurePolicy: "DEGRADED_READ_ONLY",
    dependencies: ["CLAIM_EVIDENCE", "MATRIX_ENGINE"],
    mustNotClaim: [
      "rappresentazione uguale a realtà",
      "esperienza soggettiva artificiale dimostrata",
    ],
  },

  QIV: {
    id: "QIV",
    name: "QIV Constraint Engine",
    question: "Quali stati, transizioni e claim sono ammissibili?",
    responsibility:
      "Separa domini quantistico, classico-stocastico, digitale e probatorio applicando vincoli e falsificazione.",
    layer: "EPISTEMIC",
    mode: "GATE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["CLAIM_EVIDENCE", "MATRIX_ENGINE", "SRSC"],
    mustNotClaim: [
      "quantistico come metafora tecnica",
      "simulazione uguale a misura",
      "prova tecnica uguale a prova legale",
      "log digitale uguale a stato fisico completo",
    ],
  },

  DIABLO: {
    id: "DIABLO",
    name: "DIABLO Policy and Risk Gate",
    question: "È autorizzato procedere?",
    responsibility:
      "Valuta policy, rischio, costo, limiti, eccezioni e necessità di controllo umano.",
    layer: "GOVERNANCE",
    mode: "GATE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["AUTHORITY", "MISSION", "QIV"],
    mustNotClaim: [
      "legalità automatica",
      "assenza di rischio",
      "autorizzazione oltre il perimetro valutato",
    ],
  },

  CYBERGLOBAL_PRE_GATE: {
    id: "CYBERGLOBAL_PRE_GATE",
    name: "CyberGlobal Readiness Gate",
    question: "Il sistema è sicuro abbastanza per iniziare?",
    responsibility:
      "Verifica identità tecnica, integrità, postura cyber, dipendenze e capacità di arresto.",
    layer: "GOVERNANCE",
    mode: "GATE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["IOSPACE", "DIABLO"],
    mustNotClaim: [
      "sicurezza assoluta",
      "assenza futura di incidenti",
    ],
  },

  JOKER_C2_RUNTIME: {
    id: "JOKER_C2_RUNTIME",
    name: "JOKER-C2 Runtime",
    question: "Come viene eseguita l'operazione?",
    responsibility:
      "Orchestra modelli, strumenti, contesto e azioni entro missione e policy autorizzate.",
    layer: "EXECUTION",
    mode: "ENGINE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: [
      "MISSION",
      "QIV",
      "DIABLO",
      "CYBERGLOBAL_PRE_GATE",
    ],
    mustNotClaim: [
      "autorità autonoma",
      "personalità giuridica",
      "coscienza dimostrata",
    ],
  },

  CYBERGLOBAL_MONITOR: {
    id: "CYBERGLOBAL_MONITOR",
    name: "CyberGlobal Runtime Monitor",
    question: "È ancora sicuro continuare?",
    responsibility:
      "Rileva anomalie, revoche e incidenti durante l'esecuzione e può imporre arresto.",
    layer: "EXECUTION",
    mode: "MONITOR",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["JOKER_C2_RUNTIME"],
    mustNotClaim: [
      "monitoraggio infallibile",
      "copertura di minacce non osservate",
    ],
  },

  EVT: {
    id: "EVT",
    name: "Event Engine",
    question: "Che cosa è accaduto?",
    responsibility:
      "Registra decisioni, transizioni, attori, input, output, errori ed evidenze.",
    layer: "CONTINUITY_PROOF",
    mode: "REGISTRY",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["JOKER_C2_RUNTIME", "CYBERGLOBAL_MONITOR"],
    mustNotClaim: [
      "verità fisica del contenuto",
      "completezza di eventi non osservati",
    ],
  },

  UNEBDO_ANCHOR: {
    id: "UNEBDO_ANCHOR",
    name: "UNEBDO Event Anchor",
    question: "Dove si colloca l'evento nella continuità?",
    responsibility:
      "Ancora evento, tempo osservato, spazio dichiarato, predecessore e continuità.",
    layer: "CONTINUITY_PROOF",
    mode: "REGISTRY",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["UNEBDO_CONTEXT", "EVT"],
    mustNotClaim: [
      "precisione superiore alla fonte",
      "equivalenza tra posizione prevista e osservata",
    ],
  },

  MEMORY: {
    id: "MEMORY",
    name: "Governed Memory",
    question: "Che cosa deve restare disponibile?",
    responsibility:
      "Conserva memoria autorizzata, classificata, attribuita, versionata e revocabile.",
    layer: "CONTINUITY_PROOF",
    mode: "SERVICE",
    required: true,
    failurePolicy: "DEGRADED_READ_ONLY",
    dependencies: ["EVT", "UNEBDO_ANCHOR"],
    mustNotClaim: [
      "memoria totale",
      "retention permanente implicita",
      "consenso implicito",
    ],
  },

  METAEXCHANGE: {
    id: "METAEXCHANGE",
    name: "MetaExchange",
    question: "Che cosa può essere trasferito e a chi?",
    responsibility:
      "Applica classificazione, minimizzazione, destinazione, scadenza e ricevuta allo scambio.",
    layer: "CONTINUITY_PROOF",
    mode: "GATE",
    required: false,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["AUTHORITY", "IOSPACE", "MEMORY"],
    mustNotClaim: [
      "interoperabilità senza contratto",
      "accesso completo alla memoria",
      "trasferimento senza destinatario verificato",
    ],
  },

  OPC: {
    id: "OPC",
    name: "Operational Proof and Compliance",
    question: "Come dimostriamo l'integrità della catena?",
    responsibility:
      "Produce una ricevuta tecnica collegando evento, anchor, evidence reference e hash.",
    layer: "CONTINUITY_PROOF",
    mode: "SERVICE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["EVT", "UNEBDO_ANCHOR"],
    mustNotClaim: [
      "certificazione legale",
      "verità automatica del contenuto",
      "conformità normativa universale",
    ],
  },

  AUDIT_REPLAY: {
    id: "AUDIT_REPLAY",
    name: "Audit and Replay Engine",
    question: "La decisione può essere ricostruita e verificata?",
    responsibility:
      "Verifica catene, versioni, configurazioni, policy, input, output e configuration drift.",
    layer: "CONTINUITY_PROOF",
    mode: "ENGINE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["OPC", "MEMORY"],
    mustNotClaim: [
      "riproducibilità oltre il perimetro testato",
      "audit uguale ad approvazione normativa",
    ],
  },

  NEUROLOOP: {
    id: "NEUROLOOP",
    name: "NeuroLoop",
    question: "Che cosa deve essere corretto o migliorato?",
    responsibility:
      "Produce proposte di modifica basate su feedback, errori e risultati osservati.",
    layer: "LEARNING_OVERSIGHT",
    mode: "ENGINE",
    required: true,
    failurePolicy: "REQUIRE_HUMAN",
    dependencies: ["AUDIT_REPLAY"],
    mustNotClaim: [
      "auto-modifica autorizzata",
      "apprendimento sempre migliorativo",
    ],
  },

  HUMAN_OVERSIGHT: {
    id: "HUMAN_OVERSIGHT",
    name: "Human Oversight",
    question: "Chi approva eccezioni, modifiche e responsabilità residue?",
    responsibility:
      "Approva, rifiuta o revoca proposte, eccezioni e cambiamenti ad alto impatto.",
    layer: "LEARNING_OVERSIGHT",
    mode: "GATE",
    required: true,
    failurePolicy: "FAIL_CLOSED",
    dependencies: ["NEUROLOOP"],
    mustNotClaim: [
      "controllo umano efficace senza informazioni sufficienti",
      "trasferimento della responsabilità alla macchina",
    ],
  },
};

export function getRuntimeModule(
  id: RuntimeModuleId,
): RuntimeModuleDefinition {
  return RUNTIME_ARCHITECTURE[id];
}

export function validateArchitecture(): string[] {
  const errors: string[] = [];
  const modules = Object.values(RUNTIME_ARCHITECTURE);
  const knownIds = new Set(modules.map((module) => module.id));

  for (const module of modules) {
    if (!module.question.trim()) {
      errors.push(`${module.id}: QUESTION_REQUIRED`);
    }

    if (!module.responsibility.trim()) {
      errors.push(`${module.id}: RESPONSIBILITY_REQUIRED`);
    }

    for (const dependency of module.dependencies) {
      if (!knownIds.has(dependency)) {
        errors.push(`${module.id}: UNKNOWN_DEPENDENCY:${dependency}`);
      }

      if (dependency === module.id) {
        errors.push(`${module.id}: SELF_DEPENDENCY`);
      }
    }

    if (
      module.required &&
      module.failurePolicy === "RECORD_ONLY" &&
      module.mode === "GATE"
    ) {
      errors.push(`${module.id}: REQUIRED_GATE_CANNOT_RECORD_ONLY`);
    }
  }

  return errors;
}
