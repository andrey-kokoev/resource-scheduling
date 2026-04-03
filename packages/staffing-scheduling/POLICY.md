# Staffing Scheduling Policy Lock

**Package**: `staffing-scheduling` (Package 001)  
**Version**: 1.0.0  
**Locked**: 2026-04-02

This document freezes the policy parameters for the first feasibility package. Any deviation requires explicit PDA amendment.

---

## Locked Semantics

### Utilization Rules

| Policy | Status | Semantics |
|--------|--------|-----------|
| `max` utilization | **HARD CONSTRAINT** | Rolling-window maximum assignments is enforced during feasibility search. Violations reject the assignment. |
| `min` utilization | **DEFERRED** | Minimum assignment obligations are NOT checked in Package 001. This is a post-feasibility concern. |

**Rationale**: `min` utilization is an obligation constraint, not a feasibility constraint. It asks "did we give Alice enough shifts?" not "can we assign Alice to this shift without violating a limit?" Mixing obligation checking into feasibility conflates "possible" with "acceptable per policy."

### Qualification Validity

**Rule**: Candidate qualifications must provide **full-interval coverage** of the assigned demand unit.

Precisely:
- For demand unit `d` with interval `[d.start, d.end)`
- For candidate `c` with qualification `q` valid during `[q.validFrom, q.validUntil)`
- Assignment is feasible only if: `q.validFrom <= d.start` AND `q.validUntil >= d.end`

**Rationale**: Partial validity (qualification expiring mid-shift) creates a coverage gap. The feasibility package guarantees complete non-violation; partial validity would leak violations into the schedule.

### Coverage Success Semantics

**Rule**: Solver success requires **full coverage** of all demand units.

```
solve(input).feasible === true  ⟺  every demand unit has a valid assignment
```

**Rationale**: The first package answers "does a non-violating full assignment exist?" Partial coverage introduces optimization (which demands to fill) that is out of scope.

### Partial Fill

**Status**: **OUT OF SCOPE**

Package 001 has no partial-fill success mode. There is no `partial: true` result state. Infeasibility means "no complete assignment exists"—not "here is the best partial assignment we could find."

**Rationale**: Partial fill is a distinct concern requiring preference ranking, demand prioritization, and optimization criteria. These are deferred to later packages.

---

## Deferred Policy (Beyond Package 001)

The following are explicitly deferred and NOT present in this package:

| Deferred Concern | Future Package | Why Deferred |
|------------------|----------------|--------------|
| Minimum utilization obligations | 002+ | Post-feasibility policy check |
| Partial fill semantics | 002+ | Requires optimization framework |
| Optimization / ranking | 002+ | Requires objective function |
| Preference handling | 002+ | Soft constraint framework needed |
| Fairness / balancing | 003+ | Requires historical tracking |
| Shift swapping / repair | 003+ | Requires delta computation |

---

## Infeasibility Definition

In Package 001, **infeasibility** means:

> No complete assignment exists where every demand unit is assigned an agent such that:
> 1. The agent possesses all required capabilities valid for the full interval
> 2. No agent is assigned to overlapping intervals
> 3. No agent exceeds their `max` utilization in any rolling window

Infeasibility reasons are reported structurally (see `InfeasibilityReason` type) but the solver does not attempt remediation or partial solutions.

---

## Amendment Process

To modify this policy lock:

1. Create a new PDA task documenting the policy change
2. Update this file with amendment reference
3. Update `src/policy.ts` constants if runtime behavior changes
4. Ensure tests validate the new semantics explicitly

---

## References

- PDA Task: `20260402-003-lock-feasibility-policy-parameters`
- Constraint Contract: `20260402-002` (primitive constraint semantics)
- First Package Spec: `20260402-001-staffing-scheduling-pda`
