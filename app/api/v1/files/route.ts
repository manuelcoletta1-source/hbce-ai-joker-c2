import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-FILES-CONTRACT-v0.1" as const;

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer" as const;
const API_VERSION = "v1" as const;
const RUNTIME = "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

const RUNTIME_IPR = "IPR-AI-0001" as const;

const LEGAL_CERTIFICATION = false as const;
const OPC_BOUNDARY = "technical proof receipt only" as const;
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document" as const;

type JsonObject = Record<string, unknown>;

type FileDescriptor = {
  filename?: unknown;
  name?: unknown;
  mimeType?: unknown;
  size?: unknown;
  sha256?: unknown;
  hash?: unknown;
  role?: unknown;
};

function nowIso(): string {
  return new Date().toISOString();
}

function sha256(input: string): string {
  return `sha256:${createHash("sha256").update(input).digest("hex")}`;
}

function jsonResponse(body: JsonObject, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Route-Revision": ROUTE_REVISION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY
    }
  });
}

function boundary() {
  return {
    legalCertification: LEGAL_CERTIFICATION,
    opc: OPC_BOUNDARY,
    opcBoundary: OPC_BOUNDARY,
    iprCard: IPR_CARD_BOUNDARY,
    iprCardBoundary: IPR_CARD_BOUNDARY,
    rawTextPersistence: false,
    automaticIprMemoryWrite: false,
    sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
    filePersistenceMode: "DESCRIPTOR_ONLY_NO_RAW_FILE_STORAGE",
    executionMode: "CONTRACT_ONLY_NO_RUNTIME_FILE_INGESTION",
    authorityEvaluation: "NOT_PERFORMED",
    clientClaimsCreateAuthority: false,
    authorizationRequiredForRuntimeExecution: true
  };
}

function runtimeContext() {
  return {
    runtime: RUNTIME,
    runtimeIpr: RUNTIME_IPR,
    authorityEvaluation: "NOT_PERFORMED_BY_CONTRACT_ENDPOINT",
    access: "NOT_EVALUATED",
    memory: "NOT_ACCESSED",
    memoryScope: "NOT_EVALUATED",
    policy: "NOT_EVALUATED",
    matrix: "CONTRACT_METADATA_ONLY",
    clientClaimsCreateAuthority: false,
    legalCertification: LEGAL_CERTIFICATION
  };
}

function normalizeFileDescriptor(file: FileDescriptor, index: number) {
  const filename =
    typeof file.filename === "string"
      ? file.filename
      : typeof file.name === "string"
        ? file.name
        : `file-${index + 1}`;

  const mimeType =
    typeof file.mimeType === "string"
      ? file.mimeType
      : "application/octet-stream";

  const size =
    typeof file.size === "number" && Number.isFinite(file.size) && file.size >= 0
      ? file.size
      : null;

  const suppliedHash =
    typeof file.sha256 === "string"
      ? file.sha256
      : typeof file.hash === "string"
        ? file.hash
        : null;

  const descriptorHash = sha256(
    JSON.stringify({
      filename,
      mimeType,
      size,
      suppliedHash,
      index
    })
  );

  return {
    index,
    filename,
    mimeType,
    size,
    suppliedHash,
    descriptorHash,
    intakeMode: "DESCRIPTOR_ONLY",
    rawFilePersisted: false,
    rawTextPersisted: false,
    acceptedByContract: true
  };
}

export async function GET(): Promise<NextResponse> {
  return jsonResponse({
    ok: true,
    status: "HBCE_FILE_INTAKE_CONTRACT_READY",
    product: PRODUCT,
    apiVersion: API_VERSION,
    routeRevision: ROUTE_REVISION,
    generatedAt: nowIso(),
    endpoint: "/api/v1/files",
    publicPath: "/v1/files",
    methods: ["GET", "POST"],
    purpose:
      "Expose the HBCE IPR Runtime API v1 file intake contract without uncontrolled raw file persistence.",
    mode: "FILE_DESCRIPTOR_CONTRACT_ONLY",
    minimumInput: ["sessionId", "humanIpr", "files"],
    acceptedFileDescriptorFields: [
      "filename",
      "mimeType",
      "size",
      "sha256",
      "role",
      "constraints"
    ],
    responseIncludes: [
      "fileIntakeId",
      "acceptedFiles",
      "descriptorHashes",
      "policy",
      "boundary",
      "legalCertification:false"
    ],
    runtimeContext: runtimeContext(),
    policy: {
      decision: "NOT_EVALUATED",
      rawTextPersistence: false,
      automaticIprMemoryWrite: false,
      sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
      filePersistenceMode: "DESCRIPTOR_ONLY_NO_RAW_FILE_STORAGE",
      legalCertification: LEGAL_CERTIFICATION
    },
    boundary: boundary()
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: JsonObject;

  try {
    const parsed = await request.json();

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse(
        {
          ok: false,
          status: "HBCE_FILE_INTAKE_FAIL",
          product: PRODUCT,
          apiVersion: API_VERSION,
          routeRevision: ROUTE_REVISION,
          failReason: "INVALID_JSON_BODY",
          message: "Expected a JSON object body.",
          legalCertification: LEGAL_CERTIFICATION,
          boundary: boundary()
        },
        400
      );
    }

    body = parsed as JsonObject;
  } catch {
    return jsonResponse(
      {
        ok: false,
        status: "HBCE_FILE_INTAKE_FAIL",
        product: PRODUCT,
        apiVersion: API_VERSION,
        routeRevision: ROUTE_REVISION,
        failReason: "INVALID_JSON_BODY",
        message: "Expected valid JSON body.",
        legalCertification: LEGAL_CERTIFICATION,
        boundary: boundary()
      },
      400
    );
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const humanIpr = typeof body.humanIpr === "string" ? body.humanIpr.trim() : "";
  const files = Array.isArray(body.files) ? (body.files as FileDescriptor[]) : [];

  if (!sessionId) {
    return jsonResponse(
      {
        ok: false,
        status: "HBCE_FILE_INTAKE_FAIL",
        product: PRODUCT,
        apiVersion: API_VERSION,
        routeRevision: ROUTE_REVISION,
        failReason: "MISSING_SESSION_ID",
        message: "Missing required field: sessionId.",
        expected: {
          sessionId: "string returned by /api/v1/ipr/session"
        },
        legalCertification: LEGAL_CERTIFICATION,
        boundary: boundary()
      },
      400
    );
  }

  if (!humanIpr) {
    return jsonResponse(
      {
        ok: false,
        status: "HBCE_FILE_INTAKE_FAIL",
        product: PRODUCT,
        apiVersion: API_VERSION,
        routeRevision: ROUTE_REVISION,
        failReason: "MISSING_HUMAN_IPR",
        message:
          "Missing required requested Human IPR claim. This contract-only endpoint validates descriptor shape but does not authenticate or authorize the supplied identity.",
        expected: {
          humanIpr: "non-empty requested Human IPR string"
        },
        authorityEvaluation: "NOT_PERFORMED",
        clientClaimsCreateAuthority: false,
        legalCertification: LEGAL_CERTIFICATION,
        boundary: boundary()
      },
      400
    );
  }

  if (files.length === 0) {
    return jsonResponse(
      {
        ok: false,
        status: "HBCE_FILE_INTAKE_FAIL",
        product: PRODUCT,
        apiVersion: API_VERSION,
        routeRevision: ROUTE_REVISION,
        failReason: "MISSING_FILES",
        message:
          "Missing required field: files. Expected a non-empty file descriptor array.",
        expected: {
          files: [
            {
              filename: "string",
              mimeType: "string optional",
              size: "number optional",
              sha256: "string optional"
            }
          ]
        },
        legalCertification: LEGAL_CERTIFICATION,
        boundary: boundary()
      },
      400
    );
  }

  const acceptedFiles = files.map(normalizeFileDescriptor);
  const requestedAt = nowIso();

  const fileIntakeId = `FILE-INTAKE-V1-${sha256(
    JSON.stringify({
      sessionId,
      humanIpr,
      acceptedFiles,
      requestedAt
    })
  )
    .replace("sha256:", "")
    .slice(0, 16)
    .toUpperCase()}`;

  return jsonResponse(
    {
      ok: true,
      status: "HBCE_FILE_INTAKE_CONTRACT_READY",
      product: PRODUCT,
      apiVersion: API_VERSION,
      routeRevision: ROUTE_REVISION,
      fileIntake: {
        fileIntakeId,
        sessionId,
        humanIpr,
        humanIprStatus: "UNVERIFIED_CLIENT_CLAIM",
        runtimeIpr: RUNTIME_IPR,
        authorizedTenant: null,
        authorizedWorkspace: null,
        authorityEvaluation: "NOT_PERFORMED",
        clientClaimsCreateAuthority: false,
        acceptedFileCount: acceptedFiles.length,
        acceptedFiles,
        intakeMode: "DESCRIPTOR_ONLY_NO_RAW_FILE_STORAGE",
        executionMode: "CONTRACT_VALIDATED_NO_AUTHORIZATION_DECISION",
        runtimeFileIngestionPerformed: false,
        databaseWritePerformed: false,
        evtCreated: false,
        opcCreated: false,
        auditCreated: false,
        usageCreated: false,
        requestedAt,
        legalCertification: LEGAL_CERTIFICATION
      },
      next: {
        runtimeFileIngestion:
          "Use the governed internal runtime/file pipeline, not this contract-only endpoint.",
        operationsEndpoint: "/api/v1/operations",
        chatEndpoint: "/api/v1/chat"
      },
      policy: {
        decision: "NOT_EVALUATED",
        memoryScope: "IPR_BOUND",
        rawTextPersistence: false,
        automaticIprMemoryWrite: false,
        sourceProfileSaveMode: "EXPLICIT_OPERATOR_SAVE_ONLY",
        legalCertification: LEGAL_CERTIFICATION
      },
      boundary: boundary()
    },
    202
  );
}
