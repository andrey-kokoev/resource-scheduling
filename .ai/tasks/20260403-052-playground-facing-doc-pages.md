---
status: COMPLETE
owner: codex
---

# 20260403-052 Playground-Facing Doc Pages

## Goal

Replace raw markdown links from the playground/boundary surface with readable playground-facing doc pages.

## Why

Clicking package doc links from the playground currently triggers raw `.md` file download behavior instead of opening readable docs in the browser.

That is the wrong experience for a user trying to understand the system boundary.

## Scope

- add one or more readable static HTML doc pages reachable from the playground/boundary pages
- update links so users land on readable content rather than raw markdown files
- keep the docs surface thin and focused on evaluator/consumer comprehension

## Recommended First Slice

- package overview page
- optionally examples or explanation overview if needed

The boundary page should link to these HTML pages, not directly to `.md`.

## Constraints

- do not build a full docs platform
- do not add a generic markdown rendering system unless clearly necessary
- prefer a few intentional static pages over a broad doc-browser feature
- keep markdown as source-of-truth if that is still convenient, but optimize the playground-facing experience

## Likely Files

- `apps/feasibility-playground/boundary.html`
- new static HTML doc page(s) under `apps/feasibility-playground/`
- `apps/feasibility-playground/README.md`

## Acceptance Criteria

- a playground user can click from boundary/playground pages into readable docs
- clicking docs links no longer downloads raw markdown
- the doc pages help users understand the package at a high level

## Verification

- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground typecheck`
- `pnpm --filter feasibility-playground test`
