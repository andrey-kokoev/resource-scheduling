---
status: PLANNED
owner: unassigned
---

# 20260403-065 Recurrence Expansion Algorithm

## Goal

Define the deterministic domain-layer algorithm that expands recurring templates plus horizon plus exceptions into ordinary concrete `DomainInput`.

## Inputs

This task should build directly on:

- `061` recurring scheduling de-arbitrarization
- `062` recurrence as compilation boundary
- `063` recurrence exception semantics
- `064` recurring domain template model

## What This Task Should Clarify

1. In what order are recurring templates expanded?

2. In what order are exceptions applied?

3. How are generated concrete instance ids formed?

4. How are collisions or duplicate generation handled?

5. How are active date ranges and horizon bounds intersected?

6. What exactly is emitted as concrete `Shift`, `Need`, and `CandidateAvailability`?

## Constraints

- deterministic output
- finite horizon only
- no primitive solver widening
- optimize for a compilation step that is transparent and explainable

## Acceptance Criteria

- an explicit expansion order is proposed
- id-generation rules are explicit
- exception-application order is explicit
- the result is concrete enough to drive a future implementation task

## First Pass

### Recommended expansion order

1. select recurring templates whose active ranges intersect the finite horizon
2. expand recurring shift templates into concrete shifts
3. expand recurring need templates against the generated concrete shifts
4. expand recurring availability templates into concrete availability windows
5. apply exceptions
6. emit ordinary concrete `DomainInput`

Reason:

- shifts should exist before recurring needs that attach to them can be materialized
- availability can expand independently once dates are known
- exceptions should apply after candidate concrete instances exist, but before the final concrete domain input is handed off

### Horizon intersection rule

For each recurring template:

- effective expansion window =
  intersection of:
  - template active range
  - finite expansion horizon

If the intersection is empty:

- emit nothing for that template

### Id-generation rule

Generated concrete ids should be deterministic and derivable from:

- template id
- local occurrence date
- optional occurrence ordinal if needed

Suggested pattern:

- shift: `rst:<templateId>:<yyyy-mm-dd>`
- need: `rnt:<templateId>:<yyyy-mm-dd>`
- availability: `rat:<templateId>:<yyyy-mm-dd>:<ordinal>`

If same-day collisions are possible, add a stable ordinal or time fragment rather than a random id.

### Duplicate/collision handling

If expansion would generate two concrete objects with the same deterministic id:

- treat that as a domain-expansion error
- do not silently merge them

This keeps expansion transparent and debuggable.

### Exception application order

Apply exceptions after concrete generation in this order:

1. `skip`
2. `modify`
3. `override-future`

Operationally:

- `override-future` may be implemented by splitting the effective template range at the override point before concrete expansion, if that is cleaner
- but the semantics should still be equivalent to “base template plus future suffix replacement”

### Concrete emission

The output of expansion should be ordinary concrete domain objects:

- `Shift[]`
- `Need[]`
- `CandidateAvailability[]`

No recurrence objects cross into `compileDomain`.

### Current recommendation

Keep expansion deterministic, explicit, and debuggable.

If expansion fails:

- fail at the domain-expansion layer
- do not defer recurrence ambiguity into the primitive solver
