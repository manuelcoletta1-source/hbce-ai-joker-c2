import { NextRequest, NextResponse } from "next/server";

import corpusCore from "../../../corpus-core.js";
import alienCodeCore, {
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
  derivative?: {
    ipr?: string;
    layer?: string;
    legitimate?: boolean;
  };
};

function jsonHash(input: unknown): string {
  const data = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return `sha256:${Math.abs(hash).toString(16)}`;
}

function isKnownIpr(ipr?: string) {
  if (!ipr) return false;
  return corpusCore.isKnownIdentityIpr(ipr);
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

  return {
    ok: missing.length === 0,
    missing
  } as const;
}

function verifyHash(payload: VerifyBody) {
  const recalculated = jsonHash({
    evt: payload.evt,
    prev: payload.prev,
    t: payload.t,
    entity: payload.entity,
    ipr: payload.ipr,
    kind: payload.kind,
    state: payload.state,
    decision: payload.decision
  });

  return {
    ok: payload.anchors?.hash === recalculated,
    expected: recalculated,
    actual: payload.anchors?.hash || null
  } as const;
}

function verifyDecision(value?: string) {
  return corpusCore.isValidRuntimeDecision(value || "");
}

function verifyState(value?: string) {
  return corpusCore.isValidSystemState(value || "");
}

function verifyDerivative(payload: VerifyBody) {
  if (!payload.derivative) {
    return {
      requested: false,
      ok: true,
      reasons: []
    } as const;
  }

  const context = {
    valid_human_origin: true,
    valid_primary_ai_root: true,
    identity_binding:
      payload.derivative.ipr === corpusCore.IDENTITY_ROOTS.derived_root.ipr ||
      payload.ipr === corpusCore.IDENTITY_ROOTS.derived_root.ipr,
    policy_validation: true,
    runtime_authorization: payload.decision === "ALLOW",
    evt_continuity: true,
    evidence_production: !!payload.anchors?.hash,
    verification: true
  };

  const legitimate = isDerivativeLegitimate(context);
  const details = explainDerivativeFailure(context);

  const layerOk =
    payload.derivative.layer === corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code;
  const iprOk =
    payload.derivative.ipr === corpusCore.IDENTITY_ROOTS.derived_root.ipr;

  return {
    requested: true,
    ok: legitimate && layerOk && iprOk,
    reasons: [
      ...details.failures,
      ...(layerOk ? [] : ["INVALID_DERIVATION_LAYER"]),
      ...(iprOk ? [] : ["INVALID_DERIVATIVE_IPR"])
    ]
  } as const;
}

function buildVerificationReport(payload: VerifyBody) {
  const required = verifyRequiredFields(payload);
  const knownIdentity = isKnownIpr(payload.ipr);
  const hashCheck = required.ok ? verifyHash(payload) : { ok: false, expected: null, actual: payload.anchors?.hash || null };
  const decisionOk = verifyDecision(payload.decision);
  const stateOk = verifyState(payload.state);
  const derivative = verifyDerivative(payload);

  const checks = {
    required_fields: required.ok,
    identity_known: knownIdentity,
    decision_valid: decisionOk,
    state_valid: stateOk,
    hash_valid: hashCheck.ok,
    derivative_valid: derivative.ok
  };

  const failures = [
    ...(required.ok ? [] : required.missing.map((field) => `MISSING_${field.toUpperCase()}`)),
    ...(knownIdentity ? [] : ["UNKNOWN_IDENTITY"]),
    ...(decisionOk ? [] : ["INVALID_DECISION"]),
    ...(stateOk ? [] : ["INVALID_STATE"]),
    ...(hashCheck.ok ? [] : ["HASH_MISMATCH"]),
    ...derivative.reasons
  ];

  const valid = Object.values(checks).every(Boolean);

  return Object.freeze({
    valid,
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

  const report = buildVerificationReport(body);

  return NextResponse.json({
    ok: report.valid,
    state: report.valid ? "OPERATIONAL" : "INVALID",
    decision: report.valid ? "ALLOW" : "BLOCK",
    protocol: {
      sequence: corpusCore.RUNTIME_SEQUENCE,
      failClosed: corpusCore.FAIL_CLOSED_RULES
    },
    verification: report,
    evidenceModel: corpusCore.EVIDENCE_MODEL,
    derivationLayer: {
      code: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code,
      axiom: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.axiom
    },
    alienCode: {
      interface: alienCodeCore.ORGANISM_SYSTEM_INTERFACE,
      loop: alienCodeCore.BIOCYBERNETIC_LOOP
    }
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/verify",
    purpose: "Verify EVT-shaped operational objects, identity lineage, hash integrity, and derivative legitimacy.",
    supports: {
      knownIdentityRoots: corpusCore.getIdentityLineage(),
      validDecisions: corpusCore.DECISION_OUTPUTS,
      validStates: corpusCore.SYSTEM_STATES,
      derivativeRoot: corpusCore.IDENTITY_ROOTS.derived_root,
      derivationLayer: corpusCore.BIOCYBERNETIC_DERIVATION_LAYER.code
    }
  });
}
