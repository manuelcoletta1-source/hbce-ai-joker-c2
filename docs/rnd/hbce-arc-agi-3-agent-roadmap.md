# HBCE ARC-AGI-3 Agent - Public R&D Roadmap

Status date: 2026-06-12
Project name: HBCE_ARC_AGI3_AGENT
Parent context: Addestramento & Programmazione AI JOKER-C2 / HBCE R&D
Mode: PUBLIC_RND_COMPETITION_BRANCH
Attached model: JOKER-C2 / MATRIX

## Canonical state

ARC_AGI3_BRANCH_ATTACHED_TO_JOKER_C2_MATRIX=true
projectName=HBCE_ARC_AGI3_AGENT
mode=PUBLIC_RND_COMPETITION_BRANCH
corePrivateExposure=false
legalCertification=false
opcBoundary=technical research trace only

## Strategic purpose

HBCE_ARC_AGI3_AGENT is the public R&D competition branch for ARC-AGI-3 / ARC Prize 2026.

The purpose is to build a competition-safe agentic reasoning system inspired by the JOKER-C2 / MATRIX architecture, without exposing the private HBCE, IPR, JOKER-C2 runtime or SaaS core.

## Public architecture

perception -> memory -> model -> goal -> plan -> action -> verification -> trace

## Milestones

- 2026-06-30: Milestone 1 - repository skeleton, task interface, trace format, baseline solver loop
- 2026-09-30: Milestone 2 - improved planning, world-state memory, verification loop, benchmark reporting
- 2026-11-02: Final submission - competition-ready package, reproducible run, final documentation

## Milestone 1 - 2026-06-30

Goal: create the public R&D repository structure and the first working baseline agent loop.

Deliverables:
- public repo plan
- README
- architecture note
- task input/output interface
- perception module stub
- memory module stub
- planner module stub
- verifier module stub
- trace schema
- baseline local runner
- no-private-core audit

## Milestone 2 - 2026-09-30

Goal: improve the agent loop from baseline execution to structured reasoning with state memory and verification.

Deliverables:
- state memory model
- hypothesis generation
- action ranking
- plan repair
- verification scoring
- failure analysis logs
- benchmark report
- reproducibility checklist

## Final submission - 2026-11-02

Goal: submit a public, competition-safe ARC-AGI-3 agent package.

Deliverables:
- final solver
- final README
- final architecture document
- reproducible run instructions
- public trace examples
- private-core exposure check
- legalCertification=false boundary statement

## Hard boundaries

- no private HBCE core code
- no private JOKER-C2 runtime code
- no IPR identity infrastructure exposure
- no production SaaS credentials
- no API keys
- no private datasets
- no internet-dependent evaluation logic
- no legal certification claims

## Operational markers

ARC_AGI3_PUBLIC_RND_ROADMAP_READY=true
ARC_AGI3_MILESTONE_1_TARGET=2026-06-30
ARC_AGI3_MILESTONE_2_TARGET=2026-09-30
ARC_AGI3_FINAL_SUBMISSION_TARGET=2026-11-02
ARC_AGI3_PRIVATE_CORE_EXPOSURE=false
