---
status: COMPLETE
owner: codex
---

# 20260403-051 Sample Matrix Semantic Reconciliation

## Goal

Make the expanded sample matrix semantically honest:

- remove duplicate or non-distinct samples
- ensure each sample actually covers the behavior its label claims
- explicitly document any newly exercised rule families

## Why

The current sample list is broader, but at least one sample appears non-distinct:

- `Base feasible sample`
- `Site-scoped coverage`

If the matrix is going to act as a functionality surface, its samples must be meaningfully different.

## Scope

- review the current sample catalog
- identify duplicate or weakly distinguished samples
- adjust scenarios or labels so each sample is semantically justified
- keep the dropdown readable
- update docs and expectations if needed

## Constraints

- prefer tightening sample meaning over adding more scenarios
- do not widen solver semantics
- if a sample depends on newly added rule-family support, document that explicitly

## Likely Files

- shared sample catalog source
- sample sweep test
- playground README

## Acceptance Criteria

- each sample label matches a real distinct behavioral slice
- duplicate or redundant samples are removed or made meaningfully distinct
- sample sweep expectations still pass and remain readable

## Verification

- `npm test`
- `pnpm --filter feasibility-playground test`
