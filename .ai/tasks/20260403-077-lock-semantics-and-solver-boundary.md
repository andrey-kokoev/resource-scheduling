---
status: PLANNED
owner: unassigned
---

# 20260403-077 Lock Semantics And Solver Boundary

## Goal

Clarify how locked assignments should relate to the current concrete feasibility solver.

## Why This Task Exists

If baseline replication plus lock-and-fill is the more realistic workflow, then the key unresolved problem is no longer recurrence. It is:

- what a lock means
- how locks enter the input
- how locks constrain the solver
- how lock conflicts are surfaced

## What This Task Should Clarify

- whether a locked assignment is:
  - a hard pre-assignment
  - a protected assignment that may still be invalidated
  - a preferred seed
- whether locks are represented:
  - in the domain input
  - in the primitive layer
  - as a preprocessing step before solving
- how locked assignments interact with:
  - candidate availability changes
  - qualification expiry
  - utilization and rest rules
  - overlapping assignments
  - newly added needs
- whether lock conflicts are:
  - expansion/pre-solve validation failures
  - solver infeasibility
  - a separate failure class

- whether "lock" is actually too coarse a word, and should instead be split into retention levels such as:
  - keep candidate + shift + position
  - keep candidate + shift, allow position reassignment
  - keep candidate in horizon if possible, but allow broader movement

## Desired Output

One clear first-pass position on:

- lock ontology
- solver boundary
- failure semantics
- what the first lock-aware implementation slice should be
- whether progressive retention should replace binary lock semantics for baseline reuse

## Constraints

- do not implement locks
- optimize for concrete workflow realism
- keep the primitive solver concrete and finite unless a stronger reason appears

## Acceptance Criteria

- a reader can understand how locks are intended to behave
- the relationship between locked assignments and ordinary solving is explicit
- the next implementation slice can be chosen without hidden ambiguity

## First Pass Direction To Evaluate

The user-facing workflow may want **progressive retention**, not a single binary lock:

1. first try to preserve candidate + shift + position
2. if that is infeasible, try to preserve candidate + shift
3. only then allow broader reassignment or leave the need open

This suggests that "lock" may actually bundle two different concepts:

- hard locks:
  truly immovable pre-assignments
- retention preferences/preservation levels:
  solver-facing repair guidance for keeping a copied baseline as intact as possible

One likely outcome of this task is that the system should model:

- hard locks, for truly fixed assignments
- progressive retention levels, for baseline reuse/repair

rather than trying to force both into one `lock` concept.
