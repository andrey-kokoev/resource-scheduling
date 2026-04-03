---
status: COMPLETE
owner: codex
---

# 20260403-067 Recurring Scheduling Boundary Proposal

## Goal

Consolidate the recurring-scheduling PDA cluster into one coherent boundary proposal artifact.

## Inputs

This task should synthesize:

- `061` recurring scheduling de-arbitrarization
- `062` recurrence as compilation boundary
- `063` recurrence exception semantics
- `064` recurring domain template model
- `065` recurrence expansion algorithm
- `066` recurrence expansion validation and failure semantics

## What This Task Should Produce

One clear proposal artifact that explains:

- why recurrence stays at the domain layer
- the recurring template model
- horizon semantics
- exception semantics
- deterministic expansion into concrete `DomainInput`
- separation between expansion failure and solver infeasibility

## Desired Output Shape

Prefer one durable artifact such as:

- `RECURRING-SCHEDULING.md`

or equivalent, placed where it is easy to find alongside the existing package-boundary docs.

## Constraints

- do not implement recurrence
- do not reopen already-settled first-pass positions without a strong reason
- optimize for coherence and decision-readiness

## Acceptance Criteria

- a reader can understand the proposed recurring-scheduling boundary end to end
- the proposal is coherent with the current primitive solver boundary
- the artifact is strong enough to drive later implementation-task generation

## First Pass Outline

### 1. Framing

Recurring scheduling is not proposed as a primitive solver concept.

It is proposed as a **domain-layer template and expansion boundary** that compiles into ordinary finite concrete `DomainInput`.

### 2. Boundary recommendation

Keep recurrence at the domain layer:

- recurring shift templates
- recurring need templates
- recurring availability templates
- recurrence rules
- exceptions / overrides
- finite expansion horizon

Do not widen the primitive solver with recurrence-aware semantics in the first pass.

### 3. Recurring template model

Proposed template objects:

- `RecurringShiftTemplate`
- `RecurringNeedTemplate`
- `RecurringAvailabilityTemplate`

Minimal recurrence rule:

- weekly frequency
- optional interval
- weekday set

### 4. Horizon semantics

Expansion is always finite.

Use an explicit horizon object:

- `expandFrom`
- `expandUntil`

Templates only emit occurrences inside the intersection of:

- template active range
- explicit horizon

### 5. Exception semantics

First-pass exception kinds:

- `skip`
- `modify`
- `override-future`

Exceptions remain domain-layer constructs and apply before solving.

### 6. Expansion algorithm

Recommended order:

1. choose templates intersecting the horizon
2. expand recurring shifts
3. expand recurring needs against generated shifts
4. expand recurring availability
5. apply exceptions
6. emit ordinary concrete `DomainInput`

### 7. Determinism and ids

Generated concrete ids should be deterministic and derived from:

- template id
- occurrence date
- stable ordinal/time fragment when needed

Duplicate generated ids should be treated as expansion errors, not silently merged.

### 8. Failure boundary

Expansion failure is distinct from solve infeasibility.

Two separate stages:

- recurrence validation / expansion
- concrete compile + solve

If recurrence expansion fails:

- return expansion-layer errors
- do not emit solver infeasibility

### 9. Why this fits the current package

The current solver already wants:

- concrete finite shifts
- concrete finite needs
- concrete availability windows
- hard constraints over intervals

So recurrence can remain outside the primitive kernel unless future requirements prove otherwise.

### 10. Likely next implementation tasks

- write the durable recurrence-boundary doc
- define domain types for recurring templates and exceptions
- implement finite horizon expansion
- implement expansion validation/error reporting
