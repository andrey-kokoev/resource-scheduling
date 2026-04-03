# Task 20260402-011: Global Coverage Coupling Rules

**Architectural Authority**: The 2026-04-02 domain expansion after consolidating the primitive contract, selecting line-level and shift-level coverage coupling as a major increase in real-world plant labor applicability.
**Constraint**: This task must add coupled staffing semantics without changing the primitive ontology unnecessarily.

## Objective

Define how domain coverage-coupling rules compile into explicit hard global constraints over assignment sets.

## Deliverables

### Step 1: Define Domain Rule Shapes

- [x] at least one line lead per active line shift
- [x] at least one forklift-certified worker somewhere on the shift
- [x] support-role-required-if-dependent-role-staffed
- [x] supervisor-presence requirements if included

### Step 2: Define Compilation Semantics

- [x] what facts the global rule inspects
- [x] how grouped demand units map back to need/shift/position
- [x] completion-only vs prefix-checkable timing where sound

### Step 3: Define Explanation Semantics

- [x] primitive witness shape
- [x] regrouping to domain coverage failure

### Step 4: Create Durable Artifact

- [x] `packages/feasibility-core/COVERAGE-RULES.md`
- [x] and/or code contract artifact

## Acceptance Criteria

- [x] coupled coverage rules are explicit hard constraints
- [x] primitive kernel remains domain-agnostic
- [x] domain regrouping is explicit

## Status

🟢 **IMPLEMENTED IN CODE** — 2026-04-03

Implemented slice:

- `require-qualification-on-shift`
- `require-position-on-shift`
- `require-support-when-dependent-staffed`
- `require-supervisor-presence`

Standalone durable doc:

- `packages/feasibility-core/COVERAGE-RULES.md`
