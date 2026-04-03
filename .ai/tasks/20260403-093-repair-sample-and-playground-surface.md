---
status: COMPLETE
owner: codex
---

# 20260403-093 Repair Sample And Playground Surface

## Goal

Expose the new baseline-repair workflow through a concrete sample and a visible playground-facing surface.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `packages/feasibility-core/BASELINE-REPAIR-REVIEW.md`
- `20260403-091-caller-facing-repair-api-first-slice.md`
- `20260403-092-stable-repair-report-first-slice.md`
- current playground sample infrastructure

## What This Task Should Produce

Add one repair-oriented sample that:

- starts from a copied baseline state
- runs the public repair API
- displays the stable repair report in a playground-facing way

## Desired Output Shape

Prefer changes centered in:

- playground sample definitions
- playground UI/result rendering
- focused tests if appropriate

## Scope

In scope:

- one baseline-repair sample scenario
- visible report output using the public repair API
- minimal UI affordance to distinguish solve vs repair mode if needed

Out of scope:

- rich scheduling UI
- editing baseline state through forms
- advanced repair visualizations

## Constraints

- use the public repair surface, not internal modules directly
- keep the UI thin and evaluator-like
- optimize for making the repair workflow understandable

## Acceptance Criteria

- a user can trigger the repair flow from the sample surface
- the stable repair report is visible in the playground
- the feature is demonstrated without turning the playground into a product UI
