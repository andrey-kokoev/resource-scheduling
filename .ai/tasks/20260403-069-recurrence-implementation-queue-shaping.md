---
status: COMPLETE
owner: codex
---

# 20260403-069 Recurrence Implementation Queue Shaping

## Goal

Turn the recurrence PDA cluster into a clean next-step implementation queue without starting implementation.

## Inputs

- `061` recurring scheduling de-arbitrarization
- `062` recurrence as compilation boundary
- `063` recurrence exception semantics
- `064` recurring domain template model
- `065` recurrence expansion algorithm
- `066` recurrence expansion validation and failure semantics
- `067` recurring scheduling boundary proposal

## What This Task Should Produce

One clear implementation-oriented queue that answers:

- what the first actual coding task should be
- what order the next recurrence implementation tasks should land in
- what must remain out of scope for the first implementation slice

## Desired Output Shape

Prefer one orchestration artifact such as:

- `RECURRING-IMPLEMENTATION-QUEUE.md`

or a small set of follow-on task files if that is cleaner.

## Constraints

- do not implement recurrence
- do not reopen the settled boundary recommendation
- keep the queue aligned with the current concrete finite solver model
- separate domain-expansion work from solver work

## Acceptance Criteria

- the first recurrence implementation slice is explicit
- task ordering is justified and coherent
- out-of-scope items are called out clearly
- the queue is actionable enough to start assigning future work

## Worker Guidance

- optimize for sequencing and reduction of implementation risk
- do not let recurrence sprawl into optimization, preferences, or broader product UI
- make the first slice small and domain-side
