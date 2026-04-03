---
status: COMPLETE
owner: codex
---

# 20260403-088 First Relaxation Ladder Second Stage

## Goal

Add the first real relaxation step in the baseline-repair workflow:

- first try `keep-candidate-shift-position`
- if infeasible, then try `keep-candidate-shift`

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `20260403-078-baseline-retention-hierarchy-de-arbitrarization.md`
- `20260403-079-repair-orchestration-around-solver.md`
- `20260403-081-repair-attempt-compilation.md`
- `20260403-086-repair-attempt-compiler-first-slice.md`
- `20260403-087-repair-orchestrator-skeleton-first-slice.md`

## What This Task Should Produce

Add the second-stage fallback in code so the repair orchestrator can relax from strongest retention to a weaker retention stage.

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/repair-attempt.ts`
- `packages/feasibility-core/src/domain/repair-orchestrator.ts`
- focused tests

## Scope

In scope:

- a second retention stage representing `keep-candidate-shift`
- deterministic compile behavior for that stage
- orchestrator fallback from strongest stage to second stage
- result shape showing which stage succeeded or failed

Out of scope:

- third-stage full release
- richer policy tuning
- advanced reporting/presentation beyond what is needed to make the stage visible

## Constraints

- keep the inner feasibility solver unchanged
- keep the relaxation ladder explicit and small
- do not introduce optimization or scoring

## Acceptance Criteria

- the orchestrator tries strongest stage first, then second stage if needed
- the second stage is visible in the workflow result
- existing build/typecheck/tests still pass
