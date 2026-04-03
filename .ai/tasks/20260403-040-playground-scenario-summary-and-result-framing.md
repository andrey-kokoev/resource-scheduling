# Task 20260403-040: Playground Scenario Summary And Result Framing

**Architectural Authority**: The completed playground in `apps/feasibility-playground` and the first real evaluator use, which confirmed the sample runs end to end but exposed that the result view is still too raw.
**Constraint**: This task must improve evaluator clarity without turning the playground into a production scheduling UI.

## Objective

Improve the playground’s first-run readability by adding:

- a concise scenario summary
- clearer result framing for feasible runs
- better explanation-oriented structure for infeasible runs

This is the first concrete iteration under task `20260403-038`.

## Deliverables

### Step 1: Add Scenario Summary

- [x] summarize sites, lines, shifts, needs, candidates
- [x] summarize active rule families present in the loaded scenario
- [x] keep the summary compact and evaluative

### Step 2: Improve Feasible Result Framing

- [x] make the assignment table easier to scan
- [x] add enough context to explain why the result is meaningful
- [x] avoid turning the output into a full scheduling dashboard

### Step 3: Improve Infeasible Result Framing

- [x] replace raw-feeling explanation output with clearer grouped presentation
- [x] keep regrouped explanations truthful and visible
- [x] preserve the evaluator character of the UI

### Step 4: Keep Sample Plant Central

- [x] ensure the default sample is still the clearest first-run path
- [x] avoid adding more samples unless necessary

## Acceptance Criteria

- [x] a first-time user can understand what the sample contains before reading JSON
- [x] feasible output is easier to interpret
- [x] infeasible output is less raw and more evaluative
- [x] the playground remains thin and non-productized

## Status

🟢 **COMPLETE** — 2026-04-03
