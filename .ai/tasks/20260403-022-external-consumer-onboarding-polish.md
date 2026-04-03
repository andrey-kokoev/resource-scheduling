# Task 20260403-022: External Consumer Onboarding Polish

**Architectural Authority**: The stable API/examples work from `017`, the rule-family docs from `015`, and the readiness findings from `020`.
**Constraint**: This task must improve first-contact usability for external consumers without changing core solver semantics.

## Objective

Make the package easier for a new external consumer to evaluate and try quickly.

This task should focus on onboarding polish rather than new scheduling behavior.

## Deliverables

### Step 1: Review First-Contact Experience

- [x] identify what a new consumer sees first
- [x] identify missing or awkward entry points

### Step 2: Improve Onboarding Surface

- [x] tighten or add quickstart guidance
- [x] add package-level orientation text if needed
- [x] ensure examples and rule docs point to each other coherently

### Step 3: Add Minimal Consumer Checks

- [x] verify that a new reader can discover:
  - [x] supported features
  - [x] preferred usage flow
  - [x] infeasibility explanation path
  - [x] current limitations

## Acceptance Criteria

- [x] the package is easier to evaluate without reading internal implementation files
- [x] docs/examples/rule docs feel coherent as an onboarding surface
- [x] no solver-semantics drift is introduced

## Status

🟢 **COMPLETE** — 2026-04-03

Implemented onboarding surface:

- [README.md](../../packages/feasibility-core/README.md)
- [EXAMPLES.md](../../packages/feasibility-core/EXAMPLES.md)
- [EXPLANATIONS.md](../../packages/feasibility-core/EXPLANATIONS.md)
- [READINESS.md](../../packages/feasibility-core/READINESS.md)
