# Staffing Scheduling Readiness Harness

This artifact is the external-evaluation companion to `READINESS.md`.

## Criteria

- Supported domain features
- Explanation quality
- API clarity
- Documentation completeness
- Test realism

## Canonical External Flow

1. Build `DomainInput`
2. `compileDomain(input)`
3. `solve(solveInput)`
4. If `feasible === false`, `buildRegroupingContext(input)`
5. `regroupToDomainExplanations(result, context)`

## Supported / Unsupported Snapshot

| Area | Supported | Still Unsupported |
|---|---|---|
| Staffing feasibility | Hard-constraint assignment over qualifications, availability, shift patterns, utilization, rest, consecutive days, and coupled coverage | Optimization, ranking, soft preferences, partial fill |
| Domain fit | Early plant and shift-based staffing workflows | Production scheduling, machine sequencing, broad workforce planning |
| Explanations | Primitive reasons regroup to staffing terms | Automated remediation / repair advice |
| API | Clear preferred subset documented for external callers | Smaller export surface / curated public SDK wrapper |
| Tests | Realistic examples plus end-to-end scenario coverage | Large fixture library / regression harness at scale |

## Canonical Scenarios

- minimal feasible staffing solve
- infeasible staffing solve with regrouped explanations
- manufacturing-oriented staffing case
- multi-rule interaction case
- multi-line site staffing flow
- site-aware multi-site staffing flow
- line-aware coverage failure with regrouped site/line explanation

## What To Look For

- Does the package answer feasibility clearly?
- Do regrouped explanations point to staffing facts rather than primitive IDs?
- Can an external caller follow the docs without reading internal solver modules?
- Do the examples match implemented behavior exactly?

## Next Milestone After Current Closure

Expand the scenario harness into a reusable fixture library if more external customers need repeated scenario validation.

## Regression Boundary

Site and line are part of the canonical regression surface now. They should remain expressed as staffing context and regrouping metadata, not as new primitive solver families or sequencing logic.
