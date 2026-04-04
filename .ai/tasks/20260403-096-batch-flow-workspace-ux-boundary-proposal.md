---
status: COMPLETED
owner: kimi
completed_at: 2026-04-03
---

# 20260403-096 Batch-Flow Workspace UX Boundary Proposal

## Goal

Capture the current recommended target UX for one `batch-flow-scheduling` workspace before server/API and UI implementation drift apart.

This is the companion to:

- [20260403-095-batch-flow-single-tenant-api-boundary-proposal.md](/home/andrey/src/resource-scheduling/.ai/tasks/20260403-095-batch-flow-single-tenant-api-boundary-proposal.md)

## Why This Exists

The API boundary is becoming clearer, but the product UX inside one workspace was still ambiguous.

The key ambiguity was whether a workspace is centered on:

- model editing
- compile/graph inspection
- schedule generation
- schedule repair/update

The current recommendation is to center the UX on:

- current applied schedule
- draft edits
- schedule impact preview
- explicit apply

not on compile as a primary user-facing object.

## Current Recommendation

### 1. What A Workspace Is

A workspace should be treated as one combined object containing:

- factory setup
- work to do
- current applied schedule

It should not feel like:

- a pure model editor
- a pure graph viewer
- a pure schedule artifact

### 2. Primary User Reason To Open A Workspace

The default assumption should be:

- the user is updating or repairing a current schedule after something changed

That is a stronger primary anchor than:

- editing a model in the abstract
- reading raw graph/constraint output

### 3. Primary State

The current applied schedule should feel more primary than the editable model state.

That does **not** mean the model is hidden.

It means:

- schedule is the main frame of reference
- edits are interpreted in terms of expected schedule consequences

### 4. Workspace Layout

Recommended default:

- one workspace screen
- persistent schedule views
- contextual inspector editing

Not recommended as the primary model:

- separate full-screen editor modes
- compile-first workflow
- graph-first workflow

### 5. Main Views

Both of these should stay present together:

- machine timeline view
- batch / route view

Neither should dominate completely.

Recommended layout:

- balanced split
- both visible in the main workspace
- inspector beside or overlaid next to them

### 6. Editing Model

Editing should happen mainly through:

- clicking machines
- clicking batches
- clicking route steps
- opening a side inspector

Not primarily through:

- large standalone forms
- full-page editor navigation
- raw table CRUD as the main UX

### 7. Draft Model

Edits should create or update a draft state inside the workspace.

Recommended semantics:

- current applied schedule remains visible
- draft differs from current saved state until solved/applied
- user should be able to understand “current vs draft”

### 8. Validation

Validation should be:

- inline
- attached to the draft
- visible as an issue list / gate

It should **not** be a separate product mode in normal UX.

If draft is invalid:

- keep current schedule visible
- show issues inline
- disable solve/apply

### 9. Compile

Compile should be a secondary diagnostic surface.

It should not be the main user path.

Recommended role:

- available for inspection
- useful for debugging or advanced users
- not a primary CTA

### 10. Solve / Preview

The normal user loop should optimize for:

- edit draft
- preview schedule impact
- solve
- apply

not:

- edit
- compile
- inspect graph
- manually reason forward from internal projections

### 11. Apply

Apply should be explicit.

Recommended semantics:

- solve result is preview first
- current applied schedule does not change until apply
- after apply, current schedule becomes the new visible baseline

### 12. Default User Loop

Recommended loop:

1. inspect current schedule
2. edit draft through contextual inspectors
3. see inline validation status
4. preview/solve
5. compare preview against current schedule
6. apply if acceptable

### 13. Information Priority

Highest priority information in normal UX:

- current schedule
- draft validity
- expected schedule impact

Lower priority:

- compiled projection
- solver graph
- raw constraint model

Advanced diagnostics can exist, but they should be subordinate.

## Explicit Non-Goals For The Primary UX

The primary workspace UX should **not** be centered on:

- raw graph browsing
- raw constraint inspection
- entity CRUD tables as the main interaction model
- full-page wizard flows
- implicit auto-apply scheduling

## What This Task Should Produce

One durable proposal artifact that can guide:

- workspace shell design
- inspector design
- draft/current state model
- solve/apply interaction model
- later API/UI integration

Prefer one markdown doc that captures:

- main workspace layout
- main user loop
- draft/current/apply semantics
- validation/compile/solve roles
- advanced-diagnostics placement

## Acceptance Criteria

- workspace UX is concrete enough to guide implementation
- compile is explicitly demoted from primary UX
- current schedule vs draft is explicitly modeled
- solve preview vs apply is explicit
- machine and batch views are both preserved in the main workspace
