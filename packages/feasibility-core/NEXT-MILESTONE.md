# Feasibility Core Next Milestone

**Decision date**: 2026-04-03

## Candidate Comparison

| Milestone | Real-world value | Implementation risk | Abstraction pressure |
|---|---|---|---|
| Richer labor-pattern policy | High | Medium | Medium |
| Stronger calendar / timezone configuration | Medium | Low | Low |
| More expressive coverage coupling | High | Medium | Medium |
| Multi-site / line-level domain structure | Very high | Medium-high | High |
| Cost / overtime layer after feasibility | High, but later | High | High |

## Chosen Milestone

**Multi-site / line-level domain structure**

This is the next domain-expansion milestone because it increases the package's usefulness for real manufacturing and facility staffing without changing the package from a feasibility kernel into an optimizer.

It gives the biggest near-term increase in applicability for external users who already need:

- multiple production lines or sites
- line-local staffing requirements
- coverage rules tied to a site or line rather than only a generic shift

## Why This Wins Now

- It has the highest practical value for the manufacturing-oriented use cases the package already models well.
- It stays within the existing hard-feasibility framing.
- It puts pressure on the current kernel in a useful way without jumping to optimization, fairness, or scheduling repair.

## Current Foundation

The first foundation slice for this milestone is now in place:

- site and line entities exist in the domain model
- shifts may carry a site reference
- needs may carry a line reference
- coverage rules may now scope to a site without entering the primitive kernel
- line-scoped coverage rules can flow through regrouping without changing the primitive kernel

Scenario pressure from the milestone harness now suggests the intended boundary is:

- site scopes shifts and the staffing context around them
- line scopes needs and line-local coverage rules
- site/line identifiers should surface in regrouped explanations, not in primitive solver semantics
- the primitive kernel remains unaware of site/line as first-class solver concepts

## Next Supporting Slice

The next supporting slice within this milestone is **line-aware regrouping metadata**.

Site-aware coverage scoping is now implemented. The remaining support work is to keep explanation metadata consistent as the site/line scenario set grows, without changing the primitive kernel boundary.

## Explicit Out Of Scope

- optimization or ranking of feasible schedules
- cost / overtime accounting
- soft preferences and fairness
- production sequencing and machine-job planning
- timezone overhaul as a separate infrastructure milestone
- broad labor-policy expansion unrelated to site or line structure
