---
status: PLANNED
owner: unassigned
---

# 20260403-062 Recurrence As Compilation Boundary

## Goal

Determine whether recurrence should remain entirely a domain-side compilation concern rather than becoming a first-class solver-semantic concept.

## Why

The current package boundary is built around concrete:

- shifts
- needs
- availability windows
- rules over concrete intervals

That suggests recurrence may be best treated as:

- authoring convenience
- templating
- finite horizon expansion

rather than as a new primitive concept inside the solver.

## Core Question

Can recurring schedules be represented cleanly as:

- recurring templates
- plus exceptions
- compiled into concrete `DomainInput`

without widening the primitive kernel?

## What This Task Should Clarify

1. Which recurring constructs compile cleanly into current concrete domain input?
- recurring shifts
- recurring needs
- recurring availability
- recurring rule applications

2. Which constructs do not compile cleanly without semantic widening?

3. What finite horizon assumptions are required for compilation?

4. What exception/override model is needed at the domain layer?

5. What information would be lost by compiling recurrence away?

## Constraints

- assume the current solver prefers concrete finite input
- prefer keeping recurrence outside the primitive kernel unless there is a compelling semantic reason not to
- do not implement recurrence in this task

## Acceptance Criteria

- a clear recommendation is made:
  - recurrence stays at the compilation boundary
  - or recurrence requires a genuine package-boundary expansion
- the recommendation is justified against the current concrete solver model
