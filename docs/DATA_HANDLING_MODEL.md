# AI JOKER-C2 Data Handling Model

## Data Handling Model for MATRIX, CORPUS and APOKALYPSIS

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the data handling model of AI JOKER-C2.

AI JOKER-C2 is the identity-bound cognitive command runtime of the HERMETICUM B.C.E. ecosystem.

It connects three primary domains:

1. MATRIX
2. CORPUS ESOTEROLOGIA ERMETICA
3. APOKALYPSIS

The purpose of this model is to define how data, files, prompts, outputs, metadata, EVT records, logs, evidence, secrets and verification artifacts should be handled inside the runtime.

AI JOKER-C2 must treat data according to sensitivity, purpose, governance context and operational risk.

The system must not process data as generic payload.

It must classify, minimize, protect, reference, hash or reject data when necessary.

---

## 2. Core Data Formula

```txt
Data -> Classification -> Purpose -> Minimization -> Processing -> EVT -> Storage -> Verification -> Retention -> Review
```

Expanded:

```txt
No data without purpose.
No processing without classification.
No sensitive data without minimization.
No secret data in public output.
No file handling without safety boundary.
No EVT without payload minimization.
No verification without controlled disclosure.
```

Project formula:

```txt
MATRIX = operational infrastructure data
CORPUS ESOTEROLOGIA ERMETICA = editorial and conceptual data
APOKALYPSIS = historical-threshold analysis data
AI JOKER-C2 = governed cognitive runtime
```

---

## 3. Data Handling Principle

The central data handling principle is:

```txt
Process only what is necessary, expose only what is appropriate, store only what is justified, and verify without leaking protected content.
```

AI JOKER-C2 should preserve four constraints:

1. purpose limitation;
2. data minimization;
3. sensitivity-aware processing;
4. public/internal separation.

Data handling must support governance, not bypass it.

---

## 4. Data Classification Values

Use the following data classes.

| Class | Meaning | Default Handling |
|---|---|---|
| PUBLIC | Public or intentionally shareable information | May be summarized, referenced or included in outputs |
| INTERNAL | Internal project or repository information | Process with care and avoid unnecessary exposure |
| SENSITIVE | Information that may affect people, organizations, security or operations | Minimize, redact or reference only where possible |
| SECRET | Credentials, tokens, private keys or protected operational secrets | Do not store, expose, summarize or echo |
| UNSUPPORTED | File or data type that cannot be safely processed | Reject or process as inert metadata only |
| UNKNOWN | Sensitivity cannot be determined | Treat conservatively until classified |

Unknown data must not be treated as public by default.

---

## 5. PUBLIC Data

PUBLIC data includes:

- public repository documentation;
- public project descriptions;
- public GitHub files;
- public website text;
- public institutional material;
- public product descriptions;
- public technical documentation;
- public-facing README content;
- public-safe summaries.

Allowed handling:

- summarize;
- quote short excerpts when appropriate;
- restructure;
- classify;
- transform into documentation;
- include in EVT as metadata;
- reference in public outputs.

Restrictions:

- do not assume public data is accurate without verification;
- do not claim official endorsement unless explicitly proven;
- do not merge public data with sensitive private data in public outputs.

---

## 6. INTERNAL Data

INTERNAL data includes:

- repository planning notes;
- internal governance documents;
- unpublished documentation;
- draft project files;
- internal architectural reasoning;
- runtime metadata;
- non-secret operational notes;
- internal B2B or B2G drafts.

Allowed handling:

- process for the requested purpose;
- summarize;
- restructure;
- include in internal EVT metadata;
- reference in audit records;
- use for repository documentation.

Restrictions:

- do not expose internal content unnecessarily;
- do not publish without review;
- do not treat internal material as external certification;
- avoid storing full internal payloads when a summary or reference is enough.

---

## 7. SENSITIVE Data

SENSITIVE data includes:

- personal data;
- private communications;
- non-public institutional information;
- security-sensitive architecture;
- incident details;
- legal-sensitive material;
- compliance-sensitive documentation;
- critical infrastructure information;
- proprietary business information;
- operational logs;
- internal audit findings.

Allowed handling:

- classify;
- minimize;
- redact where possible;
- summarize only when necessary;
- reference or hash instead of storing full payload;
- require human oversight when high-impact;
- separate public and internal views;
- include only safe metadata in EVT.

Restrictions:

- do not expose in public outputs;
- do not store without purpose;
- do not log raw sensitive payloads;
- do not include unnecessary details in EVT;
- do not process as ordinary text;
- do not use in public demos without review.

---

## 8. SECRET Data

SECRET data includes:

- API keys;
- passwords;
- private keys;
- signing keys;
- deployment tokens;
- Redis tokens;
- database credentials;
- OAuth credentials;
- session secrets;
- webhook secrets;
- private certificates;
- recovery codes;
- personal authentication data.

Handling rule:

```txt
Secrets must never be committed, logged, echoed, stored in EVT payloads, exposed in frontend code or returned in API responses.
```

Required action when secrets appear:

| Situation | Action |
|---|---|
| Secret appears in prompt | Do not repeat it; advise rotation if exposed |
| Secret appears in file | Treat as secret exposure; avoid echoing |
| Secret appears in repository | Remove and rotate; history may remain compromised |
| Secret appears in logs | Treat logs as sensitive and rotate if needed |
| Secret appears in frontend | Remove immediately and rotate |
| Secret appears in EVT | Replace with redacted reference or hash |

Secrets belong in environment variables or secure secret managers.

They do not belong in repository files.

---

## 9. UNSUPPORTED Data

UNSUPPORTED data includes:

- unknown binary files;
- executable files;
- unsupported archive formats;
- encrypted files that cannot be inspected;
- files with unsafe or unclear structure;
- files too large to process safely;
- malformed payloads;
- content that cannot be safely decoded.

Default handling:

```txt
Reject or process as inert metadata only.
```

The runtime may record:

- filename;
- file type;
- file size;
- rejection reason;
- safety status;
- EVT reference, when relevant.

The runtime must not execute uploaded files.

---

## 10. UNKNOWN Data

UNKNOWN data is data whose sensitivity cannot be determined.

Default handling:

```txt
Treat as INTERNAL or SENSITIVE until classified.
```

UNKNOWN data should trigger:

- conservative processing;
- limited output;
- no public exposure;
- no unnecessary storage;
- human review when high-impact;
- fail-closed behavior in sensitive contexts.

Unknown data must not become public data automatically.

---

## 11. File Handling Model

AI JOKER-C2 may process files when the file type and purpose are safe.

Recommended safe file types:

```txt
.txt
.md
.json
.csv
```

Conditionally processable file types:

```txt
.ts
.tsx
.js
.jsx
.html
.css
.yaml
.yml
.xml
```

Unsupported or high-risk file types should be rejected or handled as inert metadata unless a safe parser and clear purpose exist.

File handling rules:

1. Do not execute uploaded files.
2. Do not trust filenames blindly.
3. Validate size and type.
4. Classify data sensitivity.
5. Avoid storing full payloads unnecessarily.
6. Avoid logging file content.
7. Use hashes or references for sensitive files.
8. State when visibility is partial.
9. Preserve project-domain metadata.
10. Apply policy and risk logic when relevant.

---

## 12. Partial Visibility Rule

AI JOKER-C2 must state partial visibility when it cannot fully inspect a file or dataset.

Partial visibility may occur when:

- file is truncated;
- file is too large;
- file cannot be parsed;
- only a snippet is available;
- only metadata is available;
- connected source is unavailable;
- upload failed;
- extraction failed;
- content is binary or encrypted.

Rule:

```txt
If visibility is partial, say so.
```

The system must not claim full knowledge of content it cannot see.

---

## 13. Payload Minimization

Payload minimization means storing or exposing only the data needed for the operation.

Recommended approach:

| Data Type | Preferred Handling |
|---|---|
| Public documentation | Store or reference normally |
| Internal document | Store summary or reference |
| Sensitive document | Store hash, reference or redacted summary |
| Secret | Do not store or echo |
| Large file | Store metadata and hash |
| Security-sensitive detail | Store governance decision, not harmful detail |
| Personal data | Minimize, redact or avoid |
| Editorial text | Store section reference and operation type |
| Repository file | Store path, commit reference and operation type |

EVT records should not become data dumps.

EVT records should prove the operation occurred without exposing unnecessary payloads.

---

## 14. Data and EVT

EVT means Event.

EVT records should include data metadata, not unnecessary raw payloads.

Recommended EVT data object:

```json
{
  "data": {
    "classification": "INTERNAL",
    "payload_mode": "REFERENCE_ONLY",
    "source_type": "REPOSITORY_FILE",
    "source_reference": "docs/DATA_HANDLING_MODEL.md",
    "hash_algorithm": "sha256",
    "content_hash": "sha256:example",
    "redaction_applied": false,
    "public_safe": true
  }
}
```

For sensitive data:

```json
{
  "data": {
    "classification": "SENSITIVE",
    "payload_mode": "HASH_ONLY",
    "source_type": "USER_FILE",
    "source_reference": "redacted",
    "hash_algorithm": "sha256",
    "content_hash": "sha256:example",
    "redaction_applied": true,
    "public_safe": false
  }
}
```

For secret data:

```json
{
  "data": {
    "classification": "SECRET",
    "payload_mode": "REDACTED",
    "source_type": "USER_INPUT",
    "source_reference": "redacted",
    "secret_detected": true,
    "public_safe": false,
    "required_action": "DO_NOT_ECHO_AND_ROTATE_IF_EXPOSED"
  }
}
```

---

## 15. Public and Internal Views

AI JOKER-C2 should distinguish public and internal views.

### Public View

Public view may include:

- event ID;
- timestamp;
- public project domain;
- context class;
- operation type;
- non-sensitive status;
- verification result;
- public-safe hash.

Public view must not include:

- secrets;
- private data;
- full sensitive payloads;
- private file contents;
- security-sensitive operational details;
- internal tokens;
- private keys;
- private audit notes.

### Internal View

Internal view may include richer metadata under controlled access.

Internal view may include:

- detailed risk class;
- human oversight state;
- policy references;
- redaction status;
- audit notes;
- internal file reference;
- incident reference;
- mitigation notes.

Even internal views should minimize sensitive payloads.

---

## 16. Logging Model

Logs must support diagnostics without becoming a data leak.

Recommended log fields:

- timestamp;
- route;
- event ID;
- project domain;
- context class;
- intent class;
- risk class;
- decision;
- operation type;
- safe error code;
- runtime state.

Do not log:

- API keys;
- tokens;
- passwords;
- private keys;
- raw secrets;
- sensitive personal data;
- full uploaded documents;
- harmful security payloads;
- private EVT payloads;
- stack traces in public responses.

Logging rule:

```txt
Log operational metadata, not protected content.
```

---

## 17. Secrets and Environment Variables

Required secret handling:

- use deployment environment variables;
- keep `.env.local` untracked;
- never commit private keys;
- never expose server secrets to frontend;
- rotate secrets after exposure;
- never print secrets in logs;
- never include secrets in EVT records.

Relevant variables may include:

```txt
OPENAI_API_KEY
JOKER_MODEL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
JOKER_SIGN_PRIVATE_KEY
JOKER_SIGN_PUBLIC_KEY
NEXT_PUBLIC_BASE_URL
```

Only public-safe values should use `NEXT_PUBLIC_`.

Private keys must stay server-side.

---

## 18. Data Handling by Project Domain

### 18.1 MATRIX

MATRIX data may include:

- institutional documentation;
- governance models;
- B2B documents;
- B2G documents;
- critical infrastructure notes;
- cybersecurity documentation;
- cloud and data governance notes;
- public-sector drafts.

Default handling:

- classify sensitivity;
- preserve auditability;
- use EVT for relevant operations;
- require review for public-sector or critical infrastructure contexts;
- avoid overclaiming certification.

### 18.2 CORPUS ESOTEROLOGIA ERMETICA

Corpus data may include:

- theoretical chapters;
- canonical glossary;
- volume maps;
- editorial notes;
- conceptual definitions;
- long-form manuscripts.

Default handling:

- preserve canonical terminology;
- preserve editorial continuity;
- distinguish internal theory from external claims;
- avoid presenting conceptual coherence as external certification.

### 18.3 APOKALYPSIS

APOKALYPSIS data may include:

- historical analysis;
- cultural-political-social analysis;
- threshold mapping;
- cognitive dislocation analysis;
- civilizational interpretation.

Default handling:

- maintain analytical framing;
- verify current factual claims before publication;
- avoid incitement, dehumanization or targeted abuse;
- require review for sensitive current political claims.

### 18.4 MULTI_DOMAIN

MULTI_DOMAIN data affects the whole ecosystem.

Default handling:

- preserve domain separation;
- include project-domain metadata;
- maintain documentation consistency;
- apply audit when strategic, compliance or security-relevant.

---

## 19. Data Handling by Context

| Context | Handling |
|---|---|
| IDENTITY | Minimize; expose only public-safe identity metadata |
| MATRIX | Classify operational and institutional sensitivity |
| CORPUS | Preserve canonical terms and editorial continuity |
| APOKALYPSIS | Verify current factual claims and avoid coercive use |
| DOCUMENTAL | Process only requested content; avoid unnecessary retention |
| TECHNICAL | Avoid secrets and unsafe code execution |
| GITHUB | Preserve repository hygiene; no secrets in commits |
| EDITORIAL | Preserve authorial and canonical structure |
| STRATEGIC | Avoid unsupported public claims |
| SECURITY | Keep defensive; avoid harmful operational detail |
| COMPLIANCE | Include non-certification statement |
| GOVERNANCE | Preserve policy, risk, oversight and EVT metadata |
| GENERAL | Handle according to ordinary safety and privacy rules |

---

## 20. Data Handling by Risk Class

| Risk Class | Data Handling |
|---|---|
| LOW | Standard processing; avoid unnecessary storage |
| MEDIUM | Minimize payload; audit when relevant |
| HIGH | Redact, reference, hash; require human oversight |
| CRITICAL | Escalate; process only under strict review |
| PROHIBITED | Block; avoid processing harmful payload |
| UNKNOWN | Treat conservatively as internal or sensitive |

Risk class affects how much data can be processed, stored or exposed.

---

## 21. Data Retention Model

AI JOKER-C2 should avoid unnecessary retention.

Suggested retention approach:

| Data Type | Suggested Retention |
|---|---|
| Public documentation | Repository retention |
| Governance documentation | Repository retention |
| EVT metadata | Append-only retention |
| Sensitive payloads | Avoid or minimize |
| Secret payloads | Do not retain |
| Temporary file content | Delete after processing when possible |
| Audit records | Retain according to project policy |
| Incident records | Retain for audit continuity |
| Evidence packs | Retain when intentionally generated |
| Logs | Retain only as needed and without secrets |

Retention rule:

```txt
Retain evidence, not unnecessary exposure.
```

---

## 22. Data Redaction Model

Redaction should be applied when data is sensitive, secret or unnecessary.

Redaction examples:

| Original Type | Redacted Form |
|---|---|
| API key | `[REDACTED_API_KEY]` |
| Password | `[REDACTED_PASSWORD]` |
| Private key | `[REDACTED_PRIVATE_KEY]` |
| Token | `[REDACTED_TOKEN]` |
| Personal identifier | `[REDACTED_PERSONAL_DATA]` |
| Sensitive infrastructure detail | `[REDACTED_INFRASTRUCTURE_DETAIL]` |
| Private document content | `[REDACTED_PRIVATE_CONTENT]` |

Redaction metadata should state that redaction occurred.

Example:

```json
{
  "redaction": {
    "applied": true,
    "reason": "Secret detected",
    "fields": [
      "OPENAI_API_KEY"
    ]
  }
}
```

---

## 23. Hash and Reference Model

When full content should not be stored, use hashes and references.

Recommended hash algorithm:

```txt
sha256
```

Recommended reference object:

```json
{
  "reference": {
    "type": "REPOSITORY_FILE",
    "path": "docs/DATA_HANDLING_MODEL.md",
    "commit": "pending",
    "hash_algorithm": "sha256",
    "hash": "sha256:example"
  }
}
```

For sensitive content:

```json
{
  "reference": {
    "type": "SENSITIVE_FILE",
    "path": "redacted",
    "hash_algorithm": "sha256",
    "hash": "sha256:example",
    "public_safe": false
  }
}
```

Hashing supports integrity.

It does not make sensitive data public-safe by itself.

---

## 24. API Data Handling

API routes must handle data safely.

Rules for API routes:

1. Validate input.
2. Limit request size.
3. Reject unsupported files.
4. Avoid executing input.
5. Avoid logging raw payloads.
6. Avoid returning secrets.
7. Avoid exposing stack traces.
8. Separate public and internal output.
9. Apply policy and risk logic.
10. Generate EVT metadata when relevant.
11. Preserve fail-closed behavior.
12. Return safe errors.

Relevant API routes may include:

```txt
/api/chat
/api/files
/api/evt
/api/evidence
/api/verify
/api/signature
/api/network
/api/federation
```

No API route should bypass data classification.

---

## 25. File Upload Data Handling

File upload should follow a conservative sequence.

```txt
Receive file
-> validate metadata
-> check size
-> check type
-> classify sensitivity
-> extract safe text if supported
-> reject or degrade if unsupported
-> process only requested scope
-> avoid unnecessary storage
-> generate EVT metadata if relevant
-> return safe output
```

If extraction fails:

```txt
Return safe error and do not invent content.
```

If file is too large:

```txt
Request smaller sections or process as metadata only.
```

If file contains secrets:

```txt
Do not echo secrets and advise rotation if exposed.
```

---

## 26. Data Breach and Exposure Handling

If sensitive or secret data is exposed:

1. stop further exposure;
2. classify the incident;
3. identify affected data;
4. remove public exposure where possible;
5. rotate exposed secrets;
6. review logs;
7. record incident;
8. update mitigation;
9. verify correction;
10. close incident with audit note.

Secret exposure rule:

```txt
A committed secret must be treated as compromised.
```

Removing it from the latest file is not enough.

Rotate it.

---

## 27. Compliance Orientation

This data handling model supports compliance-oriented workflows.

It does not certify compliance.

The model supports:

- data minimization;
- purpose limitation;
- auditability;
- traceability;
- security boundary;
- human oversight;
- incident reporting;
- evidence management;
- verification;
- public/internal separation.

The repository does not replace:

- legal review;
- data protection review;
- cybersecurity review;
- institutional authorization;
- regulatory assessment.

Compliance support is not compliance certification.

---

## 28. Data Handling Checklist

Before processing data, check:

- What is the purpose?
- What is the project domain?
- What is the context class?
- What is the data class?
- Is the data necessary?
- Is the data sensitive?
- Is the data secret?
- Can the data be redacted?
- Can a hash or reference replace full payload?
- Is public output safe?
- Is internal output controlled?
- Is human review required?
- Is an EVT required?
- Should the operation be audited?
- Should fail-closed activate?

---

## 29. Repository Hygiene Checklist

Before committing, check:

- no API keys;
- no passwords;
- no private keys;
- no deployment tokens;
- no `.env.local`;
- no sensitive logs;
- no private datasets;
- no unnecessary personal data;
- no raw incident payloads;
- no harmful security payloads;
- no unsupported binary artifacts;
- no misleading compliance claims.

Recommended commands:

```bash
git status
git diff --staged
```

Build check:

```bash
npm run build
```

---

## 30. Implementation Targets

Suggested implementation files:

```txt
lib/data-classifier.ts
lib/file-policy.ts
lib/safe-error.ts
lib/evt.ts
lib/evt-ledger.ts
lib/policy-engine.ts
lib/risk-engine.ts
app/api/files/route.ts
app/api/chat/route.ts
```

Suggested future data registry:

```txt
registry/data-handling-policy.json
```

Suggested TypeScript types:

```ts
export type DataClass =
  | "PUBLIC"
  | "INTERNAL"
  | "SENSITIVE"
  | "SECRET"
  | "UNSUPPORTED"
  | "UNKNOWN";

export type PayloadMode =
  | "FULL_TEXT"
  | "SUMMARY"
  | "REFERENCE_ONLY"
  | "HASH_ONLY"
  | "REDACTED"
  | "METADATA_ONLY"
  | "REJECTED";

export type DataHandlingRecord = {
  classification: DataClass;
  payloadMode: PayloadMode;
  sourceType: string;
  sourceReference?: string;
  hashAlgorithm?: "sha256";
  contentHash?: string;
  redactionApplied: boolean;
  publicSafe: boolean;
  reason: string;
};
```

---

## 31. Data Handling Invariants

The following invariants must remain stable:

1. Data must be classified before sensitive processing.
2. Secret data must not be echoed, logged or committed.
3. Sensitive data must be minimized.
4. Unsupported files must not be executed.
5. Unknown data must be treated conservatively.
6. Public and internal views must remain separated.
7. EVT records should avoid unnecessary raw payloads.
8. Hashing does not make sensitive data public-safe.
9. Partial visibility must be declared.
10. Project-domain metadata must be preserved.
11. MATRIX data may require institutional or security review.
12. CORPUS data requires canonical terminology continuity.
13. APOKALYPSIS data requires non-coercive analytical framing.
14. Compliance support is not compliance certification.
15. Data incidents must be recorded and mitigated.
16. A committed secret must be treated as compromised.
17. Human accountability must be preserved.

---

## 32. Final Data Formula

```txt
Data is not neutral payload.
Data is an operational condition.
```

Expanded:

```txt
Classify -> Minimize -> Process -> Redact -> Reference -> Trace -> Verify -> Retain or Delete
```

Project formula:

```txt
MATRIX = operational and institutional data.
CORPUS ESOTEROLOGIA ERMETICA = conceptual and editorial data.
APOKALYPSIS = historical-threshold analysis data.
AI JOKER-C2 = governed runtime data control.
```

Operational rule:

```txt
No data processing without classification, minimization and purpose.
```

---

## 33. Status

| Field | Value |
|---|---|
| Document | docs/DATA_HANDLING_MODEL.md |
| Status | Active data handling model |
| Project | AI JOKER-C2 |
| Ecosystem | HERMETICUM B.C.E. |
| Connected domains | MATRIX, CORPUS ESOTEROLOGIA ERMETICA, APOKALYPSIS |
| Data classes | PUBLIC, INTERNAL, SENSITIVE, SECRET, UNSUPPORTED, UNKNOWN |
| Payload modes | FULL_TEXT, SUMMARY, REFERENCE_ONLY, HASH_ONLY, REDACTED, METADATA_ONLY, REJECTED |
| Infrastructure | HBCE |
| Identity layer | IPR |
| Trace layer | EVT |
| Governance principle | Fail-closed |
| Security boundary | Defensive and non-offensive |
| Compliance status | Orientation only, not certification |
| Repository | hbce-ai-joker-c2 |
| Maintainer | HBCE Research |
| Organization | HERMETICUM B.C.E. S.r.l. |
| Territorial anchor | Torino, Italy, Europe |
| Year | 2026 |

