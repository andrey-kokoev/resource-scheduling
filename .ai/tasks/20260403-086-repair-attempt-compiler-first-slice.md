---
status: COMPLETE
owner: codex
---

# 20260403-086 Repair Attempt Compiler First Slice

## Goal

Introduce the first code-level repair-attempt compiler that turns copied baseline workflow state into one concrete solve attempt.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `20260403-079-repair-orchestration-around-solver.md`
- `20260403-080-copied-baseline-state-representation.md`
- `20260403-081-repair-attempt-compilation.md`
- `20260403-084-hard-lock-domain-types-and-preassignment-boundary.md`
- `20260403-085-copied-baseline-workflow-types-first-slice.md`

## What This Task Should Produce

Add the first repair-attempt compilation boundary in code.

## Desired Output Shape

Prefer a small new module such as:

- `packages/feasibility-core/src/domain/repair-attempt.ts`

plus any necessary export and test updates.

## Scope

In scope:

- repair-attempt stage enum or equivalent
- compiler input/output types
- deterministic compilation of:
  - hard locks
  - copied baseline assignments
  - deltas
  - open gaps
into one `ConcreteSolveAttempt`

Out of scope:

- multi-stage orchestration loop
- retention optimization logic
- solver behavior changes

## Constraints

- keep the inner feasibility solver unchanged
- keep this slice deterministic and concrete
- if a stage choice is needed, start with the strongest retention stage only

## Acceptance Criteria

- a first repair-attempt compiler exists in code
- it produces one concrete attempt object coherently
- existing build/typecheck/tests still pass
- the slice remains clearly smaller than full repair orchestration
