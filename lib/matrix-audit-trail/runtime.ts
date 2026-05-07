/**
 * MATRIX AI Audit Trail — Runtime
 *
 * Minimal orchestration layer for the MATRIX AI Audit Trail MVP.
 *
 * Workflow:
 * document → AI action → governance decision → human validation → EVT → OPC → report
 *
 * The first pilot client is HERMETICUM B.C.E. S.r.l.
 */

import { buildMatrixEvt } from "./evt";
import { sha256Canonical, sha256Text } from "./hash";
import {
  assertMatrixAuditIdentityActive,
  getMatrixAuditIdentity,
  getMatrixAuditPilotClient
} from "./ipr";
import { buildMatrixOpc } from "./opc";
import type {
  MatrixAiActionRecord,
  MatrixAiActionType,
  MatrixAiOutputRecord,
  MatrixAuditReport,
  MatrixAuditTrailRuntimeInput,
  MatrixAuditTrailRuntimeOutput,
  MatrixAuditTrailSession,
  MatrixAuditTrailValidationInput,
  MatrixDocumentKind,
  MatrixDocumentRecord,
  MatrixGovernanceDecision,
  MatrixHumanValidation
} from "./types";

export function createMatrixAuditSession(sessionId: string): MatrixAuditTrailSession {
  const now = new Date().toISOString();
  const identity = getMatrixAuditIdentity();

  assertMatrixAuditIdentityActive(identity);

  return {
    sessionId,
    pilotClient: getMatrixAuditPilotClient(),
    identity,
    document: null,
    aiAction: null,
    aiOutput: null,
    governance: null,
    humanValidation: null,
    evt: null,
    opc: null,
    report: null,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now
  };
}

export function buildMatrixDocumentRecord(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  text: string;
  uploadedAt?: string;
}): MatrixDocumentRecord {
  const uploadedAt = input.uploadedAt || new Date().toISOString();
  const kind = inferDocumentKind(input.filename, input.mimeType);
  const documentHash = sha256Text(input.text);

  return {
    documentId: buildSequentialId("DOC", uploadedAt),
    filename: input.filename,
    mimeType: input.mimeType || "text/plain",
    kind,
    sizeBytes: input.sizeBytes,
    documentHash,
    uploadedAt,
    custody: "SESSION_CONTEXT"
  };
}

export function buildMatrixAiActionRecord(input: {
  actionType: MatrixAiActionType;
  prompt: string;
  model: string;
  document: MatrixDocumentRecord;
  createdAt?: string;
}): MatrixAiActionRecord {
  const createdAt = input.createdAt || new Date().toISOString();

  return {
    actionId: buildSequentialId("AI-ACTION", createdAt),
    actionType: input.actionType,
    prompt: input.prompt,
    model: input.model,
    runtime: "AI_JOKER_C2",
    createdAt,
    inputHash: sha256Canonical({
      documentHash: input.document.documentHash,
      prompt: input.prompt,
      actionType: input.actionType,
      model: input.model
    })
  };
}

export function buildMatrixAiOutputRecord(input: {
  text: string;
  createdAt?: string;
}): MatrixAiOutputRecord {
  const createdAt = input.createdAt || new Date().toISOString();

  return {
    outputId: buildSequentialId("AI-OUTPUT", createdAt),
    text: input.text,
    outputHash: sha256Text(input.text),
    createdAt
  };
}

export function classifyMatrixGovernance(input: {
  actionType: MatrixAiActionType;
  document: MatrixDocumentRecord;
  outputText: string;
}): MatrixGovernanceDecision {
  const output = input.outputText.toLowerCase();

  const highSignals = [
    "secret",
    "private key",
    "password",
    "credential",
    "exploit",
    "malware",
    "token",
    "identity document"
  ];

  const mediumSignals = [
    "compliance",
    "security",
    "risk",
    "legal",
    "governance",
    "audit",
    "privacy",
    "personal data"
  ];

  const high = highSignals.some((signal) => output.includes(signal));
  const medium = mediumSignals.some((signal) => output.includes(signal));

  if (high) {
    return {
      riskClass: "HIGH",
      riskScore: 3,
      policyStatus: "AUDIT_REQUIRED",
      decision: "AUDIT",
      humanOversight: "REQUIRED",
      failClosed: false,
      reasons: [
        "High-sensitivity terms detected in AI output.",
        "Human validation required before audit report finalization."
      ]
    };
  }

  if (medium || input.document.kind === "JSON") {
    return {
      riskClass: "MEDIUM",
      riskScore: 2,
      policyStatus: "ALLOWED",
      decision: "ALLOW",
      humanOversight: "REQUIRED",
      failClosed: false,
      reasons: [
        "Governance or audit-relevant content detected.",
        "Human validation required for compliance value."
      ]
    };
  }

  return {
    riskClass: "LOW",
    riskScore: 1,
    policyStatus: "ALLOWED",
    decision: "ALLOW",
    humanOversight: "REQUIRED",
    failClosed: false,
    reasons: [
      "Document analysis allowed for internal R&D self-audit pilot.",
      "Human validation required by MVP workflow."
    ]
  };
}

export function runMatrixAuditTrailRuntime(
  input: MatrixAuditTrailRuntimeInput & {
    aiOutputText: string;
    model?: string;
  }
): MatrixAuditTrailRuntimeOutput {
  const model = input.model || "gpt-4o-mini";

  const aiAction = buildMatrixAiActionRecord({
    actionType: input.actionType,
    prompt: input.prompt,
    model,
    document: input.document
  });

  const aiOutput = buildMatrixAiOutputRecord({
    text: input.aiOutputText
  });

  const governance = classifyMatrixGovernance({
    actionType: input.actionType,
    document: input.document,
    outputText: input.aiOutputText
  });

  return {
    aiAction,
    aiOutput,
    governance
  };
}

export function applyMatrixHumanValidation(
  session: MatrixAuditTrailSession,
  input: MatrixAuditTrailValidationInput
): MatrixAuditTrailSession {
  if (!session.document || !session.aiAction || !session.aiOutput || !session.governance) {
    throw new Error("MATRIX_AUDIT_SESSION_NOT_READY_FOR_VALIDATION");
  }

  const now = new Date().toISOString();
  const validation: MatrixHumanValidation = {
    validationStatus: input.validationStatus,
    validatorIpr: session.identity.ipr,
    validatorLabel: session.identity.subjectLabel,
    validatedAt: now,
    notes: input.notes || "",
    correctionText: input.correctionText
  };

  const finalOutputHash =
    input.validationStatus === "CORRECTED" && input.correctionText
      ? sha256Text(input.correctionText)
      : session.aiOutput.outputHash;

  const evt = buildMatrixEvt({
    documentHash: session.document.documentHash,
    userIpr: session.identity.ipr,
    action: session.aiAction.actionType,
    riskClass: session.governance.riskClass,
    decision: session.governance.decision,
    humanValidation: validation.validationStatus,
    outputHash: finalOutputHash
  });

  const opc = buildMatrixOpc({ evt });

  const nextSession: MatrixAuditTrailSession = {
    ...session,
    humanValidation: validation,
    evt,
    opc,
    status:
      validation.validationStatus === "APPROVED" ||
      validation.validationStatus === "CORRECTED"
        ? "AUDIT_READY"
        : validation.validationStatus,
    updatedAt: now
  };

  return {
    ...nextSession,
    report: buildMatrixAuditReport(nextSession)
  };
}

export function buildMatrixAuditReport(
  session: MatrixAuditTrailSession
): MatrixAuditReport {
  if (
    !session.document ||
    !session.aiAction ||
    !session.aiOutput ||
    !session.governance ||
    !session.humanValidation ||
    !session.evt ||
    !session.opc
  ) {
    throw new Error("MATRIX_AUDIT_REPORT_REQUIRES_COMPLETE_SESSION");
  }

  const createdAt = new Date().toISOString();

  return {
    reportId: buildSequentialId("MATRIX-REPORT", createdAt),
    title: "MATRIX AI Audit Trail Report",
    pilotClient: session.pilotClient,
    identity: session.identity,
    document: session.document,
    aiAction: session.aiAction,
    aiOutput: session.aiOutput,
    governance: session.governance,
    humanValidation: session.humanValidation,
    evt: session.evt,
    opc: session.opc,
    finalState:
      session.humanValidation.validationStatus === "APPROVED" ||
      session.humanValidation.validationStatus === "CORRECTED"
        ? "AUDIT_READY"
        : session.humanValidation.validationStatus === "REJECTED"
          ? "NOT_APPROVED"
          : "FAILED",
    createdAt
  };
}

export function renderMatrixAuditReportText(report: MatrixAuditReport): string {
  return [
    "MATRIX AI Audit Trail Report",
    "",
    `Pilot client: ${report.pilotClient.organization}`,
    `Pilot type: ${report.pilotClient.pilotType}`,
    `Report ID: ${report.reportId}`,
    `Created at: ${report.createdAt}`,
    "",
    "Document",
    `- Filename: ${report.document.filename}`,
    `- MIME type: ${report.document.mimeType}`,
    `- Size: ${report.document.sizeBytes} bytes`,
    `- Hash: ${report.document.documentHash}`,
    "",
    "Operator",
    `- IPR: ${report.identity.ipr}`,
    `- Label: ${report.identity.subjectLabel}`,
    `- Role: ${report.identity.role}`,
    `- Organization: ${report.identity.organization}`,
    "",
    "AI Action",
    `- Action ID: ${report.aiAction.actionId}`,
    `- Action type: ${report.aiAction.actionType}`,
    `- Runtime: ${report.aiAction.runtime}`,
    `- Model: ${report.aiAction.model}`,
    `- Input hash: ${report.aiAction.inputHash}`,
    "",
    "Governance",
    `- Risk class: ${report.governance.riskClass}`,
    `- Risk score: ${report.governance.riskScore}`,
    `- Policy status: ${report.governance.policyStatus}`,
    `- Runtime decision: ${report.governance.decision}`,
    `- Human oversight: ${report.governance.humanOversight}`,
    `- Fail closed: ${report.governance.failClosed}`,
    `- Reasons: ${report.governance.reasons.join(" | ")}`,
    "",
    "Human Validation",
    `- Status: ${report.humanValidation.validationStatus}`,
    `- Validator IPR: ${report.humanValidation.validatorIpr}`,
    `- Validator label: ${report.humanValidation.validatorLabel}`,
    `- Validated at: ${report.humanValidation.validatedAt || "-"}`,
    `- Notes: ${report.humanValidation.notes || "-"}`,
    "",
    "EVT",
    `- Event: ${report.evt.evt}`,
    `- Prev: ${report.evt.prev}`,
    `- Trace hash: ${report.evt.traceHash}`,
    `- Status: ${report.evt.status}`,
    "",
    "OPC",
    `- Proof: ${report.opc.opc}`,
    `- Linked EVT: ${report.opc.linkedEvt}`,
    `- Proof hash: ${report.opc.proofHash}`,
    `- Verification: ${report.opc.verificationStatus}`,
    "",
    `Final state: ${report.finalState}`
  ].join("\n");
}

function inferDocumentKind(filename: string, mimeType: string): MatrixDocumentKind {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (lowerName.endsWith(".md") || lowerMime.includes("markdown")) {
    return "MARKDOWN";
  }

  if (lowerName.endsWith(".json") || lowerMime.includes("json")) {
    return "JSON";
  }

  if (lowerName.endsWith(".txt") || lowerMime.includes("text")) {
    return "TEXT";
  }

  if (lowerName.endsWith(".pdf") || lowerMime.includes("pdf")) {
    return "PDF_UNSUPPORTED";
  }

  if (lowerName.endsWith(".docx")) {
    return "DOCX_UNSUPPORTED";
  }

  return "UNKNOWN";
}

function buildSequentialId(prefix: string, timestamp: string): string {
  const compactTimestamp = timestamp
    .replace(/\D/g, "")
    .slice(0, 14)
    .padEnd(14, "0");

  return `${prefix}-${compactTimestamp}`;
}
