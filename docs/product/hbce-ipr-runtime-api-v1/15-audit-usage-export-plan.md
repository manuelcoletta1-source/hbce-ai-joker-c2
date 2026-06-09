HBCE IPR Runtime API v1

Audit & Usage Export Plan

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: audit export, model usage export, technical proof reporting, B2G evidence packages
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the audit and usage export plan for HBCE IPR Runtime API v1.

The purpose is to allow clients, partners and internal HBCE operators to export technical runtime evidence from governed AI interactions.

The export layer must support:

audit reconstruction
model usage accounting
EVT reference
OPC proof receipt reference
tenant/workspace scope
operator scope
API credential scope
policy decision
risk level
model metadata
cost-unit metadata
legal boundary

The export layer turns runtime traces into reviewable pilot evidence.

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Why export is required

A B2G or regulated pilot cannot rely only on screen visibility.

The client must be able to review:

what request happened
which runtime handled it
which policy decision was applied
which EVT was generated
which OPC proof receipt was generated
which audit record was persisted
which model usage record was persisted
which tenant/workspace owned the event
which boundary applied

Without export, the runtime can be observed but not properly reviewed.

That is cute for demos and useless for governance, the usual tragedy of software with a nice interface and no accountability layer.

---

3. Current validated baseline

Current runtime baseline:

JOKER-C2 SaaS Core v0.1 = HEALTHY
Runtime = ACTIVE_RESPONSE_READY
B2G active response readiness = READY
IPR = ACCESS_GRANTED
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Identity binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Persistence = DATABASE_PERSISTENT
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Model usage = PERSISTED
Source Intelligence = SOURCESET_REGISTRY_READY
API v1 public surface = 16/16 PASS
Document registry = AVAILABLE
legalCertification=false

Reference technical chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

This proves that audit and usage persistence already exist.

The next requirement is controlled export.

---

4. Export layers

The export plan includes four layers:

1. Single record lookup
2. Filtered list export
3. Evidence package export
4. Pilot report export

Layer 1 — Single record lookup

Already represented by:

GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
GET /api/v1/opc/{opcId}

Layer 2 — Filtered list export

Future endpoints should allow tenant/workspace-filtered export.

Examples:

GET /api/v1/audit
GET /api/v1/model-usage

Layer 3 — Evidence package export

A grouped export containing:

request summary
response summary
EVT
OPC
audit
usage
boundary

Layer 4 — Pilot report export

A human-readable report for B2G pilot review.

Possible formats:

JSON
CSV
Markdown
PDF later
ZIP technical bundle later

---

5. Export scope

All exports must be scoped by:

tenantId
workspaceId
accountId if available
subscriptionId if available
credentialId if available
operatorId if available
date range
record type

Minimum filter set:

tenantId
workspaceId
from
to
limit
cursor

Fail-closed rule:

If tenant/workspace scope cannot be verified, export must fail closed.

External client rule:

No client may export records outside its tenant/workspace boundary.

---

6. Audit export content

Audit export records should include:

auditId
tenantId
workspaceId
accountId
subscriptionId
credentialId
operatorId
runtimeIpr
humanIpr
requestId
sessionId
policyDecision
operationDecision
securityOutcome
riskLevel
humanOversight
dataClass
model
modelLevel
evtId
opcId
usageId
createdAt
legalCertification=false

Audit may include technical hashes:

inputHash
outputHash
policyHash
auditHash

Audit export must not include by default:

raw API key
bearer token
full Authorization header
raw secret
unredacted sensitive prompt content
raw document content
raw source text

---

7. Model usage export content

Model usage export records should include:

usageId
tenantId
workspaceId
accountId
subscriptionId
credentialId
operatorId
provider
providerState
model
modelLevel
inputTokens
outputTokens
totalTokens
costUnits
costMinor
evtId
opcId
auditId
createdAt
usageHash
legalCertification=false

If token fields are unavailable, export should preserve that status:

inputTokens=not_available
outputTokens=not_available
totalTokens=not_available

Cost-unit fields should still be exported when available.

---

8. EVT export content

EVT export records should include:

evtId
eventType
tenantId
workspaceId
runtimeIpr
humanIpr
eventHash
previousEvt
linkedOpcId
linkedAuditId
linkedUsageId
createdAt
verificationStatus
legalCertification=false

Boundary:

EVT is a technical event trace only.

---

9. OPC export content

OPC export records should include:

opcId
tenantId
workspaceId
eventHash
chainHash
linkedEvtId
linkedAuditId
linkedUsageId
verificationStatus
createdAt
legalCertification=false
opcBoundary=technical proof receipt only

Boundary:

OPC is a technical proof receipt only.
It is not a legal certificate.

---

10. Evidence package content

An evidence package should group the main proof objects for one governed AI interaction.

Recommended structure:

{
  "packageId": "EVIDENCE-PACKAGE-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "createdAt": "ISO-8601",
  "runtime": {
    "runtimeIpr": "IPR-AI-0001",
    "humanIpr": "IPR-..."
  },
  "request": {
    "requestHash": "sha256:...",
    "dataClass": "PUBLIC_OR_SYNTHETIC"
  },
  "proof": {
    "evtId": "EVT-...",
    "opcId": "OPC-...",
    "auditId": "AUDIT-...",
    "usageId": "USAGE-..."
  },
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only",
    "evtBoundary": "technical event trace only",
    "iprBoundary": "operational identity/proof layer only"
  }
}

Evidence packages are technical bundles.

They are not legal certificates.

---

11. Export formats

Recommended first implementation formats:

JSON
CSV

Future formats:

Markdown report
PDF report
ZIP bundle
signed technical bundle
dashboard screenshot bundle

JSON

Best for:

integration
API clients
audit tooling
machine-readable review

CSV

Best for:

spreadsheet review
usage accounting
client reporting
procurement/support review

Markdown

Best for:

pilot closure report
human-readable technical summary

PDF

Best for:

formal pilot report
client board review
procurement annex

PDF must still include:

legalCertification=false
technical proof receipt only
not public authority
not legal certifier

---

12. Export endpoints roadmap

Future endpoints:

GET /api/v1/audit
GET /api/v1/model-usage
GET /api/v1/events
GET /api/v1/export/evidence-package/{id}
POST /api/v1/export/evidence-package
GET /api/v1/export/pilot-report

Recommended gateway notation:

GET /v1/audit
GET /v1/model-usage
GET /v1/events
GET /v1/export/evidence-package/{id}
POST /v1/export/evidence-package
GET /v1/export/pilot-report

These endpoints must not be added to public PASS count until implemented and validated.

---

13. Audit list endpoint

Future endpoint:

GET /api/v1/audit

Query parameters:

tenantId
workspaceId
from
to
limit
cursor
policyDecision
riskLevel
model

Response:

{
  "status": "OK",
  "items": [
    {
      "auditId": "AUDIT-...",
      "tenantId": "HBCE-TENANT-...",
      "workspaceId": "HBCE-WORKSPACE-...",
      "policyDecision": "ALLOW",
      "riskLevel": "LOW",
      "evtId": "EVT-...",
      "opcId": "OPC-...",
      "usageId": "USAGE-...",
      "createdAt": "ISO-8601",
      "legalCertification": false
    }
  ],
  "pagination": {
    "nextCursor": null
  },
  "boundary": {
    "legalCertification": false
  }
}

---

14. Model usage list endpoint

Future endpoint:

GET /api/v1/model-usage

Query parameters:

tenantId
workspaceId
from
to
limit
cursor
model
modelLevel

Response:

{
  "status": "OK",
  "items": [
    {
      "usageId": "USAGE-...",
      "tenantId": "HBCE-TENANT-...",
      "workspaceId": "HBCE-WORKSPACE-...",
      "model": "gpt-5.4-nano",
      "modelLevel": "STANDARD",
      "inputTokens": null,
      "outputTokens": null,
      "totalTokens": null,
      "costUnits": 2.025,
      "costMinor": 203,
      "evtId": "EVT-...",
      "opcId": "OPC-...",
      "auditId": "AUDIT-...",
      "createdAt": "ISO-8601",
      "legalCertification": false
    }
  ],
  "pagination": {
    "nextCursor": null
  },
  "boundary": {
    "legalCertification": false
  }
}

---

15. Evidence package creation endpoint

Future endpoint:

POST /api/v1/export/evidence-package

Request:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "evtId": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "format": "JSON"
}

Response:

{
  "status": "OK",
  "packageId": "EVIDENCE-PACKAGE-...",
  "format": "JSON",
  "downloadReady": true,
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only"
  }
}

---

16. Pilot report export endpoint

Future endpoint:

GET /api/v1/export/pilot-report

Query parameters:

tenantId
workspaceId
from
to
format

Supported first formats:

JSON
MARKDOWN

Future format:

PDF

Pilot report should include:

pilot summary
runtime baseline
request count
EVT count
OPC count
audit count
usage count
model usage summary
Source Intelligence summary
quota summary
boundary statement
integration recommendations

---

17. Export authorization

Export requires strict authorization.

Required checks:

API credential valid
tenant scope matches
workspace scope matches
operator role allowed
subscription active
export scope allowed
rate/quota export limit not exceeded

Allowed roles:

PILOT_OWNER
AUDIT_REVIEWER
SECURITY_REVIEWER
HBCE_OPERATOR

Restricted roles:

READ_ONLY_VIEWER may view dashboard but not export unless explicitly allowed.
TECHNICAL_OPERATOR may export usage only if allowed.

Fail-closed rule:

Any scope mismatch must reject export.

---

18. Export redaction policy

Exports must support redaction.

Default export should include:

technical identifiers
hashes
timestamps
policy decisions
risk metadata
model usage metadata
boundary fields

Default export should exclude:

raw prompt
raw response
raw source text
raw document text
raw API credential
authorization header
secrets
private file content

Optional extended export may include prompt/response only if:

tenant policy allows it
operator role allows it
data-processing agreement allows it
explicit export mode is requested
audit record tracks inclusion

Recommended export modes:

TECHNICAL_METADATA_ONLY
HASH_AND_METADATA
FULL_CONTENT_WITH_APPROVAL

Default:

TECHNICAL_METADATA_ONLY

---

19. Export retention

Export packages should have their own retention rules.

Recommended pilot defaults:

evidence package retention = 30 days
pilot report retention = 90 days
audit records retention = 180 days
usage records retention = 180 days
download links expire = 24 hours

Production candidate requirements:

tenant-specific retention
workspace-specific retention
export deletion workflow
export access log
download expiration
re-generation policy

---

20. Export audit log

Every export action must itself be audited.

Export audit should include:

exportId
exportType
format
tenantId
workspaceId
operatorId
credentialId
recordCount
dateRange
redactionMode
createdAt
downloadExpiresAt
legalCertification=false

Export audit must not include:

raw API secret
bearer token
authorization header
unredacted sensitive content unless explicitly approved

---

21. Export quota

Exports should consume quota.

Recommended limits:

{
  "auditExportsPerDay": 20,
  "usageExportsPerDay": 20,
  "evidencePackagesPerDay": 20,
  "pilotReportsPerMonth": 10,
  "maxRecordsPerExport": 10000,
  "maxExportSizeMb": 50
}

Quota exceeded response:

{
  "status": "FAIL",
  "error": {
    "code": "EXPORT_QUOTA_EXCEEDED",
    "message": "Export quota exceeded for this tenant or workspace.",
    "retryable": false
  },
  "boundary": {
    "legalCertification": false
  }
}

---

22. Dashboard export visibility

Future dashboard should display:

last audit export
last usage export
last evidence package
last pilot report
export status
export quota remaining
redaction mode
download expiry

Recommended states:

EXPORT_READY
EXPORT_RUNNING
EXPORT_FAILED
EXPORT_EXPIRED
EXPORT_QUOTA_EXCEEDED

---

23. CSV column model

Recommended audit CSV columns:

audit_id
tenant_id
workspace_id
credential_id
operator_id
runtime_ipr
human_ipr
policy_decision
operation_decision
security_outcome
risk_level
data_class
model
model_level
evt_id
opc_id
usage_id
created_at
legal_certification

Recommended usage CSV columns:

usage_id
tenant_id
workspace_id
credential_id
operator_id
provider
provider_state
model
model_level
input_tokens
output_tokens
total_tokens
cost_units
cost_minor
evt_id
opc_id
audit_id
created_at
legal_certification

Required value:

legal_certification=false

---

24. JSON bundle model

Recommended JSON bundle structure:

{
  "exportId": "EXPORT-...",
  "exportType": "AUDIT_USAGE_EVIDENCE",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "createdAt": "ISO-8601",
  "redactionMode": "TECHNICAL_METADATA_ONLY",
  "records": {
    "audit": [],
    "usage": [],
    "events": [],
    "opc": []
  },
  "summary": {
    "auditCount": 0,
    "usageCount": 0,
    "evtCount": 0,
    "opcCount": 0
  },
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only",
    "evtBoundary": "technical event trace only",
    "iprBoundary": "operational identity/proof layer only"
  }
}

---

25. Pilot report structure

Recommended report sections:

1. Pilot identity
2. Runtime baseline
3. Tenant/workspace
4. API surface status
5. Request summary
6. EVT summary
7. OPC summary
8. Audit summary
9. Model usage summary
10. Source Intelligence summary
11. Quota summary
12. Security boundary
13. Legal boundary
14. Integration recommendations
15. Next steps

Pilot report mandatory closing boundary:

This report is a technical pilot report.
It is not legal certification.
legalCertification=false.

---

26. Database schema sketch

Suggested export table:

CREATE TABLE hbce_exports (
  export_id TEXT PRIMARY KEY,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  credential_id TEXT,
  operator_id TEXT,
  redaction_mode TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  download_path TEXT,
  download_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  created_by TEXT,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested export audit table:

CREATE TABLE hbce_export_audit_events (
  export_audit_id TEXT PRIMARY KEY,
  export_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  credential_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested indexes:

CREATE INDEX hbce_exports_tenant_workspace_idx
ON hbce_exports (tenant_id, workspace_id);

CREATE INDEX hbce_exports_created_at_idx
ON hbce_exports (created_at);

CREATE INDEX hbce_export_audit_export_idx
ON hbce_export_audit_events (export_id);

---

27. First implementation order

Recommended implementation order:

1. Define export record types.
2. Define export redaction modes.
3. Add audit list query helper.
4. Add usage list query helper.
5. Add tenant/workspace export scope check.
6. Add JSON export builder.
7. Add CSV export builder.
8. Add export audit event writer.
9. Add export quota check.
10. Add GET /api/v1/audit list endpoint.
11. Add GET /api/v1/model-usage list endpoint.
12. Add POST /api/v1/export/evidence-package.
13. Add dashboard export descriptor later.

First code target:

lib/audit-usage-export.ts

Second code target:

app/api/v1/audit/route.ts

Third code target:

app/api/v1/model-usage/route.ts

Fourth code target:

app/api/v1/export/evidence-package/route.ts

Do not begin with PDF export. That is how innocent people discover layout engines and lose a week of their life.

---

28. Acceptance criteria

Audit/usage export is acceptable when:

audit records can be listed by tenant/workspace
usage records can be listed by tenant/workspace
cross-tenant export fails closed
cross-workspace export fails closed
JSON export is generated
CSV export is generated
export action is audited
redaction mode is applied
raw secrets are never exported
legalCertification=false is preserved

Minimum PASS output:

AUDIT_USAGE_EXPORT_READY
tenantScope=PASS
workspaceScope=PASS
auditExport=PASS
usageExport=PASS
jsonExport=PASS
csvExport=PASS
redaction=TECHNICAL_METADATA_ONLY
legalCertification=false

---

29. Non-goals for first implementation

Do not include in first implementation:

PDF rendering
qualified signature
legal certificate generation
public notary bundle
external storage integration
S3-style signed URLs
customer portal download center
full billing invoice export
automated procurement reports

First implementation must prove:

tenant-scoped audit export,
tenant-scoped usage export,
technical evidence grouping,
redaction,
and boundary preservation.

That is enough. More than enough. Software dies from “while we’re here”.

---

30. Final statement

Audit and usage export is required to move HBCE IPR Runtime API v1 from runtime demonstration to B2G pilot evidence.

The export layer must preserve:

tenant scope
workspace scope
credential scope
operator scope
EVT references
OPC references
audit records
usage records
model metadata
cost-unit metadata
technical hashes
redaction mode
legal boundary

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
