# Coverage Rules

This document mirrors the coverage-coupling slice currently implemented in `feasibility-core`.

## Purpose

Coverage rules are explicit hard global constraints over complete assignment sets.

## Implemented Semantics

- `require-qualification-on-shift`
- `require-position-on-shift`
- `require-support-when-dependent-staffed`
- `require-supervisor-presence`

## Timing

- coverage rules are `completion-only` in the current package boundary
- the solver backtracks when a complete assignment violates coverage
- the explanation surface stays flat through `coverage-conflict`

## Current Scope

Implemented in code:

- global coverage validation
- regrouping back to shifts, positions, and grouped demand facts
- explicit support and supervisor coupling witnesses
- site and line metadata may appear on regrouped `coverage-conflict` explanations when the domain input carries site-scoped or line-scoped facts

Deferred only if future work adds new coverage families:

- additional cross-position or cross-line staffing rules
