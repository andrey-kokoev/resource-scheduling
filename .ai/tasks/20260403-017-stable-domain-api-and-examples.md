# Task 20260403-017: Stable Domain API And Examples

**Architectural Authority**: The current `feasibility-core` package, which has accumulated a working domain model, compiler, solver, and explanation layer.
**Constraint**: This task must improve usability at the package boundary without changing solver semantics.

## Objective

Define and document a stable package-level usage flow for domain callers:

- build `DomainInput`
- compile
- solve
- regroup explanations

This task exists to make the package consumable as a coherent library rather than a collection of internal modules.

## Deliverables

### Step 1: Review API Surface

- [ ] review exports in `src/index.ts`
- [ ] identify awkward or leaky internal exports
- [ ] identify missing convenience exports

### Step 2: Define Preferred Usage Flow

Document the preferred caller path for:

- [ ] successful solve
- [ ] infeasible solve with regrouped explanations

### Step 3: Add End-to-End Examples

Add examples for:

- [ ] minimal staffing solve
- [ ] infeasible solve with regrouped explanations
- [ ] one manufacturing-oriented example

### Step 4: Reduce Boundary Friction

- [ ] add or adjust convenience exports if needed
- [ ] keep internal implementation details out of the preferred API where possible

## Acceptance Criteria

- [ ] the package has a clear recommended usage flow
- [ ] examples reflect the actual implemented API
- [ ] package consumers can use the library without reading internal files first

## Status

🟢 **COMPLETE** — 2026-04-03
