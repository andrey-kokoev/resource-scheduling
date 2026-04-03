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

## First Pass

### Recommended answer

Recurrence should stay at the **domain compilation boundary** unless and until a concrete use case proves that compilation loses solver-relevant semantics.

### Why this fits the current solver

The current solver is built around:

- concrete shifts
- concrete needs
- concrete availability windows
- concrete hard constraints over intervals

That means the solver already expects:

- finite horizon input
- concrete interval arithmetic
- no template semantics during search

Recurrence does not currently appear to add a new primitive feasibility relation.
It mostly adds a way to author or generate repeated concrete domain instances.

### Clean compilation model

Treat recurrence as:

1. recurring templates
2. bounded expansion over an explicit horizon
3. exception application
4. generation of ordinary concrete `DomainInput`

That keeps the primitive kernel unchanged.

### What compiles cleanly

These should compile cleanly into current concrete input:

- recurring shifts
- recurring needs
- recurring availability windows
- recurring rule attachments

provided there is:

- an explicit finite horizon
- a coherent exception model

### What would force reconsideration

Recurrence would need stronger package-boundary support only if one of these becomes solver-relevant:

- optimization over recurrence patterns rather than concrete instances
- constraints defined over the template layer itself
- infinite/rolling semantics that cannot be reduced to a finite solve horizon
- explanation requirements that must preserve template identity in a first-class way during solving

### Current recommendation

Do **not** widen the primitive solver for recurrence now.

The next modeling work should stay at the domain layer:

- define recurrence templates
- define finite horizon expansion
- define exception precedence
