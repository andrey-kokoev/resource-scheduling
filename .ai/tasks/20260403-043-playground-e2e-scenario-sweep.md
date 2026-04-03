---
status: COMPLETE
owner: codex
---

# 20260403-043 Playground E2E Scenario Sweep

## Goal

Add a thin browser-level E2E suite for the feasibility playground that exercises the built-in sample scenarios end to end.

## Why

The playground is no longer a throwaway local demo. It now has:

- a sample selector
- feasible and infeasible rendering paths
- end-to-end `compile -> solve -> regroup` behavior
- user-facing evaluative output

That makes a small E2E layer worthwhile.

## Scope

- add a lightweight browser E2E test setup for the playground
- cover the built-in sample scenarios
- assert user-facing outcomes rather than implementation details

## Required Coverage

- default/base sample renders a feasible result
- `Forklift unavailable` renders an infeasible result
- `Lead missing` renders an infeasible result
- `Coverage rule impossible` renders an infeasible result

For each scenario, assert a small number of visible outcome markers:

- status text
- feasible vs infeasible framing
- at least one key visible domain cue

For infeasible cases, prefer assertions around the failed-need narrative rather than raw explanation-type grouping.

## Constraints

- keep the E2E layer thin
- do not add fragile visual snapshot testing
- do not over-assert low-value DOM details
- prefer robust, user-facing selectors or text anchors
- if a test runner must be introduced, keep the setup minimal and local to the app

## Likely Files

- `apps/feasibility-playground/package.json`
- `apps/feasibility-playground/README.md`
- `apps/feasibility-playground/` test config and E2E files

## Acceptance Criteria

- a browser E2E suite runs locally against the playground
- each built-in sample scenario is exercised
- the suite verifies the top-level expected outcome for each sample
- docs mention how to run the E2E suite

## Verification

- app build still passes
- app tests still pass
- the new E2E suite passes locally
