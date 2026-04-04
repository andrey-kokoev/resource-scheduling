# Batch-Flow API Boundary Clarifications (Addendum to 004)

> Implementation-grade precision for v1 API boundary.

This document closes implementation-critical gaps left after the main v1 API boundary was established. It does not replace or reopen the direction in `004-api-boundary.md`.

---

## 1. Compiled Projection Freshness

### Lifecycle Rules

| Event | Compiled Projection State |
|-------|--------------------------|
| Workspace created | None (404 on GET) |
| `PUT /workspaces/:id` (saved state update) | **Invalidated** (deleted) |
| `PATCH /workspaces/:id` (commands applied) | **Invalidated** (deleted) |
| `POST /workspaces/:id/compile` (saved state) | Replaced with new output |
| `POST /workspaces/:id/compile` (draft) | Not persisted |
| `POST /workspaces/:id/solve` (saved state, success) | **Not changed** by solve |
| `POST /workspaces/:id/apply` | **Not changed** by apply |

### Stored Metadata

```sql
-- compiled_projections table includes:
--   compiled_at TEXT NOT NULL  -- ISO 8601 timestamp
--   workspace_updated_at TEXT NOT NULL  -- workspace.updatedAt at compile time
```

### GET /workspaces/:id/compile Response

```typescript
interface GetCompileResponse {
  // Projection data (from 004-api-boundary)
  concreteBatchSteps: ConcreteBatchStep[];
  solverGraph: SolverGraph;
  constraintModel: ConstraintModel;
  
  // Freshness metadata (always included)
  freshness: {
    compiledAt: string;           // ISO 8601
    workspaceUpdatedAt: string;   // workspace.updatedAt snapshot
    isFresh: boolean;             // workspaceUpdatedAt === current workspace.updatedAt
  };
}
```

### Staleness Behavior

- `GET /workspaces/:id/compile` **never** auto-recompiles
- `isFresh: false` indicates the projection does not reflect current workspace state
- Clients should call `POST /workspaces/:id/compile` to refresh if stale

### Error: No Compiled Projection

```json
{
  "error": {
    "code": "COMPILE_NOT_FOUND",
    "message": "No compiled projection exists for this workspace. Run POST /workspaces/:id/compile first."
  }
}
```

HTTP Status: `404 Not Found`

---

## 2. Lifecycle Endpoints

### Endpoint Table

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/workspaces` | Anonymous (v1) | Create workspace |
| `DELETE` | `/workspaces/:id` | Workspace token | Delete workspace |
| `POST` | `/workspaces/:id/token/rotate` | Workspace token | Rotate token |
| `GET` | `/admin/workspaces` | Admin token | List workspaces |
| `GET` | `/admin/workspaces/:id` | Admin token | Inspect workspace |
| `DELETE` | `/admin/workspaces/:id` | Admin token | Force delete |
| `GET` | `/health` | None | Service health |

### POST /workspaces (Create)

**Request:** No body required (empty object accepted)

```json
{}
```

Optional body (v1 extension):
```json
{
  "initialDocument": { /* partial workspace document */ }
}
```

**Response:** `201 Created`
```json
{
  "workspace": {
    "id": "ws_abc123",
    "createdAt": "2026-04-03T14:30:00Z",
    "updatedAt": "2026-04-03T14:30:00Z",
    "document": {
      "processorTypes": [],
      "processorInstances": [],
      "batchTypes": [],
      "batches": [],
      "changeoverRules": []
    }
  },
  "token": "bfs_wstok_xxx_yyyy_zzzz"  // Full token, shown once
}
```

**Important:** The token is returned **only at creation**. It cannot be retrieved later.

### DELETE /workspaces/:id

**Auth:** Bearer token for the specific workspace

**Response:** `204 No Content`

**Error:** `403 Forbidden` if token does not match workspace

### POST /workspaces/:id/token/rotate

**Auth:** Current valid workspace token

**Response:** `200 OK`
```json
{
  "token": "bfs_wstok_new_xxx_yyyy"  // New token, shown once
}
```

**Semantics:**
- Old token invalidated immediately
- New token returned in response
- All subsequent requests must use new token

### Admin Endpoints

All admin endpoints require an `Authorization: Bearer <admin-token>` header.

#### GET /admin/workspaces

**Response:** `200 OK`
```json
{
  "workspaces": [
    {
      "id": "ws_abc123",
      "createdAt": "2026-04-03T14:30:00Z",
      "updatedAt": "2026-04-03T15:00:00Z",
      "documentSummary": {
        "processorTypeCount": 3,
        "processorInstanceCount": 5,
        "batchTypeCount": 2,
        "batchCount": 10,
        "hasSchedule": true
      }
    }
  ],
  "count": 1
}
```

Note: Document content is NOT returned in list view.

#### GET /admin/workspaces/:id

**Response:** Full workspace response (same as `GET /workspaces/:id`)

#### DELETE /admin/workspaces/:id

**Response:** `204 No Content`

Force-deletes any workspace regardless of token.

### GET /health

**Auth:** None

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-04-03T14:30:00Z"
}
```

---

## 3. Draft Request Rules

### Draft Body Schema

For `POST /validate`, `POST /compile`, `POST /solve` with draft mode:

```typescript
interface DraftRequestBody {
  draft: true;
  document: DraftWorkspaceDocument;
}

interface DraftWorkspaceDocument {
  // Required: Complete model state
  processorTypes: ProcessorType[];
  processorInstances: ProcessorInstance[];
  batchTypes: BatchType[];
  batches: Batch[];
  changeoverRules?: ChangeoverRule[];
  
  // Forbidden in draft body
  // schedule?: BatchSchedule;  // REJECTED
  
  // Forbidden in draft body  
  // id?: string;  // REJECTED - use path param
}
```

### Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| `draft` | Must be `true` | `400`, `code: INVALID_DRAFT_FLAG` |
| `document` | Required, must be object | `400`, `code: MISSING_DOCUMENT` |
| `document.id` | **Rejected** if present | `400`, `code: ID_IN_DRAFT_BODY` |
| `document.schedule` | **Rejected** if present | `400`, `code: SCHEDULE_IN_DRAFT_BODY` |
| `document.*` | Missing required fields → invalid | `422`, validation errors |

### Example: Invalid Draft (schedule included)

**Request:**
```json
{
  "draft": true,
  "document": {
    "processorTypes": [...],
    "schedule": { ... }  // ERROR
  }
}
```

**Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "SCHEDULE_IN_DRAFT_BODY",
    "message": "Draft document cannot include 'schedule'. Schedule is output-only."
  }
}
```

### Example: Invalid Draft (id included)

**Request:**
```json
{
  "draft": true,
  "document": {
    "id": "ws_custom",  // ERROR
    "processorTypes": [...]
  }
}
```

**Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "ID_IN_DRAFT_BODY",
    "message": "Draft document cannot include 'id'. Use path parameter for workspace identity."
  }
}
```

### Draft vs Saved State Behavior

| Aspect | Draft Request | Saved State (no body) |
|--------|--------------|----------------------|
| Source of truth | Request body | `GET /workspaces/:id` document |
| `schedule` allowed | **No** | N/A (already persisted) |
| `id` allowed | **No** | N/A |
| Persistence | None | Compile may persist, solve may create apply token |
| Apply token returned | **No** | Yes (on successful solve) |

---

## 4. Stale Apply Semantics

### Timestamp Requirements

**Storage:**
- Use millisecond-precision Unix timestamps (bigint) OR
- Use ISO 8601 strings with microsecond precision

**D1 Schema:**
```sql
-- Recommended: store as ISO 8601 with 3 decimal places (milliseconds)
updated_at TEXT NOT NULL  -- e.g., '2026-04-03T14:30:00.123Z'

-- Alternative: store as integer milliseconds since epoch
updated_at_ms INTEGER NOT NULL  -- e.g., 1743690600123
```

**Monotonicity:**
- Workspace `updatedAt` must be strictly increasing on every mutation
- Use `Date.now()` or `new Date().toISOString()` — never client-provided timestamps

### Apply Token Payload

```typescript
interface ApplyTokenPayload {
  workspaceId: string;
  issuedAt: string;              // ISO 8601
  expiresAt: string;             // ISO 8601, issuedAt + 15min
  workspaceUpdatedAt: string;    // Snapshot at solve time
  solution: BatchFlowSolution;
}
```

### Stale Detection Algorithm

```javascript
function isStaleApply(token, currentWorkspace) {
  // Check 1: Token expired?
  if (new Date(token.expiresAt) < new Date()) {
    return { stale: true, reason: 'TOKEN_EXPIRED' };
  }
  
  // Check 2: Workspace changed since solve?
  if (token.workspaceUpdatedAt !== currentWorkspace.updatedAt) {
    return { stale: true, reason: 'WORKSPACE_MODIFIED' };
  }
  
  return { stale: false };
}
```

### Stale Apply Error Response

**Case: Token Expired (`410 Gone`)**
```json
{
  "error": {
    "code": "APPLY_TOKEN_EXPIRED",
    "message": "Apply token has expired. Solve again to obtain a fresh token.",
    "details": {
      "issuedAt": "2026-04-03T14:30:00Z",
      "expiresAt": "2026-04-03T14:45:00Z",
      "now": "2026-04-03T14:50:00Z"
    }
  }
}
```

**Case: Workspace Modified (`409 Conflict`)**
```json
{
  "error": {
    "code": "APPLY_TOKEN_STALE",
    "message": "Workspace has been modified since this solve. Solve again to apply current state.",
    "details": {
      "workspaceUpdatedAtSolveTime": "2026-04-03T14:30:00.123Z",
      "workspaceUpdatedAtNow": "2026-04-03T14:32:00.456Z"
    }
  }
}
```

### Success Flow

```
POST /workspaces/:id/solve (saved state)
  ↓
Token issued with workspaceUpdatedAt = "2026-04-03T14:30:00.123Z"
  ↓
POST /workspaces/:id/apply { "applyToken": "..." }
  ↓
Check: current workspace.updatedAt === "2026-04-03T14:30:00.123Z"
  ↓
Match → Apply succeeds, workspace.updatedAt updated to new timestamp
```

### Concurrency Scenario

| Time | Action | workspace.updatedAt |
|------|--------|---------------------|
| T1 | User A solves | T1 |
| T2 | User B saves workspace | T2 |
| T3 | User A tries apply | T2 ≠ T1 → **409 Conflict** |

---

## Summary Table: Quick Reference

| Concern | Rule |
|--------|------|
| Compiled freshness | Manual refresh, explicit `isFresh` flag |
| Draft body contents | Model only, no `id`, no `schedule` |
| Token rotation | Immediate invalidation, new token returned |
| Apply staleness | Timestamp equality check, 15min TTL |
| Timestamp precision | Millisecond, server-generated only |
| Workspace creation | Anonymous in v1, token returned once |

---

## Error Code Reference

| Code | HTTP | Context |
|------|------|---------|
| `COMPILE_NOT_FOUND` | 404 | GET /compile with no prior compile |
| `INVALID_DRAFT_FLAG` | 400 | draft !== true |
| `MISSING_DOCUMENT` | 400 | draft request without document |
| `ID_IN_DRAFT_BODY` | 400 | document.id provided |
| `SCHEDULE_IN_DRAFT_BODY` | 400 | document.schedule provided |
| `APPLY_TOKEN_EXPIRED` | 410 | Token past expiry |
| `APPLY_TOKEN_STALE` | 409 | Workspace changed since solve |
| `APPLY_TOKEN_INVALID` | 400 | Malformed or unknown token |
