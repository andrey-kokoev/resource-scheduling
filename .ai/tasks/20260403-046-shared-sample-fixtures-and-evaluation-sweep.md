---
status: COMPLETE
owner: codex
---

# 20260403-046 Shared Sample Fixtures And Evaluation Sweep

## Goal

Use the same built-in playground samples as shared test fixtures, then add a unit-level sweep that evaluates every sample and asserts the expected outcome.

## Why

The dropdown samples should not live only in the UI layer.

If they are the practical coverage surface for the package, they should also become:

- reusable test fixtures
- a unit-level regression boundary

That ensures playground examples, package behavior, and test expectations stay aligned.

## Scope

- extract or expose the built-in sample scenarios in a way that both the playground and tests can consume
- add a test that iterates over every sample fixture
- assert the expected top-level result for each sample:
  - feasible
  - or infeasible
- where useful, assert one key explanation family or cue for infeasible samples

## Constraints

- use the same sample source for playground and tests
- avoid duplicating large scenario objects across files
- keep assertions robust and high-value
- do not overfit to UI rendering details

## Likely Files

- `apps/feasibility-playground/scenario.mjs`
- `packages/feasibility-core/src/tests/fixtures.ts`
- `packages/feasibility-core/src/tests/feasibility.test.ts`
- optionally another dedicated sample-sweep test file

## Acceptance Criteria

- built-in playground samples are consumable as shared fixtures
- there is a unit-level sweep across every sample
- each sample asserts the expected evaluation outcome
- the fixture source is not duplicated between playground and tests

## Verification

- `npm run build`
- `npm run typecheck`
- `npm test`
- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground test`
