---
status: PLANNED
owner: unassigned
---

# 20260403-059 Worker Port Path And Routing Reconciliation

## Goal

Make the Worker-port path coherent with the current playground/docs asset structure and navigation.

## Why

The current docs/playground pages now rely on a consistent path strategy.

The Worker port appears to serve assets from a different root assumption, which risks breaking:

- playground entry
- boundary/docs links
- companion static pages

## Scope

- decide the correct URL/path strategy for the Worker-served playground
- make asset serving and page links consistent with that strategy
- ensure docs pages and playground entry all resolve under the Worker boundary

## Constraints

- keep the user-facing docs/playground surface coherent
- do not introduce ad hoc path rules unless clearly justified

## Acceptance Criteria

- playground entry resolves
- boundary/docs pages resolve
- inter-page navigation works under the Worker port

## Verification

- local Worker dev flow resolves all pages cleanly
- relevant tests still pass
