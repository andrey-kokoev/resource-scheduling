# Batch-Flow Scheduling API Boundary (v1)

> Single-tenant, workspace-scoped, headless scheduling service.

## Overview

This document defines the v1 API boundary for the `batch-flow-scheduling` service.

**Key constraints:**
- Single-tenant (workspace-per-token, not user-per-tenant)
- No user model in v1
- One current workspace state, one current applied schedule
- Cloudflare Worker + D1 backed

## Table of Contents

1. [Authentication](#authentication)
2. [Workspace Resource](#workspace-resource)
3. [Validation / Compile / Solve](#validation--compile--solve)
4. [Apply Workflow](#apply-workflow)
5. [Error Handling](#error-handling)
6. [D1 Schema](#d1-schema)
7. [Explicit Non-Goals](#explicit-non-goals)

---

## Authentication

### Workspace Token

Each workspace has exactly one bearer token issued at creation.

```
Authorization: Bearer <workspace-token>
```

**Token semantics:**
- Scoped to exactly one workspace
- Rotatable via `POST /workspaces/:id/token/rotate`
- Old token invalidates immediately on rotation
- No list/search across workspaces with workspace tokens

### Admin Token (Optional)

For service administration only:

- `GET /admin/workspaces` — list workspaces
- `GET /admin/workspaces/:id` — inspect any workspace
- `DELETE /admin/workspaces/:id` — delete workspace

Admin token is a separate credential, not derivable from workspace tokens.

---

## Workspace Resource

The workspace is the top-level resource. It holds:

- Editable batch-flow model state
- Current applied schedule (if any)

### Data Shapes

#### Workspace Document (Request/Response Body)

```typescript
interface WorkspaceDocument {
  // Editable model state
  processorTypes: ProcessorType[];
  processorInstances: ProcessorInstance[];
  batchTypes: BatchType[];
  batches: Batch[];
  changeoverRules?: ChangeoverRule[];

  // Current schedule (output of last successful apply)
  schedule?: BatchSchedule;
}

// From existing types.ts
interface ProcessorType {
  id: string;
  name: string;
  description?: string;
}

interface ProcessorInstance {
  id: string;
  name: string;
  processorTypeId: string;
  lineId?: string;
  siteId?: string;
  metadata?: Record<string, string>;
}

interface RouteStepTemplate {
  id: string;
  sequence: number;
  name: string;
  processorTypeId: string;
  durationMs: number;
  maxLagMs?: number;
  description?: string;
}

interface BatchType {
  id: string;
  name: string;
  route: RouteStepTemplate[];
  description?: string;
}

interface Batch {
  id: string;
  batchTypeId: string;
  releaseTimeMs?: number;
  dueTimeMs?: number;
  lotId?: string;
  metadata?: Record<string, string>;
}

interface ChangeoverRule {
  id: string;
  processorTypeId: string;
  fromBatchTypeId: string;
  toBatchTypeId: string;
  minGapMs: number;
}

interface BatchSchedule {
  id: string;
  status: 'draft' | 'partial' | 'complete';
  scheduledSteps: ScheduledBatchStep[];
  notes?: string;
}

interface ScheduledBatchStep {
  id: string;
  batchId: string;
  routeStepTemplateId: string;
  processorInstanceId: string;
  startMs: number;
  endMs: number;
}
```

#### Workspace Response

```typescript
interface WorkspaceResponse {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  document: WorkspaceDocument;
}
```

### Endpoints

#### `GET /workspaces/:id`

Returns current workspace state.

**Response:** `200 OK`
```json
{
  "id": "ws_abc123",
  "createdAt": "2026-04-01T12:00:00Z",
  "updatedAt": "2026-04-03T09:30:00Z",
  "document": {
    "processorTypes": [...],
    "processorInstances": [...],
    "batchTypes": [...],
    "batches": [...],
    "changeoverRules": [...],
    "schedule": {
      "id": "sched_001",
      "status": "complete",
      "scheduledSteps": [...]
    }
  }
}
```

#### `PUT /workspaces/:id`

Replaces editable model state only. Rejects attempts to write `schedule` directly.

**Request:**
```json
{
  "processorTypes": [...],
  "processorInstances": [...],
  "batchTypes": [...],
  "batches": [...],
  "changeoverRules": [...]
}
```

**Response:** `200 OK` — full workspace response with updated document

**Errors:**
- `400 Bad Request` — attempt to set `schedule` field directly
- `422 Unprocessable Entity` — validation errors in domain model

#### `PATCH /workspaces/:id`

Accepts domain-specific command payloads only. No arbitrary JSON merge/patch.

**Supported commands:**

```typescript
type PatchCommand =
  | { op: 'addBatch'; batch: Batch }
  | { op: 'removeBatch'; batchId: string }
  | { op: 'updateBatch'; batchId: string; updates: Partial<Omit<Batch, 'id'>> }
  | { op: 'addProcessorInstance'; instance: ProcessorInstance }
  | { op: 'removeProcessorInstance'; instanceId: string }
  | { op: 'addBatchType'; batchType: BatchType }
  | { op: 'removeBatchType'; batchTypeId: string };
```

**Request:**
```json
{
  "commands": [
    { "op": "addBatch", "batch": { "id": "b3", "batchTypeId": "bt1", ... } }
  ]
}
```

**Response:** `200 OK` — full workspace response

---

## Validation / Compile / Solve

All three operations follow the same pattern:

- No body → operate on **saved workspace state**
- `draft: true` + full workspace document → operate on **draft state only**

### `POST /workspaces/:id/validate`

Validates the workspace document.

**Request body (optional):**
```json
{
  "draft": true,
  "document": {
    "processorTypes": [...],
    "processorInstances": [...],
    "batchTypes": [...],
    "batches": [...]
  }
}
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "errors": []
}
```

Or with errors:
```json
{
  "ok": false,
  "errors": [
    {
      "type": "unknown-reference",
      "id": "b1",
      "message": "Batch b1 references unknown batch type bt-unknown."
    }
  ]
}
```

### `POST /workspaces/:id/compile`

Compiles workspace to solver-ready form.

**Request body (optional):** Same as validate (draft mode supported)

**Response:** `200 OK`
```json
{
  "ok": true,
  "concreteBatchSteps": [...],
  "solverGraph": {
    "nodes": [...],
    "temporalEdges": [...],
    "machineCapacityGroups": [...],
    "transitionCosts": [...]
  },
  "constraintModel": {
    "variables": [...],
    "constraints": [...]
  }
}
```

On validation failure:
```json
{
  "ok": false,
  "errors": [...]
}
```

**Persistence behavior:**
- Saved state → persists compiled projection to `compiled_projections` table
- Draft state → does not persist

#### `GET /workspaces/:id/compile`

Returns the **persisted** compiled projection for the current workspace state.

**Response:** `200 OK` with same shape as POST success, or `404` if no compiled projection exists.

### `POST /workspaces/:id/solve`

Runs solver on workspace.

**Request body (optional):** Same as validate (draft mode supported)

**Response on saved state (success):** `200 OK`
```json
{
  "ok": true,
  "solution": {
    "scheduleId": "sched_new",
    "status": "complete",
    "scheduledSteps": [...],
    "machineTimelines": [...]
  },
  "applyToken": "apply_tok_xxx_yyy"  // Only for saved-state solves
}
```

**Response on draft state (success):** `200 OK`
```json
{
  "ok": true,
  "solution": { ... }
  // No applyToken for draft solves
}
```

**Response on infeasible:** `200 OK`
```json
{
  "ok": false,
  "infeasible": true,
  "message": "No feasible schedule exists with current constraints."
}
```

---

## Apply Workflow

Apply is a two-phase commit: solve-then-apply with an apply token.

### `POST /workspaces/:id/apply`

Applies a successful solve result to become the current schedule.

**Request:**
```json
{
  "applyToken": "apply_tok_xxx_yyy"
}
```

**Response:** `200 OK` — full workspace with new schedule

**Errors:**
- `400 Bad Request` — missing/invalid apply token
- `409 Conflict` — stale token (workspace changed since solve)
- `410 Gone` — token expired (default TTL: 15 minutes)

### Apply Token Semantics

```typescript
interface ApplyTokenPayload {
  workspaceId: string;
  issuedAt: string;      // ISO 8601
  expiresAt: string;     // ISO 8601
  workspaceUpdatedAt: string;  // Timestamp at issue time
  solution: BatchFlowSolution;
}
```

- **Single-use:** Token is deleted on successful apply
- **Short-lived:** Default TTL 15 minutes
- **Stale detection:** Rejected if `workspaceUpdatedAt` ≠ current workspace `updatedAt`

---

## Error Handling

### Standard Error Shape

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request (malformed JSON, invalid field write) |
| `401` | Missing or invalid authentication |
| `403` | Valid auth, but not authorized for this workspace |
| `404` | Resource not found |
| `409` | Conflict (stale apply token, concurrent modification) |
| `410` | Gone (expired apply token) |
| `422` | Validation error in domain model |
| `429` | Rate limited |
| `500` | Internal server error |

---

## D1 Schema

### Tables

```sql
-- Core workspace table
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,           -- ws_ prefix
    created_at TEXT NOT NULL,      -- ISO 8601
    updated_at TEXT NOT NULL,      -- ISO 8601
    document_json TEXT NOT NULL    -- Full workspace document (JSON)
);

-- Workspace token table (1:1 with workspaces in v1)
CREATE TABLE workspace_tokens (
    workspace_id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL,      -- SHA-256 of bearer token
    created_at TEXT NOT NULL,
    rotated_at TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Compiled projection (optional cache)
CREATE TABLE compiled_projections (
    workspace_id TEXT PRIMARY KEY,
    concrete_steps_json TEXT NOT NULL,
    solver_graph_json TEXT NOT NULL,
    constraint_model_json TEXT NOT NULL,
    compiled_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Apply tokens (short-lived, single-use)
CREATE TABLE apply_tokens (
    token_id TEXT PRIMARY KEY,     -- apply_tok_ prefix
    workspace_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,      -- SHA-256 of full token string
    payload_json TEXT NOT NULL,    -- ApplyTokenPayload
    issued_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    workspace_updated_at TEXT NOT NULL,  -- For stale detection
    used_at TEXT,                  -- NULL until consumed
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Index for token cleanup job
CREATE INDEX idx_apply_tokens_expires ON apply_tokens(expires_at);
```

### Normalized Entity Tables (Optional Future)

For larger workspaces, consider normalizing instead of storing full JSON:

```sql
-- Alternative: normalized entity tables
CREATE TABLE processor_types (
    workspace_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (workspace_id, id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE processor_instances (...);
CREATE TABLE batch_types (...);
CREATE TABLE route_steps (...);
CREATE TABLE batches (...);
CREATE TABLE changeover_rules (...);
CREATE TABLE scheduled_batch_steps (...);
```

**v1 recommendation:** Use JSON document storage for simplicity. Normalize only if workspace sizes warrant it.

---

## Explicit Non-Goals

The following are **explicitly out of scope** for v1:

| Feature | Status | Future Consideration |
|---------|--------|-------------------|
| Multitenancy | ❌ Not in v1 | Revisit if/when shared service needed |
| User accounts / identity | ❌ Not in v1 | Add when user-specific features needed |
| Async solve jobs | ❌ Not in v1 | For long-running solves only |
| Manual schedule editing | ❌ Not in v1 | Workflow: edit model → solve → apply |
| Schedule history / versioning | ❌ Not in v1 | Current schedule only |
| Arbitrary JSON Patch | ❌ Not in v1 | Domain-specific commands only |
| Shared staffing+batch service | ❌ Not in v1 | Separate services in v1 |
| R2 storage | ❌ Not in v1 | D1 only unless size requires |
| WebSocket real-time | ❌ Not in v1 | Polling acceptable for v1 |

---

## Summary

| Aspect | Choice |
|--------|--------|
| Top-level resource | Workspace |
| Auth | Bearer token per workspace |
| Persistence | Cloudflare Worker + D1 |
| Save/load | Primary workflow |
| Draft mode | Full document in request body |
| Validate/Compile/Solve | Support both saved and draft |
| Apply | Token-based, 15min TTL, single-use |
| Stale detection | Workspace timestamp comparison |

---

## Open Questions for Implementation

1. **Workspace creation:** Anonymous create with auto-generated token, or admin-only create?
2. **Rate limiting:** Per-token or per-IP? What limits for solve endpoint?
3. **Compiled projection:** Cache indefinitely or TTL? Regenerate on every PUT?
4. **Apply token cleanup:** Cron trigger or lazy delete on access?
5. **Max workspace size:** Document count limits to prevent D1 row size issues?
