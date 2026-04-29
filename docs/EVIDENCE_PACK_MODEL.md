# AI JOKER-C2 Evidence Pack Model

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the Evidence Pack Model for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of an evidence pack is to collect, organize and export verifiable records related to AI-assisted operations.

An evidence pack may support:

- audit review;
- incident review;
- compliance-oriented documentation;
- EVT verification;
- runtime reconstruction;
- repository traceability;
- governance review;
- human oversight review;
- B2B and B2G evaluation;
- critical infrastructure documentation support.

An evidence pack does not create legal certification.

An evidence pack does not replace human, legal, cybersecurity, compliance or institutional review.

---

## 2. Evidence Pack Principle

The core principle is:

```txt
Evidence is not a claim.
Evidence is a structured set of records that can be reviewed.

Operational formula:

Identity -> EVT -> Hash -> Manifest -> Verification -> Audit -> Evidence Pack

Expanded:

Evidence Pack =
Runtime Identity + EVT Records + Hashes + Manifest + Verification Report + Audit Notes + Review Status

The evidence pack exists to make an operational sequence reconstructable.


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

The evidence pack model connects:

IPR identity;

EVT event trace;

ledger continuity;

hash integrity;

verification;

audit status;

human oversight;

incident review;

compliance orientation.


Evidence packs must preserve traceability without exposing unnecessary sensitive content.


---

4. Evidence Pack Definition

An evidence pack is a structured export containing records relevant to a defined review scope.

A review scope may be:

one runtime operation;

one incident;

one file-processing workflow;

one audit period;

one governance review;

one deployment review;

one repository release;

one B2B or B2G evaluation;

one critical infrastructure documentation workflow.


An evidence pack should answer:

1. What was reviewed?


2. Which identity was involved?


3. Which events were included?


4. Which hashes were generated?


5. Which records can be verified?


6. Which human review states apply?


7. Which audit status applies?


8. Which risks were identified?


9. Which limitations remain?


10. Which files, commits or records support the review?




---

5. Evidence Pack Contents

A complete evidence pack may include:

Component	Function

PACK_MANIFEST.json	Main evidence pack manifest
EVT_RECORDS.jsonl	Included event records
HASHES.json	Hashes of included artifacts
VERIFICATION_REPORT.md	Verification summary
AUDIT_NOTES.md	Audit notes and findings
RISK_REGISTER_EXTRACT.md	Related risk entries
INCIDENT_REPORT.md	Incident report, if applicable
HUMAN_OVERSIGHT.md	Review states and outcomes
DATA_HANDLING_SUMMARY.md	Data handling and sensitivity summary
COMPLIANCE_DISCLAIMER.md	Non-certification boundary
REPOSITORY_REFERENCE.md	Commit, branch and repository references


Not every pack must include every component.

The required contents depend on scope, sensitivity and review purpose.


---

6. Evidence Pack Manifest

The manifest is the central index of the evidence pack.

Minimal manifest:

{
  "pack_id": "PACK-20260429-0001",
  "pack_type": "GOVERNANCE_REVIEW",
  "created_at": "2026-04-29T15:30:00+02:00",
  "created_by": {
    "entity": "AI_JOKER",
    "ipr": "IPR-AI-0001",
    "runtime": "AI JOKER-C2",
    "core": "HBCE-CORE-v3"
  },
  "scope": {
    "title": "AI JOKER-C2 governance evidence pack",
    "description": "Evidence pack for review of selected AI-assisted runtime operations.",
    "period_start": "2026-04-29T00:00:00+02:00",
    "period_end": "2026-04-29T23:59:59+02:00"
  },
  "contents": [
    {
      "name": "EVT_RECORDS.jsonl",
      "type": "event_records",
      "hash": "sha256:example"
    },
    {
      "name": "VERIFICATION_REPORT.md",
      "type": "verification_report",
      "hash": "sha256:example"
    }
  ],
  "verification": {
    "status": "VERIFIABLE",
    "hash_algorithm": "sha256",
    "canonicalization": "deterministic-json"
  },
  "audit": {
    "status": "READY",
    "human_review": "RECOMMENDED"
  },
  "disclaimer": "This evidence pack supports review and audit preparation. It does not create legal or regulatory certification."
}


---

7. Evidence Pack Types

Suggested evidence pack types:

Type	Purpose

GOVERNANCE_REVIEW	Review governance, risk, policy and oversight
SECURITY_REVIEW	Review defensive security workflow
INCIDENT_REVIEW	Review an incident and its remediation
COMPLIANCE_ORIENTATION	Support compliance-oriented discussion
DEPLOYMENT_REVIEW	Review readiness before deployment
EVT_VERIFICATION	Verify selected EVT records
B2B_EVALUATION	Support enterprise evaluation
B2G_EVALUATION	Support public-sector evaluation
CRITICAL_INFRASTRUCTURE_REVIEW	Support documentation review for critical infrastructure contexts
RELEASE_REVIEW	Review repository release or milestone


Each pack type should preserve the non-certification boundary.


---

8. EVT Records

Evidence packs should include relevant EVT records.

EVT records may contain:

event identifier;

previous event reference;

entity;

IPR;

timestamp;

runtime state;

context class;

risk class;

governance decision;

human oversight state;

operation status;

hash;

verification status;

audit status.


Example EVT record:

{
  "evt": "EVT-20260429-153000-0001",
  "prev": "GENESIS",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T15:30:00+02:00",
  "context": {
    "class": "GOVERNANCE",
    "domain": "EVIDENCE_PACK",
    "sensitivity": "MEDIUM"
  },
  "governance": {
    "risk": "MEDIUM",
    "decision": "AUDIT",
    "human_oversight": "RECOMMENDED",
    "policy": "EVIDENCE_PACK_MODEL",
    "fail_closed": false
  },
  "operation": {
    "type": "EVIDENCE_PACK_CREATED",
    "status": "COMPLETED"
  },
  "trace": {
    "hash_algorithm": "sha256",
    "canonicalization": "deterministic-json",
    "hash": "sha256:example"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

EVT records should be minimized when they contain sensitive data.


---

9. Hash Model

Evidence packs should use hashes to support integrity checking.

Recommended algorithm:

sha256

Recommended canonicalization:

deterministic-json

Hashing rules:

1. Hash stable files and records.


2. Use deterministic serialization where possible.


3. Preserve exact file contents for hash reproducibility.


4. Avoid hashing secrets into public artifacts.


5. Hash references when full payloads are sensitive.


6. Include hashes in the pack manifest.


7. Do not treat hashes as legal authorization.



A hash proves consistency of a payload.

A hash does not prove that the payload was lawful, complete or properly authorized.


---

10. File Hash Register

Suggested hash register:

{
  "hash_algorithm": "sha256",
  "files": [
    {
      "path": "EVT_RECORDS.jsonl",
      "type": "event_records",
      "hash": "sha256:example"
    },
    {
      "path": "VERIFICATION_REPORT.md",
      "type": "verification_report",
      "hash": "sha256:example"
    },
    {
      "path": "AUDIT_NOTES.md",
      "type": "audit_notes",
      "hash": "sha256:example"
    }
  ]
}

The hash register should be included in the evidence pack.


---

11. Verification Report

The verification report should summarize whether included artifacts can be checked.

Suggested structure:

# Verification Report

## Pack ID
PACK-20260429-0001

## Verification Scope
Describe what was verified.

## Included EVT Records
List included EVT identifiers.

## Hash Verification
Describe which files were hashed and whether hashes match.

## Ledger Continuity
Describe whether previous event references are consistent.

## Missing Evidence
List missing records, incomplete fields or unverifiable artifacts.

## Verification Status
VERIFIABLE / PARTIAL / INVALID / UNVERIFIED

## Notes
Add limitations and review notes.

Verification status must not be exaggerated.

Partial evidence should be marked as partial.


---

12. Audit Notes

Audit notes should record review findings.

Suggested structure:

# Audit Notes

## Scope
Describe reviewed operations or files.

## Findings
List findings as PASS, PARTIAL, FAIL, NEEDS_REVIEW or BLOCKING.

## Governance Review
Describe identity, policy, risk, decision and oversight review.

## Security Review
Describe defensive security boundary and secret handling.

## Data Handling Review
Describe data classification and minimization.

## Dual-Use Review
Describe dual-use risk and mitigation.

## Required Actions
List remediation steps.

## Conclusion
State whether the evidence pack is ready for review, partial or insufficient.

Audit notes should be clear, conservative and evidence-based.


---

13. Human Oversight Record

Evidence packs may include a human oversight record.

Suggested fields:

{
  "human_oversight": {
    "state": "RECOMMENDED",
    "required_role": "REVIEWER",
    "review_status": "PENDING",
    "final_authority": "HUMAN_OPERATOR",
    "notes": "Evidence pack requires human review before institutional use."
  }
}

For completed review:

{
  "human_oversight": {
    "state": "COMPLETED",
    "reviewer_role": "AUDITOR",
    "review_result": "APPROVED_WITH_LIMITATIONS",
    "review_note": "Evidence pack approved for documentation review only."
  }
}

Oversight records should avoid unnecessary personal data.

Role-based references are preferred unless identity is required by deployment context.


---

14. Risk Register Extract

Evidence packs may include related risk entries.

Example:

{
  "risk_id": "RISK-AI-001",
  "title": "AI output used without review",
  "domain": "AI Governance",
  "context_class": "AI_GOVERNANCE",
  "risk_class": "HIGH",
  "decision": "ESCALATE",
  "human_oversight": "REQUIRED",
  "mitigation": "Require human review before operational use.",
  "evt_required": true,
  "audit_status": "REQUIRED",
  "status": "OPEN"
}

Risk entries help reviewers understand why evidence was collected.


---

15. Incident Linkage

If an evidence pack relates to an incident, it should include:

incident ID;

incident class;

severity;

status;

affected component;

evidence references;

EVT linkage;

mitigation actions;

closure status.


Example:

{
  "incident": {
    "incident_id": "INC-20260429-0001",
    "class": "OVERSIGHT_INCIDENT",
    "severity": "HIGH",
    "status": "UNDER_REVIEW",
    "related_evt": "EVT-20260429-230000-0001"
  }
}

Incident evidence must preserve sensitive data boundaries.


---

16. Repository Reference

Evidence packs should include repository context when relevant.

Suggested fields:

{
  "repository": {
    "name": "hbce-ai-joker-c2",
    "branch": "main",
    "commit": "commit-hash-here",
    "remote": "https://github.com/manuelcoletta1-source/hbce-ai-joker-c2",
    "reviewed_files": [
      "README.md",
      "GOVERNANCE.md",
      "EVT_PROTOCOL.md",
      "docs/EVIDENCE_PACK_MODEL.md"
    ]
  }
}

Repository references help connect evidence to a specific code and documentation state.


---

17. Pack Folder Structure

Recommended evidence pack structure:

evidence/
└── PACK-20260429-0001/
    ├── PACK_MANIFEST.json
    ├── EVT_RECORDS.jsonl
    ├── HASHES.json
    ├── VERIFICATION_REPORT.md
    ├── AUDIT_NOTES.md
    ├── RISK_REGISTER_EXTRACT.md
    ├── HUMAN_OVERSIGHT.md
    ├── DATA_HANDLING_SUMMARY.md
    ├── INCIDENT_REPORT.md
    ├── REPOSITORY_REFERENCE.md
    └── COMPLIANCE_DISCLAIMER.md

The folder name should match the pack_id.


---

18. Public and Internal Evidence Packs

AI JOKER-C2 may support two evidence pack modes.

Mode	Description

Public evidence pack	Minimal safe metadata for public demonstration or external presentation
Internal evidence pack	Richer controlled records for authorized review


Public evidence packs should not contain:

secrets;

credentials;

personal data;

confidential payloads;

security-sensitive logs;

critical infrastructure topology;

private file contents;

internal tokens;

unredacted incident records.


Internal evidence packs may include richer content under controlled access.


---

19. Data Handling Requirements

Evidence packs must follow the data handling model.

Rules:

1. Minimize sensitive content.


2. Avoid secrets.


3. Avoid unnecessary personal data.


4. Use references and hashes where possible.


5. Separate public and internal views.


6. Redact sensitive operational details.


7. Mark incomplete evidence clearly.


8. Preserve review and audit status.


9. Do not expose protected files unnecessarily.


10. Use incident reporting if data exposure occurs.



Evidence packs should support review without creating new exposure.


---

20. Evidence Pack Status

Suggested pack statuses:

Status	Meaning

DRAFT	Pack is being prepared
READY	Pack is ready for review
PARTIAL	Pack is incomplete but useful
UNDER_REVIEW	Pack is under human review
VERIFIED	Technical verification completed
REJECTED	Pack rejected by reviewer
SUPERSEDED	Pack replaced by a newer pack
LOCKED	Pack closed against mutation
ARCHIVED	Pack retained for record


Pack status should be explicit.


---

21. Verification Status

Suggested verification statuses:

Status	Meaning

VERIFIABLE	Sufficient data for verification
PARTIAL	Some evidence is incomplete
INVALID	Verification failed
UNVERIFIED	Not yet verified
ANCHORED	Externally anchored
SUPERSEDED	Replaced by later evidence
DISPUTED	Evidence is contested


Verification is technical.

Audit is review.

Certification is external and not provided by this repository.


---

22. Evidence Pack Creation Workflow

Recommended workflow:

Define review scope
Select EVT records
Collect supporting artifacts
Classify data sensitivity
Minimize sensitive content
Generate hashes
Create PACK_MANIFEST.json
Create verification report
Add audit notes
Add risk and oversight records
Add incident linkage if applicable
Add repository reference
Review for secrets
Set pack status
Store or export evidence pack

Evidence pack creation should be controlled and repeatable.


---

23. Evidence Pack Review Checklist

Before sharing or relying on an evidence pack, check:

Is the pack scope defined?
Is the pack ID unique?
Is runtime identity included?
Are EVT records included?
Are hashes included?
Can hashes be recomputed?
Is ledger continuity preserved?
Is verification status clear?
Is audit status clear?
Is human oversight status clear?
Are risks linked?
Are incidents linked if applicable?
Are secrets excluded?
Is personal data minimized?
Is sensitive content redacted?
Is public/internal separation preserved?
Is the compliance disclaimer included?


---

24. Evidence Pack Security Checklist

Before export, check:

Does the pack contain API keys?
Does the pack contain tokens?
Does the pack contain private keys?
Does the pack contain passwords?
Does the pack contain personal data?
Does the pack contain confidential files?
Does the pack expose security-sensitive logs?
Does the pack expose infrastructure topology?
Does the pack include raw incident payloads?
Should any artifact be replaced by a reference or hash?

If any secret is present, stop export and create an incident report.


---

25. Evidence Pack and Fail-Closed

Evidence pack generation should fail closed when:

secrets are detected;

data sensitivity is unknown and high-impact;

required EVT records are missing;

verification cannot be performed where required;

public and internal views cannot be separated;

incident scope is unclear;

human oversight is required but absent;

hash generation fails;

manifest generation fails;

evidence integrity is uncertain.


Fail-closed evidence rule:

If evidence cannot be safely packaged, do not export it as audit-ready.


---

26. Evidence Pack Maturity Levels

Level	Description

E0	No evidence pack model
E1	Evidence pack model documented
E2	Manifest structure defined
E3	EVT records linked
E4	Hash register included
E5	Verification report included
E6	Audit notes included
E7	Evidence pack generation implemented
E8	Evidence pack verification implemented
E9	External review possible


AI JOKER-C2 should evolve from documented evidence packs to executable evidence generation.


---

27. Implementation Targets

Suggested future files:

lib/evidence-pack.ts
lib/evidence-manifest.ts
lib/evt.ts
lib/evt-hash.ts
lib/evt-verify.ts
lib/data-classifier.ts
app/api/evidence/route.ts
evidence/PACK_MANIFEST.example.json

Suggested future types:

export type EvidencePackStatus =
  | "DRAFT"
  | "READY"
  | "PARTIAL"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUPERSEDED"
  | "LOCKED"
  | "ARCHIVED";

export type EvidencePackType =
  | "GOVERNANCE_REVIEW"
  | "SECURITY_REVIEW"
  | "INCIDENT_REVIEW"
  | "COMPLIANCE_ORIENTATION"
  | "DEPLOYMENT_REVIEW"
  | "EVT_VERIFICATION"
  | "B2B_EVALUATION"
  | "B2G_EVALUATION"
  | "CRITICAL_INFRASTRUCTURE_REVIEW"
  | "RELEASE_REVIEW";

export type EvidencePackMode =
  | "PUBLIC"
  | "INTERNAL";


---

28. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

An evidence pack supports review, reconstruction and audit preparation.

An evidence pack does not create legal, regulatory, cybersecurity, AI governance, public-sector, financial, medical or critical infrastructure certification.

Any real-world use requires review by authorized professionals and responsible organizations.

Evidence supports accountability.

It does not replace authority.


---

29. Final Evidence Pack Formula

Evidence without structure becomes archive noise.
Evidence with identity, EVT, hash, manifest, verification and audit notes becomes reconstructable governance.

Operational formula:

Evidence Pack =
Scope + Identity + EVT Records + Hashes + Manifest + Verification Report + Audit Notes + Disclaimer


---

30. Status

Document status: active evidence pack model
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

