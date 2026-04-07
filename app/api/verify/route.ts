import { NextRequest, NextResponse } from "next/server";

import core from "../../../corpus-core.js";
import alienCode, {
  isDerivativeLegitimate,
  explainDerivativeFailure
} from "../../../corpus-alien-code.js";

export const runtime = "nodejs";

type VerifyBody = {
  evt?: string;
  prev?: string;
  t?: string;
  entity?: string;
  ipr?: string;
  kind?: string;
  state?: string;
  decision?: string;
  anchors?: {
    hash?: string;
    signature?: string;
  };
  continuityRef?: string | null;
  derivative?: {
    ipr?: string;
    layer?: string;
    legitimate?: boolean;
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

function verifyRequiredFields(payload: VerifyBody) {
  const missing: string[] = [];

  if (!payload.evt) missing.push("evt");
  if (!payload.prev) missing.push("prev");
  if (!payload.t) missing.push("t");
  if (!payload.entity) missing.push("entity");
  if (!payload.ipr) missing.push("ipr");
  if (!payload.kind) missing.push("kind");
  if (!payload.state) missing.push("state");
  if (!payload.decision) missing.push("decision");
  if (!payload.anchors?.hash) missing.push("anchors.hash");

  return Object.freeze({
    ok: missing.length === 0,
    missing
  });
}

function verifyHash(payload: VerifyBody) {
  const calculated = pseudoHash({
    evt: payload.evt,
    prev: payload.prev,
    t: payload.t,
    entity: payload.entity,
    ipr: payload.ipr,
    kind: payload.kind,
    state: payload.state,
    decision: payload.decision,
    continuityRef: payload.continuityRef ?? null
  });

  return Object.freeze({
    ok: payload.anchors?.hash === calculated,
    expected: calculated,
    actual: payload.anchors?.hash ?? null
  });
}

function verifyIdentity(ipr?: string) {
  return !!ipr && core.isKnownIdentityIpr(ipr);
}

function verifyDecision(decision?: string) {
  return !!decision && core.isValidRuntimeDecision(decision);
}

function verifyState(state?: string) {
  return !!state && core.isValidSystemState(state);
}

function verifyDerivative(payload: VerifyBody) {
  if (!payload.derivative) {
    return Object.freeze({
      requested: false,
      ok: true,
      failures: [] as string[]
    });
  }

  const context = {
    valid_human_origin: true,
    valid_primary_ai_root: true,
    identity_binding:
      payload.derivative.ipr === core.IDENTITY_LINEAGE.derived_root.ipr ||
      payload.ipr === core.IDENTITY_LINEAGE.derived_root.ipr,
    policy_validation: true,
    runtime_authorization: payload.decision === "ALLOW",
    evt_continuity: !!payload.prev && !!payload.evt,
    evidence_production: !!payload.anchors?.hash,
    verification: true
  };

  const legitimate = isDerivativeLegitimate(context);
  const failures = [...explainDerivativeFailure(context).failures];

  if (payload.derivative.ipr !== core.IDENTITY_LINEAGE.derived_root.ipr) {
    failures.push("INVALID_DERIVATIVE_IPR");
  }

  if (payload.derivative.layer !== core.BIOCYBERNETIC_DERIVATION_LAYER.code) {
    failures.push("INVALID_DERIVATION_LAYER");
  }

  if (
    typeof payload.derivative.legitimate === "boolean" &&
    payload.derivative.legitimate !== legitimate
  ) {
    failures.push("DERIVATIVE_LEGITIMACY_MISMATCH");
  }

  return Object.freeze({
    requested: true,
    ok: legitimate && failures.length === 0,
    failures
  });
}

function buildVerificationReport(payload: VerifyBody) {
  const required = verifyRequiredFields(payload);
  const identityOk = verifyIdentity(payload.ipr);
  const decisionOk = verifyDecision(payload.decision);
  const stateOk = verifyState(payload.state);
  const hashCheck = required.ok
    ? verifyHash(payload)
    : { ok: false, expected: null, actual: payload.anchors?.hash ?? null };
  const derivative = verifyDerivative(payload);

  const checks = {
    required_fields: required.ok,
    identity_known: identityOk,
    decision_valid: decisionOk,
    state_valid: stateOk,
    hash_valid: hashCheck.ok,
    derivative_valid: derivative.ok
  };

  const failures = [
    ...required.missing.map((field) => `MISSING_${field.toUpperCase()}`),
    ...(identityOk ? [] : ["UNKNOWN_IDENTITY"]),
    ...(decisionOk ? [] : ["INVALID_DECISION"]),
    ...(stateOk ? [] : ["INVALID_STATE"]),
    ...(hashCheck.ok ? [] : ["HASH_MISMATCH"]),
    ...derivative.failures
  ];

  return Object.freeze({
    valid: Object.values(checks).every(Boolean),
    checks,
    failures,
    derivative,
    hash: hashCheck
  });
}

export async function POST(req: NextRequest) {
  let body: VerifyBody;

  try {
    body = (await req.json()) as VerifyBody;
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

  const verification = buildVerificationReport(body);

  return NextResponse.json({
    ok: verification.valid,
    state: verification.valid ? "OPERATIONAL" : "INVALID",
    decision: verification.valid ? "ALLOW" : "BLOCK",
    verification,
    protocol: {
      sequence: core.RUNTIME_SEQUENCE,
      failClosed: core.FAIL_CLOSED_RULES
    },
    evidenceModel: core.EVIDENCE_MODEL,
    derivationLayer: {
      code: core.BIOCYBERNETIC_DERIVATION_LAYER.code,
      axiom: core.BIOCYBERNETIC_DERIVATION_LAYER.axiom
    },
    alienCode: {
      interface: alienCode.ORGANISM_SYSTEM_INTERFACE,
      loop: alienCode.BIOCYBERNETIC_LOOP
    }
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/verify",
    purpose:
      "Verify EVT-shaped operational objects, identity lineage, hash integrity, and derivative legitimacy.",
    supports: {
      identityLineage: core.getIdentityLineage(),
      decisions: core.DECISION_OUTPUTS,
      states: core.SYSTEM_STATES,
      derivativeRoot: core.IDENTITY_LINEAGE.derived_root,
      derivationLayer: core.BIOCYBERNETIC_DERIVATION_LAYER.code
    }
  });
}
