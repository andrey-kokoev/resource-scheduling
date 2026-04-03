# Baseline Repair First-Pass Review

## Purpose

This is the honest consolidation of the first-pass baseline-repair surface.

The primary-path decision still holds:

- baseline replication plus repair is the stronger workflow than trying to make recurrence the primary authoring path
- the current feasibility solver remains the inner concrete engine
- repair orchestration stays outside the solver boundary

This review does not add behavior. It records what the current first-pass code actually supports, what is still missing for practical use, where the surface is awkward, and what the next highest-value slice should be.

## What Exists Today

The baseline-repair surface is no longer just a proposal. The package already has a first-pass implementation split into workflow-layer pieces:

- hard-lock packaging in `hard-locks.ts`
- copied baseline state in `baseline.ts`
- attempt compilation in `repair-attempt.ts`
- one-ladder orchestration in `repair-orchestrator.ts`
- solver execution through the ordinary feasibility engine

The tests also reflect that split:

- `hard-locks.test.ts`
- `baseline-state.test.ts`
- `repair-attempt.test.ts`
- `repair-orchestrator.test.ts`

## What The First Pass Actually Supports

The current implementation supports a narrow but coherent repair workflow:

- copy a baseline schedule into workflow-layer state
- carry hard locks as immovable preassignments
- attach retention annotations to copied assignments
- apply a small set of explicit baseline deltas
- compile the copied state into concrete finite solve attempts
- run a three-stage ladder:
  - strongest retention
  - candidate + shift retention
  - full release
- return the selected attempt and the solver result

At the attempt level, the workflow can already report:

- retained assignments
- released assignments
- hard-lock conflicts
- open gaps
- attempt validity
- concrete solver feasibility/infeasibility

That is enough to prove the boundary shape, but not yet enough to be treated as a complete end-user repair product.

## What Is Still Missing For Practical Use

The biggest missing pieces are caller-facing, not solver-facing:

- there is no single top-level repair API that hides the ladder mechanics
- there is no stable repair report that explains why a stage was relaxed or rejected
- there is no baseline-vs-final comparison output for external users
- there is no richer search strategy beyond the fixed three-stage pass
- there is no polished documentation path for “how do I repair a copied baseline?”

In practice, that means the workflow is usable as an internal boundary and a testable substrate, but not yet as a clean external repair feature.

## Where The Surface Is Awkward Or Inconsistent

The awkwardness is mostly boundary clarity, not solver correctness:

- the package README and workflow doc can read more final than the implementation really is
- `src/index.ts` exposes a broad set of repair internals next to the preferred caller flow, which is valid but noisy
- `CopiedBaselineState` is intentionally separate from `DomainInput`, but callers still have to learn both shapes before they can use the workflow
- the ladder is fixed at three stages, so the naming sounds more general than the current implementation scope
- hard-lock, retention, and repair terms are cleanly separated in code, but still easy to blur in caller-facing prose

None of those are serious contradictions. They are signs that the boundary is real but still early.

## Where The Current Solver Sits

The solver sits strictly inside the workflow.

It only sees:

- one concrete finite solve attempt
- hard locks packaged as concrete preassignments
- ordinary feasibility constraints

It does not see:

- copied baseline lineage
- retention policy
- orchestration state
- stage selection logic

That separation is the right one for this first pass.

## Next Highest-Value Slice

The next highest-value slice is a single caller-facing repair wrapper and report shape.

That slice should:

- accept copied baseline state
- run the current ladder
- return the selected stage, solver result, conflicts, and a short repair summary
- keep the existing solver boundary unchanged

That is higher value than adding more ladder stages right now, because practical users need one stable repair entry point before they need a more complex search strategy.

## Decision

Keep baseline replication plus repair as the primary workflow.

Treat the current code as first-pass support for that workflow, not as a finished external API.
