---
status: COMPLETE
owner: codex
---

# 20260403-056 Remove Or Deprecate Legacy Server Fallback

## Goal

Clean up the legacy `server.mjs` fallback path now that Vite 8 is the playground’s primary dev/build surface.

## Why

The current repo surface still contains both:

- the new Vite 8 path
- the old custom static server path

That creates ambiguity unless the fallback is either:

- removed
- or explicitly marked deprecated and non-primary

## Scope

Choose one of:

1. remove `server.mjs` completely if it is no longer needed
2. keep it, but make its deprecated fallback status explicit in code and docs

## Constraints

- keep the playground’s current Vite flow unchanged
- do not change evaluator semantics
- prefer the simpler repo surface if there is no real reason to keep the fallback

## Likely Files

- `apps/feasibility-playground/server.mjs`
- `apps/feasibility-playground/README.md`
- `apps/feasibility-playground/package.json`

## Acceptance Criteria

- the repo no longer gives mixed signals about the primary dev path
- a user can tell immediately whether `server.mjs` is gone or explicitly deprecated

## Verification

- `pnpm --filter feasibility-playground dev`
- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground test`
