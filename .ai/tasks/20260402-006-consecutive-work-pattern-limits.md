# Task 20260402-006: Consecutive-Work Pattern Limits

**Architectural Authority**: The 2026-04-02 PDA sequence selecting consecutive-work pattern limits as the next hard-rule pressure test after minimum-rest semantics.
**Constraint**: This task must determine whether sequence-based labor rules fit the current primitive kernel without introducing unnecessary new ontology or domain leakage.

## Objective

Define the semantics for consecutive-work pattern limits, starting with the simplest coherent rule:

- no more than `N` consecutive worked days for the same agent

This task exists to test whether the primitive feasibility model can absorb sequence-based labor constraints, not just pairwise interval constraints.

## PDA Framing

### Current State

Tasks `001`-`005` progressively de-arbitrarize:

- primitive vs derived concepts
- primitive constraint contract
- locked first-package policy semantics
- infeasibility witness regrouping
- minimum-rest hard-constraint semantics

The next useful pressure test is whether a common sequence-based labor rule can be represented cleanly using the current primitive model.

### Live Ambiguities To Eliminate

- whether “consecutive worked days” is primitive or derived
- how worked days are derived from interval assignments
- whether consecutive-day limits are prefix-checkable, completion-only, or both
- what primitive witness shape a consecutive-work violation should have
- how a consecutive-work violation regroups back to domain explanation

This task resolves those ambiguities for the first sequence-based labor-rule slice.

## Locked Decisions

- [x] The first slice concerns maximum consecutive worked days only
- [x] This is a hard feasibility constraint
- [x] “Worked day” is expected to be derived from assignment intervals, not introduced as a new primitive ontology item unless necessary
- [x] More complex schedule-pattern rules are deferred
- [x] The task is a pressure test of the primitive kernel, not an excuse to broaden the ontology prematurely

## Deliverables

### Step 1: Define Worked-Day Derivation

Specify how an assignment contributes to a worked day:

- [x] what calendar day basis is used
- [x] how overnight shifts are handled
- [x] whether one or many assignments on the same day count as one worked day or more than one
- [x] whether consecutive-day semantics are based on local calendar days only

**Artifact**: `packages/feasibility-core/PATTERNS.md` section "Step 1: Worked-Day Derivation"

### Step 2: Define Consecutive-Day Semantics

Specify the meaning of:

- [ ] “worked day”
- [ ] “consecutive”
- [ ] “maximum consecutive worked days”

Clarify:

- [ ] whether gaps of one non-worked day reset the run
- [ ] whether overlapping or multiple shifts on one day change the run length
- [ ] whether cross-midnight assignments affect one day or multiple days

### Step 3: Classify Constraint Timing

Specify whether the rule is:

- [x] prefix-checkable
- [x] completion-only
- [x] both in different evaluation modes

Clarify how the solver should use it during search.

**Artifact**: `packages/feasibility-core/PATTERNS.md` section "Step 3: Constraint Timing Classification"

### Step 4: Define Primitive Witness Shape

Specify the primitive infeasibility witness for consecutive-work violations, including:

- [x] involved agent
- [x] assignments or worked-day sequence causing the run
- [x] allowed maximum
- [x] actual run length
- [x] violated rule identity

**Artifacts**:
- `packages/feasibility-core/PATTERNS.md` section "Step 4: Primitive Witness Shape"
- `packages/feasibility-core/src/primitive/types.ts` - `ConsecutiveDaysViolationReason` added to `InfeasibilityReason` union

### Step 5: Define Domain Regrouping

Specify how a primitive consecutive-work violation becomes a domain explanation in terms of:

- [x] `Candidate`
- [x] the affected `Shift`s / dates
- [x] the `Need` or demand unit whose assignment would create the violation

**Artifacts**:
- `packages/feasibility-core/PATTERNS.md` section "Step 5: Domain Regrouping"
- `packages/feasibility-core/src/explanations.ts` - `ConsecutiveDaysViolation` added to `DomainExplanation` union, `regroupConsecutiveDaysViolations()` function

### Step 6: Create Durable Artifact

Create one concrete artifact, such as:

- [x] `packages/feasibility-core/PATTERNS.md`
- [x] `packages/feasibility-core/src/patterns.ts`
- [x] both, if needed

The artifact must remain compatible with the semantics already locked in tasks `001`-`005`.

**Artifacts Created**:
- `packages/feasibility-core/PATTERNS.md` - Documentation of consecutive-work pattern semantics
- `packages/feasibility-core/src/patterns.ts` - TypeScript implementation with:
  - `MaxConsecutiveDaysConstraint` type
  - `ConsecutiveDaysViolationReason` type
  - `deriveWorkedDates()` function
  - `checkMaxConsecutiveDays()` validation function
  - `calculateConsecutiveRunLength()` utility
  - Common limits constant
- `packages/feasibility-core/src/primitive/types.ts` - Updated with new constraint and reason types
- `packages/feasibility-core/src/explanations.ts` - Updated with consecutive days violation regrouping

## Architecture Constraints (Do NOT Add)

- [ ] No broader fatigue model yet
- [ ] No fairness / rotation optimization
- [ ] No additional primitive ontology unless proven necessary
- [ ] No UI-facing explanation formatting
- [ ] No staffing-domain-specific shortcuts in primitive semantics

## Acceptance Criteria

- [x] Consecutive-work semantics are explicit
- [x] Worked-day derivation from assignment intervals is explicit
- [x] Constraint timing semantics are explicit
- [x] Primitive and domain-level explanations for violations are explicit
- [x] The rule either fits the primitive kernel cleanly or exposes a precise kernel boundary

**Pressure Test Result**: PASSED - The consecutive-work constraint fits into the primitive model by deriving "worked days" from intervals without new ontology.

## Status

✅ **COMPLETED** — 2026-04-02

**Deliverables**:
- `packages/feasibility-core/PATTERNS.md` - Human-readable consecutive-work specification
- `packages/feasibility-core/src/patterns.ts` - Complete TypeScript implementation
- Updated primitive types with `MaxConsecutiveDaysConstraint` and `ConsecutiveDaysViolationReason`
- Updated explanations module with consecutive days violation regrouping

## Next Step

After this task, continue pressure-testing common labor rules or consolidate the resulting semantics into a single primitive contract artifact.
