---
status: PLANNED
owner: unassigned
---

# 20260403-076 Standard-Week Baseline Lock-And-Fill De-arbitrarization

## Goal

Clarify whether the more realistic scheduling workflow is:

- create one concrete standard schedule
- lock all or part of it
- then solve only the remaining gaps and deltas

rather than introducing recurrence as a first-class domain concept.

## Why This Task Exists

The current recurrence exploration may be solving the wrong problem.

A more pragmatic model is:

1. author a concrete "standard week"
2. copy or reuse it as a baseline
3. lock the assignments that should remain stable
4. let the solver fill gaps caused by absences, changes, or new needs

That is operationally different from recurrence templates and may fit real plant scheduling better.

## What This Task Should Clarify

- whether recurrence should be demoted to an optional authoring convenience
- whether the core user problem is really baseline replication plus lock-and-fill
- what objects are actually part of the domain:
  - concrete assignments
  - locked assignments
  - open gaps
  - copied baseline schedules
- what remains workflow/application logic rather than solver-domain logic

## Key Questions

1. What is the primitive thing the system reasons over?
   Likely concrete assignments and open needs, not recurring rules.

2. What is "lock" semantically?
   Is it:
   - a hard pre-assignment
   - a protected assignment the solver may not move
   - a seeded assignment with override rules

3. What is copied from the standard week?
   - shifts
   - needs
   - candidate assignments
   - all of the above

4. How are changes represented?
   - absences
   - new needs
   - modified shifts
   - removed assignments

5. Where does this sit relative to the current solver?
   - before solving as scenario generation
   - during solving as locked assignment constraints
   - after solving as comparison to baseline

## Desired Output

One clear first-pass position on:

- baseline schedule replication as workflow
- lock semantics
- gap-filling semantics
- whether recurrence is still needed at all, and if so only where

## Constraints

- do not implement lock-and-fill yet
- do not assume recurrence remains the right main path
- optimize for the real operator workflow rather than elegant abstraction

## Acceptance Criteria

- a reader can understand the baseline/lock/fill workflow end to end
- the distinction between workflow layer and solver-domain layer is clearer
- the task makes it possible to decide whether recurrence should be paused, narrowed, or retained only as authoring convenience

## First Pass Position

### 1. Primary workflow hypothesis

The more realistic primary workflow is likely:

1. author one concrete standard schedule
2. copy or project it into a target horizon
3. mark retained assignments as locked
4. apply concrete changes:
   - absences
   - added needs
   - removed needs
   - modified shifts
5. solve only the remaining open gaps

That is more operationally real than introducing recurrence as a first-class domain concept.

### 2. Primitive thing the solver reasons over

The solver should still reason over:

- concrete shifts
- concrete needs
- concrete candidate availability
- concrete assignments
- locked assignments as hard pre-committed facts

Not over recurrence rules or abstract schedule patterns.

### 3. Lock semantics

First-pass recommendation:

- a lock is a hard pre-assignment
- locked assignments are part of the input state
- the solver may not move or invalidate them except by failing the whole solve if they conflict with new concrete facts

That keeps lock semantics simple and real.

### 4. Gap-filling semantics

After locked assignments are applied:

- some needs are already satisfied
- some needs remain open
- some locks may conflict with changed availability or other hard rules

The solver should fill only the unresolved feasible remainder.

### 5. Where recurrence stands after this reframing

Recurrence becomes optional and secondary:

- possibly an authoring convenience for generating a standard week
- not the primary domain model
- not required for the first practical scheduling workflow

### 6. Workflow layer vs solver layer

Workflow/application layer:

- standard-week authoring
- baseline copying/projection
- lock creation
- change application
- gap identification

Solver-domain layer:

- concrete schedule state after projection and changes
- hard locked assignments
- open needs to fill
- ordinary hard constraints

### 7. Current recommendation

Treat baseline schedule replication plus lock-and-fill as the stronger primary path.

Keep the recurrence work provisional:

- useful as a possible authoring convenience
- not the assumed next major capability until this workflow is compared directly against it
