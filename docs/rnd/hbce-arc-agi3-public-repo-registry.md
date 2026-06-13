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

<!-- ARC_AGI3_MILESTONE_3_CLOSURE_REGISTRY -->
## ARC-AGI-3 Milestone #3 Closure — CLOSED PASS

Status date: 2026-06-13  
Parent repository: hbce-ai-joker-c2  
Public repository: hbce-arc-agi3-agent  
Public repository URL: https://github.com/manuelcoletta1-source/hbce-arc-agi3-agent  
Public repository local path: `/home/manuelcoletta1/github/hbce-arc-agi3-agent`  
Parent registry local path: `/home/manuelcoletta1/github/hbce-ai-joker-c2/docs/rnd/hbce-arc-agi3-public-repo-registry.md`  

### Closure status

Milestone #3 has been completed, closed, committed and pushed in the public ARC-AGI-3 repository.

- Milestone: `Milestone #3`
- Closure status: `MILESTONE_3_CLOSED_PASS`
- Closure commit: `0ca0df9 Close ARC AGI3 milestone 3`
- Branch state after closure: `main...origin/main`
- Final test suite: `208 passed`
- Closure ID: `MILESTONE-3-CLOSURE-B110830EA9E2`
- Dry-run release package ID: `MILESTONE-3-DRY-RUN-RELEASE-PACKAGE-11E2F3C9D396`
- Public readiness audit ID: `PUBLIC-READINESS-AUDIT-C37C53F41756`
- Local submission candidate ID: `LOCAL-SUBMISSION-CANDIDATE-E226DE7C08C2`
- Report index ID: `REPORT-INDEX-380079FFB6E9`
- Release mode: `MILESTONE_3_LOCAL_DRY_RUN_RELEASE_PACKAGE_ONLY`
- Submission mode: `LOCAL_DRY_RUN_ONLY`

### Closed task chain

| Task | Module | Commit | Status |
|---:|---|---|---|
| 1 | Dataset Sample Registry v1 | `afdd414` | PASS |
| 2 | Batch Benchmark Runner v1 | `f0d82d7` | PASS |
| 3 | Multi-Task Outcome Aggregator v1 | `77034e1` | PASS |
| 4 | Strategy Selection Index v1 | `7cd82bf` | PASS |
| 5 | Failure Taxonomy v1 | `d5c5151` | PASS |
| 6 | Report Index Generator v1 | `0d8ffd3` | PASS |
| 7 | Local Submission Candidate Builder v1 | `291d092` | PASS |
| 8 | Public Readiness Audit v1 | `2f84282` | PASS |
| 9 | Milestone #3 Dry-Run Release Package v1 | `c503af8` | PASS |
| 10 | Milestone #3 Report / Closure v1 | `0ca0df9` | PASS |

### Closure metrics

- `task_count=10`
- `completed_task_count=10`
- `failed_task_count=0`
- `closure_blocking_issue_count=0`
- `closure_warning_count=0`
- `package_source_artifact_count=24`
- `package_total_artifact_count=26`
- `tests_passed_recorded=198`
- `final_test_suite_passed=208`
- `ready_for_next_milestone=true`
- `ready_for_kaggle_submission=false`
- `kaggle_submission_sent=false`

### Boundary

The public ARC-AGI-3 branch remains a deterministic public R&D competition branch. It does not expose private HBCE/JOKER-C2 runtime logic, private IPR memory, credentials, API keys, or external API dependency.

- `public_safe=true`
- `deterministic=true`
- `local_only=true`
- `dry_run_only=true`
- `kaggle_submission_sent=false`
- `external_api_dependency=false`
- `private_core_exposure=false`
- `legalCertification=false`
- `opcBoundary=technical research trace only`

### Operational markers

ARC_AGI3_MILESTONE_3_PARENT_REGISTRY_READY=true  
ARC_AGI3_MILESTONE_3_PARENT_REPO=hbce-ai-joker-c2  
ARC_AGI3_MILESTONE_3_PUBLIC_REPO=hbce-arc-agi3-agent  
ARC_AGI3_MILESTONE_3_PUBLIC_REPO_URL=https://github.com/manuelcoletta1-source/hbce-arc-agi3-agent  
ARC_AGI3_MILESTONE_3_STATUS=MILESTONE_3_CLOSED_PASS  
ARC_AGI3_MILESTONE_3_CLOSURE_COMMIT=0ca0df9  
ARC_AGI3_MILESTONE_3_CLOSURE_ID=MILESTONE-3-CLOSURE-B110830EA9E2  
ARC_AGI3_MILESTONE_3_DRY_RUN_RELEASE_PACKAGE_ID=MILESTONE-3-DRY-RUN-RELEASE-PACKAGE-11E2F3C9D396  
ARC_AGI3_MILESTONE_3_PUBLIC_READINESS_AUDIT_ID=PUBLIC-READINESS-AUDIT-C37C53F41756  
ARC_AGI3_MILESTONE_3_LOCAL_SUBMISSION_CANDIDATE_ID=LOCAL-SUBMISSION-CANDIDATE-E226DE7C08C2  
ARC_AGI3_MILESTONE_3_REPORT_INDEX_ID=REPORT-INDEX-380079FFB6E9  
ARC_AGI3_MILESTONE_3_TASK_COUNT=10  
ARC_AGI3_MILESTONE_3_COMPLETED_TASK_COUNT=10  
ARC_AGI3_MILESTONE_3_FAILED_TASK_COUNT=0  
ARC_AGI3_MILESTONE_3_FINAL_TESTS_PASSED=208  
ARC_AGI3_MILESTONE_3_READY_FOR_NEXT_MILESTONE=true  
ARC_AGI3_MILESTONE_3_READY_FOR_KAGGLE_SUBMISSION=false  
ARC_AGI3_KAGGLE_SUBMISSION_SENT=false  
ARC_AGI3_EXTERNAL_API_DEPENDENCY=false  
ARC_AGI3_PRIVATE_CORE_EXPOSURE=false  
ARC_AGI3_LEGAL_CERTIFICATION=false  

<!-- /ARC_AGI3_MILESTONE_3_CLOSURE_REGISTRY -->

