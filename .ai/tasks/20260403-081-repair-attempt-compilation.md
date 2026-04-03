---
status: PLANNED
owner: unassigned
---

# 20260403-081 Repair Attempt Compilation

## Goal

Clarify how one concrete solve attempt is derived from copied baseline state plus a chosen retention stage.

## Why This Task Exists

The current workflow direction now has:

- copied baseline state as a workflow-layer object
- a staged repair orchestration loop

But it still lacks the key compilation step:

- how one retention stage becomes one concrete solve input

## What This Task Should Clarify

- what data from baseline state survives into a given attempt
- how hard locks become concrete pre-assignments
- how retention-tagged assignments are treated in each stage
- how removed assignments and changed availability affect the attempt
- how open gaps are derived
- what the output object of attempt compilation should be

## Desired Output

One clear first-pass position on:

- repair-attempt compilation inputs
- repair-attempt compilation outputs
- deterministic compilation rules
- relation to the inner feasibility solver

## Constraints

- do not implement attempt compilation yet
- keep the inner solver unchanged
- optimize for a concrete workflow that can later be coded in small slices

## Acceptance Criteria

- a reader can understand how one attempt is formed
- the relationship between baseline state, retention stage, and concrete solve input is explicit
- the next implementation slice can be chosen without hidden orchestration gaps

## First Pass Position

### 1. One repair attempt is a compilation product

Given:

- copied baseline state
- a chosen retention stage

produce one ordinary concrete solve attempt.

That attempt should be the only thing passed to the inner feasibility solver.

### 2. Attempt compilation inputs

The compiler should consume:

- concrete target schedule context:
  - shifts
  - needs
  - candidate availability
- copied baseline assignments
- hard lock markings
- retention annotations
- concrete deltas
- chosen retention stage

### 3. Attempt compilation outputs

First-pass output should contain:

- ordinary concrete solve input
- concrete pre-assigned/locked assignment set used in this attempt
- retained baseline assignments selected for this stage
- assignments released from retention for this stage
- derived open gaps

This allows both solving and later reporting.

### 4. Compilation rules by assignment category

For each copied baseline assignment:

- if hard locked:
  - include as concrete pre-assignment
  - if invalid under current concrete facts, mark attempt as hard-failing

- else if retained at the current stage:
  - include as stage-retained pre-assignment only if still concrete-valid
  - otherwise release it for this stage

- else:
  - do not pre-assign it
  - allow solver to fill the relevant need normally

### 5. Effect of deltas

Concrete deltas should be applied before retention compilation:

- removed assignments disappear from baseline carryover
- changed availability may invalidate locks or retained assignments
- added/removed needs change which gaps exist
- changed shifts may invalidate copied assignment references entirely

### 6. Deriving open gaps

After hard locks and stage-retained assignments are applied:

- mark covered needs as satisfied
- remaining uncovered needs become open gaps

The resulting concrete solve input should represent only:

- the fixed carried-over assignments
- the open remainder to solve

### 7. Hard-failure vs releasable failure

Two different failure modes should be distinguished:

- hard failure:
  a hard lock is incompatible with current concrete facts
- releasable retention loss:
  a retained assignment cannot survive this stage and is released

Only the first should invalidate the attempt immediately.

### 8. Current recommendation

Treat repair-attempt compilation as a deterministic workflow-layer compiler:

- baseline state + retention stage
  ->
- concrete attempt package
  ->
- inner feasibility solve

This keeps repair logic explicit and prevents hidden policy from leaking into the solver.
