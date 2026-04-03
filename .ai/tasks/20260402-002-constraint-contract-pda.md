# Task 20260402-002: Constraint Contract Under PDA

**Architectural Authority**: The 2026-04-02 PDA follow-up identifying the remaining live ambiguity as the semantic contract of the primitive constraint layer.
**Constraint**: This task must reduce hidden arbitrariness in the primitive solver contract before algorithm selection or broader package expansion.

## Objective

Define the minimal semantic contract for the primitive feasibility kernel so that:

- the primitive layer is genuinely domain-agnostic
- the domain compilation layer can target it without semantic leakage
- `Constraint` no longer hides staffing-specific policy by accident

This task exists to push the first package closer to PDA closure.

## PDA Framing

### Current State

Task `20260402-001` locks the first package as a hard-constraint feasibility kernel and separates primitive from derived concepts.

That resolved the first ambiguity, but one live ambiguity remains:

- what exactly is the semantic contract of `Constraint` in the primitive layer?

Until that is explicit, the package still permits materially different continuations.

### Live Ambiguities To Eliminate

- Is `Constraint` local, global, or both?
- Can a constraint inspect:
  - one assignment
  - all assignments
  - derived windows or aggregates
- Is full coverage represented as a constraint or as solver success semantics?
- Are utilization rules compiled into primitive constraint objects or handled specially by solver logic?
- What is the minimal primitive representation of infeasibility reasons?

This task resolves those ambiguities.

## Locked Decisions

- [x] Ontology and semantics must be clarified before algorithm choice
- [x] Primitive types must remain domain-agnostic
- [x] Domain concepts like `Shift` and `Position` must not appear in primitive contracts
- [x] Full coverage may be solver semantics, but that choice must be explicit
- [x] Constraint evaluation semantics must be documented, not implied
- [x] Infeasibility explanation must correspond to explicit constraint semantics

## Deliverables

### Step 1: Classify Primitive Semantics

Define and document the primitive semantics of:

- [x] `Interval`
- [x] `DemandUnit`
- [x] `Agent`
- [x] `Assignment`
- [x] `Constraint`

Each definition must state:

- [x] what it is
- [x] what it is not
- [x] what data is intrinsic
- [x] what data is compiled in from domain policy

**Artifact**: `packages/feasibility-core/CONTRACT.md` section "Primitive Semantics"

### Step 2: Define Constraint Contract

Specify the contract for primitive constraints, including:

- [x] allowed input shape
- [x] evaluation scope
- [x] whether constraints operate on:
  - candidate assignments
  - committed assignments
  - global assignment sets
- [x] whether constraints may depend on derived aggregates
- [x] how constraint violation is reported

**Artifact**: `packages/feasibility-core/CONTRACT.md` section "Constraint Contract"

### Step 3: Separate Solver Semantics From Constraint Semantics

Make explicit which properties are solver-level semantics versus primitive constraints:

- [x] full coverage
- [x] uniqueness / no double-booking
- [x] temporal overlap invalidity
- [x] rolling-window utilization
- [x] residual unfilled demand

The result must clearly distinguish:

- [x] forced kernel semantics
- [x] pluggable constraint semantics
- [x] domain-compiled policy

**Artifact**: `packages/feasibility-core/CONTRACT.md` section "Solver Semantics" and "Responsibility Matrix"

### Step 4: Define Infeasibility Surface

Specify the minimal primitive shape of infeasibility explanation:

- [x] unsatisfied demand
- [x] missing eligibility
- [x] overlap conflict
- [x] rule violation
- [x] global infeasibility residual

This must be defined in a way that survives domain compilation cleanly.

**Artifact**: `packages/feasibility-core/CONTRACT.md` section "Infeasibility Contract"

### Step 5: Produce Target Contract Artifact

Create one concrete artifact, such as:

- [x] `packages/feasibility-core/CONTRACT.md`
- [x] `packages/feasibility-core/src/contracts.ts`
- [x] both, if needed

The artifact must be implementation-driving, not merely descriptive.

**Artifacts Created**:
- `packages/feasibility-core/CONTRACT.md` - Human-readable contract specification
- `packages/feasibility-core/src/contracts.ts` - Type-level contract materialization

## Architecture Constraints (Do NOT Add)

- [ ] No algorithm lock-in yet
- [ ] No CP-SAT- or matching-specific abstractions in primitive contracts
- [ ] No staffing-domain names in primitive interfaces
- [ ] No preference or optimization semantics
- [ ] No UI, persistence, or transport concerns

## Acceptance Criteria

- [x] The primitive layer has an explicit, stable semantic contract
- [x] `Constraint` no longer hides unresolved domain assumptions
- [x] Solver semantics and constraint semantics are clearly separated
- [x] Infeasibility output is tied to explicit primitive concepts
- [x] The contract is specific enough to drive implementation in the next step

## Policy Lock Integration

This task references the policy lock established in `20260402-003`:

| Policy | Locked Value | Contract Impact |
|--------|--------------|-----------------|
| `MIN_UTILIZATION_DEFERRED` | `true` | No `min` checking in constraints |
| `MAX_UTILIZATION_HARD_CONSTRAINT` | `true` | `utilization` constraint enforces max |
| `QUALIFICATION_FULL_INTERVAL_COVERAGE` | `true` | `capability` checks full interval |
| `COVERAGE_REQUIRES_FULL_ASSIGNMENT` | `true` | Solver success requires all demands filled |
| `PARTIAL_FILL_OUT_OF_SCOPE` | `true` | No partial-fill result type |

See `packages/feasibility-core/POLICY.md` for full policy lock documentation.

## Status

✅ **COMPLETED** — 2026-04-02

**Deliverables**:
- `packages/feasibility-core/CONTRACT.md` - Contract specification
- `packages/feasibility-core/src/contracts.ts` - Type-level contract
- Updated task with policy lock cross-reference

## Next Step

After this task, the next PDA move is likely one of:

- parameterize residual policy freedom in utilization rules
- quotient distinctions that no longer affect admissible assignments
- choose a first implementation strategy against the now-explicit contract
