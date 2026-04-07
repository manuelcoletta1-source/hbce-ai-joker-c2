# CONTRIBUTING
## HBCE / AI JOKER-C2 Contribution Rules
HBCE Research  
HERMETICUM B.C.E. S.r.l.

---

## 0. Purpose

This document defines how contributions to the HBCE / AI JOKER-C2 repository must be proposed, structured, and validated.

This repository is not maintained as a generic software sandbox.

It is maintained as an:

**identity-bound operational node with governed runtime, EVT continuity, evidence generation, verification surfaces, fail-closed design, and derivative-aware legitimacy**

For this reason, contributions are accepted only when they strengthen the architectural integrity of the system.

---

## 1. Contribution principle

A contribution is valid only if it improves at least one of the following dimensions without weakening the others:

- identity integrity
- runtime determinism
- EVT continuity
- ledger consistency
- evidence generation
- verification posture
- fail-closed enforcement
- derivative legitimacy
- federation readiness
- architectural coherence across docs and code

Contribution rule:

**feature growth without operational control is not accepted as architectural progress**

---

## 2. What this repository is

AI JOKER-C2 is not:

- a generic chatbot repository
- a casual UI playground
- an unconstrained AI demo
- a permissive experimentation surface

It is:

**an identity-bound operational node of the HBCE system**

This means every meaningful contribution must remain compatible with:

- IPR identity model
- Biocybernetic Derivation Layer
- governed runtime sequence
- EVT continuity
- evidence and verification logic
- fail-closed posture
- node and federation model

---

## 3. Accepted contribution areas

Contributions are generally acceptable when they improve one or more of the following areas.

### 3.1 Interface surfaces
Examples:

- clarity improvements to portal pages
- better controlled UI exposure
- stronger consistency across node surfaces
- interface alignment with runtime constraints

### 3.2 Runtime logic
Examples:

- better state transitions
- stronger intent classification
- improved policy / risk integration
- more deterministic execution flow

### 3.3 EVT continuity
Examples:

- stronger continuity checks
- clearer event structure
- better continuity reconstruction
- improved replay consistency

### 3.4 Ledger and evidence
Examples:

- stronger append-only persistence
- better evidence serialization
- clearer proof export paths
- stronger integrity handling

### 3.5 Verification
Examples:

- better hash validation
- stronger signature verification
- clearer proof surface exposure
- stronger cross-layer integrity checks

### 3.6 Documentation
Examples:

- architecture alignment
- protocol clarification
- network model clarity
- security posture clarification
- derivative legitimacy clarification

### 3.7 Federation
Examples:

- registry improvements
- topology model refinement
- node posture exposure
- multi-node coherence

---

## 4. Restricted contribution areas

The following contribution types require special caution and stronger justification.

### 4.1 Identity model changes
Changes affecting:

- IPR structure
- identity binding logic
- role model
- attribution chain
- derivative identity family

These changes must preserve architectural integrity and must not create ambiguity.

### 4.2 Runtime bypass paths
Any proposal that introduces:

- implicit execution
- silent fallback
- ungoverned output
- continuity bypass
- evidence-less response paths

is presumed invalid unless proven otherwise.

### 4.3 Fail-closed weakening
Any proposal that reduces fail-closed strictness is considered high-risk.

### 4.4 Derivative legitimacy weakening
Any contribution that treats derivative identities as decorative naming rather than governed runtime-recognized entities is considered architecturally invalid.

---

## 5. Architectural contribution test

Before proposing a change, the contributor must be able to answer these questions.

### 5.1 Identity
Does this preserve or strengthen identity integrity?

### 5.2 Runtime
Does this preserve or strengthen governed execution?

### 5.3 Continuity
Does this preserve or strengthen EVT continuity?

### 5.4 Evidence
Does this preserve or strengthen evidence production?

### 5.5 Verification
Does this preserve or strengthen verification posture?

### 5.6 Fail-closed
Does this preserve or strengthen fail-closed behavior?

### 5.7 Derivation
Does this preserve or strengthen derivative legitimacy?

If the answer is unclear, the contribution is not yet mature.

---

## 6. Contribution process

### Step 1
Read the architectural documents first:

- `README.md`
- `ARCHITECTURE.md`
- `PROTOCOL.md`
- `NETWORK.md`
- `SECURITY.md`

### Step 2
Identify the architectural layer affected by the change.

Possible layers include:

- Interface Layer
- Identity Layer
- Biocybernetic Derivation Layer
- Governance Layer
- Runtime Layer
- Continuity Layer
- Ledger Layer
- Verification Layer
- Federation Layer

### Step 3
Describe the contribution in architectural terms, not only in feature terms.

Bad example:

- “adds new AI output style”

Good example:

- “improves governed runtime clarity without weakening EVT continuity or fail-closed posture”

### Step 4
Implement the change.

### Step 5
Verify that the change does not break continuity, protocol logic, or documentation coherence.

### Step 6
Submit with a commit message aligned to the repository structure.

---

## 7. Code contribution expectations

Code contributions should aim for:

- clarity
- deterministic behavior
- minimal ambiguity
- compatibility with runtime control
- compatibility with fail-closed rules
- continuity-safe logic
- verification-safe outputs

Code contributions should avoid:

- hidden side effects
- uncontrolled fallback behavior
- loosely typed structural ambiguity
- bypass paths around protocol stages
- decorative complexity with no architectural value

---

## 8. Documentation contribution expectations

Documentation must describe the system as it is architecturally defined.

Documentation contributions should:

- use consistent terminology
- preserve the identity-bound node model
- preserve governed runtime logic
- preserve EVT continuity logic
- preserve fail-closed posture
- preserve derivative-aware legitimacy model

Documentation should avoid:

- generic consumer-AI language
- casual ambiguity
- symbolic inflation without operational meaning
- contradictions between docs and code
- using “derivative” as metaphor rather than governed architectural concept

---

## 9. Biocybernetic Derivation contribution rules

The repository includes the:

**Biocybernetic Derivation Layer**

This layer must be treated as an architectural layer, not a decorative doctrine.

Contributions affecting derivative logic must preserve:

- identity binding
- policy validation
- runtime authorization
- EVT linkage
- evidence production
- verification path
- fail-closed legitimacy

Current first derivative branch:

- `IPR-AI-DER-0001`
- `AI_JOKER_DERIVATIVE_01`

Contribution rule:

**no derivative contribution is accepted if it weakens derivative legitimacy**

---

## 10. Commit message guidance

Commit messages should reflect architectural intent.

Examples:

- `refactor(runtime): strengthen governed execution path`
- `feat(registry): expose derivative-aware node topology`
- `refactor(protocol): tighten fail-closed continuity rules`
- `docs(architecture): align node model with derivative legitimacy`

Avoid vague messages such as:

- `update stuff`
- `minor fixes`
- `improvements`
- `changes`

A commit message should explain:

- what changed
- where it changed
- why it matters architecturally

---

## 11. Pull request guidance

A pull request should include:

- summary of change
- affected architectural layer
- protocol impact
- continuity impact
- evidence / verification impact
- fail-closed impact
- derivative impact if applicable

Suggested structure:

### Summary
What changed.

### Architectural layer
Which part of the system is affected.

### Operational effect
How the node behavior changes.

### Risk
What could be weakened if the change is wrong.

### Validation
How the contributor checked consistency.

---

## 12. Rejection conditions

A contribution is likely to be rejected if it:

- introduces ambiguity into identity logic
- bypasses governed runtime sequence
- weakens EVT continuity requirements
- weakens evidence or verification posture
- weakens fail-closed design
- introduces derivative naming without derivative legitimacy
- creates documentation drift against architecture
- makes the node appear more capable while making it less governable

Rejection rule:

**architectural drift is regression**

---

## 13. Minimum review checklist

Before merging, review the contribution against the following checklist.

- Does identity remain coherent?
- Does the runtime remain governed?
- Does EVT continuity remain mandatory?
- Does evidence remain structurally emit-able?
- Does verification remain possible?
- Does fail-closed posture remain central?
- Does derivative legitimacy remain strict?
- Do docs and code still describe the same system?

A contribution that fails one of these checks is not ready.

---

## 14. Final principle

This repository is not optimized for unconstrained feature velocity.

It is optimized for architectural legitimacy.

Contributors should therefore think in terms of:

- operational sequence
- identity integrity
- continuity preservation
- governed execution
- proof generation
- verifiability
- derivative legitimacy

rather than isolated features.

---

## 15. Final definition

A valid contribution to HBCE / AI JOKER-C2 is one that strengthens the repository as an:

**identity-bound operational node with governed runtime, EVT continuity, verifiable evidence, fail-closed execution, and Biocybernetic Derivation Layer legitimacy**



