# Feasibility Playground

Thin browser evaluator for `feasibility-core`.
Primary local development uses Vite 8. The Cloudflare Worker boundary stays available as a supplementary deploy/check path.

If you want the boundary explanation first, open the [Input / Output Boundary Guide](./boundary.html).
If you want the abstract companion view, open the [Category-Theoretic Boundary](./category-theoretic-boundary.html).
If you want the package-facing overview, open the [Package Overview](./package-overview.html).
If you want the comparison matrix, open the [Feature Matrix](./feature-matrix.html).

## What It Is

- one editable JSON scenario
- a small built-in sample selector
- one sample plant topology
- one run button
- a concise scenario summary
- assignments or regrouped explanations

## Run

1. Start the playground:

```bash
pnpm --filter feasibility-playground dev
```

2. Open the URL printed by Vite, usually `http://127.0.0.1:5173`.

3. Run the browser E2E suite against the local Vite surface:

```bash
pnpm --filter feasibility-playground test:e2e
```

## Sample Plant

The built-in samples are:

- Base feasible staffing solve
- Availability conflict
- Qualification gap
- Shift-pattern conflict
- Rolling utilization max conflict
- Minimum rest conflict
- Consecutive-work limit conflict
- Coverage conflict
- Site-scoped coverage
- Line-aware coverage context

The base sample is coverage-free and covers:

- one site
- two lines
- multiple shifts
- qualifications and validity
- availability/time off
- minimum rest
- consecutive-work limits
- a pattern rule
- rolling utilization limits

Use the selector to swap the editor contents to one of these built-in cases, then run the evaluation flow unchanged.

## E2E Coverage

The Playwright suite exercises the sample scenarios end to end:

- base feasible sample
- availability conflict
- qualification gap
- shift-pattern conflict
- rolling utilization max conflict
- minimum rest conflict
- consecutive-work limit conflict
- coverage conflict
- site-scoped coverage
- line-aware coverage context

It runs against the local Vite dev target.

Worker deploy checks still run in the package build.

## Notes

- This is an evaluator, not a production scheduler.
- It uses the current `feasibility-core` package as the authority for compile, solve, and regroup behavior.
- Feasible runs show a compact assignment table.
- Infeasible runs center failed needs first, with a plain-language summary at the top of each card and supporting blockers underneath.
- Explanation types remain visible, but they are no longer the primary reading order.
