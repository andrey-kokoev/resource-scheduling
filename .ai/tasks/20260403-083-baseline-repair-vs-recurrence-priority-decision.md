---
status: PLANNED
owner: unassigned
---

# 20260403-083 Baseline Repair Vs Recurrence Priority Decision

## Goal

Make an explicit decision about which path should receive primary implementation attention:

- baseline replication plus lock/retention/repair
- or recurrence-first scheduling support

## Why This Task Exists

The repo now has two coherent boundary artifacts:

- `packages/feasibility-core/RECURRING-SCHEDULING.md`
- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`

Both are plausible, but they should not remain implicit co-equals indefinitely.

## What This Task Should Compare

- closeness to real operator workflow
- fit with the current concrete feasibility solver
- implementation risk
- user-facing value
- how much abstraction debt each path introduces
- whether one should be primary and the other demoted to secondary/supporting status

## Desired Output

One clear first-pass decision artifact that states:

- which path is primary now
- why
- what happens to the other path:
  - deferred
  - narrowed
  - retained only as authoring convenience

## Constraints

- do not implement either path
- do not leave the outcome ambiguous
- optimize for usefulness and realism over elegance

## Acceptance Criteria

- a clear primary path is chosen
- the secondary path’s status is explicit
- future task generation can follow the decision without carrying hidden ambiguity

## First Pass Decision

### 1. Primary path

**Baseline replication plus lock/retention/repair should be the primary path.**

### 2. Why this wins now

It is closer to the real operator workflow:

- build a concrete standard schedule
- copy it into the target horizon
- keep as much as possible
- absorb absences, changes, and new needs
- fill the gaps

It also fits the current solver better:

- the solver already works on concrete finite scheduling problems
- hard locks can remain concrete pre-assignments
- retention can remain staged orchestration outside the solver

This path introduces less abstraction debt than recurrence-first support.

### 3. Status of recurrence

Recurrence should be **demoted to secondary status** for now.

Recommended status:

- not the primary implementation path
- retain only as:
  - possible authoring convenience
  - possible later substrate for generating baseline schedules
- do not treat it as the main near-term product capability

### 4. Why recurrence loses priority

Recurrence-first support is weaker right now because:

- it risks solving the wrong problem
- it introduces template/exception abstraction before proving user value
- it is less directly tied to the schedule-repair workflow users actually describe

### 5. Recommended effect on task generation

Near-term implementation tasks should follow the baseline-repair path:

- hard lock semantics
- baseline state representation
- repair-attempt compilation
- staged repair orchestration

Recurrence tasks should remain:

- documented
- explicitly secondary
- not the next primary implementation queue
