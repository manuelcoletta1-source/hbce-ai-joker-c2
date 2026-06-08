HBCE IPR Runtime API v1

API v1 Public Surface Regression — v76

Runtime: JOKER-C2 SaaS Core v0.1
Product layer: HBCE IPR Operational Identity & Proof Layer
Test type: public API v1 contract-only regression
Revision scope: after "API_V1_MODEL_USAGE_LOOKUP_CONTRACT_GUARD-v9_10_7_76"
Target: B2B / B2G
Boundary: "legalCertification=false"

---

1. Regression result

HBCE_API_V1_PUBLIC_SURFACE_SELF_TEST_READY
apiV1PublicSurfaceSelfTestGuardRevision=API_V1_PUBLIC_SURFACE_SELF_TEST_PRODUCT_PREEMPT-v9_10_7_62
mode=PUBLIC_API_SURFACE_SELF_TEST_CONTRACT_ONLY_NO_BRANCH_EXECUTION
apiVersion=v1
publicContract=true
target=B2B/B2G
contractMode=PUBLIC_API_SURFACE
endpointCount=16
finalVerdict=PASS

---

2. Endpoint coverage

All 16 public API v1 endpoints passed contract-only validation.

GET  /api/v1 = PASS
GET  /api/v1/health = PASS
GET  /api/v1/capabilities = PASS
POST /api/v1/ipr/session = PASS
GET  /api/v1/ipr/session/{sessionId} = PASS
POST /api/v1/chat = PASS
POST /api/v1/files = PASS
POST /api/v1/operations = PASS
GET  /api/v1/operations/{operationId} = PASS
GET  /api/v1/events = PASS
GET  /api/v1/opc/{opcId} = PASS
GET  /api/v1/audit/{auditId} = PASS
GET  /api/v1/model-usage/{usageId} = PASS
GET  /api/v1/openapi = PASS
GET  /api/v1/self-test = PASS
GET  /api/v1/source-intelligence = PASS

---

3. Public contract status

publicSurface=HBCE_IPR_RUNTIME_API_V1
apiV1RootDiscovery=PASS
openApiContract=PASS
selfTestContractMatrix=PASS
sourceIntelligenceContract=PASS
chatBridgeContract=PASS
filesContractOnlyDescriptor=PASS
operationsContract=PASS
eventsOpcAuditUsageLookup=PASS

The regression confirms that the API v1 public surface exposes a stable contract descriptor layer for:

root discovery
health
capabilities
IPR session creation
IPR session lookup
chat bridge
file descriptor
operation creation
operation lookup
event ledger descriptor
OPC lookup
audit lookup
model usage lookup
OpenAPI contract
self-test
Source Intelligence descriptor

---

4. Memory policy validation

The regression confirms that public API contract-only tests do not create semantic memory or IPR memory.

automaticIprMemory=false
automaticSemanticMemory=false
semanticMemoryCreated=false
semanticMemoryPersistable=false
semanticMemoryReusableInPrompt=false
noNewSemanticMemory=true
noNewSemanticMemoryPersistable=true
noNewIprMemory=true
runtimeMemoryWriteSuppressed=true
policy.saveRaw=false
policy.saveSynthesis=false
policy.reusableInPrompt=false

This is a critical runtime governance requirement.

Contract descriptors must not create persistent semantic records.

---

5. Operational branch suppression

The regression confirms that operational branches remain blocked during contract-only public surface tests.

sourceLiveFetchTriggered=false
documentIngestionTriggered=false
documentRecallTriggered=false
sourceIntelligenceBranchExecuted=false
apiV1ChatBridgeBranchExecuted=false
semanticGeneratorExecuted=false
saveChatTriggered=false

This confirms that contract-only validation does not trigger:

live Source Intelligence execution
file ingestion
document recall
semantic memory generation
chat bridge execution
Save Chat → IPR
runtime write side effects

---

6. Runtime context

Reference runtime context from the regression output:

Human IPR: IPR-88505FE91013DCFE97C56ED1
Runtime IPR: IPR-AI-0001
Identity binding: IPR_VERIFIED_BIOLOGICAL_SUBJECT
Runtime memory ID: MEM-BD826FAB3F97A085
Memory scope: IPR_BOUND
Tenant: HBCE-TENANT-SELF-PILOT
Workspace: HBCE-WORKSPACE-RND
Policy: ESCALATE / ESCALATE
failReason=NONE

The "ESCALATE / ESCALATE" runtime policy state does not block the contract-only PASS because no operational execution is performed and "failReason=NONE".

---

7. Legal and operational boundary

Mandatory boundary confirmed by the regression:

legalCertification=false
OPC=technical proof receipt only
IPR=operational identity/proof layer only
EVT=technical event trace only
HBCE/JOKER-C2=runtime governance and audit-ready infrastructure, not public authority, not legal certifier

This means:

OPC is not a legal certificate.
IPR is not an official public identity document.
EVT is not a legal notarization event.
HBCE/JOKER-C2 does not act as a public authority.
HBCE/JOKER-C2 does not act as a legal certifier.

---

8. Final technical verdict

API v1 public surface = PASS
Endpoint count = 16
Endpoint coverage = 16/16 PASS
Contract-only execution = PASS
Semantic memory creation blocked = PASS
IPR memory creation blocked = PASS
Runtime memory write suppressed = PASS
Source Intelligence live execution blocked = PASS
Document ingestion blocked = PASS
Document recall blocked = PASS
Chat bridge execution blocked = PASS
Save Chat execution blocked = PASS
legalCertification=false = PASS
finalVerdict=PASS

---

9. Product significance

This regression closes the public API v1 contract layer for HBCE IPR Runtime API v1.

The API can now be presented as a validated public surface for:

B2B/B2G integration
governed AI execution
IPR-bound operational identity
EVT technical event tracing
OPC technical proof receipts
audit lookup
model usage lookup
Source Intelligence descriptor exposure
OpenAPI/self-test discovery

The runtime is not certified as a legal authority.

The validated value is technical:

identity-bound execution,
contract-only safety,
branch suppression,
memory suppression,
audit-ready API structure,
technical proof continuity.

---

10. Link to product documentation set

This regression file belongs to the HBCE IPR Runtime API v1 documentation set:

docs/product/hbce-ipr-runtime-api-v1/README.md
docs/product/hbce-ipr-runtime-api-v1/01-one-page-product-brief.md
docs/product/hbce-ipr-runtime-api-v1/02-technical-api-contract-sheet.md
docs/product/hbce-ipr-runtime-api-v1/03-ipr-ai-audit-trail-demo-script.md
docs/product/hbce-ipr-runtime-api-v1/04-api-v1-public-surface-regression-v76.md
