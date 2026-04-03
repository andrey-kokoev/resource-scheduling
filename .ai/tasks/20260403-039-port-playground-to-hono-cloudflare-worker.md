# Task 20260403-039: Port Playground To Hono On Cloudflare Worker

**Architectural Authority**: The current local playground in `apps/feasibility-playground` and the judgment that the next step should be a deployable evaluator boundary rather than a long-term custom Node static server.
**Constraint**: This task must port the playground to a Cloudflare Worker + Hono shape without widening product scope or changing core package semantics.

## Objective

Move the current playground from:

- browser UI + local Node static server

to:

- browser UI + Hono on Cloudflare Worker

while preserving the current evaluator behavior and sample plant flow.

## Required Scope

### Preserve Current Playground Semantics

- [ ] same sample plant
- [ ] same evaluator flow:
  - [ ] `compileDomain`
  - [ ] `solve`
  - [ ] `buildRegroupingContext`
  - [ ] `regroupToDomainExplanations`
- [ ] same distinction between assignments and regrouped explanations

### Add Worker Boundary

- [ ] serve the playground through a Cloudflare-friendly app shape
- [ ] use `Hono` as the HTTP/app layer
- [ ] prefer a simple `/evaluate` route or equivalent explicit evaluation boundary

### Preserve Thin Evaluator Intent

- [ ] do not turn this into a production scheduler UI
- [ ] do not add persistence/auth/collaboration
- [ ] do not change the core `feasibility-core` package semantics

## Deliverables

### Step 1: Choose App Structure

- [ ] decide whether to replace the current local server or add a new deployable app beside it
- [ ] keep local dev ergonomics reasonable

### Step 2: Add Worker + Hono Integration

- [ ] create the Worker app shape
- [ ] wire evaluation endpoint(s)
- [ ] ensure the sample plant can still be run end-to-end

### Step 3: Adapt Playground UI

- [ ] point the playground to the Worker boundary
- [ ] keep the UI thin and evaluator-focused

### Step 4: Add Run/Deploy Instructions

- [ ] document local development
- [ ] document deployment shape
- [ ] document what remains intentionally local or out of scope

## Explicitly Out Of Scope

- [ ] new scheduling product features
- [ ] authentication
- [ ] persistence / saved scenarios
- [ ] optimization controls
- [ ] broad infrastructure redesign outside the playground app

## Acceptance Criteria

- [ ] the playground runs through Hono on a Cloudflare Worker shape
- [ ] the sample plant still works end-to-end
- [ ] evaluator behavior is preserved
- [ ] local developer workflow remains reasonable

## Status

🟡 **PLANNED / POST-PLAYGROUND** — 2026-04-03
