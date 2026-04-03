---
status: PLANNED
owner: unassigned
---

# 20260403-041 Playground Selectable Sample Scenarios

## Goal

Replace manual JSON editing as the primary way to try common playground cases with a small set of selectable sample scenarios.

## Why

The current evaluator works, but trial users should not need to hand-edit raw JSON just to explore:

- a base feasible sample
- a forklift-unavailable failure
- a lead-missing failure
- a coverage-rule failure

The playground should stay thin, but it needs a better way to switch between representative cases.

## Scope

- [x] add a scenario selector to the playground UI
- [x] provide a small set of built-in sample scenarios
- [x] keep the JSON editor visible and editable
- [x] loading a sample should replace the editor contents with that sample
- [x] keep the existing evaluation flow unchanged

## Initial Scenario Set

- Base sample plant
- Forklift unavailable
- Lead missing
- Coverage rule impossible

If another scenario is added during implementation, keep the set small and obviously useful.

## Constraints

- do not turn this into a form-builder UI
- do not add persistence
- do not add server-side state
- do not broaden product scope beyond evaluator usability
- prefer deriving variants from the existing sample plant rather than duplicating large JSON blobs where possible

## Likely Files

- `apps/feasibility-playground/index.html`
- `apps/feasibility-playground/playground.mjs`
- `apps/feasibility-playground/scenario.mjs`
- `apps/feasibility-playground/README.md`

## Acceptance Criteria

- [x] user can choose among a small set of sample scenarios from the UI
- [x] chosen sample loads into the JSON editor without manual editing
- [x] base feasible scenario still works
- [x] at least one infeasible sample clearly renders regrouped explanations
- [x] docs mention the selector and available built-in scenarios

## Verification

- [x] `pnpm --filter feasibility-playground build`
- [x] `pnpm --filter feasibility-playground typecheck`
- [x] `pnpm --filter feasibility-playground test`

## Status

🟢 **COMPLETE** — 2026-04-03
