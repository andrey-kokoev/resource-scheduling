---
status: COMPLETE
owner: codex
---

# 20260403-070 Recurring Domain Types First Slice

## Goal

Introduce the first recurrence implementation slice as pure domain types only.

## Inputs

- `packages/feasibility-core/RECURRING-SCHEDULING.md`
- `packages/feasibility-core/RECURRING-IMPLEMENTATION-QUEUE.md`
- `061` through `069`
- current domain type layer in `packages/feasibility-core/src/domain`

## What This Task Should Produce

Add a first-pass recurrence type surface to the domain layer, without expansion behavior.

## Desired Output Shape

Prefer updates in:

- `packages/feasibility-core/src/domain/types.ts`
- `packages/feasibility-core/src/index.ts`
- package docs only as needed for coherence

## Scope

First-pass types only:

- `RecurrenceRule`
- `ExpansionHorizon`
- `RecurringShiftTemplate`
- `RecurringNeedTemplate`
- `RecurringAvailabilityTemplate`
- first-pass recurrence exception record types

## Constraints

- do not implement recurrence expansion
- do not widen primitive solver types
- do not change `compileDomain` behavior yet
- keep recurrence strictly domain-side

## Acceptance Criteria

- recurrence types exist in the domain layer
- the package export surface exposes them coherently
- no recurrence runtime behavior is added
- existing build/typecheck/tests still pass

## Worker Guidance

- keep the first slice small and type-oriented
- optimize for later expansion work, not completeness
- do not reopen the settled boundary: recurrence stays domain-side and finite
