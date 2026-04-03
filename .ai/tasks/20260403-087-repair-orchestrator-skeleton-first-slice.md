---
status: COMPLETE
owner: codex
---

# 20260403-087 Repair Orchestrator Skeleton First Slice

## Goal

Introduce the first outer-loop repair orchestrator skeleton around the existing feasibility solver.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `20260403-079-repair-orchestration-around-solver.md`
- `20260403-081-repair-attempt-compilation.md`
- `20260403-084-hard-lock-domain-types-and-preassignment-boundary.md`
- `20260403-085-copied-baseline-workflow-types-first-slice.md`
- `20260403-086-repair-attempt-compiler-first-slice.md`

## What This Task Should Produce

Add the first code-level repair orchestrator skeleton that:

- takes copied baseline workflow state
- compiles one strongest-stage repair attempt
- invokes the existing feasibility solver
- returns a workflow-level result shape

## Desired Output Shape

Prefer a small new module such as:

- `packages/feasibility-core/src/domain/repair-orchestrator.ts`

plus any necessary export and test updates.

## Scope

In scope:

- orchestrator input/output types
- strongest-stage only
- single-attempt compile + solve flow
- workflow-level result shape carrying:
  - attempt stage
  - attempt compilation result
  - solver result

Out of scope:

- multi-stage relaxation loop
- retention-stage fallback
- advanced reporting/presentation layers

## Constraints

- keep the inner feasibility solver unchanged
- keep this slice obviously smaller than full repair orchestration
- do not introduce recurrence work here

## Acceptance Criteria

- a first repair orchestrator skeleton exists in code
- it runs one strongest-stage compile + solve path coherently
- existing build/typecheck/tests still pass
