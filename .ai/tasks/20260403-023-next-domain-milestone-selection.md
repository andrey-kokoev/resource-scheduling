# Task 20260403-023: Next Domain Milestone Selection

**Architectural Authority**: The current supported feature set, the realistic scenario validation from `016`, and the readiness evaluation from `020`.
**Constraint**: This task must choose the next domain-expansion milestone explicitly, not by drift.

## Objective

Select the next domain milestone after the current staffing-feasibility surface is stabilized.

This task should convert open-ended future expansion into one explicit next milestone with rationale.

## Candidate directions

- richer labor-pattern policy
- stronger calendar/timezone configuration
- more expressive coverage coupling
- multi-site or line-level domain structure
- cost / overtime layer after feasibility

## Deliverables

### Step 1: Review Current Supported Surface

- [ ] summarize what the package already models well
- [ ] summarize what it still does not model

### Step 2: Compare Candidate Milestones

- [ ] rank candidate directions by real-world value
- [ ] rank them by implementation risk
- [ ] rank them by abstraction pressure on the current kernel

### Step 3: Choose One Next Milestone

- [ ] define the chosen milestone
- [ ] state why it beats the alternatives now
- [ ] define what is explicitly *not* part of that milestone

## Acceptance Criteria

- [ ] the repo has one explicit next domain milestone
- [ ] future work is easier to prioritize
- [ ] milestone choice is grounded in current package reality

## Status

🟢 **COMPLETE** — 2026-04-03
