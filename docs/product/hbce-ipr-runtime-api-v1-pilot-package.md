# HBCE IPR Runtime API v1 — Pilot Package

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**Repository:** `hbce-ai-joker-c2`  
**API version:** `v1`  
**Package status:** `Pilot-ready technical package`  
**Audience:** B2B / B2G partners, institutional pilots, compliance teams, software integrators, cybersecurity and AI governance stakeholders  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Executive summary

HBCE IPR Runtime API v1 is the public pilot surface for a governed AI runtime built around operational identity, traceability and technical proof receipts.

The API allows a controlled external client to:

1. discover the runtime;
2. verify public health and capabilities;
3. create an IPR-bound operational session;
4. execute an authenticated AI interaction through JOKER-C2;
5. receive runtime identifiers such as EVT, OPC and audit IDs;
6. inspect public lookup envelopes for operations, events, OPC and audit;
7. preserve the explicit boundary that the system does not claim legal certification.

The pilot package is designed for partners who need more than a chatbot and less than an uncontrolled internal database exposure. In other words: a usable governed AI runtime, not another glorious pile of demo vaporware.

---

## 2. What this pilot package is

This package is a practical technical and commercial entry point for controlled API v1 pilots.

It provides:

- a validated public API v1 surface;
- a live-tested authenticated client flow;
- a TypeScript client foundation;
- a client smoke test;
- a technical smoke test report;
- an integration guide;
- a boundary statement for compliance and legal review;
- a pilot framing for B2B / B2G discussions.

The package is suitable for early partner evaluation, technical due diligence, integration testing and controlled proof-of-concept activity.

---

## 3. What this pilot package is not

This package is not:

- a public legal identity system;
- a qualified electronic signature product;
- an official public identity document service;
- a public certification authority;
- an unrestricted AI agent deployment platform;
- a raw database export API;
- a public access portal for internal prompts, completions or provider telemetry;
- a final regulated production deployment.

The active boundary remains:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR Card is an internal operational identity certificate, not an official public identity document
```

This distinction matters. Without it, every technical receipt becomes a legal fantasy, and civilization already has enough paperwork pretending to be reality.

---

## 4. Product positioning

HBCE IPR Runtime API v1 positions JOKER-C2 as a governed AI execution layer.

The core idea is simple:

```txt
IPR identifies the operational subject.
JOKER-C2 executes the governed AI interaction.
EVT traces the event.
OPC produces the technical proof receipt.
Audit records the control envelope.
MATRIX organizes the process.
HBCE governs the runtime.
```

The API is not presented as a generic AI chat endpoint. It is presented as an identity-bound runtime surface for controlled AI execution.

---

## 5. Target users

The pilot package is relevant for:

- companies evaluating governed AI workflows;
- software houses integrating AI into regulated or semi-regulated environments;
- compliance and audit teams that need traceable AI interactions;
- cybersecurity teams evaluating controlled AI runtime boundaries;
- institutional pilots requiring identity-bound execution;
- public-sector or B2G stakeholders assessing AI governance infrastructure;
- legal-tech and risk-management actors who need evidence envelopes rather than untraceable model calls.

---

## 6. Core pilot value proposition

The pilot demonstrates that an external client can run an AI interaction through a governed runtime and receive a structured execution trail.

The value is not merely that the API answers a prompt.

The value is that the interaction is wrapped in:

- API key access control;
- IPR-bound session creation;
- tenant and workspace scope;
- runtime identity;
- fail-closed unauthenticated access;
- EVT event trace;
- OPC technical proof receipt;
- audit lookup envelope;
- public contract routes;
- explicit non-legal-certification boundary.

That is the difference between “we called a model” and “we executed a governed runtime interaction.”

---

## 7. Current validated components

The current API v1 package includes:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
```

The route set is suitable for a controlled pilot integration flow.

---

## 8. Supporting repository assets

The current package is supported by the following repository assets:

```txt
lib/api-v1-client.ts
scripts/test-api-v1-client-smoke.mjs
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
```

These assets provide the technical base for client integration, live smoke testing and partner-facing explanation.

---

## 9. Live validation status

The live API v1 client smoke test has passed with zero critical failures and zero optional warnings.

Final result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
capturedIds=true
```

Validated checks:

```txt
PASS node runtime
PASS root discovery
PASS health
PASS capabilities
PASS self-test
PASS openapi
PASS chat without key fail-closed
PASS ipr session create
PASS chat with key
PASS operations lookup
PASS events lookup
PASS opc lookup
PASS audit lookup
SKIPPED model usage lookup
```

The model usage lookup was skipped because the runtime response returned:

```txt
usageId=NONE
```

This is not a failure.

---

## 10. Authentication posture

The pilot flow requires API-key authentication for protected execution.

Supported authentication headers:

```txt
Authorization: Bearer <API_KEY>
X-API-Key: <API_KEY>
X-HBCE-API-Key: <API_KEY>
```

The unauthenticated chat route is expected to fail closed:

```txt
POST /api/v1/chat without API key -> HTTP 401
```

Canonical validation:

```txt
PASS chat without key fail-closed [critical] http=401
```

This is a critical pilot requirement. A governed AI runtime that executes protected operations without a key is not governed; it is just a machine politely waiting to become a problem.

---

## 11. IPR-bound session model

The pilot flow starts with IPR-bound session creation.

Route:

```txt
POST /api/v1/ipr/session
```

The session binds the interaction to:

```txt
tenant
workspace
human IPR
runtime IPR
purpose
boundary
```

The active self-pilot scope uses:

```txt
tenant=HBCE-TENANT-SELF-PILOT
workspace=HBCE-WORKSPACE-RND
runtimeIpr=IPR-AI-0001
```

The Human IPR must match the active environment scope. The smoke test reads the active value locally from:

```txt
app/api/v1/ipr/session/route.ts
```

without printing it.

Successful validation:

```txt
PASS ipr session create [critical] http=201
```

---

## 12. Governed chat execution

After session creation, the external client sends an authenticated chat request.

Route:

```txt
POST /api/v1/chat
```

A successful response confirms:

```txt
HBCE_IPR_RUNTIME_CHAT_READY
```

Live validation:

```txt
PASS chat with key [critical] http=200
```

The chat response can return runtime identifiers including:

```txt
responseEvt
evtId
eventId
opcId
auditId
usageId
modelUsageId
```

The pilot client captures these identifiers and uses them for lookup checks.

---

## 13. EVT trace

EVT is the technical runtime event trace.

Correct public lookup route:

```txt
GET /api/v1/events?eventId={eventId}
```

Important: the events route uses query-string lookup form.

Correct:

```txt
GET /api/v1/events?eventId=EVT-...
```

Incorrect:

```txt
GET /api/v1/events/EVT-...
```

Validated final result:

```txt
PASS events lookup [optional] http=200
```

The current route exposes the EVT contract and lookup envelope. It does not expose unrestricted raw internal event database records.

---

## 14. OPC technical proof receipt

OPC is the technical proof receipt layer.

Lookup route:

```txt
GET /api/v1/opc/{opcId}
```

Validated result:

```txt
PASS opc lookup [optional] http=200
```

Boundary:

```txt
OPC=technical proof receipt only
```

OPC is not public legal certification. It is a technical receipt of runtime activity.

---

## 15. Audit lookup

Audit lookup route:

```txt
GET /api/v1/audit/{auditId}
```

Validated result:

```txt
PASS audit lookup [optional] http=200
```

Audit lookup must preserve redaction boundaries.

It must not expose:

- raw prompts;
- raw completions;
- provider payloads;
- unrestricted internal logs;
- secrets;
- cookies;
- bearer tokens;
- private database rows.

---

## 16. Operations lookup

Operations lookup route:

```txt
GET /api/v1/operations/{operationId}
```

Validated result:

```txt
PASS operations lookup [optional] http=200
```

The pilot treats operations lookup as an optional but valuable part of runtime traceability.

---

## 17. Files route

File contract route:

```txt
POST /api/v1/files
```

The files route belongs to the v1 public surface.

Pilot interpretation:

- governed file ingestion contract;
- no uncontrolled raw file dump;
- tenant/workspace scoped;
- IPR-aware;
- memory policy constrained;
- legal certification boundary preserved.

The files route is relevant for future document, dossier and evidence-oriented pilot flows.

---

## 18. Model usage lookup

Model usage lookup route:

```txt
GET /api/v1/model-usage/{usageId}
```

This lookup is executed only if a usage ID is returned by the runtime.

If no usage ID is returned, the smoke test reports:

```txt
SKIPPED model usage lookup [optional] :: no lookup id returned by chat response
```

This is acceptable for the current pilot status.

---

## 19. Source Intelligence extension

The public API v1 package can be extended with Source Intelligence capability.

Conceptual route:

```txt
GET /api/v1/source-intelligence
```

Source Intelligence must remain governed by:

```txt
allowlist
source set registry
prompt injection screening
hash/proof orientation
rawTextPersistence=false
memoryProfilePolicy=EXPLICIT_OPERATOR_SAVE_ONLY
legalCertification=false
```

This module is relevant for pilots involving AI governance, source verification, regulatory intelligence, technical dossier analysis and cyber-risk source monitoring.

---

## 20. Pilot integration flow

Recommended partner pilot flow:

```txt
1. Partner receives API key for controlled environment.
2. Partner checks GET /api/v1.
3. Partner checks GET /api/v1/health.
4. Partner checks GET /api/v1/capabilities.
5. Partner checks GET /api/v1/openapi.
6. Partner verifies POST /api/v1/chat without key fails with 401 in test mode.
7. Partner creates IPR session with POST /api/v1/ipr/session.
8. Partner sends authenticated interaction to POST /api/v1/chat.
9. Partner captures EVT, OPC and audit IDs.
10. Partner checks GET /api/v1/events?eventId={eventId}.
11. Partner checks GET /api/v1/opc/{opcId}.
12. Partner checks GET /api/v1/audit/{auditId}.
13. Partner documents boundary: legalCertification=false.
14. Partner evaluates fit for controlled workflow.
```

---

## 21. Pilot success criteria

A pilot is technically successful when:

```txt
public discovery responds
health responds
capabilities respond
openapi responds
unauthenticated chat fails closed
IPR session creation succeeds
authenticated chat succeeds
EVT identifier is returned or trace envelope is available
OPC identifier is returned or proof envelope is available
audit identifier is returned or audit envelope is available
lookup routes respond according to contract
legalCertification=false remains explicit
OPC technical proof boundary remains explicit
```

The current client smoke test already validates the core version of these criteria.

---

## 22. Suggested pilot phases

### Phase 1 — Technical access validation

Goal:

```txt
confirm partner can reach the API v1 surface and authenticate safely
```

Activities:

- API key issuance;
- public route checks;
- fail-closed unauthenticated check;
- smoke test execution;
- basic log review.

Deliverable:

```txt
API v1 access validation note
```

### Phase 2 — IPR-bound execution validation

Goal:

```txt
confirm partner can create an IPR session and execute authenticated chat
```

Activities:

- session creation;
- authenticated chat;
- EVT / OPC / audit ID capture;
- lookup route checks.

Deliverable:

```txt
IPR-bound runtime execution report
```

### Phase 3 — Workflow mapping

Goal:

```txt
map API v1 runtime to partner use case
```

Possible use cases:

- compliance assistant;
- controlled AI audit trail;
- cyber incident reasoning log;
- B2G evidence dossier;
- document ingestion governance;
- AI source intelligence watch;
- operator-bound AI decision support.

Deliverable:

```txt
partner workflow integration map
```

### Phase 4 — Controlled pilot

Goal:

```txt
run a scoped pilot with explicit governance boundaries
```

Activities:

- define users;
- define tenant/workspace;
- define allowed operations;
- define retention;
- define audit visibility;
- define security escalation;
- define export boundaries.

Deliverable:

```txt
controlled pilot report
```

---

## 23. Suggested B2B use cases

The API v1 pilot can support:

- internal AI usage audit trail;
- controlled AI assistant for compliance teams;
- operator-bound document reasoning;
- traceable technical advisory workflows;
- software-house integration of governed AI runtime;
- vendor due diligence proof-of-execution;
- cyber-risk analysis logging;
- AI output accountability envelope.

---

## 24. Suggested B2G use cases

The API v1 pilot can support:

- institutional AI governance pilot;
- public-sector AI audit trail;
- AI-assisted dossier generation with technical proof receipt;
- controlled cyber incident analysis workflow;
- AI interaction traceability model;
- source intelligence registry evaluation;
- evidence-oriented AI runtime demonstration;
- operational identity-bound AI interface.

All B2G framing must preserve:

```txt
legalCertification=false
OPC technical proof only
no official public identity claim
no public certification authority claim
```

---

## 25. Partner onboarding checklist

Before starting a pilot, define:

```txt
partner name
technical contact
security contact
pilot scope
allowed routes
API key policy
tenant
workspace
human IPR onboarding mode
runtime IPR
data classification
file ingestion permissions
source intelligence permissions
audit visibility
retention policy
incident contact
success criteria
pilot duration
exit criteria
```

No pilot should start with “just give them access and see what happens.” That is not a strategy; it is how systems become cautionary tales.

---

## 26. Security requirements

The pilot must enforce:

- API key protection;
- fail-closed authenticated routes;
- no secret printing;
- no token logging;
- no raw prompt export by default;
- no unrestricted internal database lookup;
- tenant and workspace scoping;
- explicit boundary metadata;
- controlled route exposure;
- limited partner access;
- audit review process.

---

## 27. Data handling rules

Recommended pilot rules:

```txt
do not send production secrets
do not send uncontrolled personal data
do not send regulated data unless pilot policy allows it
do not use the API as raw storage
do not treat OPC as legal certification
do not expose session IDs in screenshots or public docs
do not paste API keys in tickets or chats
```

For regulated environments, add a separate data processing and retention agreement before production use.

---

## 28. Documentation package

The pilot package should be presented together with:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
```

Optional technical asset:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Optional implementation asset:

```txt
lib/api-v1-client.ts
```

---

## 29. Partner-facing one-paragraph description

HBCE IPR Runtime API v1 exposes a controlled interface for identity-bound AI execution through JOKER-C2. A partner can create an IPR-bound session, execute an authenticated AI interaction, receive technical runtime identifiers such as EVT, OPC and audit IDs, and inspect public proof and audit envelopes without accessing raw internal runtime data. The system is designed for governed AI workflows where traceability, operational identity and proof boundaries matter. It does not claim legal certification: `legalCertification=false`, and OPC remains a technical proof receipt only.

---

## 30. Partner-facing short pitch

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed runtime event: identity-bound, traceable, auditable and supported by technical proof receipts.
```

---

## 31. Partner-facing problem statement

Most AI integrations are built around a simple pattern:

```txt
send prompt
receive answer
hope logs exist somewhere
```

This is insufficient for high-stakes environments.

A governed AI runtime should answer different questions:

```txt
Who initiated the interaction?
Which runtime executed it?
Which tenant and workspace owned it?
Was access authenticated?
Was the event traced?
Was a technical proof receipt generated?
Can the audit envelope be inspected?
Are legal boundaries explicit?
```

HBCE IPR Runtime API v1 addresses this problem through IPR-bound execution, EVT tracing, OPC proof receipt and public audit lookup contracts.

---

## 32. Why this matters

AI systems are increasingly used in workflows where the answer alone is not enough.

Partners may need to know:

- whether a request was authenticated;
- which operational identity initiated it;
- whether the interaction produced a trace;
- whether a technical proof receipt exists;
- whether an audit lookup envelope is available;
- whether sensitive raw data is protected;
- whether the system avoids false legal claims.

The API v1 pilot demonstrates this pattern in a live working runtime.

---

## 33. Live proof point

Current live smoke validation:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

This validates:

```txt
public API surface
authenticated IPR session creation
authenticated chat execution
fail-closed unauthenticated access
operations lookup
events lookup
OPC lookup
audit lookup
boundary preservation
```

---

## 34. Recommended pilot deliverables

A complete pilot should produce:

```txt
1. Access validation report
2. Client smoke test output
3. IPR-bound execution sample
4. EVT / OPC / audit lookup sample
5. Partner workflow mapping
6. Security and boundary review
7. Pilot outcome report
8. Recommendation for next phase
```

---

## 35. Suggested next technical improvements

Possible next improvements after pilot package publication:

```txt
1. Add partner sandbox key issuance documentation.
2. Add API v1 Postman collection or Bruno collection.
3. Add minimal npm package example using lib/api-v1-client.ts.
4. Add curl quickstart document.
5. Add dashboard link card for API v1 pilot package.
6. Add source intelligence pilot package.
7. Add files route pilot workflow.
8. Add partner onboarding checklist as separate template.
9. Add rate-limit and quota document.
10. Add security review checklist.
```

These are future steps. The current package is already sufficient for first controlled pilot presentation.

---

## 36. Final pilot verdict

```txt
HBCE IPR Runtime API v1 = pilot-ready for controlled B2B / B2G evaluation
```

Current validated state:

```txt
public surface = PASS
client integration guide = PASS
client smoke test = PASS
client smoke report = PASS
authenticated runtime path = PASS
events lookup path = PASS
OPC/audit lookup = PASS
legalCertification=false = preserved
OPC technical proof receipt boundary = preserved
```

The API v1 is ready to be presented as a controlled pilot package for partners who need governed AI execution with identity, traceability, proof receipt and audit envelope separation.
