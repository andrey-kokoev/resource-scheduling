---
status: COMPLETE
owner: Herschel
---

# 20260403-092 Stable Repair Report First Slice

## Goal

Introduce the first stable repair report shape so callers can understand how a repaired schedule differs from the copied baseline.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `packages/feasibility-core/BASELINE-REPAIR-REVIEW.md`
- `20260403-091-caller-facing-repair-api-first-slice.md`
- current public repair API in `packages/feasibility-core/src/domain/repair.ts`

## What This Task Should Produce

Add a first public repair report shape that summarizes:

- which repair stage was selected
- whether the final outcome was feasible
- which baseline assignments were preserved exactly
- which were degraded or released
- which needs remain open or infeasible

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/repair.ts`
- focused tests
- docs only if needed for coherence

## Scope

In scope:

- one stable public report/result subtype
- baseline-vs-final comparison summary
- focused regression test for the public report shape

Out of scope:

- rich UI formatting
- advanced explanations/presentation
- optimization/scoring

## Constraints

- keep the inner feasibility solver unchanged
- avoid exposing too many internal attempt details if a narrower public report is enough
- optimize for caller usefulness over completeness

## Acceptance Criteria

- callers receive a stable repair report shape
- the report makes baseline preservation vs degradation visible
- existing build/typecheck/tests still pass
