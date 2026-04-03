# Staffing Scheduling Readiness

**Assessment date**: 2026-04-03  
**Scope**: external staffing-feasibility library readiness

## Evaluation Criteria

- Supported domain features
- Explanation quality
- API clarity
- Documentation completeness
- Test realism

## Summary

`staffing-scheduling` is ready for early external users who need hard-constraint staffing feasibility and can live within a clearly bounded model.

It is not yet ready as a general-purpose workforce optimization library, and it should not be presented that way.

## Supported / Unsupported Matrix

| Area | Supported | Unsupported / Deferred |
|---|---|---|
| Core staffing feasibility | Exact-match qualification gating, availability, shift-pattern compatibility, rolling max utilization, minimum rest, max consecutive days, site-scoped and coupled coverage rules | Optimization, ranking, soft preferences, partial fill |
| Domain fit | Early staffing workflows for plants and similar shift-based operations | General scheduling, machine sequencing, production planning |
| Explanations | Structured primitive reasons and domain regrouping for the implemented rule families | Rich remediation advice, ranking of alternative fixes, explanation of every infeasible branch |
| API clarity | Clear recommended flow via `DomainInput -> compileDomain -> solve -> regroup` and a dedicated readiness harness | Broad export surface still exposes implementation-oriented helpers |
| Documentation | Contract, examples, rule-family docs, and readiness harness are present and aligned | Some docs still read like implementation notes rather than a polished external SDK guide |
| Test realism | Covers realistic staffing scenarios, manufacturing-oriented cases, site/line regression guards, and a dedicated readiness harness | No large fixture library or long-form scenario harness yet |

## Key Blockers And Rough Edges

- The API surface is intentionally broad; docs now recommend a smaller caller subset, but the top-level export shape is still noisier than ideal.
- The package solves feasibility, not optimization. That boundary is clear in docs, but it remains a common source of expectation mismatch for external users.
- Explanation quality is good for the implemented rule families, but it is still rule-shaped rather than analyst-shaped. It tells callers what failed, not how to repair it.
- Test coverage is now anchored by a dedicated readiness harness, including site/line regression guards, but the scenario library is still intentionally small.

## Site / Line Boundary

The current multi-site / line foundation should be read as:

- `Site` is shift-scoped context
- `Line` is need-scoped and coverage-scoped context
- site and line identifiers should surface in regrouped explanations, not alter primitive solver semantics
- site-scoped coverage rules are domain-side filters over the same hard-feasibility kernel

That boundary keeps the milestone grounded in staffing scenarios instead of production sequencing or schema-heavy plant modeling.

## Recommended Next Milestone

Expand the package's domain model to support **multi-site / line-level structure** for manufacturing and facility staffing, using the existing readiness harness to validate the new scenarios.

Site-aware coverage rule scoping is now implemented. The next support slice is **line-aware regrouping metadata**, while regrouping metadata and scenario fixture growth remain support work.

## First-Contact Entry Point

For a new external consumer, start with:

1. [README.md](./README.md)
2. [EXAMPLES.md](./EXAMPLES.md)
3. [EXPLANATIONS.md](./EXPLANATIONS.md)
4. [CONTRACT.md](./CONTRACT.md)

The preferred consumer API is the small flow documented in those files:

- `DomainInput`
- `compileDomain`
- `solve`
- `buildRegroupingContext`
- `regroupToDomainExplanations`

## Decision

**Ready for early external use** in bounded staffing-feasibility workflows.

**Not ready** to be marketed as a general optimization or workforce-planning platform.
