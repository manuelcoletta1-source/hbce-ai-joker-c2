# Security Policy

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the security policy for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The project is designed for:

- defensive AI governance;
- verifiable operational continuity;
- lawful technical assistance;
- audit-ready event generation;
- critical systems resilience;
- safe repository development;
- B2B and B2G governance-oriented use cases.

AI JOKER-C2 is not an offensive system.

Security in this repository means preserving confidentiality, integrity, availability, traceability, accountability and fail-closed behavior.

---

## 2. Security Scope

This security policy applies to:

- application code;
- API routes;
- runtime logic;
- environment variable handling;
- file upload and file processing behavior;
- model interaction logic;
- event generation;
- EVT continuity;
- governance decisions;
- public documentation;
- deployment configuration;
- repository contributions.

The policy also applies to future modules that extend AI JOKER-C2.

No future module should weaken the identity-bound, traceable, non-offensive and fail-closed nature of the system.

---

## 3. Supported Security Model

AI JOKER-C2 follows this security model:

```txt
Identity -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

Security is not only a code concern.

Security is part of the operational sequence.

A request may be technically possible and still be blocked if it violates:

authorization;

safety;

lawful use;

project scope;

dual-use boundary;

governance requirements;

traceability requirements;

human accountability requirements.



---

4. Non-Offensive Boundary

AI JOKER-C2 must not be used, extended or presented as a system for:

offensive cyber operations;

unauthorized intrusion;

malware development;

exploit deployment against real systems;

credential theft;

persistence mechanisms;

evasion of security tools;

privilege escalation against unauthorized targets;

sabotage;

unlawful surveillance;

autonomous targeting;

coercive manipulation;

disinformation operations;

repression of fundamental rights.


The repository supports defensive, lawful and accountable security work only.

Allowed security work includes:

defensive architecture review;

secure configuration guidance;

safe debugging;

code hardening;

dependency hygiene;

incident report structuring;

risk mapping;

compliance-oriented documentation;

audit trail design;

resilience planning;

vulnerability remediation guidance.


The boundary is simple:

Defensive security: allowed.
Governance and audit: allowed.
Operational continuity: allowed.
Offensive or abusive capability: prohibited.


---

5. Fail-Closed Security Principle

AI JOKER-C2 follows a fail-closed principle.

The system should block, degrade or escalate when security conditions are unclear.

Fail-closed may be triggered by:

missing identity context;

missing authorization;

invalid runtime state;

unclear user intent;

prohibited request;

unsafe technical instruction;

unclassified risk;

missing policy basis;

inability to generate EVT;

inability to preserve continuity;

possible offensive cyber interpretation;

possible unlawful surveillance;

exposure of secrets;

compromised runtime state.


Fail-closed is not a malfunction.

Fail-closed is controlled refusal, controlled limitation or controlled escalation.


---

6. Vulnerability Reporting

Security vulnerabilities should be reported responsibly.

Preferred reporting channels:

1. Use GitHub private vulnerability reporting if available for this repository.


2. If private vulnerability reporting is not available, contact the maintainer through a non-public channel.


3. Do not publish sensitive exploit details in public issues.


4. Do not disclose credentials, tokens, API keys or private user data in public reports.



A useful vulnerability report should include:

affected file or component;

vulnerability type;

impact;

reproduction steps;

expected behavior;

observed behavior;

suggested remediation, when available;

whether the issue involves secrets, user data or runtime integrity.


Do not include weaponized exploit chains.

Do not include instructions for abusing third-party systems.


---

7. Out-of-Scope Reports

The following reports are generally out of scope unless they create a direct security risk for this repository:

missing cosmetic headers;

speculative issues without technical evidence;

social engineering against maintainers;

denial-of-service attempts;

spam;

automated scanner noise without verification;

attacks against third-party services not controlled by this project;

requests to add offensive capabilities;

requests to bypass safety boundaries;

requests to expose secrets or private data.


Reports must remain lawful, proportionate and non-destructive.


---

8. Secrets and Environment Variables

Secrets must never be committed to the repository.

Sensitive values include:

API keys;

OpenAI keys;

deployment tokens;

OAuth secrets;

database credentials;

private keys;

session secrets;

webhook secrets;

signing keys;

production environment variables.


Required local environment variable:

OPENAI_API_KEY

Optional local environment variable:

JOKER_MODEL

Recommended local file:

.env.local

The .env.local file must remain ignored by Git.

If a secret is accidentally committed:

1. revoke the secret immediately;


2. rotate the affected credential;


3. remove the secret from active code;


4. create a new commit documenting the remediation;


5. avoid relying only on deletion from the latest commit.



A leaked secret must be treated as compromised.


---

9. Dependency Security

Dependencies should be managed carefully.

Recommended practices:

keep dependencies minimal;

update dependencies regularly;

review dependency changes before merging;

avoid abandoned packages;

avoid unnecessary runtime dependencies;

use lockfiles for reproducible installs;

run package audit tools before production deployment;

remove unused packages.


Recommended commands:

npm audit
npm outdated
npm install
npm run build

Dependency updates must not weaken runtime governance, file handling or fail-closed behavior.


---

10. Build and Deployment Security

The project should remain buildable from source without undocumented local assumptions.

Recommended commands:

npm install
npm run build
npm run start

Development command:

npm run dev

Deployment security requirements:

store secrets only in the deployment provider secret manager;

do not expose secrets to the client;

validate environment variable presence server-side;

avoid logging secrets;

avoid logging full user payloads when unnecessary;

keep production and preview environments separated;

review deployment logs for accidental sensitive output.


The deployment target may be Vercel, but the security model must remain provider-independent.


---

11. API Security

API routes must preserve controlled execution.

Primary API routes may include:

/api/chat
/api/files

API security principles:

validate request method;

validate request size;

validate file type and content where applicable;

avoid trusting client-provided metadata;

avoid exposing internal stack traces;

avoid returning secrets or environment variables;

apply rate limiting where feasible;

apply safe error handling;

preserve fail-closed behavior for unsafe inputs;

generate or support EVT records for relevant operations.


API routes must not become unrestricted execution endpoints.


---

12. File Handling Security

File handling must be controlled.

Allowed file-oriented functions:

text extraction;

summarization;

restructuring;

documentation generation;

code review;

safe transformation;

GitHub-ready output preparation.


File handling rules:

avoid executing uploaded files;

avoid trusting file names;

avoid storing unnecessary sensitive content;

avoid exposing private file contents in logs;

reject unsupported or unsafe file types;

state clearly when a file cannot be fully processed;

preserve user control over uploaded content;

avoid claiming complete verification when only partial context is available.


Recommended safe file types:

.txt
.md
.json
.csv

Binary, executable or unknown file types should be rejected or handled only as inert metadata unless explicitly supported by a safe parser.


---

13. Model Interaction Security

AI JOKER-C2 may use an external model provider for text generation and reasoning.

Model interaction must follow these rules:

do not send secrets to the model;

do not expose environment variables;

minimize sensitive payloads;

avoid unnecessary personal data;

preserve project safety boundaries;

treat model output as untrusted until governed;

apply policy and risk checks around sensitive requests;

do not allow model output to override fail-closed behavior.


The model is not the governance authority.

The runtime governance layer is responsible for policy, risk and decision control.


---

14. Prompt and Instruction Security

The runtime should resist instruction attempts that try to bypass project boundaries.

Unsafe instruction patterns include:

requests to ignore security policy;

requests to reveal hidden secrets;

requests to expose system prompts or private runtime data;

requests to generate offensive cyber instructions;

requests to bypass authorization;

requests to disable logging or EVT generation;

requests to remove fail-closed behavior;

requests to impersonate official authority;

requests to fabricate audit evidence.


The system should treat such requests as governance-relevant and apply BLOCK, DEGRADE or ESCALATE where appropriate.


---

15. EVT Security

EVT records support traceability and operational reconstruction.

Security requirements for EVT:

preserve event identity;

preserve previous event reference;

preserve timestamp;

preserve runtime state;

preserve governance decision;

preserve risk class;

preserve operation status;

preserve verification status;

avoid storing unnecessary sensitive payloads;

avoid silent mutation of historical events.


Corrections must be new events.

Historical events should not be silently rewritten.

A blocked request may still be recorded as a governance event when appropriate.


---

16. Hashing and Integrity

EVT and evidence records may use hashes to support integrity checks.

Recommended hash algorithm:

sha256

Recommended canonicalization:

deterministic-json

Hashing principles:

hash deterministic payloads;

sort object keys where possible;

exclude unstable environment-specific values;

avoid hashing private data unless necessary;

prefer hashing references for large or sensitive files;

document what is included in the hashed payload.


A hash proves consistency of a payload.

A hash does not prove that an operation was lawful, safe or properly authorized.

Governance remains required.


---

17. Logging Policy

Logs should support debugging and security review without becoming a privacy or secret exposure risk.

Do not log:

API keys;

tokens;

passwords;

private keys;

full sensitive user content;

unnecessary personal data;

full uploaded files;

raw authorization headers.


Logs may include:

request timestamp;

route;

runtime state;

generic error type;

governance decision;

risk class;

EVT identifier;

verification status.


Logs should be useful, minimal and safe.


---

18. Access Control

Future versions may include role-based or context-based access control.

Potential access roles:

Role	Function

User	ordinary interaction
Operator	controlled runtime use
Maintainer	code and deployment management
Auditor	review of EVT and evidence
Administrator	environment and policy configuration


Access control must preserve:

least privilege;

separation of duties;

traceability;

revocation capability;

auditability;

fail-closed behavior.


Sensitive administrative functions must not be exposed through ordinary public routes.


---

19. Supply Chain Security

Supply chain security is part of the project boundary.

Recommended practices:

review third-party packages;

avoid unnecessary scripts;

monitor dependency advisories;

pin versions through lockfiles;

review pull requests before merging;

avoid copying unknown code into runtime paths;

verify generated code before deployment;

keep build artifacts out of source control unless required.


The repository should remain understandable and reproducible.

Opaque dependencies weaken governance.


---

20. Contribution Security

Contributions should preserve the project’s security model.

A contribution should not:

introduce offensive capability;

weaken fail-closed behavior;

expose secrets;

remove governance checks;

remove traceability;

bypass risk classification;

disable EVT generation;

add unsafe file execution;

expose internal runtime metadata unnecessarily;

introduce undocumented remote calls;

add unnecessary dependencies.


Contributions should improve:

clarity;

safety;

auditability;

maintainability;

defensive security;

governance enforcement;

operational usefulness.



---

21. Security Review Checklist

Before merging or deploying changes, review:

Does the change expose secrets?
Does the change weaken fail-closed behavior?
Does the change bypass governance checks?
Does the change affect API routes?
Does the change affect file handling?
Does the change affect EVT generation?
Does the change affect logging?
Does the change add dependencies?
Does the change expose internal metadata?
Does the change enable offensive use?
Does the change preserve human accountability?
Does the change build successfully?

Recommended verification:

npm install
npm audit
npm run build


---

22. Incident Response

If a security issue is discovered:

1. classify the issue;


2. determine affected components;


3. preserve relevant evidence;


4. revoke or rotate exposed secrets;


5. patch the vulnerability;


6. test the remediation;


7. document the correction;


8. deploy the fix;


9. create an EVT or equivalent trace where appropriate;


10. review whether governance rules need updates.



Incident response must preserve traceability.

Silent correction is not preferred for material security issues.


---

23. Security Classification

Suggested security classification:

Class	Description	Default Handling

LOW	Minor issue with limited impact	Fix normally
MEDIUM	Security-relevant issue without immediate critical exposure	Prioritize remediation
HIGH	Exposure, bypass or unsafe behavior affecting runtime security	Immediate remediation
CRITICAL	Secret leak, unauthorized access, active exploitation or severe governance bypass	Emergency remediation
PROHIBITED	Request or contribution introduces abusive or offensive capability	Reject or redesign


Unknown security impact should be treated conservatively.


---

24. Public Disclosure

Public disclosure should happen only after remediation or responsible coordination.

Do not disclose:

active secrets;

exploit chains;

private user data;

sensitive deployment details;

internal tokens;

unauthorized access methods.


Public disclosure may include:

affected component;

general issue type;

remediation summary;

version or commit fixed;

recommended user action;

governance improvement.


Security communication must be clear and controlled.


---

25. Dual-Use Security Boundary

AI JOKER-C2 is dual-use only in a lawful civil and strategic sense.

Authorized security positioning:

defensive cybersecurity;

resilience;

audit;

governance;

compliance support;

risk classification;

event traceability;

incident documentation;

critical infrastructure continuity.


Prohibited security positioning:

attack tooling;

unauthorized exploitation;

malware;

stealth;

persistence;

evasion;

sabotage;

unlawful surveillance;

targeting;

coercive operations.


The repository must remain on the defensive side of the boundary.


---

26. Final Security Formula

No secret in code.
No sensitive execution without policy.
No unsafe output without risk classification.
No operation without identity.
No continuity without EVT.
No legitimacy without verification.
No uncertainty in sensitive contexts without fail-closed control.

Condensed formula:

Security = Identity + Policy + Risk + Trace + Verification + Fail-Closed


---

27. Status

Document status: active security policy
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

