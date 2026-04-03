---
status: PLANNED
owner: unassigned
---

# 20260403-094 Baseline Vs Final Assignment Diff First Slice

## Goal

Introduce the first stable baseline-vs-final assignment diff shape for repaired schedules.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `packages/feasibility-core/BASELINE-REPAIR-REVIEW.md`
- `20260403-091-caller-facing-repair-api-first-slice.md`
- `20260403-092-stable-repair-report-first-slice.md`
- current public repair API and report shape in `packages/feasibility-core/src/domain/repair.ts`

## What This Task Should Produce

Add a first public diff shape that compares:

- copied baseline assignments
- final repaired assignments

and makes the assignment-level changes explicit.

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/repair.ts`
- focused tests

## Scope

In scope:

- one public assignment-diff item type
- one public diff collection on top of the current repair result/report
- assignment-level statuses such as:
  - preserved exactly
  - changed assignee
  - released / not carried through
  - newly assigned outside baseline

Out of scope:

- rich UI rendering
- shift-level calendar diff visualizations
- optimization or scoring

## Constraints

- keep the inner feasibility solver unchanged
- keep the diff deterministic and caller-facing
- avoid exposing raw internal attempt structures if a narrower diff is enough

## Acceptance Criteria

- callers can see concrete baseline-vs-final assignment changes
- the diff is stable enough to support later UI work
- existing build/typecheck/tests still pass
