---
status: COMPLETE
owner: codex
---

# 20260403-049 Static Category-Theoretic Boundary Page

## Goal

Build a separate advanced companion page that explains the same feasibility boundary in abstract, category-theoretic terms.

## Purpose

Help advanced readers and machine-oriented consumers understand:

- the object/morphism view of domain input
- what compilation preserves
- what regrouping lifts back to domain language
- where the boundary is intentionally lossy

This page is not a replacement for the plain boundary guide.

## Scope

- static companion page only
- keep it separate from the plain boundary page
- preserve a high-level objects / morphisms / compile / solve / regroup view
- explain preserved structure, quotiented-away structure, and lossy points

## Constraints

- do not merge it into the plain boundary guide
- do not make the plain page worse
- do not add novelty for its own sake
- keep the abstraction readable and conservative

## Likely Location

- `apps/feasibility-playground/` as a static companion page reachable from docs surfaces

## Acceptance Criteria

- the new page is clearly separate from the plain boundary guide
- the same system boundary is explained at a more abstract level
- users can see what structure is preserved and what is lost at the boundary

## Verification

- `pnpm --filter feasibility-playground build`
- `pnpm --filter feasibility-playground test`
