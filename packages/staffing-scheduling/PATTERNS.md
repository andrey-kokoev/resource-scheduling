# Consecutive-Work Pattern Limits

**Package**: `staffing-scheduling` (Package 001)  
**Version**: 1.0.0  
**Contract Date**: 2026-04-02

This document defines consecutive-work pattern limits as a sequence-based pressure test for the primitive feasibility model.

---

## Overview

Consecutive-work limits (e.g., "no more than 6 consecutive worked days") are common labor rules that test whether the primitive kernel can express sequence-based constraints, not just pairwise interval constraints.

**Result**: The primitive model absorbs consecutive-work limits by deriving "worked days" from assignment intervals. No new primitive ontology is required.

---

## Step 1: Worked-Day Derivation

### Calendar Day Basis

**Worked day** is derived from assignment intervals using **local calendar date**:

For an assignment with interval `[start, end)`:
- The assignment contributes to **each calendar day** that the interval touches
- A calendar day is defined in **local time** (the time zone where the shift occurs)

### Overnight Shift Handling

An overnight shift (e.g., 20:00-08:00 next day) touches **two calendar days**:
- Day 1: from 20:00 to midnight
- Day 2: from midnight to 08:00

Both days are considered "worked days" for the agent.

### Multiple Assignments on Same Day

**Rule**: Multiple assignments on the same calendar day count as **one worked day**.

Rationale: The constraint limits consecutive days of work, not total hours or number of shifts. Working two shifts on Tuesday is still "working Tuesday," not "working Tuesday twice."

### Cross-Midnight Assignment Day Count

An assignment crossing midnight affects the consecutive-day count as follows:
- The starting day is counted as worked
- The ending day is counted as worked
- This means an overnight shift can contribute to a consecutive-day run spanning both days

**Example**: Work Mon night (23:00-Tue 07:00), then work Tue day (14:00-22:00):
- Mon is a worked day (started shift)
- Tue is a worked day (ended overnight + worked day shift)
- This is 2 consecutive worked days, NOT a violation of "max 1 consecutive day"

---

## Step 2: Consecutive-Day Semantics

### Definitions

**Worked Day**: A calendar day on which an agent has at least one assignment covering any portion of that day.

**Consecutive Worked Days**: A sequence of worked days with no non-worked days between them.

**Maximum Consecutive Worked Days**: The largest allowed length of a consecutive worked-day sequence.

### Consecutive-Day Run

A **run** is a maximal sequence of consecutive calendar days where each day is a worked day.

**Run Reset Condition**: A single non-worked day resets the run.

**Example** with max 6 consecutive days:
```
Mon Tue Wed Thu Fri Sat Sun Mon Tue
 W   W   W   W   W   W   O   W   W
|---------6 days--------|   reset  |--2 days--

Result: No violation (max run = 6, which equals limit)
```

### Gap Handling

- **One non-worked day**: Resets the run (run length = 0)
- **Multiple non-worked days**: Maintains reset state

### Overlapping/Multiple Shifts on One Day

Multiple shifts on the same calendar day do **not** extend the run length. The run counts **days**, not shifts.

**Example**:
```
Mon: 3 shifts (morning, afternoon, evening)
Tue: 1 shift
Wed: 0 shifts

Run: Mon-Tue = 2 consecutive worked days
Mon's 3 shifts don't make it count as 3 days
```

### Cross-Midnight and Run Length

A cross-midnight shift can **bridge** two consecutive days but does not create a longer run than the actual consecutive calendar days worked.

**Example**: Work overnight Sun-Mon, then work Mon-Tue-Wed:
```
Sun: worked (started overnight)
Mon: worked (ended overnight + day shift)
Tue: worked
Wed: worked

Run: Sun-Mon-Tue-Wed = 4 consecutive days
```

---

## Step 3: Constraint Timing Classification

### Constraint Type: `max-consecutive-days`

```typescript
interface MaxConsecutiveDaysConstraint {
  readonly type: 'max-consecutive-days';
  readonly agentIds: readonly Id[];
  readonly maxDays: number;
}
```

### Evaluation Timing

**Prefix-checkable**: YES (with state)

When considering an assignment of agent A to demand D:
1. Derive which calendar day(s) D would contribute to
2. For each affected day, calculate what the consecutive-day run would become
3. If any run would exceed `maxDays`, reject the assignment

**State Required**: The solver must track, for each agent:
- Which calendar days are already worked
- Current consecutive-day run lengths

This is prefix-checkable because the check only requires:
- The candidate assignment's days
- The agent's existing worked-day history (from committed assignments)

### Comparison to Other Constraints

| Constraint | Scope | Timing | State Required |
|------------|-------|--------|----------------|
| `non-overlap` | Global (per agent) | Prefix-checkable | Existing assignments |
| `capability` | Local | Prefix-checkable | None |
| `utilization` | Global (per agent, window) | Prefix-checkable | Assignment counts per window |
| `minimum-rest` | Global (per agent, pairwise) | Prefix-checkable | Existing assignments |
| `max-consecutive-days` | Global (per agent, sequence) | Prefix-checkable | Worked days per agent |

### State Management

The constraint requires the solver to maintain:

```typescript
interface AgentConsecutiveDaysState {
  readonly agentId: Id;
  /** Set of worked calendar dates (ISO date strings) */
  readonly workedDates: Set<string>;
  /** Current consecutive run length (can be derived from workedDates) */
  readonly currentRunLength: number;
}
```

The run length can be derived from `workedDates` by:
1. Sorting dates chronologically
2. Finding the longest consecutive sequence ending at or near today

---

## Step 4: Primitive Witness Shape

### ConsecutiveDaysViolation Witness

```typescript
interface ConsecutiveDaysViolationWitness {
  readonly _tag: 'ConsecutiveDaysViolation';
  readonly agentId: Id;
  /** The assignment that would create the violation */
  readonly candidateDemandUnitId: Id;
  /** Dates that would form the violating run */
  readonly runDates: readonly string[];  // ISO date strings
  readonly allowedMax: number;
  readonly actualRunLength: number;
}
```

### InfeasibilityReason Extension

The primitive `InfeasibilityReason` union gains a new case:

```typescript
type InfeasibilityReason =
  | ... // existing cases
  | ConsecutiveDaysViolationReason;

interface ConsecutiveDaysViolationReason {
  readonly type: 'consecutive-days-violation';
  readonly agentId: Id;
  readonly candidateDemandUnitId: Id;
  readonly runDates: readonly string[];
  readonly allowedMax: number;
  readonly actualRunLength: number;
}
```

### Witness Invariants

1. `runDates` contains only consecutive calendar dates
2. `actualRunLength = runDates.length`
3. `actualRunLength > allowedMax`
4. `candidateDemandUnitId` is the demand whose assignment creates the violation

---

## Step 5: Domain Regrouping

### Domain Explanation Type

```typescript
interface ConsecutiveDaysViolation {
  readonly type: 'consecutive-days-violation';
  readonly candidateId: Id;
  readonly dates: readonly string[];  // ISO date strings
  readonly allowedMax: number;
  readonly actualDays: number;
  /** The shift that would have been assigned */
  readonly attemptedShiftId: Id;
  /** The date of the attempted shift */
  readonly attemptedDate: string;
}
```

### Regrouping Transformation

**Primitive**: `ConsecutiveDaysViolationReason`
- `agentId` → `candidateId` (direct ID preservation)
- `candidateDemandUnitId` → `attemptedShiftId` + `attemptedDate` (via demand unit mapping)
- `runDates` → `dates` (direct, ISO date strings)
- `allowedMax` → `allowedMax` (direct)
- `actualRunLength` → `actualDays` (direct)

### Example

**Primitive**:
```typescript
{
  type: 'consecutive-days-violation',
  agentId: 'c1',
  candidateDemandUnitId: 'need-123#0',
  runDates: ['2026-04-01', '2026-04-02', '2026-04-03', 
             '2026-04-04', '2026-04-05', '2026-04-06', '2026-04-07'],
  allowedMax: 6,
  actualRunLength: 7
}
```

**Domain**:
```typescript
{
  type: 'consecutive-days-violation',
  candidateId: 'c1',
  dates: ['2026-04-01', '2026-04-02', '2026-04-03', 
          '2026-04-04', '2026-04-05', '2026-04-06', '2026-04-07'],
  allowedMax: 6,
  actualDays: 7,
  attemptedShiftId: 's7',
  attemptedDate: '2026-04-07'
}
```

---

## Implementation Sketch

### Worked Day Derivation

```typescript
function deriveWorkedDates(interval: Interval): string[] {
  const dates: string[] = [];
  const current = new Date(interval.start);
  
  // Include the start day
  dates.push(formatISODate(current));
  
  // Move to next day
  current.setDate(current.getDate() + 1);
  current.setHours(0, 0, 0, 0);
  
  // Include any additional days the interval touches
  while (current < interval.end) {
    dates.push(formatISODate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return [...new Set(dates)]; // Deduplicate
}

function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

### Consecutive Run Calculation

```typescript
function calculateConsecutiveRunLength(
  workedDates: Set<string>,
  newDate: string
): number {
  const allDates = new Set(workedDates);
  allDates.add(newDate);
  
  const sorted = Array.from(allDates).sort();
  
  // Find the run containing newDate
  let runLength = 1;
  const newDateIndex = sorted.indexOf(newDate);
  
  // Count backwards
  for (let i = newDateIndex - 1; i >= 0; i--) {
    if (isConsecutive(sorted[i], sorted[i + 1])) {
      runLength++;
    } else {
      break;
    }
  }
  
  return runLength;
}

function isConsecutive(earlier: string, later: string): boolean {
  const e = new Date(earlier);
  const l = new Date(later);
  const diffMs = l.getTime() - e.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}
```

### Constraint Check

```typescript
function checkMaxConsecutiveDays(
  agentId: Id,
  candidateDemandUnitId: Id,
  candidateInterval: Interval,
  existingWorkedDates: Set<string>,
  maxDays: number,
): boolean {
  const candidateDates = deriveWorkedDates(candidateInterval);
  
  for (const date of candidateDates) {
    const runLength = calculateConsecutiveRunLength(existingWorkedDates, date);
    if (runLength > maxDays) {
      return false;
    }
  }
  
  return true;
}
```

---

## Verification Requirements

Test cases should cover:

1. **Simple consecutive days**: 5 days worked with max 6 → SATISFIED
2. **At limit**: 6 days worked with max 6 → SATISFIED
3. **Violation**: 7 days worked with max 6 → VIOLATION
4. **Gap resets**: Work Mon-Fri, off Sat, work Sun with max 5 → SATISFIED
5. **Overnight shift**: 23:00-07:00 touches 2 days → both counted
6. **Multiple shifts one day**: 3 shifts Tuesday, max 1 consecutive → depends on adjacent days
7. **Cross-midnight run**: Work Sun night, Mon day, Tue day with max 2 → VIOLATION (3 days)

---

## Pressure Test Result

**PASSED**: The consecutive-work constraint fits into the primitive model by:
- Deriving "worked days" from assignment intervals (no new primitive)
- Using set operations on calendar dates (no new ontology)
- Maintaining per-agent state (consistent with other global constraints)

The only additions are:
- New constraint variant (`max-consecutive-days`)
- New infeasibility reason (`consecutive-days-violation`)
- New domain explanation (`consecutive-days-violation`)

These are additive changes that don't perturb existing constraint contracts.

---

## References

- PDA Task: `20260402-006-consecutive-work-pattern-limits`
- Rest Constraint: `20260402-005-minimum-rest-constraint-semantics`
- Constraint Contract: `20260402-002-constraint-contract-pda`
- Explanation Regrouping: `20260402-004-infeasibility-witness-regrouping`
