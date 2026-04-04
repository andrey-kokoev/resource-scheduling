---
status: COMPLETED
owner: kimi
completed_at: 2026-04-03
---

# 20260403-097 Batch-Flow API Boundary Follow-Up Clarifications

## Goal

Close the implementation-critical gaps left after completion of:

- [20260403-095-batch-flow-single-tenant-api-boundary-proposal.md](/home/andrey/src/resource-scheduling/.ai/tasks/20260403-095-batch-flow-single-tenant-api-boundary-proposal.md)

without reopening the high-level v1 direction.

This task is a clarification follow-up, not a replacement for `095`.

## Why This Exists

`095` established the main v1 boundary correctly:

- single service
- batch-flow only
- workspace as top-level resource
- one token per workspace
- saved vs draft semantics
- explicit solve/apply split

But review found several places where implementation could still drift because the proposal stopped at semantic intent rather than endpoint-grade precision.

## Gaps To Close

### 1. Compiled Projection Freshness

Clarify the full lifecycle of persisted compiled projections:

- whether `GET /workspaces/:id/compile` may return stale data
- how staleness is detected
- what metadata must be stored, such as:
  - `compiledAt`
  - `workspaceUpdatedAtAtCompile`
- whether the API returns:
  - projection only
  - projection plus freshness metadata
  - explicit stale/not-stale signal

### 2. Lifecycle Endpoints

Make the lifecycle endpoints concrete, not just semantic:

- workspace creation
- workspace deletion
- workspace token rotation
- admin list-workspaces
- admin health/inspection endpoints if any

Include:

- HTTP method
- path
- auth boundary
- request shape
- response shape

### 3. Draft Request Rules

Clarify exactly what a full draft workspace body may contain for:

- `POST /validate`
- `POST /compile`
- `POST /solve`

In particular:

- whether `currentSchedule` is allowed in a draft body
- whether it is ignored or rejected
- whether body `id` is allowed
- whether body `id` must match path `:id`
- whether missing fields mean full replacement or request invalidity

### 4. Stale Apply Semantics

Clarify the timestamp-based stale check chosen in `095`:

- timestamp precision requirements
- monotonicity requirements
- comparison rules
- required error payload on stale apply

The main question is how to make timestamp-only stale checking implementation-safe enough for D1/Worker use.

## Constraint

Do not reopen these decisions unless absolutely necessary:

- single-tenant v1
- workspace token boundary
- saved vs draft split
- apply only from successful saved-state solves
- no multitenancy in v1

This task is about precision, not direction.

## What This Task Should Produce

One concrete addendum artifact that supplements `095` with:

- endpoint table
- request/response shape rules
- freshness/staleness rules
- explicit draft-body validation rules

Prefer a markdown doc under `packages/batch-flow-scheduling/docs` or another durable design location.

## Acceptance Criteria

- `095` can remain completed without being rewritten
- lifecycle endpoints are explicit enough to implement directly
- persisted compile freshness semantics are explicit
- draft-body acceptance/rejection rules are explicit
- stale-apply behavior is explicit enough to implement without guesswork
