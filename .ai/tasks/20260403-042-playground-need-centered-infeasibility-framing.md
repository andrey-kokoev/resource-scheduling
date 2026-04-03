---
status: PLANNED
owner: unassigned
---

# 20260403-042 Playground Need-Centered Infeasibility Framing

## Goal

Make infeasible playground results read around failed needs first, with candidate-level blockers presented as supporting causes rather than peer-level unrelated sections.

## Why

Current infeasible output is technically richer than raw JSON, but it still flattens:

- `no-eligible-candidate`
- `availability-conflict`
- other candidate-level blockers

into separate top-level groups.

That is not the best evaluative shape. For a user, the primary question is:

- which need failed

Then:

- why that need could not be filled
- which candidates were blocked and by what

Example motivating case:

- `n3`
- shift `s2`
- position `pFork`
- no eligible candidate
- `c3` blocked by availability
- others not qualified

The UI should present that as one coherent failure narrative.

## Scope

- [x] restructure infeasible rendering in the playground
- [x] group explanations primarily by failed need
- [x] show a short failed-need summary first
- [x] show supporting causes under that need
- [x] preserve access to the underlying explanation types, but de-emphasize them as the main reading order

## Constraints

- do not redesign solver semantics
- do not redesign regrouping semantics broadly unless a tiny shaping helper is clearly needed
- prefer UI-side composition first
- keep the evaluator thin

## Likely Files

- `apps/feasibility-playground/playground.mjs`
- `apps/feasibility-playground/README.md`

Optional, only if clearly justified:

- `packages/feasibility-core/src/explanations.ts`
- `packages/feasibility-core/EXPLANATIONS.md`

## Acceptance Criteria

- [x] infeasible runs center first on failed needs
- [x] the failed need summary includes shift and position context
- [x] candidate-level blockers appear as supporting detail under that need
- [x] the motivating forklift-unavailable case reads as one coherent failure narrative

## Verification

- [x] `pnpm --filter feasibility-playground build`
- [x] `pnpm --filter feasibility-playground typecheck`
- [x] `pnpm --filter feasibility-playground test`

## Status

🟢 **COMPLETE** — 2026-04-03
