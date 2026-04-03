---
status: PLANNED
owner: unassigned
---

# 20260403-061 Recurring Scheduling De-Arbitrarization

## Goal

De-arbitrarize the concept of recurring scheduling before implementation work begins.

## Why

“Recurring scheduling” sounds like one feature, but it still bundles several materially different problems:

- recurring demand generation
- recurring candidate availability
- recurring shift templates
- recurrence exceptions and overrides
- planning horizon expansion
- recurrence as authoring convenience vs recurrence as solver-semantic concept

If we implement against the phrase alone, we will almost certainly smuggle policy and product assumptions into the model.

## Core PDA Question

What is the minimal primitive problem underneath recurring scheduling, and what parts should remain derived/domain-side conveniences rather than entering the solver kernel?

## Live Ambiguities To Resolve

1. What is recurring?
- shifts
- needs
- candidate availability
- pattern rules
- all of the above

2. Is recurrence part of solving or only part of input generation?
- recurrence compiled away before solving
- recurrence visible to the solver

3. What is the unit of recurrence?
- calendar-based rule
- template expansion
- generated future instances over a bounded horizon

4. How do exceptions behave?
- delete one generated occurrence
- override one occurrence
- override a whole future suffix

5. What is the horizon?
- explicit finite solve window
- rolling generation
- open-ended recurrence authoring with finite compilation

6. What is the relationship to current domain entities?
- recurring shift template vs concrete shift
- recurring need template vs concrete need
- recurring availability template vs concrete availability window

## Desired Output

A clear primitive/derived split for recurring scheduling, including:

- what remains domain authoring sugar
- what compiles into current concrete domain inputs
- what, if anything, needs new semantic support in the package boundary

## Constraints

- do not jump to implementation
- do not assume recurrence belongs in the primitive solver
- optimize for semantic clarity and package-boundary cleanliness

## Acceptance Criteria

- the main recurring-scheduling ambiguities are explicit
- primitive vs derived boundaries are proposed
- the task leaves the system with a sharper next modeling question, not a vaguer feature label

## First Pass

### Candidate recurring constructs

The domain can plausibly contain recurring versions of:

- shift templates
- need templates
- candidate availability templates
- shift-pattern/rule templates
- recurrence exceptions

### Recommended primitive / derived split

Keep these **derived / domain-side only**:

- recurring shift templates
- recurring need templates
- recurring availability templates
- recurrence rules like daily / weekly / weekday-set
- exception authoring
- future-suffix overrides

Reason:

- the current solver already wants concrete finite intervals
- recurrence is not itself a feasibility relation
- recurrence mostly describes how to generate concrete domain instances

Keep these **primitive / solver-visible** only after compilation:

- concrete shifts
- concrete needs
- concrete availability windows
- concrete rule applications
- concrete exceptions after they have been applied to generated instances

### Current recommendation

Recurring scheduling should **not** enter the primitive solver as a first-class concept in the next step.

Instead:

- recurrence should live at the domain compilation boundary
- recurrence expands into finite concrete `DomainInput`
- the solver continues to reason only over concrete intervals and concrete demand

### Sharper next question

If recurrence is compiled away, what exact recurrence template model and exception model are needed at the domain layer so that finite expansion stays coherent and predictable?
