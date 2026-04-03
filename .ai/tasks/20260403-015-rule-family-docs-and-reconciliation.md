# Task 20260403-015: Rule-Family Docs And Reconciliation

**Architectural Authority**: The current `feasibility-core` implementation, `CONTRACT.md`, and the rule-family tasks `009`-`014`.
**Constraint**: This task must reconcile documentation and package surface after the current rule-family implementation work lands, without reopening settled semantics.

## Objective

Create a durable, implementation-aligned documentation layer for the currently supported rule families and reconcile any drift between:

- `CONTRACT.md`
- task statuses
- exported package API
- implemented rule slices

This task should make the repository legible to future contributors and agents without requiring them to reconstruct the state from commit history.

## Deliverables

### Step 1: Add Rule-Family Docs

Create or update dedicated docs for:

- [ ] availability
- [ ] shift-pattern compatibility
- [ ] coverage rules

Suggested files:

- [ ] `packages/feasibility-core/AVAILABILITY.md`
- [ ] `packages/feasibility-core/PATTERN-COMPATIBILITY.md`
- [ ] `packages/feasibility-core/COVERAGE-RULES.md`

### Step 2: Reconcile Implemented vs Deferred Slices

For each rule family, make explicit:

- [ ] what is implemented
- [ ] what is intentionally deferred
- [ ] what primitive reasons are emitted
- [ ] what domain explanations are emitted

### Step 3: Reconcile Package Surface

Review and align:

- [ ] public exports in `src/index.ts`
- [ ] rule-family docs
- [ ] contract wording
- [ ] task statuses

### Step 4: Add Usage Examples

Add short examples for:

- [ ] candidate availability
- [ ] shift-pattern rule
- [ ] coverage rule

## Acceptance Criteria

- [ ] rule-family docs exist and match the code
- [ ] implemented vs deferred slices are explicit
- [ ] package API and docs no longer drift
- [ ] future contributors can discover the current supported surface quickly

## Status

🟡 **PLANNED** — 2026-04-03
