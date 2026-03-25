import {
  getC2LexSession,
  listC2LexSessions,
  type C2LexStoredSession
} from "../c2-lex-session-store";

import type {
  HBCEContinuityRef,
  HBCEContinuityStatus
} from "./node-types";

function mapSessionToContinuity(
  session: C2LexStoredSession
): HBCEContinuityRef {
  return {
    continuity_reference: session.continuityReference,
    session_id: session.sessionId,
    current_state: session.currentState,
    turn_count: session.turnCount,
    last_intent_class: session.lastIntentClass,
    last_outcome_class: session.lastOutcomeClass,
    updated_at: session.updatedAt
  };
}

function mapStateToContinuityStatus(
  state?: string
): HBCEContinuityStatus {
  switch (state) {
    case "OPEN":
    case "LISTENING":
    case "INTERPRETING":
    case "CONTEXTUALIZING":
    case "VALIDATING":
    case "RESPONDING":
    case "AUDIT-LINKED":
      return "STABLE";

    case "WAITING_CONFIRMATION":
      return "LIMITED";

    case "ESCALATED":
      return "DEGRADED";

    case "BLOCKED":
      return "BROKEN";

    case "CLOSED":
      return "STABLE";

    default:
      return "UNKNOWN";
  }
}

export function nodeGetContinuityBySessionId(
  sessionId: string
): HBCEContinuityRef | null {
  const session = getC2LexSession(sessionId);

  if (!session) {
    return null;
  }

  return mapSessionToContinuity(session);
}

export function nodeListContinuities(): HBCEContinuityRef[] {
  return listC2LexSessions().map(mapSessionToContinuity);
}

export function nodeGetLatestContinuity(): HBCEContinuityRef | null {
  const sessions = listC2LexSessions();
  const latest = sessions[0];

  if (!latest) {
    return null;
  }

  return mapSessionToContinuity(latest);
}

export function nodeGetContinuityStatus(): HBCEContinuityStatus {
  const latest = nodeGetLatestContinuity();

  if (!latest) {
    return "UNKNOWN";
  }

  return mapStateToContinuityStatus(latest.current_state);
}

export function nodeGetContinuitySummary(): {
  continuity_status: HBCEContinuityStatus;
  active_sessions: number;
  latest: HBCEContinuityRef | null;
} {
  const all = nodeListContinuities();
  const latest = all[0] ?? null;

  return {
    continuity_status: latest
      ? mapStateToContinuityStatus(latest.current_state)
      : "UNKNOWN",
    active_sessions: all.length,
    latest
  };
}
