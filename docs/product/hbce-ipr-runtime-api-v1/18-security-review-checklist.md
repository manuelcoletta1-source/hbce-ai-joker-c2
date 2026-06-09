HBCE IPR Runtime API v1

Security Review Checklist

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: security review, B2G pilot readiness, tenant isolation, API access, audit, usage, export, webhook, admin console
Target: HBCE operators / B2G pilot reviewers / regulated enterprise technical teams
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the security review checklist for HBCE IPR Runtime API v1 before external B2G pilot exposure.

The checklist verifies that the runtime, API surface, tenant model, access model, audit layer, model usage layer, export layer, webhook layer and admin/operator console are safe enough for controlled pilot evaluation.

This is not a legal certification checklist.

It is a technical security and governance readiness checklist.

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Current validated baseline

Current validated baseline:

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
Dashboard = PASS
legalCertification=false

Reference proof chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

This checklist assumes that baseline remains valid.

If the baseline changes, the checklist must be re-run. Revolutionary concept: when the system changes, the review changes. Humanity will recover.

---

3. Review levels

Security review is divided into four levels.

Level 1 — Internal self-pilot review

Used for:

HBCE internal R&D
dashboard validation
API v1 contract-only testing
documentation validation

Required result:

SELF_PILOT_SECURITY_REVIEW_READY

---

Level 2 — Guided demo review

Used for:

client demo
institutional presentation
B2G discovery session
non-sensitive runtime demonstration

Required result:

GUIDED_DEMO_SECURITY_REVIEW_READY

---

Level 3 — Controlled API pilot review

Used for:

client API key
tenant/workspace pilot
controlled external integration
technical B2G pilot

Required result:

CONTROLLED_API_PILOT_SECURITY_REVIEW_READY

---

Level 4 — Production candidate review

Used for:

broader SaaS deployment
multi-client operation
production tenant onboarding
commercial subscription service

Required result:

PRODUCTION_CANDIDATE_SECURITY_REVIEW_READY

Current target:

Level 3 — Controlled API pilot review

---

4. Global security boundary checklist

Before any external pilot:

[ ] legalCertification=false is visible in product documentation
[ ] legalCertification=false is visible in API responses
[ ] legalCertification=false is visible in dashboard
[ ] OPC boundary is documented as technical proof receipt only
[ ] EVT boundary is documented as technical event trace only
[ ] IPR boundary is documented as operational identity/proof layer only
[ ] Product is not described as public authority
[ ] Product is not described as legal certifier
[ ] Product is not described as qualified timestamping service
[ ] Product is not described as official identity issuance service
[ ] Pilot materials include security boundary pack
[ ] Pilot materials include commercial boundary statement

Minimum PASS:

SECURITY_BOUNDARY_PASS
legalCertification=false

---

5. Runtime identity checklist

Verify runtime identity state:

[ ] Runtime IPR is present
[ ] Human IPR reference is present where applicable
[ ] Access decision is explicit
[ ] Identity binding is explicit
[ ] Certificate status is explicit
[ ] Runtime authority is server-side validated
[ ] Self-pilot bridge is not used for external client tenants
[ ] Client tenant does not use HBCE-TENANT-SELF-PILOT
[ ] Client workspace does not use HBCE-WORKSPACE-RND

Expected internal baseline:

Runtime IPR = IPR-AI-0001
Human IPR = IPR-88505FE91013DCFE97C56ED1
Access = ACCESS_GRANTED
Certificate status = ACTIVE
Identity binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
Authority = SERVER_RUNTIME_VALIDATED

Minimum PASS:

RUNTIME_IDENTITY_PASS

---

6. Tenant and workspace isolation checklist

For external pilot:

[ ] Client tenant exists
[ ] Client workspace exists
[ ] Tenant status is ACTIVE
[ ] Workspace status is ACTIVE
[ ] Account exists
[ ] Subscription exists
[ ] Subscription status is ACTIVE
[ ] Tenant/workspace binding is enforced on API credentials
[ ] Tenant/workspace binding is enforced on audit lookup
[ ] Tenant/workspace binding is enforced on usage lookup
[ ] Tenant/workspace binding is enforced on OPC lookup
[ ] Tenant/workspace binding is enforced on document profile lookup
[ ] Tenant/workspace binding is enforced on memory recall
[ ] Cross-tenant record access fails closed
[ ] Cross-workspace record access fails closed

Fail-closed cases:

missing tenant
missing workspace
inactive tenant
inactive workspace
expired subscription
tenant mismatch
workspace mismatch
cross-tenant lookup
cross-workspace lookup

Minimum PASS:

TENANT_WORKSPACE_ISOLATION_PASS

---

7. API key / token checklist

Before issuing external API access:

[ ] API credential model exists
[ ] Credential is bound to tenant
[ ] Credential is bound to workspace
[ ] Credential is bound to account/subscription
[ ] Credential has explicit scopes
[ ] Credential has expiration
[ ] Credential has status field
[ ] Raw secret is shown only once
[ ] Raw secret is never stored in plaintext
[ ] Secret hash is stored
[ ] Secret is never logged
[ ] Invalid key is rejected
[ ] Revoked key is rejected
[ ] Expired key is rejected
[ ] Suspended key is rejected
[ ] Missing scope is rejected
[ ] Tenant mismatch is rejected
[ ] Workspace mismatch is rejected

Required statuses:

ACTIVE
SUSPENDED
REVOKED
EXPIRED
ROTATED

Minimum PASS:

API_KEY_TOKEN_SECURITY_PASS

---

8. Scope and endpoint access checklist

Verify endpoint scope model:

[ ] Each public endpoint has required scope
[ ] Scope format is stable
[ ] Missing scope returns stable error
[ ] Scope error does not leak sensitive data
[ ] Admin scopes are not included in pilot credentials by default
[ ] File ingestion scope is not enabled by default
[ ] Export scope is not enabled by default
[ ] Webhook management scope is not enabled by default
[ ] Tenant management scope is admin-only
[ ] Credential management scope is admin-only

Required default pilot scopes:

v1:health:read
v1:capabilities:read
v1:ipr-session:create
v1:ipr-session:read
v1:chat:create
v1:operations:create
v1:operations:read
v1:opc:read
v1:audit:read
v1:model-usage:read
v1:source-intelligence:read

Minimum PASS:

ENDPOINT_SCOPE_PASS

---

9. Rate limit and quota checklist

Before external API usage:

[ ] Rate-limit profile assigned
[ ] Quota profile assigned
[ ] Tenant quota scope enforced
[ ] Workspace quota scope enforced
[ ] Credential quota scope enforced
[ ] Request counter exists
[ ] Quota ledger exists or placeholder exists
[ ] Rate-limited request returns 429
[ ] Quota-exceeded request returns stable error
[ ] Retry-After header is documented
[ ] Cost-unit monthly cap is defined
[ ] Source Intelligence quota is defined
[ ] File upload quota is defined
[ ] Export quota is defined
[ ] Webhook quota is defined

Recommended default:

rateLimitProfile=B2G_PILOT_STANDARD
requestsPerMinute=30
requestsPerDay=1000
chatRequestsPerDay=250
operationsPerDay=100
sourceIntelligenceRunsPerDay=50
fileUploadsPerDay=20
maxFileSizeMb=10
maxCostUnitsPerMonth=10000

Minimum PASS:

RATE_LIMIT_QUOTA_PASS

---

10. Memory security checklist

Verify memory governance:

[ ] Memory is IPR-bound
[ ] Runtime memory state is explicit
[ ] Database persistence state is explicit
[ ] Manual Save Chat → IPR remains explicit
[ ] Automatic reusable memory is disabled unless policy allows
[ ] Contract-only API tests do not create semantic memory
[ ] Contract-only API tests do not create IPR memory
[ ] No-save guard suppresses memory writes when requested
[ ] Memory records are tenant/workspace scoped for external pilots
[ ] Cross-tenant memory recall fails closed
[ ] Cross-workspace memory recall fails closed
[ ] Raw prompt persistence is not default

Required contract-only state:

automaticIprMemory=false
automaticSemanticMemory=false
semanticMemoryCreated=false
semanticMemoryPersistable=false
noNewIprMemory=true
runtimeMemoryWriteSuppressed=true

Minimum PASS:

MEMORY_SECURITY_PASS

---

11. Document registry security checklist

Verify document handling:

[ ] File ingestion is explicit
[ ] Document profile creation is explicit
[ ] Document recall is explicit
[ ] Document profiles are tenant/workspace scoped
[ ] Raw text persistence is disabled by default
[ ] PDF binary hash-only boundary is preserved unless extraction is explicit
[ ] File size limit exists
[ ] File type policy exists
[ ] Document profile does not imply legal validation
[ ] Document recall fails closed when profile is missing
[ ] Document recall fails closed when profile is out of scope
[ ] Contract-only tests do not trigger document ingestion
[ ] Contract-only tests do not trigger document recall

Minimum PASS:

DOCUMENT_REGISTRY_SECURITY_PASS

---

12. Source Intelligence security checklist

Verify Source Intelligence governance:

[ ] SOURCESET_REGISTRY_READY
[ ] SourceSets are registered
[ ] Allowed sourceSets are explicit per workspace
[ ] Unknown sourceSet fails closed
[ ] Source/sourceSet mismatch fails closed
[ ] Local/private URLs are rejected
[ ] Raw text persistence is false by default
[ ] Source profile save requires explicit operator action
[ ] PDF boundary is documented
[ ] Prompt injection screening state is documented
[ ] Source Intelligence does not certify external legal authority
[ ] Contract-only tests do not trigger live fetch

Known validated sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Minimum PASS:

SOURCE_INTELLIGENCE_SECURITY_PASS

---

13. EVT / OPC proof chain checklist

Verify proof chain:

[ ] EVT is generated for runtime event
[ ] EVT is persisted
[ ] EVT has event hash
[ ] OPC is generated
[ ] OPC is persisted
[ ] OPC has chain hash where available
[ ] Audit links to EVT
[ ] Audit links to OPC
[ ] Usage links to EVT
[ ] Usage links to OPC
[ ] Boundary states EVT as technical event trace only
[ ] Boundary states OPC as technical proof receipt only
[ ] No legal certification claim is present

Minimum PASS:

EVT_OPC_PROOF_CHAIN_PASS

---

14. Audit security checklist

Verify audit layer:

[ ] Audit persistence is active
[ ] Audit ID is generated
[ ] Audit record links to tenant/workspace
[ ] Audit record links to credential/operator if available
[ ] Audit record links to EVT
[ ] Audit record links to OPC
[ ] Audit record links to usage
[ ] Policy decision is recorded
[ ] Risk level is recorded
[ ] Security outcome is recorded
[ ] Audit lookup is tenant/workspace scoped
[ ] Cross-tenant audit lookup fails closed
[ ] Cross-workspace audit lookup fails closed
[ ] Audit export redacts raw secrets
[ ] Audit export includes legalCertification=false

Minimum PASS:

AUDIT_SECURITY_PASS

---

15. Model usage security checklist

Verify usage accounting:

[ ] Model usage persistence is active
[ ] Usage ID is generated
[ ] Usage record links to tenant/workspace
[ ] Usage record links to credential/operator if available
[ ] Usage record links to audit
[ ] Usage record links to EVT
[ ] Usage record links to OPC
[ ] Model name is recorded
[ ] Model level is recorded
[ ] Token fields are recorded or marked unavailable
[ ] Cost units are recorded where available
[ ] Usage lookup is tenant/workspace scoped
[ ] Cross-tenant usage lookup fails closed
[ ] Cross-workspace usage lookup fails closed
[ ] Usage export includes legalCertification=false

Minimum PASS:

MODEL_USAGE_SECURITY_PASS

---

16. Export security checklist

Before enabling export:

[ ] Export endpoint requires explicit scope
[ ] Export is tenant/workspace scoped
[ ] Cross-tenant export fails closed
[ ] Cross-workspace export fails closed
[ ] Export redaction mode exists
[ ] Default export mode is TECHNICAL_METADATA_ONLY
[ ] Raw API secrets are never exported
[ ] Raw bearer tokens are never exported
[ ] Authorization headers are never exported
[ ] Raw prompts are excluded by default
[ ] Raw document text is excluded by default
[ ] Raw source text is excluded by default
[ ] Export action is audited
[ ] Export hash is generated
[ ] Export retention is defined
[ ] Export includes legalCertification=false

Minimum PASS:

EXPORT_SECURITY_PASS

---

17. Webhook security checklist

Before enabling webhook delivery:

[ ] Webhook endpoint registration requires scope
[ ] Webhook endpoint is tenant/workspace scoped
[ ] HTTPS is required
[ ] Localhost URLs are rejected
[ ] Private IP ranges are rejected
[ ] Metadata service IPs are rejected
[ ] Unsupported protocols are rejected
[ ] Webhook secret is shown only once
[ ] Webhook secret is not stored in plaintext
[ ] Payload is signed
[ ] Timestamp header is included
[ ] Event ID header is included
[ ] Retry policy is defined
[ ] Delivery status is persisted
[ ] Failed delivery is audited
[ ] Webhook payload excludes raw secrets
[ ] Webhook payload includes legalCertification=false

Blocked URL examples:

http://localhost
http://127.0.0.1
http://169.254.169.254
private RFC1918 IP ranges
file://
ftp://

Minimum PASS:

WEBHOOK_SECURITY_PASS

---

18. Admin/operator console security checklist

Before enabling admin console:

[ ] Admin console route is separate from public interface
[ ] Operator role model exists
[ ] Operator session model exists
[ ] Console access requires role
[ ] Console access requires tenant/workspace scope where applicable
[ ] Read-only role cannot mutate records
[ ] Client operator cannot access other tenant
[ ] Admin action is audited
[ ] Credential creation is audited
[ ] Credential revocation is audited
[ ] Tenant suspension is audited
[ ] Workspace suspension is audited
[ ] Export creation is audited
[ ] Boundary card is visible
[ ] legalCertification=false is visible

Minimum PASS:

ADMIN_CONSOLE_SECURITY_PASS

---

19. OpenAPI security checklist

Before external publication:

[ ] OpenAPI version is declared
[ ] All public endpoints are documented
[ ] Operation IDs are stable
[ ] Security schemes are documented
[ ] API key scheme is documented
[ ] Bearer token scheme is documented if supported
[ ] Error envelope is documented
[ ] Boundary schema is documented
[ ] Proof references schema is documented
[ ] Rate-limit headers are documented
[ ] Idempotency header is documented
[ ] legalCertification=false is present in schemas
[ ] Contract-only behavior is documented
[ ] Future endpoints are not counted as PASS until implemented

Minimum PASS:

OPENAPI_SECURITY_PASS

---

20. SDK security checklist

Before SDK pilot use:

[ ] SDK does not hardcode production URL
[ ] SDK supports configured baseUrl
[ ] SDK supports API key
[ ] SDK supports bearer token if implemented
[ ] SDK never logs secrets
[ ] SDK redacts Authorization header
[ ] SDK exposes boundary fields
[ ] SDK exposes proof references
[ ] SDK exposes audit ID
[ ] SDK exposes usage ID
[ ] SDK has typed error model
[ ] SDK handles rate-limit response
[ ] SDK handles quota response
[ ] SDK supports strict boundary mode or warning
[ ] SDK examples use environment variables
[ ] Real credentials are not committed

Minimum PASS:

SDK_SECURITY_PASS

---

21. Data protection checklist

Before external pilot:

[ ] Pilot data boundary is documented
[ ] Public/synthetic data default is documented
[ ] Sensitive production data is excluded by default
[ ] Data processing agreement requirement is documented
[ ] Retention profile is defined
[ ] Deletion/removal workflow is defined or explicitly future
[ ] Raw text persistence is false by default
[ ] Source raw text persistence is false by default
[ ] Document raw text persistence is false by default
[ ] Export raw content requires explicit approval
[ ] Logs do not store secrets
[ ] Logs minimize personal data

Default pilot rule:

Use PUBLIC or SYNTHETIC data unless a separate written security and data-processing agreement exists.

Minimum PASS:

DATA_PROTECTION_REVIEW_PASS

---

22. Logging and secret handling checklist

Verify secret hygiene:

[ ] API keys are not logged
[ ] Bearer tokens are not logged
[ ] Authorization headers are redacted
[ ] Webhook secrets are not logged
[ ] Raw secrets are shown only once
[ ] Secret hashes are stored instead of raw secrets
[ ] Error responses do not leak secrets
[ ] Debug logs redact secrets
[ ] Audit logs do not include raw credentials
[ ] Export does not include raw credentials

Minimum PASS:

SECRET_HANDLING_PASS

---

23. Fail-closed checklist

Verify fail-closed behavior:

[ ] Unknown sourceSet fails closed
[ ] Source/sourceSet mismatch fails closed
[ ] Missing tenant fails closed
[ ] Missing workspace fails closed
[ ] Tenant mismatch fails closed
[ ] Workspace mismatch fails closed
[ ] Invalid API key fails closed
[ ] Revoked API key fails closed
[ ] Expired API key fails closed
[ ] Missing scope fails closed
[ ] Document profile missing fails closed
[ ] Document profile out of scope fails closed
[ ] Webhook unsafe URL fails closed
[ ] Export scope mismatch fails closed
[ ] Admin role mismatch fails closed

Minimum PASS:

FAIL_CLOSED_SECURITY_PASS

---

24. Abuse and anomaly checklist

Before external access:

[ ] Failed auth attempts are counted
[ ] Rate-limit abuse is detected
[ ] Quota abuse is detected
[ ] SourceSet mismatch attempts are recorded
[ ] File upload bursts are limited
[ ] Polling loops are limited
[ ] Repeated webhook failures are recorded
[ ] Credential suspension path exists
[ ] Operator review path exists
[ ] Abuse events are auditable

Minimum PASS:

ABUSE_MONITORING_PASS

---

25. B2G guided demo checklist

For guided demo only:

[ ] Demo uses HBCE-controlled environment
[ ] No client production data is used
[ ] No external API key is issued
[ ] Dashboard status is healthy
[ ] API v1 status is 16/16 PASS
[ ] Runtime health is visible
[ ] Source Intelligence descriptor is visible
[ ] legalCertification=false is visible
[ ] Demo proof chain is prepared
[ ] Security boundary pack is available

Minimum PASS:

GUIDED_DEMO_SECURITY_READY

---

26. Controlled API pilot checklist

Before controlled client API pilot:

[ ] Client tenant created
[ ] Client workspace created
[ ] Client subscription active
[ ] Client API credential created
[ ] API credential scoped
[ ] API credential expiration set
[ ] Rate-limit profile assigned
[ ] Quota profile assigned
[ ] SourceSet permissions assigned
[ ] Export permissions assigned only if required
[ ] Webhook permissions assigned only if required
[ ] Audit/usage lookup tested
[ ] Tenant/workspace mismatch test PASS
[ ] Invalid credential test PASS
[ ] Revoked credential test PASS
[ ] legalCertification=false visible in all responses

Minimum PASS:

CONTROLLED_API_PILOT_SECURITY_READY

---

27. Production candidate checklist

Before production candidate:

[ ] API key/token model implemented
[ ] Tenant onboarding implemented
[ ] Rate limits implemented
[ ] Quota ledger implemented
[ ] OpenAPI stabilized
[ ] TypeScript SDK tested
[ ] Audit export implemented
[ ] Usage export implemented
[ ] Webhook delivery implemented
[ ] Admin console implemented
[ ] Retention policy implemented
[ ] Deletion workflow implemented
[ ] Incident response workflow documented
[ ] Security review completed
[ ] Data processing agreement reviewed
[ ] Monitoring implemented
[ ] Backup/recovery reviewed
[ ] Deployment secrets reviewed
[ ] Legal boundary reviewed

Minimum PASS:

PRODUCTION_CANDIDATE_SECURITY_READY

---

28. Security review output format

Each review should produce a summary:

securityReviewId=SECURITY-REVIEW-...
reviewLevel=CONTROLLED_API_PILOT
tenantId=...
workspaceId=...
reviewedBy=...
reviewedAt=...
finalVerdict=PASS | FAIL | PASS_WITH_LIMITATIONS
legalCertification=false

Recommended PASS output:

HBCE_SECURITY_REVIEW_READY
reviewLevel=CONTROLLED_API_PILOT
runtimeIdentity=PASS
tenantIsolation=PASS
apiCredential=PASS
scopeModel=PASS
rateLimitQuota=PASS
memorySecurity=PASS
documentSecurity=PASS
sourceIntelligenceSecurity=PASS
evtOpcProofChain=PASS
auditSecurity=PASS
usageSecurity=PASS
exportSecurity=PASS
webhookSecurity=PASS
adminConsoleSecurity=PASS
openApiSecurity=PASS
sdkSecurity=PASS
dataProtection=PASS
secretHandling=PASS
failClosed=PASS
legalCertification=false

---

29. Known acceptable limitations for SaaS Core v0.2

The following may remain future work in v0.2 if explicitly documented:

full customer portal
enterprise SSO
OIDC/SAML
advanced RBAC
automated billing
PDF export
SIEM connector
multi-region deployment
SOC2/ISO certification
qualified timestamping
legal certification

These limitations do not block B2G pilot readiness if the pilot is controlled, scoped and boundary-explicit.

They do block production-scale claims.

---

30. Non-goals

This checklist does not provide:

legal certification
public authority validation
qualified timestamping validation
formal compliance certification
SOC2 certification
ISO certification
penetration test report
DPIA
DPA
legal opinion

Those require separate professional review.

This checklist is a technical readiness tool.

Not a magic shield. Humans love magic shields. Security people prefer checklists and logs, because they have seen the abyss and it had default passwords.

---

31. Final security statement

HBCE IPR Runtime API v1 can proceed to controlled B2G pilot only when security review confirms:

tenant isolation
workspace isolation
API credential control
scope enforcement
rate-limit and quota control
audit persistence
model usage persistence
EVT/OPC proof continuity
Source Intelligence boundary
document handling boundary
memory governance
export redaction
webhook signing
admin/operator role control
legal boundary visibility

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
