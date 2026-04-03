---
status: PLANNED
owner: unassigned
---

# 20260403-078 Baseline Retention Hierarchy De-arbitrarization

## Goal

Clarify the concept of progressive baseline preservation during schedule repair.

## Why This Task Exists

The user workflow may not want a single binary "lock".

Instead, copied baseline assignments may carry an ordered preservation intent such as:

1. keep candidate + shift + position
2. if impossible, keep candidate + shift
3. if impossible, allow broader reassignment

That is a different concept from a hard lock and needs its own boundary treatment.

## What This Task Should Clarify

- whether baseline retention is:
  - a hard constraint family
  - a soft objective family
  - a staged repair workflow
- what the retention levels actually are
- whether retention applies to:
  - individual copied assignments
  - whole candidate patterns
  - groups of assignments
- how retention interacts with:
  - hard locks
  - feasibility constraints
  - new needs
  - removed needs
  - changed availability

## Desired Output

One clear first-pass position on:

- the ontology of retention levels
- whether retention belongs inside the current solver at all
- whether it should instead be a staged outer-loop workflow

## Constraints

- do not implement retention behavior
- do not assume the current solver already supports objective-style repair
- optimize for real schedule-repair workflow rather than elegant theory

## Acceptance Criteria

- hard locks and retention are clearly distinguished
- the likely implementation direction is explicit
- the next step can be chosen without smuggling optimization into the current solver

## First Pass Position

### 1. Retention is not the same thing as lock

Hard locks are:

- immovable concrete pre-assignments
- feasibility-defining
- violated only by failure

Retention is different:

- it expresses how strongly the system should try to preserve copied baseline structure
- it is repair guidance, not primitive feasibility

So retention should not be collapsed into `lock`.

### 2. First-pass retention hierarchy

The most realistic ordered preservation levels are:

1. keep `candidate + shift + position`
2. if impossible, keep `candidate + shift`
3. if impossible, allow reassignment or leave the slot open

That is an ordered repair policy, not a single constraint.

### 3. Where retention belongs

First-pass recommendation:

- retention should **not** be pushed into the current feasibility solver
- retention should live in an outer repair workflow that stages solve attempts

Likely staged workflow:

1. apply hard locks
2. attempt solve with strongest retention policy
3. if infeasible, relax to weaker retention policy
4. if still infeasible, allow broader fill or surface remaining gaps

This keeps the current solver concrete and hard-constraint-focused.

### 4. Why this is the better fit

The current solver is designed for:

- hard constraints
- concrete assignments
- feasibility

Retention hierarchy introduces:

- ordered preference/relaxation
- repair policy
- potentially multiple solve passes

That is better treated as orchestration around the solver than as a primitive solver concept in the first pass.

### 5. Interaction with hard locks

Hard locks remain absolute.

Retention applies only to assignments that are copied from baseline but are not truly fixed.

So the likely model is:

- hard lock set
- retention-tagged baseline assignment set
- open remainder

### 6. Current recommendation

Treat baseline retention hierarchy as a **staged outer-loop repair workflow**, not as part of the current primitive solver.

If later optimization or richer repair objectives are introduced, retention could be revisited. For now, the safest and most realistic path is staged relaxation around the existing feasibility engine.
