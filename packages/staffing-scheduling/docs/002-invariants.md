# Staffing Scheduling — Invariants

## 1. Identity Invariants

### 1.1 Agent identity is canonical

Primitive assignment supply is keyed by:

```
agentId
```

No duplicate primitive agent identities may exist inside one solve.

### 1.2 Demand unit identity is canonical

Primitive demand identity is:

```
demandUnitId
```

derived deterministically from one `Need` plus an ordinal.

### 1.3 Assignment identity is relational

An assignment is valid only as:

```
(agentId, demandUnitId)
```

There is no independent schedule-fact identity required by the primitive solver.

## 2. Derivation Invariants

### 2.1 Need expansion is total over count

For every need:

```
need.count = N  =>  exactly N demand units
```

Implications:

- no missing demand units
- no extra demand units
- each demand unit inherits the need’s interval and required capability set

### 2.2 Domain metadata remains metadata

Site and line facts may be carried for regrouping, but they do not become primitive solver families.

## 3. Structural Invariants

### 3.1 Interval validity

For every primitive interval:

```
start < end
```

and intervals use half-open semantics:

```
[start, end)
```

### 3.2 Reference integrity

All compiled references must resolve:

- demand unit -> source shift exists
- demand unit -> source position exists
- assignment -> agent exists
- assignment -> demand unit exists

### 3.3 Capability validity is full-interval

A qualification only satisfies a demand unit if it covers the whole demand interval.

## 4. Assignment Invariants

### 4.1 Atomicity

Each demand unit requires exactly one assigned agent for success.

### 4.2 Non-overlap

One agent may not hold overlapping assigned intervals.

### 4.3 Hard admissibility

Assignment validity is jointly constrained by:

- capability
- availability
- shift pattern
- rest
- consecutive-work limits
- utilization max

## 5. Solve Result Invariants

### 5.1 Feasible means complete

If the result is feasible, then:

- every demand unit is assigned
- every hard constraint is satisfied

### 5.2 Infeasible means no complete assignment exists

The solver does not return:

- partial success
- best effort
- ranked alternatives

## 6. Explanation Invariants

### 6.1 Primitive reasons are deterministic

Primitive infeasibility reasons are normalized and sorted deterministically.

### 6.2 Regrouping preserves staffing relevance

Regrouping may collapse primitive details, but it must preserve:

- failed need identity
- relevant candidate blockers
- site / line metadata when carried by the domain input

### 6.3 Site and line stay domain-side

Site and line are explanation and regrouping metadata, not primitive witness types.

## 7. Workflow Invariants

### 7.1 Recurrence stays outside the primitive solver

Recurring authoring constructs are not solver-native. They must expand into finite concrete input before solving.

### 7.2 Baseline repair stays outside the primitive solver

Baseline copying, hard locks, retention, and repair orchestration are workflow-layer concerns wrapped around the inner feasibility solver.

## 8. Non-Arbitrariness

The package is designed to avoid:

- duplicate representations of the same scheduling fact
- hidden optimization semantics
- implicit partial-fill success
- solver-visible site / line abstractions that are only domain grouping concepts
