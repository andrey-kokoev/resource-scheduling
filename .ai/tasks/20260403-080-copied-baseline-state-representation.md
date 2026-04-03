---
status: PLANNED
owner: unassigned
---

# 20260403-080 Copied Baseline State Representation

## Goal

Clarify the concrete input representation for a copied baseline schedule before repair orchestration runs.

## Why This Task Exists

The repair workflow now has a staged shape, but it still needs a concrete state model describing:

- what came from the baseline
- what is truly locked
- what is only preferred for retention
- what has changed
- what remains open

Without that, repair orchestration stays conceptual.

## What This Task Should Clarify

- how copied baseline assignments are represented
- how hard locks are represented
- how retention-tagged assignments are represented
- how deltas are represented:
  - removed assignments
  - added needs
  - changed shifts
  - changed availability
- whether the baseline state is:
  - an enriched domain input
  - a separate workflow-layer object that compiles into concrete solve attempts

## Desired Output

One clear first-pass position on:

- baseline state object shape
- relation to ordinary concrete `DomainInput`
- what data survives into each repair attempt

## Constraints

- do not implement baseline state handling
- optimize for practical schedule repair workflow
- keep concrete solver input separate from workflow enrichment unless strongly justified

## Acceptance Criteria

- a reader can understand what the copied baseline state contains
- the relationship between baseline state and ordinary solve input is explicit
- the next implementation slice can be chosen without hidden modeling gaps

## First Pass Position

### 1. Baseline state should be a separate workflow-layer object

First-pass recommendation:

- do **not** enrich ordinary `DomainInput` with baseline/repair fields
- represent copied baseline state as a separate workflow-layer object
- compile that object into ordinary concrete solve attempts

This keeps the core scheduling domain concrete and solver-oriented.

### 2. What the baseline state contains

The copied baseline state should contain at least:

- the concrete target schedule context:
  - shifts
  - needs
  - candidate availability
- copied baseline assignments
- hard lock markings
- retention-tagged baseline assignments
- concrete deltas:
  - removed assignments
  - added or removed needs
  - changed shifts
  - changed availability
- derived open gaps

### 3. Why it should stay outside `DomainInput`

`DomainInput` currently means:

- the concrete scheduling problem to solve

Baseline repair state means:

- how we got to that problem
- what we are trying to preserve
- what was copied
- what changed

That is workflow/orchestration information, not primitive solve input.

### 4. Relationship to repair orchestration

The likely flow is:

1. build copied baseline state
2. apply concrete deltas
3. derive hard locks and retention candidates
4. compile one repair attempt into ordinary concrete solve input
5. run the solver
6. relax retention and repeat if needed

So baseline state is the source object for repeated attempt compilation.

### 5. First-pass representation direction

The baseline state should likely be organized around:

- copied assignment records
- lock annotations
- retention annotations
- delta records
- target schedule context

rather than around recurrence or abstract templates.

### 6. Current recommendation

Treat copied baseline state as a **workflow-layer object that compiles into ordinary concrete solve attempts**.

That keeps:

- the solver clean
- repair orchestration explicit
- copied-baseline semantics visible without polluting core domain input
