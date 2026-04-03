---
status: PLANNED
owner: unassigned
---

# 20260403-075 Recurring Person-Level Schedule Templates De-arbitrarization

## Goal

Separate recurring person-level scheduling intent from recurring shifts and recurring needs.

## Why This Task Exists

There is a live ambiguity between:

- recurring calendar structure
- recurring demand structure
- recurring schedules for specific candidates

Those are not the same problem.

If the actual user need is "people have stable shifts across the week", then recurring person-level schedule templates need their own boundary treatment rather than being smuggled in as recurring need attachment.

## What This Task Should Clarify

- what kind of thing a recurring person-level schedule template is
- whether it is:
  - a hard commitment
  - a seeded proposed assignment
  - a preference/pattern target
- whether it belongs:
  - before solving
  - inside solving
  - after solving as a validation layer
- how it relates to:
  - recurring shifts
  - recurring needs
  - candidate availability
  - utilization and rest rules

## Desired Output

One clear first-pass position on the problem boundary, including:

- primitive vs derived distinction
- where this sits relative to the current solver
- what should remain out of scope

## Constraints

- do not implement recurring person schedules
- do not assume it is just recurring need generation
- optimize for keeping the user problem real rather than abstractly general

## Acceptance Criteria

- a reader can distinguish recurring person schedules from recurring demand
- the likely solver/boundary implications are explicit
- the next follow-on task can be chosen without hiding the key ambiguity
