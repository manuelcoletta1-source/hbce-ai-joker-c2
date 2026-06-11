import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const ROUTE_REVISION =
  "HBCE-IPR-RUNTIME-API-v1-FILES-CONTRACT-v0.1" as const;

const PRODUCT = "HBCE IPR Operational Identity & Proof Layer" as const;
const API_VERSION = "v1" as const;
const RUNTIME = "AI_JOKER_C2_SAAS_CORE_v0_1" as const;

const HUMAN_IPR = "IPR-88505FE91013DCFE97C56ED1" as const;
const RUNTIME_IPR = "IPR-AI-0001" as const;
const TENANT = "HBCE-TENANT-SELF-PILOT" as const;
const WORKSPACE = "HBCE-WORKSPACE-RND" as const;

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
    executionMode: "CONTRACT_ONLY_NO_RUNTIME_FILE_INGESTION"
  };
}

function runtimeContext() {
  return {
    runtime: RUNTIME,
    humanIpr: HUMAN_IPR,
    runtimeIpr: RUNTIME_IPR,
    tenant: TENANT,
    workspace: WORKSPACE,
    access: "ACCESS_GRANTED",
    memory: "DATABASE_PERSISTENT",
    memoryScope: "IPR_BOUND",
    policy: "ALLOW",
    matrix: "MATRIX_ACTIVE",
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
      decision: "ALLOW",
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

  if (humanIpr !== HUMAN_IPR) {
    return jsonResponse(
      {
        ok: false,
        status: "HBCE_FILE_INTAKE_FAIL",
        product: PRODUCT,
        apiVersion: API_VERSION,
        routeRevision: ROUTE_REVISION,
        failReason: humanIpr ? "INVALID_HUMAN_IPR" : "MISSING_HUMAN_IPR",
        message:
          "The supplied humanIpr is missing or not allowed for this self-pilot v1 contract endpoint.",
        expected: {
          humanIpr: HUMAN_IPR
        },
        legalCertification: LEGAL_CERTIFICATION,
        boundary: boundary()
      },
      humanIpr ? 403 : 400
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
        runtimeIpr: RUNTIME_IPR,
        tenant: TENANT,
        workspace: WORKSPACE,
        acceptedFileCount: acceptedFiles.length,
        acceptedFiles,
        intakeMode: "DESCRIPTOR_ONLY_NO_RAW_FILE_STORAGE",
        executionMode: "ACCEPTED_BY_CONTRACT_ONLY",
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
        decision: "ALLOW",
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
