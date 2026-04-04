---
status: COMPLETED
owner: kimi
completed_at: 2026-04-04
---

# 20260404-001 CSS Consolidation Shared Site Shell

## Goal

Consolidate the fragmented app/page CSS into a shared top-level site stylesheet so the scheduling surfaces feel like one coherent site instead of adjacent handcrafted pages.

## Why This Exists

The current UX drift is visible in obvious places:

- `Staffing Scheduling Playground` and `Batch-Flow Scheduling Playground` headings do not look like they belong to the same product family
- top-level site, staffing, and batch-flow use different typography defaults
- shared structures like:
  - site bar
  - hero/header blocks
  - nav groups
  - cards
  - tables
  - pills
  are redefined per page/app instead of coming from one shared layer

This creates unnecessary divergence and makes future UX fixes more expensive.

## Recommended Direction

Use one **shared site stylesheet plus per-app accent overrides**.

Recommended model:

- one shared top-level stylesheet for:
  - typography
  - spacing
  - containers
  - site shell
  - cards/panels
  - buttons
  - tables
  - badges/pills
  - common responsive behavior
- per app/page CSS variables for:
  - accent color
  - background tones
  - secondary accent if needed
- local CSS only for domain-specific layouts

## What Should Move To Shared CSS

Move into the shared layer:

- `body`/base typography defaults
- container widths and outer spacing
- `.sitebar`, `.sitebar-inner`, `.sitebar-brand`, `.sitebar-nav`
- heading scale for top-level page titles
- breadcrumbs
- nav stack/group/label/button patterns
- card/panel primitives
- table primitives
- badge/pill primitives
- common callout/metric blocks
- common responsive breakpoints for page shell behavior

## What Should Stay Local

Keep local:

- staffing evaluator-specific layout
- batch-flow graph/timeline-specific layout
- domain-specific inspector or result-panel layouts
- any app-specific view mechanics that are not site-shell concerns

## Preferred Rollout Order

1. Extract shared stylesheet and tokens
2. Migrate:
   - `apps/resource-scheduling-site/index.html`
   - `apps/staffing-scheduling-playground/index.html`
   - `apps/batch-flow-scheduling-playground/index.html`
3. Migrate staffing secondary pages:
   - `docs.html`
   - `boundary.html`
   - `package-overview.html`
   - `examples-overview.html`
   - `feature-matrix.html`
   - `category-theoretic-boundary.html`
4. Only then consider deeper inner-surface consolidation

## Constraints

- do not flatten staffing and batch-flow into identical products
- do not move domain-specific layout code into the shared shell
- preserve the simpler two-card landing page
- preserve the simplified top bars:
  - `All surfaces`
  - sibling track

## Deliverables

- one shared stylesheet in a stable top-level location
- migrated main site/app entry pages using shared classes/tokens
- reduced duplicated CSS across the main surfaces
- explicit use of CSS variables for per-surface accent differences

## Acceptance Criteria

- main site, staffing, and batch-flow headings look like they belong to the same site family
- repeated shell/component CSS is no longer copy-pasted per page
- per-app visual distinction remains possible through variables, not divergent structure
- future UX changes to shared shell elements can be made in one place
