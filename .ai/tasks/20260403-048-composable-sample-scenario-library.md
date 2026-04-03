---
status: COMPLETE
owner: codex
---

# 20260403-048 Composable Sample Scenario Library

## Goal

Refactor the shared sample scenario source so samples are defined as:

- one canonical base plant
- a set of named scenario transformations
- a named sample catalog composed from those transformations

## Why

The sample set is now doing multiple jobs:

- playground dropdown
- shared unit fixtures
- regression boundary
- evaluator-facing capability examples

That makes ad hoc raw scenario variants too weak as the long-term shape.

A composable sample library will reduce duplication and make each sample easier to reason about and extend.

## Scope

- keep one canonical base plant scenario
- introduce small named pure transformations like:
  - remove lead qualification
  - block forklift night shift
  - create utilization pressure
  - create rest conflict
  - make coverage rule impossible
- define named samples as ordered compositions of those transformations
- preserve current consumer behavior for:
  - playground dropdown
  - shared fixture sweep

## Constraints

- do not invent a large DSL
- prefer straightforward pure functions over generalized configuration machinery
- keep the final sample source easy to read
- do not change solver semantics

## Likely Files

- `packages/feasibility-core/src/tests/sample-scenarios.ts`
- `apps/feasibility-playground/scenario.mjs`

## Acceptance Criteria

- there is one base plant source
- there are named transform helpers
- samples are composed from transforms rather than duplicated large scenario objects
- playground and tests still consume the same catalog

## Verification

- `npm run build`
- `npm run typecheck`
- `npm test`
- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground test`
