---
status: COMPLETE
owner: codex
---

# 20260403-074 Weekly Recurring Shift Expansion First Behavior

## Goal

Implement the smallest real recurrence behavior slice: expand one weekly recurring shift template across a bounded horizon.

## Inputs

- `packages/feasibility-core/RECURRING-SCHEDULING.md`
- `packages/feasibility-core/RECURRING-IMPLEMENTATION-QUEUE.md`
- `packages/feasibility-core/RECURRING-FIRST-CASES.md`
- `20260403-070-recurring-domain-types-first-slice.md`
- `20260403-071-recurrence-expansion-boundary-first-slice.md`

## What This Task Should Produce

Add first-pass recurrence expansion behavior for recurring shift templates only.

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/recurrence.ts`
- tests in `packages/feasibility-core/src/tests/recurrence.test.ts`

## Scope

In scope:

- weekly recurring shift templates
- explicit finite horizon
- deterministic concrete shift generation
- minimal success path for generated shifts

Out of scope for this slice:

- recurring need expansion
- recurring availability expansion
- exception application
- integration into `compileDomain`
- broader recurrence rule families

## Constraints

- keep recurrence domain-side
- do not widen primitive solver types
- do not mix this slice with recurring need or exception support
- keep id generation deterministic and explicit

## Acceptance Criteria

- a weekly recurring shift template can expand into concrete shifts across a bounded horizon
- generated ids are deterministic
- invalid/no-horizon behavior remains explicit
- existing build/typecheck/tests still pass

## Worker Guidance

- make the first behavior slice obviously smaller than “recurrence support”
- optimize for clarity and determinism
- if a design choice is forced, bias toward the simplest weekly staffing use case
