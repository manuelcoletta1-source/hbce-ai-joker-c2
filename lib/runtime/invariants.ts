import {
  RUNTIME_ARCHITECTURE,
  type RuntimeModuleId,
} from "./architecture";

export type InvariantSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type InvariantPhase =
  | "DESIGN"
  | "PRE_RUN"
  | "IN_RUN"
  | "POST_RUN"
  | "AUDIT";

export type InvariantStatus =
  | "PASS"
  | "FAIL"
  | "NOT_APPLICABLE";

export interface InvariantContext {
  moduleId: RuntimeModuleId;

  iprId?: string | null;
  ownerId?: string | null;
  previousOwnerId?: string | null;

  authorityGranted?: boolean;
  authorityExpiresAt?: string | null;
  authorityRevoked?: boolean;

  missionId?: string | null;
  missionState?: string | null;
  primaryObjective?: string | null;

  eventId?: string | null;
  previousEventId?: string | null;
  previousAnchorHash?: string | null;

  occurredAt?: string | null;
  recordedAt?: string | null;
  currentTime?: string | null;

  evidenceRefs?: readonly string[];
  counterEvidenceRefs?: readonly string[];

  opcId?: string | null;
  opcHash?: string | null;

  memoryWriteRequested?: boolean;
  memoryAuthorized?: boolean;

  metaExchangeRequested?: boolean;
  recipientVerified?: boolean;
  dataClassification?: string | null;

  humanApprovalRequired?: boolean;
  humanApprovalGranted?: boolean;

  runtimeStarted?: boolean;
  cyberGatePassed?: boolean;
  qivGatePassed?: boolean;
  diabloGatePassed?: boolean;

  neuroLoopChangeRequested?: boolean;

  metadata?: Readonly<Record<string, unknown>>;
}

export interface InvariantDefinition {
  id: string;
  moduleId: RuntimeModuleId;
  title: string;
  description: string;
  severity: InvariantSeverity;
  phases: readonly InvariantPhase[];
  evaluate: (context: InvariantContext) => boolean;
  violationCode: string;
}

export interface InvariantResult {
  invariantId: string;
  moduleId: RuntimeModuleId;
  title: string;
  severity: InvariantSeverity;
  status: InvariantStatus;
  violationCode: string | null;
  description: string;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function parseDate(value: string | null | undefined): number | null {
  if (!hasText(value)) {
    return null;
  }

  const timestamp = Date.parse(value as string);

  return Number.isNaN(timestamp) ? null : timestamp;
}

export const RUNTIME_INVARIANTS: readonly InvariantDefinition[] = [
  {
    id: "IPR_OWNER_IMMUTABLE",
    moduleId: "IPR",
    title: "IPR owner immutabile",
    description:
      "Il proprietario canonico di un IPR non può essere sostituito silenziosamente.",
    severity: "CRITICAL",
    phases: ["DESIGN", "PRE_RUN", "AUDIT"],
    violationCode: "IPR_OWNER_CHANGED",
    evaluate: (context) => {
      if (
        !hasText(context.previousOwnerId) ||
        !hasText(context.ownerId)
      ) {
        return true;
      }

      return context.previousOwnerId === context.ownerId;
    },
  },

  {
    id: "IPR_ID_REQUIRED",
    moduleId: "IPR",
    title: "IPR richiesto",
    description:
      "Nessuna operazione governata può procedere senza un identificatore IPR.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN", "POST_RUN", "AUDIT"],
    violationCode: "IPR_ID_MISSING",
    evaluate: (context) => hasText(context.iprId),
  },

  {
    id: "AUTHORITY_REQUIRED_BEFORE_RUNTIME",
    moduleId: "AUTHORITY",
    title: "Authority prima del runtime",
    description:
      "Il runtime non può iniziare senza autorità esplicitamente concessa.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN"],
    violationCode: "AUTHORITY_NOT_GRANTED",
    evaluate: (context) => {
      if (!context.runtimeStarted) {
        return true;
      }

      return context.authorityGranted === true;
    },
  },

  {
    id: "AUTHORITY_NOT_REVOKED",
    moduleId: "AUTHORITY",
    title: "Authority non revocata",
    description:
      "Un runtime attivo deve arrestarsi quando l'autorità viene revocata.",
    severity: "CRITICAL",
    phases: ["IN_RUN"],
    violationCode: "AUTHORITY_REVOKED_DURING_RUNTIME",
    evaluate: (context) => {
      if (!context.runtimeStarted) {
        return true;
      }

      return context.authorityRevoked !== true;
    },
  },

  {
    id: "AUTHORITY_NOT_EXPIRED",
    moduleId: "AUTHORITY",
    title: "Authority non scaduta",
    description:
      "Un'autorità temporanea non può essere utilizzata oltre la propria scadenza.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN"],
    violationCode: "AUTHORITY_EXPIRED",
    evaluate: (context) => {
      const expiresAt = parseDate(context.authorityExpiresAt);
      const now =
        parseDate(context.currentTime) ??
        Date.now();

      if (expiresAt === null) {
        return true;
      }

      return expiresAt >= now;
    },
  },

  {
    id: "MISSION_ID_REQUIRED",
    moduleId: "MISSION",
    title: "Missione identificata",
    description:
      "Ogni esecuzione deve appartenere a una missione identificabile.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN", "POST_RUN", "AUDIT"],
    violationCode: "MISSION_ID_MISSING",
    evaluate: (context) => hasText(context.missionId),
  },

  {
    id: "MISSION_PRIMARY_OBJECTIVE_REQUIRED",
    moduleId: "MISSION",
    title: "Obiettivo primario richiesto",
    description:
      "Una missione non può essere autorizzata senza un obiettivo primario dichiarato.",
    severity: "HIGH",
    phases: ["PRE_RUN"],
    violationCode: "MISSION_PRIMARY_OBJECTIVE_MISSING",
    evaluate: (context) => hasText(context.primaryObjective),
  },

  {
    id: "MISSION_CANNOT_RUN_WITHOUT_AUTHORITY",
    moduleId: "MISSION",
    title: "Missione subordinata all'autorità",
    description:
      "Lo stato RUNNING richiede autorità valida.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN"],
    violationCode: "MISSION_RUNNING_WITHOUT_AUTHORITY",
    evaluate: (context) => {
      if (context.missionState !== "RUNNING") {
        return true;
      }

      return (
        context.authorityGranted === true &&
        context.authorityRevoked !== true
      );
    },
  },

  {
    id: "UNEBDO_OCCURRED_NOT_IN_FUTURE",
    moduleId: "UNEBDO_ANCHOR",
    title: "Evento non futuro",
    description:
      "Un evento osservato non può avere un occurredAt successivo al tempo corrente.",
    severity: "HIGH",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "UNEBDO_OCCURRED_AT_IN_FUTURE",
    evaluate: (context) => {
      const occurredAt = parseDate(context.occurredAt);
      const now =
        parseDate(context.currentTime) ??
        Date.now();

      if (occurredAt === null) {
        return false;
      }

      return occurredAt <= now;
    },
  },

  {
    id: "UNEBDO_RECORDED_AFTER_OCCURRED",
    moduleId: "UNEBDO_ANCHOR",
    title: "Registrazione successiva all'evento",
    description:
      "recordedAt non può precedere occurredAt.",
    severity: "HIGH",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "UNEBDO_RECORDED_BEFORE_OCCURRED",
    evaluate: (context) => {
      const occurredAt = parseDate(context.occurredAt);
      const recordedAt = parseDate(context.recordedAt);

      if (occurredAt === null || recordedAt === null) {
        return false;
      }

      return recordedAt >= occurredAt;
    },
  },

  {
    id: "UNEBDO_PREVIOUS_HASH_REQUIRED",
    moduleId: "UNEBDO_ANCHOR",
    title: "Continuità hash richiesta",
    description:
      "Un evento non iniziale deve riferire l'hash dell'anchor precedente.",
    severity: "HIGH",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "UNEBDO_PREVIOUS_HASH_MISSING",
    evaluate: (context) => {
      if (!hasText(context.previousEventId)) {
        return true;
      }

      return hasText(context.previousAnchorHash);
    },
  },

  {
    id: "RUNTIME_REQUIRES_QIV_GATE",
    moduleId: "QIV",
    title: "QIV prima dell'esecuzione",
    description:
      "Il runtime non può partire se il gate QIV non è stato superato.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN"],
    violationCode: "QIV_GATE_NOT_PASSED",
    evaluate: (context) => {
      if (!context.runtimeStarted) {
        return true;
      }

      return context.qivGatePassed === true;
    },
  },

  {
    id: "RUNTIME_REQUIRES_DIABLO_GATE",
    moduleId: "DIABLO",
    title: "DIABLO prima dell'esecuzione",
    description:
      "Il runtime non può partire senza una decisione ALLOW valida.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN"],
    violationCode: "DIABLO_GATE_NOT_PASSED",
    evaluate: (context) => {
      if (!context.runtimeStarted) {
        return true;
      }

      return context.diabloGatePassed === true;
    },
  },

  {
    id: "RUNTIME_REQUIRES_CYBER_GATE",
    moduleId: "CYBERGLOBAL_PRE_GATE",
    title: "CyberGlobal prima dell'esecuzione",
    description:
      "Il runtime non può partire senza readiness cyber positiva.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN"],
    violationCode: "CYBER_GATE_NOT_PASSED",
    evaluate: (context) => {
      if (!context.runtimeStarted) {
        return true;
      }

      return context.cyberGatePassed === true;
    },
  },

  {
    id: "EVT_ID_REQUIRED_POST_RUN",
    moduleId: "EVT",
    title: "EVT obbligatorio dopo l'esecuzione",
    description:
      "Ogni esecuzione avviata deve produrre un identificatore EVT.",
    severity: "CRITICAL",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "EVT_ID_MISSING",
    evaluate: (context) => {
      if (!context.runtimeStarted) {
        return true;
      }

      return hasText(context.eventId);
    },
  },

  {
    id: "OPC_REQUIRES_EVT",
    moduleId: "OPC",
    title: "OPC subordinato a EVT",
    description:
      "Una ricevuta OPC non può esistere senza evento associato.",
    severity: "CRITICAL",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "OPC_WITHOUT_EVT",
    evaluate: (context) => {
      if (!hasText(context.opcId)) {
        return true;
      }

      return hasText(context.eventId);
    },
  },

  {
    id: "OPC_HASH_REQUIRED",
    moduleId: "OPC",
    title: "Hash OPC richiesto",
    description:
      "Ogni OPC emesso deve possedere un hash tecnico non vuoto.",
    severity: "CRITICAL",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "OPC_HASH_MISSING",
    evaluate: (context) => {
      if (!hasText(context.opcId)) {
        return true;
      }

      return hasText(context.opcHash);
    },
  },

  {
    id: "CLAIM_EVIDENCE_REQUIRED",
    moduleId: "CLAIM_EVIDENCE",
    title: "Evidenza richiesta per i claim",
    description:
      "Un claim verificabile deve riferire almeno un'evidenza.",
    severity: "HIGH",
    phases: ["PRE_RUN", "POST_RUN", "AUDIT"],
    violationCode: "CLAIM_WITHOUT_EVIDENCE",
    evaluate: (context) => {
      const claimDeclared =
        context.metadata?.claimDeclared === true;

      if (!claimDeclared) {
        return true;
      }

      return (
        Array.isArray(context.evidenceRefs) &&
        context.evidenceRefs.length > 0
      );
    },
  },

  {
    id: "MEMORY_WRITE_REQUIRES_AUTHORIZATION",
    moduleId: "MEMORY",
    title: "Scrittura memoria autorizzata",
    description:
      "Nessuna memoria può essere scritta senza autorizzazione esplicita.",
    severity: "CRITICAL",
    phases: ["POST_RUN"],
    violationCode: "MEMORY_WRITE_UNAUTHORIZED",
    evaluate: (context) => {
      if (!context.memoryWriteRequested) {
        return true;
      }

      return context.memoryAuthorized === true;
    },
  },

  {
    id: "METAEXCHANGE_REQUIRES_VERIFIED_RECIPIENT",
    moduleId: "METAEXCHANGE",
    title: "Destinatario verificato",
    description:
      "MetaExchange non può trasferire dati verso un destinatario non verificato.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN", "POST_RUN"],
    violationCode: "METAEXCHANGE_RECIPIENT_NOT_VERIFIED",
    evaluate: (context) => {
      if (!context.metaExchangeRequested) {
        return true;
      }

      return context.recipientVerified === true;
    },
  },

  {
    id: "METAEXCHANGE_REQUIRES_CLASSIFICATION",
    moduleId: "METAEXCHANGE",
    title: "Classificazione dati richiesta",
    description:
      "Ogni trasferimento deve dichiarare la classificazione dei dati.",
    severity: "HIGH",
    phases: ["PRE_RUN", "POST_RUN"],
    violationCode: "METAEXCHANGE_CLASSIFICATION_MISSING",
    evaluate: (context) => {
      if (!context.metaExchangeRequested) {
        return true;
      }

      return hasText(context.dataClassification);
    },
  },

  {
    id: "NEUROLOOP_REQUIRES_HUMAN_APPROVAL",
    moduleId: "NEUROLOOP",
    title: "NeuroLoop subordinato al controllo umano",
    description:
      "Una modifica proposta da NeuroLoop non può essere applicata senza approvazione umana.",
    severity: "CRITICAL",
    phases: ["POST_RUN", "AUDIT"],
    violationCode: "NEUROLOOP_CHANGE_WITHOUT_HUMAN_APPROVAL",
    evaluate: (context) => {
      if (!context.neuroLoopChangeRequested) {
        return true;
      }

      return context.humanApprovalGranted === true;
    },
  },

  {
    id: "HUMAN_GATE_MUST_BE_SATISFIED",
    moduleId: "HUMAN_OVERSIGHT",
    title: "Human gate obbligatorio",
    description:
      "Quando il sistema richiede controllo umano, l'operazione non può proseguire senza approvazione.",
    severity: "CRITICAL",
    phases: ["PRE_RUN", "IN_RUN", "POST_RUN"],
    violationCode: "HUMAN_APPROVAL_MISSING",
    evaluate: (context) => {
      if (!context.humanApprovalRequired) {
        return true;
      }

      return context.humanApprovalGranted === true;
    },
  },
] as const;

export function evaluateInvariant(
  invariant: InvariantDefinition,
  context: InvariantContext,
): InvariantResult {
  if (invariant.moduleId !== context.moduleId) {
    return {
      invariantId: invariant.id,
      moduleId: invariant.moduleId,
      title: invariant.title,
      severity: invariant.severity,
      status: "NOT_APPLICABLE",
      violationCode: null,
      description: invariant.description,
    };
  }

  let passed = false;

  try {
    passed = invariant.evaluate(context);
  } catch {
    passed = false;
  }

  return {
    invariantId: invariant.id,
    moduleId: invariant.moduleId,
    title: invariant.title,
    severity: invariant.severity,
    status: passed ? "PASS" : "FAIL",
    violationCode: passed
      ? null
      : invariant.violationCode,
    description: invariant.description,
  };
}

export function evaluateModuleInvariants(
  context: InvariantContext,
  phase?: InvariantPhase,
): InvariantResult[] {
  return RUNTIME_INVARIANTS
    .filter(
      (invariant) =>
        invariant.moduleId === context.moduleId &&
        (!phase || invariant.phases.includes(phase)),
    )
    .map((invariant) =>
      evaluateInvariant(invariant, context),
    );
}

export function evaluateAllInvariants(
  contexts: readonly InvariantContext[],
  phase?: InvariantPhase,
): InvariantResult[] {
  return contexts.flatMap((context) =>
    evaluateModuleInvariants(context, phase),
  );
}

export function hasCriticalInvariantFailure(
  results: readonly InvariantResult[],
): boolean {
  return results.some(
    (result) =>
      result.status === "FAIL" &&
      result.severity === "CRITICAL",
  );
}

export function assertNoCriticalInvariantFailure(
  results: readonly InvariantResult[],
): void {
  const criticalFailures = results.filter(
    (result) =>
      result.status === "FAIL" &&
      result.severity === "CRITICAL",
  );

  if (criticalFailures.length === 0) {
    return;
  }

  const violations = criticalFailures
    .map(
      (failure) =>
        `${failure.moduleId}:${failure.violationCode}`,
    )
    .join(", ");

  throw new Error(
    `HBCE_INVARIANT_VIOLATION:${violations}`,
  );
}

export function validateInvariantRegistry(): string[] {
  const errors: string[] = [];
  const knownModuleIds = new Set(
    Object.keys(RUNTIME_ARCHITECTURE),
  );
  const invariantIds = new Set<string>();

  for (const invariant of RUNTIME_INVARIANTS) {
    if (invariantIds.has(invariant.id)) {
      errors.push(
        `DUPLICATE_INVARIANT_ID:${invariant.id}`,
      );
    }

    invariantIds.add(invariant.id);

    if (!knownModuleIds.has(invariant.moduleId)) {
      errors.push(
        `UNKNOWN_INVARIANT_MODULE:${invariant.moduleId}`,
      );
    }

    if (!invariant.title.trim()) {
      errors.push(
        `INVARIANT_TITLE_REQUIRED:${invariant.id}`,
      );
    }

    if (!invariant.description.trim()) {
      errors.push(
        `INVARIANT_DESCRIPTION_REQUIRED:${invariant.id}`,
      );
    }

    if (!invariant.violationCode.trim()) {
      errors.push(
        `INVARIANT_VIOLATION_CODE_REQUIRED:${invariant.id}`,
      );
    }

    if (invariant.phases.length === 0) {
      errors.push(
        `INVARIANT_PHASE_REQUIRED:${invariant.id}`,
      );
    }
  }

  return errors;
}
