# Staffing Scheduling Docs

This is the conceptual spine for the staffing scheduling package.

Read in this order:

1. [001-what-this-is.md](./001-what-this-is.md)
2. [002-invariants.md](./002-invariants.md)
3. [003-solver-graph.md](./003-solver-graph.md)

Then continue with the deeper workflow docs when needed:

4. [010-baseline-repair-workflow.md](./010-baseline-repair-workflow.md)
5. [011-recurring-scheduling-boundary.md](./011-recurring-scheduling-boundary.md)

These docs define:

- what the package is
- what must remain invariant
- how the domain projects into the solver-facing structure
- where repair and recurrence sit relative to the core feasibility engine
