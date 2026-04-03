# Recurring First Cases

This document fixes the smallest recurrence behavior slice to implement first.

It stays intentionally narrow:

- one weekly recurring shift template shape
- one recurring need attachment shape
- one bounded-horizon expansion success case
- one expansion failure case

The goal is not to build a broad recurrence matrix.
The goal is to give the first implementation tasks a small, stable target.

## Case 1: Weekly Shift Template Expansion

Purpose:

- prove that a weekly recurring shift template can expand into finite concrete shifts
- keep the shape small enough to implement without widening the solver boundary

Shape:

- `RecurringShiftTemplate`
- `frequency: 'weekly'`
- `weekdaySet`
- `activeFrom`
- `activeUntil?`
- explicit finite expansion horizon

Expected behavior:

- only dates inside the horizon emit concrete shifts
- only dates inside the template active range emit concrete shifts
- generated ids are deterministic

This case should be the first success path.

## Case 2: Need Attachment To Generated Shifts

Purpose:

- prove that a recurring need template can attach to the concrete shifts produced by expansion
- keep attachment local to the generated shift instances

Shape:

- `RecurringNeedTemplate`
- `recurringShiftTemplateId`
- `positionId`
- `count`
- `activeFrom`
- `activeUntil?`

Expected behavior:

- the recurring need expands only when its target shift occurrence exists
- the resulting concrete need is attached to the generated shift id
- attachment does not introduce any recurrence semantics into the solver

This case should reuse the success path from Case 1.

## Case 3: Bounded Horizon Partial Expansion

Purpose:

- prove that recurrence respects a finite solve window
- make horizon clipping visible and deterministic

Shape:

- same weekly shift template as Case 1
- horizon shorter than the template active range

Expected behavior:

- occurrences outside the horizon are not emitted
- the emitted concrete set is the intersection of active range and horizon

This case should stay purely domain-side.

## Case 4: Expansion Failure On Invalid Horizon

Purpose:

- keep expansion failure separate from solve infeasibility
- establish one small failure shape before any implementation widens

Shape:

- any recurring template
- inverted or empty expansion horizon

Expected behavior:

- expansion fails before solving
- the failure is reported as an expansion-layer error
- no solver infeasibility reason is emitted

This case should be the first failure path.

## Out Of Scope For The First Slice

- optimization across recurrence patterns
- recurrence exceptions beyond simple placeholders
- rolling or open-ended recurrence
- recurrence-aware solver witnesses
- UI-driven recurrence authoring
- broad scenario matrices

## Implementation Order

1. weekly shift template expansion
2. need attachment to generated shifts
3. bounded horizon clipping
4. invalid-horizon failure

That order gives the first recurrence work a tiny concrete target while preserving the domain-only boundary.
