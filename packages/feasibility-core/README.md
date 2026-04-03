# Feasibility Core

`feasibility-core` is a hard-constraint feasibility engine for shift-based staffing.

It answers one question:

**Can every required demand unit be assigned to a qualified, available agent without violating hard rules?**

## Start Here

1. Read [EXAMPLES.md](./EXAMPLES.md) for the recommended caller flow.
2. Read [EXPLANATIONS.md](./EXPLANATIONS.md) to see how failures are regrouped.
3. Read [CONTRACT.md](./CONTRACT.md) for the semantic boundary.
4. Use the rule docs when you need family-specific behavior:
   - [AVAILABILITY.md](./AVAILABILITY.md)
   - [PATTERN-COMPATIBILITY.md](./PATTERN-COMPATIBILITY.md)
   - [COVERAGE-RULES.md](./COVERAGE-RULES.md)

## Supported Features

- exact-match qualifications with full-interval validity
- candidate availability and time off as hard eligibility
- weekday/weekend and shift-pattern compatibility
- minimum rest and consecutive-work constraints
- rolling-window utilization max
- global and site-scoped coverage coupling rules
- multi-site / line-aware coverage regrouping metadata
- explanation regrouping from primitive failures to domain terms
- shared runtime sample catalog for playground and sweep fixtures

## Preferred Usage Flow

```ts
import {
  DomainInput,
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
} from 'feasibility-core';

const solveInput = compileDomain(domainInput);
const result = solve(solveInput);

if (!result.feasible) {
  const context = buildRegroupingContext(domainInput);
  const explanations = regroupToDomainExplanations(result, context);
}
```

The preferred consumer subset is:

- `DomainInput`
- `compileDomain`
- `solve`
- `buildRegroupingContext`
- `regroupToDomainExplanations`

Everything else in the package barrel is available, but it is advanced surface rather than the recommended starting point.

If you want a thin browser evaluator that uses this flow on a sample plant, see `apps/feasibility-playground`.
If you want a boundary-first explanation of what enters and leaves the solver, see `apps/feasibility-playground/boundary.html`.

## Current Limitations

- no optimization or ranking among feasible schedules
- no partial-fill success mode
- no preference or fairness layer
- no qualification substitution lattice
- no production sequencing or machine-job planning
- no line-level sequencing or production-flow modeling

## Next Domain Milestone

The next explicit domain-expansion milestone is **multi-site / line-level domain structure** for manufacturing and facility staffing.

That milestone is about modeling site or line-local coverage requirements more directly. Site and line should remain domain metadata that show up on regrouped coverage explanations, not new primitive witness families. It is not about optimization, overtime, or production sequencing.

The current intended boundary is:

- `Site` scopes shifts and site-local staffing context
- `Line` scopes needs and line-local coverage rules
- coverage rules may also scope to a site for site-local staffing expectations
- regrouped explanations should preserve site and line identifiers for callers

Site-aware coverage rule scoping is now implemented.

The next support slice within that milestone is **line-aware regrouping metadata**.

## Orientation Docs

- [READINESS.md](./READINESS.md)
- [NEXT-MILESTONE.md](./NEXT-MILESTONE.md)
- [EXAMPLES.md](./EXAMPLES.md)
- [EXPLANATIONS.md](./EXPLANATIONS.md)
- [CONTRACT.md](./CONTRACT.md)
