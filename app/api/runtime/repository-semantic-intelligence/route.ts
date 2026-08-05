/**
 * HERMETICUM B.C.E. S.r.l.
 *
 * AI JOKER-C2
 * MOD-002 Repository Semantic Intelligence
 *
 * Governed Runtime API Route
 *
 * Revision:
 * AIJC2-RUNTIME-REPOSITORY-SEMANTIC-INTELLIGENCE-API-v1_0
 *
 * Purpose:
 * - expose the governed MOD-002 runtime service;
 * - accept only explicit semantic input;
 * - execute no autonomous repository discovery or mutation;
 * - preserve fail-closed and legal boundaries.
 *
 * legalCertification=false
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  executeRepositorySemanticIntelligenceService,
  RepositorySemanticIntelligenceServiceError,
  type RepositorySemanticIntelligenceServiceRequest,
} from "@/src/runtime/services/repository-semantic-intelligence.service";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const maxDuration =
  60;

export const REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION =
  "AIJC2-RUNTIME-REPOSITORY-SEMANTIC-INTELLIGENCE-API-v1_0" as const;

type UnknownRecord =
  Record<string, unknown>;

type RepositorySemanticApiFailReason =
  | "INVALID_JSON_BODY"
  | "INVALID_REQUEST"
  | "HUMAN_AUTHORIZATION_REQUIRED"
  | "LEGAL_BOUNDARY_VIOLATION"
  | "SEMANTIC_RUNTIME_FAIL_CLOSED"
  | "INTERNAL_RUNTIME_ERROR";

interface RepositorySemanticApiFailPayload {
  ok: false;

  status:
    "REPOSITORY_SEMANTIC_API_FAIL_CLOSED";

  revision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION;

  failReason:
    RepositorySemanticApiFailReason;

  message:
    string;

  errorCode:
    string | null;

  governance: {
    deterministic:
      true;

    failClosed:
      true;

    autonomousExecution:
      false;

    humanAuthorizationRequired:
      true;

    persistentMemoryCreated:
      false;

    automaticRecallUsed:
      false;

    legalCertification:
      false;
  };

  legalCertification:
    false;
}

interface RepositorySemanticApiContractPayload {
  ok: true;

  status:
    "REPOSITORY_SEMANTIC_API_READY";

  revision:
    typeof REPOSITORY_SEMANTIC_INTELLIGENCE_API_REVISION;

  endpoint:
    "/api/runtime/repository-semantic-intelligence";

  method:
    "POST";

  moduleId:
    "MOD-002";

  purpose:
    "Execute governed Repository Semantic Intelligence from explicit repository evidence.";

  requiredInput: readonly [
    "input",
    "operationId",
    "responseEvt",
    "legalCertification:false",
  ];

  optionalInput: readonly [
    "opcId",
  ];

  boundary: {
    explicitInputRequired:
      true;

    filesystemAccess:
      false;

    githubApiAccess:
      false;

    sourceExecution:
      false;

    autonomousMutation:
      false;

    persistentMemory:
      false;

    automaticRecall:
      false;

    humanAuthorizationRequired:
      true;

    legalCertification:
      false;
  };

  generatedAt:
    string;

  legalCertification:
    false;
}

function isRecord(
  value: unknown,
):
