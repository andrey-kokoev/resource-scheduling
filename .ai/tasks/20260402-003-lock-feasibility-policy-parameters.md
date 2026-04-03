# Task 20260402-003: Lock Feasibility Policy Parameters

**Architectural Authority**: The 2026-04-02 PDA sequence identifying residual policy freedom in feasibility semantics and requiring explicit parameter locking before implementation.
**Constraint**: This task must turn remaining decision-relevant policy choices into explicit locked semantics for the first package.

## Objective

Freeze the remaining policy parameters for the first feasibility package so the solver contract can be implemented without tacit semantic drift.

This task exists to move the formulation closer to PDA closure by converting residual freedom into explicit policy.

## PDA Framing

### Current State

Task `20260402-001` separates primitive and derived concepts.

Task `20260402-002` isolates the primitive constraint contract as the main live ambiguity and separates prefix-checkable from completion-only semantics.

The remaining live ambiguity is now concentrated in a small set of policy-shaped parameters that still permit materially different continuations.

### Live Ambiguities To Eliminate

- what `min` utilization means in the first package
- what “qualified during a shift” means
- whether coverage is solver success semantics or just another global rule
- whether partial-fill semantics exist in the first package

This task resolves those ambiguities explicitly.

## Locked Decisions

- [x] `min` utilization is **not** part of the first feasibility package
- [x] `max` utilization is a hard feasibility constraint
- [x] qualification validity uses **full-interval coverage**
- [x] full coverage is **solver success semantics**
- [x] partial fill is **out of scope** for the first package
- [x] infeasibility in package `001` means no complete non-violating assignment exists under the locked semantics

## Deliverables

### Step 1: Add Policy Lock Artifact

Create a durable artifact documenting the locked parameters for package `001`, such as:

- [x] `packages/feasibility-core/POLICY.md`
- [x] `packages/feasibility-core/src/policy.ts`
- [x] both, if needed

**Artifacts Created**:
- `packages/feasibility-core/POLICY.md` - Human-readable policy lock
- `packages/feasibility-core/src/policy.ts` - Compile-time and runtime policy constants

### Step 2: Define Locked Semantics Explicitly

Document and enforce:

- [x] `min` utilization is deferred to later work
- [x] `max` utilization is enforced as a hard rule
- [x] candidate qualification must cover the entire shift interval
- [x] solve success means all demand units are filled
- [x] no partial-fill success result exists in package `001`

**Policy Constants** (in `src/policy.ts`):
- `MIN_UTILIZATION_DEFERRED = true`
- `MAX_UTILIZATION_HARD_CONSTRAINT = true`
- `QUALIFICATION_FULL_INTERVAL_COVERAGE = true`
- `COVERAGE_REQUIRES_FULL_ASSIGNMENT = true`
- `PARTIAL_FILL_OUT_OF_SCOPE = true`

### Step 3: Separate Deferred Policy

List explicitly what is deferred beyond package `001`:

- [x] minimum-utilization obligations
- [x] partial-fill semantics
- [x] optimization / ranking
- [x] preference handling
- [x] fairness / balancing

**Deferred Types** (in `src/policy.ts`):
- `MinUtilizationDeferred`
- `PartialFillDeferred`
- `OptimizationDeferred`
- `PreferenceHandlingDeferred`
- `FairnessDeferred`
- `ScheduleRepairDeferred`

### Step 4: Align Contract Language

Update the constraint-contract task or contract artifact so it reflects the locked policy choices and no longer leaves them tacit.

- [x] `20260402-002` references or incorporates the policy lock
- [x] primitive contract language remains domain-agnostic
- [x] deferred policy is clearly marked as deferred, not omitted accidentally

**Cross-Reference**: Task `20260402-002` updated with "Policy Lock Integration" section linking to this task.

## Architecture Constraints (Do NOT Add)

- [ ] No reintroduction of `min` utilization into package `001`
- [ ] No configurable partial-fill mode yet
- [ ] No optimization objective
- [ ] No staffing-domain leakage into primitive contracts

## Acceptance Criteria

- [x] The first-package policy choices are written in a durable artifact
- [x] `min` vs `max` utilization semantics are no longer ambiguous
- [x] qualification validity semantics are explicit
- [x] full coverage vs partial fill semantics are explicit
- [x] the first package can now be implemented without hidden policy decisions

## Status

✅ **COMPLETED** — 2026-04-02

**Deliverables**:
- `packages/feasibility-core/POLICY.md` - Policy lock documentation
- `packages/feasibility-core/src/policy.ts` - TypeScript policy constants
- Task `20260402-002` updated with policy lock integration

## Next Step

After this task, the next PDA move is likely one of:

- define `Need` to `DemandUnit` compilation exactly
- define the infeasibility witness contract
- choose a first implementation strategy against the now-locked contract
