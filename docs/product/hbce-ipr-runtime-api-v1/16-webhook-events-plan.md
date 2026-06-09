HBCE IPR Runtime API v1

Webhook Events Plan

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: webhook event delivery, operation notifications, proof readiness, audit/usage notifications, export notifications
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the webhook events plan for HBCE IPR Runtime API v1.

The purpose is to allow external client systems to receive technical event notifications from HBCE/JOKER-C2 without continuously polling runtime endpoints.

Webhook delivery should notify client systems when relevant runtime events happen, such as:

operation created
operation completed
operation failed
EVT created
OPC proof receipt ready
audit record ready
model usage record ready
Source Intelligence descriptor ready
document profile ready
export ready
quota warning
quota exceeded
credential suspended

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Why webhooks are required

Without webhooks, clients must poll endpoints such as:

GET /api/v1/operations/{operationId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
GET /api/v1/export/evidence-package/{id}

Polling works for early pilots, but it becomes inefficient when clients integrate the API into their own systems.

Webhook delivery enables:

lower client polling load
faster operation updates
better integration with client dashboards
audit-ready event notification
proof readiness notification
export readiness notification
quota and rate-limit warnings
future SIEM integration
future workflow automation

The webhook layer turns the runtime from a passive API into an event-delivery system.

Boring? Yes. Essential? Also yes. Software maturity is mostly the art of making boring things impossible to ignore.

---

3. Current validated baseline

Current runtime baseline:

JOKER-C2 SaaS Core v0.1 = HEALTHY
Runtime = ACTIVE_RESPONSE_READY
B2G active response readiness = READY
IPR = ACCESS_GRANTED
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Persistence = DATABASE_PERSISTENT
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Model usage = PERSISTED
API v1 public surface = 16/16 PASS
Source Intelligence = SOURCESET_REGISTRY_READY
Document registry = AVAILABLE
legalCertification=false

Reference technical chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

This proves that technical events are generated.

The webhook layer must deliver selected event notifications to client systems.

---

4. Webhook model

The webhook model is:

runtime event occurs
  ↓
event is classified
  ↓
tenant/workspace scope is resolved
  ↓
subscribed webhook endpoints are selected
  ↓
event payload is signed
  ↓
delivery is attempted
  ↓
delivery result is persisted
  ↓
retry or fail state is recorded

Webhook delivery must be:

tenant-scoped
workspace-scoped
subscription-controlled
signed
audited
retryable
rate-limited
boundary-aware
fail-closed on invalid endpoint

---

5. Webhook endpoint registration

Each client webhook endpoint must be explicitly registered.

Recommended future route:

POST /api/v1/webhooks/endpoints

Recommended admin route:

POST /api/admin/webhooks/endpoints

Webhook endpoint record:

{
  "webhookEndpointId": "WEBHOOK-ENDPOINT-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "url": "https://client.example/webhooks/hbce",
  "status": "ACTIVE",
  "eventTypes": [
    "operation.completed",
    "opc.ready",
    "audit.ready",
    "model_usage.ready",
    "export.ready"
  ],
  "secretHash": "sha256:...",
  "createdAt": "ISO-8601",
  "legalCertification": false
}

The webhook secret must be visible only once at creation.

It must not be stored in plaintext.

---

6. Webhook endpoint status

Allowed statuses:

ACTIVE
SUSPENDED
REVOKED
FAILED
DISABLED

Meaning:

ACTIVE = delivery allowed
SUSPENDED = temporarily blocked
REVOKED = permanently disabled
FAILED = delivery failures exceeded threshold
DISABLED = manually disabled by operator/client

Fail-closed rule:

Only ACTIVE webhook endpoints may receive events.

---

7. Event type model

Recommended event type naming convention:

<resource>.<state>

Examples:

operation.created
operation.running
operation.completed
operation.failed
evt.created
opc.ready
audit.ready
model_usage.ready
source_intelligence.ready
document_profile.ready
export.ready
quota.warning
quota.exceeded
credential.suspended
credential.revoked
tenant.suspended
workspace.suspended

Event types must be stable.

Breaking event name changes require API versioning.

---

8. Core webhook events

operation.created

Triggered when a runtime operation is created.

{
  "type": "operation.created",
  "operationId": "OP-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "status": "QUEUED",
  "legalCertification": false
}

operation.completed

Triggered when an operation completes.

{
  "type": "operation.completed",
  "operationId": "OP-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "status": "COMPLETED",
  "evtId": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "legalCertification": false
}

operation.failed

Triggered when an operation fails.

{
  "type": "operation.failed",
  "operationId": "OP-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "status": "FAILED",
  "errorCode": "POLICY_DENIED",
  "retryable": false,
  "legalCertification": false
}

---

9. Proof events

evt.created

Triggered when an EVT technical event trace is created.

{
  "type": "evt.created",
  "evtId": "EVT-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "eventHash": "sha256:...",
  "boundary": {
    "legalCertification": false,
    "evtBoundary": "technical event trace only"
  }
}

opc.ready

Triggered when an OPC technical proof receipt is ready.

{
  "type": "opc.ready",
  "opcId": "OPC-...",
  "evtId": "EVT-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "chainHash": "sha256:...",
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only"
  }
}

Boundary:

OPC webhook notification is not legal certification.
It only notifies that a technical proof receipt exists.

---

10. Audit and usage events

audit.ready

Triggered when an audit record is persisted.

{
  "type": "audit.ready",
  "auditId": "AUDIT-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "evtId": "EVT-...",
  "opcId": "OPC-...",
  "usageId": "USAGE-...",
  "policyDecision": "ALLOW",
  "riskLevel": "LOW",
  "legalCertification": false
}

model_usage.ready

Triggered when model usage is persisted.

{
  "type": "model_usage.ready",
  "usageId": "USAGE-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "auditId": "AUDIT-...",
  "evtId": "EVT-...",
  "opcId": "OPC-...",
  "model": "gpt-5.4-nano",
  "modelLevel": "STANDARD",
  "costUnits": 2.025,
  "legalCertification": false
}

---

11. Source Intelligence events

source_intelligence.ready

Triggered when a Source Intelligence descriptor or run is ready.

{
  "type": "source_intelligence.ready",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "sourceSet": "EU_AI_GOVERNANCE_REGULATORY_STACK",
  "registryStatus": "SOURCESET_REGISTRY_READY",
  "rawTextPersistence": false,
  "pdfBoundary": "PDF_BINARY_HASH_ONLY",
  "legalCertification": false
}

Boundary:

Source Intelligence webhook events describe governed source handling.
They do not certify external source legal authority.

---

12. Document events

document_profile.ready

Triggered when a document profile is created or becomes ready.

{
  "type": "document_profile.ready",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "documentProfileId": "DOC-PROFILE-...",
  "fileHash": "sha256:...",
  "textStatus": "TEXT_READY",
  "profileStatus": "ACTIVE",
  "legalCertification": false
}

Boundary:

Document profile readiness does not imply legal validation of document content.

---

13. Export events

export.ready

Triggered when an export or evidence package is ready.

{
  "type": "export.ready",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "exportId": "EXPORT-...",
  "exportType": "AUDIT_USAGE_EVIDENCE",
  "format": "JSON",
  "recordCount": 25,
  "downloadExpiresAt": "ISO-8601",
  "legalCertification": false
}

export.failed

Triggered when export creation fails.

{
  "type": "export.failed",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "exportId": "EXPORT-...",
  "errorCode": "EXPORT_SCOPE_DENIED",
  "retryable": false,
  "legalCertification": false
}

---

14. Quota events

quota.warning

Triggered when usage approaches a configured limit.

{
  "type": "quota.warning",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "quotaName": "chatRequestsPerDay",
  "limit": 250,
  "used": 225,
  "remaining": 25,
  "threshold": "90%",
  "legalCertification": false
}

quota.exceeded

Triggered when a quota is exhausted.

{
  "type": "quota.exceeded",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "quotaName": "maxCostUnitsPerMonth",
  "limit": 10000,
  "used": 10000,
  "remaining": 0,
  "legalCertification": false
}

---

15. Credential and access events

credential.suspended

Triggered when a credential is suspended.

{
  "type": "credential.suspended",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "credentialId": "APIKEY-...",
  "reason": "ABUSE_DETECTED",
  "legalCertification": false
}

credential.revoked

Triggered when a credential is revoked.

{
  "type": "credential.revoked",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "credentialId": "APIKEY-...",
  "revokedAt": "ISO-8601",
  "legalCertification": false
}

---

16. Webhook payload envelope

All webhook payloads should use a stable envelope.

Recommended envelope:

{
  "id": "WEBHOOK-EVENT-...",
  "type": "operation.completed",
  "createdAt": "ISO-8601",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "data": {},
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only",
    "evtBoundary": "technical event trace only",
    "iprBoundary": "operational identity/proof layer only"
  }
}

Required fields:

id
type
createdAt
tenantId
workspaceId
data
boundary.legalCertification=false

---

17. Webhook signature

Every webhook must be signed.

Recommended signature header:

X-HBCE-Signature

Recommended timestamp header:

X-HBCE-Timestamp

Recommended event ID header:

X-HBCE-Webhook-Event-Id

Recommended signature base string:

timestamp + "." + rawBody

Recommended signature format:

sha256=<hmac>

Recommended header example:

X-HBCE-Signature: sha256=abcdef...
X-HBCE-Timestamp: 2026-06-09T07:14:58.770Z
X-HBCE-Webhook-Event-Id: WEBHOOK-EVENT-...

The signing secret must not be stored in plaintext.

---

18. Signature verification by client

Client verification steps:

1. Read X-HBCE-Timestamp.
2. Read raw request body.
3. Build timestamp + "." + rawBody.
4. Compute HMAC SHA-256 using webhook secret.
5. Compare with X-HBCE-Signature using constant-time comparison.
6. Reject if timestamp is too old.
7. Reject if event ID was already processed.

Recommended replay window:

5 minutes

Replay protection:

store processed webhook event IDs
reject duplicate event IDs

---

19. Delivery retry policy

Webhook delivery must retry temporary failures.

Retryable responses:

408
409
425
429
500
502
503
504
network timeout

Non-retryable responses:

400
401
403
404
410
422

Recommended retry schedule:

attempt 1 = immediate
attempt 2 = +1 minute
attempt 3 = +5 minutes
attempt 4 = +15 minutes
attempt 5 = +1 hour
attempt 6 = +6 hours

Maximum attempts:

6

After maximum failures:

mark delivery FAILED
optionally suspend endpoint after repeated failures
record audit event

---

20. Delivery status

Allowed delivery statuses:

PENDING
DELIVERING
DELIVERED
FAILED
RETRYING
CANCELLED

Delivery record should include:

deliveryId
webhookEventId
webhookEndpointId
tenantId
workspaceId
eventType
attemptCount
lastAttemptAt
nextAttemptAt
lastStatusCode
lastError
status
createdAt
legalCertification=false

---

21. Webhook security requirements

Webhook delivery must enforce:

HTTPS endpoint required
no localhost URLs
no private IP ranges
no metadata service IPs
no file:// URLs
no unsupported protocols
secret required
signature required
tenant/workspace scope required
event type allowlist required
delivery audit required

Blocked URLs include:

http://localhost
http://127.0.0.1
http://169.254.169.254
private RFC1918 IP ranges
file://
ftp://

Fail-closed rule:

Unsafe webhook endpoint registration must be rejected.

---

22. Webhook data minimization

Webhook payloads should contain metadata and IDs, not raw content.

Default webhook payload should include:

IDs
statuses
hashes
timestamps
tenant/workspace
proof references
boundary fields

Default webhook payload should not include:

raw prompt
raw response
raw source text
raw document text
raw API secret
bearer token
authorization header
sensitive personal data

Client can retrieve full records through authenticated API lookup if allowed.

This keeps webhook delivery small, safe and auditable.

---

23. Webhook event retention

Webhook event records should be retained separately.

Recommended pilot retention:

webhook event records = 90 days
webhook delivery attempts = 90 days
failed delivery logs = 90 days
webhook endpoint configuration = until revoked/deleted

Retention must be tenant/workspace scoped.

---

24. Webhook quota and limits

Webhook delivery should have limits.

Recommended pilot limits:

{
  "maxWebhookEndpointsPerWorkspace": 3,
  "maxEventTypesPerEndpoint": 20,
  "maxWebhookDeliveriesPerDay": 10000,
  "maxPayloadSizeKb": 128,
  "maxRetryAttempts": 6
}

Quota exceeded event:

webhook.quota_exceeded

Do not let webhook delivery become the new denial-of-service hose. Humanity deserves at least one lesson retained.

---

25. Webhook endpoint testing

Provide a test event.

Future route:

POST /api/v1/webhooks/endpoints/{webhookEndpointId}/test

Test event type:

webhook.test

Payload:

{
  "id": "WEBHOOK-EVENT-TEST-...",
  "type": "webhook.test",
  "createdAt": "ISO-8601",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "data": {
    "message": "HBCE webhook test event."
  },
  "boundary": {
    "legalCertification": false
  }
}

---

26. OpenAPI additions

OpenAPI should add webhook endpoints only after implementation.

Future schemas:

WebhookEndpoint
WebhookEndpointCreateRequest
WebhookEndpointCreateResponse
WebhookEvent
WebhookDelivery
WebhookTestRequest
WebhookTestResponse
WebhookError

Future operation IDs:

createWebhookEndpointV1
listWebhookEndpointsV1
getWebhookEndpointV1
deleteWebhookEndpointV1
testWebhookEndpointV1
listWebhookDeliveriesV1

Do not include webhook endpoints in public PASS count before implementation.

Documentation fiction is still fiction, just with more JSON.

---

27. SDK additions

Future SDK methods:

client.createWebhookEndpoint(...)
client.listWebhookEndpoints(...)
client.getWebhookEndpoint(...)
client.deleteWebhookEndpoint(...)
client.testWebhookEndpoint(...)
client.listWebhookDeliveries(...)

Future SDK helper:

verifyHbceWebhookSignature(...)

Recommended verification helper signature:

verifyHbceWebhookSignature({
  rawBody,
  timestamp,
  signature,
  secret,
  toleranceSeconds: 300
});

---

28. Dashboard additions

Future dashboard should show:

webhook endpoints
webhook endpoint status
subscribed event types
last delivery status
failed deliveries
retry queue count
last webhook event ID
webhook quota
legalCertification=false

Recommended dashboard states:

WEBHOOKS_READY
WEBHOOKS_DISABLED
WEBHOOKS_DEGRADED
WEBHOOK_DELIVERY_FAILED
WEBHOOK_SCOPE_DENIED

---

29. Database schema sketch

Suggested webhook endpoint table:

CREATE TABLE hbce_webhook_endpoints (
  webhook_endpoint_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  event_types JSONB NOT NULL,
  secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  disabled_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested webhook event table:

CREATE TABLE hbce_webhook_events (
  webhook_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested delivery table:

CREATE TABLE hbce_webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  webhook_event_id TEXT NOT NULL,
  webhook_endpoint_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  last_status_code INTEGER,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested indexes:

CREATE INDEX hbce_webhook_endpoints_tenant_workspace_idx
ON hbce_webhook_endpoints (tenant_id, workspace_id);

CREATE INDEX hbce_webhook_events_tenant_workspace_idx
ON hbce_webhook_events (tenant_id, workspace_id);

CREATE INDEX hbce_webhook_deliveries_status_idx
ON hbce_webhook_deliveries (status);

CREATE INDEX hbce_webhook_deliveries_next_attempt_idx
ON hbce_webhook_deliveries (next_attempt_at);

---

30. First implementation order

Recommended implementation order:

1. Define webhook event types.
2. Define webhook payload envelope.
3. Define webhook endpoint schema.
4. Add URL safety validator.
5. Add webhook secret generation and hashing.
6. Add HMAC signature helper.
7. Add webhook event persistence helper.
8. Add webhook delivery persistence helper.
9. Add delivery dispatcher.
10. Add retry scheduler.
11. Add test webhook endpoint.
12. Add operation.completed webhook event.
13. Add opc.ready webhook event.
14. Add audit.ready webhook event.
15. Add model_usage.ready webhook event.
16. Add dashboard descriptor later.
17. Add OpenAPI webhook schemas after routes pass.
18. Add SDK verification helper.

First code target:

lib/webhook-events.ts

Second code target:

lib/webhook-signature.ts

Third code target:

app/api/v1/webhooks/endpoints/route.ts

Fourth code target:

app/api/v1/webhooks/endpoints/[webhookEndpointId]/test/route.ts

Start with test delivery.

Do not start with every event type. That is how clean plans become confetti with stack traces.

---

31. Acceptance criteria

Webhook delivery is acceptable when:

webhook endpoint can be registered
unsafe URL is rejected
webhook secret is shown only once
secret is not stored in plaintext
test event can be delivered
payload is signed
client can verify signature
delivery result is persisted
failed delivery is retried
tenant/workspace scope is enforced
event payload includes legalCertification=false
raw secrets are never sent

Minimum PASS output:

WEBHOOK_EVENTS_READY
endpointRegistration=PASS
urlSafety=PASS
signature=PASS
testDelivery=PASS
deliveryPersistence=PASS
retryPolicy=PASS
tenantScope=PASS
workspaceScope=PASS
legalCertification=false

---

32. Non-goals for first implementation

Do not include in first implementation:

webhook marketplace
public webhook portal
OAuth webhook authorization
mTLS
multi-region delivery
advanced event filtering language
SIEM connector
Kafka stream
WebSocket gateway
real-time dashboard streaming

First implementation must prove:

safe endpoint registration
signed delivery
test event
delivery persistence
retry logic
tenant/workspace scope
boundary preservation

Simple first. Complex later. This revolutionary idea remains tragically underused.

---

33. Final statement

Webhook Events are a required SaaS B2G integration layer.

They allow HBCE IPR Runtime API v1 to notify external systems when technical runtime events occur.

The webhook layer must preserve:

tenant scope
workspace scope
event type
event ID
runtime references
EVT reference
OPC reference
audit reference
model usage reference
export reference
quota reference
signature
delivery audit
legal boundary

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
