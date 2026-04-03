---
status: COMPLETE
owner: codex
---

# 20260403-082 Baseline Repair Workflow Boundary Proposal

## Goal

Consolidate the baseline/lock/retention/repair PDA thread into one coherent boundary proposal artifact.

## Inputs

- `076` standard-week baseline lock-and-fill de-arbitrarization
- `077` lock semantics and solver boundary
- `078` baseline retention hierarchy de-arbitrarization
- `079` repair orchestration around solver
- `080` copied baseline state representation
- `081` repair attempt compilation

## What This Task Should Produce

One durable artifact that explains:

- why baseline replication plus repair is likely the stronger primary workflow
- the distinction between:
  - hard locks
  - retention hierarchy
  - repair orchestration
  - concrete solve attempts
- where the current feasibility solver sits inside that workflow
- what should remain workflow-layer logic rather than solver-domain logic

## Desired Output Shape

Prefer one durable artifact such as:

- `BASELINE-REPAIR-WORKFLOW.md`

placed alongside the current package-boundary docs.

## Constraints

- do not implement the workflow
- do not reopen settled first-pass positions without a strong reason
- optimize for coherence and decision-readiness

## Acceptance Criteria

- a reader can understand the baseline repair workflow end to end
- the split between workflow layer and solver layer is explicit
- the artifact is strong enough to guide future implementation-task generation
