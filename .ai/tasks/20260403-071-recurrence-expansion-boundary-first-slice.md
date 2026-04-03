---
status: COMPLETE
owner: codex
---

# 20260403-071 Recurrence Expansion Boundary First Slice

## Goal

Introduce the first recurrence expansion boundary in the domain layer without implementing the full recurrence system.

## Inputs

- `packages/feasibility-core/RECURRING-SCHEDULING.md`
- `packages/feasibility-core/RECURRING-IMPLEMENTATION-QUEUE.md`
- `20260403-070-recurring-domain-types-first-slice.md`
- current domain/compiler layout

## What This Task Should Produce

Add a domain-side expansion entry point and its supporting result/error shape so recurrence expansion has an explicit home.

## Desired Output Shape

Prefer a small new module and export surface such as:

- `packages/feasibility-core/src/domain/recurrence.ts`
- export additions in `packages/feasibility-core/src/index.ts`

## Scope

First-pass boundary only:

- expansion entry-point function signature
- expansion result type
- expansion error type family
- no broad behavior beyond what is needed to make the boundary explicit

## Constraints

- do not widen primitive solver types
- do not fold recurrence into `compileDomain`
- do not implement the full exception model yet
- keep the expansion layer domain-side and finite

## Acceptance Criteria

- recurrence expansion has a clear module boundary
- the package exposes the boundary coherently
- existing build/typecheck/tests still pass
- the slice remains clearly smaller than “full recurrence support”

## Worker Guidance

- prefer explicit boundary and type clarity over behavior breadth
- if one very small first-pass behavior is needed, keep it to the minimum coherent slice
- do not reopen the settled decision that recurrence stays outside the primitive solver
