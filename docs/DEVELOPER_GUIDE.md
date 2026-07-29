# Developer Guide

## AI JOKER-C2

Version 1.0

---

# Overview

AI JOKER-C2 è un runtime modulare basato su una pipeline deterministica.

L'obiettivo del progetto è fornire un framework governato, auditabile e LLM-agnostic.

---

# Repository Structure

```
app/
docs/
lib/
system/
public/
```

---

# Core Modules

```
mission.ts
claim.ts
source-intelligence.ts
srsc-engine.ts
runtime-engine.ts
bootstrap.ts
```

---

# Runtime Flow

Mission

↓

Claim Classification

↓

Source Intelligence

↓

SRSC

↓

Mission Runtime

↓

Governed Output

---

# REST API

```
/health
/info
/version
/capabilities
/self-test
/manifest
/execute
```

---

# Design Rules

- deterministic execution
- fail closed
- audit first
- modular architecture
- explainable pipeline
- reproducible results

---

# Coding Principles

- single responsibility
- immutable data where possible
- typed interfaces
- readable code
- documented modules

---

# Governance

Identity

IPR

↓

HBCE

↓

SRSC

↓

Mission Runtime

↓

OPC

---

# Current Runtime

Version 1.0.0

Status

ACTIVE
