---
status: COMPLETED
owner: kimi
completed_at: 2026-04-03
---

# 20260403-095 Batch-Flow Single-Tenant API Boundary Proposal

## Goal

Turn the de-arbitrarized chat decisions into one concrete v1 API boundary for a headless `batch-flow-scheduling` service.

This task is intentionally **not** “multitenant API design.”

The current recommended direction is:

- single service
- single-product domain (`batch-flow-scheduling`)
- per-workspace token auth
- no user model
- one current workspace state
- one current applied schedule

## Why This Exists

The original question started as “multitenant server API for batch-flow,” but that introduced too many arbitrary choices too early:

- tenant meaning
- tenant/project/workspace hierarchy
- user model
- token model
- persistence model
- save vs draft semantics
- apply semantics

The conversation converged on a simpler, more coherent v1:

- **drop multitenancy for now**
- use **workspace** as the top-level resource
- use **one token per workspace**
- let the service be a normal Cloudflare Worker + D1 app

## Current Recommendation

### 1. Product Boundary

- Batch-flow only in v1
- Not a shared cross-domain scheduling service yet
- Headless service, but shaped as if it could back a real product later

### 2. Security Boundary

- Workspace is the security boundary
- Each workspace gets its own bearer token at creation
- One workspace token authorizes exactly one workspace
- No list/search across workspaces with workspace tokens
- Client may keep an array of workspace tokens in local storage for switching, but that is a client concern only

### 3. Persistence Boundary

- Cloudflare Worker
- D1-backed persistence
- R2 only if later needed, not part of the v1 boundary
- One current workspace state
- One current applied schedule
- No history/version tables in v1

### 4. Workspace Boundary

Workspace is the top-level resource because it can hold:

- editable batch-flow model state
- current applied schedule

and avoids pretending the top-level resource is only:

- plant
- model
- schedule

## Recommended API Semantics

### Workspace

- `GET /workspaces/:id`
  - returns current workspace state
  - includes:
    - `id`
    - `createdAt`
    - `updatedAt`
    - current workspace document
- `PUT /workspaces/:id`
  - replaces editable model state only
  - rejects attempts to write derived schedule fields directly
- `PATCH /workspaces/:id`
  - accepts domain-specific command payloads only
  - no arbitrary JSON merge/patch in v1

### Validate / Compile / Solve

Use one consistent pattern:

- no body => operate on saved workspace state
- `draft: true` + full workspace document => operate on draft state only

Endpoints:

- `POST /workspaces/:id/validate`
- `POST /workspaces/:id/compile`
- `POST /workspaces/:id/solve`

### Compile

- `GET /workspaces/:id/compile`
  - returns persisted compiled projection only
- `POST /workspaces/:id/compile`
  - on saved state:
    - recompiles current workspace
    - overwrites persisted compiled projection
  - on draft state:
    - compiles draft only
    - does not persist

### Solve

- `POST /workspaces/:id/solve`
  - on saved state:
    - solves current workspace
    - returns solve result
    - returns apply token only on successful solve
  - on draft state:
    - solves draft only
    - returns result only
    - never returns apply token

### Apply

- `POST /workspaces/:id/apply`
  - accepts an apply token
  - applies only a successful solve that was produced from saved workspace state
  - rejects stale token if workspace changed since solve
  - on success:
    - replaces current applied schedule

## Recommended Data Shape

### Workspace document

The current workspace document should contain:

- editable model state
- current schedule

It should **not** inline:

- compiled projection
- solve result cache

### Normalized tables underneath

Recommended first cut:

- `workspaces`
- `processor_types`
- `processor_instances`
- `batch_types`
- `route_steps`
- `batches`
- `scheduled_batch_steps`
- `changeover_rules`
- `compiled_projections`
- `workspace_tokens`
- `apply_tokens`

## Recommended Token Semantics

### Workspace token

- issued on workspace creation
- bearer token
- scoped to one workspace only
- rotatable explicitly
- old token becomes invalid immediately on rotation

### Apply token

- returned only for successful saved-state solves
- single-use
- short-lived
- recommended default TTL: `15 minutes`
- stores enough data to verify:
  - `workspaceId`
  - `issuedAt`
  - `expiresAt`
  - workspace timestamp at issue
  - schedule payload or solve payload to apply

## Recommended Admin Surface

Workspace tokens should not enumerate workspaces.

If admin operations are needed, use a separate admin credential for:

- list workspaces
- inspect service health
- delete any workspace
- optionally create workspaces if anonymous create is later disabled

## Validation / Compile / Solve Boundary

### Validate

- explicit endpoint in v1
- returns:
  - `ok`
  - whole-workspace error list only
- no derived compile output

### Compile

- operates on editable model state only
- ignores current schedule in v1
- returns full compiled projection

### Solve

- also operates on editable model state only
- ignores current schedule in v1
- current schedule changes only through `apply`

## Explicit Non-Goals In V1

- multitenancy
- user accounts
- async solve jobs
- manual schedule editing
- schedule history/versioning
- arbitrary patch semantics
- shared staffing + batch-flow service boundary

## Open Defaults Chosen Here

These are the recommended defaults from the discussion:

- workspace is top-level resource
- save/load is primary workflow
- validate/compile/solve support both saved and draft state
- draft requests send full workspace documents
- apply is only for saved-state successful solves
- stale apply tokens return `409`
- whole-workspace validation errors only in v1

## What This Task Should Produce

One durable proposal artifact that can drive implementation.

Prefer one markdown doc under `packages/batch-flow-scheduling` or `apps/resource-scheduling-site` docs that captures:

- endpoint surface
- request/response conventions
- D1 schema draft
- token semantics
- explicit v1 non-goals

## Acceptance Criteria

- the v1 API boundary is concrete enough to implement without reopening product-shape questions
- multitenancy is explicitly demoted out of v1
- saved vs draft semantics are explicit and consistent across validate/compile/solve
- apply-token semantics are explicit
- workspace token semantics are explicit
- database table shape is concrete enough for first schema work
