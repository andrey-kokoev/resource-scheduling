# Availability Semantics

This document mirrors the availability slice currently implemented in `staffing-scheduling`.

## Purpose

Availability is a hard feasibility gate. It is not a preference system.

## Implemented Semantics

- `unavailable` intervals block overlapping demand intervals.
- explicit `available` intervals act as allow-lists when present for a candidate.
- if a candidate has no availability windows, availability does not constrain them.
- the full demand interval must be permitted for assignment.

## Timing

- availability is `prefix-checkable`
- candidate assignment rejection preserves explicit primitive witnesses

## Current Scope

Implemented in code:

- interval blocking
- allow-list behavior
- explanation regrouping into `availability-conflict`

Deferred for later if needed:

- richer day-specific or shift-type availability policy beyond the current hard gate
