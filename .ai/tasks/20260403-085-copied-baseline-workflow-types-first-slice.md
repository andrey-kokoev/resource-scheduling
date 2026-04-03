---
status: COMPLETE
owner: codex
---

# 20260403-085 Copied Baseline Workflow Types First Slice

## Goal

Introduce the first workflow-layer types for copied baseline state, separate from ordinary concrete `DomainInput`.

## Inputs

- `packages/feasibility-core/BASELINE-REPAIR-WORKFLOW.md`
- `20260403-080-copied-baseline-state-representation.md`
- `20260403-081-repair-attempt-compilation.md`
- `20260403-083-baseline-repair-vs-recurrence-priority-decision.md`

## What This Task Should Produce

Add the first code-level workflow types for copied baseline scheduling state.

## Desired Output Shape

Prefer changes centered in:

- `packages/feasibility-core/src/domain/types.ts`
- or a small workflow-layer type module if cleaner
- `packages/feasibility-core/src/index.ts`

## Scope

In scope:

- copied baseline assignment record type
- baseline delta record types
- workflow-layer baseline state container type

Out of scope:

- repair orchestration behavior
- attempt compilation behavior
- retention behavior
- solver changes

## Constraints

- keep baseline state outside ordinary concrete `DomainInput`
- keep this slice type-oriented
- do not mix hard locks and retention into one concept

## Acceptance Criteria

- copied baseline workflow types exist coherently
- they are clearly separate from ordinary solve input
- the package export surface exposes them coherently
- existing build/typecheck/tests still pass
