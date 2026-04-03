---
status: PLANNED
owner: unassigned
---

# 20260403-079 Repair Orchestration Around Solver

## Goal

Clarify the outer-loop repair workflow that preserves baseline schedules progressively while using the current feasibility solver as the core engine.

## Why This Task Exists

The emerging direction is:

- hard locks belong at or before the concrete solver boundary
- retention hierarchy does not belong inside the current solver

So the realistic next problem is how to orchestrate repeated solve attempts with progressively relaxed baseline-preservation rules.

## What This Task Should Clarify

- what the staged repair loop is
- what the relaxation steps are
- what input is passed to each solve attempt
- what output is compared across attempts
- when the system stops relaxing and returns failure
- how the repair layer reports:
  - preserved baseline assignments
  - degraded assignments
  - newly filled gaps
  - still-unfilled needs

## Desired Output

One clear first-pass position on:

- repair orchestration stages
- retention relaxation order
- interaction with hard locks
- result/reporting shape

## Constraints

- do not implement repair orchestration yet
- keep the current feasibility solver as the inner engine
- optimize for practical schedule repair workflow

## Acceptance Criteria

- the outer-loop repair model is understandable end to end
- the split between solver and repair orchestration is explicit
- the next implementation slice can be chosen without re-bundling retention into solver semantics

## First Pass Position

### 1. Repair is a staged outer loop

The current solver remains the inner feasibility engine.

Repair happens outside it as an orchestration loop:

1. start from a copied concrete baseline
2. apply hard locks
3. derive retention-targeted assignments from the baseline
4. run solve attempts with progressively weaker preservation rules
5. stop at the first acceptable result or return unresolved gaps/failures

### 2. First-pass relaxation order

Recommended staged order:

1. preserve `candidate + shift + position`
2. if infeasible, preserve `candidate + shift`
3. if still infeasible, release all retention and solve the remaining open state subject only to hard constraints and hard locks

This gives a simple and intelligible repair ladder.

### 3. What each attempt passes to the solver

Each attempt should produce a concrete solve state consisting of:

- concrete shifts
- concrete needs
- concrete candidate availability
- hard locked assignments
- candidate eligibility and hard constraints
- an attempt-specific set of pre-assigned or withheld assignments derived from the current retention level

The solver itself should still only see a concrete feasibility problem.

### 4. How retention is enforced in a given attempt

First-pass recommendation:

- for a given retention stage, the orchestration layer converts retained baseline assignments into concrete pre-assignments where possible
- assignments that cannot be retained under that stage become ordinary open gaps for the next weaker stage

This avoids pushing preference logic into the solver.

### 5. When repair stops

Stop when:

- a feasible solution is found at the current retention stage
- or the final relaxed stage still fails, in which case return the remaining infeasibility

The first successful stage is valuable information in itself because it tells the caller how much of the baseline had to be relaxed.

### 6. Result/reporting shape

The repair layer should report:

- which baseline assignments were preserved exactly
- which were degraded:
  - kept candidate + shift but changed position
  - or released entirely
- which new gaps were filled
- which needs remain unfilled if final failure occurs
- which relaxation stage produced the final result

### 7. Interaction with hard locks

Hard locks remain absolute across all stages.

If a hard lock conflicts with the changed concrete state:

- treat that as a hard failure for every stage
- do not relax the lock through the retention ladder

### 8. Current recommendation

Treat repair orchestration as a separate layer that repeatedly compiles concrete solve states for the existing feasibility engine.

That keeps:

- hard feasibility inside the solver
- baseline preservation policy outside it
- the user workflow aligned with real operational schedule repair
