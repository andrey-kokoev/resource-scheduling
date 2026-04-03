# Recurring Implementation Queue

This queue turns the recurring-scheduling PDA cluster into the next implementation sequence.

Boundary decision stays fixed:

- recurrence is a domain-side compilation concern
- the primitive solver continues to see only concrete finite `DomainInput`
- recurrence failure is separate from solver infeasibility

## First Implementation Slice

**Task:** implement the smallest useful recurring-domain model surface before expansion logic.

Why this comes first:

- it keeps recurrence out of the primitive kernel
- it lets later expansion code target real shapes instead of speculative ones
- it reduces risk by forcing the template vocabulary to exist before algorithm work starts

What this slice should include:

- recurring shift templates
- recurring need templates
- recurring availability templates
- recurrence rule shape for the first pass
- explicit finite horizon fields
- exception placeholders that can be carried through the model

What it should not include:

- expansion algorithm
- solver integration
- optimization or ranking
- recurrence-aware primitive witnesses
- product UI for recurrence authoring

## Recommended Order

### 1. Domain template model

Implement the recurring template types and the first-pass recurrence rule shape.

Focus:

- template identity
- site / line / candidate attachment points
- finite active range
- weekly or weekday-set recurrence rule
- exception references as data, not behavior

Risk reduced:

- later stages can use concrete template objects instead of inventing them while implementing expansion

### 2. Deterministic finite expansion

Implement expansion from recurring templates into concrete `DomainInput` over an explicit horizon.

Focus:

- horizon intersection
- deterministic ids
- concrete shift/need/availability generation
- template-to-instance mapping

Risk reduced:

- the solver boundary stays concrete and finite
- expansion behavior becomes inspectable and testable

### 3. Exception application

Implement the first-pass exception kinds against the generated concrete instances.

Focus:

- skip one occurrence
- modify one occurrence
- override future from an effective date

Risk reduced:

- recurrence behavior remains coherent without widening the solver

### 4. Expansion validation and failure reporting

Implement explicit expansion-layer errors and validation.

Focus:

- invalid template shape
- invalid horizon
- unknown template references
- conflicting exception application
- generated id collisions

Risk reduced:

- recurrence failures stay separate from solve infeasibility

### 5. Caller integration

Wire the domain-side expansion step into the caller flow that produces concrete `DomainInput`.

Focus:

- one pre-solve expansion step
- no recurrence objects cross into `compileDomain`
- existing solver/result flow stays unchanged

Risk reduced:

- recurrence remains a boundary concern instead of becoming solver semantics

## Explicit Out Of Scope For The First Slice

- recurrence optimization
- recurrence preferences or fairness
- rolling or open-ended recurrence solving
- pattern learning from past schedules
- UI-driven recurrence editing workflows
- recurrence as a first-class solver witness type

## Queue Summary

The smallest safe first coding task is the **domain template model**.

After that:

1. deterministic expansion
2. exception application
3. validation and failure semantics
4. caller integration

That sequence keeps recurrence domain-side, finite, and testable while preserving the current solver boundary.
