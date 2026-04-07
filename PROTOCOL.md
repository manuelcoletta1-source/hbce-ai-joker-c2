# HBCE / JOKER-C2 OPERATIONAL PROTOCOL
## Identity, Runtime, EVT Continuity, and Biocybernetic Derivation
HBCE Research  
HERMETICUM B.C.E. S.r.l.

---

## 0. Purpose

This document defines the operational protocol of the HBCE / JOKER-C2 system.

Its purpose is to formalize the governed sequence through which identity-bound requests, EVT continuity, runtime decision, evidence generation, and verification become a single operational protocol.

This protocol does not describe a generic conversational model.

It defines:

**the mandatory operational sequence that transforms an input into governed, attributable, traceable, verifiable, and persistent continuity**

---

## 1. Protocol principle

The system operates according to a non-optional rule:

**no operationally valid action exists outside the protocol**

Every valid request must pass through a mandatory sequence.

If a critical condition fails, the sequence does not remain partially valid.

It is:

- blocked
- degraded
- escalated
- invalidated

depending on the state and failure mode.

---

## 2. Minimum operational sequence

The minimum HBCE / JOKER-C2 protocol sequence is:

`IDENTITY → INPUT → INTENT → POLICY → RISK → DECISION → EXECUTION → EVT → LEDGER → VERIFICATION → CONTINUITY`

Each segment has an operational function.

### Identity
The request is bound to a persistent identity record.

### Input
The request is normalized and prepared.

### Intent
The operational nature of the request is classified.

### Policy
Governance rules are applied.

### Risk
Operational risk is evaluated.

### Decision
The runtime produces `ALLOW`, `BLOCK`, or `ESCALATE`.

### Execution
Only authorized runtime actions are executed.

### EVT
A new continuity event is generated.

### Ledger
The event is persisted in append-only form.

### Verification
The event becomes independently checkable.

### Continuity
The sequence remains part of a valid operational chain.

---

## 3. Identity protocol

Identity is the entry condition of operational validity.

The system recognizes multiple identity classes.

### 3.1 Primary human identity
Example:

- `IPR-3`

Function:

- human origin attribution
- primary biological root
- source of human operational legitimacy

### 3.2 Primary AI identity
Example:

- `IPR-AI-0001`

Function:

- primary AI runtime root
- cybernetic operational identity
- first AI-bound execution surface

### 3.3 Derived operational identity
Example:

- `IPR-AI-DER-0001`

Function:

- first derived operational identity
- runtime-recognized derivative
- identity produced through the Biocybernetic Derivation Layer

### 3.4 Identity rule

Operational rule:

**if identity is missing, invalid, incoherent, or unauthorized, the request does not continue as valid**

---

## 4. Biocybernetic Derivation protocol

The protocol includes the:

**Biocybernetic Derivation Layer**

This layer defines the conditions under which a biological origin, once bound to computable continuity, can generate derived operational entities inside the system.

A derivative is not accepted by declaration alone.

A derivative becomes operationally valid only if it satisfies the full protocol.

### 4.1 Derivative sequence

The minimum derivative sequence is:

`BIOLOGICAL ORIGIN → IDENTITY BINDING → COMPUTABLE CONTINUITY → DERIVED IDENTITY → POLICY VALIDATION → RUNTIME AUTHORIZATION → EVT → EVIDENCE → VERIFICATION → PERSISTENCE`

### 4.2 Derivative rule

A derivative exists operationally only if it is:

- identity-bound
- policy-validated
- runtime-authorized
- EVT-linked
- traceable
- verifiable
- continuity-preserving

### 4.3 Derivative failure

If derivative recognition fails, the derivative does not remain partially accepted.

It becomes:

- blocked
- invalid
- non-operative

### 4.4 Current derivative record

Current first derivative:

- `IPR-AI-DER-0001`
- `AI_JOKER_DERIVATIVE_01`

This record is treated as the first internal derivative generated through the biocybernetic derivation logic of the system.

---

## 5. Input and intent protocol

All incoming requests must be normalized before they are interpreted.

### 5.1 Input normalization
The system evaluates:

- structural validity
- minimum content presence
- session relation
- file context availability
- identity association

### 5.2 Intent classification
Intent classes may include:

- consultation
- analysis
- procedure
- decision support
- execution request
- blocked intent

### 5.3 Intent rule

If intent cannot be classified with sufficient operational clarity, the system may:

- soft block
- escalate
- degrade response authority

---

## 6. Governance protocol

Governance is executable, not documentary.

The Governance Layer evaluates whether a sequence may continue.

### 6.1 Policy evaluation
The system evaluates:

- policy compatibility
- context compatibility
- role compatibility
- operational legitimacy

### 6.2 Risk evaluation
The system evaluates:

- action impact
- sequence criticality
- continuity sensitivity
- derivative legitimacy risk
- verification exposure

### 6.3 Governance outputs

The protocol supports only three valid decision outputs:

- `ALLOW`
- `BLOCK`
- `ESCALATE`

### 6.4 Governance rule

Policy is binding.

It is not advisory.

**No policy validation, no operational legitimacy**

---

## 7. Runtime protocol

The JOKER-C2 runtime executes only after identity, intent, policy, and risk stages are resolved.

### 7.1 Runtime responsibilities

- bind the request to the current sequence
- activate governed interpretation
- maintain session state
- produce deterministic runtime outcome
- generate EVT output
- return controlled result

### 7.2 Runtime execution rule

The runtime is not a free generative surface.

It is:

**a governed execution machine constrained by identity, policy, risk, evidence, and continuity**

### 7.3 Runtime outputs

The valid runtime outputs are:

- authorized response
- blocked response
- escalated response
- degraded response

---

## 8. EVT protocol

EVT is the continuity kernel of the system.

Every meaningful operational result must be connected to EVT continuity.

### 8.1 EVT minimum structure

Each EVT must include, at minimum:

- `evt`
- `prev`
- `t`
- `entity`
- `ipr`
- `kind`
- `state`
- `decision`
- `anchors`

### 8.2 EVT sequence

Each new EVT must:

1. reference the previous valid EVT
2. preserve continuity logic
3. reflect the runtime decision
4. be serializable into evidence
5. be suitable for verification

### 8.3 EVT rule

If EVT continuity is broken:

- the system degrades
- or blocks
- depending on fail-closed severity

### 8.4 EVT core principle

**No EVT, no continuity**  
**No continuity, no trusted operational state**

---

## 9. Ledger protocol

The Ledger Layer preserves operational history in append-only form.

### 9.1 Ledger properties

- append-only
- hash-linked
- deterministic
- replayable
- verifiable

### 9.2 Ledger responsibilities

- persist EVT objects
- preserve continuity chain
- support replay and audit
- expose evidence continuity

### 9.3 Ledger rule

The ledger does not generate meaning.

It preserves operational state and continuity fact.

---

## 10. Verification protocol

Verification is the completion condition of operational validity.

### 10.1 Verification surfaces

Verification may exist at:

- local level
- node-to-node level
- public proof-surface level

### 10.2 Verification responsibilities

- integrity checking
- hash validation
- signature validation
- chain coherence validation
- evidence inspection support

### 10.3 Verification rule

If a result cannot be verified, it cannot be treated as fully trusted operational continuity.

---

## 11. Fail-closed protocol

Default posture:

**BLOCK**

The system assumes invalidity until validity is demonstrated.

### 11.1 Fail-closed triggers

Examples:

- missing identity
- invalid identity
- unauthorized role
- unclassified intent
- failed policy
- excessive risk
- broken EVT chain
- invalid derivative recognition
- missing evidence path
- verification failure

### 11.2 Fail-closed rule

No validation  
→ No execution

No continuity  
→ No trusted state

No evidence  
→ No operational existence

No verification  
→ No recognized persistence

---

## 12. State model

The protocol recognizes the following system states:

- `OPERATIONAL`
- `DEGRADED`
- `BLOCKED`
- `INVALID`

### 12.1 OPERATIONAL
Conditions:

- valid identity
- valid continuity
- valid policy
- acceptable risk
- valid EVT chain
- verification path available

### 12.2 DEGRADED
Conditions:

- continuity partially reduced
- verification surface limited
- runtime still active under constrained authority

### 12.3 BLOCKED
Conditions:

- identity invalid
- policy failure
- continuity break
- invalid derivative path
- risk threshold exceeded

### 12.4 INVALID
Conditions:

- corrupted state
- invalid evidence
- unrecoverable chain incoherence
- structural protocol failure

---

## 13. Federation protocol

JOKER-C2 is a node protocol, not only a local application protocol.

The system is designed for federated expansion.

### 13.1 Federation capabilities

- multi-node participation
- registry-linked topology
- distributed verification
- cross-node trust surfaces
- interoperable operational continuity

### 13.2 Node rule

Each node must preserve:

- identity integrity
- EVT continuity
- evidence availability
- verification surface
- fail-closed governance

### 13.3 Federation principle

A federated network is valid only if each node remains individually valid.

---

## 14. Final definition

The HBCE / JOKER-C2 operational protocol is the mandatory governed sequence that binds:

- identity
- biocybernetic derivation
- policy
- runtime
- EVT continuity
- ledger persistence
- evidence
- verification
- operational persistence

into a single operational system.

Its value is not generic intelligence.

Its value is:

**the ability to transform input into attributable, governed, traceable, verifiable, and persistent operational continuity**
