# Batch Flow Scheduling Docs

This is the conceptual spine for the batch-flow scheduling package.

Read in this order:

1. [001-what-this-is.md](./001-what-this-is.md)
2. [002-invariants.md](./002-invariants.md)
3. [003-solver-graph.md](./003-solver-graph.md)
4. [004-api-boundary.md](./004-api-boundary.md)
5. [005-workspace-ux-boundary.md](./005-workspace-ux-boundary.md)
6. [006-api-boundary-clarifications.md](./006-api-boundary-clarifications.md)

These docs define:

- what the package is
- what must remain invariant
- how the domain projects into a solver-facing graph
- the v1 API boundary for the headless scheduling service
- the v1 workspace UX for interacting with the service
- implementation-grade clarifications for the API boundary
