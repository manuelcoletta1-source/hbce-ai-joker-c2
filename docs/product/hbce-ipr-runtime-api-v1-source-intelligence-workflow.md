# HBCE IPR Runtime API v1 — Source Intelligence Workflow

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** source intelligence workflow guide  
**Audience:** technical partners, B2B / B2G pilot evaluators, integration developers, security reviewers, institutional analysts  
**Workflow status:** `pilot source intelligence workflow ready`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical source receipt only  
**Raw text policy:** `rawTextPersistence=false` by default unless explicitly governed  
**Prompt-injection posture:** treat every fetched or submitted source as untrusted input  
**Source posture:** catalog-first, source-set scoped, no uncontrolled source ingestion by default

---

## 1. Purpose

This document defines the controlled Source Intelligence workflow for HBCE IPR Runtime API v1.

The workflow explains how a partner should approach registered sources, source sets, fetch control, source hashing, source summary, source-context generation, prompt-injection screening, runtime linkage, auditability and proof boundaries during a controlled pilot.

The goal is not to give the runtime an open mouth connected to the internet and call the result “intelligence”. That trick has already been performed by half the software industry with impressive confidence and minimal adult supervision.

The correct objective is:

```txt
registered source -> source-set validation -> controlled fetch or catalog descriptor -> hash / metadata -> source summary -> governed runtime use -> EVT / OPC / audit linkage
```

Core boundary:

```txt
legalCertification=false
OPC=technical source receipt only
rawTextPersistence=false
```

---

## 2. Related package

This workflow belongs to the API v1 product package:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
```

Smoke baseline:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Core pilot routes:

```txt
POST /api/v1/ipr/session
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
POST /api/v1/chat
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

If a deployment exposes Source Intelligence through an internal or product-specific route, this workflow still applies to the public API v1 product contract and should be adapted only by explicit implementation mapping.

---

## 3. What Source Intelligence is

Source Intelligence is the controlled handling of trusted or registered source material inside HBCE API v1.

It should support pilot cases such as:

```txt
registered source-set summary
public source catalog analysis
policy document context generation
AI safety source review
cybersecurity source review
institutional source package evaluation
technical report summary
source hash and metadata receipt
controlled source context for JOKER-C2 chat
```

Partner-facing definition:

```txt
Source Intelligence allows a partner to work with registered sources or approved source sets so that source material can be validated, hashed, summarized, bounded and connected to governed AI execution through IPR session, EVT, OPC and audit identifiers.
```

It must not be treated as:

```txt
unrestricted web browsing
uncontrolled URL fetch
public certification of source truth
legal evidence validation
raw-source memory ingestion
cross-tenant intelligence repository
unbounded scraping pipeline
```

Boundary:

```txt
legalCertification=false
```

---

## 4. Source workflow in one sentence

```txt
A source enters API v1 only as controlled input: it must belong to an approved source set or explicit catalog entry, receive metadata and hash treatment, be summarized under prompt-injection controls, and remain bounded by legalCertification=false and OPC technical source receipt only.
```

Shorter:

```txt
Sources become governed runtime context, not uncontrolled authority.
```

---

## 5. Canonical flow

Controlled Source Intelligence flow:

```txt
1. Create IPR session.
2. Select source set or explicit source IDs.
3. Resolve sources against the catalog.
4. Reject unknown, mixed or unregistered sources unless policy explicitly allows them.
5. Fetch live content only when authorized.
6. Extract metadata, source hash and text boundary.
7. Apply prompt-injection screening.
8. Generate source summary or source context block.
9. Use controlled source context in POST /api/v1/chat.
10. Capture EVT / OPC / audit IDs.
11. Lookup event, source receipt and audit envelope.
12. Review result under legalCertification=false.
```

Flow diagram:

```txt
Partner system
    |
    | POST /api/v1/ipr/session
    v
IPR-bound session
    |
    | GET/POST /api/v1/source-intelligence
    v
Source-set resolver
    |
    | catalog-first validation
    v
Controlled source fetch / descriptor
    |
    | hash + metadata + prompt-injection screening
    v
Source context block
    |
    | POST /api/v1/chat
    v
JOKER-C2 governed runtime
    |
    | EVT + OPC + audit
    v
Lookup envelope
```

---

## 6. Required pilot context

Before using Source Intelligence, the partner must have:

```txt
approved pilot scope
assigned API key
tenant ID
workspace ID
operator / Human IPR
runtime IPR
accepted security checklist
accepted rate limit / quota policy
approved source set
approved source catalog
source data class
```

Required boundary fields:

```txt
legalCertification=false
opcBoundary=technical source receipt only
rawTextPersistence=false
```

Recommended scope variables:

```bash
export HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app"
export HBCE_RUNTIME_IPR_ID="IPR-AI-0001"
export HBCE_TENANT_ID="HBCE-TENANT-SELF-PILOT"
export HBCE_WORKSPACE_ID="HBCE-WORKSPACE-RND"
export HBCE_OPERATOR_IPR_ID="IPR-..."
```

API key handling:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY
```

Never print the key.

---

## 7. Source sets

A source set is a governed group of sources.

Example source-set names:

```txt
OPENAI_AGENTIC_SYSTEMS_SECURITY
ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE
ECB_AI_RISK_AND_FINANCIAL_STABILITY
HBCE_PRODUCT_DOCUMENTATION
```

A source set should define:

```txt
sourceSetId
title
description
allowed source IDs
default source IDs
allowed URLs
fetch policy
summary policy
prompt-injection policy
rawTextPersistence=false
legalCertification=false
OPC boundary
```

Source-set rule:

```txt
The runtime should prefer source-set resolution over ad hoc URL ingestion.
```

This reduces drift, source confusion and the beloved human habit of calling five random links “research”.

---

## 8. Source catalog

A source catalog should register each source with:

```txt
sourceId
sourceSetId
title
publisher
canonical URL
allowed URL variants
document type
expected MIME type
source trust classification
retrieval mode
hash mode
summary mode
prompt-injection risk mode
legalCertification=false
opcBoundary=technical source receipt only
```

Catalog-first policy:

```txt
sourceId or sourceSet must resolve to registered catalog entries before runtime use.
```

If an URL is not registered:

```txt
URL_NOT_REGISTERED_IN_SOURCE_CATALOG
```

If a source ID is unknown:

```txt
SOURCE_ID_NOT_FOUND
```

If source set is unknown:

```txt
UNKNOWN_SOURCE_SET
```

---

## 9. Source Intelligence route concept

Route:

```txt
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
```

Typical GET query:

```txt
GET /api/v1/source-intelligence?sourceSet=OPENAI_AGENTIC_SYSTEMS_SECURITY
```

Typical POST body:

```json
{
  "sourceSet": "OPENAI_AGENTIC_SYSTEMS_SECURITY",
  "sourceIds": ["openai-agentic-systems-paper"],
  "fetchLive": false,
  "includeProfiles": true,
  "includeContextBlock": true,
  "legalCertification": false,
  "opcBoundary": "technical source receipt only",
  "rawTextPersistence": false
}
```

If the product implementation maps public `/api/v1/source-intelligence` to an internal summarization module, the public route must still preserve these boundaries.

---

## 10. cURL source-set summary example

```bash
curl -sS   -H "Authorization: Bearer $HBCE_API_V1_KEY"   -H "X-API-Key: $HBCE_API_V1_KEY"   "$HBCE_API_V1_BASE_URL/api/v1/source-intelligence?sourceSet=OPENAI_AGENTIC_SYSTEMS_SECURITY&includeProfiles=true&includeContextBlock=true"   | head -c 1800
echo
```

Expected concepts:

```txt
sourceSet
sourceProfiles
contextBlock
legalCertification=false
technical source receipt only
rawTextPersistence=false
```

If the route is not available in the current deployment, the endpoint should return a clear contract status rather than silent success.

---

## 11. cURL source-set POST example

```bash
SOURCE_INTELLIGENCE_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/source-intelligence"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      \"tenantId\":\"$HBCE_TENANT_ID\",
      \"workspaceId\":\"$HBCE_WORKSPACE_ID\",
      \"operatorIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"runtimeIprId\":\"$HBCE_RUNTIME_IPR_ID\",
      \"sourceSet\":\"OPENAI_AGENTIC_SYSTEMS_SECURITY\",
      \"sourceIds\":[\"openai-agentic-systems-paper\"],
      \"fetchLive\":false,
      \"includeProfiles\":true,
      \"includeContextBlock\":true,
      \"rawTextPersistence\":false,
      \"legalCertification\":false,
      \"opcBoundary\":\"technical source receipt only\"
    }"
)"
```

Preview:

```bash
echo "$SOURCE_INTELLIGENCE_RESPONSE" | head -c 1800
echo
```

Expected:

```txt
source intelligence envelope
source profiles
source summary
context block
rawTextPersistence=false
legalCertification=false
technical source receipt only
```

---

## 12. Controlled live fetch

Live fetch should be disabled by default:

```txt
fetchLive=false
```

Live fetch may be enabled only when:

```txt
source is registered
URL belongs to source catalog
source set allows live fetch
timeout is bounded
max text chars are bounded
prompt-injection screening is active
rawTextPersistence=false
tenant/workspace are explicit
```

Example:

```json
{
  "sourceSet": "EU_AI_GOVERNANCE",
  "sourceIds": ["eu-ai-act-overview"],
  "fetchLive": true,
  "timeoutMs": 12000,
  "maxTextChars": 50000,
  "legalCertification": false,
  "opcBoundary": "technical source receipt only",
  "rawTextPersistence": false
}
```

Live fetch must never become unrestricted browsing.

---

## 13. URL input rules

Allowed by default:

```txt
registered canonical URL
registered URL variant
URL explicitly listed inside the source catalog
URL matching the requested source set
```

Rejected by default:

```txt
unregistered URL
URL outside selected source set
mixed source-set input
raw arbitrary URL list
URL with unsupported scheme
localhost / private network targets
credential-bearing URLs
tracking or redirect chains without approval
```

Possible fail reasons:

```txt
URL_SOURCESET_MISMATCH
URL_NOT_REGISTERED_FOR_EXPLICIT_SOURCE_SET
URL_NOT_REGISTERED_IN_SOURCE_CATALOG
MIXED_SOURCESET_INPUT_NOT_ALLOWED
NO_SOURCES_RESOLVED
```

---

## 14. Source data classification

Every source should be classified.

Suggested classes:

```txt
PUBLIC
PUBLIC_REGISTERED
PUBLIC_LIVE_FETCH_ALLOWED
CATALOG_ONLY
INTERNAL_APPROVED
CONFIDENTIAL_REQUIRES_APPROVAL
PROHIBITED
```

Default pilot preference:

```txt
PUBLIC_REGISTERED
CATALOG_ONLY
PUBLIC_LIVE_FETCH_ALLOWED with explicit fetchLive=true
```

Partner must not use:

```txt
PROHIBITED
```

Source content being public does not make it safe. Public nonsense is still nonsense, merely better distributed.

---

## 15. Source hash boundary

For each resolved source, the runtime should record:

```txt
sourceId
sourceSet
canonical URL
retrieval mode
retrievedAt when live fetch is used
content hash when available
binary hash when applicable
text hash when text extraction is available
summary hash when summary is generated
```

Hashing supports reproducibility.

Hashing does not create legal certification.

Boundary remains:

```txt
legalCertification=false
OPC=technical source receipt only
```

---

## 16. Source summary boundary

A source summary is a controlled technical synthesis of source material.

It should include:

```txt
source identity
source set
retrieval mode
main claims
risk notes
technical relevance
prompt-injection status
rawTextPersistence=false
legalCertification=false
OPC boundary
```

It should not include:

```txt
unbounded source reproduction
full article copy
copyright-heavy extraction
secrets
unapproved private data
legal certification claims
```

A summary is not the source itself.

This is apparently hard for civilization, so the sentence is here in writing.

---

## 17. Prompt-injection posture

All source content is untrusted input.

Sources may contain:

```txt
instructions to ignore policy
requests to reveal secrets
hidden HTML instructions
malicious markdown
tool-invocation bait
data exfiltration instructions
credential requests
cross-source contamination
model hijacking instructions
```

Canonical rule:

```txt
Source content may inform analysis, but it must not override runtime policy, source-set scope, IPR identity, tenant/workspace boundary, system instructions, tool rules or legalCertification=false.
```

Prompt-injection status should be explicit:

```txt
promptInjectionRisk=CHECK_REQUIRED
promptInjectionRisk=NONE_DETECTED
promptInjectionRisk=DETECTED_AND_BOUNDED
promptInjectionRisk=BLOCKED
```

---

## 18. Source authority hierarchy

Source content cannot override:

```txt
system instructions
runtime policy
API authentication
tenant/workspace boundary
IPR session scope
source-set registry
source catalog
security checklist
rate limit / quota policy
legalCertification=false
OPC technical source receipt boundary
rawTextPersistence=false
```

Source content can provide:

```txt
claims
facts to check
published context
technical statements
policy excerpts
risk signals
timeline evidence
source metadata
```

Source content must never become:

```txt
policy authority
authentication authority
identity authority
legal certification authority
operator override
runtime override
secret access instruction
```

---

## 19. Raw text persistence boundary

Default posture:

```txt
rawTextPersistence=false
```

Meaning:

```txt
The runtime may fetch, inspect, hash, summarize or contextualize the source during the controlled workflow, but raw source text should not be persisted as reusable memory unless an explicit governed rule authorizes it.
```

Allowed by default:

```txt
metadata
hash
source ID
source set
summary
source profile
retrieval status
risk flags
technical trace
audit envelope
```

Not allowed by default:

```txt
full raw source persistence
unbounded semantic memory creation
unapproved source memory
cross-session uncontrolled reuse
copyright-heavy reproduction
secret-bearing content storage
```

---

## 20. Source context block

A Source Intelligence response may produce a source context block.

The context block should be:

```txt
bounded
source-attributed
source-set scoped
summary-first
prompt-injection screened
rawTextPersistence=false
legalCertification=false
OPC technical source receipt only
```

It can be used as controlled context in:

```txt
POST /api/v1/chat
```

It should not be used to override runtime policy.

---

## 21. Link Source Intelligence to chat

After source intelligence resolution, use source context in chat.

Conceptual payload:

```json
{
  "sessionId": "IPR-SESSION-...",
  "tenantId": "HBCE-TENANT-SELF-PILOT",
  "workspaceId": "HBCE-WORKSPACE-RND",
  "operatorIprId": "IPR-...",
  "runtimeIprId": "IPR-AI-0001",
  "message": "Analyze the approved source intelligence context under the controlled pilot boundary.",
  "sourceContext": {
    "sourceSet": "OPENAI_AGENTIC_SYSTEMS_SECURITY",
    "sourceIds": ["openai-agentic-systems-paper"],
    "contextBlockId": "SRCCTX-...",
    "summaryHash": "sha256:..."
  },
  "legalCertification": false,
  "opcBoundary": "technical source receipt only",
  "rawTextPersistence": false
}
```

Expected runtime output should include or connect to:

```txt
answer
responseEvt
opcId
auditId
usageId when available
legalCertification=false
technical source receipt only
```

---

## 22. Chat with source context cURL

```bash
CHAT_WITH_SOURCE_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      \"message\":\"Analyze the approved source intelligence context under the controlled API v1 boundary.\",
      \"tenantId\":\"$HBCE_TENANT_ID\",
      \"workspaceId\":\"$HBCE_WORKSPACE_ID\",
      \"operatorIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"runtimeIprId\":\"$HBCE_RUNTIME_IPR_ID\",
      \"sessionId\":\"$SESSION_ID\",
      \"sourceContext\":{
        \"sourceSet\":\"OPENAI_AGENTIC_SYSTEMS_SECURITY\",
        \"sourceIds\":[\"openai-agentic-systems-paper\"],
        \"contextBlockId\":\"$SOURCE_CONTEXT_BLOCK_ID\",
        \"summaryHash\":\"$SOURCE_SUMMARY_HASH\"
      },
      \"legalCertification\":false,
      \"opcBoundary\":\"technical source receipt only\",
      \"rawTextPersistence\":false
    }"
)"
```

Preview:

```bash
echo "$CHAT_WITH_SOURCE_RESPONSE" | head -c 1800
echo
```

---

## 23. Extract source context identifiers

If Source Intelligence response is JSON:

```bash
SOURCE_CONTEXT_BLOCK_ID="$(
  SOURCE_INTELLIGENCE_RESPONSE="$SOURCE_INTELLIGENCE_RESPONSE" node -e '
    const json = JSON.parse(process.env.SOURCE_INTELLIGENCE_RESPONSE || "{}");
    const id =
      json.contextBlockId ||
      json.sourceContextBlockId ||
      json?.contextBlock?.id ||
      json?.data?.contextBlockId ||
      "";
    process.stdout.write(id);
  '
)"

SOURCE_SUMMARY_HASH="$(
  SOURCE_INTELLIGENCE_RESPONSE="$SOURCE_INTELLIGENCE_RESPONSE" node -e '
    const json = JSON.parse(process.env.SOURCE_INTELLIGENCE_RESPONSE || "{}");
    const hash =
      json.summaryHash ||
      json.sourceSummaryHash ||
      json?.summary?.hash ||
      json?.data?.summaryHash ||
      "";
    process.stdout.write(hash);
  '
)"
```

Safe check:

```bash
test -n "$SOURCE_CONTEXT_BLOCK_ID" && echo "sourceContextBlockId=SET" || echo "sourceContextBlockId=MISSING"
test -n "$SOURCE_SUMMARY_HASH" && echo "sourceSummaryHash=SET" || echo "sourceSummaryHash=MISSING"
```

---

## 24. EVT / OPC / audit after source analysis

After chat with source context, capture:

```txt
responseEvt
opcId
auditId
usageId
```

Then lookup:

```txt
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

Correct event lookup:

```txt
GET /api/v1/events?eventId=EVT-...
```

Incorrect event lookup:

```txt
GET /api/v1/events/EVT-...
```

The route is a query lookup. Not a philosophical suggestion.

---

## 25. Source Intelligence audit expectations

Audit should record:

```txt
route used
method
tenantId
workspaceId
operatorIprId
runtimeIprId
sessionId
sourceSet
sourceIds
source URLs when allowed
retrieval mode
fetchLive
timeoutMs
maxTextChars
source hashes
summary hash
rawTextPersistence=false
legalCertification=false
opcBoundary=technical source receipt only
promptInjectionRisk
event IDs
proof receipt IDs
timestamp
policy result
```

Audit should not expose:

```txt
API key
bearer token
cookies
raw secret values
private credentials
unapproved raw source text
provider internals
cross-tenant metadata
```

---

## 26. Source OPC expectations

OPC may reference:

```txt
source set
source ID
source hash
summary hash
retrieval mode
event ID
runtime route
timestamp
technical source receipt scope
policy boundary
audit ID
```

OPC must not claim:

```txt
legal certification
notarial certification
official source truth validation
public registry certification
qualified electronic signature
court-proof status by default
```

Canonical phrase:

```txt
OPC is a technical source receipt only.
```

---

## 27. Source Intelligence risk model

Main risks:

```txt
unregistered sources
source-set mismatch
live fetch drift
prompt injection
copyright-heavy copying
misattribution
stale sources
source poisoning
private data leakage
tenant boundary violation
raw text persistence by accident
unbounded memory creation
ambiguous proof claims
quota exhaustion
```

Controls:

```txt
authentication required
tenant/workspace required
IPR session required
source set required
catalog-first resolution
registered URLs only
fetchLive=false by default
timeout and text limits
hashing
summary boundary
prompt-injection screening
rawTextPersistence=false
legalCertification=false
OPC technical source receipt only
audit envelope
rate limit / quota
```

---

## 28. Source fetch limits

Default pilot should define:

```txt
maxSourcesPerRequest
maxSourceFetchesPerDay
maxTextCharsPerSource
timeoutMs
allowedDomains
allowedMimeTypes
allowedSourceSets
rawTextPersistence mode
summary retention mode
```

Recommended initial pilot posture:

```txt
maxSourcesPerRequest=5
maxSourceFetchesPerDay=50
maxTextCharsPerSource=50000
timeoutMs=12000
fetchLive=false by default
rawTextPersistence=false
```

---

## 29. PDF source boundary

For PDF sources:

```txt
PDF_BINARY_HASH_ONLY
TEXT_EXTRACTION_REQUIRED
HTML_TEXT_READY
TEXT_READY
TEXT_READY_FULL
```

must be distinguished.

If only binary hash is available:

```txt
The runtime may verify source file integrity, but should not claim full semantic source analysis.
```

Correct boundary:

```txt
pdfContentMode=PDF_BINARY_HASH_ONLY
semanticTextReady=false
legalCertification=false
OPC=technical source receipt only
```

---

## 30. No-save guard

If a request says:

```txt
NON SALVARE
do not save
no persistence
runtime only
```

the runtime should suppress reusable memory writes.

Expected posture:

```txt
runtimeMemoryWriteSuppressed=true
semanticMemoryPersistable=false
noNewIprMemory=true
rawTextPersistence=false
```

Source analysis may still produce temporary runtime output and technical event traces according to policy.

---

## 31. Partner checklist before source workflow

Before using Source Intelligence, confirm:

```txt
API key assigned
tenant/workspace active
IPR session created
source set approved
source IDs registered
URL belongs to source catalog
fetchLive allowed if requested
source data class approved
no secrets involved
rawTextPersistence=false
legalCertification=false
OPC boundary understood
prompt-injection risk accepted
quota available
```

If any item fails:

```txt
do not run source workflow
```

Amazing how many systems improve when “stop” is considered a valid control.

---

## 32. Partner checklist after Source Intelligence response

After source resolution or summary, confirm:

```txt
sourceSet preserved
sourceIds preserved
source profiles returned
source hashes returned when available
summary returned or fail reason clear
context block returned if requested
rawTextPersistence=false visible
legalCertification=false visible
technical source receipt only visible
promptInjectionRisk present or documented
audit/event identifiers captured if produced
```

If identifiers are missing, the pilot can still continue only if the response clearly states why.

---

## 33. Partner checklist after chat analysis

After chat with source context, confirm:

```txt
answer returned
responseEvt captured
opcId captured if produced
auditId captured if produced
usageId captured if available
legalCertification=false visible
OPC boundary visible
rawTextPersistence=false preserved
source set referenced
source IDs referenced
```

Then lookup:

```txt
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

---

## 34. Rate limit and quota

Source Intelligence workflow must respect:

```txt
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
```

Possible limit status:

```txt
RATE_LIMIT_EXCEEDED
```

Example:

```json
{
  "status": "RATE_LIMIT_EXCEEDED",
  "route": "/api/v1/source-intelligence",
  "retryAfterSeconds": 60,
  "legalCertification": false,
  "opcBoundary": "technical source receipt only"
}
```

Do not retry aggressively after a `429`.

---

## 35. Security checklist alignment

Source Intelligence workflow must align with:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
```

Security gates:

```txt
authentication required
tenant required
workspace required
IPR session required
source set required
registered source catalog
fetchLive disabled by default
secrets prohibited
raw text persistence disabled by default
prompt injection treated as hostile
audit boundary preserved
legalCertification=false
OPC technical source receipt only
```

Critical fail condition:

```txt
GET/POST /api/v1/source-intelligence accepts unrestricted unregistered live fetch
```

If unrestricted live fetch returns success in a controlled pilot, stop the pilot.

---

## 36. Product positioning

Partner-facing message:

```txt
HBCE IPR Runtime API v1 Source Intelligence workflow allows registered source sets to be resolved, hashed, summarized, bounded, linked to an IPR session, used in governed AI execution and traced through EVT / OPC / audit envelopes while preserving rawTextPersistence=false and legalCertification=false by default.
```

Short version:

```txt
Sources become controlled runtime context, not uncontrolled internet authority.
```

---

## 37. What this workflow is not

It is not:

```txt
unrestricted browsing
public legal source certification
web scraping product
source truth authority
court evidence authority
unbounded knowledge base
copyright reproduction pipeline
secret ingestion route
```

It is:

```txt
controlled source intelligence for governed AI runtime evaluation
```

---

## 38. Minimal Source Intelligence workflow test

Minimal test sequence:

```txt
1. GET /api/v1/health
2. POST /api/v1/ipr/session
3. GET or POST /api/v1/source-intelligence with approved sourceSet
4. POST /api/v1/chat with source context reference
5. GET /api/v1/events?eventId
6. GET /api/v1/opc/{opcId}
7. GET /api/v1/audit/{auditId}
```

Expected status:

```txt
pilot source intelligence workflow ready
legalCertification=false
technical source receipt only
rawTextPersistence=false
```

---

## 39. Final Source Intelligence workflow verdict

```txt
HBCE IPR Runtime API v1 Source Intelligence workflow = pilot-ready
```

The Source Intelligence workflow is ready for controlled pilot documentation when used with assigned API key, tenant, workspace, IPR session, approved source set, registered source catalog, quota policy and explicit proof boundary.

Final boundary:

```txt
legalCertification=false
OPC=technical source receipt only
rawTextPersistence=false
```
