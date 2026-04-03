---
status: COMPLETE
owner: codex
---

# 20260403-053 Sample Semantics Assertions

## Goal

Add a second-layer test suite for the shared sample catalog that asserts a few sample-specific semantic facts, not just top-level feasible/infeasible outcome plus one cue.

## Why

The current sample sweep is a good smoke/regression layer, but it is still shallow.

It proves:

- every sample runs
- each sample is feasible or infeasible as expected
- infeasible samples emit one expected explanation cue

It does not yet prove enough about:

- which need actually fails
- whether site/line metadata is preserved where expected
- whether the “feasible” samples are covering the intended domain slice rather than just matching a count

## Scope

- keep the current broad sweep
- add a second, smaller test layer for selected key samples
- assert a few higher-value semantic facts per selected sample

## Recommended Coverage

At minimum include focused assertions for:

- base feasible staffing solve
- qualification gap
- one temporal-rule sample
- site-scoped coverage
- line-aware coverage context

## Example Assertion Types

- failed need id or position
- explanation type plus attached siteId / lineId where relevant
- expected assignment count plus expected role/shift coverage
- expected metadata preserved in regrouped explanations

## Constraints

- do not over-assert every detail of every sample
- keep the suite readable
- use the shared sample catalog as the source
- avoid duplicating scenario data

## Likely Files

- `packages/feasibility-core/src/tests/sample-sweep.test.ts`
- or a dedicated `sample-semantics.test.ts`
- shared sample catalog source if a tiny metadata addition is justified

## Acceptance Criteria

- current broad sample sweep remains
- selected key samples have richer semantic assertions
- the test suite is still easy to understand and maintain

## Verification

- `npm test`
