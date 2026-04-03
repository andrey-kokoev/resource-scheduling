# Task 20260403-033: Domain Path Next Site-Line Coverage Scope

**Path**: Domain
**Constraint**: This task must define the second slice of the site/line milestone explicitly, based on what lands in `027`-`029`.

## Objective

Choose and define the next domain slice after the initial site/line foundation lands.

## Candidate directions

- [x] site-aware coverage rule scoping
- [ ] line-aware regrouping metadata
- [ ] site/line-aware scenario fixture growth

## Deliverables

- [x] compare the candidate directions
- [x] choose one next domain slice
- [x] define what is out of scope

## Chosen Slice

**Site-aware coverage rule scoping**

This is the next domain slice because it is the first follow-on extension that still changes caller-visible staffing semantics while staying inside the hard-feasibility kernel boundary.

Site-aware scoping remains a domain concern. The primitive kernel continues to see only compiled demand units and hard constraints.

## Out Of Scope

- line-aware regrouping metadata, because that is support work for the chosen slice rather than the next domain slice itself
- site/line-aware scenario fixture growth, because that is validation support rather than domain structure
- optimization, fairness, cost, and production sequencing

## Status

🟢 **COMPLETE** — 2026-04-03
