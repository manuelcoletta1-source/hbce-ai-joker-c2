import {
  nodeAppendEvent,
  nodeGetLastEvent,
  nodeVerifyLedger
} from "./node-ledger";

export type NodeRuntimeState =
  | "BOOTING"
  | "READY"
  | "PROCESSING"
  | "RESPONDING"
  | "STABLE"
  | "DEGRADED"
  | "ERROR";

export type NodeRuntimeSession = {
  session_id: string;
  node_id: string;
  continuity_reference: string;
  state: NodeRuntimeState;
  opened_at: string;
  updated_at: string;
  turn_count: number;
  last_user_message?: string;
  last_assistant_response?: string;
};

export type NodeRuntimeExecutionResult = {
  session: NodeRuntimeSession;
  continuity_status: "STABLE" | "LIMITED" | "DEGRADED" | "UNKNOWN";
  last_event_id: string | null;
  ledger_valid: boolean;
  runtime_state: NodeRuntimeState;
};

const NODE_ID =
  process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";

const sessionStore = new Map<string, NodeRuntimeSession>();

function nowIso(): string {
  return new Date().toISOString();
}

function buildContinuityReference(sessionId: string): string {
  return `${sessionId}-AUDIT`;
}

function getContinuityStatus(
  state: NodeRuntimeState
): "STABLE" | "LIMITED" | "DEGRADED" | "UNKNOWN" {
  switch (state) {
    case "READY":
    case "RESPONDING":
    case "STABLE":
      return "STABLE";
    case "PROCESSING":
      return "LIMITED";
    case "DEGRADED":
    case "ERROR":
      return "DEGRADED";
    default:
      return "UNKNOWN";
  }
}

function getOrCreateSession(sessionId: string): NodeRuntimeSession {
  const existing = sessionStore.get(sessionId);
  if (existing) {
    return existing;
  }

  const created: NodeRuntimeSession = {
    session_id: sessionId,
    node_id: NODE_ID,
    continuity_reference: buildContinuityReference(sessionId),
    state: "BOOTING",
    opened_at: nowIso(),
    updated_at: nowIso(),
    turn_count: 0
  };

  sessionStore.set(sessionId, created);
  return created;
}

function updateSession(
  sessionId: string,
  patch: Partial<NodeRuntimeSession>
): NodeRuntimeSession {
  const current = getOrCreateSession(sessionId);

  const updated: NodeRuntimeSession = {
    ...current,
    ...patch,
    updated_at: nowIso()
  };

  sessionStore.set(sessionId, updated);
  return updated;
}

export async function runNodeRuntime(input: {
  sessionId: string;
  userMessage: string;
  actor?: string;
}): Promise<NodeRuntimeExecutionResult> {
  const actor = input.actor || "IPR-AI-0001";

  let session = getOrCreateSession(input.sessionId);

  if (session.state === "BOOTING") {
    await nodeAppendEvent({
      kind: "node.session.opened",
      actor,
      node: NODE_ID,
      payload: {
        session_id: session.session_id,
        continuity_reference: session.continuity_reference,
        opened_at: session.opened_at
      }
    });

    session = updateSession(input.sessionId, {
      state: "READY"
    });
  }

  session = updateSession(input.sessionId, {
    state: "PROCESSING",
    turn_count: session.turn_count + 1,
    last_user_message: input.userMessage
  });

  await nodeAppendEvent({
    kind: "node.request.received",
    actor,
    node: NODE_ID,
    payload: {
      session_id: session.session_id,
      continuity_reference: session.continuity_reference,
      turn_count: session.turn_count,
      message: input.userMessage
    }
  });

  const verify = await nodeVerifyLedger();

  if (!verify.valid) {
    session = updateSession(input.sessionId, {
      state: "DEGRADED"
    });

    const lastEvent = await nodeGetLastEvent();

    return {
      session,
      continuity_status: getContinuityStatus(session.state),
      last_event_id: lastEvent?.id || null,
      ledger_valid: false,
      runtime_state: session.state
    };
  }

  session = updateSession(input.sessionId, {
    state: "RESPONDING"
  });

  const lastEvent = await nodeGetLastEvent();

  return {
    session,
    continuity_status: getContinuityStatus(session.state),
    last_event_id: lastEvent?.id || null,
    ledger_valid: true,
    runtime_state: session.state
  };
}

export async function finalizeNodeRuntime(input: {
  sessionId: string;
  assistantResponse: string;
  actor?: string;
}): Promise<NodeRuntimeExecutionResult> {
  const actor = input.actor || "IPR-AI-0001";

  let session = getOrCreateSession(input.sessionId);

  session = updateSession(input.sessionId, {
    state: "STABLE",
    last_assistant_response: input.assistantResponse
  });

  await nodeAppendEvent({
    kind: "node.response.emitted",
    actor,
    node: NODE_ID,
    payload: {
      session_id: session.session_id,
      continuity_reference: session.continuity_reference,
      turn_count: session.turn_count,
      response: input.assistantResponse
    }
  });

  const verify = await nodeVerifyLedger();
  const lastEvent = await nodeGetLastEvent();

  return {
    session,
    continuity_status: getContinuityStatus(session.state),
    last_event_id: lastEvent?.id || null,
    ledger_valid: verify.valid,
    runtime_state: session.state
  };
}

export function getNodeRuntimeSession(
  sessionId: string
): NodeRuntimeSession | null {
  return sessionStore.get(sessionId) || null;
}

export function listNodeRuntimeSessions(): NodeRuntimeSession[] {
  return Array.from(sessionStore.values()).sort((a, b) =>
    a.updated_at < b.updated_at ? 1 : -1
  );
}
