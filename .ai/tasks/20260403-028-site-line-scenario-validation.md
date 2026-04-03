# Task 20260403-028: Site And Line Scenario Validation

**Architectural Authority**: The next-domain milestone selected in `023` and the foundation task `027`, which begins adding multi-site / line-level structure to the domain model.
**Constraint**: This task must pressure-test the milestone from the outside without driving premature schema sprawl or production-sequencing logic.

## Objective

Define and validate realistic site-aware and line-aware staffing scenarios that the new domain foundation must support.

This task should help keep the milestone grounded in concrete usage rather than abstract schema growth.

## Deliverables

### Step 1: Define Representative Scenarios

- [ ] one multi-line staffing scenario within one site
- [ ] one multi-site scenario with site-scoped staffing or coverage expectations
- [ ] one line-aware coverage failure
- [ ] one explanation scenario showing how site/line structure should surface back to callers

### Step 2: Specify Expected Domain Semantics

- [ ] how `Site` should scope shifts or staffing context
- [ ] how `Line` should scope needs or coverage rules
- [ ] which data must remain domain-only versus flow into regrouping metadata

### Step 3: Add Validation Tests Or Pending Test Shapes

- [ ] add tests if `027` already provides the needed structures
- [ ] otherwise add clearly marked pending or staged test shapes / fixtures that `027` should satisfy

### Step 4: Feed Back Into Milestone Docs

- [ ] update milestone docs or task notes if scenario pressure reveals a better boundary

## Acceptance Criteria

- [ ] the multi-site / line milestone is anchored in realistic scenarios
- [ ] expected explanation needs are explicit
- [ ] the milestone is less likely to drift into abstract schema work

## Status

🟢 **COMPLETE** — 2026-04-03
