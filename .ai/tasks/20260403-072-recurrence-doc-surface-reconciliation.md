---
status: COMPLETE
owner: codex
---

# 20260403-072 Recurrence Doc Surface Reconciliation

## Goal

Keep the recurrence-facing docs and package surface aligned with the new first code slice.

## Inputs

- `packages/feasibility-core/RECURRING-SCHEDULING.md`
- `packages/feasibility-core/RECURRING-IMPLEMENTATION-QUEUE.md`
- `20260403-070-recurring-domain-types-first-slice.md`
- `20260403-071-recurrence-expansion-boundary-first-slice.md`
- current package docs and feature/boundary pages

## What This Task Should Produce

A small reconciliation pass that makes explicit:

- recurrence domain types now exist
- recurrence expansion is still not available as end-user behavior
- recurrence remains domain-side and planned/in-progress rather than available

## Desired Output Shape

Prefer updates to existing surfaces:

- `packages/feasibility-core/README.md`
- `apps/feasibility-playground/feature-matrix.html`
- `apps/feasibility-playground/boundary.html`
- `apps/feasibility-playground/docs.html`

## Constraints

- do not implement recurrence behavior
- do not widen semantics
- keep user-facing language accurate and conservative

## Acceptance Criteria

- docs do not imply recurrence is fully available
- docs do reflect that recurrence now has domain-side types/boundary work in place
- the external surface stays coherent with the current code state
