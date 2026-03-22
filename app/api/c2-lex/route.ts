import { NextRequest, NextResponse } from "next/server";

import {
  getC2LexSession,
  listC2LexSessions,
  resetC2LexSession
} from "@/lib/c2-lex-session-store";

import { runNodeRuntime } from "@/lib/node/node-runtime";
import { nodeGetContinuityBySessionId } from "@/lib/node/node-continuity";

type C2LexApiPayload = {
  sessionId?: string;
  message?: string;
  role?: string;
  nodeContext?: string;
  continuityReference?: string;
  action?: "run" | "get" | "reset" | "list";
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      error
    },
    { status: 400 }
  );
}

function normalizeSessionId(sessionId?: string): string {
  if (!isNonEmptyString(sessionId)) {
    return "C2L-SESSION-API-0001";
  }

  return sessionId.trim();
}

function normalizeRole(role?: string): string {
  if (!isNonEmptyString(role)) {
    return "Operatore supervisionato";
  }

  return role.trim();
}

function normalizeNodeContext(nodeContext?: string): string {
  if (!isNonEmptyString(nodeContext)) {
    return "HBCE-MATRIX-NODE-0001-TORINO";
  }

  return nodeContext.trim();
}

function normalizeContinuityReference(
  continuityReference: string | undefined,
  sessionId: string
): string {
  if (!isNonEmptyString(continuityReference)) {
    return `${sessionId}-AUDIT`;
  }

  return continuityReference.trim();
}

export async function POST(request: NextRequest) {
  let payload: C2LexApiPayload;

  try {
    payload = (await request.json()) as C2LexApiPayload;
  } catch {
    return badRequest("Payload JSON non valido.");
  }

  const action = payload.action ?? "run";

  if (action === "list") {
    return NextResponse.json({
      ok: true,
      action: "list",
      sessions: listC2LexSessions()
    });
  }

  if (action === "get") {
    if (!isNonEmptyString(payload.sessionId)) {
      return badRequest("Il campo 'sessionId' è obbligatorio per action='get'.");
    }

    const session = getC2LexSession(payload.sessionId);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sessione non trovata."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: "get",
      session,
      continuity: nodeGetContinuityBySessionId(payload.sessionId)
    });
  }

  if (action === "reset") {
    if (!isNonEmptyString(payload.sessionId)) {
      return badRequest("Il campo 'sessionId' è obbligatorio per action='reset'.");
    }

    const removed = resetC2LexSession(payload.sessionId);

    return NextResponse.json({
      ok: true,
      action: "reset",
      removed,
      sessionId: payload.sessionId
    });
  }

  if (!isNonEmptyString(payload.message)) {
    return badRequest("Il campo 'message' è obbligatorio.");
  }

  const sessionId = normalizeSessionId(payload.sessionId);
  const role = normalizeRole(payload.role);
  const nodeContext = normalizeNodeContext(payload.nodeContext);
  const continuityReference = normalizeContinuityReference(
    payload.continuityReference,
    sessionId
  );

  const runtime = await runNodeRuntime({
    sessionId,
    message: payload.message,
    role,
    nodeContext,
    continuityReference,
    actor: role
  });

  return NextResponse.json({
    ok: true,
    action: "run",
    created: runtime.execution.created,
    input: {
      sessionId,
      role,
      nodeContext,
      continuityReference,
      message: payload.message
    },
    result: runtime.execution.result,
    session: runtime.execution.session,
    continuity: {
      continuity_status: runtime.continuity_status,
      reference: runtime.execution.result.continuityReference
    },
    node_runtime: {
      ledger_events: runtime.ledger_events
    }
  });
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const action = request.nextUrl.searchParams.get("action");

  if (action === "list") {
    return NextResponse.json({
      ok: true,
      action: "list",
      sessions: listC2LexSessions()
    });
  }

  if (isNonEmptyString(sessionId)) {
    const session = getC2LexSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sessione non trovata."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: "get",
      session,
      continuity: nodeGetContinuityBySessionId(sessionId)
    });
  }

  return NextResponse.json({
    ok: true,
    module: "C2-Lex",
    endpoint: "/api/c2-lex",
    methods: ["GET", "POST"],
    description:
      "Endpoint del motore governato C2-Lex integrato nel Node Layer di JOKER-C2 con supporto a sessioni, timeline, continuità e ledger events.",
    post_actions: ["run", "get", "reset", "list"],
    get_actions: [
      "GET /api/c2-lex",
      "GET /api/c2-lex?action=list",
      "GET /api/c2-lex?sessionId=<SESSION_ID>"
    ],
    required_fields_for_run: ["message"],
    optional_fields_for_run: [
      "sessionId",
      "role",
      "nodeContext",
      "continuityReference"
    ],
    sample_request: {
      action: "run",
      sessionId: "C2L-SESSION-API-0001",
      role: "Operatore supervisionato",
      nodeContext: "HBCE-MATRIX-NODE-0001-TORINO",
      continuityReference: "C2L-SESSION-API-0001-AUDIT",
      message:
        "Mostrami lo stato corrente del modulo C2-Lex e chiarisci se questa sessione è in semplice consultazione oppure in attivazione operativa."
    }
  });
}
