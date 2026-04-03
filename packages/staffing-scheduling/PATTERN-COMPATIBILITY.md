# Pattern Compatibility Semantics

This document mirrors the shift-pattern slice currently implemented in `staffing-scheduling`.

## Purpose

Shift-pattern compatibility is a hard constraint over assignments for one agent. It is not a heuristic.

Calendar classification uses the package's solve-wide host-local basis. Weekday/weekend rules classify the shift by its local start date, and overnight shifts remain overnight only for sequence logic.

## Implemented Semantics

- `weekday-only`
- `weekend-only`
- `no-night-to-day-turnaround`
- `fixed-shift-family`
- `non-rotating`

## Timing

- standalone day restrictions are `prefix-checkable`
- turnaround and relative pattern checks are enforced against existing assignments
- the explanation surface stays flat through `shift-pattern-conflict`

## Current Scope

Implemented in code:

- explicit compiled pattern rules
- validation during assignment search
- regrouping to candidate and shift facts

Deferred only if future work adds new pattern families:

- additional shift-pattern rule variants
