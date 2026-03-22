import { NextRequest, NextResponse } from "next/server";
import { runNodeRuntime } from "@/lib/node/node-runtime";

type C2LexApiPayload = {
  sessionId?: string;
  message?: string;
  role?: string;
  nodeContext?: string;
  continuityReference?: string;
  action?: "run" | "status";
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

  if (action !== "run") {
    return badRequest("Action non supportata.");
  }

  if (!isNonEmptyString(payload.message)) {
    return badRequest("Il campo 'message' è obbligatorio.");
  }

  const sessionId = isNonEmptyString(payload.sessionId)
    ? payload.sessionId
    : "C2L-SESSION-API-0001";

  const role = isNonEmptyString(payload.role)
    ? payload.role
    : "Operatore supervisionato";

  const nodeContext = isNonEmptyString(payload.nodeContext)
    ? payload.nodeContext
    : "HBCE-MATRIX-NODE-0001-TORINO";

  const continuityReference = isNonEmptyString(payload.continuityReference)
    ? payload.continuityReference
    : `${sessionId}-AUDIT`;

  const runtime = await runNodeRuntime({
    sessionId,
    userMessage: payload.message,
    actor: role
  });

  return NextResponse.json({
    ok: true,
    action: "run",
    input: {
      sessionId,
      role,
      nodeContext,
      continuityReference,
      message: payload.message
    },
    runtime
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    module: "C2-Lex",
    endpoint: "/api/c2-lex",
    methods: ["GET", "POST"],
    description:
      "Endpoint del runtime C2-Lex allineato al nodo HBCE con sessione, continuità e ledger.",
    sample_request: {
      action: "run",
      sessionId: "C2L-SESSION-API-0001",
      role: "Operatore supervisionato",
      nodeContext: "HBCE-MATRIX-NODE-0001-TORINO",
      continuityReference: "C2L-SESSION-API-0001-AUDIT",
      message:
        "Mostrami lo stato corrente del modulo C2-Lex e chiarisci se la sessione è in consultazione o in attivazione operativa."
    }
  });
}
