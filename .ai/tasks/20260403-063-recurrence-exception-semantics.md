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
