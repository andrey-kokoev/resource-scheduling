---
status: COMPLETE
owner: codex
---

# 20260403-050 Runtime Sample Library Boundary Cleanup

## Goal

Move the shared sample scenario library out of `feasibility-core` test-only runtime paths and into a supported runtime-consumable boundary.

## Why

The playground currently imports its sample catalog from compiled test output under:

- `packages/feasibility-core/dist/tests/...`

That is the wrong package boundary.

The sample catalog is now serving runtime roles:

- playground dropdown source
- evaluator-facing examples
- shared fixture source

So it should live in a supported module path rather than under test output.

## Scope

- create a supported shared module location for the sample catalog
- update the playground to import from that supported location
- keep tests consuming the same sample source
- avoid duplicating the sample catalog

## Constraints

- do not widen solver semantics
- do not change scenario behavior unless necessary for the move
- keep the final module path obvious and maintainable

## Likely Files

- `packages/feasibility-core/src/tests/sample-scenarios.ts`
- a new non-test shared module under `packages/feasibility-core/src/`
- `apps/feasibility-playground/scenario.mjs`
- any related export surface updates

## Acceptance Criteria

- playground no longer imports runtime data from compiled test output
- tests and playground still consume one shared sample source
- the shared sample source lives on an intentional runtime-capable path

## Verification

- `npm run build`
- `npm run typecheck`
- `npm test`
- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground test`
