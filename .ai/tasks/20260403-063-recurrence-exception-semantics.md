---
status: PLANNED
owner: unassigned
---

# 20260403-063 Recurrence Exception Semantics

## Goal

Clarify the semantic model for exceptions and overrides in recurring scheduling.

## Why

Even if recurrence mostly stays at the compilation boundary, exceptions are where complexity enters:

- skip one occurrence
- modify one occurrence
- modify all future occurrences
- override availability for one date
- override a recurring need template for one instance

Without a clean exception model, recurrence remains underspecified.

## Core Questions

1. What kinds of exceptions exist?
- deletion
- modification
- future-suffix override

2. What objects can exceptions target?
- recurring shift template
- recurring need template
- recurring availability template
- recurring rule attachment

3. At what stage do exceptions apply?
- before expansion
- during expansion
- after concrete generation

4. What is the precedence model?
- base template
- recurring rule
- exception
- concrete override

5. What does the user conceptually author?
- recurrence + patches
- recurrence + regenerated concrete instances

## Constraints

- do not implement recurrence here
- optimize for semantic coherence at the domain layer
- prefer models that still compile into concrete finite input

## Acceptance Criteria

- a coherent exception model is proposed
- precedence is explicit
- the proposal fits with a finite-horizon compilation model if possible

## First Pass

### Recommended exception kinds

At the domain layer, support these exception kinds first:

- skip one occurrence
- modify one occurrence
- override all future occurrences from a chosen effective date

Do **not** start with a more elaborate exception algebra unless a real use case forces it.

### Recommended targets

Exceptions should be able to target:

- recurring shift templates
- recurring need templates
- recurring availability templates

Rule-template exceptions may be allowed later, but they should not be assumed in the first pass unless clearly needed.

### Recommended application stage

Exceptions should apply during **domain expansion**, before solving.

That means:

- recurrence templates expand over a finite horizon
- exceptions are applied as part of expansion
- the resulting concrete instances are what become `DomainInput`

### Recommended precedence

Use this precedence order:

1. base recurring template
2. recurring rule/template attachment
3. exception
4. concrete generated instance

Interpretation:

- the concrete generated instance is the final product of applying exceptions to the recurring base
- the solver sees only that final concrete result

### Recommended user mental model

The user should conceptually author:

- recurrence templates
- plus exceptions/overrides

not:

- recurrence plus manual editing of the already-expanded concrete calendar as the primary source of truth

### Current recommendation

Keep exception semantics entirely at the domain layer.

If exceptions can be resolved before solve time into concrete finite instances, the primitive solver stays unchanged and the recurrence model remains coherent.
