# Task 20260403-019: Infeasibility Surface Stabilization

**Architectural Authority**: The current solver and explanation layers, which now emit and regroup several explicit primitive failure families.
**Constraint**: This task must improve the failure surface without changing solver semantics unnecessarily.

## Objective

Stabilize the infeasibility surface so that:

- primitive reasons are consistent
- duplicate / noisy reasons are reduced
- domain regrouping is predictable
- consumers can rely on failure shapes across rule families

## Deliverables

### Step 1: Audit Current Primitive Reasons

- [ ] list all emitted primitive reason types
- [ ] identify duplicates, weakly specified fields, and missing context

### Step 2: Normalize Reason Shape

- [ ] align common fields where appropriate
- [ ] document required vs optional fields
- [ ] reduce accidental duplication in failed search output

### Step 3: Reconcile Domain Explanations

- [ ] ensure each primitive reason family has a stable regrouping path
- [ ] identify any primitive reasons that should remain internal only
- [ ] identify any domain explanations still too lossy or too noisy

### Step 4: Add Regression Tests

- [ ] tests for stable regrouping across rule families
- [ ] tests for duplicate-reason reduction where applicable

## Acceptance Criteria

- [ ] primitive failure surface is documented and more stable
- [ ] regrouping behavior is predictable
- [ ] noisy or redundant infeasibility output is reduced

## Status

🟢 **COMPLETE** — 2026-04-03
