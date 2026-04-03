---
status: COMPLETE
owner: codex
---

# 20260403-084 Hard Lock Domain Types And Preassignment Boundary

## Goal

Start the first real implementation slice on the baseline-repair path by introducing hard-lock types and the pre-assignment boundary they imply.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `20260403-077-lock-semantics-and-solver-boundary.md`
- `20260403-080-copied-baseline-state-representation.md`
- `20260403-081-repair-attempt-compilation.md`
- `20260403-083-baseline-repair-vs-recurrence-priority-decision.md`

## What This Task Should Produce

Add the first code-level lock slice focused on:

- hard lock domain types
- pre-assigned assignment representation
- boundary types for passing hard pre-assignments into a concrete solve attempt

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/types.ts`
- related domain/workflow type files if needed
- `packages/feasibility-core/src/index.ts`

## Scope

In scope:

- hard lock record/type
- pre-assigned assignment type
- first-pass boundary shape for solve attempts that include hard pre-assignments

Out of scope:

- retention hierarchy behavior
- repair orchestration
- lock-aware solver behavior changes beyond boundary/type introduction

## Constraints

- keep the current feasibility solver concrete and finite
- do not smuggle retention into lock semantics
- keep this slice small and type-oriented where possible

## Acceptance Criteria

- hard-lock and pre-assignment types exist coherently
- the package export surface exposes them coherently
- no broad repair behavior is implemented yet
- existing build/typecheck/tests still pass
