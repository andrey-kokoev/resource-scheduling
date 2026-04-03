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
