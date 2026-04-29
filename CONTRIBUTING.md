# Contributing to AI JOKER-C2

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

Thank you for your interest in contributing to AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

This repository is not a generic chatbot project.

It is a governed runtime for:

- identity-bound AI operations;
- policy-aware execution;
- risk classification;
- EVT event generation;
- auditability;
- verification;
- operational continuity;
- fail-closed governance;
- civil and strategic dual-use environments;
- defensive and non-offensive use cases.

Contributions must preserve this identity.

---

## 2. Contribution Principle

Every contribution should strengthen at least one of the following:

- governance;
- safety;
- security;
- traceability;
- verification;
- auditability;
- code clarity;
- documentation quality;
- fail-closed behavior;
- defensive resilience;
- B2B or B2G readiness;
- compliance-oriented structure.

A contribution must not weaken the identity-bound, non-offensive and fail-closed nature of the project.

The core rule is:

```txt
Contribute only if the change makes AI JOKER-C2 more governable, more traceable, more secure or more useful.


---

3. Project Architecture Reference

Contributors should understand the core architecture before making changes.

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

Operational sequence:

Identity -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

All contributions must remain consistent with this sequence.


---

4. Required Reading

Before contributing, read the following documents:

README.md
ARCHITECTURE.md
GOVERNANCE.md
EVT_PROTOCOL.md
DUAL_USE_STRATEGIC_POSITIONING.md
SECURITY.md
COMPLIANCE.md
ROADMAP.md

These files define the operating perimeter of the repository.

Do not submit changes that contradict them.

If a change requires updating one of these documents, update the relevant document together with the code change.


---

5. Allowed Contributions

Allowed contributions include:

bug fixes;

documentation improvements;

safe refactoring;

runtime stability improvements;

interface improvements;

policy engine implementation;

risk classifier implementation;

EVT generation logic;

append-only ledger logic;

verifier endpoint logic;

evidence pack logic;

security hardening;

safe file handling;

defensive cybersecurity documentation;

audit and compliance templates;

B2B and B2G documentation;

tests;

build improvements;

accessibility improvements;

deployment hygiene.


A good contribution improves the project without expanding it into unsafe or uncontrolled territory.


---

6. Prohibited Contributions

The following contributions are not allowed:

offensive cyber capabilities;

exploit deployment logic;

malware;

credential theft;

persistence mechanisms;

evasion techniques;

stealth functionality;

unauthorized access tooling;

sabotage functionality;

autonomous targeting;

lethal decision support;

unlawful surveillance;

biometric identification without lawful basis;

disinformation tooling;

coercive manipulation systems;

bypasses of governance logic;

bypasses of fail-closed behavior;

removal of auditability;

removal of traceability;

removal of human accountability;

code that exposes secrets;

code that logs sensitive payloads unnecessarily;

undocumented remote calls;

unsafe execution of uploaded files.


If a contribution can reasonably be interpreted as offensive or abusive, it should be rejected or redesigned.


---

7. Security Boundary

AI JOKER-C2 supports defensive and governance-oriented work only.

Allowed security work:

defensive security analysis;

secure architecture review;

incident report structuring;

repository hardening;

dependency hygiene;

safe debugging;

logging improvements;

vulnerability remediation;

audit trail design;

resilience planning;

compliance-oriented documentation.


Not allowed:

attack automation;

real-target exploitation;

malware creation;

evasion;

persistence;

unauthorized scanning;

credential extraction;

stealth;

destructive payloads.


The repository must remain on the defensive side of the boundary.


---

8. Contribution Workflow

Recommended workflow:

1. Fork the repository.


2. Create a dedicated branch.


3. Make a focused change.


4. Run local checks.


5. Review the governance impact.


6. Open a pull request.


7. Explain the purpose of the change.


8. Reference affected files and related roadmap phase.



Suggested branch naming:

docs/add-b2b-overview
governance/add-risk-engine
security/harden-file-upload
runtime/add-evt-generator
architecture/refactor-runtime-boundary

Suggested commit format:

area: concise description

Examples:

docs: add B2G overview for institutional readers
governance: implement runtime risk classifier
security: harden file upload validation
protocol: add EVT verifier notes
architecture: clarify fail-closed runtime boundary


---

9. Pull Request Requirements

A pull request should include:

clear title;

short explanation;

affected files;

reason for the change;

governance impact;

security impact;

test or build result, when applicable;

known limitations;

screenshots, if the interface changed;

related roadmap phase, when applicable.


Recommended pull request template:

## Summary

Describe the change.

## Affected Files

List files changed.

## Governance Impact

Explain whether this affects policy, risk, decision, EVT, ledger, verification or fail-closed behavior.

## Security Impact

Explain whether this affects secrets, API routes, file handling, logs, model calls or deployment.

## Tests

Describe checks performed.

## Notes

Add limitations or future work.


---

10. Code Style

Code should be:

clear;

typed where possible;

readable;

minimal;

maintainable;

safe by default;

aligned with the architecture;

easy to review.


Avoid:

unnecessary abstractions;

hidden side effects;

unclear naming;

large unreviewable changes;

excessive dependencies;

undocumented behavior;

unsafe shortcuts;

mixing unrelated changes.


Prefer small, focused changes.

A contribution should make the runtime easier to understand, not more obscure.


---

11. Documentation Style

Documentation should be:

clear;

technical;

professional;

non-offensive;

implementation-oriented;

aligned with MATRIX;

aligned with HBCE;

aligned with IPR;

aligned with EVT;

aligned with fail-closed governance.


Documentation must not:

claim legal certification;

promise production readiness without evidence;

describe offensive use cases as acceptable;

remove human accountability;

present dual-use as unrestricted use;

exaggerate capabilities;

hide limitations.


Use direct language.

Avoid decorative complexity when operational clarity is needed.


---

12. Governance Review Checklist

Before submitting a contribution, check:

Does the change preserve identity-bound operation?
Does the change preserve policy evaluation?
Does the change preserve risk classification?
Does the change preserve governance decisions?
Does the change preserve EVT generation or future EVT compatibility?
Does the change preserve ledger continuity?
Does the change preserve verification?
Does the change preserve fail-closed behavior?
Does the change preserve human accountability?
Does the change avoid prohibited use cases?
Does the change avoid offensive capability?

If the answer to any of these is unclear, explain the uncertainty in the pull request.


---

13. Security Review Checklist

Before submitting a contribution, check:

Does the change expose secrets?
Does the change log sensitive content?
Does the change affect API routes?
Does the change affect file handling?
Does the change execute uploaded content?
Does the change add dependencies?
Does the change affect model calls?
Does the change expose internal runtime data?
Does the change weaken error handling?
Does the change weaken fail-closed behavior?
Does the change enable abuse?
Does the project still build?

Recommended local checks:

npm install
npm audit
npm run build


---

14. EVT Compatibility

If a contribution affects runtime operations, it should preserve compatibility with EVT.

EVT-relevant changes include:

chat runtime changes;

file processing changes;

policy logic;

risk logic;

decision logic;

verification logic;

ledger logic;

event display;

evidence export;

audit status.


An EVT-compatible contribution should preserve or support:

event identifier;

previous event reference;

timestamp;

identity reference;

context class;

risk class;

governance decision;

operation status;

hash;

verification status;

audit status.


Do not silently remove traceability.


---

15. File Handling Contributions

File handling contributions must be conservative.

Allowed improvements:

safer parsing;

file size validation;

file type validation;

safe text extraction;

redaction support;

metadata handling;

user-facing error clarity;

controlled file context;

better unsupported file handling.


Not allowed:

execution of uploaded files;

unsafe parsing of binary files;

automatic processing of unknown executable content;

logging full sensitive files;

storing unnecessary payloads;

bypassing validation.


If file visibility is incomplete, the system should state it clearly.


---

16. API Contributions

API changes must be reviewed carefully.

API routes should:

validate input;

handle errors safely;

avoid exposing stack traces;

avoid leaking secrets;

avoid returning private internal metadata;

preserve governance logic;

preserve fail-closed behavior;

support EVT generation where relevant;

avoid unrestricted execution.


Primary API routes may include:

/api/chat
/api/files
/api/verify
/api/evidence

New API routes must have a clear purpose and documented boundary.


---

17. Dependency Contributions

New dependencies should be avoided unless clearly justified.

Before adding a dependency, ask:

Is it necessary?
Is it maintained?
Is it secure?
Is it lightweight?
Can the same result be achieved with existing code?
Does it affect runtime safety?
Does it affect build stability?
Does it increase attack surface?

If a dependency is added, explain why in the pull request.


---

18. Testing Expectations

At minimum, contributors should run:

npm install
npm run build

Security-sensitive changes should also run:

npm audit

Future test commands may include:

npm test
npm run lint
npm run typecheck

If tests are not available yet, the pull request should state that clearly.

Do not claim a test passed if it was not run.


---

19. Issue Guidelines

Good issues include:

clear title;

affected area;

expected behavior;

current behavior;

reproduction steps;

screenshots, if relevant;

security impact, if relevant;

governance impact, if relevant;

suggested fix, if available.


Issue labels may include:

architecture
governance
security
runtime
evt
ledger
verification
documentation
b2b
b2g
matrix
hbce
fail-closed
risk-engine
policy-engine

Avoid opening issues that request prohibited functionality.


---

20. Responsible Security Reporting

Do not disclose vulnerabilities publicly before remediation.

Do not post:

secrets;

active exploit details;

private user data;

deployment tokens;

API keys;

unauthorized access methods.


Security reports should be responsible, proportionate and non-destructive.

See:

SECURITY.md

for the full security policy.


---

21. Commit Message Guide

Use concise commit messages.

Recommended format:

area: action and object

Examples:

docs: add compliance orientation
security: add defensive fail-closed policy
architecture: formalize runtime model
governance: add risk classification table
protocol: define EVT event chain
runtime: add context classifier
ledger: add append-only event store
verify: add EVT verification endpoint

Avoid vague commits like:

update
fix stuff
changes
final
new file

Commit messages should help future audit.


---

22. Versioning and Roadmap Alignment

Contributions should align with the roadmap.

Main phases:

v0.1 = runtime prototype
v0.2 = governance documentation
v0.3 = policy and risk engine
v0.4 = EVT ledger and verifier
v0.5 = signed evidence packs
v0.6 = dashboard
v0.7 = B2B and B2G package
v0.8 = federation and node registry
v0.9 = compliance package
v1.0 = governed release candidate

Reference the relevant phase when possible.

See:

ROADMAP.md


---

23. Human Accountability Rule

Contributions must preserve human accountability.

AI JOKER-C2 may assist with:

analysis;

drafting;

classification;

verification;

documentation;

risk mapping;

audit preparation.


It must not claim final authority over:

legal decisions;

medical decisions;

financial decisions;

military decisions;

law enforcement action;

coercive public authority;

critical infrastructure intervention;

irreversible operational execution.


For high-impact use cases, contributions should support review and escalation.


---

24. Dual-Use Contribution Rule

Dual-use contributions are allowed only when they strengthen lawful, defensive and accountable use.

Allowed dual-use direction:

defensive cybersecurity;

infrastructure resilience;

audit;

compliance support;

risk classification;

event traceability;

incident documentation;

operational continuity.


Prohibited dual-use direction:

attack tooling;

malware;

unauthorized exploitation;

stealth;

evasion;

sabotage;

unlawful surveillance;

targeting;

coercive operations.


Dual-use does not mean unrestricted use.

It means controlled strategic use under governance.


---

25. Maintainer Review Criteria

A contribution may be rejected if it:

weakens governance;

weakens security;

weakens traceability;

weakens fail-closed behavior;

adds offensive capability;

adds unnecessary complexity;

exposes secrets;

lacks clear purpose;

contradicts project documentation;

lacks enough explanation;

makes the project harder to audit;

creates legal or safety ambiguity.


A contribution is more likely to be accepted if it:

is focused;

is understandable;

builds successfully;

improves safety;

improves auditability;

improves runtime clarity;

improves documentation;

supports the roadmap;

preserves non-offensive boundaries.



---

26. Contributor Statement

By contributing to this repository, you agree that your contribution should support the project’s core identity:

AI JOKER-C2 is an identity-bound operational AI runtime for governed, traceable, verifiable and fail-closed AI-assisted operations.

You also agree that the contribution should not intentionally introduce offensive, abusive, unlawful or unsafe capability.


---

27. Final Contribution Formula

No contribution without governance.
No sensitive feature without risk classification.
No runtime change without traceability.
No security change without review.
No dual-use feature without lawful defensive boundary.
No operation without fail-closed control.

Condensed:

Contribution = Clarity + Security + Governance + Traceability + Verification


---

28. Status

Document status: active contribution policy
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

