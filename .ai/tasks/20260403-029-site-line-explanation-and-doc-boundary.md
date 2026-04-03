# Task 20260403-029: Site And Line Explanation And Doc Boundary

**Architectural Authority**: The next-domain milestone selected in `023`, the foundation work in `027`, and the scenario pressure-test in `028`.
**Constraint**: This task must clarify how site/line structure should appear in explanations and docs without forcing premature implementation detail into the primitive kernel.

## Objective

Define the documentation and explanation boundary for multi-site / line-aware staffing semantics so the milestone stays coherent as implementation lands.

This task should answer:

- how site/line structure should surface to domain callers
- what explanation fields are likely needed
- what should remain domain-only and not leak into the primitive layer

## Deliverables

### Step 1: Review Current Explanation Surface

- [ ] identify where current regrouped explanations refer only to `Need`, `Shift`, `Position`, and `Candidate`
- [ ] identify which future explanation paths likely need `Site` or `Line`

### Step 2: Define Expected Domain Explanation Boundary

- [ ] specify when site should appear in explanations
- [ ] specify when line should appear in explanations
- [ ] specify what should remain derivable from domain metadata rather than primitive witness payloads

### Step 3: Reconcile Docs

- [ ] update milestone docs or package docs with the expected explanation/doc boundary
- [ ] avoid overstating implemented support if `027` has not landed yet

### Step 4: Add Follow-On Recommendations

- [ ] identify any explanation-layer follow-on task that should exist after `027`
- [ ] identify any doc updates that should be coupled to `027` completion

## Acceptance Criteria

- [ ] site/line explanation expectations are explicit
- [ ] milestone docs are less likely to drift from eventual explanation behavior
- [ ] the task helps preserve primitive/domain boundary clarity

## Status

🟢 **COMPLETE** — 2026-04-03

Follow-on recommendation after `027`:

- add a small explanation regression covering line-scoped `coverage-conflict` regrouping
- add one site/line example in the milestone docs if the implementation lands with new domain fixtures
