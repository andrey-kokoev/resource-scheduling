---
status: COMPLETE
owner: codex
---

# 20260403-073 First Recurrence Expansion Case Design

## Goal

Design the smallest useful recurrence expansion cases to drive the first behavior slice after the expansion boundary lands.

## Inputs

- `packages/feasibility-core/RECURRING-SCHEDULING.md`
- `packages/feasibility-core/RECURRING-IMPLEMENTATION-QUEUE.md`
- `20260403-064-recurring-domain-template-model.md`
- `20260403-065-recurrence-expansion-algorithm.md`
- `20260403-066-recurrence-expansion-validation-and-failure-semantics.md`
- `20260403-071-recurrence-expansion-boundary-first-slice.md`

## What This Task Should Produce

One small design artifact that selects the first minimal recurrence behavior cases for implementation.

## Desired Output Shape

Prefer one short durable artifact such as:

- `packages/feasibility-core/RECURRING-FIRST-CASES.md`

## Scope

Pick the minimum coherent behavior slice, for example:

- one weekly recurring shift template shape
- one need-template attachment shape
- one bounded horizon expansion case
- one failure case

## Constraints

- do not implement recurrence
- do not expand into a broad scenario matrix yet
- keep the first behavior slice intentionally narrow

## Acceptance Criteria

- the first implementation cases are explicit
- each case has a clear purpose
- scope is small enough to implement without reopening the recurrence boundary
