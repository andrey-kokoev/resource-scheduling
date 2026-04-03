---
status: COMPLETE
owner: codex
---

# 20260403-068 Recurrence Feature Matrix And Boundary Surface

## Goal

Reflect the current recurrence position accurately in the external expectation-setting surface.

## Inputs

- `061` recurring scheduling de-arbitrarization
- `062` recurrence as compilation boundary
- `063` recurrence exception semantics
- `064` recurring domain template model
- `065` recurrence expansion algorithm
- `066` recurrence expansion validation and failure semantics
- `067` recurring scheduling boundary proposal
- current feature matrix and boundary/docs pages

## What This Task Should Produce

Update the user-facing capability/boundary surface so recurrence is represented clearly as:

- not currently available
- planned / likely at the domain layer
- not part of the primitive solver boundary

## Desired Output Shape

Prefer updates to the existing docs/pages rather than inventing new surfaces:

- `apps/feasibility-playground/feature-matrix.html`
- `apps/feasibility-playground/boundary.html`
- `apps/feasibility-playground/docs.html`
- optionally `packages/feasibility-core/README.md` if needed for coherence

## Constraints

- do not implement recurrence
- do not widen package semantics
- keep recurrence described as a domain-layer expansion concern
- keep user-facing language clear and non-speculative

## Acceptance Criteria

- recurrence appears explicitly in the feature matrix
- recurrence status is clearly marked as planned / likely, not available
- the boundary surface makes clear that recurrence would compile into concrete finite input
- users can tell recurrence is not a primitive solver capability

## Worker Guidance

- treat the current recurrence PDA cluster as authority
- prefer short explicit wording over broad future-roadmap prose
- if a page already says something contradictory, reconcile it rather than adding another explanation
