---
status: COMPLETE
owner: codex
---

# 20260403-055 Adopt Vite 8 For Playground

## Goal

Move `apps/feasibility-playground` onto Vite 8 as its dev/build surface.

## Why

The playground has outgrown the tiny custom Node static server.

Vite 8 is now stable and is a better fit for:

- local development
- static asset serving
- browser-friendly docs pages
- future deployment migration

## Scope

- adopt Vite 8 in `apps/feasibility-playground`
- replace the current custom local server as the primary dev surface
- preserve the current evaluator behavior and static pages
- keep local usage simple

## In Scope

- dev server
- production build
- static asset serving for:
  - playground page
  - boundary page
  - package overview page
  - examples overview page
  - feature matrix page
- script updates and minimal config

## Out Of Scope

- Cloudflare Worker deployment migration
- Hono integration
- product UI expansion
- semantic changes to `feasibility-core`

## Constraints

- keep the app thin
- do not change evaluator semantics
- preserve the current sample-selector and docs flow
- prefer a minimal Vite setup over framework sprawl

## Likely Files

- `apps/feasibility-playground/package.json`
- `apps/feasibility-playground/vite.config.*`
- `apps/feasibility-playground/index.html`
- `apps/feasibility-playground/` static pages as needed
- removal or de-emphasis of `server.mjs`

## Acceptance Criteria

- playground runs on Vite 8 for local development
- build output works for the playground and companion static pages
- existing playground tests still pass, or are updated appropriately
- docs/README reflect the new dev flow

## Verification

- `pnpm --filter feasibility-playground dev`
- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground test`
