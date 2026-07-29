# AI JOKER-C2 API Reference

## Runtime API v1

---

## Health

GET `/api/v1/runtime/health`

Returns the operational health of the Mission Runtime.

---

## Information

GET `/api/v1/runtime/info`

Returns runtime metadata.

---

## Version

GET `/api/v1/runtime/version`

Returns the current runtime version.

---

## Capabilities

GET `/api/v1/runtime/capabilities`

Returns the supported runtime capabilities.

---

## Self Test

GET `/api/v1/runtime/self-test`

Runs internal runtime validation.

---

## Manifest

GET `/api/v1/runtime/manifest`

Returns the runtime manifest.

---

## Execute Mission

POST `/api/v1/runtime/execute`

Executes a governed mission through the complete runtime pipeline.

Pipeline:

Mission

↓

Claim Classification

↓

Source Intelligence

↓

SRSC Interpretation

↓

Mission Runtime

↓

Governed Response

---

## Runtime Policies

- Deterministic
- Fail Closed
- Audit First
- Traceable
- LLM Agnostic
- Mission Driven

---

## Governance

Identity: IPR

Framework: SRSC

Governance: HBCE

Traceability: OPC
