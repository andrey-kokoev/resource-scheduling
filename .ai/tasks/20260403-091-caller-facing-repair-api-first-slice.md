---
status: COMPLETE
owner: codex
---

# 20260403-091 Caller-Facing Repair API First Slice

## Goal

Introduce the first caller-facing repair API that wraps the current baseline-repair pipeline behind one coherent entry point.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `packages/feasibility-core/BASELINE-REPAIR-REVIEW.md`
- `20260403-084-hard-lock-domain-types-and-preassignment-boundary.md`
- `20260403-085-copied-baseline-workflow-types-first-slice.md`
- `20260403-086-repair-attempt-compiler-first-slice.md`
- `20260403-087-repair-orchestrator-skeleton-first-slice.md`
- `20260403-088-first-relaxation-ladder-second-stage.md`
- `20260403-089-third-stage-full-release.md`

## What This Task Should Produce

Add one public repair entry point that:

- accepts copied baseline workflow state
- runs the current repair ladder
- returns one coherent workflow-level result object

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/index.ts`
- a small public-facing module such as:
  - `packages/feasibility-core/src/domain/repair.ts`
- focused tests

## Scope

In scope:

- one public repair function
- one public repair result shape
- strongest -> second -> full-release flow through the existing machinery

Out of scope:

- richer search beyond the current ladder
- presentation-oriented reporting
- UI integration

## Constraints

- keep the inner feasibility solver unchanged
- avoid exposing too many internal helper types if a narrower surface is enough
- keep this slice user-callable, not just another internal layer

## Acceptance Criteria

- callers have one coherent repair entry point
- the public result shape is understandable
- existing build/typecheck/tests still pass
