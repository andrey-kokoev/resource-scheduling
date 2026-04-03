---
status: COMPLETE
owner: codex
---

# 20260403-045 Playground Complete Sample Matrix

## Goal

Expand the playground dropdown so it covers the major implemented functionality of `feasibility-core`, not just a few demo cases.

## Why

The playground is becoming the practical coverage surface for the package.

It should expose one sample per major implemented rule family or domain boundary so a user can try the real behavior directly from the dropdown.

## Scope

- expand the built-in sample scenario set in the playground
- keep the selector as the primary interaction path
- keep the JSON editor visible and editable
- document the available built-in scenarios

## Required Coverage

At minimum, include sample scenarios for:

- base feasible staffing solve
- availability conflict
- qualification gap / no-eligible-candidate
- shift-pattern conflict
- rolling utilization max conflict
- minimum rest conflict
- consecutive-work limit conflict
- coverage conflict
- site-scoped coverage behavior
- line-aware context where currently supported by the domain layer

If two concerns naturally combine in one sample, that is acceptable, but coverage should still be explicit.

## Constraints

- do not add product-style editing flows
- keep scenarios derived from a shared base where practical
- do not widen solver semantics
- prefer clear scenario labels and descriptions over a large number of tiny variations

## Likely Files

- `apps/feasibility-playground/scenario.mjs`
- `apps/feasibility-playground/playground.mjs`
- `apps/feasibility-playground/README.md`

## Acceptance Criteria

- dropdown covers the major implemented rule families
- each sample has a clear label and short description
- at least one sample remains feasible
- multiple infeasible samples exercise different rule families
- docs list the built-in sample set

## Verification

- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground typecheck`
- `pnpm --filter feasibility-playground test`
