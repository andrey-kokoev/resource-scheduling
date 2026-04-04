# Batch Flow Scheduling

This package is the sibling scheduling track for line, batch, and flow-oriented scheduling.

It is still early, but it now has a defined conceptual spine.

## Start Here

1. Read [docs/README.md](./docs/README.md) for the docs hub.
2. Read [docs/001-what-this-is.md](./docs/001-what-this-is.md) for package identity.
3. Read [docs/002-invariants.md](./docs/002-invariants.md) for the package invariants.
4. Read [docs/003-solver-graph.md](./docs/003-solver-graph.md) for the solver-facing projection.

## Current Scope

The old `packages/line-scheduling.ts` placeholder has been replaced by a package boundary with room for:

- line and station domain types
- batch and flow entities
- scheduling policy and constraint families
- a future playground that parallels the staffing scheduling evaluator

Current status:

- conceptual spine docs established
- domain types implemented
- validation implemented
- deterministic concrete batch-step derivation implemented
- solver-neutral graph projection implemented
- neutral constraint-model export implemented
- neutral solution shape implemented
- sample model and example flow implemented

There is still no actual scheduling solver, but the package now has a first public flow:

1. `createSampleBatchFlowModel()`
2. `compileBatchFlowDomain(model)`
3. `buildBatchFlowSolution(schedule, concreteBatchSteps, processorInstances)`

Key exports:

- `compileBatchFlowDomain(...)`
- `buildBatchFlowSolution(...)`
- `createSampleBatchFlowModel()`
- `compileSampleBatchFlow()`
- `buildSampleBatchFlowSolution()`
