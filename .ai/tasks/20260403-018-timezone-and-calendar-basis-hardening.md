# Task 20260403-018: Timezone And Calendar Basis Hardening

**Architectural Authority**: The current `feasibility-core` contract, which explicitly requires one solve-wide timezone basis, and the implemented rule families that already depend on local-date semantics.
**Constraint**: This task must make time-basis behavior explicit and consistent without changing the primitive ontology.

## Objective

Harden the package around solve-wide timezone and calendar-basis semantics so that:

- interval interpretation is explicit
- worked-day derivation is stable
- weekend / weekday logic is stable
- rolling-window and consecutive-day rules do not silently depend on host-local behavior

## Deliverables

### Step 1: Audit Current Time-Basis Dependencies

- [x] identify every place using local `Date` operations for rule evaluation
- [x] identify every place where host-local timezone is implicitly assumed

### Step 2: Define Explicit Solve-Wide Time Basis

- [x] define the current supported time-basis contract precisely
- [x] decide whether package `001` stays host-local, caller-provided local time, or moves to explicit timezone configuration

### Step 3: Reconcile Rule Families

- [x] align weekend / weekday logic
- [x] align consecutive-work day derivation
- [x] align rolling-window counting semantics
- [x] align overnight-shift handling

### Step 4: Add Tests

- [x] tests that lock current expected calendar behavior
- [x] tests for overnight boundary behavior

## Acceptance Criteria

- [x] time-basis assumptions are explicit and test-backed
- [x] rule-family calendar behavior is internally consistent
- [x] contract and code no longer rely on silent local-time assumptions

## Status

🟢 **COMPLETE** — 2026-04-03

Implemented hardening:

- solve-wide host-local calendar basis is explicit
- worked-day derivation uses local calendar fields instead of UTC conversion
- weekday/weekend checks remain on local shift start dates
- rolling-window and rest calculations remain local-basis and are now documented
- overnight boundary behavior is test-backed
