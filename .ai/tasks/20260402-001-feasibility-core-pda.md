# Task 20260402-001: Feasibility Core Under PDA

**Architectural Authority**: The 2026-04-02 PDA discussion defining the first package as a hard-constraint feasibility kernel, not a full scheduling product model.
**Constraint**: This task must de-arbitrarize the domain before implementation. Do not start from UI, workflows, or optimization.

## Objective

Define and implement the most primitive useful package for the repository:

- a pure feasibility engine for assigning `Candidate` to `Need`
- under temporal qualification validity
- under non-overlap
- under rolling-window utilization rules
- with explicit infeasibility reporting

This package is not yet responsible for preferences, scoring, fairness, or best-schedule search.

## PDA Framing

### Surface Formulation

Current domain language:

- `Date`
- `Shift`
- `Position`
- `Need`
- `Candidate`
- `UtilizationRule`
- `QualificationType`
- `PositionQualification`
- `CandidateQualification`
- solve for a non-violation solution

### Live Ambiguities To Eliminate

- What kind of thing is a `Need`: atomic slot or demand count?
- What kind of thing is a `Shift`: label-on-date or actual interval?
- Are `UtilizationRule`s hard feasibility constraints or policy/preference inputs?
- Does “solve” mean:
  - any complete feasible assignment
  - maximal partial fill
  - optimized assignment
  - infeasibility proof when no full solution exists

This task resolves those ambiguities for the first package.

## Locked Decisions

- [x] Package 1 is a **feasibility** package, not an optimization package
- [x] The package answers: “does a non-violating full assignment exist?”
- [x] `Shift` is treated as a real time interval
- [x] `Need` is compiled into one or more atomic demand units
- [x] `UtilizationRule` is treated as a hard constraint in this phase
- [x] Candidate qualification is time-bounded
- [x] Position qualification is requirement-side capability data
- [x] No soft constraints in this phase
- [x] No ranking of multiple valid solutions in this phase
- [x] Infeasibility explanation is part of the package contract

## Primitive / Derived Split

### Primitive

- `Interval`
- `Agent`
- `DemandUnit`
- `Capability`
- `Assignment`
- `Constraint`

### Derived

- `Date`
- `Shift`
- `Position`
- `Need`
- `QualificationType`
- `PositionQualification`
- `CandidateQualification`
- `UtilizationRule`

The domain model above must compile into the primitive layer instead of leaking directly into solver internals.

## Package Boundary

Create a first package whose job is:

- build admissible candidate-demand assignment facts
- enforce hard constraints
- produce either:
  - a feasible assignment set
  - or an infeasibility explanation

Recommended package name:

- `packages/feasibility-core`

## Deliverables

### Step 1: Define Primitive Types

Add a primitive model for:

- [ ] `Interval`
- [ ] `DemandUnit`
- [ ] `Agent`
- [ ] `Capability`
- [ ] `Assignment`
- [ ] `Constraint`
- [ ] `SolveInput`
- [ ] `SolveResult`

The primitive layer must not depend on domain names like `Shift` or `Position`.

### Step 2: Define Domain Compilation Layer

Add a domain-facing model for:

- [ ] `Date`
- [ ] `Shift`
- [ ] `Position`
- [ ] `Need`
- [ ] `Candidate`
- [ ] `QualificationType`
- [ ] `PositionQualification`
- [ ] `CandidateQualification`
- [ ] `UtilizationRule`

Add transformation code that compiles these into the primitive solver input.

### Step 3: Implement Hard-Constraint Feasibility

Implement feasibility rules for:

- [ ] candidate must satisfy all position qualifications at the shift interval
- [ ] candidate must not be assigned to overlapping shifts
- [ ] candidate assignment must not violate rolling-window utilization rules
- [ ] all demand units must be filled for success

### Step 4: Return Explicit Infeasibility

When no full solution exists, return structured reasons such as:

- [ ] no eligible candidates for a demand unit
- [ ] overlap conflict
- [ ] qualification validity gap
- [ ] utilization-rule conflict
- [ ] residual unfilled demand

### Step 5: Add Minimal Verification

Add tests covering:

- [ ] simple feasible case
- [ ] missing qualification case
- [ ] expired qualification case
- [ ] overlapping shift conflict
- [ ] utilization max violation case
- [ ] utilization min/max rolling-window interpretation case
- [ ] infeasible full-coverage case

## Minimal API

Target API shape:

```ts
type SolveResult =
  | { feasible: true; assignments: Assignment[] }
  | { feasible: false; reasons: InfeasibilityReason[] }

function solve(input: SolveInput): SolveResult
function compileDomain(input: DomainInput): SolveInput
```

Optional helper APIs:

```ts
function buildEligibility(input: SolveInput): EligibilityEdge[]
function explainInfeasibility(input: SolveInput): InfeasibilityReason[]
```

## Architecture Constraints (Do NOT Add)

- [ ] No optimization objective yet
- [ ] No fairness scoring yet
- [ ] No preference handling yet
- [ ] No partial-fill success semantics yet
- [ ] No UI, persistence, or API transport concerns in solver core
- [ ] No domain-specific assumptions inside primitive solver types

## Acceptance Criteria

- [ ] The repository has a first solver package with a clear primitive API
- [ ] Domain entities compile into primitive feasibility inputs cleanly
- [ ] Solver can produce a complete non-violating assignment when one exists
- [ ] Solver returns structured infeasibility when one does not
- [ ] Tests demonstrate qualification, overlap, and utilization-rule enforcement
- [ ] Primitive solver code is not coupled to staffing-specific names

## Status

🟡 **PLANNED** — 2026-04-02

## Next Step

After this package is stable, the next exploration can choose one of:

- optimization over multiple feasible schedules
- partial-fill semantics under infeasibility
- richer utilization policy language
- schedule repair under changed inputs
