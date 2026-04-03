# Minimum-Rest Constraint Semantics

**Package**: `staffing-scheduling` (Package 001)  
**Version**: 1.0.0  
**Contract Date**: 2026-04-02

This document defines the minimum-rest hard constraint as a pressure test for the primitive feasibility model.

---

## Overview

The minimum-rest constraint ensures agents have sufficient recovery time between assignments. This is a common labor rule that tests whether the primitive kernel (intervals, assignments, constraints) can express temporal separation requirements without new ontology.

**Result**: The primitive model absorbs minimum-rest cleanly as a new constraint type.

---

## Step 1: Primitive Rest Semantics

### Rule Definition

For any agent, between any two assignments A and B where `A.interval.end <= B.interval.start`:

```
required: B.interval.start - A.interval.end >= minimumRestDuration
```

Where `minimumRestDuration` is a configurable duration (e.g., 8 hours, 11 hours, 24 hours).

### Gap Definition

**Gap** = `laterAssignment.interval.start - earlierAssignment.interval.end`

- Gap > 0: Time between assignments (rest period)
- Gap = 0: Adjacent assignments (zero rest)
- Gap < 0: Overlapping assignments (handled by `non-overlap` constraint)

### Symmetry

The rule is **symmetric** over assignment pairs. If we define:
- `gap(A, B)` where `A` ends before `B` starts
- Then `gap(B, A)` is undefined (B doesn't end before A starts)

We only evaluate ordered pairs where `end_i <= start_j`.

### Overlapping Intervals

Overlapping intervals (`gap < 0`) are **not** rest violations—they are handled by the existing `non-overlap` constraint.

The minimum-rest constraint only evaluates non-overlapping pairs. This is intentional separation of concerns:
- `non-overlap`: No simultaneous assignment
- `minimum-rest`: Required separation between sequential assignments

### Zero-Gap Adjacency

Zero-gap adjacency (`gap = 0`) is:
- Allowed when `minimumRestDuration = 0`
- A rest violation when `minimumRestDuration > 0`

Examples:
- Shift A: 08:00-16:00, Shift B: 16:00-20:00 → gap = 0
- With 8-hour minimum rest: **VIOLATION**
- With 0-hour minimum rest: **ALLOWED**

---

## Step 2: Interval Boundary Semantics

### Half-Open Intervals

Intervals in the primitive model are **half-open**: `[start, end)`

This means:
- A ends at 16:00: the agent is available at 16:00:00.000
- B starts at 16:00: the agent must be present at 16:00:00.000

With `[start, end)` semantics:
- Agent is NOT assigned to A at exactly 16:00:00.000
- Agent IS assigned to B at exactly 16:00:00.000
- No temporal overlap, but zero rest gap

### End-to-Start Touching

When `A.end == B.start`:
- No overlap (half-open intervals don't include end)
- Gap = 0
- Rest = 0

This is the boundary case that triggers minimum-rest violations when `minimumRestDuration > 0`.

### Equality Interpretation

`A.end == B.start` counts as **zero rest**, not positive rest.

For 8-hour minimum rest:
- A ends 08:00, B starts 16:00 → gap = 8 hours → **SATISFIED**
- A ends 08:00, B starts 08:00 → gap = 0 hours → **VIOLATION**

---

## Step 3: Constraint Classification

### Constraint Type: `minimum-rest`

```typescript
interface MinimumRestConstraint {
  readonly type: 'minimum-rest';
  readonly agentIds: readonly Id[];
  readonly durationMs: number;  // Minimum rest in milliseconds
}
```

### Evaluation Timing

**Prefix-checkable**: YES

When considering an assignment of agent A to demand D:
1. Check all existing assignments of A
2. For each existing assignment E where `E.interval` doesn't overlap `D.interval`:
   - If `E.interval.end <= D.interval.start`:
     - Check `D.interval.start - E.interval.end >= durationMs`
   - If `D.interval.end <= E.interval.start`:
     - Check `E.interval.start - D.interval.end >= durationMs`
3. If any check fails, reject the assignment

This is local and prefix-checkable because it only requires the candidate assignment and existing committed assignments.

### Comparison to Other Constraints

| Constraint | Scope | Timing | Notes |
|------------|-------|--------|-------|
| `non-overlap` | Global (per agent) | Prefix-checkable | No overlap allowed |
| `capability` | Local | Prefix-checkable | Per assignment validity |
| `utilization` | Global (per agent, window) | Prefix-checkable | Rolling window max |
| `minimum-rest` | Global (per agent, pairwise) | Prefix-checkable | Sequential separation |

---

## Step 4: Primitive Witness Shape

### RestViolation Witness

```typescript
interface RestViolationWitness {
  readonly _tag: 'RestViolation';
  readonly agentId: Id;
  readonly earlierDemandUnitId: Id;
  readonly laterDemandUnitId: Id;
  readonly requiredRestMs: number;
  readonly actualRestMs: number;
  readonly deficitMs: number;  // requiredRestMs - actualRestMs
}
```

### InfeasibilityReason Extension

The primitive `InfeasibilityReason` union gains a new case:

```typescript
type InfeasibilityReason =
  | ... // existing cases
  | RestViolationReason;

interface RestViolationReason {
  readonly type: 'rest-violation';
  readonly agentId: Id;
  readonly earlierDemandUnitId: Id;
  readonly laterDemandUnitId: Id;
  readonly requiredRestMs: number;
  readonly actualRestMs: number;
}
```

### Witness Invariants

1. `earlierDemandUnitId` ends before `laterDemandUnitId` starts
2. `actualRestMs < requiredRestMs` (otherwise no violation)
3. `deficitMs > 0` (positive deficit indicates violation severity)

---

## Step 5: Domain Regrouping

### Domain Explanation Type

```typescript
interface InsufficientRestViolation {
  readonly type: 'insufficient-rest';
  readonly candidateId: Id;
  readonly earlierShiftId: Id;
  readonly laterShiftId: Id;
  readonly requiredRestHours: number;
  readonly actualRestHours: number;
  readonly deficitHours: number;
}
```

### Regrouping Transformation

**Primitive**: `RestViolationReason`
- `agentId` → `candidateId` (direct ID preservation)
- `earlierDemandUnitId` → `earlierShiftId` (via demand unit → need → shift mapping)
- `laterDemandUnitId` → `laterShiftId` (via demand unit → need → shift mapping)
- `requiredRestMs` → `requiredRestHours` (unit conversion)
- `actualRestMs` → `actualRestHours` (unit conversion)

### Example

**Primitive**:
```typescript
{
  type: 'rest-violation',
  agentId: 'c1',
  earlierDemandUnitId: 'need-123#0',
  laterDemandUnitId: 'need-456#0',
  requiredRestMs: 28800000,  // 8 hours
  actualRestMs: 0            // 0 hours
}
```

**Domain**:
```typescript
{
  type: 'insufficient-rest',
  candidateId: 'c1',
  earlierShiftId: 's1',  // night shift ending 08:00
  laterShiftId: 's2',    // day shift starting 08:00
  requiredRestHours: 8,
  actualRestHours: 0,
  deficitHours: 8
}
```

---

## Implementation Sketch

### Constraint Check

```typescript
function checkMinimumRest(
  newAssignment: Assignment,
  existingAssignments: Assignment[],
  demandUnits: DemandUnit[],
  requiredRestMs: number,
): boolean {
  const newInterval = demandUnits.find(d => d.id === newAssignment.demandUnitId)!.interval;
  
  for (const existing of existingAssignments) {
    const existingInterval = demandUnits.find(d => d.id === existing.demandUnitId)!.interval;
    
    // Skip overlaps (handled by non-overlap constraint)
    if (intervalsOverlap(newInterval, existingInterval)) continue;
    
    // Check gap in both orders
    let gapMs: number;
    if (existingInterval.end <= newInterval.start) {
      gapMs = newInterval.start.getTime() - existingInterval.end.getTime();
    } else {
      gapMs = existingInterval.start.getTime() - newInterval.end.getTime();
    }
    
    if (gapMs < requiredRestMs) return false;
  }
  
  return true;
}
```

### Type Updates

Add to `primitive/types.ts`:
- `MinimumRestConstraint` to `Constraint` union
- `RestViolationReason` to `InfeasibilityReason` union

Add to `explanations.ts`:
- `RestViolationWitness` to `PrimitiveWitness` union
- `InsufficientRestViolation` to `DomainExplanation` union
- Regrouping logic in `regroupToDomainExplanations`

---

## Verification Requirements

Test cases should cover:

1. **Gap > required**: 8-hour rest, 10-hour gap → SATISFIED
2. **Gap = required**: 8-hour rest, 8-hour gap → SATISFIED (exactly meets)
3. **Gap < required**: 8-hour rest, 6-hour gap → VIOLATION
4. **Gap = 0**: 8-hour rest, adjacent shifts → VIOLATION
5. **Zero required rest**: 0-hour rest, any gap → SATISFIED
6. **Overlap handling**: Overlapping intervals → non-overlap constraint violation, not rest violation
7. **Multiple assignments**: Chain of assignments all with sufficient rest → SATISFIED
8. **Violation witness**: Correct deficit calculation

---

## Pressure Test Result

**PASSED**: The minimum-rest constraint fits cleanly into the primitive model without:
- New primitive ontology
- Ad hoc exceptions
- Changes to existing constraint interfaces
- New solver architecture

The only additions are:
- New constraint variant (`minimum-rest`)
- New infeasibility reason (`rest-violation`)
- New domain explanation (`insufficient-rest`)

These are additive changes that don't perturb the existing constraint contract.

---

## References

- PDA Task: `20260402-005-minimum-rest-constraint-semantics`
- Constraint Contract: `20260402-002-constraint-contract-pda`
- Explanation Regrouping: `20260402-004-infeasibility-witness-regrouping`
- Policy Lock: `20260402-003-lock-feasibility-policy-parameters`
