# Task 20260402-009: Candidate Availability Semantics

**Architectural Authority**: The 2026-04-02 domain expansion after consolidating the primitive contract, selecting candidate availability as the highest-leverage real-world applicability gain for plant labor scheduling.
**Constraint**: This task must add availability semantics without collapsing availability into vague preference logic.

## Objective

Define domain and compilation semantics for candidate availability and unavailability as hard feasibility inputs.

## Deliverables

### Step 1: Define Domain Concepts

- [x] `CandidateAvailability`
- [x] `CandidateUnavailability`
- [x] approved leave / time-off representation
- [ ] shift-type or day restrictions if needed

### Step 2: Define Compilation Semantics

- [x] full-interval availability requirement
- [x] conflict between available and unavailable intervals
- [ ] timezone and local-date interpretation if applicable

### Step 3: Define Constraint Behavior

- [x] availability as `prefix-checkable`
- [x] primitive witness shape
- [x] domain regrouping semantics

### Step 4: Create Durable Artifact

- [ ] `packages/feasibility-core/AVAILABILITY.md`
- [x] and/or code contract artifact

## Acceptance Criteria

- [x] availability is explicit hard-feasibility input
- [x] time off and unavailability semantics are explicit
- [x] the rule compiles cleanly into the primitive kernel

## Status

🟢 **IMPLEMENTED IN CODE** — 2026-04-03

Availability now exists in:

- primitive types
- domain compilation
- solver eligibility and validation
- primitive infeasibility reasons
- domain explanation regrouping

Remaining follow-on work:

- optional richer day-specific or shift-type availability policy
- standalone `AVAILABILITY.md` if desired
