# HBCE ARC-AGI-3 Agent - Public R&D Branch

Status date: 2026-06-12
Project name: HBCE_ARC_AGI3_AGENT
Parent context: Addestramento & Programmazione AI JOKER-C2 / HBCE R&D
Branch mode: PUBLIC_RND_COMPETITION_BRANCH

## Canonical attachment state

ARC_AGI3_BRANCH_ATTACHED_TO_JOKER_C2_MATRIX=true
projectName=HBCE_ARC_AGI3_AGENT
parentContext=Addestramento & Programmazione AI JOKER-C2 / HBCE R&D
mode=PUBLIC_RND_COMPETITION_BRANCH
corePrivateExposure=false
legalCertification=false
opcBoundary=technical research trace only

## Purpose

HBCE_ARC_AGI3_AGENT is the public R&D competition branch for ARC-AGI-3 / ARC Prize 2026.

The branch is attached conceptually to the JOKER-C2 / MATRIX model as a public research architecture, without exposing private HBCE, IPR, JOKER-C2 or SaaS core components.

## Public architecture model

perception -> memory -> model -> goal -> plan -> action -> verification -> trace

## MATRIX-derived research principles

- state observation
- task memory
- world-model approximation
- goal extraction
- plan generation
- action proposal
- result verification
- reproducible trace

## Private-core boundary

- no private HBCE core code
- no private JOKER-C2 runtime code
- no IPR identity infrastructure exposure
- no production SaaS credentials
- no API keys
- no private datasets
- no internet-dependent evaluation logic
- no legal certification claims

## Evaluation boundary

corePrivateExposure=false
legalCertification=false
opcBoundary=technical research trace only
internetAccessDuringEvaluation=false
privateCredentialUse=false

## Operational status

ARC_AGI3_BRANCH_STATUS=ATTACHED_TO_JOKER_C2_MATRIX
ARC_AGI3_PUBLIC_RND_BRANCH=READY_FOR_REPO_PLANNING
ARC_AGI3_PRIVATE_CORE_EXPOSURE=FALSE
