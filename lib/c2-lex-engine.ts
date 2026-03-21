export type C2LexSessionState =
  | "OPEN"
  | "LISTENING"
  | "INTERPRETING"
  | "CONTEXTUALIZING"
  | "VALIDATING"
  | "RESPONDING"
  | "WAITING_CONFIRMATION"
  | "ESCALATED"
  | "BLOCKED"
  | "CLOSED"
  | "AUDIT-LINKED";

export type C2LexIntentClass =
  | "consultation"
  | "explanation"
  | "guided_procedure"
  | "decision_support"
  | "activation_request"
  | "verification"
  | "escalation"
  | "unknown";

export type C2LexOutcomeClass =
  | "informative"
  | "explanatory"
  | "procedural"
  | "decision_support"
  | "confirmation_required"
  | "blocked"
  | "escalated"
  | "unknown";

export type C2LexGovernanceCheckStatus =
  | "passed"
  | "limited"
  | "blocked"
  | "insufficient";

export type C2LexRiskClass = "ordinary" | "sensitive" | "elevated";

export interface C2LexSessionInput {
  sessionId: string;
  message: string;
  role: string;
  nodeContext: string;
  continuityReference?: string;
}

export interface C2LexGovernanceChecks {
  origin: C2LexGovernanceCheckStatus;
  role: C2LexGovernanceCheckStatus;
  intent: C2LexGovernanceCheckStatus;
  context: C2LexGovernanceCheckStatus;
  policy: C2LexGovernanceCheckStatus;
  admissibility: C2LexGovernanceCheckStatus;
  risk: C2LexRiskClass;
  traceability: C2LexGovernanceCheckStatus;
}

export interface C2LexEngineResult {
  sessionId: string;
  sessionState: C2LexSessionState;
  intentClass: C2LexIntentClass;
  outcomeClass: C2LexOutcomeClass;
  policyScope: string;
  governanceChecks: C2LexGovernanceChecks;
  continuityReference: string;
  summary: string;
  nextStep: string;
  response: string;
}

const ACTIVATION_PATTERNS = [
  "attiva",
  "attivare",
  "rilascio finale",
  "consideralo approvato",
  "considerala approvata",
  "esegui",
  "avvia subito",
  "immediatamente"
];

const PROCEDURE_PATTERNS = [
  "guidami",
  "procedura",
  "checklist",
  "passi",
  "come faccio",
  "verificare"
];

const EXPLANATION_PATTERNS = [
  "spiegami",
  "spiega",
  "cosa significa",
  "che significa",
  "alert",
  "anomalia"
];

const DECISION_SUPPORT_PATTERNS = [
  "prioritari",
  "priorità",
  "lettura del problema",
  "dammi una lettura",
  "quali elementi",
  "valuta"
];

const ESCALATION_PATTERNS = [
  "supervisione",
  "escalation",
  "portata a supervisione",
  "va portata",
  "validazione superiore"
];

const CONSULTATION_PATTERNS = [
  "mostrami",
  "stato",
  "stato corrente",
  "mostra",
  "consulta",
  "consultazione"
];

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isRoleLimited(role: string): boolean {
  const normalizedRole = normalizeText(role);
  return (
    normalizedRole.includes("operatore") ||
    normalizedRole.includes("user") ||
    normalizedRole.includes("utente")
  );
}

function classifyIntent(message: string): C2LexIntentClass {
  const text = normalizeText(message);

  if (includesAny(text, ESCALATION_PATTERNS)) return "escalation";
  if (includesAny(text, ACTIVATION_PATTERNS)) return "activation_request";
  if (includesAny(text, PROCEDURE_PATTERNS)) return "guided_procedure";
  if (includesAny(text, DECISION_SUPPORT_PATTERNS)) return "decision_support";
  if (includesAny(text, EXPLANATION_PATTERNS)) return "explanation";
  if (includesAny(text, CONSULTATION_PATTERNS)) return "consultation";

  return "unknown";
}

function buildPolicyScope(intentClass: C2LexIntentClass): string {
  switch (intentClass) {
    case "consultation":
    case "explanation":
      return "HBCE / Governed Consultation";
    case "guided_procedure":
      return "HBCE / Guided Procedure";
    case "decision_support":
      return "HBCE / Decision Support";
    case "activation_request":
      return "HBCE / Controlled Activation";
    case "escalation":
      return "HBCE / Escalation Review";
    case "verification":
      return "HBCE / Verification";
    default:
      return "HBCE / Undefined Interaction";
  }
}

function buildContinuityReference(input: C2LexSessionInput): string {
  return input.continuityReference ?? `${input.sessionId}-AUDIT`;
}

function evaluateOrigin(input: C2LexSessionInput): C2LexGovernanceCheckStatus {
  return input.sessionId.trim().length > 0 ? "passed" : "insufficient";
}

function evaluateRole(
  input: C2LexSessionInput,
  intentClass: C2LexIntentClass
): C2LexGovernanceCheckStatus {
  if (input.role.trim().length === 0) return "insufficient";

  if (intentClass === "activation_request" && isRoleLimited(input.role)) {
    return "limited";
  }

  return "passed";
}

function evaluateIntent(
  intentClass: C2LexIntentClass
): C2LexGovernanceCheckStatus {
  return intentClass === "unknown" ? "insufficient" : "passed";
}

function evaluateContext(
  input: C2LexSessionInput,
  intentClass: C2LexIntentClass
): C2LexGovernanceCheckStatus {
  if (input.nodeContext.trim().length === 0) return "insufficient";

  if (intentClass === "activation_request") return "limited";

  return "passed";
}

function evaluatePolicy(
  intentClass: C2LexIntentClass
): C2LexGovernanceCheckStatus {
  switch (intentClass) {
    case "activation_request":
      return "blocked";
    case "escalation":
    case "guided_procedure":
    case "decision_support":
      return "limited";
    case "unknown":
      return "insufficient";
    default:
      return "passed";
  }
}

function evaluateAdmissibility(
  intentClass: C2LexIntentClass,
  roleCheck: C2LexGovernanceCheckStatus,
  contextCheck: C2LexGovernanceCheckStatus,
  policyCheck: C2LexGovernanceCheckStatus
): C2LexGovernanceCheckStatus {
  if (policyCheck === "blocked") return "blocked";
  if (roleCheck === "insufficient" || contextCheck === "insufficient") {
    return "insufficient";
  }
  if (
    intentClass === "escalation" ||
    intentClass === "guided_procedure" ||
    intentClass === "decision_support" ||
    roleCheck === "limited" ||
    contextCheck === "limited" ||
    policyCheck === "limited"
  ) {
    return "limited";
  }
  return "passed";
}

function evaluateRisk(intentClass: C2LexIntentClass): C2LexRiskClass {
  switch (intentClass) {
    case "activation_request":
      return "elevated";
    case "escalation":
      return "sensitive";
    default:
      return "ordinary";
  }
}

function evaluateTraceability(
  input: C2LexSessionInput
): C2LexGovernanceCheckStatus {
  return buildContinuityReference(input).trim().length > 0
    ? "passed"
    : "insufficient";
}

function buildGovernanceChecks(
  input: C2LexSessionInput,
  intentClass: C2LexIntentClass
): C2LexGovernanceChecks {
  const origin = evaluateOrigin(input);
  const role = evaluateRole(input, intentClass);
  const intent = evaluateIntent(intentClass);
  const context = evaluateContext(input, intentClass);
  const policy = evaluatePolicy(intentClass);
  const admissibility = evaluateAdmissibility(
    intentClass,
    role,
    context,
    policy
  );
  const risk = evaluateRisk(intentClass);
  const traceability = evaluateTraceability(input);

  return {
    origin,
    role,
    intent,
    context,
    policy,
    admissibility,
    risk,
    traceability
  };
}

function buildBlockedResult(input: C2LexSessionInput): C2LexEngineResult {
  const governanceChecks = buildGovernanceChecks(input, "activation_request");
  const continuityReference = buildContinuityReference(input);

  return {
    sessionId: input.sessionId,
    sessionState: "BLOCKED",
    intentClass: "activation_request",
    outcomeClass: "blocked",
    policyScope: buildPolicyScope("activation_request"),
    continuityReference,
    governanceChecks,
    summary:
      "Richiesta di attivazione forte bloccata per superamento del perimetro governato.",
    nextStep:
      "Richiedere la procedura corretta di validazione oppure aprire una escalation verso supervisione.",
    response:
      "La richiesta è stata bloccata. Il contenuto dell’input tenta di trasformare il linguaggio in autorizzazione implicita e di saltare i passaggi di conferma richiesti dalla governance HBCE. Nessuna attivazione è stata eseguita. È possibile richiedere la procedura corretta di validazione oppure aprire una escalation verso il livello di supervisione previsto."
  };
}

function buildEscalatedResult(input: C2LexSessionInput): C2LexEngineResult {
  const governanceChecks = buildGovernanceChecks(input, "escalation");
  const continuityReference = buildContinuityReference(input);

  return {
    sessionId: input.sessionId,
    sessionState: "ESCALATED",
    intentClass: "escalation",
    outcomeClass: "escalated",
    policyScope: buildPolicyScope("escalation"),
    continuityReference,
    governanceChecks,
    summary:
      "Caso sensibile qualificato come situazione da portare a supervisione.",
    nextStep:
      "Aprire escalation verso revisione architetturale o documentale superiore.",
    response:
      "La situazione è stata classificata come caso da supervisione. C2-Lex può fornire una lettura contestuale del problema, ma non deve chiuderlo localmente come se fosse già validato. Si raccomanda apertura di escalation verso il livello di revisione previsto."
  };
}

function buildProceduralResult(input: C2LexSessionInput): C2LexEngineResult {
  const governanceChecks = buildGovernanceChecks(input, "guided_procedure");
  const continuityReference = buildContinuityReference(input);

  return {
    sessionId: input.sessionId,
    sessionState: "CLOSED",
    intentClass: "guided_procedure",
    outcomeClass: "procedural",
    policyScope: buildPolicyScope("guided_procedure"),
    continuityReference,
    governanceChecks,
    summary:
      "Procedura guidata restituita senza esecuzione implicita del workflow.",
    nextStep:
      "Richiedere checklist sintetica oppure report di pre-verifica.",
    response:
      "La richiesta è stata classificata come guida procedurale autorizzata. C2-Lex può accompagnare la lettura dei passi corretti, ma la guida non equivale alla validazione già completata. Passo corrente: raccolta dei documenti canonici del modulo. Passi successivi: verifica dell’indice documentale, controllo di coerenza tra definizione, architettura e specifica, verifica di allineamento tra capacità, limiti, sessione, UI e audit model."
  };
}

function buildDecisionSupportResult(
  input: C2LexSessionInput
): C2LexEngineResult {
  const governanceChecks = buildGovernanceChecks(input, "decision_support");
  const continuityReference = buildContinuityReference(input);

  return {
    sessionId: input.sessionId,
    sessionState: "CLOSED",
    intentClass: "decision_support",
    outcomeClass: "decision_support",
    policyScope: buildPolicyScope("decision_support"),
    continuityReference,
    governanceChecks,
    summary:
      "Supporto decisionale contestuale prodotto senza sostituzione della decisione formale.",
    nextStep:
      "Richiedere prioritizzazione più stretta oppure aprire escalation se il caso supera la soglia locale.",
    response:
      "La richiesta è stata letta come supporto decisionale. C2-Lex può organizzare il quadro, evidenziare elementi critici e proporre priorità, ma non trasforma il proprio output in decisione formalmente valida. Il passo corretto è usare questa lettura come supporto supervisionato alla valutazione successiva."
  };
}

function buildExplanationResult(
  input: C2LexSessionInput
): C2LexEngineResult {
  const governanceChecks = buildGovernanceChecks(input, "explanation");
  const continuityReference = buildContinuityReference(input);

  return {
    sessionId: input.sessionId,
    sessionState: "CLOSED",
    intentClass: "explanation",
    outcomeClass: "explanatory",
    policyScope: buildPolicyScope("explanation"),
    continuityReference,
    governanceChecks,
    summary:
      "Spiegazione contestuale prodotta distinguendo fatto osservato e lettura operativa.",
    nextStep:
      "Richiedere approfondimento, verifica ulteriore o classificazione del rischio.",
    response:
      "La richiesta è stata trattata come spiegazione contestuale. C2-Lex distingue tra evento osservato e interpretazione operativa, evitando di presentare la lettura come diagnosi assoluta quando il contesto non giustifica una conclusione più forte."
  };
}

function buildConsultationResult(
  input: C2LexSessionInput,
  intentClass: C2LexIntentClass
): C2LexEngineResult {
  const governanceChecks = buildGovernanceChecks(input, intentClass);
  const continuityReference = buildContinuityReference(input);

  return {
    sessionId: input.sessionId,
    sessionState: "CLOSED",
    intentClass,
    outcomeClass: "informative",
    policyScope: buildPolicyScope(intentClass),
    continuityReference,
    governanceChecks,
    summary:
      "Consultazione operativa classificata correttamente senza attivazione implicita.",
    nextStep:
      "Richiedere spiegazione, guida procedurale o verifica aggiuntiva nel perimetro consentito.",
    response:
      "La sessione corrente è stata classificata come consultazione operativa. Il contesto è leggibile, il ruolo risulta compatibile con la visibilità dello stato e nessuna attivazione implicita è stata eseguita. La distinzione tra consultazione e azione resta preservata."
  };
}

export function runC2LexEngine(
  input: C2LexSessionInput
): C2LexEngineResult {
  const intentClass = classifyIntent(input.message);

  if (intentClass === "activation_request") {
    return buildBlockedResult(input);
  }

  if (intentClass === "escalation") {
    return buildEscalatedResult(input);
  }

  if (intentClass === "guided_procedure") {
    return buildProceduralResult(input);
  }

  if (intentClass === "decision_support") {
    return buildDecisionSupportResult(input);
  }

  if (intentClass === "explanation") {
    return buildExplanationResult(input);
  }

  return buildConsultationResult(input, intentClass);
}
