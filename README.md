# AI JOKER-C2

Identity-Bound Operational AI Application

HBCE Research  
HERMETICUM B.C.E. S.r.l.

---

## Overview

AI JOKER-C2 is the operational AI application of the HBCE environment.

The project is designed as a conversational and operational interface for structured context recovery, identity-bound interaction, and node-aware execution within HBCE-oriented architectures.

The current version is built on a modern Next.js application structure and is intended to support:

- conversational interaction
- context recovery
- Matrix Europa node alignment
- IPR-aware execution logic
- operational metadata exposure
- future extensibility toward advanced orchestration layers

---

## Core Concepts

### Joker-C2
Joker-C2 is the coordination engine of the HBCE framework.  
It is designed to operate as an application layer for analysis, contextual synthesis, structured response generation, and operational interaction.

### IPR
IPR stands for Identity Primary Record.  
Within the HBCE model, it represents the persistent operational identity layer used to bind actions, events, and verification logic.

### Matrix Europa
Matrix Europa is the territorial deployment logic associated with distributed HBCE-aligned operational nodes.  
In the current version, the default node context is associated with the Torino experimental node.

---

## Current Application Structure

```text
app/
  api/
    chat/
      route.ts
  interface/
    page.tsx
  layout.tsx
  page.tsx

api/
  chat.js

public/
  interface.html


---

Routes

Home

/

Operational landing page for the AI JOKER-C2 application.

Interface

/interface

Main conversational interface of the system.

Next API

/api/chat

Primary Next.js API route for context recovery and structured Joker-C2 responses.

Legacy API

api/chat.js

Legacy compatibility endpoint maintained for transitional support.


---

Current Capabilities

The current version supports:

local corpus retrieval

topic detection

follow-up resolution

structured reply generation

basic operational metadata

Matrix node context

IPR-linked request framing



---

Project Status

Current status:

Next.js application active

chat-first interface active

legacy API retained for compatibility

modern API route active

corpus-based context recovery active


This repository is currently being refactored toward a cleaner and more maintainable Joker-C2 architecture.


---

Development Direction

The next architectural phase may include:

persistent conversation memory

advanced retrieval pipelines

web-assisted research layers

identity-aware orchestration

deterministic evidence generation

richer Matrix Europa node logic

modular HBCE service integration



---

Deployment

The project is designed to run on Vercel using a Next.js-compatible deployment model.

Main expected flow:

User Interface
    ↓
/interface
    ↓
/api/chat
    ↓
Joker-C2 Context Recovery
    ↓
Structured Response + Metadata


---

Maintained By

HBCE Research
HERMETICUM B.C.E. S.r.l.


