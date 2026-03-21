import { NextRequest, NextResponse } from "next/server";
import {
  getC2LexSession,
  listC2LexSessions,
  resetC2LexSession,
  runC2LexSession
} from "@/lib/c2-lex-session-store";

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
      session
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

  const sessionId =
    isNonEmptyString(payload.sessionId) ? payload.sessionId : "C2L-SESSION-API-0001";

  const role =
    isNonEmptyString(payload.role) ? payload.role : "Operatore supervisionato";

  const nodeContext = isNonEmptyString(payload.nodeContext)
    ? payload.nodeContext
    : "HBCE-MATRIX-NODE-0001-TORINO";

  const continuityReference = isNonEmptyString(payload.continuityReference)
    ? payload.continuityReference
    : `${sessionId}-AUDIT`;

  const execution = runC2LexSession({
    sessionId,
    message: payload.message,
    role,
    nodeContext,
    continuityReference
  });

  return NextResponse.json({
    ok: true,
    action: "run",
    created: execution.created,
    input: {
      sessionId,
      role,
      nodeContext,
      continuityReference,
      message: payload.message
    },
    result: execution.result,
    session: execution.session
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
      session
    });
  }

  return NextResponse.json({
    ok: true,
    module: "C2-Lex",
    endpoint: "/api/c2-lex",
    methods: ["GET", "POST"],
    description:
      "Endpoint del motore governato C2-Lex con supporto a sessioni, timeline e governance checks.",
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
