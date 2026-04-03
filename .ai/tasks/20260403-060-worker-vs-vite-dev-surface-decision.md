---
status: PLANNED
owner: unassigned
---

# 20260403-060 Worker Vs Vite Dev Surface Decision

## Goal

Make an explicit decision about whether the Worker path replaces the Vite-based local workflow or supplements it.

## Why

The current in-progress Worker port changes the primary local dev/build commands, but we recently stabilized Vite 8 as the primary playground surface.

That is a product/developer-experience decision and should not be left implicit.

## Scope

- choose one of:
  - Worker replaces Vite as the primary local surface
  - Worker supplements Vite as a separate deployment/deploy-local path
- align scripts and docs to the chosen model

## Constraints

- make the decision explicit
- avoid mixed signals in package scripts and README

## Acceptance Criteria

- package scripts clearly reflect one coherent local workflow model
- README/docs match that model

## Verification

- the chosen local workflow works as documented
