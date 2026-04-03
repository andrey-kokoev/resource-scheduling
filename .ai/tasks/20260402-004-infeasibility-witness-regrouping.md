# Task 20260402-004: Infeasibility Witness Regrouping

**Architectural Authority**: The 2026-04-02 PDA sequence identifying the remaining interface ambiguity between primitive infeasibility at the `DemandUnit` level and domain explanations at the `Need` / `Shift` / `Position` / `Candidate` level.
**Constraint**: This task must define explanation semantics explicitly before implementation buries them inside solver or compiler code.

## Objective

Define how primitive infeasibility witnesses produced by the feasibility kernel are represented and how they regroup back into domain-level explanations.

This task exists to prevent explanation semantics from remaining tacit while the primitive/domain boundary is being locked.

## PDA Framing

### Current State

Task `20260402-001` defines the first package as a hard-constraint feasibility kernel.

Task `20260402-002` isolates the primitive constraint contract.

Task `20260402-003` locks residual policy parameters for package `001`.

The remaining live ambiguity is:

- how primitive failures over atomic `DemandUnit`s become useful domain explanations over `Need`, `Shift`, `Position`, and `Candidate`

### Live Ambiguities To Eliminate

- what counts as a primitive infeasibility witness
- which failures should remain primitive versus regroup into domain explanations
- how multiple atomic failures from one `Need` are summarized
- whether explanation is lossless, summarized, or both
- how rule violations reference candidates, windows, and affected demand

This task resolves those ambiguities.

## Locked Decisions

- [x] Primitive solver failures occur at the `DemandUnit` / `Assignment` / `Constraint` level
- [x] Domain callers need explanations in terms of `Need`, `Shift`, `Position`, and `Candidate`
- [x] Regrouping is a defined interface, not ad hoc presentation logic
- [x] Explanation semantics must be explicit enough to drive implementation
- [x] Package `001` still returns infeasibility only for full-coverage failure under hard constraints

## Deliverables

### Step 1: Define Primitive Witness Types

Specify primitive infeasibility witness forms, such as:

- [x] unfillable `DemandUnit`
- [x] missing required qualification for candidate-demand pairing
- [x] overlapping assignment conflict
- [x] utilization max violation
- [x] residual unassigned demand unit

Each witness must define:

- [x] what primitive entities it references
- [x] what invariant makes it valid
- [x] whether it is local or global

**Artifacts**: `packages/feasibility-core/EXPLANATIONS.md` section "Primitive Witness Types"

### Step 2: Define Domain Regrouping Rules

Specify how primitive witnesses regroup into domain explanations:

- [x] `DemandUnit` -> `Need`
- [x] `DemandUnit.interval` -> `Shift`
- [x] required capabilities -> `PositionQualification`
- [x] agent / candidate refs -> `Candidate`
- [x] grouped residual unfilled units -> unmet need count

**Artifacts**: `packages/feasibility-core/EXPLANATIONS.md` section "Domain Regrouping Rules"

### Step 3: Define Explanation Surface

Specify the result shape exposed to domain callers, including:

- [x] explanation code
- [x] domain entities referenced
- [x] grouped counts where applicable
- [x] primitive witness references or trace ids if needed
- [x] human-readable summary policy, if any

Clarify whether the system returns:

- [x] primitive witnesses only
- [x] domain explanations only
- [x] both primitive and regrouped explanations

**Artifacts**: `packages/feasibility-core/EXPLANATIONS.md` sections "Explanation Surface" and "Explanation Output Modes"

### Step 4: Define Regrouping Semantics For Common Cases

Provide explicit semantics for:

- [x] no eligible candidate for one demand unit
- [x] no eligible candidate for multiple units from the same need
- [x] candidate overlap between two shifts
- [x] utilization max violation across a rolling window
- [x] residual unfilled demand after all admissible assignments fail

**Artifacts**: `packages/feasibility-core/EXPLANATIONS.md` section "Regrouping Semantics By Case"

### Step 5: Create Durable Artifact

Create one concrete artifact, such as:

- [x] `packages/feasibility-core/EXPLANATIONS.md`
- [x] `packages/feasibility-core/src/explanations.ts`
- [x] both, if needed

The artifact must be implementation-driving and compatible with the locked semantics from tasks `001`-`003`.

**Artifacts Created**:
- `packages/feasibility-core/EXPLANATIONS.md` - Documentation of witness types and regrouping rules
- `packages/feasibility-core/src/explanations.ts` - TypeScript implementation of regrouping logic

## Architecture Constraints (Do NOT Add)

- [ ] No UI-oriented formatting requirements
- [ ] No optimization-related explanation semantics
- [ ] No partial-fill success semantics
- [ ] No staffing-domain leakage into primitive witness definitions
- [ ] No lossy regrouping without explicitly documenting the loss

## Acceptance Criteria

- [x] Primitive infeasibility witness types are explicit
- [x] Regrouping from primitive to domain explanations is explicit
- [x] Explanation output is specific enough to guide implementation
- [x] Domain callers can understand failures in `Need` / `Shift` / `Position` / `Candidate` terms
- [x] The primitive/domain explanation boundary is no longer tacit

## Status

✅ **COMPLETED** — 2026-04-02

**Deliverables**:
- `packages/feasibility-core/EXPLANATIONS.md` - Human-readable explanation specification
- `packages/feasibility-core/src/explanations.ts` - TypeScript implementation with:
  - Primitive witness type definitions
  - Domain explanation type definitions
  - `regroupToDomainExplanations()` function
  - `RegroupingContext` for reverse mapping
  - Grouping logic for multi-unit needs

## Next Step

After this task, the next PDA move is likely one of:

- define rest-period constraints as another hard-rule pressure test
- write the primitive contract artifact directly in code or docs
- choose the first implementation strategy against the now-explicit contracts
