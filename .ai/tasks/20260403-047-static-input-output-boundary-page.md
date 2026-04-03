---
status: COMPLETE
owner: codex
---

# 20260403-047 Static Input/Output Boundary Page

## Goal

Build a static page that explains, at a high level, what kinds of inputs `feasibility-core` accepts and what kinds of outputs it produces.

## Purpose

Help users understand the gap between:

- the scheduling or staffing problem they have in mind
- and what the current system can actually accept, solve, and return

This page is not API reference and not product marketing.

It is a boundary-clarification artifact.

## Core Questions The Page Should Answer

- What does the system need as input?
- What does the system return as output?
- What kinds of real-world problems fit this model well?
- What kinds of problems do not fit yet?
- Where does user/domain language compile into the solver’s current boundary?

## Scope

- static page only
- should be viewable alongside the playground or package docs
- should explain:
  - domain-side input concepts
  - primitive/compiled solver boundary
  - feasible vs infeasible outputs
  - regrouped explanations
  - current limitations / non-goals
  - important concepts that are **not** in the current model
  - which missing concepts are explicitly out of scope vs plausibly planned

## Recommended Content Shape

- short framing section
- “What you give the system”
- “What the solver actually works on”
- “What you get back”
- “What is not in the current model”
- “Good fit / poor fit”
- one compact worked example from plant staffing

For “What is not in the current model”, distinguish clearly among:

- explicitly out of scope
- not modeled yet but plausible next expansions
- common user assumptions that do not currently hold

## Constraints

- do not turn this into low-level API docs
- do not duplicate the whole contract
- optimize for comprehension by a thoughtful evaluator or potential adopter
- prefer diagrams, tables, or structured comparisons if that helps clarity

## Likely Locations

One of:

- `apps/feasibility-playground/` as a static companion page
- `packages/feasibility-core/` as a static explanatory doc

Choose the location that makes it easiest for users of the playground to find.

## Acceptance Criteria

- a user can understand what input shape the system expects
- a user can understand what output shape the system returns
- a user can see the mismatch between unsupported expectations and current capability
- a user can distinguish between:
  - explicit non-goals
  - current gaps that may be expanded later
- the page is easy to reach from the playground or package docs

## Verification

- if placed in the playground app, playground build/test still pass
- if docs-only, package docs remain coherent and linked
