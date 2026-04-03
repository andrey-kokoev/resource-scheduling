# Infeasibility Explanations

**Package**: `staffing-scheduling`  
**Purpose**: stabilize primitive failure output and regroup it into domain terms

This document describes the current infeasibility surface produced by the solver and the deterministic regrouping rules used by domain callers.

## Overview

The solver operates on primitive entities (`DemandUnit`, `Agent`) and emits primitive infeasibility reasons. The explanation layer maps those reasons back to domain concepts (`Need`, `Shift`, `Position`, `Candidate`).

If you are onboarding as an external consumer, read [README.md](./README.md) and [EXAMPLES.md](./EXAMPLES.md) first, then return here for failure mapping.

The contract for this package is:

- primitive reasons are deduped by exact structural equality
- primitive reasons are sorted deterministically before returning
- regrouped domain explanations are also sorted deterministically
- no reason family is silently dropped during regrouping when a mapping exists
- site and line are domain metadata, not primitive witness fields; they surface only on regrouped coverage explanations when the domain input carries them

## Primitive Reason Inventory

The current primitive reason families are:

- `no-eligible-agent`
- `overlap-conflict`
- `capability-validity-gap`
- `availability-conflict`
- `shift-pattern-conflict`
- `coverage-conflict`
- `utilization-conflict`
- `unfilled-demand`
- `rest-violation`
- `consecutive-days-violation`

### Notes on weak or derived fields

- `utilization-conflict` now carries `demandUnitId`, `windowStart`, `windowEnd`, and `affectedDemandUnitIds` so regrouping does not need to approximate the window from the current clock.
- `coverage-conflict` already carries the rule-local ids needed for regrouping (`shiftId`, `demandUnitIds`, and optional position or qualification ids).
- site-scoped coverage rules may regroup with `siteId` when the domain input carries that metadata.
- line-scoped coverage rules may regroup with `lineId` when the domain input carries that metadata.
- site and line do not create separate primitive reason families; they are only carried through regrouped coverage explanations.
- `no-eligible-agent` remains the summary reason for empty eligibility. Detailed blockers such as `capability-validity-gap`, `availability-conflict`, and `shift-pattern-conflict` may appear alongside it.

## Deterministic Ordering

Primitive reasons are normalized in the solver boundary with the following type order:

1. `capability-validity-gap`
2. `availability-conflict`
3. `shift-pattern-conflict`
4. `overlap-conflict`
5. `utilization-conflict`
6. `coverage-conflict`
7. `rest-violation`
8. `consecutive-days-violation`
9. `unfilled-demand`
10. `no-eligible-agent`

Within the same type, sort keys are derived from the ids and window facts already carried on the reason payload.

## Domain Regrouping

`regroupToDomainExplanations(result, context)` maps primitive reasons into domain-facing explanations.

### Mapping table

| Primitive reason | Domain explanation |
| --- | --- |
| `no-eligible-agent` | `no-eligible-candidate` or `unfilled-need` |
| `overlap-conflict` | `overlap-conflict` |
| `availability-conflict` | `availability-conflict` |
| `shift-pattern-conflict` | `shift-pattern-conflict` |
| `coverage-conflict` | `coverage-conflict` |
| `utilization-conflict` | `utilization-max-violation` |
| `unfilled-demand` | `unfilled-need` |
| `rest-violation` | `rest-violation` |
| `consecutive-days-violation` | `consecutive-days-violation` |

### Regrouping behavior

- `no-eligible-agent` groups by `Need`.
- `overlap-conflict` groups by `Candidate`.
- `availability-conflict` stays at the candidate/need/shift level.
- `shift-pattern-conflict` stays at the candidate/need/shift level.
- `coverage-conflict` becomes a shift-scoped coverage violation with affected need ids, and may carry site or line metadata when the domain rule is scoped that way.
- `utilization-conflict` becomes a candidate-scoped rolling-window violation with the exact window and affected shifts.
- `unfilled-demand` groups by `Need`.
- rest and consecutive-days violations preserve their rule-local context.

## Current Domain Explanation Surface

- `no-eligible-candidate`
- `unfilled-need`
- `overlap-conflict`
- `availability-conflict`
- `shift-pattern-conflict`
- `coverage-conflict`
- `utilization-max-violation`
- `rest-violation`
- `consecutive-days-violation`

## Preferred Consumer Path

1. Solve with `compileDomain(input)` and `solve(solveInput)`.
2. If `result.feasible` is false, call `buildRegroupingContext(input)`.
3. Pass both into `regroupToDomainExplanations(result, context)`.
4. Present regrouped domain explanations to users instead of primitive reasons.

For external callers, the preferred import subset is:

- `DomainInput`
- `compileDomain`
- `solve`
- `buildRegroupingContext`
- `regroupToDomainExplanations`

## Implementation Rule

The explanation layer should prefer exact primitive facts over reconstructed approximations. If the primitive reason already knows the relevant ids or window bounds, regrouping should use them directly.
