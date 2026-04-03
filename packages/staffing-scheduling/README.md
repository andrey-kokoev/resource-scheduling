# Staffing Scheduling

`staffing-scheduling` is a hard-constraint feasibility engine for shift-based staffing.

It answers one question:

**Can every required demand unit be assigned to a qualified, available agent without violating hard rules?**

## Start Here

1. Read [docs/001-what-this-is.md](./docs/001-what-this-is.md) for the package identity.
2. Read [docs/002-invariants.md](./docs/002-invariants.md) for the non-negotiable semantics.
3. Read [docs/003-solver-graph.md](./docs/003-solver-graph.md) for the compiled solver-facing view.
4. Then use the operational docs:
   - [EXAMPLES.md](./EXAMPLES.md)
   - [EXPLANATIONS.md](./EXPLANATIONS.md)
   - [CONTRACT.md](./CONTRACT.md)
5. Use the rule docs when you need family-specific behavior:
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
- recurrence domain types and a boundary entry point

## Preferred Usage Flow

```ts
import {
  DomainInput,
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
} from 'staffing-scheduling';

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

If you want a thin browser evaluator that uses this flow on a sample plant, see `apps/staffing-scheduling-playground`.
If you want a boundary-first explanation of what enters and leaves the solver, see `apps/staffing-scheduling-playground/boundary.html`.

## Current Limitations

- no optimization or ranking among feasible schedules
- no partial-fill success mode
- no preference or fairness layer
- no qualification substitution lattice
- no recurring scheduling in the primitive solver boundary; recurrence is a planned / likely domain-side expansion
- no production sequencing or machine-job planning
- no line-level sequencing or production-flow modeling

## Deeper Design Docs

- [docs/010-baseline-repair-workflow.md](./docs/010-baseline-repair-workflow.md)
- [docs/011-recurring-scheduling-boundary.md](./docs/011-recurring-scheduling-boundary.md)
