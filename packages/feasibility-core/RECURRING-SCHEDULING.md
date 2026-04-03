# Recurring Scheduling Boundary Proposal

## Purpose

Recurring scheduling stays at the domain layer in the first pass. It is a template-and-expansion problem, not a new primitive solver concept.

The recurring layer should author repeated staffing patterns, apply exceptions, and deterministically expand into finite concrete `DomainInput`. The solver should continue to see only concrete shifts, needs, availability windows, and hard rules.

## Boundary Decision

Recurring scheduling is proposed as a **domain-side compilation boundary**.

Keep recurrence in the domain layer:

- recurring shift templates
- recurring need templates
- recurring availability templates
- recurrence rules
- exceptions and overrides
- finite expansion horizon

Do not widen the primitive kernel for recurrence in the first pass.

Why:

- the current solver already expects finite concrete inputs
- recurrence is authoring and generation logic, not a feasibility relation
- expansion into concrete data preserves the existing solver boundary

## Proposed Recurring Domain Model

The first-pass model is intentionally thin and template-oriented.

### RecurringShiftTemplate

Represents repeated shift generation.

Suggested fields:

- `id`
- `siteId?`
- `shiftFamilyId?`
- `startTime`
- `endTime`
- `recurrenceRule`
- `activeFrom`
- `activeUntil?`

### RecurringNeedTemplate

Represents recurring staffing demand attached to recurring shifts.

Suggested fields:

- `id`
- `recurringShiftTemplateId`
- `lineId?`
- `positionId`
- `count`
- `activeFrom`
- `activeUntil?`

### RecurringAvailabilityTemplate

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

### Recurrence Rule Shape

The first pass should stay minimal:

- `frequency: 'weekly'`
- optional `interval`
- `weekdaySet`

That is enough to express realistic repeating staffing authoring without introducing a general calendar algebra.

## Horizon Semantics

Expansion is always finite.

Use an explicit horizon object:

- `expandFrom`
- `expandUntil`

Templates only emit occurrences inside the intersection of:

- the template active range
- the explicit expansion horizon

If the intersection is empty, the template emits nothing.

This keeps recurrence bounded and makes the expansion step transparent.

## Exception Semantics

Exceptions stay domain-layer constructs and apply before solving.

First-pass exception kinds:

- `skip`
- `modify`
- `override-future`

Recommended targets:

- recurring shift templates
- recurring need templates
- recurring availability templates

Recommended precedence:

1. base recurring template
2. recurring rule or template attachment
3. exception
4. concrete generated instance

Interpretation:

- `skip` removes one generated occurrence
- `modify` replaces one generated occurrence’s relevant fields
- `override-future` changes behavior from an effective date forward

Exceptions should be resolved during domain expansion, not inside the primitive solver.

## Deterministic Expansion

Recurring templates must deterministically expand into ordinary concrete `DomainInput`.

Recommended order:

1. select recurring templates whose active ranges intersect the horizon
2. expand recurring shift templates into concrete shifts
3. expand recurring need templates against the generated shifts
4. expand recurring availability templates into concrete availability windows
5. apply exceptions
6. emit ordinary concrete `DomainInput`

Deterministic ids should be derived from stable facts such as:

- template id
- occurrence date
- stable ordinal or time fragment when needed

Recommended id pattern:

- shift: `rst:<templateId>:<yyyy-mm-dd>`
- need: `rnt:<templateId>:<yyyy-mm-dd>`
- availability: `rat:<templateId>:<yyyy-mm-dd>:<ordinal>`

If expansion would generate duplicate concrete ids, that is an expansion error.

## Expansion Failure vs Solver Infeasibility

These are separate stages and must remain separate.

### Expansion failure

The domain input could not be concretized into a valid finite `DomainInput`.

Examples:

- invalid recurrence rule
- inverted or empty horizon
- unknown template reference
- conflicting exception
- generated id collision

### Solver infeasibility

A valid concrete `DomainInput` exists, but no complete non-violating assignment exists.

Examples:

- no eligible agent
- availability conflict
- coverage conflict
- utilization violation

Expansion failure should return expansion-layer errors, not primitive infeasibility reasons.

## Why This Fits The Current Solver

The current solver already wants:

- concrete shifts
- concrete needs
- concrete availability windows
- hard constraints over intervals

That means recurrence can stay outside the primitive kernel until a future use case proves that template-level semantics are solver-relevant.

## Decision Summary

Recommended first-pass contract:

- recurrence is domain authoring and finite expansion
- exceptions apply before solving
- the solver sees only concrete instances
- expansion failure is distinct from solve infeasibility

This is coherent with the current package boundary and strong enough to drive later implementation tasks.

## First Behavior Cases

The smallest recurring behavior slice is captured in [RECURRING-FIRST-CASES.md](./RECURRING-FIRST-CASES.md).

That document narrows the first implementation target to:

- one weekly recurring shift template shape
- one need-template attachment shape
- one bounded-horizon expansion success case
- one expansion failure case
