---
status: PLANNED
owner: unassigned
---

# 20260403-066 Recurrence Expansion Validation And Failure Semantics

## Goal

Define the validation rules and failure semantics for the recurrence-expansion layer.

## Why

Once recurrence is treated as a domain-side compilation step, failure can happen before solving:

- invalid recurrence rules
- empty or inverted horizons
- duplicate generated ids
- exceptions targeting nonexistent templates or occurrences
- conflicting overrides

Those failures should not leak ambiguously into the solver.

## What This Task Should Clarify

1. What validation happens before expansion?

2. What validation happens during expansion?

3. What kinds of expansion errors exist?

4. What shape should expansion errors have?

5. How should expansion failure be separated from solve infeasibility?

## Constraints

- keep expansion failure separate from solver failure
- optimize for explicit, debuggable domain-layer errors
- do not widen the primitive solver

## Acceptance Criteria

- expansion-layer failure kinds are explicit
- error shape is proposed
- expansion failure is clearly separated from solve infeasibility

## First Pass

### Recommended validation stages

#### Before expansion

Validate:

- recurrence rule shape
- active date range validity
- finite horizon validity
- template references
- exception target references at the template level

Examples:

- unknown recurring shift template id on a recurring need template
- `activeUntil < activeFrom`
- `expandUntil < expandFrom`
- unsupported weekday set or empty recurrence rule

#### During expansion

Validate:

- deterministic id collisions
- exception target resolution at the concrete occurrence level
- conflicting exception application
- malformed override payloads

Examples:

- two generated concrete shifts with the same derived id
- `modify` exception for an occurrence that does not exist in the expansion horizon
- two conflicting overrides for the same target/effective date

### Recommended failure kinds

Suggested first-pass categories:

- `invalid-template`
- `invalid-horizon`
- `invalid-recurrence-rule`
- `unknown-template-reference`
- `unknown-exception-target`
- `generated-id-collision`
- `conflicting-exception`
- `invalid-exception-payload`

### Recommended error shape

Keep the error explicit and domain-layer specific.

Suggested shape:

- `type`
- `message`
- `stage: 'pre-expand' | 'expand'`
- `entityType`
- `entityId?`
- `relatedEntityIds?`
- `metadata?`

This should be distinct from primitive infeasibility reasons.

### Separation from solve infeasibility

Recommended contract:

- expansion failure means:
  the domain input could not be concretized into a valid finite `DomainInput`

- solve infeasibility means:
  a valid concrete `DomainInput` exists, but no complete non-violating assignment exists

These should never be collapsed into one result kind.

### Current recommendation

Introduce a clear pre-solve expansion boundary:

1. validate recurrence templates/horizon/exceptions
2. expand into concrete `DomainInput`
3. only then call `compileDomain` and `solve`

If step 1 or 2 fails:

- return expansion errors
- do not produce primitive infeasibility output
