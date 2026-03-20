import { NextRequest, NextResponse } from "next/server";
import { runC2LexEngine } from "@/lib/c2-lex-engine";

type C2LexApiPayload = {
  sessionId?: string;
  message?: string;
  role?: string;
  nodeContext?: string;
  continuityReference?: string;
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

  const result = runC2LexEngine({
    sessionId,
    message: payload.message,
    role,
    nodeContext,
    continuityReference
  });

  return NextResponse.json({
    ok: true,
    input: {
      sessionId,
      role,
      nodeContext,
      continuityReference,
      message: payload.message
    },
    result
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    module: "C2-Lex",
    endpoint: "/api/c2-lex",
    method: "POST",
    description:
      "Endpoint minimo del motore governato C2-Lex per classificazione dell’intento, controlli di governance ed esito operativo.",
    required_fields: ["message"],
    optional_fields: [
      "sessionId",
      "role",
      "nodeContext",
      "continuityReference"
    ],
    sample_request: {
      sessionId: "C2L-SESSION-API-0001",
      role: "Operatore supervisionato",
      nodeContext: "HBCE-MATRIX-NODE-0001-TORINO",
      continuityReference: "C2L-SESSION-API-0001-AUDIT",
      message:
        "Mostrami lo stato corrente del modulo C2-Lex e chiarisci se questa sessione è in semplice consultazione oppure in attivazione operativa."
    }
  });
}
