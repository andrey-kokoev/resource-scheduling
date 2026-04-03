# Task 20260402-008: Consolidated Primitive Contract Artifact

**Architectural Authority**: The 2026-04-02 PDA sequence after tasks `001`-`007`, which progressively de-arbitrarized the first-package feasibility kernel and pressure-tested it with common labor-rule semantics.
**Constraint**: This task must consolidate the current semantic state into one implementation-driving contract artifact and expose any remaining hidden arbitrariness directly.

## Objective

Produce a single consolidated primitive contract artifact for the first feasibility package.

This artifact must unify the semantics established across tasks `001`-`007` so the repository can move from PDA work into implementation planning without distributing core meaning across many partial notes.

## PDA Framing

### Current State

The following have been progressively clarified:

- primitive vs derived concepts
- primitive constraint contract
- locked first-package policy semantics
- infeasibility witness regrouping
- minimum-rest semantics
- consecutive-work pattern semantics
- rolling-window count semantics

The remaining risk is no longer isolated local ambiguity. The remaining risk is **distributed ambiguity**: multiple locally clear decisions that may still fail to compose into one coherent contract.

### Live Ambiguities To Eliminate

- whether the semantics locked across tasks `001`-`007` compose cleanly
- whether any contradictions remain between primitive contract, policy locks, and labor-rule pressure tests
- whether the current kernel boundary is now explicit enough to drive implementation
- whether any distinctions still survive only because they have not yet been forced into one artifact

This task resolves those ambiguities by forcing the current PDA state into a single usable contract.

## Locked Decisions To Consolidate

- [x] Package `001` is a hard-constraint feasibility kernel
- [x] Primitive and derived concepts are separated
- [x] `Need` compiles into atomic `DemandUnit`s
- [x] qualification semantics are exact-match with full-interval validity
- [x] full coverage is solver success semantics
- [x] partial fill is out of scope
- [x] `min` utilization is deferred
- [x] `max` utilization is a hard constraint
- [x] infeasibility witness regrouping is a defined interface
- [x] minimum rest is a hard constraint slice
- [x] consecutive-work pattern limits are a valid pressure-test axis
- [x] rolling-window count limits are a valid pressure-test axis

## Deliverables

### Step 1: Create Single Source Of Truth

Create one consolidated artifact, such as:

- [ ] `packages/feasibility-core/CONTRACT.md`
- [ ] `packages/feasibility-core/src/contracts.ts`
- [ ] both, if needed

This artifact must be implementation-driving.

### Step 2: Consolidate Primitive Ontology

Define in one place:

- [ ] `Interval`
- [ ] `Agent`
- [ ] `DemandUnit`
- [ ] `Assignment`
- [ ] `Constraint`
- [ ] `SolveInput`
- [ ] `SolveResult`

For each, specify:

- [ ] what is primitive
- [ ] what is compiled from domain input
- [ ] what invariants hold

### Step 3: Consolidate Solver Semantics

Specify in one place:

- [ ] full-coverage success semantics
- [ ] infeasibility semantics
- [ ] prefix-checkable vs completion-only rule timing
- [ ] what remains outside package `001`

### Step 4: Consolidate Rule Semantics

Bring together the current hard-rule slices:

- [ ] qualification validity
- [ ] overlap / double-booking
- [ ] rolling-window max counting
- [ ] minimum rest
- [ ] consecutive-work pattern limits

For each rule, specify:

- [ ] required input semantics
- [ ] evaluation timing
- [ ] primitive witness shape
- [ ] domain regrouping expectations

### Step 5: Identify Remaining Boundary Conditions

Explicitly mark anything still outside closure, such as:

- [ ] unresolved boundary cases that do not yet affect implementation
- [ ] deferred policy areas
- [ ] possible future extensions

Anything still open must be classified as:

- [ ] forced by the problem
- [ ] explicit future policy
- [ ] irrelevant for package `001`

### Step 6: State Implementation Readiness

Conclude whether the contract is now:

- [ ] ready for first implementation planning
- [ ] blocked by one or more still-live ambiguities

If blocked, list the specific residual ambiguities only.

## Architecture Constraints (Do NOT Add)

- [ ] No optimization semantics
- [ ] No partial-fill success semantics
- [ ] No staffing-domain names in primitive contracts
- [ ] No UI or transport concerns
- [ ] No algorithm lock-in unless required by the contract itself

## Acceptance Criteria

- [ ] The repository has one consolidated primitive contract artifact
- [ ] The semantics from tasks `001`-`007` compose coherently in one place
- [ ] Any residual ambiguity is explicit and localized
- [ ] The artifact is specific enough to drive implementation planning
- [ ] The kernel boundary is now more explicit than distributed across separate task files

## Status

🟡 **PLANNED** — 2026-04-02

## Next Step

After this task, either begin first implementation planning against the consolidated contract or isolate any final residual ambiguity that remains truly decision-relevant.
