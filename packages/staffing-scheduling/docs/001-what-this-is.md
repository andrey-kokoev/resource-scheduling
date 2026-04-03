# Staffing Scheduling — What This Is

## 1. Core Definition

Staffing Scheduling is a **hard-constraint assignment system** for filling time-bounded staffing demand with qualified, available candidates.

It consists of:

- a **domain world**:
  - sites
  - lines
  - shifts
  - positions
  - needs
  - candidates
  - qualifications
  - availability
  - policy declarations
- a **compiled world**:
  - atomic demand units
  - agents
  - hard constraints
- a **solve result**:
  - a complete non-violating assignment set
  - or structured infeasibility output

This package is about **feasibility**, not optimization.

## 2. Primary Identity

The fundamental execution unit is:

```
(needId, ordinal)
```

materialized as one concrete `DemandUnit`.

If a need has `count = N`, the system derives `N` atomic demand units.

All solve-time assignment facts reference:

```
(agentId, demandUnitId)
```

There is no partial-fill success state in the current model.

## 3. Derived Structure

The important derived structure is:

```
demandUnits = expand(needs, shifts, positions, positionQualifications)
```

This is intentional:

- `Need` is a domain authoring object
- `DemandUnit` is the primitive solver object

The solver never reasons directly over `Need.count`.

## 4. Constraint System

The system is defined as hard constraints over candidate-to-demand assignment.

### 4.1 Candidate-local constraints

- exact-match qualification validity
- availability / time off
- shift-pattern compatibility
- minimum rest
- consecutive-work limits
- rolling utilization max

### 4.2 Global assignment constraints

- non-overlap for one candidate
- coverage coupling rules
- full coverage of all atomic demand units

### 4.3 Success condition

Success means:

- every demand unit is assigned
- every hard constraint is satisfied

There is no ranking among feasible schedules.

## 5. Mathematical Core

At the primitive layer, the package is:

> a finite hard-feasibility search over candidate assignments to atomic demand units under local and global constraints.

It is not:

- an optimizer
- a soft-constraint system
- a production-sequencing model

## 6. Separation of Concerns

The package is cleanly split into:

### A. Domain layer

- staffing-facing entities and rules

### B. Compiler layer

- expansion of needs into atomic demand units
- translation of staffing rules into primitive hard constraints

### C. Solver layer

- search for a complete non-violating assignment set

### D. Explanation layer

- regroup primitive failures back to staffing-facing explanations

## 7. What This Is Not

- not a workforce optimizer
- not a fairness engine
- not a preference system
- not a production scheduling engine
- not a machine / line sequencing engine

It is:

> a staffing-feasibility kernel for concrete shift-based coverage problems

## 8. Mental Model

The system can be viewed as:

> a compiler from staffing descriptions into atomic assignment constraints, followed by a feasibility search and a deterministic regrouping pass.
