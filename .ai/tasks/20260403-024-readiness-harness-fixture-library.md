# Task 20260403-024: Readiness Harness Fixture Library

**Architectural Authority**: The current readiness harness and scenario tests in `feasibility-core`, which now validate realistic staffing and manufacturing cases.
**Constraint**: This task must improve test maintainability and reuse without changing solver semantics.

## Objective

Extract reusable fixture builders and scenario helpers from the current readiness and feasibility tests so future scenario coverage can grow without copy-paste-heavy setup.

## Deliverables

### Step 1: Identify Repeated Test Setup

- [x] review `feasibility.test.ts`
- [x] review `readiness.test.ts`
- [x] identify repeated domain-input construction patterns

### Step 2: Add Fixture Helpers

- [x] create reusable builders or fixtures for common domain entities
- [x] keep helpers readable and close to real usage
- [x] avoid over-abstracting small test setup

### Step 3: Refactor Existing Tests

- [x] migrate repeated setup in current tests to the new helpers where it improves clarity
- [x] keep scenario intent obvious

### Step 4: Keep Scenario-Level Readability

- [x] ensure tests still read as staffing/manufacturing scenarios, not generic data plumbing

## Acceptance Criteria

- [x] scenario tests are easier to extend
- [x] test setup duplication is materially reduced
- [x] scenario readability remains good
- [x] build, typecheck, and tests pass

## Status

🟢 **COMPLETE** — 2026-04-03

Fixture helpers added in code:

- `d`
- `shift`
- `position`
- `need`
- `candidate`
- `qualificationType`
- `positionQualification`
- `candidateQualification`
- `available`
- `unavailable`
- `coverageRule`
- `shiftPatternRule`
- `utilizationRule`
