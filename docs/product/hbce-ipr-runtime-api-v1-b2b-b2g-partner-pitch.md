# HBCE IPR Runtime API v1 — B2B / B2G Partner Pitch

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** B2B / B2G partner pitch  
**Audience:** enterprise partners, public-sector evaluators, compliance teams, AI governance teams, cybersecurity teams, technical decision-makers  
**Pitch status:** `partner pilot-ready`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Executive summary

HBCE IPR Runtime API v1 is a governed runtime interface for identity-bound AI execution.

It allows a partner to create an IPR-bound operational session, execute authenticated AI interactions through JOKER-C2, receive runtime identifiers such as EVT, OPC and audit IDs, and inspect technical proof envelopes without exposing raw internal runtime data.

The core value is simple:

```txt
AI execution becomes traceable.
Identity becomes operationally bound.
Events become inspectable.
Proof receipts become technically reproducible.
Governance becomes part of the runtime, not a document added after the damage.
```

HBCE IPR Runtime API v1 is designed for controlled B2B / B2G pilot evaluation where the partner needs AI interaction that is not just “a model response”, but a governed runtime event.

That distinction matters. A chatbot says things. A governed runtime leaves traces. Small difference, enormous consequences, because apparently civilization is now debugging the difference between speech and accountable execution.

---

## 2. The problem

AI is being integrated into business and institutional workflows faster than most organizations can govern it.

Common problems:

```txt
AI interactions are not identity-bound.
Prompt and response flows are weakly traceable.
Audit trails are incomplete or disconnected.
Model usage is difficult to verify.
Runtime decisions are hard to reconstruct.
Security controls are bolted on after deployment.
Proof boundaries are unclear.
Partners cannot easily distinguish technical evidence from legal certification.
```

For enterprise and public-sector environments, this is not acceptable.

A model response without operational traceability creates risk:

```txt
compliance risk
cybersecurity risk
accountability risk
data governance risk
procurement risk
institutional trust risk
```

The question is no longer:

```txt
Can an AI answer?
```

The question is:

```txt
Who requested the execution?
Under which runtime identity?
Inside which tenant and workspace?
Which event was generated?
Which technical proof receipt was produced?
Which audit envelope confirms the interaction?
What are the boundaries of the proof?
```

HBCE IPR Runtime API v1 answers those questions at the runtime level.

---

## 3. The HBCE answer

HBCE IPR Runtime API v1 introduces a governed AI runtime pattern:

```txt
IPR session -> authenticated AI execution -> EVT trace -> OPC technical proof receipt -> audit envelope -> lookup contract
```

In practical terms, the partner can:

```txt
1. Create an IPR-bound session.
2. Send an authenticated AI interaction.
3. Receive technical runtime identifiers.
4. Inspect event and proof envelopes.
5. Verify that the interaction remains bounded by legalCertification=false.
6. Integrate governed AI execution into a pilot workflow.
```

This turns the interaction from a loose API call into a controlled operational event.

---

## 4. Core architecture

Canonical runtime sentence:

```txt
IPR identifies the operational subject. JOKER-C2 executes the governed AI interaction. EVT traces the event. OPC produces the technical proof receipt. Audit records the control envelope. MATRIX organizes the process. HBCE governs the runtime.
```

Simplified flow:

```txt
Partner system
    |
    | POST /api/v1/ipr/session
    v
IPR-bound session
    |
    | POST /api/v1/chat
    v
JOKER-C2 governed runtime
    |
    | generates
    v
EVT + OPC + Audit envelope
    |
    | lookup
    v
/api/v1/events?eventId
/api/v1/opc/{opcId}
/api/v1/audit/{auditId}
```

This is the product core.

Not “AI chat with branding”. Not “another wrapper around a model”. A governed execution chain.

---

## 5. What IPR means in API v1

In API v1, IPR is the operational identity and proof layer used to bind the runtime interaction to a controlled subject and scope.

IPR does not mean public identity document.

IPR does not mean legal certification.

IPR means:

```txt
operational identity binding
runtime subject reference
session scope
tenant/workspace connection
controlled execution context
traceable runtime anchor
```

Partner-facing definition:

```txt
IPR provides the operational identity anchor for governed AI execution. It binds the runtime session to an approved subject, tenant and workspace so that AI interactions can be traced, audited and technically receipted.
```

Boundary:

```txt
legalCertification=false
```

---

## 6. What EVT means

EVT is the technical event trace generated by the runtime.

EVT answers:

```txt
Which event occurred?
When was the runtime interaction registered?
Which execution chain produced it?
Which lookup envelope can inspect it?
```

Correct lookup route:

```txt
GET /api/v1/events?eventId={eventId}
```

Important route distinction:

```txt
Correct:   /api/v1/events?eventId=EVT-...
Incorrect: /api/v1/events/EVT-...
```

This matters because route shape is not decorative. Computers, in their charming lack of imagination, require exact paths.

---

## 7. What OPC means

OPC is a technical proof receipt.

It is used to provide a receipt-like technical envelope for the runtime event.

OPC does not mean legal proof by default.

OPC does not mean public certification.

OPC does not mean qualified electronic signature.

Canonical boundary:

```txt
OPC=technical proof receipt only
legalCertification=false
```

Partner-facing definition:

```txt
OPC provides a technical proof receipt for the governed runtime interaction. It supports auditability and technical verification inside the agreed pilot scope, without claiming legal certification.
```

---

## 8. What audit means

Audit is the control envelope around the runtime execution.

Audit should help answer:

```txt
Which route was used?
Which execution flow ran?
Which runtime boundary applied?
Which identifiers were produced?
Which policy constraints were active?
```

Audit must not expose:

```txt
API keys
bearer tokens
cookies
raw provider payloads
raw prompts unless explicitly allowed
raw completions unless explicitly allowed
unrelated tenant data
private database details
```

For B2B/B2G partners, audit is the bridge between AI execution and operational governance.

---

## 9. Product value for B2B partners

HBCE IPR Runtime API v1 can support enterprise partners that need:

```txt
controlled AI execution
identity-bound runtime sessions
audit-ready AI workflows
technical proof receipts
partner sandbox validation
tenant/workspace isolation
security review material
quota-based pilot access
clear proof boundary
```

Relevant enterprise domains:

```txt
compliance software
legal-tech
cybersecurity platforms
AI governance platforms
risk management systems
document workflow systems
regulated workflow automation
enterprise audit tooling
B2B SaaS integration
```

Enterprise value proposition:

```txt
HBCE IPR Runtime API v1 gives a partner a governed AI execution layer that can be integrated into workflows where traceability, runtime identity and technical proof receipts matter.
```

---

## 10. Product value for B2G partners

HBCE IPR Runtime API v1 can support public-sector and institutional evaluators that need:

```txt
governed AI runtime evaluation
technical audit envelopes
controlled pilot access
clear proof boundaries
runtime traceability
institutional AI governance testing
defensive cyber and compliance workflows
source and document governance pilots
```

Relevant B2G domains:

```txt
public administration AI governance
cybersecurity coordination
institutional compliance workflows
digital sovereignty evaluation
audit and accountability pilots
document verification workflows
controlled source intelligence
AI procurement assessment
```

B2G value proposition:

```txt
HBCE IPR Runtime API v1 provides a controlled technical environment for evaluating identity-bound AI execution, event traceability and proof receipt workflows without claiming legal certification or public authority status.
```

This distinction is critical for institutional trust.

---

## 11. Why now

AI adoption is accelerating faster than operational governance.

Many organizations are deploying AI around:

```txt
documents
emails
customer workflows
legal analysis
cybersecurity
public services
compliance checks
internal operations
decision support
```

But most AI workflows still lack:

```txt
runtime identity
traceable event chain
proof receipt boundary
audit envelope
tenant/workspace governance
fail-closed protection
quota-based pilot control
```

HBCE IPR Runtime API v1 is positioned for this gap.

The pitch is not:

```txt
Use our AI because it answers better.
```

The pitch is:

```txt
Use a governed AI runtime because answer generation without runtime accountability is not enough for serious environments.
```

---

## 12. What is already validated

Current product documentation and technical package status:

```txt
client note = PASS
smoke test report = PASS
integration guide = PASS
pilot package = PASS
quickstart = PASS
product index = PASS
security checklist = PASS
rate limit / quota policy = PASS
partner onboarding = PASS
```

Live smoke validation:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Validated smoke checks:

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
SKIPPED model usage lookup when usageId=NONE
```

The current package is therefore suitable for controlled partner pilot evaluation.

---

## 13. API surface

Documented API v1 surface:

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

Core pilot routes:

```txt
POST /api/v1/ipr/session
POST /api/v1/chat
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

---

## 14. Partner pilot flow

A controlled pilot should run through this sequence:

```txt
1. Partner qualification.
2. Use case classification.
3. Data class approval.
4. Tenant/workspace assignment.
5. API key issuance.
6. Security checklist acceptance.
7. Rate limit/quota acceptance.
8. Quickstart execution.
9. IPR session creation.
10. Authenticated chat execution.
11. EVT / OPC / audit lookup.
12. Smoke test validation where authorized.
13. Pilot review.
14. Quota escalation or offboarding.
```

This is documented in:

```txt
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
```

---

## 15. Pilot controls

The pilot is controlled through:

```txt
API key
tenant
workspace
operator/human IPR
runtime IPR
session ID
allowed routes
quota tier
burst limits
daily quota
security checklist
rate limit policy
offboarding process
```

Default controlled partner pilot posture:

```txt
chatRequestsPerDay=100
iprSessionsPerDay=50
lookupRequestsPerDay=1000
fileUploadsPerDay=20
sourceFetchesPerDay=50
```

Rate-limit concept:

```txt
RATE_LIMIT_EXCEEDED
```

Policy document:

```txt
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
```

---

## 16. Security posture

Security baseline includes:

```txt
protected execution requires API key
chat without key fails closed
IPR session validates active scope
tenant/workspace are explicit
session is required for chat
lookup routes return envelopes, not raw dumps
API keys are never printed
raw provider payloads are not exposed
legalCertification=false remains visible
OPC boundary remains technical proof receipt only
```

Security document:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
```

Critical security validation:

```txt
PASS chat without key fail-closed [critical] http=401
```

If unauthenticated chat returns `200`, pilot access must stop.

---

## 17. What partners can test

A partner can test:

```txt
public API discovery
health and capabilities
IPR session creation
authenticated AI runtime execution
EVT lookup
OPC lookup
audit lookup
basic runtime traceability
technical proof receipt boundary
rate-limit behavior when enabled
controlled onboarding workflow
```

A partner should not test:

```txt
unrestricted production traffic
cross-tenant probing
secret handling through prompts
unapproved personal data
unapproved file ingestion
legal certification claims
raw internal database access
```

---

## 18. What this product is not

HBCE IPR Runtime API v1 is not:

```txt
a public legal certification authority
a qualified electronic signature service
a public identity provider
a public document registry
an unrestricted chatbot API
a raw database API
a replacement for legal counsel
a claim of regulatory approval
a claim of court-admissible proof by default
```

This matters because the product is stronger when the boundary is explicit.

Overclaiming would make the pitch weaker, not stronger. A rare moment where restraint is not cowardice, but engineering.

---

## 19. Positioning sentence

Use this sentence for partner conversations:

```txt
HBCE IPR Runtime API v1 provides a governed runtime layer for identity-bound AI execution, where each controlled interaction can be connected to an IPR session, traced as an EVT event, receipted through an OPC technical proof envelope and inspected through audit-oriented API lookups.
```

Short version:

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed, traceable and technically receipted runtime event.
```

---

## 20. B2B pitch

For enterprise partners:

```txt
Your organization can integrate AI interaction without treating model output as an isolated black box. HBCE IPR Runtime API v1 lets you run controlled AI execution through an identity-bound session, capture runtime identifiers, inspect technical proof receipts and preserve audit boundaries for compliance, cybersecurity and governance workflows.
```

Why enterprise teams should care:

```txt
less blind AI execution
more runtime accountability
clearer technical audit trail
controlled partner sandbox
safer pilot governance
explicit proof boundary
```

---

## 21. B2G pitch

For public-sector or institutional partners:

```txt
HBCE IPR Runtime API v1 offers a controlled technical pilot environment for evaluating governed AI execution. It supports runtime identity binding, event traceability, technical proof receipts and audit envelopes while preserving a clear non-certification boundary: legalCertification=false and OPC remains a technical proof receipt only.
```

Why public-sector teams should care:

```txt
AI governance evaluation
digital sovereignty posture
audit-oriented runtime testing
controlled access
defensive and compliance workflows
clear institutional boundary
```

---

## 22. Technical pilot outcome

A successful technical pilot should produce:

```txt
confirmed API access
validated IPR session flow
authenticated chat execution
captured EVT / OPC / audit IDs
successful lookup envelopes
accepted security checklist
accepted quota policy
documented partner feedback
clear decision on next step
```

Possible next steps after pilot:

```txt
extended sandbox
deeper technical integration
security review
source intelligence pilot
files workflow pilot
commercial discussion
B2G institutional review
implementation of dedicated tenant/workspace
```

---

## 23. Documentation package for partner

Send these documents:

```txt
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
```

Recommended partner reading order:

```txt
1. quickstart
2. B2B/B2G partner pitch
3. pilot package
4. security checklist
5. rate limit / quota policy
6. partner onboarding
7. integration guide
8. smoke test report
```

---

## 24. One-page pitch version

```txt
HBCE IPR Runtime API v1 is a governed AI runtime API for B2B and B2G pilot evaluation.

It allows a partner to create an IPR-bound session, execute authenticated AI interactions through JOKER-C2, receive technical runtime identifiers such as EVT, OPC and audit IDs, and inspect proof/audit envelopes through API lookups.

The product addresses a critical gap in AI adoption: model responses are increasingly used in sensitive workflows, but many organizations still lack runtime identity, event traceability, proof receipt boundaries and auditable execution chains.

HBCE API v1 is not a legal certification system. legalCertification=false. OPC remains a technical proof receipt only.

The current package is pilot-ready: quickstart, integration guide, smoke test report, pilot package, product index, security checklist, rate limit/quota policy and partner onboarding have all been prepared and verified. The live client smoke test passed with API_V1_CLIENT_SMOKE_TEST_PASS, criticalFailures=0, optionalWarnings=0 and checks=14.

The partner pilot is designed for controlled technical validation, not unrestricted production traffic. Access is governed by API key, tenant, workspace, IPR session, quota and boundary policy.
```

---

## 25. Partner objection handling

### “Is this just another AI chat API?”

No.

```txt
A normal chat API returns a model response.
HBCE IPR Runtime API v1 creates a governed runtime interaction connected to IPR session, EVT trace, OPC technical proof receipt and audit envelope.
```

### “Is OPC legal proof?”

No.

```txt
OPC is a technical proof receipt only.
legalCertification=false.
```

### “Can we use it in production immediately?”

No, not by default.

```txt
The current package is pilot-ready for controlled B2B / B2G evaluation. Production use requires additional agreement, security review, quota policy and deployment scope.
```

### “Can we upload sensitive data?”

Not in the default pilot.

```txt
Default pilot data should be synthetic, public, redacted or explicitly approved. Secrets, credentials and unapproved personal data are not allowed.
```

### “What proves the API works?”

The live smoke test:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 26. Commercial framing

HBCE IPR Runtime API v1 can be positioned as:

```txt
a governed AI runtime layer
an operational identity and proof API
an audit-oriented AI execution interface
a B2B/B2G pilot package for controlled AI governance
a technical proof receipt layer for AI interactions
```

It should not be positioned as:

```txt
legal certification service
public identity authority
government certification platform
unrestricted AI automation system
```

---

## 27. Final partner pitch verdict

```txt
HBCE IPR Runtime API v1 B2B / B2G partner pitch = partner pilot-ready
```

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

Final positioning:

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed, traceable and technically receipted runtime event for controlled B2B / B2G pilot evaluation.
