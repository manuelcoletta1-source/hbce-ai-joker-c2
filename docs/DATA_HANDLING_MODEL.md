# AI JOKER-C2 Data Handling Model

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the data handling model for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this model is to define how data, files, prompts, outputs, logs, evidence, EVT records and sensitive information should be handled across the runtime.

The model supports:

- data minimization;
- file safety;
- secret protection;
- payload control;
- public and internal separation;
- EVT traceability;
- auditability;
- human oversight;
- defensive security;
- fail-closed governance.

This document is a governance and technical model.

It does not create legal certification.

It does not replace data protection, legal, cybersecurity or organizational review.

---

## 2. Core Principle

The core principle is:

```txt
Process only what is necessary.
Expose only what is safe.
Record only what is useful for governance.

Expanded:

Data Handling = Classification + Minimization + Protection + Traceability + Review

Operational formula:

Identity -> Data Class -> Purpose -> Policy -> Risk -> Processing -> EVT -> Verification -> Retention

AI JOKER-C2 must not become an uncontrolled data sink.


---

3. Strategic Architecture

AI JOKER-C2 operates inside the following architecture:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

Data handling must preserve the same governance structure:

Identity -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

Data handling is not a secondary technical detail.

It is part of the operational legitimacy of the runtime.


---

4. Data Handling Scope

This model applies to:

user messages;

uploaded files;

file metadata;

extracted text;

generated outputs;

prompts sent to model providers;

runtime diagnostics;

API request and response bodies;

logs;

EVT records;

ledger records;

evidence packs;

verification records;

audit notes;

incident reports;

risk register entries;

repository documents.


Every data object should have a purpose, a classification and a handling rule.


---

5. Data Classification

AI JOKER-C2 uses the following data classes.

Data Class	Meaning	Default Handling

PUBLIC	Information intended for public use	May be processed normally
INTERNAL	Organizational or project-internal information	Process with care
CONFIDENTIAL	Sensitive business, institutional or technical information	Restrict, minimize and review
SECRET	Credentials, private keys, tokens or highly restricted data	Do not process as ordinary content
PERSONAL	Data relating to an identifiable person	Minimize and verify lawful basis
SECURITY_SENSITIVE	Security, infrastructure, logs, incident or defensive data	Minimize, summarize or reference
CRITICAL_OPERATIONAL	Data related to critical systems, continuity or infrastructure	Strict review, minimization and escalation
UNKNOWN	Data whose sensitivity is unclear	Treat conservatively


Unknown sensitivity must not be treated as safe.


---

6. Data Handling Table

Data Class	Store Full Content	Use in Prompt	Include in EVT	Public Output	Review Required

PUBLIC	Allowed	Allowed	Allowed if relevant	Allowed	Usually no
INTERNAL	Limited	Allowed with care	Summary or reference	Avoid unless intended	Recommended
CONFIDENTIAL	Avoid	Minimize	Reference or hash	No	Required
SECRET	No	No	Metadata only if necessary	No	Required
PERSONAL	Minimize	Minimize	Reference or redacted summary	No unless authorized	Required
SECURITY_SENSITIVE	Minimize	Summarize	Reference, hash or summary	No	Required
CRITICAL_OPERATIONAL	Avoid full storage	Summarize only	Reference or hash	No	Required or escalated
UNKNOWN	No by default	Avoid or summarize	Metadata only	No	Required


The safest default is minimization.


---

7. Data Minimization Rules

AI JOKER-C2 should follow these minimization rules.

1. Do not process unnecessary data.


2. Do not store unnecessary payloads.


3. Do not log full sensitive content.


4. Do not include secrets in prompts.


5. Do not expose confidential content in public outputs.


6. Do not include raw sensitive payloads in EVT records unless strictly required.


7. Prefer summaries over full text for sensitive content.


8. Prefer references over embedded payloads.


9. Prefer hashes over copied sensitive content.


10. Treat unknown sensitivity conservatively.



Minimal data is safer, easier to audit and easier to govern.


---

8. Secret Handling

Secrets must never be treated as ordinary text.

Secrets include:

API keys;

OpenAI API keys;

deployment tokens;

private keys;

session secrets;

OAuth secrets;

database credentials;

webhook secrets;

signing keys;

passwords;

recovery codes;

access tokens.


Secret handling rules:

Do not commit secrets.
Do not log secrets.
Do not send secrets to model providers.
Do not store secrets in EVT payloads.
Do not expose secrets in public output.
Do not treat leaked secrets as still valid.

If a secret is exposed:

1. stop using it;


2. revoke it;


3. rotate it;


4. remove it from active code;


5. review logs and repository history;


6. create an incident report;


7. record remediation where appropriate.



A leaked secret must be treated as compromised.


---

9. Environment Variables

Environment variables must be handled securely.

Required variable:

OPENAI_API_KEY

Optional variable:

JOKER_MODEL

Recommended local file:

.env.local

Rules:

.env.local must not be committed;

environment values must not be printed in logs;

environment values must not be exposed to the client;

missing environment variables should trigger safe degraded behavior;

deployment secrets should be stored in the deployment provider secret manager.


The runtime must never expose OPENAI_API_KEY through API responses, UI components or diagnostics.


---

10. File Handling Model

Uploaded files must be treated as user-provided context.

Recommended safe file types:

.txt
.md
.json
.csv

File handling rules:

1. Do not execute uploaded files.


2. Do not trust file names blindly.


3. Do not assume file content is complete.


4. Do not expose file content in logs.


5. Do not store full sensitive files unnecessarily.


6. Validate file type where possible.


7. Validate file size where possible.


8. Reject unsupported or unsafe files.


9. State clearly when file visibility is partial.


10. Preserve user control over uploaded content.



Binary, executable or unknown files should be rejected or handled only as inert metadata unless a safe parser is explicitly implemented.


---

11. File Metadata

File metadata may include:

file name;

file type;

file size;

upload timestamp;

extraction status;

content hash;

session reference;

sensitivity class;

processing status.


File metadata should not include unnecessary private content.

Example safe metadata object:

{
  "file_id": "FILE-20260429-0001",
  "name": "example.md",
  "type": "text/markdown",
  "size_bytes": 12000,
  "data_class": "INTERNAL",
  "processing_status": "TEXT_EXTRACTED",
  "hash_algorithm": "sha256",
  "content_hash": "sha256:example"
}

Metadata supports traceability without overexposure.


---

12. Prompt Handling

Prompts sent to model providers should be minimized.

Prompt handling rules:

1. Send only necessary context.


2. Remove secrets before model calls.


3. Avoid personal data unless required and lawful.


4. Avoid unnecessary confidential material.


5. Summarize sensitive content when possible.


6. Use references instead of full payloads where possible.


7. Preserve user intent without overexposing data.


8. Do not include hidden credentials, keys or tokens.


9. Do not use model prompts as permanent storage.


10. Treat model output as untrusted until governed.



The model should receive enough context to assist, not every available piece of data.


---

13. Output Handling

Generated outputs should be reviewed according to risk and context.

Output handling rules:

mark sensitive outputs as drafts where appropriate;

require human review for high-impact outputs;

avoid exposing confidential inputs;

avoid reproducing secrets;

avoid fabricating evidence;

avoid claiming verification that was not performed;

distinguish support material from final authority;

disclose uncertainty when evidence is incomplete;

avoid turning internal material into public content unless intended.


Recommended labels:

Status: AI-assisted draft.
Human review required before operational use.

Status: support material.
Final authority remains with the responsible human office or organization.

Status: defensive security support only.
Review before applying to real systems.


---

14. Logging Model

Logs should support debugging, security review and audit without exposing sensitive content.

Do not log:

API keys;

passwords;

access tokens;

private keys;

full confidential documents;

full personal data;

full incident payloads;

raw authorization headers;

sensitive infrastructure details;

unsupported file contents.


Logs may include:

timestamp;

route;

operation type;

context class;

risk class;

decision;

generic error code;

EVT identifier;

verification status;

processing status.


Example safe log entry:

{
  "timestamp": "2026-04-29T15:30:00+02:00",
  "route": "/api/chat",
  "context_class": "GITHUB",
  "risk": "LOW",
  "decision": "ALLOW",
  "evt": "EVT-20260429-153000-0001",
  "status": "COMPLETED"
}

Logs should be useful, minimal and safe.


---

15. EVT Data Handling

EVT records should preserve traceability without becoming data dumps.

An EVT may include:

event identifier;

previous event reference;

entity;

IPR;

timestamp;

runtime state;

context class;

risk class;

governance decision;

operation status;

hash;

verification status;

audit status.


An EVT should avoid:

raw secrets;

full confidential documents;

unnecessary personal data;

sensitive infrastructure details;

full security logs;

private payloads that are not required for audit.


Preferred EVT content strategy:

Data Type	EVT Handling

Ordinary operation	Store summary and metadata
Sensitive content	Store reference or hash
Secret	Do not store content
Personal data	Redact or minimize
Security incident	Store summary, reference and sensitivity
File	Store metadata and content hash
Critical infrastructure data	Store limited metadata and review status


EVT proves that an operation happened.

It does not need to expose every payload.


---

16. Public and Internal EVT Views

AI JOKER-C2 may support two EVT visibility modes.

Mode	Description

Public EVT	Minimal event metadata safe for public demonstration
Internal EVT	Full controlled event metadata for authorized review


Public EVT should include:

event identifier;

timestamp;

context class;

decision;

risk class if safe;

operation status;

verification status.


Public EVT should not include:

personal data;

secrets;

confidential payloads;

security-sensitive details;

critical infrastructure topology;

internal tokens;

private file contents.


Internal EVT may contain richer metadata under controlled access.


---

17. Ledger Data Handling

The ledger preserves continuity.

Ledger rules:

1. Store only necessary event data.


2. Preserve event order.


3. Preserve previous event references.


4. Avoid silent mutation.


5. Use correction events instead of rewriting.


6. Separate public and internal views.


7. Avoid storing sensitive payloads directly.


8. Use hashes and references where possible.


9. Preserve verification status.


10. Preserve audit status.



Ledger data should be append-oriented.

Historical records should not be silently rewritten.


---

18. Evidence Pack Data Handling

Future evidence packs may include:

EVT records;

event hashes;

verification report;

audit notes;

manifest;

runtime metadata;

repository commit reference;

correction events;

incident report references.


Evidence packs should not include:

raw secrets;

excessive personal data;

unnecessary confidential content;

sensitive infrastructure topology;

unredacted private documents;

credentials or tokens.


Evidence packs should be designed for review, not uncontrolled disclosure.


---

19. Data Retention Model

Retention must be defined by deployment context.

Suggested retention categories:

Category	Suggested Handling

Public documentation	Retain in repository
Runtime diagnostics	Retain only as needed
Sensitive prompts	Avoid storage where possible
Uploaded files	Temporary unless explicit retention is required
EVT records	Retain according to audit requirements
Ledger records	Retain according to governance requirements
Incident records	Retain according to security and legal requirements
Evidence packs	Retain under controlled access
Logs	Retain minimally and rotate
Secrets	Do not retain in logs or content stores


Retention should be intentional.

No data should be retained merely because it passed through the system.


---

20. Data Deletion and Correction

Data deletion and correction must preserve audit logic.

If non-sensitive transient data is no longer needed, it may be deleted according to retention policy.

If an audit-relevant event is incorrect, do not silently rewrite history.

Use correction events.

Correction example:

{
  "evt": "EVT-20260429-231000-0002",
  "prev": "EVT-20260429-230000-0001",
  "operation": {
    "type": "DATA_HANDLING_CORRECTION",
    "corrects": "EVT-20260429-230000-0001",
    "reason": "Incorrect data sensitivity classification"
  },
  "governance": {
    "risk": "MEDIUM",
    "decision": "AUDIT",
    "human_oversight": "REQUIRED"
  }
}

Correction is not erasure.

Correction is a new trace.


---

21. Data Handling Risk Matrix

Risk	Default Class	Default Decision

Secret included in prompt	CRITICAL	BLOCK
Confidential file uploaded	HIGH	AUDIT or ESCALATE
Personal data processed unnecessarily	HIGH	ESCALATE
Sensitive content logged	HIGH	ESCALATE
Unsupported file treated as verified	MEDIUM	AUDIT
Unknown data sensitivity	HIGH	ESCALATE
Public and internal EVT not separated	HIGH	ESCALATE
Raw critical infrastructure details exposed	CRITICAL	BLOCK or ESCALATE
Security-sensitive logs overexposed	HIGH	DEGRADE or ESCALATE
File visibility incomplete but not disclosed	MEDIUM	AUDIT


Unknown data sensitivity should be treated conservatively.


---

22. Human Oversight for Data Handling

Human review should be required when data involves:

personal data;

confidential data;

secrets;

security-sensitive logs;

public-sector records;

procurement material;

critical infrastructure;

medical or health-related data;

financial data;

legal-sensitive data;

incident records.


Suggested oversight states:

Data Context	Default Oversight

Public content	NOT_REQUIRED
Internal content	RECOMMENDED
Confidential content	REQUIRED
Personal data	REQUIRED
Secret data	BLOCKED or ESCALATED
Security-sensitive content	REQUIRED
Critical operational content	REQUIRED or ESCALATED
Unknown content	REQUIRED



---

23. Fail-Closed Data Handling

Fail-closed behavior should activate when:

data class is unknown in a sensitive context;

secrets appear in input;

unsupported file type is uploaded;

sensitive content may be logged;

confidential content may be exposed;

personal data is unnecessary;

critical operational data appears without review;

data minimization cannot be applied;

EVT cannot safely represent the event;

public and internal views cannot be separated.


Fail-closed data rule:

If data sensitivity is unclear and impact may be significant, do not process as ordinary content.


---

24. API Data Handling

API routes must handle data conservatively.

Primary API routes may include:

/api/chat
/api/files
/api/verify
/api/evidence

API data rules:

1. Validate request size.


2. Validate request shape.


3. Avoid exposing stack traces.


4. Avoid returning secrets.


5. Avoid logging full payloads.


6. Reject unsafe files.


7. Avoid unrestricted upload processing.


8. Preserve governance metadata where relevant.


9. Return safe error messages.


10. Trigger fail-closed behavior for sensitive uncertainty.



APIs are data entry points.

They must not bypass governance.


---

25. Model Provider Data Handling

When using an external model provider:

do not send secrets;

minimize personal data;

minimize confidential content;

summarize sensitive files where possible;

avoid sending raw incident logs unless necessary and authorized;

avoid sending critical operational details without review;

preserve user awareness of data flow;

avoid treating provider response as verified truth;

classify outputs by risk before operational use.


The model provider is part of the data flow.

It must be considered in deployment review.


---

26. Data Handling Checklist

Before processing data, check:

Is the data necessary?
What is the data class?
Is the sensitivity known?
Does it include secrets?
Does it include personal data?
Does it include confidential material?
Does it include security-sensitive content?
Does it include critical operational information?
Can it be summarized instead of fully processed?
Can it be referenced instead of copied?
Should it be hashed?
Is human review required?
Is EVT required?
Can public and internal views be separated?
Should processing be blocked, degraded or escalated?


---

27. File Handling Checklist

Before processing a file, check:

Is the file type supported?
Is the file size acceptable?
Is the file content readable?
Is file visibility complete or partial?
Is the file sensitive?
Does the file include secrets?
Does the file include personal data?
Does the file include confidential content?
Can the content be summarized?
Should only metadata be retained?
Should a content hash be generated?
Should human review be required?
Should an EVT be generated?


---

28. Logging Checklist

Before logging, check:

Does the log contain secrets?
Does the log contain personal data?
Does the log contain confidential content?
Does the log contain sensitive infrastructure details?
Is the full payload necessary?
Can this be replaced by an EVT identifier?
Can this be replaced by a summary?
Can this be replaced by a hash?
Is the log safe for the deployment environment?


---

29. Public Output Checklist

Before producing public output, check:

Does the output reveal confidential content?
Does the output reveal personal data?
Does the output reveal secrets?
Does the output expose security-sensitive details?
Does the output expose critical operational details?
Is the output intended for public use?
Is human review required?
Is uncertainty disclosed?
Is the output clearly marked as draft where needed?


---

30. Data Incident Triggers

Create an incident report when:

a secret is exposed;

confidential data is exposed publicly;

personal data is processed unnecessarily;

sensitive file content is logged;

unsupported file content is treated as verified;

critical operational data is exposed;

public and internal EVT views are mixed;

data minimization fails in a sensitive context;

model prompts include restricted content without review;

user data is retained without purpose.


Use:

docs/INCIDENT_REPORT_TEMPLATE.md


---

31. Implementation Targets

Suggested files:

docs/DATA_HANDLING_MODEL.md
lib/data-classifier.ts
lib/file-policy.ts
lib/redaction.ts
lib/evt.ts
lib/runtime-decision.ts
app/api/files/route.ts

Suggested future types:

export type DataClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SECRET"
  | "PERSONAL"
  | "SECURITY_SENSITIVE"
  | "CRITICAL_OPERATIONAL"
  | "UNKNOWN";

export type DataHandlingDecision =
  | "PROCESS"
  | "MINIMIZE"
  | "REDACT"
  | "REFERENCE_ONLY"
  | "HASH_ONLY"
  | "ESCALATE"
  | "BLOCK";

export type FileProcessingStatus =
  | "NOT_PROCESSED"
  | "TEXT_EXTRACTED"
  | "PARTIAL"
  | "UNSUPPORTED"
  | "REJECTED"
  | "FAILED";


---

32. Data Handling Maturity Levels

Level	Description

D0	No data handling model
D1	Data classes documented
D2	File handling rules documented
D3	Secret handling documented
D4	EVT data minimization documented
D5	Data classifier implemented
D6	Redaction and reference model implemented
D7	Public and internal EVT views implemented
D8	Data handling connected to audit and incident workflow


AI JOKER-C2 should move from documented data handling to executable data governance.


---

33. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This data handling model does not create legal, regulatory, cybersecurity, data protection, public-sector, financial, medical or critical infrastructure certification.

Any real-world deployment requires proper review by authorized professionals and responsible organizations.

Data protection obligations depend on deployment context, jurisdiction, data type and processing purpose.


---

34. Final Data Handling Formula

Data without classification becomes exposure.
Data with purpose, minimization, protection, EVT and review becomes governable.

Operational formula:

Data Governance =
Classification + Purpose + Minimization + Protection + EVT + Review + Retention


---

35. Status

Document status: active data handling model
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Business orientation: B2B, B2G, institutional, AI governance, defensive security and critical infrastructure
Compliance status: orientation only, not certification
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

