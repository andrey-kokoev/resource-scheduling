# Task 20260402-005: Minimum-Rest Constraint Semantics

**Architectural Authority**: The 2026-04-02 PDA sequence selecting minimum-rest constraints as the next hard-rule pressure test for the primitive feasibility model.
**Constraint**: This task must test whether rest-period rules can be expressed cleanly using the current primitive ontology without introducing unnecessary new domain nouns.

## Objective

Define the semantics for a minimum-rest hard constraint between assignments of the same agent.

This task exists to pressure-test whether the primitive kernel can absorb another common staffing rule using only intervals, assignments, and constraints.

## PDA Framing

### Current State

Tasks `001`-`004` progressively de-arbitrarize:

- primitive vs derived concepts
- constraint contract
- locked first-package policy semantics
- infeasibility witness regrouping

The next useful pressure test is whether a common temporal labor rule can be represented without changing the primitive ontology.

### Live Ambiguities To Eliminate

- whether minimum rest is a pairwise assignment constraint or requires richer sequence semantics
- how interval boundary behavior affects rest evaluation
- whether adjacent shifts with zero gap are legal
- what primitive witness shape a rest violation should have
- how a rest violation regroups back to domain explanation

This task resolves those ambiguities for the first rest-rule slice.

## Locked Decisions

- [x] Minimum rest is a hard feasibility constraint
- [x] The first slice concerns same-agent assignment separation only
- [x] This task targets the simplest coherent rest rule: minimum end-to-start gap
- [x] The primitive ontology should remain unchanged if possible
- [x] More complex sequence-dependent fatigue rules are deferred

## Deliverables

### Step 1: Define Primitive Rest Semantics

Specify a primitive rule for:

- [x] minimum required gap between two assignments of the same agent

Clarify:

- [x] gap definition
- [x] whether rule is symmetric over assignment pairs
- [x] whether overlapping intervals are handled separately or as a special case of insufficient rest
- [x] whether zero-gap adjacency is allowed when minimum rest is zero only

**Artifact**: `packages/feasibility-core/REST.md` section "Step 1: Primitive Rest Semantics"

### Step 2: Lock Interval Boundary Semantics Required By Rest

Specify the interval semantics necessary to evaluate rest rules:

- [x] whether intervals are half-open, closed, or otherwise defined
- [x] how end-to-start touching intervals are interpreted
- [x] whether exact-boundary equality counts as zero rest

**Artifact**: `packages/feasibility-core/REST.md` section "Step 2: Interval Boundary Semantics"

### Step 3: Define Constraint Classification

Specify whether minimum-rest constraints are:

- [x] prefix-checkable
- [x] completion-only
- [x] both, if evaluated in different modes

For the first slice, make explicit how the solver should use the rule during search.

**Artifact**: `packages/feasibility-core/REST.md` section "Step 3: Constraint Classification"

### Step 4: Define Primitive Witness Shape

Specify the primitive infeasibility witness for rest violations, including:

- [x] involved agent
- [x] conflicting assignments or demand references
- [x] required minimum rest
- [x] actual gap
- [x] violated rule identity

**Artifacts**: 
- `packages/feasibility-core/REST.md` section "Step 4: Primitive Witness Shape"
- `packages/feasibility-core/src/primitive/types.ts` - `RestViolationReason` added to `InfeasibilityReason` union

### Step 5: Define Domain Regrouping

Specify how a primitive rest violation becomes a domain explanation in terms of:

- [x] `Candidate`
- [x] conflicting `Shift`s
- [x] affected `Need` / `Position`, if applicable

**Artifacts**:
- `packages/feasibility-core/REST.md` section "Step 5: Domain Regrouping"
- `packages/feasibility-core/src/explanations.ts` - `InsufficientRestViolation` added to `DomainExplanation` union, `regroupRestViolations()` function

### Step 6: Create Durable Artifact

Create one concrete artifact, such as:

- [x] `packages/feasibility-core/REST.md`
- [x] `packages/feasibility-core/src/rest.ts`
- [x] both, if needed

The artifact must be compatible with the semantics already locked in tasks `001`-`004`.

**Artifacts Created**:
- `packages/feasibility-core/REST.md` - Documentation of minimum-rest constraint semantics
- `packages/feasibility-core/src/rest.ts` - TypeScript implementation with:
  - `MinimumRestConstraint` type
  - `RestViolationReason` type  
  - `checkMinimumRest()` validation function
  - `calculateGap()` utility
  - `regroupRestViolation()` for domain mapping
  - Common rest durations constant
- `packages/feasibility-core/src/primitive/types.ts` - Updated with new constraint and reason types
- `packages/feasibility-core/src/explanations.ts` - Updated with rest violation regrouping

## Architecture Constraints (Do NOT Add)

- [ ] No sequence-pattern fatigue model yet
- [ ] No overtime economics
- [ ] No optimization semantics
- [ ] No additional primitive ontology unless proven necessary
- [ ] No UI-facing explanation formatting

## Acceptance Criteria

- [x] Minimum-rest semantics are explicit
- [x] Required interval-boundary semantics are explicit
- [x] The rule fits the primitive constraint model without ad hoc exceptions
- [x] Primitive and domain-level explanations for rest violations are explicit
- [x] The abstraction is pressure-tested without drifting into broader labor-policy modeling

**Pressure Test Result**: PASSED - The minimum-rest constraint fits cleanly into the primitive model without new ontology or ad hoc exceptions.

## Status

✅ **COMPLETED** — 2026-04-02

**Deliverables**:
- `packages/feasibility-core/REST.md` - Human-readable rest constraint specification
- `packages/feasibility-core/src/rest.ts` - Complete TypeScript implementation
- Updated primitive types with `MinimumRestConstraint` and `RestViolationReason`
- Updated explanations module with rest violation regrouping

## Next Step

After this task, the next PDA move is likely one of:

- determine whether additional labor rules still fit the primitive kernel
- write the consolidated primitive contract artifact
- move from PDA work into first implementation planning
