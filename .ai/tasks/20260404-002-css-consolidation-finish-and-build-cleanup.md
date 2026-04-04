---
status: COMPLETED
owner: kimi
completed_at: 2026-04-04
---

## Scope Clarification

**Narrow-scope finish chosen.** The shared shell applies to:
- Site landing page (`apps/resource-scheduling-site/index.html`)
- Staffing entry page (`apps/staffing-scheduling-playground/index.html`)
- Batch-flow entry page (`apps/batch-flow-scheduling-playground/index.html`)

**Not migrated:** Staffing secondary pages (docs.html, boundary.html, etc.) remain with their existing CSS. This is intentional to avoid scope creep. They can be migrated incrementally if needed.

# 20260404-002 CSS Consolidation Finish And Build Cleanup

## Goal

Finish the shared CSS consolidation work so it is:

- build-clean
- honestly scoped
- and not reliant on post-build copying to satisfy unresolved stylesheet references

## Why This Exists

The first CSS consolidation pass was directionally correct:

- shared stylesheet introduced
- main site/staffing/batch-flow entry pages migrated
- shared shell primitives consolidated

But it is not fully finished yet.

## Current Problems

### 1. Vite Build Warning

Both playground builds currently warn:

- `../shared.css doesn't exist at build time, it will remain unchanged to be resolved at runtime`

That means the shared stylesheet is not part of the actual build graph in a clean way.

### 2. Runtime Copy Instead Of Build-Native Resolution

The current setup copies `shared.css` into `dist` after build.

That is functional, but not the cleanest boundary for a shared stylesheet that should be a first-class input to the built app.

### 3. Consolidation Scope Was Overstated

The first pass migrated the main entry pages only, not the whole staffing secondary-page surface.

So the repo should either:

- finish that broader migration
or
- explicitly keep the narrower scope and stop claiming full consolidation

## What This Task Should Do

### Build-Clean Shared Stylesheet

Make the shared stylesheet a clean build input for:

- `apps/staffing-scheduling-playground`
- `apps/batch-flow-scheduling-playground`
- `apps/resource-scheduling-site`

Acceptable solutions include:

- moving shared CSS to a stable path each app can resolve at build time
- using Vite-supported public/static asset handling
- or another clean shared-asset pattern

But the final result should remove the current unresolved stylesheet warning.

### Clarify Or Finish Scope

Choose one and make it explicit:

1. **Narrow-scope finish**
   - shared shell applies to:
     - site landing page
     - staffing entry page
     - batch-flow entry page
   - task/docs should state that clearly

2. **Broader finish**
   - also migrate staffing secondary pages into the shared shell stylesheet

Do not leave this ambiguous.

## Constraints

- preserve the current shared-shell direction
- do not re-fragment CSS into per-page copies
- do not break current deployed relative-path behavior
- do not widen scope into a full design-system effort

## Deliverables

- build-clean shared CSS integration
- no unresolved shared stylesheet warnings in playground/site builds
- clarified migration scope
- optional additional page migrations if the broader finish path is chosen

## Acceptance Criteria

- `pnpm --filter staffing-scheduling-playground build` is clean
- `pnpm --filter batch-flow-scheduling-playground build` is clean
- `pnpm --filter resource-scheduling-site build` is clean
- shared CSS is treated as a real input, not just a post-build patch
- task/result language matches the actual migrated scope
