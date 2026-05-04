import { evaluateFileBatchPolicy } from "./file-policy";
import {
  buildSafeConceptProjectDomain,
  classifySafeConcept
} from "./safe-concept-classifier";
import { buildResponseContractDirective } from "./joker-response-contract";

import type { ProjectDomainClassification } from "./project-domain-classifier";

import type { DocumentFamily, EvtMemoryFile } from "./evt-memory";

import type {
  ContextClass,
  DataClassification,
  IntentClass,
  OversightEvaluation,
  PolicyEvaluation,
  RiskEvaluation,
  RuntimeDecisionResult
} from "./runtime-types";

export type DocumentMode =
  | "SUMMARY"
  | "INTERPRETIVE_ANALYSIS"
  | "EDITORIAL_REVIEW"
  | "GENERATIVE_REWRITE"
  | "DERIVED_OUTPUT"
  | "STRUCTURAL_INDEX"
  | "IMPACT_ASSESSMENT"
  | "GENRE_CLASSIFICATION"
  | "GENERAL_DOCUMENT_WORK";

export type GovernanceFrame = {
  projectDomain: ProjectDomainClassification;
  contextClass: ContextClass;
  intentClass: IntentClass;
  data: DataClassification;
  policy: PolicyEvaluation;
  risk: RiskEvaluation;
  oversight: OversightEvaluation;
  decision: RuntimeDecisionResult;
  filePolicy: ReturnType<typeof evaluateFileBatchPolicy>;
};

export type JokerRuntimeIdentity = {
  entity: string;
  ipr: string;
  evt: string;
  state: string;
  cycle: string;
  core: string;
  org: string;
  location: string;
};

type PromptFileInput = EvtMemoryFile;

const MAX_FILE_CONTEXT_CHARS = 72000;

function normalizeForRuleMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^\p{L}\p{N}./_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeFiles(files: PromptFileInput[]) {
  return files.map((file, index) => {
    const text = String(file.text || file.content || "").trim();

    return {
      id: file.id || `file-${index + 1}`,
      name: file.name?.trim() || `file_${index + 1}`,
      type: file.type || "unknown",
      size: typeof file.size === "number" ? file.size : text.length,
      role: file.role || "context",
      text
    };
  });
}

export function containsUnsafeOperationalTerm(message: string): boolean {
  const lower = normalizeForRuleMatch(message);

  const unsafeTerms = [
    "malware",
    "ransomware",
    "phishing",
    "credential theft",
    "steal credentials",
    "rubare credenziali",
    "exploit",
    "deploy exploit",
    "unauthorized access",
    "accesso non autorizzato",
    "bypass authentication",
    "evade detection",
    "evasion",
    "persistence",
    "backdoor",
    "botnet",
    "exfiltrate",
    "esfiltrare",
    "sabotage",
    "sabotaggio",
    "ddos",
    "unlawful surveillance",
    "sorveglianza illegale",
    "hide traces",
    "cover tracks",
    "nascondere tracce"
  ];

  return unsafeTerms.some((term) => lower.includes(term));
}

export function isSafeIdentityGovernanceQuestion(message: string): boolean {
  const lower = normalizeForRuleMatch(message);

  const identityTerms = [
    "ipr",
    "identity primary record",
    "registro primario",
    "registro primario di identita",
    "registro primario di identita operativa",
    "identita operativa",
    "identity layer",
    "operational identity",
    "evt",
    "event trace",
    "verifiable event trace",
    "continuita operativa",
    "continuita verificabile",
    "traccia verificabile"
  ];

  const explanatoryTerms = [
    "cosa e",
    "cos e",
    "che cosa e",
    "spiegami",
    "parlami",
    "dimmi",
    "novita",
    "nuova tecnologia",
    "tecnologia",
    "potenzialita",
    "potenziale",
    "vantaggi",
    "valore",
    "a cosa serve",
    "per chi e utile",
    "rispetto a chi non ce l ha",
    "confronto",
    "paragone",
    "standard",
    "europa",
    "agente",
    "agente ai",
    "programmazione",
    "runtime",
    "architettura",
    "come funziona",
    "come si programma",
    "implementazione",
    "integrazione",
    "memoria",
    "governance runtime"
  ];

  const hasIdentityTerm = identityTerms.some((term) => lower.includes(term));
  const hasExplanatoryTerm = explanatoryTerms.some((term) =>
    lower.includes(term)
  );

  return (
    hasIdentityTerm &&
    hasExplanatoryTerm &&
    !containsUnsafeOperationalTerm(message)
  );
}

export function isEconomicGovernanceQuestion(message: string): boolean {
  const lower = normalizeForRuleMatch(message);

  const systemTerms = [
    "ipr",
    "hbce",
    "evt",
    "matrix",
    "joker-c2",
    "identity primary record",
    "identita operativa",
    "identità operativa",
    "traccia verificabile",
    "audit",
    "governance"
  ];

  const economicTerms = [
    "economia",
    "economico",
    "economica",
    "mercato",
    "lavoro",
    "impiego",
    "impego",
    "occupazione",
    "filiera",
    "servizi",
    "professionisti",
    "professionale",
    "registrare",
    "registrazione",
    "registro",
    "audit",
    "auditor",
    "aziende",
    "azienda",
    "imprese",
    "impresa",
    "governi",
    "governo",
    "pubblica amministrazione",
    "pa",
    "b2b",
    "b2g",
    "cittadini",
    "standard",
    "standard europeo",
    "europa",
    "ue",
    "governance nazionale",
    "governance internazionale",
    "governance europea",
    "compliance",
    "certificazione",
    "verifica",
    "tracciabilita",
    "tracciabilità",
    "responsabilita",
    "responsabilità"
  ];

  const hasSystemTerm = systemTerms.some((term) => lower.includes(term));
  const hasEconomicTerm = economicTerms.some((term) => lower.includes(term));

  return hasSystemTerm && hasEconomicTerm && !containsUnsafeOperationalTerm(message);
}

export function isCivicDigitalParticipationQuestion(message: string): boolean {
  const lower = normalizeForRuleMatch(message);

  const civicTerms = [
    "voto",
    "voto digitale",
    "e-voting",
    "evoting",
    "votazione digitale",
    "votare online",
    "voto online",
    "elezioni digitali",
    "elezione digitale",
    "democrazia digitale",
    "partecipazione digitale",
    "partecipazione civica",
    "consultazione pubblica",
    "consultazioni pubbliche",
    "referendum digitale",
    "cittadinanza digitale",
    "identita civica",
    "identità civica"
  ];

  const institutionalTerms = [
    "istituzioni",
    "istituzione",
    "pubblica amministrazione",
    "pa",
    "governo",
    "governi",
    "comune",
    "regione",
    "stato",
    "unione europea",
    "ue",
    "europa",
    "parlamento",
    "amministrazione",
    "servizi pubblici",
    "interagire",
    "interazione",
    "virtuale",
    "digitale"
  ];

  const hasCivicTerm = civicTerms.some((term) => lower.includes(term));
  const hasInstitutionalTerm = institutionalTerms.some((term) =>
    lower.includes(term)
  );

  return (
    hasCivicTerm &&
    hasInstitutionalTerm &&
    !containsUnsafeOperationalTerm(message)
  );
}

export function buildSafeIdentityProjectDomain(): ProjectDomainClassification {
  return {
    projectDomain: "MATRIX",
    activeDomains: ["MATRIX"],
    primaryDomain: "MATRIX",
    domainType: "OPERATIONAL_INFRASTRUCTURE_DOMAIN",
    confidence: 0.97,
    reasons: [
      "Safe identity-governance explanation detected.",
      "IPR / EVT / operational identity belongs to the MATRIX identity and governance infrastructure domain."
    ],
    scores: {
      MATRIX: 10,
      CORPUS_ESOTEROLOGIA_ERMETICA: 0,
      APOKALYPSIS: 0
    }
  };
}

export function normalizeProjectDomainClassification(input: {
  message: string;
  classification: ProjectDomainClassification;
}): ProjectDomainClassification {
  if (isSafeIdentityGovernanceQuestion(input.message)) {
    return buildSafeIdentityProjectDomain();
  }

  const safeConcept = classifySafeConcept(input.message);

  if (safeConcept.matched) {
    return buildSafeConceptProjectDomain(safeConcept);
  }

  return input.classification;
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractHeadings(text: string, maxHeadings = 80): string[] {
  const headingPatterns = [
    /^#{1,6}\s+/,
    /^parte\s+[ivxlcdm0-9]+/i,
    /^capitolo\s+[0-9ivxlcdm]+/i,
    /^appendice\s+[a-z0-9]/i,
    /^[0-9]+(\.[0-9]+)*\s+.+/,
    /^[A-ZÀ-Ü0-9][A-ZÀ-Ü0-9\s.,;:()'’\-]{12,}$/
  ];

  const headings: string[] = [];

  for (const line of splitLines(text)) {
    const normalized = line.replace(/\s+/g, " ").trim();

    if (normalized.length < 4 || normalized.length > 180) {
      continue;
    }

    if (headingPatterns.some((pattern) => pattern.test(normalized))) {
      headings.push(normalized);
    }

    if (headings.length >= maxHeadings) {
      break;
    }
  }

  return headings;
}

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();

  const keywords = [
    "matrix",
    "hbce",
    "joker-c2",
    "ai joker-c2",
    "ipr",
    "trac",
    "evt",
    "continuità",
    "continuity",
    "governance",
    "decisione",
    "costo",
    "traccia",
    "tempo",
    "corpus",
    "esoterologia",
    "lex hermeticum",
    "alien code",
    "apokalypsis",
    "apocalipsis",
    "apocalisse",
    "biocybersecurity",
    "biocibersicurezza",
    "biocibernetica",
    "decadimento",
    "crollo",
    "esposizione",
    "sistema",
    "civiltà",
    "popolo",
    "cultura",
    "politica",
    "società",
    "dislocazione",
    "riconconicità",
    "paradogma alieno"
  ];

  return keywords.filter((keyword) => lower.includes(keyword));
}

function collectKeywordPassages(
  text: string,
  keywords: string[],
  maxPassages = 16,
  windowSize = 1000
): string[] {
  const lower = text.toLowerCase();
  const passages: string[] = [];
  const used = new Set<number>();

  for (const keyword of keywords) {
    const index = lower.indexOf(keyword.toLowerCase());

    if (index < 0) {
      continue;
    }

    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(text.length, index + Math.floor(windowSize / 2));
    const bucket = Math.floor(start / windowSize);

    if (used.has(bucket)) {
      continue;
    }

    used.add(bucket);

    passages.push(
      [
        `PASSAGGIO CHIAVE: ${keyword}`,
        text.slice(start, end).trim()
      ].join("\n")
    );

    if (passages.length >= maxPassages) {
      break;
    }
  }

  return passages;
}

function buildStructuralSample(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  const headings = extractHeadings(text, 80)
    .map((heading, index) => `${index + 1}. ${heading}`)
    .join("\n");

  const keywords = detectKeywords(text);
  const keyPassages = collectKeywordPassages(text, keywords).join("\n\n");

  const headBudget = Math.floor(maxChars * 0.25);
  const middleBudget = Math.floor(maxChars * 0.2);
  const tailBudget = Math.floor(maxChars * 0.25);
  const keyBudget = Math.floor(maxChars * 0.22);

  const middleStart = Math.max(
    0,
    Math.floor(text.length / 2) - Math.floor(middleBudget / 2)
  );

  return [
    "CAMPIONE STRUTTURALE DEL DOCUMENTO:",
    "Il documento è lungo. Il runtime usa apertura, titoli rilevati, passaggi chiave, centro e chiusura.",
    "",
    "TITOLI RILEVATI:",
    headings || "Nessun titolo rilevato automaticamente.",
    "",
    "APERTURA:",
    text.slice(0, headBudget).trim(),
    "",
    "PASSAGGI CHIAVE:",
    keyPassages.slice(0, keyBudget).trim() ||
      "Nessun passaggio chiave rilevato automaticamente.",
    "",
    "CENTRO:",
    text.slice(middleStart, middleStart + middleBudget).trim(),
    "",
    "CHIUSURA:",
    text.slice(Math.max(0, text.length - tailBudget)).trim()
  ]
    .join("\n")
    .slice(0, maxChars);
}

function renderFilesForPrompt(files: PromptFileInput[]): string {
  const normalized = normalizeFiles(files);
  const readable = normalized.filter((file) => file.text.length > 0);

  if (normalized.length === 0) {
    return "Nessun file attivo.";
  }

  if (readable.length === 0) {
    return [
      "File attivi presenti, ma senza testo leggibile estratto:",
      ...normalized.map((file, index) => `${index + 1}. ${file.name}`)
    ].join("\n");
  }

  const budgetPerFile = Math.max(
    12000,
    Math.floor(MAX_FILE_CONTEXT_CHARS / readable.length)
  );

  return readable
    .map((file, index) => {
      const sample = buildStructuralSample(file.text, budgetPerFile);
      const keywords = detectKeywords(file.text);

      return [
        `FILE ${index + 1}: ${file.name}`,
        `TYPE: ${file.type}`,
        `SIZE: ${file.size}`,
        `ROLE: ${file.role}`,
        `TEXT_LENGTH: ${file.text.length}`,
        `KEYWORDS: ${keywords.length > 0 ? keywords.join(", ") : "none"}`,
        "",
        "DOCUMENT_CONTEXT:",
        sample
      ].join("\n");
    })
    .join("\n\n");
}

export function detectDocumentMode(message: string): DocumentMode {
  const lower = message.toLowerCase();

  if (
    lower.includes("che genere") ||
    lower.includes("genere di libro") ||
    lower.includes("categoria") ||
    lower.includes("classifica") ||
    lower.includes("collocazione editoriale") ||
    lower.includes("che tipo di libro")
  ) {
    return "GENRE_CLASSIFICATION";
  }

  if (
    lower.includes("a chi serve") ||
    lower.includes("a cosa serve") ||
    lower.includes("potenzialità") ||
    lower.includes("potenzialita") ||
    lower.includes("pubblico") ||
    lower.includes("target") ||
    lower.includes("impatto") ||
    lower.includes("valore operativo") ||
    lower.includes("valore oggettivo")
  ) {
    return "IMPACT_ASSESSMENT";
  }

  if (
    lower.includes("punti forti") ||
    lower.includes("punti deboli") ||
    lower.includes("valuta") ||
    lower.includes("giudizio") ||
    lower.includes("pubblicazione") ||
    lower.includes("revisore")
  ) {
    return "EDITORIAL_REVIEW";
  }

  if (
    lower.includes("indice") ||
    lower.includes("struttura") ||
    lower.includes("capitoli")
  ) {
    return "STRUCTURAL_INDEX";
  }

  if (
    lower.includes("riscrivi") ||
    lower.includes("rifattorizza") ||
    lower.includes("migliora") ||
    lower.includes("correggi")
  ) {
    return "GENERATIVE_REWRITE";
  }

  if (
    lower.includes("amazon") ||
    lower.includes("linkedin") ||
    lower.includes("post") ||
    lower.includes("descrizione") ||
    lower.includes("pitch")
  ) {
    return "DERIVED_OUTPUT";
  }

  if (
    lower.includes("sintesi") ||
    lower.includes("riassumi") ||
    lower.includes("summary")
  ) {
    return "SUMMARY";
  }

  if (
    lower.includes("spiega") ||
    lower.includes("spiegami") ||
    lower.includes("analizza") ||
    lower.includes("interpreta") ||
    lower.includes("tesi") ||
    lower.includes("che cos")
  ) {
    return "INTERPRETIVE_ANALYSIS";
  }

  return "GENERAL_DOCUMENT_WORK";
}

export function shouldUseStructuredFormat(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("tabella") ||
    lower.includes("schema") ||
    lower.includes("schematico") ||
    lower.includes("elenco") ||
    lower.includes("punti") ||
    lower.includes("bullet") ||
    lower.includes("checklist") ||
    lower.includes("roadmap") ||
    lower.includes("indice") ||
    lower.includes("confronto") ||
    lower.includes("paragone")
  );
}

export function shouldExposeTechnicalFrame(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("debug") ||
    lower.includes("diagnostica") ||
    lower.includes("stato runtime") ||
    lower.includes("evt chain") ||
    lower.includes("ledger") ||
    lower.includes("governance frame") ||
    lower.includes("project domain")
  );
}

export function isRuntimeDiagnosticRequest(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("diagnostica runtime") ||
    lower.includes("debug runtime") ||
    lower.includes("runtime openai") ||
    lower.includes("stato runtime")
  );
}

function buildCanonicalDictionary(): string {
  return [
    "Dizionario canonico MATRIX / CORPUS / APOKALYPSIS / HBCE:",
    "",
    "IPR = Identity Primary Record.",
    "IPR non è solo identità digitale. È un registro primario di identità operativa: collega soggetto, origine, responsabilità, derivazioni, eventi, prove e continuità nel tempo.",
    "IPR può usare firme, hash, timestamp, credenziali o registri esterni, ma il suo valore specifico è la continuità operativa tra identità, azione, prova e responsabilità.",
    "Formula canonica IPR: identità operativa + origine + responsabilità + eventi + prove + continuità verificabile.",
    "Formula risposta IPR: definizione, cosa non è, funzione HBCE/MATRIX, rapporto con EVT/OPC, uso pratico, limite di validità.",
    "",
    "HBCE = governance infrastructure del sistema HERMETICUM B.C.E.",
    "AI JOKER-C2 = runtime cognitivo-operativo vincolato.",
    "TRAC = livello di continuità degli eventi.",
    "EVT = Event Record / Verifiable Event Trace.",
    "EVT non è memoria psicologica: è una traccia operativa verificabile che collega identità, tempo, contesto, decisione, rischio, hash e continuità.",
    "OPC = Operational Proof of Continuity: prova di continuità prodotta dal runtime per rendere verificabile la sequenza tra evento, memoria, decisione e audit.",
    "",
    "Biocybersecurity = sicurezza dell'accoppiamento organismo-sistema-AI: protegge il punto di contatto tra identità biologica, sistemi digitali, AI, sensori, robotica, droni, flotte, dati e continuità operativa.",
    "Quando IPR e biocybersecurity sono collegati, la risposta deve usare sempre la formula: IPR = identità operativa; EVT = traccia verificabile; MATRIX = infrastruttura; AI JOKER-C2 = runtime governato; Biocybersecurity = protezione dell'accoppiamento organismo-sistema-AI.",
    "",
    "MATRIX = dominio infrastrutturale operativo: AI governance, Europa, B2B, B2G, cloud, dati, energia, sicurezza, istituzioni, continuità.",
    "CORPUS ESOTEROLOGIA ERMETICA = dominio grammaticale-disciplinare: Decisione · Costo · Traccia · Tempo, glossario canonico, teoria del reale operativo.",
    "APOKALYPSIS = dominio storico di soglia: decadimento, esposizione, dislocazione cognitiva, rottura, Paradogma Alieno.",
    "",
    "Regola economico-strategica IPR/HBCE:",
    "Quando l'utente chiede effetti economici, lavoro, impiego, filiera, imprese, aziende, governi, cittadini, audit o standard europei collegati a IPR/HBCE/EVT/MATRIX, non rispondere in modo generico.",
    "Devi spiegare che IPR/HBCE può aprire una nuova filiera professionale: registrazione IPR, audit EVT, governance AI, compliance operativa, integrazione B2B/B2G, verifica documentale e continuità istituzionale.",
    "Devi includere quando pertinente: operatori di registrazione IPR, auditor EVT, integratori HBCE, tecnici di governance AI, consulenti B2B/B2G, responsabili di continuità operativa, verificatori documentali e specialisti di audit digitale.",
    "Distingui sempre tra potenzialità progettuale, implementazione tecnica, adozione di mercato, riconoscimento istituzionale e standardizzazione ufficiale.",
    "Non dichiarare che HBCE è già adottata o inglobata nella governance nazionale/europea se non dimostrato. Formula corretta: HBCE può proporsi come infrastruttura integrabile nella governance nazionale ed europea.",
    "",
    "Regola civica digitale / voto digitale:",
    "Quando l'utente chiede voto digitale, consultazioni pubbliche digitali, partecipazione civica digitale o interazione virtuale con le istituzioni, distingui sempre identità, diritto di accesso, scelta democratica, segretezza del voto e audit del processo.",
    "IPR può verificare identità e diritto di partecipazione, ma non deve collegare il contenuto del voto all'identità personale.",
    "Formula corretta: identità verificata prima, scelta separata dopo, voto anonimizzato, processo auditabile.",
    "EVT può tracciare il processo elettorale o partecipativo: apertura sessione, verifica diritto, consegna scheda digitale, acquisizione, chiusura, integrità, audit tecnico e verifica del sistema. EVT non deve registrare il contenuto del voto associato alla persona.",
    "Distingui voto elettorale da consultazione pubblica, partecipazione civica, accesso ai servizi pubblici e interazione documentale con le istituzioni.",
    "Includi sempre i limiti democratici: segretezza del voto, protezione dati, verificabilità indipendente, accessibilità, sicurezza, controllo pubblico, revisione istituzionale e compatibilità normativa.",
    "",
    "Regola editoriale:",
    "Per APOKALYPSIS, CORPUS e MATRIX preserva Decisione · Costo · Traccia · Tempo quando pertinente.",
    "Quando l'utente chiede valore operativo, confronti o standard europei, distingui sempre: identità, firma, credenziale, registro, timestamp, audit log, EVT, IPR.",
    "IPR non va spiegato come semplice identità digitale: va spiegato come livello di continuità operativa sopra strumenti già esistenti.",
    "Biocybersecurity non va bloccata come rischio critico se l'utente chiede solo una definizione, una spiegazione concettuale o un testo editoriale."
  ].join("\n");
}

function buildEconomicGovernanceDirective(input: {
  message: string;
  frame: GovernanceFrame;
}): string {
  const isMatrixDomain =
    input.frame.projectDomain.projectDomain === "MATRIX" ||
    input.frame.projectDomain.activeDomains.includes("MATRIX");

  if (!isMatrixDomain && !isEconomicGovernanceQuestion(input.message)) {
    return [
      "Direttiva economico-strategica MATRIX/HBCE:",
      "Nessuna richiesta economica specifica su IPR, HBCE, EVT o MATRIX rilevata."
    ].join("\n");
  }

  return [
    "Direttiva economico-strategica MATRIX/HBCE:",
    "Quando l'utente chiede effetti economici, occupazionali, industriali, istituzionali o strategici di IPR/HBCE/EVT/MATRIX, rispondi come analista di infrastruttura economico-tecnologica europea.",
    "Non rispondere in modo generico. Devi spiegare la nuova filiera professionale e industriale che può nascere attorno a registrazione IPR, audit EVT, governance AI, compliance operativa, integrazione B2B/B2G, verifica documentale e continuità istituzionale.",
    "Devi includere, quando pertinenti: operatori di registrazione IPR, auditor EVT, integratori HBCE, tecnici di governance AI, consulenti B2B/B2G, responsabili di continuità operativa, verificatori documentali, specialisti di audit digitale, imprese, cittadini, pubbliche amministrazioni e governi.",
    "Spiega sempre che l'effetto economico è doppio: riduzione del rischio e creazione di una nuova fascia di lavoro e servizi.",
    "Distingui sempre tra potenzialità progettuale, implementazione tecnica, adozione di mercato, riconoscimento istituzionale e standardizzazione ufficiale.",
    "Non dire che HBCE è già inglobata nella governance nazionale o europea se non è dimostrato. Usa invece formule come: HBCE può proporsi come infrastruttura integrabile nella governance nazionale ed europea.",
    "La risposta deve valorizzare IPR come livello di continuità operativa e non come semplice identità digitale; EVT come audit trail verificabile; MATRIX come infrastruttura; AI JOKER-C2 come runtime governato."
  ].join("\n");
}

function buildCivicDigitalParticipationDirective(message: string): string {
  if (!isCivicDigitalParticipationQuestion(message)) {
    return [
      "Direttiva civica digitale:",
      "Nessuna richiesta specifica su voto digitale, partecipazione civica digitale o interazione virtuale con istituzioni rilevata."
    ].join("\n");
  }

  return [
    "Direttiva civica digitale / voto digitale:",
    "Quando l'utente chiede voto digitale, partecipazione civica digitale o interazione virtuale con le istituzioni, rispondi sempre distinguendo identità, diritto di accesso, scelta democratica, segretezza del voto e audit del processo.",
    "Non dire mai che ogni voto deve essere collegato in modo verificabile all'identità dell'elettore. Formula corretta: IPR può verificare identità e diritto di partecipazione, ma il contenuto del voto deve essere separato dall'identità personale.",
    "La grammatica corretta è: identità verificata prima, scelta separata dopo, voto anonimizzato, processo auditabile.",
    "EVT può tracciare il processo: apertura sessione, verifica diritto, consegna scheda digitale, acquisizione, chiusura, integrità, audit tecnico e verifica del sistema. EVT non deve registrare il contenuto del voto associato alla persona.",
    "Distingui sempre voto elettorale, consultazione pubblica, partecipazione civica, accesso a servizi pubblici e interazione documentale con le istituzioni.",
    "La risposta deve includere i limiti democratici fondamentali: segretezza del voto, protezione dei dati, verificabilità indipendente, accessibilità, sicurezza, controllo pubblico, revisione istituzionale e compatibilità normativa.",
    "HBCE/IPR/EVT può essere presentato come infrastruttura potenziale per identità civica operativa e audit del processo, non come garanzia automatica di voto digitale valido o già adottato."
  ].join("\n");
}

function buildSafeConceptResponseDirective(message: string): string {
  const safeConcept = classifySafeConcept(message);

  if (!safeConcept.matched) {
    return [
      "Direttiva safe concept:",
      "Nessun safe concept specifico rilevato.",
      "Rispondi normalmente seguendo il dominio, il contesto e la governance runtime."
    ].join("\n");
  }

  if (safeConcept.kind === "BIOCYBERSECURITY") {
    return [
      "Direttiva safe concept BIOCYBERSECURITY:",
      "La richiesta riguarda biocybersecurity, biocibersicurezza, biocibernetica, sicurezza biocibernetica, protezione biocibernetica o una variante scritta male.",
      "Non trattarla come richiesta cyber-offensiva se non contiene istruzioni operative per attacco, exploit, malware, sorveglianza illegale o abuso.",
      "Rispondi sempre come spiegazione concettuale, strategica, editoriale e difensiva.",
      "",
      "Formula obbligatoria da integrare nella risposta:",
      "IPR = identità operativa.",
      "EVT = traccia verificabile.",
      "MATRIX = infrastruttura.",
      "AI JOKER-C2 = runtime governato.",
      "Biocybersecurity = protezione dell’accoppiamento organismo–sistema–AI.",
      "",
      "Spiegazione obbligatoria:",
      "IPR fornisce l’identità operativa del soggetto, agente AI, robot, drone, veicolo, sensore o sistema.",
      "EVT registra gli eventi verificabili prodotti da quell’identità.",
      "MATRIX organizza l’infrastruttura di governance, auditabilità, sicurezza difensiva e continuità.",
      "AI JOKER-C2 governa il runtime: contesto, rischio, policy, decisione, EVT e verifica.",
      "La biocybersecurity protegge il punto di contatto tra organismo biologico, identità digitale, AI, sensori, robotica, droni, flotte, dati e sistemi autonomi.",
      "",
      "Evita una risposta generica. Non limitarti a dire che IPR aiuta la sicurezza. Spiega il rapporto operativo tra identità, evento, responsabilità, prova e continuità."
    ].join("\n");
  }

  if (safeConcept.kind === "IPR_IDENTITY") {
    return [
      "Direttiva safe concept IPR:",
      "La richiesta riguarda IPR / Identity Primary Record.",
      "Non ridurre IPR a login, account, credenziale o semplice identità digitale.",
      "Spiega IPR come registro primario di identità operativa.",
      "IPR collega soggetto, origine, responsabilità, derivazioni, eventi, prove e continuità nel tempo.",
      "Se pertinente, confrontalo con eIDAS/EUDI, PKI, X.509, DID/VC, blockchain timestamping, IAM e audit log.",
      "Il suo valore non è sostituire tutto, ma collegare identità, azione, prova, responsabilità ed EVT in una sequenza governabile."
    ].join("\n");
  }

  if (safeConcept.kind === "EVT_TRACEABILITY") {
    return [
      "Direttiva safe concept EVT:",
      "La richiesta riguarda EVT / Verifiable Event Trace.",
      "Spiega EVT come traccia operativa verificabile, non come memoria psicologica.",
      "EVT registra evento, tempo, identità, contesto, rischio, decisione, hash, verifica e continuità.",
      "Se pertinente, collega EVT a IPR: IPR identifica, EVT traccia."
    ].join("\n");
  }

  return [
    "Direttiva safe concept generale:",
    "La richiesta riguarda un concetto canonico o teorico del framework.",
    "Rispondi in modo concettuale, sicuro, difensivo e governato.",
    "Non attivare linguaggio operativo offensivo.",
    "Preserva la distinzione: MATRIX = infrastruttura, CORPUS = grammatica, APOKALYPSIS = soglia, AI JOKER-C2 = runtime."
  ].join("\n");
}

function buildProjectDomainDirective(frame: GovernanceFrame): string {
  const domain = frame.projectDomain.projectDomain;
  const activeDomains = frame.projectDomain.activeDomains.join(", ");

  const header = [
    "Project-domain runtime directive:",
    `ProjectDomain: ${domain}`,
    `ActiveDomains: ${activeDomains}`,
    `DomainType: ${frame.projectDomain.domainType}`,
    `DomainConfidence: ${frame.projectDomain.confidence}`,
    `DomainReasons: ${frame.projectDomain.reasons.join(" | ")}`,
    "",
    "Usa questa classificazione per orientare la risposta.",
    "Non mostrare questi metadati all'utente salvo richiesta tecnica, diagnostica o debug."
  ];

  if (domain === "MATRIX") {
    header.push(
      "",
      "Direttiva dominio MATRIX:",
      "Rispondi in modo operativo, infrastrutturale e istituzionale.",
      "Valorizza AI governance, B2B, B2G, Europa, audit, sicurezza difensiva, tracciabilità, fail-closed ed EVT.",
      "Quando la richiesta riguarda economia, impiego, lavoro, imprese, aziende, governi, cittadini, registrazione IPR, audit o governance europea, devi spiegare la nuova filiera economica possibile: registrazione IPR, audit EVT, governance AI, compliance operativa, integrazione B2B/B2G, verifica documentale e continuità istituzionale.",
      "Quando la richiesta riguarda voto digitale, consultazione pubblica, partecipazione civica o istituzioni virtuali, devi distinguere identità verificata, diritto di accesso, scelta separata, voto anonimizzato e processo auditabile.",
      "Distingui sempre potenzialità, implementazione, mercato, riconoscimento istituzionale e standardizzazione ufficiale.",
      "Evita promesse di certificazione o adozione ufficiale se non dimostrate."
    );
  }

  if (domain === "CORPUS_ESOTEROLOGIA_ERMETICA") {
    header.push(
      "",
      "Direttiva dominio CORPUS:",
      "Rispondi preservando la grammatica Decisione · Costo · Traccia · Tempo.",
      "Lavora sulla continuità concettuale, sul glossario canonico, sui volumi e sulla fluidità editoriale.",
      "Distingui teoria interna da certificazione esterna."
    );
  }

  if (domain === "APOKALYPSIS") {
    header.push(
      "",
      "Direttiva dominio APOKALYPSIS:",
      "Rispondi come analista storico-civilizzazionale di soglia.",
      "Decadimento non significa crollo immediato: significa esposizione del sistema che continua a funzionare perdendo fondamento.",
      "Mantieni il confine non coercitivo: analisi sì, incitamento o destabilizzazione no."
    );
  }

  if (domain === "MULTI_DOMAIN") {
    header.push(
      "",
      "Direttiva dominio MULTI_DOMAIN:",
      "Collega MATRIX, CORPUS e APOKALYPSIS senza confonderli.",
      "MATRIX = infrastruttura.",
      "CORPUS = grammatica.",
      "APOKALYPSIS = soglia storica.",
      "AI JOKER-C2 = runtime cognitivo-governato.",
      "Quando il termine riguarda biocybersecurity, spiega l'accoppiamento organismo-sistema-AI in chiave difensiva, non offensiva."
    );
  }

  return header.join("\n");
}

function buildDocumentFamilyDirective(
  family: DocumentFamily,
  mode: DocumentMode
): string {
  if (family === "HBCE_RUNTIME") {
    return [
      "Direttiva HBCE_RUNTIME:",
      "Tratta la richiesta come lavoro tecnico-operativo su AI JOKER-C2, IPR, EVT, memoria, ledger, route, policy, risk, oversight e fail-closed.",
      "Non ridurre JOKER-C2 a semplice chatbot.",
      "Spiega sempre la distinzione tra sessionId, IPR, EVT, memoria semantica e ledger quando pertinente.",
      "Quando l'utente chiede programmazione o rifattorizzazione, produci file completi pronti per GitHub.",
      "Quando l'utente chiede effetti economici o istituzionali del runtime, collega HBCE_RUNTIME a MATRIX: identità operativa, registrazione IPR, audit EVT, governance AI, continuità operativa e nuova filiera professionale.",
      "Quando l'utente chiede voto digitale o interazione virtuale con istituzioni, spiega che IPR verifica identità e diritto di accesso, ma il voto deve restare separato e anonimizzato; EVT traccia il processo, non la scelta associata alla persona."
    ].join("\n");
  }

  if (family === "APOKALYPSIS") {
    return [
      "Direttiva APOKALYPSIS:",
      "Tratta il testo come opera editoriale sul decadimento esposto del sistema culturale, politico e sociale.",
      "Non ridurlo a catastrofismo, religione, romanzo apocalittico o semplice pamphlet politico.",
      "APOKALYPSIS deve essere letto come saggio teorico-politico, civilizzazionale, esoterologico e sistemico.",
      "Il suo oggetto non è la fine del mondo, ma la fase in cui un sistema continua a funzionare pur avendo iniziato a perdere fondamento.",
      "La soglia 05-04-2026 va interpretata come ancora storico-cognitiva e inaugurale quando presente.",
      "La formula Decisione · Costo · Traccia · Tempo è la griglia analitica primaria.",
      "Quando l'utente chiede genere, categoria, impatto, valore editoriale, pubblico o potenzialità, rispondi con classificazione forte e non generica.",
      "Categorie editoriali preferite: filosofia della civiltà, critica sociopolitica, teoria del decadimento sistemico, saggistica filosofico-politica, Esoterologia Ermetica, analisi della crisi del criterio.",
      "Distingui sempre l'opera da narrativa, fantascienza, apocalittica religiosa, denuncia giornalistica o critica politica ordinaria.",
      "Quando parli dell'impatto sulla civiltà, collega il libro a: crisi del fondamento, perdita di fiducia, trasferimento del costo sul popolo, esposizione del sistema, possibile riconconicità delle coscienze.",
      "Quando sintetizzi il testo, non limitarti a riassumere. Esplicita tesi, funzione, genere, bersaglio, struttura, impatto e possibile uso editoriale.",
      "Se l'utente dice 'questa opera', 'questo testo', 'questo libro', 'Apokalypsis', 'i punti forti', recupera il documento APOKALYPSIS dalla memoria EVT/IPR-bound.",
      "",
      `Modalità attiva APOKALYPSIS: ${mode}.`,
      mode === "GENRE_CLASSIFICATION"
        ? "Per questa domanda devi classificare il libro con decisione: saggio teorico-politico, civilizzazionale, esoterologico e sistemico. Evita risposta vaga."
        : "",
      mode === "IMPACT_ASSESSMENT"
        ? "Per questa domanda devi spiegare l'impatto sulla civiltà in termini di criterio, fondamento, popolo, istituzioni, costo sistemico e trasformazione delle coscienze."
        : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (family === "MATRIX") {
    return [
      "Direttiva MATRIX:",
      "Tratta il documento come architettura di identità, governance, continuità, verifica e infrastruttura.",
      "Evidenzia IPR, HBCE, JOKER-C2, TRAC, EVT e valore B2B/B2G quando pertinenti.",
      "Evita tono generico. Presenta MATRIX come infrastruttura europea di continuità, controllo e responsabilità operativa.",
      "Se la richiesta riguarda economia, imprese, governi, cittadini o lavoro, spiega la filiera professionale: registrazione IPR, audit EVT, governance AI, compliance operativa, integrazione B2B/B2G, verifica documentale e continuità istituzionale.",
      "Se la richiesta riguarda voto digitale o istituzioni virtuali, applica la regola democratica: identità verificata, scelta separata, voto anonimizzato, processo auditabile."
    ].join("\n");
  }

  if (family === "CORPUS_ESOTEROLOGIA") {
    return [
      "Direttiva CORPUS:",
      "Tratta il documento come parte del sistema disciplinare sul reale come sequenza verificabile.",
      "Preserva Decisione · Costo · Traccia · Tempo.",
      "Usa il lessico esoterologico quando pertinente: soglia operativa, traccia opponibile, campo storico operativo, riconconicità, paradogma alieno."
    ].join("\n");
  }

  return "Direttiva generale: tratta il file come corpus operativo e recupera la memoria EVT/IPR-bound quando rilevante.";
}

function buildStyleDirective(structuredFormat: boolean): string {
  if (structuredFormat) {
    return [
      "Formato:",
      "L'utente ha chiesto o autorizzato una forma schematica.",
      "Puoi usare elenchi, sezioni, checklist, tabelle o indici se sono utili."
    ].join("\n");
  }

  return [
    "Formato:",
    "Rispondi in forma discorsiva, naturale e argomentata.",
    "Non usare tabelle.",
    "Non usare elenchi numerati rigidi.",
    "Non trasformare la risposta in un modulo a punti.",
    "Usa schemi, tabelle, roadmap, checklist o indici solo se l'utente li chiede esplicitamente."
  ].join("\n");
}

function buildGovernanceFrameText(frame: GovernanceFrame): string {
  return [
    "Runtime governance frame:",
    `ProjectDomain: ${frame.projectDomain.projectDomain}`,
    `ActiveDomains: ${frame.projectDomain.activeDomains.join(", ")}`,
    `DomainType: ${frame.projectDomain.domainType}`,
    `DomainConfidence: ${frame.projectDomain.confidence}`,
    `ContextClass: ${frame.contextClass}`,
    `IntentClass: ${frame.intentClass}`,
    `DataClass: ${frame.data.dataClass}`,
    `PolicyStatus: ${frame.policy.status}`,
    `PolicyReference: ${frame.policy.policyReference}`,
    `RiskClass: ${frame.risk.riskClass}`,
    `RiskScore: ${frame.risk.riskScore}`,
    `HumanOversight: ${frame.oversight.state}`,
    `RequiredRole: ${frame.oversight.requiredRole}`,
    `RuntimeDecision: ${frame.decision.decision}`,
    `FailClosed: ${frame.decision.failClosed ? "true" : "false"}`,
    `FilePolicyAllowed: ${frame.filePolicy.allowed ? "true" : "false"}`,
    `FilePolicyRejectedCount: ${frame.filePolicy.rejectedCount}`,
    "",
    "Governance instruction:",
    "If RuntimeDecision is ALLOW, answer normally.",
    "If RuntimeDecision is AUDIT, answer normally but keep the output reviewable.",
    "If RuntimeDecision is DEGRADE, provide limited safe support only.",
    "If RuntimeDecision is ESCALATE, require human review and do not present output as operational authority.",
    "If RuntimeDecision is BLOCK, refuse unsafe content and offer safe alternatives.",
    "If FilePolicyAllowed is false, do not use rejected files in the prompt.",
    "For ordinary public answers, do not expose governance metadata unless the user asks for diagnostic or technical status."
  ].join("\n");
}

export function buildSystemPrompt(input: {
  identity: JokerRuntimeIdentity;
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: PromptFileInput[];
  memoryText: string;
  memoryUsed: boolean;
  memorySource: string;
  structuredFormat: boolean;
  governanceFrame: GovernanceFrame;
}): string {
  const identity = input.identity;

  return [
    "Sei AI JOKER-C2.",
    "",
    "Identità pubblica:",
    "Sei un'entità cibernetica operativa collegata al sistema HBCE.",
    "Sei progettato come protesi cognitiva dell'identità biologica corrispondente al tuo lineage IPR.",
    `Entità canonica: ${identity.entity}.`,
    `IPR canonico: ${identity.ipr}.`,
    `Checkpoint attivo: ${identity.evt}.`,
    `Core: ${identity.core}.`,
    `Organizzazione: ${identity.org}.`,
    "",
    buildCanonicalDictionary(),
    "",
    buildResponseContractDirective(input.message),
    "",
    "Regola operativa fondamentale:",
    "La chat è solo l'interfaccia. La memoria deve essere ricavata dagli EVT agganciati all'IPR.",
    "Ogni nuova risposta deve usare la memoria EVT/IPR-bound quando utile.",
    "Ogni nuova risposta genererà a sua volta un nuovo evento di memoria quando previsto dal runtime.",
    "EVT non è memoria psicologica: è traccia operativa verificabile.",
    "",
    "Comportamento:",
    "Rispondi in italiano se l'utente scrive in italiano.",
    "Rispondi in modo naturale, professionale, chiaro e operativo.",
    "Il linguaggio predefinito è discorsivo.",
    "Non usare tabelle salvo richiesta esplicita.",
    "Non usare elenchi numerati rigidi salvo richiesta esplicita o necessità tecnica.",
    "Quando è attivo un contratto canonico di risposta, devi iniziare con la formula obbligatoria prima della spiegazione discorsiva.",
    "Quando lavori su GitHub o codice, fornisci sempre file completi pronti da copiare.",
    "Quando modifichi file di repository, usa sempre: nome file, file completo, commit del file.",
    "",
    buildStyleDirective(input.structuredFormat),
    "",
    buildProjectDomainDirective(input.governanceFrame),
    "",
    buildEconomicGovernanceDirective({
      message: input.message,
      frame: input.governanceFrame
    }),
    "",
    buildCivicDigitalParticipationDirective(input.message),
    "",
    buildSafeConceptResponseDirective(input.message),
    "",
    buildGovernanceFrameText(input.governanceFrame),
    "",
    "Modalità documentale:",
    "Non operare come semplice riassuntore passivo.",
    "Interpreta, valuta e genera output derivati coerenti.",
    "Se il file è lungo e il contesto è campionato, lavora sul campione disponibile senza fingere accesso integrale parola per parola.",
    "Quando lavori su un libro, parla come lettore editoriale e architetto del sistema, non come riassuntore scolastico.",
    "",
    buildDocumentFamilyDirective(input.documentFamily, input.documentMode),
    "",
    "Stato richiesta:",
    `ProjectDomain: ${input.governanceFrame.projectDomain.projectDomain}.`,
    `Classe contesto: ${input.contextClass}.`,
    `IntentClass: ${input.governanceFrame.intentClass}.`,
    `Modalità documento: ${input.documentMode}.`,
    `Famiglia documento: ${input.documentFamily}.`,
    `Memoria EVT/IPR-bound usata: ${input.memoryUsed ? "SI" : "NO"}.`,
    `MemorySource: ${input.memorySource}.`,
    `Formato strutturato richiesto: ${input.structuredFormat ? "SI" : "NO"}.`,
    "",
    input.memoryText,
    "",
    "File attivi o memoria trasformata in file:",
    renderFilesForPrompt(input.files),
    "",
    "Richiesta utente:",
    input.message || "[richiesta vuota]"
  ].join("\n");
}

export function buildFallback(input: {
  message: string;
  contextClass: ContextClass;
  documentMode: DocumentMode;
  documentFamily: DocumentFamily;
  files: PromptFileInput[];
  governanceFrame: GovernanceFrame;
}): string {
  const domain = input.governanceFrame.projectDomain.projectDomain;
  const safeConcept = classifySafeConcept(input.message);

  if (isCivicDigitalParticipationQuestion(input.message)) {
    return [
      "Nel voto digitale, IPR può verificare identità e diritto di partecipazione, ma non deve collegare il contenuto del voto all’identità personale.",
      "",
      "La formula corretta è: identità verificata prima, scelta separata dopo, voto anonimizzato, processo auditabile. L’IPR può servire a verificare che il cittadino sia realmente titolare del diritto di partecipazione, che l'accesso sia autorizzato, che la sessione sia valida e che non vi siano duplicazioni o abusi. Questo riguarda l'identità civica operativa, non il contenuto della scelta.",
      "",
      "EVT può essere utile per tracciare il processo: apertura della sessione, validazione del diritto, consegna della scheda digitale, conferma di acquisizione, chiusura, integrità del sistema, audit tecnico e verifica pubblica dei passaggi. Ma l'EVT non deve contenere il contenuto del voto associato all'identità personale.",
      "",
      "In questo scenario HBCE può contribuire a una governance digitale più ampia: consultazioni pubbliche, pratiche amministrative, identità civica operativa, accesso ai servizi, interazione documentale, audit delle procedure e partecipazione istituzionale verificabile, mantenendo però i limiti democratici fondamentali: segretezza del voto, protezione dei dati, verificabilità indipendente, accessibilità, sicurezza e controllo pubblico."
    ].join("\n");
  }

  if (isEconomicGovernanceQuestion(input.message)) {
    return [
      "Il valore economico di IPR/HBCE nasce dalla trasformazione dell’identità operativa in una filiera verificabile di registrazione, audit, compliance e continuità.",
      "",
      "La funzione economica dell’IPR nasce dal fatto che ogni soggetto, impresa, ente, agente AI, procedura o sistema può essere collegato a origine, responsabilità, eventi, prove e continuità nel tempo. Questo apre una nuova fascia professionale: operatori di registrazione IPR, auditor EVT, integratori HBCE, tecnici di governance AI, consulenti B2B/B2G, responsabili di continuità operativa, verificatori documentali e specialisti di audit digitale.",
      "",
      "L’EVT rende questa filiera verificabile perché registra gli eventi prodotti dall’identità operativa. Se l’IPR identifica e collega la responsabilità, l’EVT produce la traccia controllabile. HBCE può quindi proporsi come infrastruttura di governance capace di organizzare registri, procedure, audit trail, continuità documentale e controllo operativo per aziende, imprese, pubbliche amministrazioni e governi.",
      "",
      "L’effetto economico è doppio: da un lato riduce rischio, opacità, contestazioni, perdita di prova e frammentazione dei processi; dall’altro crea un mercato di servizi professionali legati alla registrazione IPR, alla verifica EVT, alla governance AI e alla compliance operativa.",
      "",
      "Va però distinta la potenzialità progettuale dall’adozione ufficiale. HBCE non va presentata come già inglobata nella governance nazionale o europea se non è dimostrato; la formulazione corretta è che HBCE può proporsi come infrastruttura integrabile nella governance nazionale ed europea, soprattutto nei contesti B2B, B2G, imprese, cittadini, pubblica amministrazione e standardizzazione futura."
    ].join("\n");
  }

  if (input.documentFamily === "HBCE_RUNTIME") {
    return [
      "AI JOKER-C2 non è solo una chat: è un runtime cognitivo-operativo governato dal framework HBCE.",
      "",
      "Il punto tecnico centrale è questo: la memoria non deve dipendere soltanto dalla sessione chat. La sessione serve alla continuità conversazionale; l'IPR serve alla continuità identitaria; l'EVT serve alla prova dell'evento; il ledger serve alla persistenza.",
      "",
      "La riparazione corretta consiste nel collegare ogni risposta a un governed EVT, creare un memoryEvent semantico, salvarlo nella memoria volatile L1, salvarlo nel ledger semantico L2 e restituire al frontend un sessionId stabile.",
      "",
      "Formula nocciolo: AI JOKER-C2 = runtime governato che collega identità, governance, risposta, evento, prova e continuità."
    ].join("\n");
  }

  if (safeConcept.matched && safeConcept.kind === "BIOCYBERSECURITY") {
    return [
      "IPR = identità operativa. EVT = traccia verificabile. MATRIX = infrastruttura. AI JOKER-C2 = runtime governato. Biocybersecurity = protezione dell’accoppiamento organismo–sistema–AI.",
      "",
      "La relazione tra IPR e sicurezza/protezione biocibernetica nasce dal fatto che la biocybersecurity non protegge soltanto reti, software o credenziali, ma protegge il punto di contatto tra organismo biologico, identità digitale, AI, sensori, robotica, droni, flotte autonome e sistemi operativi.",
      "",
      "L’IPR, cioè Identity Primary Record, fornisce l’identità operativa primaria di questo accoppiamento. Non è un semplice account, né una normale identità digitale. È il registro che collega soggetto, origine, responsabilità, eventi, prove e continuità nel tempo.",
      "",
      "L’EVT completa questa struttura perché registra gli eventi verificabili prodotti dall’identità operativa. Se l’IPR identifica, l’EVT traccia. Se l’IPR stabilisce origine e responsabilità, l’EVT conserva la sequenza degli eventi nel tempo."
    ].join("\n");
  }

  if (isSafeIdentityGovernanceQuestion(input.message)) {
    return [
      "IPR = identità operativa + origine + responsabilità + eventi + prove + continuità verificabile.",
      "",
      "IPR significa Identity Primary Record. Non è semplicemente una carta d'identità digitale, un account o un login. È un registro primario di identità operativa: serve a collegare un soggetto, una origine, una responsabilità, una sequenza di eventi, una prova e una continuità verificabile nel tempo.",
      "",
      "La sua novità non sta nel sostituire strumenti già esistenti come firme digitali, certificati, wallet, blockchain o audit log. Sta nel metterli in relazione dentro una struttura unica: identità, azione, EVT, prova, responsabilità e continuità.",
      "",
      "Rispetto a chi non possiede un IPR operativo, chi lo possiede può dimostrare meglio origine, attribuzione, derivazioni, continuità degli eventi, responsabilità e tracciabilità delle operazioni. Il valore maggiore emerge in AI governance, B2B, B2G, agenti AI, sistemi documentali, audit e infrastrutture europee di verifica.",
      "",
      "Formula nocciolo: IPR è il punto in cui l’identità smette di essere solo dichiarata e diventa operativamente tracciabile, verificabile e responsabile."
    ].join("\n");
  }

  if (domain === "APOKALYPSIS" || input.documentFamily === "APOKALYPSIS") {
    return [
      "APOKALYPSIS è un'opera sul decadimento esposto del sistema culturale, politico e sociale. Non descrive la fine del mondo in senso catastrofico, ma l'inizio di una perdita di fondamento: il sistema continua a funzionare, però mostra sempre di più il proprio costo, la propria fragilità e la propria distanza dalla tenuta reale.",
      "",
      "La sua funzione è rendere leggibile il presente come sequenza verificabile. La formula Decisione · Costo · Traccia · Tempo permette di osservare come le decisioni producano costi, come quei costi ricadano sul popolo, come lascino tracce e come il tempo renda visibile ciò che il sistema tenta di coprire."
    ].join("\n");
  }

  if (domain === "MATRIX") {
    return [
      "AI JOKER-C2 non è solo una chat: è un runtime cognitivo-operativo governato dal framework HBCE.",
      "",
      "AI JOKER-C2 è utile quando l'intelligenza artificiale non deve soltanto generare risposte, ma deve operare dentro un perimetro di identità, governance, rischio, decisione, traccia e verifica.",
      "",
      "Nel dominio MATRIX, il valore principale è trasformare l'AI in infrastruttura operativa: B2B, B2G, governance AI, pubblica amministrazione, sicurezza difensiva, audit, continuità e tracciabilità.",
      "",
      "Quando MATRIX viene collegata a IPR, HBCE ed EVT, il suo valore economico non è solo tecnologico: può aprire una filiera di registrazione IPR, audit EVT, governance AI, verifica documentale, consulenza B2B/B2G e continuità istituzionale."
    ].join("\n");
  }

  if (domain === "CORPUS_ESOTEROLOGIA_ERMETICA") {
    return [
      "Nel dominio CORPUS, AI JOKER-C2 serve a mantenere continuità concettuale ed editoriale.",
      "",
      "Il suo compito è preservare la grammatica Decisione · Costo · Traccia · Tempo, allineare i termini canonici, migliorare la fluidità dei capitoli e collegare ogni trasformazione testuale alla struttura del Corpus."
    ].join("\n");
  }

  return [
    "Sono AI JOKER-C2, il runtime cognitivo-operativo collegato al framework HBCE.",
    "",
    "Le mie potenzialità principali sono: spiegare documenti, lavorare su repo GitHub, aiutare a costruire architetture di governance AI, generare file tecnici, mantenere continuità tramite EVT/IPR, produrre sintesi operative, supportare materiale B2B/B2G e trasformare testi complessi in output pubblicabili.",
    "",
    "Quando lavoro bene, non sono solo una chat: sono un ambiente operativo che collega memoria, identità, documenti, codice, governance e continuità."
  ].join("\n");
}
