---
status: COMPLETE
owner: codex
---

# 20260403-054 Feature Matrix: Available / Planned / Out Of Scope

## Goal

Create a comprehensive feature matrix for the current scheduling system surface, with each capability explicitly marked as:

- Available
- Planned / likely
- Out of scope

## Why

The current repo has pieces of this information spread across:

- boundary pages
- README
- contract docs
- readiness docs
- next-milestone docs

But there is not yet one explicit place where a user can compare the current system against a reasonable full scheduling-system expectation surface.

That gap now matters.

## Scope

- create one explicit feature matrix artifact
- include major capability areas a reasonable scheduling/staffing system might be expected to have
- mark each row with status:
  - Available
  - Planned / likely
  - Out of scope
- include a short note for what each row means in the current system

## Recommended Capability Areas

At minimum consider rows for:

- exact-match qualifications
- qualification validity windows
- availability / time off
- shift-pattern compatibility
- minimum rest
- consecutive-work limits
- rolling utilization max
- site-scoped coverage
- line-aware coverage
- infeasibility explanations
- partial fill
- optimization / ranking
- soft constraints
- fairness
- cost / overtime optimization
- recurring scheduling
- qualification substitution
- production sequencing / machine-job planning
- saved scenarios / collaboration
- deployable evaluator surface

## Constraints

- do not make this a vague roadmap
- statuses should be explicit and defensible
- if something is uncertain, prefer a conservative status
- optimize for comparison and expectation-setting, not for prose volume

## Likely Location

Prefer a user-facing static page reachable from the playground and/or boundary docs.

Optionally also maintain a markdown source-of-truth if that helps.

## Acceptance Criteria

- a user can scan the matrix and understand current system coverage
- planned items are clearly separated from explicit non-goals
- the matrix is easy to reach from the existing boundary/docs surface

## Verification

- if implemented in the playground docs surface, playground build/test still pass
