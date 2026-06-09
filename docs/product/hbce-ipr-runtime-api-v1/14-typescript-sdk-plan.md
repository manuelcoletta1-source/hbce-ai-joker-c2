HBCE IPR Runtime API v1

TypeScript SDK Plan

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: TypeScript SDK plan, client architecture, endpoint wrappers, types, errors, examples
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the TypeScript SDK plan for HBCE IPR Runtime API v1.

The SDK will provide a typed client for integrating with the HBCE/JOKER-C2 governed AI runtime.

The SDK should help client systems call the API without manually rebuilding every request, header, proof reference, error envelope and boundary field.

The SDK must support:

API authentication
IPR session creation
governed chat execution
operation creation and lookup
EVT lookup
OPC lookup
audit lookup
model usage lookup
Source Intelligence descriptor lookup
OpenAPI contract lookup
self-test execution
quota descriptor lookup when implemented
tenant descriptor lookup when implemented
stable error handling
technical boundary propagation

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. SDK positioning

The SDK should be positioned as:

A TypeScript client for HBCE IPR Runtime API v1,
built for governed AI execution, technical proof references,
audit visibility and B2G pilot integration.

It is not:

a legal certification SDK
an official identity SDK
a qualified timestamp SDK
a public authority client
a replacement for legal review
a replacement for human oversight

The SDK wraps technical runtime APIs.

It does not change the legal boundary of the runtime.

---

3. Package name

Recommended package name:

@hbce/ipr-runtime-sdk

Alternative internal package name:

@hbce/joker-c2-runtime-sdk

Recommended first package name:

@hbce/ipr-runtime-sdk

Reason:

The public product is HBCE IPR Runtime API v1.
JOKER-C2 is the runtime engine.
The SDK should follow the product API name.

---

4. Repository location

Recommended location:

packages/hbce-ipr-runtime-sdk

Alternative location for first internal version:

sdk/typescript/hbce-ipr-runtime-sdk

Recommended first implementation path:

packages/hbce-ipr-runtime-sdk

Expected package structure:

packages/hbce-ipr-runtime-sdk/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts
    client.ts
    types.ts
    errors.ts
    constants.ts
    endpoints/
      health.ts
      capabilities.ts
      ipr-session.ts
      chat.ts
      files.ts
      operations.ts
      events.ts
      opc.ts
      audit.ts
      model-usage.ts
      openapi.ts
      self-test.ts
      source-intelligence.ts
      tenant.ts
      quota.ts
    examples/
      ipr-ai-audit-trail-demo.ts
      source-intelligence-descriptor.ts
      operation-polling.ts

If the repo does not yet support workspaces, the SDK can begin as documentation and standalone package folder without being wired into the main build.

Do not break the Next.js application just to feel productive. Civilization has suffered enough.

---

5. SDK design principles

The SDK must be:

typed
minimal
B2G-safe
boundary-aware
tenant-aware
credential-aware
error-stable
OpenAPI-aligned
runtime-proof aware

The SDK must not hide critical governance fields.

It should expose:

responseEvt
opcId
auditId
usageId
tenantId
workspaceId
legalCertification
opcBoundary
evtBoundary
iprBoundary

The SDK should not silently discard proof metadata because some developer wanted a “clean response”. Clean responses are how audit trails go to die.

---

6. Runtime base URLs

The SDK must support both current internal route and future gateway route.

Current internal runtime:

/api/v1

Future public gateway:

/v1

SDK configuration:

const client = new HbceIprRuntimeClient({
  baseUrl: "https://runtime.example/api/v1",
  apiKey: process.env.HBCE_API_KEY
});

Future gateway configuration:

const client = new HbceIprRuntimeClient({
  baseUrl: "https://api.hbce.example/v1",
  apiKey: process.env.HBCE_API_KEY
});

The SDK must not hardcode the production URL in the first implementation.

---

7. Authentication model

The SDK should support:

x-hbce-api-key
Authorization: Bearer <token>

Recommended first implementation:

x-hbce-api-key

Client configuration:

type HbceClientConfig = {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  tenantId?: string;
  workspaceId?: string;
  timeoutMs?: number;
};

Authentication rules:

If apiKey is provided, send x-hbce-api-key.
If bearerToken is provided, send Authorization: Bearer.
If both are provided, prefer bearerToken only if explicitly configured.
Do not log secrets.
Do not expose secrets in thrown errors.

---

8. Core client class

Recommended client name:

HbceIprRuntimeClient

Minimum shape:

const client = new HbceIprRuntimeClient({
  baseUrl: "https://runtime.example/api/v1",
  apiKey: "hbce_pilot_..."
});

Expected methods:

client.health()
client.capabilities()
client.createIprSession(...)
client.getIprSession(...)
client.chat(...)
client.createFileDescriptor(...)
client.createOperation(...)
client.getOperation(...)
client.listEvents(...)
client.getOpc(...)
client.getAudit(...)
client.getModelUsage(...)
client.getOpenApi()
client.selfTest()
client.sourceIntelligence()
client.tenant()
client.quota()

Future grouping option:

client.ipr.createSession(...)
client.chat.create(...)
client.opc.get(...)
client.audit.get(...)
client.usage.get(...)

Recommended first implementation:

single client class with direct methods

Less ceremony. Fewer nested objects pretending to be architecture.

---

9. Shared response envelope

The SDK should normalize response envelopes but preserve raw data.

Recommended success type:

export type HbceSuccessEnvelope<TData> = {
  status: "OK" | "READY" | "COMPLETED";
  data?: TData;
  runtime?: HbceRuntimeIdentity;
  proof?: HbceProofReferences;
  boundary: HbceBoundary;
  raw?: unknown;
};

Recommended error type:

export type HbceErrorEnvelope = {
  status: "FAIL";
  error: {
    code: string;
    message: string;
    retryable: boolean;
    retryAfterSeconds?: number | null;
  };
  boundary: HbceBoundary;
};

The SDK should allow access to the raw server response:

response.raw

No hiding important runtime fields. This is an audit SDK, not a perfume bottle.

---

10. Boundary type

Required type:

export type HbceBoundary = {
  legalCertification: false;
  opcBoundary?: string;
  evtBoundary?: string;
  iprBoundary?: string;
  authorityBoundary?: string;
};

Every public SDK response should preserve:

legalCertification=false

If the response does not include boundary data, the SDK should either:

surface a warning field

or:

throw HBCE_BOUNDARY_MISSING in strict mode

Recommended first behavior:

non-strict mode = preserve response and warn
strict mode = throw HBCE_BOUNDARY_MISSING

---

11. Proof reference type

Required type:

export type HbceProofReferences = {
  responseEvt?: string | null;
  opcId?: string | null;
  auditId?: string | null;
  usageId?: string | null;
  chainHash?: string | null;
};

Any method that executes or retrieves proof-bearing runtime operations should expose proof references.

Examples:

chat response
operation response
OPC lookup
audit lookup
model usage lookup
self-test response

---

12. Runtime identity type

Required type:

export type HbceRuntimeIdentity = {
  runtimeIpr?: string | null;
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  accountId?: string | null;
  subscriptionId?: string | null;
  tier?: string | null;
};

For external B2G pilots, tenant/workspace fields must be populated when available.

---

13. Error handling

The SDK should throw a typed error for failed API calls.

Recommended class:

export class HbceApiError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number | null;
  readonly boundary?: HbceBoundary;
  readonly raw?: unknown;
}

Recommended error handling:

try {
  const result = await client.chat({
    message: "Run governed runtime diagnostic."
  });
} catch (error) {
  if (error instanceof HbceApiError) {
    console.error(error.code);
  }
}

SDK error must never include:

raw API key
bearer token
full Authorization header
raw secret

---

14. Request options

Common request options:

export type HbceRequestOptions = {
  idempotencyKey?: string;
  timeoutMs?: number;
  tenantId?: string;
  workspaceId?: string;
  headers?: Record<string, string>;
};

Supported headers:

x-hbce-api-key
Authorization
Idempotency-Key
X-HBCE-Tenant
X-HBCE-Workspace

Tenant/workspace may be configured globally or per request.

Per-request values should override global values only if explicitly allowed.

Recommended default:

global tenant/workspace cannot be overridden unless allowWorkspaceOverride=true

Boring, yes. Also how you avoid accidental cross-tenant nonsense.

---

15. Health method

Method:

client.health(options?)

Endpoint:

GET /v1/health

Expected return:

export type HbceHealthResponse = {
  status: string;
  runtime?: string;
  apiVersion?: string;
  memoryStatus?: string;
  sourceIntelligenceStatus?: string;
  databaseStatus?: string;
  boundary: HbceBoundary;
};

Use:

const health = await client.health();

---

16. Capabilities method

Method:

client.capabilities(options?)

Endpoint:

GET /v1/capabilities

Expected return:

export type HbceCapabilitiesResponse = {
  capabilities: string[];
  supportedEndpoints?: string[];
  supportedProofLayers?: string[];
  supportedSourceIntelligence?: boolean;
  supportedDocumentModes?: string[];
  boundary: HbceBoundary;
};

---

17. IPR session methods

Methods:

client.createIprSession(request, options?)
client.getIprSession(sessionId, options?)

Endpoints:

POST /v1/ipr/session
GET  /v1/ipr/session/{sessionId}

Request:

export type CreateIprSessionRequest = {
  tenantId?: string;
  workspaceId?: string;
  operatorReference?: string;
  requestedScope?: string;
};

Response:

export type IprSessionResponse = {
  sessionId: string;
  runtimeIpr?: string;
  humanIpr?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  scope?: string;
  accessDecision?: string;
  identityBinding?: string;
  expiresAt?: string | null;
  boundary: HbceBoundary;
};

Boundary:

IPR is an operational identity/proof layer only.

---

18. Chat method

Method:

client.chat(request, options?)

Endpoint:

POST /v1/chat

Request:

export type ChatRequest = {
  message: string;
  sessionId?: string;
  tenantId?: string;
  workspaceId?: string;
  sourceSet?: string;
  documentProfileIds?: string[];
  memoryIds?: string[];
  operationMode?: string;
  metadata?: Record<string, unknown>;
};

Response:

export type ChatResponse = {
  answer?: string;
  runtime?: HbceRuntimeIdentity;
  policy?: {
    decision?: string;
    riskLevel?: string;
    humanOversight?: string;
  };
  proof?: HbceProofReferences;
  modelUsage?: {
    usageId?: string;
    model?: string;
    modelLevel?: string;
    costUnits?: number | null;
  };
  boundary: HbceBoundary;
  raw?: unknown;
};

Example:

const response = await client.chat({
  message: "Run governed runtime diagnostic.",
  tenantId: "HBCE-TENANT-CLIENT-CODE-PILOT",
  workspaceId: "HBCE-WORKSPACE-AI-AUDIT-TRAIL"
});

console.log(response.proof?.responseEvt);
console.log(response.proof?.opcId);
console.log(response.boundary.legalCertification);

---

19. Files method

Method:

client.createFileDescriptor(request, options?)

Endpoint:

POST /v1/files

Request:

export type FileDescriptorRequest = {
  tenantId?: string;
  workspaceId?: string;
  filename: string;
  contentType: string;
  fileSize: number;
  ingestionMode: "DESCRIPTOR_ONLY" | "TEXT_EXTRACTION_REQUESTED" | "DOCUMENT_PROFILE_REQUESTED";
  metadata?: Record<string, unknown>;
};

Response:

export type FileDescriptorResponse = {
  fileId: string;
  fileHash?: string;
  textStatus?: string;
  documentProfileId?: string | null;
  ingestionStatus?: string;
  boundary: HbceBoundary;
};

Boundary:

No raw text persistence by default.
PDF binary hash-only unless extraction is explicitly enabled.
Document profile does not imply legal validation.

---

20. Operation methods

Methods:

client.createOperation(request, options?)
client.getOperation(operationId, options?)

Endpoints:

POST /v1/operations
GET  /v1/operations/{operationId}

Request:

export type CreateOperationRequest = {
  operationType: string;
  tenantId?: string;
  workspaceId?: string;
  payload?: Record<string, unknown>;
};

Response:

export type OperationRecord = {
  operationId: string;
  operationType?: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED";
  tenantId?: string | null;
  workspaceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  proof?: HbceProofReferences;
  boundary: HbceBoundary;
};

---

21. OPC method

Method:

client.getOpc(opcId, options?)

Endpoint:

GET /v1/opc/{opcId}

Response:

export type OpcReceipt = {
  opcId: string;
  eventHash?: string;
  chainHash?: string;
  verificationStatus?: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  createdAt?: string;
  boundary: HbceBoundary;
};

Boundary:

OPC is a technical proof receipt only.
legalCertification=false

---

22. Audit method

Method:

client.getAudit(auditId, options?)

Endpoint:

GET /v1/audit/{auditId}

Response:

export type AuditRecord = {
  auditId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  runtimeIpr?: string | null;
  humanIpr?: string | null;
  policyDecision?: string;
  riskLevel?: string;
  evtId?: string | null;
  opcId?: string | null;
  usageId?: string | null;
  createdAt?: string;
  boundary: HbceBoundary;
};

---

23. Model usage method

Method:

client.getModelUsage(usageId, options?)

Endpoint:

GET /v1/model-usage/{usageId}

Response:

export type ModelUsageRecord = {
  usageId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  model?: string;
  modelLevel?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  costUnits?: number | null;
  costMinor?: number | null;
  evtId?: string | null;
  opcId?: string | null;
  auditId?: string | null;
  createdAt?: string;
  boundary: HbceBoundary;
};

---

24. Source Intelligence method

Method:

client.sourceIntelligence(options?)

Endpoint:

GET /v1/source-intelligence

Response:

export type SourceIntelligenceDescriptor = {
  registryStatus: string;
  sourceSetsActive?: number;
  catalogSources?: number;
  endpointChainStatus?: string;
  pdfBoundary?: string;
  rawTextPersistence?: boolean;
  memoryProfilePolicy?: string;
  sourceSets?: string[];
  boundary: HbceBoundary;
};

Boundary:

Source Intelligence provides governed source handling.
It does not certify external source legal authority.

---

25. OpenAPI method

Method:

client.getOpenApi(options?)

Endpoint:

GET /v1/openapi

Response:

export type OpenApiContract = Record<string, unknown>;

Use:

const openapi = await client.getOpenApi();

Purpose:

developer review
contract validation
SDK generation
integration testing

---

26. Self-test method

Method:

client.selfTest(options?)

Endpoint:

GET /v1/self-test

Response:

export type SelfTestResponse = {
  endpointCount: number;
  passedCount: number;
  failedCount: number;
  finalVerdict: "PASS" | "FAIL";
  contractOnly?: boolean;
  semanticMemoryCreated?: boolean;
  documentIngestionTriggered?: boolean;
  documentRecallTriggered?: boolean;
  sourceLiveFetchTriggered?: boolean;
  boundary: HbceBoundary;
};

Required PASS baseline:

endpointCount=16
passedCount=16
finalVerdict=PASS
legalCertification=false

---

27. Future tenant and quota methods

Future methods:

client.tenant(options?)
client.quota(options?)
client.quotaUsage(options?)
client.quotaLimits(options?)

Future endpoints:

GET /v1/tenant
GET /v1/quota
GET /v1/quota/usage
GET /v1/quota/limits

These should be added only when the server routes are implemented and validated.

No fantasy SDK methods pointing to endpoints that do not exist. That’s how documentation becomes folklore.

---

28. Example: AI Audit Trail demo

Recommended example file:

packages/hbce-ipr-runtime-sdk/src/examples/ipr-ai-audit-trail-demo.ts

Example flow:

import { HbceIprRuntimeClient } from "@hbce/ipr-runtime-sdk";

const client = new HbceIprRuntimeClient({
  baseUrl: process.env.HBCE_BASE_URL ?? "https://runtime.example/api/v1",
  apiKey: process.env.HBCE_API_KEY,
  tenantId: process.env.HBCE_TENANT_ID,
  workspaceId: process.env.HBCE_WORKSPACE_ID
});

async function main() {
  const health = await client.health();
  console.log("Health:", health.status);

  const session = await client.createIprSession({
    requestedScope: "JOKER_C2_ACCESS"
  });

  const response = await client.chat({
    sessionId: session.sessionId,
    message: "Run governed runtime diagnostic and return proof references."
  });

  console.log("EVT:", response.proof?.responseEvt);
  console.log("OPC:", response.proof?.opcId);
  console.log("Audit:", response.proof?.auditId);
  console.log("Usage:", response.proof?.usageId);
  console.log("legalCertification:", response.boundary.legalCertification);

  if (response.proof?.opcId) {
    const opc = await client.getOpc(response.proof.opcId);
    console.log("OPC verification:", opc.verificationStatus);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

---

29. SDK strict mode

The SDK should support strict mode.

Configuration:

const client = new HbceIprRuntimeClient({
  baseUrl: "...",
  apiKey: "...",
  strictBoundary: true
});

Strict mode should reject responses if:

boundary is missing
legalCertification is not false
unexpected public authority claim appears
proof references are missing on proof-bearing endpoints
tenant/workspace mismatch appears

Strict mode errors:

HBCE_BOUNDARY_MISSING
HBCE_LEGAL_CERTIFICATION_UNEXPECTED
HBCE_PROOF_REFERENCE_MISSING
HBCE_TENANT_WORKSPACE_MISMATCH

Recommended default:

strictBoundary=false for first pilot SDK
strictBoundary=true for B2G integration examples

---

30. SDK logging policy

SDK must not log secrets.

Never log:

apiKey
bearerToken
Authorization header
raw secret
full sensitive prompt
raw document content

Safe logs may include:

endpoint
method
status code
operationId
evtId
opcId
auditId
usageId
tenantId
workspaceId
legalCertification=false

Recommended debug option:

debug?: boolean

Debug mode should still redact secrets.

---

31. SDK retry policy

The SDK should retry only safe failures.

Retryable cases:

network timeout
429 RATE_LIMITED when retryAfterSeconds is provided
502/503/504 temporary upstream errors

Non-retryable cases:

API_KEY_INVALID
API_KEY_REVOKED
API_KEY_EXPIRED
TENANT_SCOPE_MISMATCH
WORKSPACE_SCOPE_MISMATCH
POLICY_DENIED
QUOTA_EXCEEDED
LEGAL_BOUNDARY_ERROR

Retry configuration:

type RetryConfig = {
  maxRetries?: number;
  retryOnRateLimit?: boolean;
  retryOnServerError?: boolean;
};

Default first implementation:

no automatic retry
expose retryAfterSeconds

Because automatic retry without thinking is how systems DDoS themselves and then write incident reports with sad adjectives.

---

32. SDK polling helper

Future helper:

client.waitForOperation(operationId, {
  intervalMs: 5000,
  timeoutMs: 60000
});

Rules:

minimum polling interval = 2000ms
recommended interval = 5000ms
respect Retry-After
stop on COMPLETED, FAILED, CANCELLED, EXPIRED

Do not include polling helper until operation lifecycle is stable.

---

33. SDK build targets

Recommended build output:

ESM
CommonJS optional
TypeScript declarations

Recommended package settings:

{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}

First implementation can target Node.js.

Browser support should be reviewed separately because browser-side API keys are a security tragedy wearing a frontend hoodie.

---

34. Environment variables

Recommended environment variables for examples:

HBCE_BASE_URL
HBCE_API_KEY
HBCE_BEARER_TOKEN
HBCE_TENANT_ID
HBCE_WORKSPACE_ID
HBCE_IPR_SESSION_ID

Example ".env.example":

HBCE_BASE_URL=https://runtime.example/api/v1
HBCE_API_KEY=hbce_pilot_k_example_xxxxxxxxxxxxxxxxxxxxx
HBCE_TENANT_ID=HBCE-TENANT-CLIENT-CODE-PILOT
HBCE_WORKSPACE_ID=HBCE-WORKSPACE-AI-AUDIT-TRAIL

Never commit real credentials.

Saying this is necessary because humanity keeps putting secrets into Git repos like offerings to the breach gods.

---

35. SDK documentation

SDK README should include:

installation
configuration
authentication
first health check
create IPR session
send governed chat request
retrieve OPC
retrieve audit
retrieve model usage
Source Intelligence descriptor
error handling
boundary explanation
legalCertification=false

Recommended installation placeholder:

npm install @hbce/ipr-runtime-sdk

Until package publication:

npm install ./packages/hbce-ipr-runtime-sdk

---

36. SDK test plan

Minimum tests:

client configuration
auth header generation
health request
capabilities request
IPR session request
chat request
OPC lookup
audit lookup
model usage lookup
error envelope parsing
boundary parsing
secret redaction
tenant/workspace header behavior

Recommended test mode:

mock fetch first
live self-pilot integration second

Do not rely only on live runtime tests.

Live tests are useful until the network has an opinion.

---

37. OpenAPI alignment

SDK types should be aligned with:

docs/product/hbce-ipr-runtime-api-v1/13-openapi-stabilization-plan.md
GET /api/v1/openapi

Generation options:

manual SDK first
OpenAPI-generated SDK later
hybrid: generated types + handwritten client

Recommended first approach:

handwritten minimal SDK
OpenAPI alignment through shared type names

Reason:

The API contract is still stabilizing.
A generated SDK is useful only after schemas are stable.

---

38. First implementation order

Recommended implementation order:

1. Create SDK package folder.
2. Add package.json.
3. Add tsconfig.json.
4. Add src/types.ts.
5. Add src/errors.ts.
6. Add src/client.ts.
7. Add src/index.ts.
8. Implement request helper.
9. Implement health.
10. Implement capabilities.
11. Implement createIprSession.
12. Implement chat.
13. Implement getOpc.
14. Implement getAudit.
15. Implement getModelUsage.
16. Add Source Intelligence descriptor method.
17. Add self-test method.
18. Add example ipr-ai-audit-trail-demo.ts.
19. Add README.
20. Run TypeScript check.

First code file when implementation starts:

packages/hbce-ipr-runtime-sdk/package.json

Second file:

packages/hbce-ipr-runtime-sdk/tsconfig.json

Third file:

packages/hbce-ipr-runtime-sdk/src/types.ts

Do not start with 22 files at once. That is not engineering, that is confetti.

---

39. Acceptance criteria

The SDK plan is ready when:

package name is defined
folder structure is defined
client config is defined
auth model is defined
shared boundary type is defined
proof reference type is defined
error model is defined
core endpoint methods are defined
example AI audit trail flow is defined
OpenAPI alignment is defined
first implementation order is defined
legalCertification=false is preserved

Minimum SDK implementation PASS output:

HBCE_TYPESCRIPT_SDK_READY
package=@hbce/ipr-runtime-sdk
client=HbceIprRuntimeClient
auth=API_KEY_SUPPORTED
health=PASS
chat=PASS
opcLookup=PASS
auditLookup=PASS
usageLookup=PASS
boundary=legalCertification=false

---

40. Non-goals for first SDK

Do not include in the first SDK:

browser credential storage
OAuth
SAML
OIDC
full admin console
billing client
tenant provisioning client
complex RBAC client
automatic SDK generation
webhook server framework
document upload streaming
large file multipart upload

First SDK must do one thing well:

call HBCE IPR Runtime API v1 safely and expose proof/audit/usage metadata.

---

41. Final statement

The TypeScript SDK is the bridge between HBCE IPR Runtime API v1 and external B2G integration.

It must make governed AI execution easy to call without hiding the governance chain.

The SDK must preserve:

IPR context
tenant/workspace context
EVT reference
OPC reference
audit reference
model usage reference
Source Intelligence descriptor
error envelope
legalCertification=false

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
