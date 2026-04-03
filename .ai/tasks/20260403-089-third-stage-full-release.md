---
status: COMPLETE
owner: codex
---

# 20260403-089 Third Stage Full Release

## Goal

Add the third-stage fallback in the baseline-repair ladder:

- if `keep-candidate-shift-position` fails
- and `keep-candidate-shift` fails
- then release retention entirely and solve the remaining open state under only hard locks and hard constraints

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `20260403-078-baseline-retention-hierarchy-de-arbitrarization.md`
- `20260403-079-repair-orchestration-around-solver.md`
- `20260403-081-repair-attempt-compilation.md`
- `20260403-086-repair-attempt-compiler-first-slice.md`
- `20260403-087-repair-orchestrator-skeleton-first-slice.md`
- `20260403-088-first-relaxation-ladder-second-stage.md`

## What This Task Should Produce

Add the final release stage in code so the repair orchestrator can fall back to ordinary gap-filling when both retention stages fail.

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/repair-attempt.ts`
- `packages/feasibility-core/src/domain/repair-orchestrator.ts`
- focused tests

## Scope

In scope:

- a third stage representing full retention release
- deterministic compile behavior for that stage
- orchestrator fallback from second stage to full release
- result shape showing which stage ultimately succeeded or failed

Out of scope:

- richer policy tuning
- scoring/optimization
- advanced presentation/reporting beyond what is needed to expose the stage

## Constraints

- keep the inner feasibility solver unchanged
- keep the ladder explicit and finite
- do not introduce unrelated repair features

## Acceptance Criteria

- the orchestrator tries strongest stage, then second stage, then full release
- the full-release stage is visible in the workflow result
- existing build/typecheck/tests still pass
