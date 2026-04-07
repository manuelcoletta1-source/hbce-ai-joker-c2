import { NextRequest, NextResponse } from "next/server";

import corpusCore from "../../../corpus-core.js";
import alienCodeCore, {
  isDerivativeLegitimate,
  explainDerivativeFailure
} from "../../../corpus-alien-code.js";

export const runtime = "nodejs";

type RuntimeDecision = "ALLOW" | "BLOCK" | "ESCALATE";
type RuntimeState = "OPERATIONAL" | "DEGRADED" | "BLOCKED" | "INVALID";

type EvidenceRequestBody = {
  message?: string;
  sessionId?: string;
  continuityRef?: string;
  identity?: {
    entity?: string;
    ipr?: string;
  };
  derivativeContext?: boolean;
  decision?: RuntimeDecision;
  state?: RuntimeState;
};

type EvidenceRecord = {
  evt: string;
  prev: string;
  t: string;
  entity: string;
  ipr: string;
  kind: string;
  state: RuntimeState;
  decision: RuntimeDecision;
  message: string;
  continuityRef: string | null;
  derivative?: {
    ipr: string;
    entity: string;
    layer: string;
    legitimate: boolean;
  };
  anchors: {
    hash: string;
    signature: string;
  };
};

function pseudoHash(input: unknown): string {
  const data = JSON.stringify(input);
  let hash = 0;

  for (let i = 0; i < data.length; i += 1) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  return `sha256:${Math.abs(hash).toString(16)}`;
}

function pseudoSignature(hash: string): string {
  return `ed25519:${Buffer.from(hash).toString("base64").slice(0, 48)}`;
}

function buildEvtId(): string {
  return `EVT-${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeBody(body: EvidenceRequestBody) {
  return {
    message: typeof body.message === "string" ? body.message.trim() : "",
    sessionId: typeof body.sessionId === "string" ? body.sessionId.trim() : "",
    continuityRef:
      typeof body.continuityRef === "string" ? body.continuityRef.trim() : null,
    identity: {
      entity:
        typeof body.identity?.entity === "string" ? body.identity.entity.trim() : "",
      ipr:
        typeof body.identity?.ipr === "string" ? body.identity.ipr.trim() : ""
    },
    derivativeContext: body.derivativeContext === true,
    decision: body.decision ?? "ALLOW",
    state: body.state ?? "OPERATIONAL"
  };
}

function resolveIdentity(ipr?: string) {
  if (!ipr) return null;
  return corpusCore.getIdentityLineage().find((item) => item.ipr === ipr) ?? null;
}

function evaluateDerivative(input: {
  derivativeContext: boolean;
  identityIpr: string;
}) {
  if (!input.derivativeContext) {
    return {
      requested: false,
      legitimate: true,
      failures: [] as string[]
    };
  }

  const ctx = {
    valid_human_origin: true,
    valid_primary_ai_root: true,
    identity_binding:
      input.identityIpr === corpusCore.IDENTITY_LINEAGE.ai_root.ipr ||
      input.identityIpr === corpusCore.IDENTITY_LINEAGE.derived_root.ipr,
    policy_validation: true,
    runtime_authorization: true,
    evt_continuity: true,
    evidence_production: true,
    verification: true
  };

  return {
    requested: true,
    legitimate: isDerivativeLegitimate(ctx),
    failures: explainDerivativeFailure(ctx).failures
  };
}

function buildEvidenceRecord(input: {
  message: string;
  continuityRef: string | null;
  identity: {
    entity: string;
    ipr: string;
  };
  decision: RuntimeDecision;
  state: RuntimeState;
  derivativeRequested: boolean;
  derivativeLegitimate: boolean;
}): EvidenceRecord {
  const payload = {
    evt: buildEvtId(),
    prev: input.continuityRef || "GENESIS",
    t: nowIso(),
    entity: input.identity.entity,
    ipr: input.identity.ipr,
    kind: input.derivativeRequested ? "DERIVATIVE_EVIDENCE" : "EVIDENCE",
    state: input.state,
    decision: input.decision,
    message: input.message,
    continuityRef: input.continuityRef
  };

  const hash = pseudoHash(payload);

  const record: EvidenceRecord = {
    ...payload,
    anchors: {
      hash,
      signature: pseudoSignature(hash)
    }
  };

  if (input.derivativeRequested) {
    record.derivative = {
      ipr: corpusCore.IDENTITY_LINEAGE.derived_root.ipr,
      entity: corpusCore.IDENTITY_LINEAGE.derived_root.entity,
      layer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code,
      legitimate: input.derivativeLegitimate
    };
  }

  return Object.freeze(record);
}

export async function POST(req: NextRequest) {
  let body: EvidenceRequestBody;

  try {
    body = (await req.json()) as EvidenceRequestBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        state: "INVALID",
        decision: "BLOCK",
        error: "INVALID_JSON_BODY"
      },
      { status: 400 }
    );
  }

  const input = normalizeBody(body);
  const identity = resolveIdentity(input.identity.ipr);

  if (!identity) {
    return NextResponse.json(
      {
        ok: false,
        state: "BLOCKED",
        decision: "BLOCK",
        error: "UNKNOWN_IDENTITY",
        protocol: {
          failClosed: corpusCore.FAIL_CLOSED_RULES
        }
      },
      { status: 403 }
    );
  }

  const derivative = evaluateDerivative({
    derivativeContext: input.derivativeContext,
    identityIpr: identity.ipr
  });

  if (derivative.requested && !derivative.legitimate) {
    return NextResponse.json(
      {
        ok: false,
        state: "BLOCKED",
        decision: "BLOCK",
        error: "DERIVATIVE_LEGITIMACY_FAILED",
        failures: derivative.failures,
        derivationLayer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code
      },
      { status: 403 }
    );
  }

  const record = buildEvidenceRecord({
    message: input.message || "Operational evidence emission",
    continuityRef: input.continuityRef,
    identity: {
      entity: identity.entity,
      ipr: identity.ipr
    },
    decision: input.decision,
    state: input.state,
    derivativeRequested: derivative.requested,
    derivativeLegitimate: derivative.legitimate
  });

  return NextResponse.json({
    ok: true,
    state: input.state,
    decision: input.decision,
    evidence: record,
    evidenceModel: corpusCore.EVIDENCE_MODEL,
    derivationLayer: {
      code: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code,
      axiom: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.axiom
    },
    alienCode: {
      runtimeBridge: alienCodeCore.ALIEN_CODE,
      derivativeLegitimacy: alienCodeCore.DERIVATIVE_LEGITIMACY
    }
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/evidence",
    purpose:
      "Emit structured operational evidence records with EVT-compatible continuity, hash/signature anchors, and derivative-aware legitimacy.",
    supports: {
      validIdentityRoots: corpusCore.getIdentityLineage(),
      evidenceModel: corpusCore.EVIDENCE_MODEL,
      derivationLayer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code,
      validStates: corpusCore.SYSTEM_STATES,
      validDecisions: corpusCore.DECISION_OUTPUTS
    }
  });
}
