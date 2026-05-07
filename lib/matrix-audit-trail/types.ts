/**
 * MATRIX AI Audit Trail — MVP Types
 *
 * This file defines the minimal data model for the MATRIX AI Audit Trail MVP.
 *
 * The MVP is an internal R&D self-audit pilot for HERMETICUM B.C.E. S.r.l.
 *
 * Workflow:
 * Document upload
 * → AI analysis
 * → risk classification
 * → governance decision
 * → human validation
 * → EVT event
 * → OPC proof
 * → audit report
 *
 * Boundary:
 * This MVP does not create legal certification, regulatory approval,
 * public-sector adoption, eIDAS qualification, automated compliance,
 * or legally binding evidence status by itself.
 */

export type MatrixAuditPilotClient = {
  organization: "HERMETICUM B.C.E. S.r.l.";
  pilotType: "INTERNAL_R_AND_D_SELF_AUDIT";
  operatorLabel: "HERMETICUM_BCE_SELF_PILOT";
};

export type MatrixAuditStatus =
  | "DRAFT"
  | "READY"
  | "IN_REVIEW"
  | "APPROVED"
  | "CORRECTED"
  | "REJECTED"
  | "AUDIT_READY"
  | "FAILED";

export type MatrixRiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "UNKNOWN";

export type MatrixRuntimeDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "AUDIT"
  | "NOOP";

export type MatrixHumanValidationStatus =
  | "PENDING"
  | "APPROVED"
  | "CORRECTED"
  | "REJECTED";

export type MatrixDocumentKind =
  | "TEXT"
  | "MARKDOWN"
  | "JSON"
  | "PDF_UNSUPPORTED"
  | "DOCX_UNSUPPORTED"
  | "UNKNOWN";

export type MatrixAiActionType =
  | "AI_DOCUMENT_SUMMARY"
  | "AI_DOCUMENT_ANALYSIS"
  | "AI_RISK_CLASSIFICATION"
  | "AI_COMPLIANCE_REVIEW"
  | "AI_SECURITY_REVIEW"
  | "AI_GOVERNANCE_REVIEW"
  | "AI_OVERCLAIM_REVIEW"
  | "AI_CUSTOM_ACTION";

export type MatrixHash = `sha256:${string}`;

export type MatrixOperationalIdentity = {
  ipr: string;
  subjectLabel: string;
  role: string;
  organization: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
};

export type MatrixDocumentRecord = {
  documentId: string;
  filename: string;
  mimeType: string;
  kind: MatrixDocumentKind;
  sizeBytes: number;
  documentHash: MatrixHash;
  uploadedAt: string;
  custody: "LOCAL_BROWSER" | "SESSION_CONTEXT" | "RUNTIME_CONTEXT";
};

export type MatrixAiActionRecord = {
  actionId: string;
  actionType: MatrixAiActionType;
  prompt: string;
  model: string;
  runtime: "AI_JOKER_C2";
  createdAt: string;
  inputHash: MatrixHash;
};

export type MatrixAiOutputRecord = {
  outputId: string;
  text: string;
  outputHash: MatrixHash;
  createdAt: string;
};

export type MatrixGovernanceDecision = {
  riskClass: MatrixRiskClass;
  riskScore: number;
  policyStatus: "ALLOWED" | "BLOCKED" | "ESCALATED" | "AUDIT_REQUIRED";
  decision: MatrixRuntimeDecision;
  humanOversight: "NOT_REQUIRED" | "REQUIRED";
  failClosed: boolean;
  reasons: string[];
};

export type MatrixHumanValidation = {
  validationStatus: MatrixHumanValidationStatus;
  validatorIpr: string;
  validatorLabel: string;
  validatedAt: string | null;
  notes: string;
  correctionText?: string;
};

export type MatrixEvtRecord = {
  evt: string;
  prev: string;
  timestamp: string;
  documentHash: MatrixHash;
  userIpr: string;
  action: MatrixAiActionType;
  riskClass: MatrixRiskClass;
  decision: MatrixRuntimeDecision;
  humanValidation: MatrixHumanValidationStatus;
  outputHash: MatrixHash;
  status: "VERIFIABLE" | "INVALID" | "FAILED";
  traceHash: MatrixHash;
};

export type MatrixOpcRecord = {
  opc: string;
  linkedEvt: string;
  proofType: "OPERATIONAL_PROOF";
  proofHash: MatrixHash;
  verificationStatus: "VALID" | "INVALID" | "UNVERIFIED";
  createdAt: string;
};

export type MatrixAuditReport = {
  reportId: string;
  title: "MATRIX AI Audit Trail Report";
  pilotClient: MatrixAuditPilotClient;
  identity: MatrixOperationalIdentity;
  document: MatrixDocumentRecord;
  aiAction: MatrixAiActionRecord;
  aiOutput: MatrixAiOutputRecord;
  governance: MatrixGovernanceDecision;
  humanValidation: MatrixHumanValidation;
  evt: MatrixEvtRecord;
  opc: MatrixOpcRecord;
  finalState: "AUDIT_READY" | "NOT_APPROVED" | "FAILED";
  createdAt: string;
};

export type MatrixAuditTrailSession = {
  sessionId: string;
  pilotClient: MatrixAuditPilotClient;
  identity: MatrixOperationalIdentity;
  document: MatrixDocumentRecord | null;
  aiAction: MatrixAiActionRecord | null;
  aiOutput: MatrixAiOutputRecord | null;
  governance: MatrixGovernanceDecision | null;
  humanValidation: MatrixHumanValidation | null;
  evt: MatrixEvtRecord | null;
  opc: MatrixOpcRecord | null;
  report: MatrixAuditReport | null;
  status: MatrixAuditStatus;
  createdAt: string;
  updatedAt: string;
};

export type MatrixAuditTrailRuntimeInput = {
  sessionId: string;
  document: MatrixDocumentRecord;
  documentText: string;
  actionType: MatrixAiActionType;
  prompt: string;
};

export type MatrixAuditTrailRuntimeOutput = {
  aiAction: MatrixAiActionRecord;
  aiOutput: MatrixAiOutputRecord;
  governance: MatrixGovernanceDecision;
};

export type MatrixAuditTrailValidationInput = {
  validationStatus: MatrixHumanValidationStatus;
  notes?: string;
  correctionText?: string;
};

export type MatrixAuditTrailReportInput = {
  session: MatrixAuditTrailSession;
};
