# Staffing Scheduling — Solver Graph

## 1. Purpose

The solver graph is a **solver-facing projection** of the staffing domain.

It transforms:

- domain entities
- staffing rules

into:

- primitive agents
- atomic demand units
- hard constraints

This is the actual input to the feasibility search.

## 2. Primitive Node Definitions

### 2.1 Agent

Each agent represents one assignable candidate identity:

```
Agent {
  id
}
```

### 2.2 DemandUnit

Each node of demand is one atomic staffing obligation:

```
DemandUnit {
  id
  interval
  requiredCapabilities[]
  siteId?
  lineId?
  shiftFamilyId?
}
```

Demand units are derived from:

```
needs × count
```

## 3. Primitive Constraint Families

### 3.1 Non-overlap

For one agent, assigned demand intervals may not overlap.

### 3.2 Capability

The agent must have every required capability valid for the full interval.

### 3.3 Availability

The agent must be permitted to work the full demand interval.

### 3.4 Shift pattern

The agent must not violate compiled shift-pattern rules.

### 3.5 Minimum rest

Sequential assignments must satisfy required rest gaps.

### 3.6 Consecutive-work limits

Assigned intervals may not create a worked-day run beyond the allowed maximum.

### 3.7 Utilization

The agent may not exceed rolling-window assignment caps.

### 3.8 Coverage

The complete assignment set must satisfy coupled coverage rules.

## 4. Graph Construction

The graph is built in this order:

1. derive primitive agents from candidates
2. expand needs into atomic demand units
3. compile candidate capabilities
4. compile availability windows
5. compile pattern, rest, consecutive-day, coverage, and utilization constraints
6. package all of the above into `SolveInput`

## 5. Search Model

The solver then searches over assignment relations:

```
(agentId, demandUnitId)
```

At each step it checks:

- prefix-checkable constraints immediately
- completion-only constraints at whole-state validation time

## 6. Result Projection

The solve result is:

- feasible complete assignment set
- or infeasibility reasons

Those primitive reasons are then regrouped back into staffing-facing explanations.

## 7. What Is Intentionally Not In The Solver Graph

The solver graph does not directly encode:

- `Need`
- `Shift`
- `Position`
- `Site`
- `Line`
- recurrence templates
- baseline-repair orchestration
- optimization or preferences

These remain either:

- domain authoring constructs
- workflow-layer constructs
- regrouping metadata

## 8. Mental Model

The staffing solver graph is:

> a finite bipartite assignment space between agents and atomic demand units, filtered by hard local admissibility and validated by hard global constraints.
