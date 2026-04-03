# Task 20260403-014: Complete Remaining Coverage-Rule Slices

**Architectural Authority**: The current `feasibility-core` contract and the partial implementation of task `20260402-011`, which already covers `require-qualification-on-shift` and `require-position-on-shift`.
**Constraint**: This task must extend coverage-rule support without reopening the primitive ontology or collapsing rules into heuristic logic.

## Objective

Implement the remaining declared coverage-rule slices:

- `require-support-when-dependent-staffed`
- `require-supervisor-presence`

This task should complete the first planned coverage-coupling semantics surface.

## Deliverables

### Step 1: Define Remaining Rule Semantics

- [x] explicit semantics for `require-support-when-dependent-staffed`
- [x] explicit semantics for `require-supervisor-presence`
- [x] clarify which facts are checked at completion time versus relative to assigned demand units

### Step 2: Extend Compilation

- [x] compile the remaining domain rule variants into primitive coverage rules
- [x] preserve current explicit rule typing and rule ids

### Step 3: Extend Solver Validation

- [x] enforce the two remaining coverage-rule families during completion-time validation
- [x] preserve current explicit primitive `coverage-conflict` reasons

### Step 4: Extend Explanation Regrouping

- [x] regroup the new coverage conflicts into domain-facing explanations
- [x] keep the explanation surface flat and consistent with the current `explanations.ts` style

### Step 5: Add Tests

- [x] direct solver tests for `require-support-when-dependent-staffed`
- [x] direct solver tests for `require-supervisor-presence`
- [x] regrouping tests for the new coverage conflicts

## Acceptance Criteria

- [ ] all declared coverage-rule variants are implemented
- [ ] primitive and domain explanations remain explicit
- [ ] build, typecheck, and tests pass

## Status

🟢 **COMPLETE** — 2026-04-03

Implemented in code and docs:

- `require-support-when-dependent-staffed`
- `require-supervisor-presence`
- `COVERAGE-RULES.md`
