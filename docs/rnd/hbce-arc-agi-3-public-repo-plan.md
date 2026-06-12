# HBCE ARC-AGI-3 Agent - Public Repository Plan

Status date: 2026-06-12
Project name: HBCE_ARC_AGI3_AGENT
Parent context: Addestramento & Programmazione AI JOKER-C2 / HBCE R&D
Mode: PUBLIC_RND_COMPETITION_BRANCH
Attached model: JOKER-C2 / MATRIX

## Repository purpose

This document defines the public repository plan for HBCE_ARC_AGI3_AGENT, the ARC-AGI-3 / ARC Prize 2026 public R&D branch attached conceptually to JOKER-C2 / MATRIX.

The public repository must contain only competition-safe research code, documentation, examples and traces. It must not expose private HBCE, IPR, JOKER-C2 runtime, SaaS infrastructure, credentials or private datasets.

## Proposed public repository name

hbce-arc-agi-3-agent

## Canonical state

ARC_AGI3_BRANCH_ATTACHED_TO_JOKER_C2_MATRIX=true
projectName=HBCE_ARC_AGI3_AGENT
mode=PUBLIC_RND_COMPETITION_BRANCH
corePrivateExposure=false
legalCertification=false
opcBoundary=technical research trace only

## Public architecture

perception -> memory -> model -> goal -> plan -> action -> verification -> trace

## Proposed repository structure

README.md
LICENSE
docs/
docs/architecture.md
docs/boundary.md
docs/trace-format.md
src/
src/agent/
src/agent/perception.py
src/agent/memory.py
src/agent/model.py
src/agent/goal.py
src/agent/planner.py
src/agent/actions.py
src/agent/verifier.py
src/agent/trace.py
src/runner.py
tests/
tests/test_trace.py
tests/test_baseline_loop.py
examples/
examples/sample_tasks/
traces/
.gitignore
requirements.txt

## Allowed content

- public competition-safe agent code
- local-only baseline solver
- task parsing utilities
- state memory experiments
- planning experiments
- verification loop
- reproducible trace format
- public documentation
- public examples

## Forbidden content

- private HBCE core code
- private JOKER-C2 runtime code
- IPR identity infrastructure
- production SaaS credentials
- API keys
- private datasets
- internal database schemas
- internal memory records
- private API endpoints
- internet-dependent evaluation logic
- legal certification claims

## Milestone alignment

- 2026-06-30: public repo skeleton, baseline loop, trace format
- 2026-09-30: improved planning, state memory, verification, benchmark reporting
- 2026-11-02: final competition-safe submission package

## Initial implementation rule

The first implementation must be intentionally minimal: deterministic baseline loop, local input/output, JSON trace, no network access and no private dependencies.

## Operational markers

ARC_AGI3_PUBLIC_REPO_PLAN_READY=true
ARC_AGI3_PUBLIC_REPO_NAME=hbce-arc-agi-3-agent
ARC_AGI3_REPO_BOUNDARY=no_private_core_no_keys_no_internet_eval
ARC_AGI3_READY_FOR_PUBLIC_REPO_SKELETON=true
