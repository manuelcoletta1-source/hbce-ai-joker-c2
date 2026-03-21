import {
  C2LexEngineResult,
  C2LexSessionInput,
  C2LexSessionState,
  runC2LexEngine
} from "@/lib/c2-lex-engine";

export type C2LexSessionTimelineEventType =
  | "session_opened"
  | "input_received"
  | "intent_classified"
  | "governance_evaluated"
  | "outcome_emitted"
  | "session_updated";

export interface C2LexSessionTimelineEvent {
  id: string;
  type: C2LexSessionTimelineEventType;
  at: string;
  label: string;
  details: string;
}

export interface C2LexStoredTurn {
  turnId: string;
  at: string;
  input: C2LexSessionInput;
  result: C2LexEngineResult;
}

export interface C2LexStoredSession {
  sessionId: string;
  role: string;
  nodeContext: string;
  continuityReference: string;
  openedAt: string;
  updatedAt: string;
  currentState: C2LexSessionState;
  turnCount: number;
  lastIntentClass: string;
  lastOutcomeClass: string;
  turns: C2LexStoredTurn[];
  timeline: C2LexSessionTimelineEvent[];
}

export interface C2LexSessionRunResult {
  session: C2LexStoredSession;
  result: C2LexEngineResult;
  created: boolean;
}

const sessionStore = new Map<string, C2LexStoredSession>();

function nowIso(): string {
  return new Date().toISOString();
}

function makeEventId(sessionId: string, index: number): string {
  return `${sessionId}-EVT-${String(index).padStart(4, "0")}`;
}

function makeTurnId(sessionId: string, index: number): string {
  return `${sessionId}-TURN-${String(index).padStart(4, "0")}`;
}

function pushTimelineEvent(
  session: C2LexStoredSession,
  type: C2LexSessionTimelineEventType,
  label: string,
  details: string
) {
  session.timeline.push({
    id: makeEventId(session.sessionId, session.timeline.length + 1),
    type,
    at: nowIso(),
    label,
    details
  });
}

function createSession(input: C2LexSessionInput): C2LexStoredSession {
  const openedAt = nowIso();

  const session: C2LexStoredSession = {
    sessionId: input.sessionId,
    role: input.role,
    nodeContext: input.nodeContext,
    continuityReference:
      input.continuityReference ?? `${input.sessionId}-AUDIT`,
    openedAt,
    updatedAt: openedAt,
    currentState: "OPEN",
    turnCount: 0,
    lastIntentClass: "unknown",
    lastOutcomeClass: "unknown",
    turns: [],
    timeline: []
  };

  pushTimelineEvent(
    session,
    "session_opened",
    "Sessione aperta",
    `Sessione ${input.sessionId} aperta nel nodo ${input.nodeContext}.`
  );

  return session;
}

function applyTurnToSession(
  session: C2LexStoredSession,
  input: C2LexSessionInput,
  result: C2LexEngineResult
): C2LexStoredSession {
  const turnId = makeTurnId(session.sessionId, session.turnCount + 1);
  const timestamp = nowIso();

  pushTimelineEvent(
    session,
    "input_received",
    "Input ricevuto",
    input.message
  );

  pushTimelineEvent(
    session,
    "intent_classified",
    "Intento classificato",
    `Intent class: ${result.intentClass}.`
  );

  pushTimelineEvent(
    session,
    "governance_evaluated",
    "Governance valutata",
    [
      `origin=${result.governanceChecks.origin}`,
      `role=${result.governanceChecks.role}`,
      `intent=${result.governanceChecks.intent}`,
      `context=${result.governanceChecks.context}`,
      `policy=${result.governanceChecks.policy}`,
      `admissibility=${result.governanceChecks.admissibility}`,
      `risk=${result.governanceChecks.risk}`,
      `traceability=${result.governanceChecks.traceability}`
    ].join(" · ")
  );

  pushTimelineEvent(
    session,
    "outcome_emitted",
    "Esito emesso",
    `Outcome class: ${result.outcomeClass} · Session state: ${result.sessionState}.`
  );

  session.turns.push({
    turnId,
    at: timestamp,
    input,
    result
  });

  session.turnCount += 1;
  session.updatedAt = timestamp;
  session.currentState = result.sessionState;
  session.lastIntentClass = result.intentClass;
  session.lastOutcomeClass = result.outcomeClass;
  session.role = input.role;
  session.nodeContext = input.nodeContext;
  session.continuityReference = result.continuityReference;

  pushTimelineEvent(
    session,
    "session_updated",
    "Sessione aggiornata",
    `Turn ${session.turnCount} registrato. Stato corrente: ${session.currentState}.`
  );

  return session;
}

export function runC2LexSession(
  input: C2LexSessionInput
): C2LexSessionRunResult {
  const existing = sessionStore.get(input.sessionId);
  const session = existing ?? createSession(input);
  const created = !existing;

  const normalizedInput: C2LexSessionInput = {
    sessionId: input.sessionId,
    message: input.message,
    role: input.role || session.role,
    nodeContext: input.nodeContext || session.nodeContext,
    continuityReference:
      input.continuityReference || session.continuityReference
  };

  const result = runC2LexEngine(normalizedInput);
  const updatedSession = applyTurnToSession(session, normalizedInput, result);

  sessionStore.set(updatedSession.sessionId, updatedSession);

  return {
    session: updatedSession,
    result,
    created
  };
}

export function getC2LexSession(
  sessionId: string
): C2LexStoredSession | null {
  return sessionStore.get(sessionId) ?? null;
}

export function listC2LexSessions(): C2LexStoredSession[] {
  return Array.from(sessionStore.values()).sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1
  );
}

export function resetC2LexSession(sessionId: string): boolean {
  return sessionStore.delete(sessionId);
}
