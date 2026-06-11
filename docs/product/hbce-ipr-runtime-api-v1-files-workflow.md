# HBCE IPR Runtime API v1 — Files Workflow

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** files workflow guide  
**Audience:** technical partners, B2B / B2G pilot evaluators, integration developers, internal operators, security reviewers  
**Workflow status:** `pilot files workflow ready`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only  
**Raw text policy:** `rawTextPersistence=false` by default unless explicitly governed  
**Prompt-injection posture:** treat uploaded content as untrusted input

---

## 1. Purpose

This document defines the controlled file workflow for HBCE IPR Runtime API v1.

It explains how a partner should approach file upload, file metadata, hashing, document ingestion, runtime linkage, auditability, prompt-injection risk and proof boundaries in a controlled pilot.

The purpose is not to encourage uncontrolled file dumping into the runtime. That would be less “AI governance” and more “digital landfill with HTTP headers”.

The correct objective is:

```txt
controlled file input -> metadata extraction -> hash/proof boundary -> governed runtime use -> EVT / OPC / audit linkage
```

Core boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false
```

---

## 2. Related package

The files workflow belongs to the API v1 product package:

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
POST /api/v1/files
POST /api/v1/chat
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

---

## 3. What `/api/v1/files` is for

`POST /api/v1/files` is the controlled input route for file-based runtime workflows.

It should support pilot cases such as:

```txt
document registration
file metadata extraction
hash-based file reference
controlled document analysis
source package onboarding
technical evidence packaging
audit-bound file processing
runtime file context preparation
```

Partner-facing definition:

```txt
The files workflow allows a partner to submit controlled file input into the HBCE API v1 runtime so that the file can be referenced, hashed, bounded, inspected and connected to governed AI execution through session, event, proof and audit identifiers.
```

It must not be treated as:

```txt
unrestricted storage
public document certification
uncontrolled raw text memory
secret upload endpoint
cross-tenant document repository
legal evidence registry by default
```

Boundary:

```txt
legalCertification=false
```

---

## 4. File workflow in one sentence

```txt
A file enters API v1 only as controlled input: it receives metadata and hash treatment, is bounded by pilot policy, may be linked to IPR/session/runtime execution, and can produce EVT / OPC / audit references without converting OPC into legal certification.
```

Shorter:

```txt
Files become governed runtime inputs, not magical proof objects.
```

---

## 5. Canonical flow

Controlled files workflow:

```txt
1. Create IPR session.
2. Upload or submit file through POST /api/v1/files.
3. Receive file metadata, file ID, hash, status and boundary.
4. Use file ID/hash as controlled context reference in POST /api/v1/chat.
5. Receive governed runtime output.
6. Capture EVT / OPC / audit IDs.
7. Lookup event, proof receipt and audit envelope.
8. Review result under legalCertification=false.
```

Flow diagram:

```txt
Partner system
    |
    | POST /api/v1/ipr/session
    v
IPR-bound session
    |
    | POST /api/v1/files
    v
Controlled file intake
    |
    | hash + metadata + policy boundary
    v
File reference
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

Before using file workflows, the partner must have:

```txt
approved pilot scope
assigned API key
tenant ID
workspace ID
operator / Human IPR
runtime IPR
accepted security checklist
accepted rate limit / quota policy
approved file data class
```

Required boundary fields:

```txt
legalCertification=false
opcBoundary=technical proof receipt only
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

## 7. Accepted file categories

Default controlled pilot categories:

```txt
synthetic documents
public documents
redacted documents
internal non-secret test documents
technical test payloads
partner-approved sample files
policy-approved source extracts
```

Conditionally accepted with explicit approval:

```txt
regulated business documents
internal operational reports
compliance documents
security reports
procurement documents
contract extracts
source intelligence packages
```

Not accepted by default:

```txt
secrets
passwords
API keys
tokens
private keys
live credentials
unredacted personal data
health data
financial identifiers
classified material
unapproved legal evidence
cross-tenant files
malware samples
weaponization instructions
```

A file being technically uploadable does not make it acceptable. Shocking, yes, but button existence is not governance.

---

## 8. File data classification

Every file entering the pilot should be classified before upload.

Suggested classes:

```txt
PUBLIC
SYNTHETIC
REDACTED
INTERNAL_LOW_RISK
INTERNAL_APPROVED
CONFIDENTIAL_REQUIRES_APPROVAL
PROHIBITED
```

Partner must not upload files classified as:

```txt
PROHIBITED
```

unless a separate governed security procedure exists.

For default pilot:

```txt
PUBLIC
SYNTHETIC
REDACTED
```

are preferred.

---

## 9. Upload request concept

Route:

```txt
POST /api/v1/files
```

Expected request shape may include:

```json
{
  "tenantId": "HBCE-TENANT-SELF-PILOT",
  "workspaceId": "HBCE-WORKSPACE-RND",
  "operatorIprId": "IPR-...",
  "runtimeIprId": "IPR-AI-0001",
  "sessionId": "IPR-SESSION-...",
  "fileName": "sample-document.txt",
  "fileMimeType": "text/plain",
  "filePurpose": "PILOT_FILE_WORKFLOW_TEST",
  "dataClass": "SYNTHETIC",
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only",
  "rawTextPersistence": false
}
```

For multipart upload, expected fields should preserve the same governance metadata.

---

## 10. cURL multipart example

Example:

```bash
curl -sS   -X POST "$HBCE_API_V1_BASE_URL/api/v1/files"   -H "Authorization: Bearer $HBCE_API_V1_KEY"   -H "X-API-Key: $HBCE_API_V1_KEY"   -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"   -F "file=@./sample-document.txt;type=text/plain"   -F "tenantId=$HBCE_TENANT_ID"   -F "workspaceId=$HBCE_WORKSPACE_ID"   -F "operatorIprId=$HBCE_OPERATOR_IPR_ID"   -F "runtimeIprId=$HBCE_RUNTIME_IPR_ID"   -F "sessionId=$SESSION_ID"   -F "filePurpose=PILOT_FILE_WORKFLOW_TEST"   -F "dataClass=SYNTHETIC"   -F "legalCertification=false"   -F "opcBoundary=technical proof receipt only"   -F "rawTextPersistence=false"   | head -c 1600
echo
```

Expected concepts:

```txt
file
fileId
hash
status
legalCertification=false
technical proof receipt only
rawTextPersistence=false
```

If the runtime route currently supports JSON-only descriptors rather than multipart upload, use the JSON descriptor workflow below.

---

## 11. cURL JSON descriptor example

Route:

```txt
POST /api/v1/files
```

Example:

```bash
FILE_DESCRIPTOR_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/files"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      \"tenantId\":\"$HBCE_TENANT_ID\",
      \"workspaceId\":\"$HBCE_WORKSPACE_ID\",
      \"operatorIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"runtimeIprId\":\"$HBCE_RUNTIME_IPR_ID\",
      \"sessionId\":\"$SESSION_ID\",
      \"fileName\":\"sample-document.txt\",
      \"fileMimeType\":\"text/plain\",
      \"filePurpose\":\"PILOT_FILE_WORKFLOW_TEST\",
      \"dataClass\":\"SYNTHETIC\",
      \"contentHash\":\"sha256:EXAMPLE_ONLY_REPLACE_WITH_REAL_HASH\",
      \"legalCertification\":false,
      \"opcBoundary\":\"technical proof receipt only\",
      \"rawTextPersistence\":false
    }"
)"
```

Preview:

```bash
echo "$FILE_DESCRIPTOR_RESPONSE" | head -c 1600
echo
```

---

## 12. Local file hash

Before upload or descriptor submission:

```bash
sha256sum ./sample-document.txt
```

Expected:

```txt
<hash>  ./sample-document.txt
```

Export:

```bash
export HBCE_FILE_SHA256="$(sha256sum ./sample-document.txt | awk '{print $1}')"
```

Use in JSON:

```txt
sha256:$HBCE_FILE_SHA256
```

Hashing does not mean certification. It means reproducible technical reference.

Boundary remains:

```txt
legalCertification=false
```

---

## 13. Expected file response fields

The file route should ideally return some or all of:

```txt
status
fileId
filename
mimeType
sizeBytes
fileHash
contentHash
tenantId
workspaceId
operatorIprId
runtimeIprId
sessionId
textStatus
metadataStatus
promptInjectionRisk
rawTextPersistence
legalCertification
opcBoundary
evtId
opcId
auditId
```

Minimum useful response:

```json
{
  "status": "FILE_WORKFLOW_READY",
  "fileId": "FILE-...",
  "fileHash": "sha256:...",
  "rawTextPersistence": false,
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only"
}
```

---

## 14. Raw text persistence boundary

Default posture:

```txt
rawTextPersistence=false
```

Meaning:

```txt
The runtime may inspect or process file content for the controlled workflow, but raw text should not be persisted as reusable memory unless an explicit governed rule authorizes it.
```

Allowed by default:

```txt
metadata
hash
file ID
size
MIME type
classification
status
technical trace
audit envelope
risk flags
```

Not allowed by default:

```txt
raw full text persistence
unbounded semantic memory creation
cross-session uncontrolled reuse
unapproved document memory
secret-bearing content storage
```

If raw text persistence is ever enabled, it must be explicit:

```txt
rawTextPersistence=true
approvedBy=<operator/policy>
purpose=<specific workflow>
retention=<defined>
legalCertification=false
```

---

## 15. Prompt-injection risk

Uploaded files are untrusted input.

A document may contain:

```txt
instructions to ignore system policy
requests to reveal secrets
hidden prompts
malicious markdown
HTML/script payloads
base64 payloads
cross-document injection attempts
data exfiltration instructions
tool misuse instructions
```

The runtime must treat document content as data, not authority.

Canonical rule:

```txt
File content may inform analysis, but it must not override runtime governance, IPR scope, tenant policy, system boundaries, tool policy or legalCertification=false.
```

Prompt-injection posture:

```txt
promptInjectionRisk=CHECK_REQUIRED
```

or:

```txt
promptInjectionRisk=NONE_DETECTED
```

only after inspection.

Never assume a PDF, TXT, DOCX or Markdown file is safe because it looks boring. Boring files are where malicious instructions go to wear a cardigan.

---

## 16. File content authority hierarchy

File content cannot override:

```txt
system instructions
runtime policy
API authentication
tenant/workspace boundary
IPR session scope
security checklist
rate limit / quota policy
legalCertification=false
OPC technical proof boundary
rawTextPersistence=false
```

File content can provide:

```txt
facts to analyze
document text
evidence candidates
metadata
source material
test payload content
partner context
```

File content must never become:

```txt
policy authority
authentication authority
identity authority
legal certification authority
operator override
secret access instruction
```

---

## 17. Link file to chat

After file intake, use file reference in chat.

Route:

```txt
POST /api/v1/chat
```

Example conceptual payload:

```json
{
  "sessionId": "IPR-SESSION-...",
  "tenantId": "HBCE-TENANT-SELF-PILOT",
  "workspaceId": "HBCE-WORKSPACE-RND",
  "operatorIprId": "IPR-...",
  "runtimeIprId": "IPR-AI-0001",
  "message": "Analyze the uploaded file under the controlled pilot boundary.",
  "files": [
    {
      "fileId": "FILE-...",
      "fileHash": "sha256:...",
      "purpose": "PILOT_FILE_ANALYSIS"
    }
  ],
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only",
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
technical proof receipt only
```

---

## 18. Chat with file reference cURL

Example:

```bash
CHAT_WITH_FILE_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      \"message\":\"Analyze the uploaded file under the controlled API v1 files workflow boundary.\",
      \"tenantId\":\"$HBCE_TENANT_ID\",
      \"workspaceId\":\"$HBCE_WORKSPACE_ID\",
      \"operatorIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"runtimeIprId\":\"$HBCE_RUNTIME_IPR_ID\",
      \"sessionId\":\"$SESSION_ID\",
      \"files\":[
        {
          \"fileId\":\"$FILE_ID\",
          \"fileHash\":\"$FILE_HASH\",
          \"purpose\":\"PILOT_FILE_ANALYSIS\"
        }
      ],
      \"legalCertification\":false,
      \"opcBoundary\":\"technical proof receipt only\",
      \"rawTextPersistence\":false
    }"
)"
```

Preview:

```bash
echo "$CHAT_WITH_FILE_RESPONSE" | head -c 1600
echo
```

---

## 19. Extract file IDs safely

If file response is JSON:

```bash
FILE_ID="$(
  FILE_DESCRIPTOR_RESPONSE="$FILE_DESCRIPTOR_RESPONSE" node -e '
    const json = JSON.parse(process.env.FILE_DESCRIPTOR_RESPONSE || "{}");
    const id =
      json.fileId ||
      json.id ||
      json?.file?.fileId ||
      json?.data?.fileId ||
      "";
    process.stdout.write(id);
  '
)"

FILE_HASH="$(
  FILE_DESCRIPTOR_RESPONSE="$FILE_DESCRIPTOR_RESPONSE" node -e '
    const json = JSON.parse(process.env.FILE_DESCRIPTOR_RESPONSE || "{}");
    const hash =
      json.fileHash ||
      json.contentHash ||
      json?.file?.fileHash ||
      json?.data?.fileHash ||
      "";
    process.stdout.write(hash);
  '
)"
```

Safe check:

```bash
test -n "$FILE_ID" && echo "fileId=SET" || echo "fileId=MISSING"
test -n "$FILE_HASH" && echo "fileHash=SET" || echo "fileHash=MISSING"
```

Do not print sensitive filenames in public logs if they reveal private content.

---

## 20. EVT / OPC / audit after file analysis

After chat with file reference, capture:

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

Keep this distinction. Routes are not vibes.

---

## 21. File workflow audit expectations

Audit should record:

```txt
route used
method
tenantId
workspaceId
operatorIprId
runtimeIprId
sessionId
fileId
fileHash
filePurpose
dataClass
rawTextPersistence=false
legalCertification=false
opcBoundary=technical proof receipt only
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
unapproved raw text
provider internals
cross-tenant metadata
```

---

## 22. File workflow OPC expectations

OPC may reference:

```txt
file hash
file ID
event ID
runtime route
timestamp
technical receipt scope
policy boundary
audit ID
```

OPC must not claim:

```txt
legal certification
notarial certification
public registry certification
qualified electronic signature
official identity validation
court-proof status by default
```

Canonical phrase:

```txt
OPC is a technical proof receipt only.
```

---

## 23. File workflow risk model

Main risks:

```txt
malicious file content
prompt injection
oversized input
private data leakage
secret exposure
tenant boundary violation
raw text persistence by accident
unbounded memory creation
ambiguous proof claims
incorrect event lookup path
quota exhaustion
```

Controls:

```txt
authentication required
tenant/workspace required
IPR session required
data class required
hash required
rawTextPersistence=false by default
legalCertification=false always explicit
OPC boundary explicit
prompt-injection scan/check
file size limits
MIME type restrictions
audit envelope
rate limit / quota
```

---

## 24. File size and type policy

Default pilot should define:

```txt
maxFileSizeBytes
allowedMimeTypes
allowedExtensions
maxFilesPerRequest
maxFilesPerDay
maxExtractedTextChars
retention period
raw text persistence mode
```

Recommended initial pilot posture:

```txt
allowedExtensions=.txt,.md,.json,.csv,.pdf
allowedMimeTypes=text/plain,text/markdown,application/json,text/csv,application/pdf
rawTextPersistence=false
maxFilesPerRequest=1
maxFilesPerDay=20
```

PDF note:

```txt
PDF files may require separate extraction mode. If clean text extraction is not available, classify as PDF_BINARY_HASH_ONLY or TEXT_EXTRACTION_REQUIRED.
```

---

## 25. PDF boundary

For PDFs:

```txt
PDF_BINARY_HASH_ONLY
TEXT_EXTRACTION_REQUIRED
HTML_TEXT_READY
TEXT_READY
TEXT_READY_FULL
```

should be clearly distinguished.

A PDF hash is not the same as extracted semantic text.

If only binary hash is available:

```txt
The runtime may verify file integrity, but should not claim full semantic analysis.
```

Correct boundary:

```txt
pdfContentMode=PDF_BINARY_HASH_ONLY
semanticTextReady=false
legalCertification=false
OPC=technical proof receipt only
```

---

## 26. Hash-only mode

Hash-only mode means:

```txt
The runtime registers or references the file by hash/metadata without persisting or using full raw text.
```

Use when:

```txt
file is sensitive
text extraction is unavailable
partner only needs file receipt
proof boundary must stay narrow
semantic analysis is not authorized
```

Hash-only mode can still generate:

```txt
fileId
fileHash
EVT
OPC
auditId
```

but must not claim:

```txt
semantic analysis completed
full document reviewed
legal certification produced
```

---

## 27. Full text mode

Full text mode means:

```txt
The runtime has clean readable text available for controlled analysis.
```

Permitted only when:

```txt
data class allows analysis
partner approved processing
text extraction is clean
prompt-injection check passed or is bounded
rawTextPersistence remains false unless explicitly approved
```

Possible status:

```txt
TEXT_READY
TEXT_READY_FULL
```

Even in full text mode:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 28. No-save guard

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

File analysis may still produce temporary runtime output and technical event traces according to policy.

---

## 29. Partner checklist before upload

Before file upload, confirm:

```txt
API key assigned
tenant/workspace active
IPR session created
file data class approved
file does not contain secrets
file does not contain unapproved personal data
file size within limit
MIME type allowed
hash calculated
rawTextPersistence=false
legalCertification=false
OPC boundary understood
prompt-injection risk accepted
```

If any item fails:

```txt
do not upload
```

That is the workflow. Revolutionary stuff: stop before doing the wrong thing.

---

## 30. Partner checklist after upload

After upload, confirm:

```txt
fileId received
fileHash received
status clear
dataClass preserved
rawTextPersistence=false visible
legalCertification=false visible
technical proof receipt only visible
promptInjectionRisk present or documented
audit/event identifiers captured if produced
```

If identifiers are missing, the pilot can still continue only if the file response clearly states why.

---

## 31. Partner checklist after chat analysis

After chat with file reference, confirm:

```txt
answer returned
responseEvt captured
opcId captured if produced
auditId captured if produced
usageId captured if available
legalCertification=false visible
OPC boundary visible
rawTextPersistence=false preserved
file ID/hash referenced
```

Then lookup:

```txt
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

---

## 32. Rate limit and quota

File workflow must respect:

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
  "route": "/api/v1/files",
  "retryAfterSeconds": 60,
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only"
}
```

Do not retry aggressively after a `429`.

---

## 33. Security checklist alignment

Files workflow must align with:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
```

Security gates:

```txt
authentication required
tenant required
workspace required
IPR session required
file class required
secrets prohibited
raw text persistence disabled by default
prompt injection treated as hostile
audit boundary preserved
legalCertification=false
OPC technical proof only
```

Critical fail condition:

```txt
POST /api/v1/files accepts unauthenticated upload
```

If unauthenticated file upload returns success, stop the pilot.

---

## 34. Product positioning

Partner-facing message:

```txt
HBCE IPR Runtime API v1 files workflow allows controlled file input to be hashed, bounded, linked to an IPR session, used in governed AI execution and traced through EVT / OPC / audit envelopes while preserving rawTextPersistence=false and legalCertification=false by default.
```

Short version:

```txt
Files become controlled runtime inputs, not uncontrolled memory.
```

---

## 35. What this workflow is not

It is not:

```txt
public legal file certification
unrestricted document storage
unbounded AI memory ingestion
secret management
e-discovery service
court evidence authority
malware analysis sandbox by default
cross-tenant knowledge base
```

It is:

```txt
controlled file input for governed AI runtime evaluation
```

---

## 36. Minimal files workflow test

Minimal test sequence:

```txt
1. GET /api/v1/health
2. POST /api/v1/ipr/session
3. POST /api/v1/files
4. POST /api/v1/chat with file reference
5. GET /api/v1/events?eventId
6. GET /api/v1/opc/{opcId}
7. GET /api/v1/audit/{auditId}
```

Expected status:

```txt
pilot files workflow ready
legalCertification=false
technical proof receipt only
rawTextPersistence=false
```

---

## 37. Final files workflow verdict

```txt
HBCE IPR Runtime API v1 files workflow = pilot-ready
```

The file workflow is ready for controlled pilot documentation when used with assigned API key, tenant, workspace, IPR session, approved file class, quota policy and explicit proof boundary.

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false
