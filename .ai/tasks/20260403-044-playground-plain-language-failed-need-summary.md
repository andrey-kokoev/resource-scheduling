---
status: PLANNED
owner: unassigned
---

# 20260403-044 Playground Plain-Language Failed-Need Summary

## Goal

Replace raw `no-eligible-candidate` JSON in the primary failed-need card with a plain-language domain-facing summary.

## Why

The need-centered framing is now correct, but the top of the failed-need card still leaks implementation-shaped data:

- raw explanation object
- field names like `requiredQualifications`
- `reason: "no-candidates"`

That is not the right primary reading surface for the playground.

The card should instead explain in domain terms:

- which need failed
- what role was required
- what qualification requirement mattered
- how many candidates were considered

## Scope

- [x] replace raw `no-eligible-candidate` JSON rendering in the failed-need primary summary
- [x] keep supporting causes below it
- [x] preserve detailed implementation-shaped data only if needed in a secondary/debug-friendly location

## Constraints

- keep the evaluator thin
- prefer UI-side rendering changes
- do not redesign solver semantics
- do not add a large debug surface

## Likely Files

- `apps/feasibility-playground/playground.mjs`
- `apps/feasibility-playground/README.md`

## Acceptance Criteria

- [x] failed-need cards no longer show raw `no-eligible-candidate` JSON as the main content
- [x] the summary reads in plain language
- [x] the forklift-unavailable scenario reads naturally without requiring the user to parse field names

## Verification

- [x] `pnpm --filter feasibility-playground build`
- [x] `pnpm --filter feasibility-playground typecheck`
- [x] `pnpm --filter feasibility-playground test`

## Status

🟢 **COMPLETE** — 2026-04-03
