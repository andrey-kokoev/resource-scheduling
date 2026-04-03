# Task 20260402-007: Rolling-Window Count Semantics

**Architectural Authority**: The 2026-04-02 PDA sequence selecting rolling-window count limits as the next pressure test after minimum-rest and consecutive-work constraints.
**Constraint**: This task must make rolling-window counting explicit before implementation hides window semantics inside rule evaluation code.

## Objective

Define the semantics for rolling-window count limits, starting with the simplest coherent rule:

- no more than `N` counted assignments in a rolling `W`-day window for the same agent

This task exists to lock the temporal counting semantics behind `UtilizationRule` without broadening the primitive ontology unnecessarily.

## PDA Framing

### Current State

Tasks `001`-`006` progressively de-arbitrarize:

- primitive vs derived concepts
- primitive constraint contract
- locked first-package policy semantics
- infeasibility witness regrouping
- minimum-rest hard-constraint semantics
- consecutive-work pattern limits

The next useful pressure test is the rolling-window counting rule already present in the motivating domain model.

### Live Ambiguities To Eliminate

- what exactly is counted in a rolling window
- whether windows are anchored to assignment start, end, date, or calendar bucket
- whether multiple assignments on one day count once or many times
- whether rolling-window max constraints are prefix-checkable, completion-only, or both
- what primitive witness shape a window-count violation should have
- how a rolling-window count violation regroups back to domain explanation

This task resolves those ambiguities for the first rolling-window count slice.

## Locked Decisions

- [x] The first slice concerns rolling-window **max** only
- [x] This is a hard feasibility constraint
- [x] `min` utilization remains deferred beyond package `001`
- [x] The rule should fit the current primitive ontology if possible
- [x] Richer utilization semantics are deferred until after this first count-based slice is explicit

## Deliverables

### Step 1: Define Counted Event Semantics

Specify what counts toward the rolling window:

- [ ] assignment count
- [ ] worked-day count
- [ ] another explicit counted event, if needed

Clarify:

- [ ] whether multiple assignments on the same day count once or many times
- [ ] whether overnight assignments count by start day, end day, or other rule
- [ ] whether count semantics are primitive or compiled from domain policy

### Step 2: Define Window Semantics

Specify the rolling-window definition:

- [ ] window width unit and representation
- [ ] anchor point for evaluating a window
- [ ] inclusion/exclusion of exact boundaries
- [ ] whether the rule is based on interval timestamps or calendar dates

### Step 3: Classify Constraint Timing

Specify whether rolling-window max is:

- [ ] prefix-checkable
- [ ] completion-only
- [ ] both in different evaluation modes

Clarify how the solver should use it during search.

### Step 4: Define Primitive Witness Shape

Specify the primitive infeasibility witness for rolling-window max violations, including:

- [ ] involved agent
- [ ] assignments or counted events inside the window
- [ ] window definition
- [ ] allowed maximum
- [ ] actual count
- [ ] violated rule identity

### Step 5: Define Domain Regrouping

Specify how a primitive rolling-window violation becomes a domain explanation in terms of:

- [ ] `Candidate`
- [ ] affected `Shift`s / dates
- [ ] the assignment or `Need` whose addition would exceed the limit

### Step 6: Create Durable Artifact

Create one concrete artifact, such as:

- [ ] `packages/feasibility-core/WINDOWS.md`
- [ ] `packages/feasibility-core/src/windows.ts`
- [ ] both, if needed

The artifact must remain compatible with the semantics already locked in tasks `001`-`006`.

## Architecture Constraints (Do NOT Add)

- [ ] No minimum-utilization semantics yet
- [ ] No optimization semantics
- [ ] No fairness or balancing logic
- [ ] No additional primitive ontology unless proven necessary
- [ ] No UI-facing explanation formatting

## Acceptance Criteria

- [ ] Rolling-window count semantics are explicit
- [ ] Counted-event semantics are explicit
- [ ] Window boundary behavior is explicit
- [ ] Constraint timing semantics are explicit
- [ ] Primitive and domain-level explanations for violations are explicit
- [ ] The rule either fits the primitive kernel cleanly or exposes a precise kernel boundary

## Status

🟡 **PLANNED** — 2026-04-02

## Next Step

After this task, consolidate the pressure-tested labor-rule semantics into a single primitive contract artifact or continue with one final incompatibility-rule pressure test.
