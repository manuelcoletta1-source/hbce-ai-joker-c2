# HBCE ARC-AGI-3 Public Repository Registry

Status date: 2026-06-13
Project context: HBCE / JOKER-C2 / MATRIX / Kaggle ARC-AGI-3
Mode: PUBLIC_RND_REPOSITORY_REGISTRY

## Canonical public repository

Repository name: hbce-arc-agi3-agent
Repository URL: https://github.com/manuelcoletta1-source/hbce-arc-agi3-agent
Local path: /home/manuelcoletta1/github/hbce-arc-agi3-agent
Branch: main

## Published commits

- 181d6e8 Add ARC AGI3 canonical smoke baseline
- 9387cf1 Initialize HBCE ARC-AGI-3 public research branch

## Current technical state

The public ARC-AGI-3 repository has been created and pushed to GitHub.

The repository contains:
- public README and R&D boundary
- ARC-AGI-3 smoke baseline
- trace-first agent loop
- pytest smoke tests
- local runner
- public-games smoke runner
- package-submission smoke check

## Verified baseline

Local verification before public push:
- pytest: 5 passed
- scripts/run_local.py: ARC_AGI3_SMOKE_AGENT_READY
- scripts/run_public_games.py: PUBLIC_GAMES_SMOKE_READY
- scripts/package_submission.py: PACKAGE_SUBMISSION_SMOKE_READY

## Strategic role

This repository is the public benchmark implementation branch for the HBCE ARC-AGI-3 track.

It connects the JOKER-C2 / MATRIX research model to a public, offline, reproducible agentic benchmark workflow.

Its role is not to expose private HBCE/JOKER-C2 core code.
Its role is to provide benchmark-grade public evidence: agent traces, smoke tests, planning structure, verification and reproducible R&D documentation.

## Boundary

- no private HBCE/JOKER-C2 runtime code
- no private IPR memory
- no API keys
- no proprietary full-text corpus
- no legal certification material
- no weaponization
- no operational engineering
- legalCertification=false
- opcBoundary=technical research trace only

## Operational markers

HBCE_ARC_AGI3_PUBLIC_REPO_REGISTRY_READY=true
ARC_AGI3_PUBLIC_REPO_CREATED=true
ARC_AGI3_PUBLIC_REPO_PUSHED=true
ARC_AGI3_PUBLIC_REPO_URL=https://github.com/manuelcoletta1-source/hbce-arc-agi3-agent
ARC_AGI3_CANONICAL_SMOKE_BASELINE_PUBLIC=true
ARC_AGI3_TESTS_5_PASSED=true
ARC_AGI3_PRIVATE_CORE_EXPOSURE=false
legalCertification=false
