# Task 20260402-012: Initial Domain And Primitive Type Layer

**Architectural Authority**: The 2026-04-02 consolidated contract and subsequent domain expansion work, which established the semantic boundary for `feasibility-core` and identified the next move as first code-level type implementation.
**Constraint**: This task must implement the first code types directly from the locked contract, without reopening already-closed semantic questions.

## Objective

Create the initial code-level type layer for:

- the primitive feasibility kernel
- the domain model that compiles into it

This task exists to move from PDA/contract work into construction while preserving the semantic boundary already established.

## Deliverables

### Step 1: Create Primitive Types

Add initial types for:

- [x] `Interval`
- [x] `Agent`
- [x] `DemandUnit`
- [x] `Assignment`
- [x] `Constraint`
- [x] `ConstraintTiming`
- [x] `SolveInput`
- [x] `SolveResult`
- [x] primitive infeasibility witness base shape

These types must remain domain-agnostic.

### Step 2: Create Domain Types

Add initial domain-facing types for:

- [x] `Date`
- [x] `Shift`
- [x] `Position`
- [x] `Need`
- [x] `Candidate`
- [x] `QualificationType`
- [x] `PositionQualification`
- [x] `CandidateQualification`
- [x] `UtilizationRule`
- [x] `CandidateAvailability`
- [x] `ShiftPatternRule`
- [x] `CoverageRule`

These types must reflect the semantics locked in the contract, including:

- [x] `Need.count`
- [x] exact-match qualifications
- [x] full-interval qualification validity
- [x] hard availability semantics

### Step 3: Add Compilation Boundary Types

Add types or interfaces for the domain-to-primitive compilation boundary, such as:

- [x] domain solve input
- [x] compiled primitive solve input
- [x] source metadata needed for regrouping explanations

### Step 4: Lay Out File Structure

Create an initial package structure under `packages/feasibility-core`, such as:

- [x] `src/primitive-types.ts`
- [x] `src/domain-types.ts`
- [x] `src/contracts.ts`
- [x] `src/explanations.ts`

Exact filenames may vary, but the split must preserve the domain/primitive boundary clearly.

### Step 5: Add Minimal Static Verification

- [x] typecheck or equivalent package-level verification command
- [ ] no solver implementation required yet
- [ ] no algorithm lock-in

## Architecture Constraints (Do NOT Add)

- [ ] No solving algorithm yet
- [ ] No optimization types
- [ ] No partial-fill success semantics
- [ ] No staffing-domain naming in primitive types
- [ ] No reopening of already-locked contract semantics unless a contradiction is discovered

## Acceptance Criteria

- [x] The repository has an initial code-level primitive type layer
- [x] The repository has an initial code-level domain type layer
- [x] The compilation boundary is explicit in code
- [x] The structure is consistent with [CONTRACT.md](/home/andrey/src/resource-scheduling/packages/feasibility-core/CONTRACT.md)
- [x] The package can pass minimal static verification

## Status

🟢 **COMPLETE** — 2026-04-03

Initial type-layer construction now exists in code, with:

- primitive types
- domain types
- domain compilation boundary
- explanation regrouping support
- package build and typecheck scripts

The package has progressed beyond “types only” into a working first solver, but the initial type-layer task itself is complete.
