# Task 20260403-013: Complete Remaining Shift-Pattern Rule Slices

**Architectural Authority**: The current `feasibility-core` contract and the partial implementation of task `20260402-010`, which already covers `weekday-only`, `weekend-only`, and `no-night-to-day-turnaround`.
**Constraint**: This task must extend shift-pattern support without reopening the primitive ontology or collapsing rules into heuristic logic.

## Objective

Implement the remaining declared shift-pattern rule slices:

- `non-rotating`
- `fixed-shift-family`

This task should complete the first planned shift-pattern semantics surface.

## Deliverables

### Step 1: Define Remaining Rule Semantics

- [x] explicit semantics for `non-rotating`
- [x] explicit semantics for `fixed-shift-family`
- [x] clarify which facts are checked at eligibility time versus relative to existing assignments

### Step 2: Extend Compilation

- [x] compile the remaining domain rule variants into primitive pattern rules
- [x] preserve current explicit rule typing and rule ids

### Step 3: Extend Solver Validation

- [x] enforce the two remaining pattern-rule families during assignment validation
- [x] preserve current explicit primitive `shift-pattern-conflict` reasons

### Step 4: Extend Explanation Regrouping

- [x] regroup the new pattern conflicts into domain-facing explanations
- [x] keep the explanation surface flat and consistent with the current `explanations.ts` style

### Step 5: Add Tests

- [x] direct solver tests for `non-rotating`
- [x] direct solver tests for `fixed-shift-family`
- [x] regrouping tests for the new pattern conflicts

## Acceptance Criteria

- [ ] all declared shift-pattern rule variants are implemented
- [ ] primitive and domain explanations remain explicit
- [ ] build, typecheck, and tests pass

## Status

🟢 **COMPLETE** — 2026-04-03

Implemented in code and docs:

- `non-rotating`
- `fixed-shift-family`
- `PATTERN-COMPATIBILITY.md`
