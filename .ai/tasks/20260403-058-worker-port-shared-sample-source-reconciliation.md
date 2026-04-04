---
status: COMPLETED
owner: kimi
completed_at: 2026-04-03
---

# 20260403-058 Worker Port Shared Sample Source Reconciliation

## Goal

Make the Worker-port path consume the same shared runtime sample source as the playground and tests, instead of duplicating the sample catalog inside the app.

## Why

The in-progress Worker port reintroduced a second copy of the sample library under the app.

That breaks the shared-fixture boundary we just established and risks drift between:

- playground behavior
- shared fixture tests
- sample semantics tests

## Scope

- remove duplicated sample-catalog logic from the Worker-port path
- consume the shared runtime sample source instead
- preserve current playground behavior

## Constraints

- do not widen solver semantics
- do not duplicate large scenario objects
- keep the sample catalog single-sourced

## Acceptance Criteria

- Worker-port code and playground runtime use the same shared sample source
- sample behavior does not drift between app and tests

## Verification

- app build/test still pass
- shared sample tests still pass
