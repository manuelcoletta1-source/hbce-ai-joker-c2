# AI JOKER-C2 Architecture Overview

Version 1.0

---

# Overview

AI JOKER-C2 è una piattaforma modulare progettata per eseguire missioni attraverso una pipeline deterministica, auditabile e governata.

L'architettura separa chiaramente:

- identità
- governance
- interpretazione
- esecuzione
- tracciabilità

---

# High Level Architecture

```
                IPR
                 │
                 ▼
              HBCE
                 │
                 ▼
      Source Intelligence
                 │
                 ▼
               SRSC
                 │
                 ▼
         Mission Runtime
                 │
                 ▼
               OPC
                 │
                 ▼
        Governed Response
```

---

# Core Components

## Identity

IPR

Responsabilità e identità operativa.

---

## Governance

HBCE

Regole di esecuzione.

---

## Evidence

Source Intelligence

Valutazione delle fonti.

---

## Interpretation

SRSC

Interpretazione governata.

---

## Execution

Mission Runtime

Pipeline deterministica.

---

## Traceability

OPC

Proof e Audit Trail.

---

# REST API

```
GET  /health
GET  /info
GET  /version
GET  /manifest
GET  /capabilities
GET  /self-test
POST /execute
```

---

# Design Principles

- Modular
- Deterministic
- Explainable
- Auditable
- Reproducible
- Fail Closed
- LLM Agnostic

---

# Current Status

Architecture

STABLE

Runtime

ACTIVE

Version

1.0.0
