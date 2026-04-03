# Baseline Repair Workflow Boundary Proposal

## Purpose

Baseline replication plus repair is likely the stronger primary workflow for real scheduling operations.

The first-pass idea is not to solve recurrence or optimization inside the feasibility kernel. It is to:

1. author or copy a concrete baseline schedule
2. preserve what should stay stable
3. apply concrete deltas
4. run a feasibility repair attempt
5. progressively relax preservation when needed

The current feasibility solver sits inside that workflow as the inner concrete feasibility engine.

## Boundary Decision

The workflow should be split into four distinct layers:

- hard locks
- retention hierarchy
- repair orchestration
- concrete solve attempts

The solver should only see concrete finite solve attempts, not the workflow itself.

### Why baseline replication plus repair is the stronger primary workflow

Baseline replication plus repair is the more operationally realistic framing because it matches how people maintain schedules in practice:

- start from a known good or mostly good baseline
- preserve the parts that should remain stable
- repair gaps caused by absences, new needs, or changed facts
- relax preservation only if necessary

That is a different primary workflow from recurrence-as-authoring because it focuses on concrete copied state and repair decisions rather than abstract repeated generation.

## Layer 1: Hard Locks

Hard locks are immovable pre-assignments.

Recommended semantics:

- a hard lock is part of the concrete scheduling state
- the solver may not move or reinterpret it
- if a hard lock conflicts with changed concrete facts, the attempt fails hard

Hard locks are feasibility-defining, not preference-defining.

Hard locks should remain workflow-layer facts that become concrete pre-assignments for the solver.

## Layer 2: Retention Hierarchy

Retention is not the same as a hard lock.

Retention expresses how strongly the workflow should try to preserve copied baseline structure during repair.

Recommended first-pass retention hierarchy:

1. keep `candidate + shift + position`
2. if impossible, keep `candidate + shift`
3. if impossible, release the assignment for broader repair

This is repair guidance, not a primitive solver concept.

The hierarchy is better treated as an outer-loop workflow policy than as a feasibility constraint family inside the current solver.

## Layer 3: Repair Orchestration

Repair orchestration is the outer loop that coordinates repeated solve attempts.

Recommended staged shape:

1. copy the baseline schedule
2. apply hard locks
3. apply concrete deltas:
   - absent candidates
   - added needs
   - removed needs
   - changed shifts
   - changed availability
4. stage one retention level
5. compile one concrete attempt
6. run the solver
7. if infeasible, relax retention and repeat

Repair orchestration is workflow logic. It should not be collapsed into the solver boundary.

## Layer 4: Concrete Solve Attempts

Each repair attempt should compile into an ordinary finite concrete solve input.

The solver should only see:

- concrete shifts
- concrete needs
- concrete candidate availability
- concrete pre-assignments / hard locks
- concrete hard constraints

It should not see:

- baseline authoring intent
- copied state lineage
- retention policy
- repair orchestration state

That keeps the inner engine unchanged and makes each attempt debuggable.

## Copied Baseline State

The copied baseline state is the workflow-layer source object for repeated attempts.

It should contain:

- the concrete baseline assignments
- hard lock markings
- retention annotations
- deltas from the copied baseline
- the target concrete schedule context

This object is not the solver input itself. It compiles into one or more concrete attempts.

## Where The Current Solver Sits

The current feasibility solver sits at the end of the workflow chain.

Its role is:

- accept one finite concrete solve attempt
- enforce hard feasibility constraints
- return either:
  - a feasible assignment set
  - or structured infeasibility output

It is not:

- the baseline copier
- the retention-policy engine
- the orchestration loop
- the repair reporter

## Failure Semantics

The workflow should keep these failure classes separate:

- hard lock conflict
- retention release
- solver infeasibility

Recommended interpretation:

- hard lock conflict: the attempt is invalid at every retention stage
- retention release: the current stage cannot preserve the assignment, so it is relaxed
- solver infeasibility: the concrete attempt is valid, but no complete non-violating assignment exists

This keeps repair decisions readable and prevents workflow failure from being collapsed into ordinary solver infeasibility.

## Why This Fits The Current Solver

The current solver already wants concrete finite input:

- shifts
- needs
- availability windows
- hard constraints over assignments

That makes it a good inner engine for a workflow that stages copied baseline state and tries progressively relaxed repair attempts.

## Decision Summary

Recommended first-pass contract:

- baseline replication plus repair is the primary workflow
- hard locks are immovable concrete pre-assignments
- retention hierarchy is an outer-loop repair policy
- repair orchestration compiles concrete attempts
- the solver remains the inner concrete feasibility engine

This is strong enough to guide later implementation tasks without widening the solver boundary.
