# HBCE ARC-AGI-3 Agent - Public Skeleton Manifest

Status date: 2026-06-12
Project name: HBCE_ARC_AGI3_AGENT
Public repository name: hbce-arc-agi-3-agent
Parent context: Addestramento & Programmazione AI JOKER-C2 / HBCE R&D
Mode: PUBLIC_RND_COMPETITION_BRANCH
Attached model: JOKER-C2 / MATRIX

## Purpose

This manifest defines the initial public repository skeleton for HBCE_ARC_AGI3_AGENT.

The skeleton must be safe for public R&D and ARC-AGI-3 competition work. It must not expose private HBCE, IPR, JOKER-C2 runtime, SaaS credentials, API keys, internal database schemas or private datasets.

## Canonical boundary

ARC_AGI3_BRANCH_ATTACHED_TO_JOKER_C2_MATRIX=true
projectName=HBCE_ARC_AGI3_AGENT
mode=PUBLIC_RND_COMPETITION_BRANCH
corePrivateExposure=false
legalCertification=false
opcBoundary=technical research trace only

## Public architecture

perception -> memory -> model -> goal -> plan -> action -> verification -> trace

## Required public skeleton

README.md
LICENSE
.gitignore
requirements.txt
docs/architecture.md
docs/boundary.md
docs/trace-format.md
src/runner.py
src/agent/__init__.py
src/agent/perception.py
src/agent/memory.py
src/agent/model.py
src/agent/goal.py
src/agent/planner.py
src/agent/actions.py
src/agent/verifier.py
src/agent/trace.py
tests/test_trace.py
tests/test_baseline_loop.py
examples/sample_tasks/.gitkeep
traces/.gitkeep

## Initial module roles

- perception.py: parse task input into an internal state representation
- memory.py: store local task-state history without external persistence
- model.py: hold local world-state approximation and hypothesis state
- goal.py: extract target condition from the task
- planner.py: generate candidate plans
- actions.py: define allowed local actions
- verifier.py: check whether candidate output satisfies task constraints
- trace.py: produce reproducible JSON traces
- runner.py: execute the baseline loop locally

## Forbidden files and content

- private HBCE core code
- private JOKER-C2 runtime code
- IPR identity infrastructure
- production SaaS credentials
- API keys
- .env files
- private datasets
- internal database schemas
- internal memory records
- private API endpoints
- internet-dependent evaluation logic
- legal certification claims

## First skeleton implementation rule

The first public skeleton must be minimal, local-only and deterministic.

No network calls, no database calls, no private dependency imports, no hidden credentials and no production runtime hooks are allowed.

## Operational markers

ARC_AGI3_PUBLIC_SKELETON_MANIFEST_READY=true
ARC_AGI3_PUBLIC_REPO_NAME=hbce-arc-agi-3-agent
ARC_AGI3_SKELETON_BOUNDARY=no_private_core_no_keys_no_internet_eval
ARC_AGI3_READY_FOR_PUBLIC_REPO_CREATION=true
