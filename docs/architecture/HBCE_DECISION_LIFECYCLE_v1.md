# HBCE Decision Lifecycle v1

**Status:** R&D Canonical Architecture Specification
**Revision:** HBCE-DECISION-LIFECYCLE-v1
**Boundary:** EU_FIRST · AUDIT_FIRST · APPEND_ONLY · HASH_ONLY · FAIL_CLOSED
**legalCertification:** false

## Purpose

HBCE rende ricostruibile una Decisione digitale nel Tempo:

IDENTITY
→ AUTHORITY
→ SCOPE
→ INFORMATION
→ PREDICTION
→ DECISION
→ AUTHORIZATION
→ ACTION
→ CONSEQUENCE
→ COST
→ TRACE
→ VERIFICATION
→ CORRECTION

Domanda canonica:

> Chi ha deciso, con quale autorità, usando quali informazioni, attraverso quale sistema, con quale previsione, quale Costo e quale conseguenza?

## Separation invariants

IDENTIFIED != AUTHORIZED

AUTHENTICATED != AUTHORIZED

PREDICTED != DECIDED

DECIDED != AUTHORIZED

DECISION != ACTION

AI_OUTPUT != AUTHORITY

INTEGRITY != TRUTH

TECHNICAL_AUTHORIZATION != LEGITIMACY

PROCESS_COMPLETED != OUTCOME_SUCCESS

## Epistemic states

KNOWN
INFERRED
PREDICTED
UNKNOWN

Le quattro classi devono rimanere distinguibili.

UNKNOWN non può essere convertito implicitamente in KNOWN o INFERRED.

## Authentication

AUTHENTICATION_REQUIRES_SERVER_PROOF

authenticated=true richiede prova server-side valida.

Query, header, referer, metadata browser o identità sintetiche non possono creare autenticazione.

## Authority

AUTHORIZATION_REQUIRES_EXPLICIT_AUTHORITY

L'autorità deve essere attribuibile a:

actor
mandate
tenant
workspace
resource
operation
purpose
validity period
policy

CLIENT_INPUT_CANNOT_CREATE_AUTHORITY

AUTHENTICATED + OUT_OF_SCOPE = DENY

## Decision Evidence Record

Il record concettuale collega almeno:

operationId
actor
tenantId
workspaceId
authority
mission
evidenceRefs
epistemicState
modelVersion
prediction
uncertainty
alternatives
decision
authorization
humanReview
stopAuthority
expectedCost
action
evtRefs
opcRefs
outcome
actualCost
review
correction
timestamps

## Prediction boundary

MODEL_OUTPUT
→ PREDICTION
→ POLICY_EVALUATION
→ AUTHORIZED_DECISION
→ ACTION

MODEL_OUTPUT → ACTION è vietato senza policy e autorità esplicite.

PREDICTION_IS_NOT_DECISION

## Temporal boundary

PAST
→ TRACE
→ DATA
→ MODEL
→ PREDICTION
→ DECISION
→ CONSEQUENCE
→ NEW_PAST
→ RETROACTIVE_VERIFICATION
→ CORRECTION

PROBABILITY != DESTINY

Una previsione può modificare le condizioni del risultato che successivamente verrà osservato.

## Outcome and correction

OUTCOME_DOES_NOT_REWRITE_PRIOR_DECISION

RETROACTIVE_REVIEW_IS_APPEND_ONLY

CORRECTION_CREATES_NEW_TRACE

Il passato viene verificato, non riscritto.

## EVT / OPC / UNEBDO

EVT conserva eventi attribuibili.

OPC supporta integrità tecnica.

UNEBDO supporta continuità temporale.

Nessuno dei tre dimostra automaticamente verità, legittimità o correttezza.

EVIDENCE_INTEGRITY_DOES_NOT_IMPLY_TRUTH

## Multi-tenant

TENANT_BOUNDARIES_FAIL_CLOSED

WORKSPACE_BOUNDARIES_FAIL_CLOSED

Accesso cross-tenant o cross-workspace è negato salvo autorità esplicita verificata.

## Implementation sequence

A011 — Authentication Boundary
A012 — Authorization & Mandate
A013 — Tenant / Workspace Isolation
A014 — Decision Evidence Contract
A015 — EVT / OPC Evidence Chain
A016 — Outcome & Cost Record
A017 — Retroactive Verification
A018 — Corrective Decision Loop
A019 — Bank Vertical Slice

## Final invariant

HBCE deve poter ricostruire:

WHO
→ UNDER WHICH AUTHORITY
→ WITH WHICH INFORMATION
→ WHAT WAS PREDICTED
→ WHAT WAS DECIDED
→ WHO AUTHORIZED
→ WHAT HAPPENED
→ WHO PAID THE COST
→ WHAT TIME REVEALED
→ WHAT WAS CORRECTED

Se questa catena non è ricostruibile, il Decision Lifecycle è incompleto.

Engineering does not require infallibility.

It requires corrigibility.
