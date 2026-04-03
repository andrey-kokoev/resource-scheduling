# Task 20260403-026: Explanation Golden Tests

**Architectural Authority**: The stabilized infeasibility surface and regrouping path in `feasibility-core`, plus the current explanation documentation.
**Constraint**: This task must improve confidence in explanation stability without introducing brittle or noisy tests.

## Objective

Add stable, high-signal tests for regrouped domain explanations across representative failure families.

These tests should act as golden-style guards for explanation shape and key fields, while remaining maintainable.

## Deliverables

### Step 1: Choose Representative Failure Families

- [ ] availability conflict
- [ ] shift-pattern conflict
- [ ] coverage conflict
- [ ] utilization conflict
- [ ] rest or consecutive-days conflict

### Step 2: Add Explanation-Focused Tests

- [ ] assert regrouped explanation type
- [ ] assert key fields and linked domain ids
- [ ] avoid brittle assertion on irrelevant formatting

### Step 3: Reconcile With Current Docs

- [ ] ensure tests reflect the documented explanation surface
- [ ] update docs only if a docs/code mismatch is found

## Acceptance Criteria

- [ ] representative explanation families are protected by tests
- [ ] explanation tests are stable and high-signal
- [ ] docs and tested behavior stay aligned
- [ ] build, typecheck, and tests pass

## Status

🟢 **COMPLETE** — 2026-04-03
