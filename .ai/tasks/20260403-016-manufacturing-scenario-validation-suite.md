# Task 20260403-016: Manufacturing Scenario Validation Suite

**Architectural Authority**: The current `feasibility-core` feature set, which now supports qualifications, availability, shift patterns, rolling limits, rest, and first-pass coverage coupling.
**Constraint**: This task must validate the abstraction against realistic plant labor scenarios, not synthetic one-rule-only unit tests.

## Objective

Add a scenario-based validation suite that exercises the current feature set against realistic manufacturing labor cases.

This task exists to pressure-test whether the current abstraction holds when multiple rule families interact at once.

## Deliverables

### Step 1: Add Representative Plant Scenarios

Add scenarios such as:

- [x] certified operator coverage with time off
- [x] weekend-restricted or weekday-restricted worker
- [x] lead-required shift
- [x] forklift-certification coverage on shift
- [x] night-to-day turnaround violation
- [x] rolling max plus coverage interaction

### Step 2: Add Expected Outcomes

For each scenario, assert:

- [x] feasible assignment when one should exist
- [x] explicit infeasibility when one should not
- [x] stable explanation regrouping for failures

### Step 3: Organize Scenario Fixtures

- [x] create reusable fixture helpers or test builders
- [x] avoid copy-paste-heavy test setup

### Step 4: Document Scenario Purpose

For each scenario, briefly state:

- [x] which domain assumption it validates
- [x] which interacting rule families it covers

## Acceptance Criteria

- [x] the package has realistic manufacturing-oriented validation scenarios
- [x] multiple rule families are tested together
- [x] explanation regrouping is exercised on realistic failures
- [x] build, typecheck, and tests pass

## Status

🟢 **COMPLETE** — 2026-04-03

Implemented scenarios:

- certified operator coverage with time off
- weekend-restricted worker paired with availability
- lead-required staffed shift
- forklift coverage failure with time off
- night-to-day turnaround violation
- rolling max plus coverage interaction
