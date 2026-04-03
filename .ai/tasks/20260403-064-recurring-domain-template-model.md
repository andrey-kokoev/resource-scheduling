---
status: PLANNED
owner: unassigned
---

# 20260403-064 Recurring Domain Template Model

## Goal

Turn the first-pass recurring-scheduling PDA cluster into a concrete domain-template model proposal.

## Inputs

This task should build directly on:

- `061` recurring scheduling de-arbitrarization
- `062` recurrence as compilation boundary
- `063` recurrence exception semantics

## What This Task Should Produce

A proposed domain-layer model for:

- recurring shift template
- recurring need template
- recurring availability template
- explicit finite horizon
- exception records / overrides

## Required Questions

1. What fields belong on each recurring template?

2. What recurrence rule representation is sufficient for the first pass?
- weekday set
- weekly cadence
- start/end bounds
- optional interval bounds

3. How do recurring needs attach to recurring shifts?

4. How are exceptions represented?
- skip
- modify
- future-suffix override

5. What does the finite horizon object look like?

6. What concrete expansion output is expected before `compileDomain`?

## Constraints

- stay at the domain layer
- do not widen the primitive solver
- optimize for a model that can compile into ordinary concrete `DomainInput`
- keep the first pass minimal but real

## Acceptance Criteria

- a concrete recurring-template model is proposed
- the proposal fits the current compilation-boundary recommendation
- the proposal is explicit enough to drive a later compile/expansion task

## First Pass

### Recommended recurring template objects

#### RecurringShiftTemplate

Represents a recurring generator for concrete shifts.

Suggested fields:

- `id`
- `siteId?`
- `shiftFamilyId?`
- `startTime`
- `endTime`
- `recurrenceRule`
- `activeFrom`
- `activeUntil?`

#### RecurringNeedTemplate

Represents recurring staffing demand attached to a recurring shift template.

Suggested fields:

- `id`
- `recurringShiftTemplateId`
- `lineId?`
- `positionId`
- `count`
- `activeFrom`
- `activeUntil?`

#### RecurringAvailabilityTemplate

Represents recurring candidate availability or unavailability.

Suggested fields:

- `id`
- `candidateId`
- `kind`
- `startTime`
- `endTime`
- `recurrenceRule`
- `activeFrom`
- `activeUntil?`
- `reason?`

### Recommended recurrence rule shape

Keep the first pass minimal.

Suggested rule object:

- `frequency: 'weekly'`
- `interval?: number`
- `weekdaySet: readonly number[]`

Optional later additions:

- monthly patterns
- nth weekday semantics
- more complex calendar rules

For now, weekly + weekday-set is likely enough for realistic recurring staffing authoring.

### Horizon object

Introduce an explicit finite horizon object for expansion.

Suggested shape:

- `expandFrom`
- `expandUntil`

This object belongs to recurrence expansion, not the primitive solver.

### Exception records

Suggested first-pass exception record:

- `id`
- `targetType`
- `targetId`
- `effectiveDate`
- `kind: 'skip' | 'modify' | 'override-future'`
- `payload?`

Where:

- `skip` removes one generated occurrence
- `modify` replaces one generated occurrence’s relevant fields
- `override-future` changes the template behavior from a chosen date onward

### Expansion output

Expansion should produce ordinary concrete domain input:

- concrete `Shift`
- concrete `Need`
- concrete `CandidateAvailability`

and then pass that ordinary concrete result into the existing `compileDomain`.

### Current recommendation

Keep the recurring model thin and template-oriented:

- recurring shift templates generate concrete shifts
- recurring need templates attach to recurring shift templates
- recurring availability templates generate concrete availability windows
- horizon and exceptions stay in the domain-expansion layer
