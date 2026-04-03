# Task 20260403-027: Multi-Site And Line Domain Foundation

**Architectural Authority**: The milestone choice recorded after task `20260403-023`, which selected multi-site / line-level domain structure as the next explicit domain milestone for `feasibility-core`.
**Constraint**: This task must expand domain structure while preserving the current hard-feasibility kernel boundary and avoiding drift into optimization or production sequencing.

## Objective

Add the first domain foundation for multi-site / line-level staffing feasibility so that the package can represent staffing demand and coverage in a more realistic manufacturing topology.

This is a domain-structure milestone, not an optimization milestone.

## Deliverables

### Step 1: Define New Domain Entities

- [x] `Site`
- [x] `Line`
- [x] explicit relation from `Shift` to `Site`
- [x] explicit relation from `Need` to `Line` or other line-level demand anchor

### Step 2: Define Compilation Boundary

- [x] specify what multi-site / line data remains domain-only
- [x] specify what source metadata must flow into primitive regrouping
- [x] preserve primitive domain-agnosticity

### Step 3: Reconcile Existing Coverage Rules

- [x] define how existing coverage rules behave with site / line structure
- [x] identify which current rule shapes need site-aware or line-aware scoping

### Step 4: Add Initial Scenario Coverage

- [x] one multi-line staffing scenario
- [x] one site-aware coverage failure
- [x] one regrouped explanation that references the new structure appropriately

### Step 5: Update Docs

- [x] update package docs and milestone docs to reflect the new domain structure
- [x] mark explicitly what is still out of scope

## Explicitly Out Of Scope

- [ ] production sequencing
- [ ] machine-job scheduling
- [ ] optimization and ranking
- [ ] overtime or cost layer
- [ ] fairness or preference logic

## Acceptance Criteria

- [x] the domain model can represent multi-site / line-aware staffing structure
- [x] the primitive kernel remains domain-agnostic
- [x] coverage and explanation semantics remain coherent
- [x] build, typecheck, and tests pass

## Status

🟢 **COMPLETE** — 2026-04-03

Implemented foundation:

- `Site`
- `Line`
- shift-to-site metadata
- need-to-line metadata
- line-scoped coverage regrouping
