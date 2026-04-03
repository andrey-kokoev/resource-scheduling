# Task 20260402-010: Shift-Pattern Compatibility Semantics

**Architectural Authority**: The 2026-04-02 domain expansion after consolidating the primitive contract, selecting shift-pattern compatibility as a major increase in real-world plant labor applicability.
**Constraint**: This task must express pattern rules as explicit hard constraints, not hidden scheduling heuristics.

## Objective

Define how domain shift-pattern rules compile into explicit hard constraints over assignments for one agent.

## Deliverables

### Step 1: Define Domain Rule Shapes

- [x] no night-to-day turnaround
- [x] weekday-only / weekend-only restrictions
- [x] non-rotating worker restrictions
- [x] fixed crew or shift-family restrictions, if included

### Step 2: Define Compilation Semantics

- [x] which rules are pairwise
- [x] which rules are sequence-based
- [x] prefix-checkable vs completion-only timing

### Step 3: Define Explanation Semantics

- [x] primitive witness shape
- [x] regrouping to candidate and shifts

### Step 4: Create Durable Artifact

- [x] `packages/feasibility-core/PATTERN-COMPATIBILITY.md`
- [x] and/or code contract artifact

## Acceptance Criteria

- [x] shift-pattern rules are explicit and non-heuristic
- [x] constraint timing is explicit
- [x] explanation semantics are explicit

## Status

🟢 **IMPLEMENTED IN CODE** — 2026-04-03

Implemented slice:

- `weekday-only`
- `weekend-only`
- `no-night-to-day-turnaround`
- `fixed-shift-family`
- `non-rotating`

Standalone durable doc:

- `packages/feasibility-core/PATTERN-COMPATIBILITY.md`
