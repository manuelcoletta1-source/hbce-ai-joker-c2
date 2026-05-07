/**
 * MATRIX AI Audit Trail — IPR Identity
 *
 * Minimal operational identity for the internal R&D self-audit pilot.
 *
 * First pilot client:
 * HERMETICUM B.C.E. S.r.l.
 */

import type { MatrixAuditPilotClient, MatrixOperationalIdentity } from "./types";

export const MATRIX_AUDIT_PILOT_CLIENT: MatrixAuditPilotClient = {
  organization: "HERMETICUM B.C.E. S.r.l.",
  pilotType: "INTERNAL_R_AND_D_SELF_AUDIT",
  operatorLabel: "HERMETICUM_BCE_SELF_PILOT"
};

export const MATRIX_AUDIT_SELF_PILOT_IDENTITY: MatrixOperationalIdentity = {
  ipr: "IPR-HBCE-SELF-PILOT-0001",
  subjectLabel: "HERMETICUM_BCE_SELF_PILOT",
  role: "internal_r_and_d_operator",
  organization: "HERMETICUM B.C.E. S.r.l.",
  status: "ACTIVE"
};

export function getMatrixAuditPilotClient(): MatrixAuditPilotClient {
  return MATRIX_AUDIT_PILOT_CLIENT;
}

export function getMatrixAuditIdentity(): MatrixOperationalIdentity {
  return MATRIX_AUDIT_SELF_PILOT_IDENTITY;
}

export function assertMatrixAuditIdentityActive(
  identity: MatrixOperationalIdentity
): void {
  if (!identity.ipr || !identity.subjectLabel || !identity.organization) {
    throw new Error("MATRIX_AUDIT_IDENTITY_INVALID");
  }

  if (identity.status !== "ACTIVE") {
    throw new Error("MATRIX_AUDIT_IDENTITY_NOT_ACTIVE");
  }
}
