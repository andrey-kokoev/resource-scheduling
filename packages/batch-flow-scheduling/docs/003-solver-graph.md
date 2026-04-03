# Batch Flow Scheduling — Solver Graph

## 1. Purpose

The solver graph is a **solver-neutral projection** of the domain model.

It transforms:

- domain entities
- constraints

into:

- nodes
- temporal edges
- machine eligibility
- machine transition costs

This is the input to CP-SAT, MILP, or heuristic solvers.

---

## 2. Node Definition

Each node represents a **concrete batch step**:

```
nodeId = (batchId, routeStepTemplateId)
```

---

### 2.1 Node structure

```
SolverNode {
  id
  batchId
  routeStepTemplateId
  durationMs
  requiredProcessorTypeId
  eligibleMachineIds[]
  releaseTimeMs?
  dueTimeMs?
}
```

---

## 3. Temporal Edges (Batch-Local)

Edges encode constraints between nodes.

```
BatchTemporalEdge {
  fromNodeId
  toNodeId
  minGapMs
  maxGapMs?
}
```

---

### 3.1 Semantics

```
start(to) - end(from) ∈ [minGap, maxGap]
```

---

### 3.2 Sources

Derived from:

- route adjacency → minGap = 0
- max lag constraint → maxGap
- no-wait → [0,0]

---

## 4. Machine Eligibility

Defines allowed assignments.

```
MachineEligibility {
  nodeId
  machineId
}
```

---

### 4.1 Constraint

```
∀ node: exactly one machine must be selected
```

---

## 5. Machine Transition Costs

Represents sequence-dependent changeovers.

```
MachineTransitionCost {
  machineId
  fromNodeId
  toNodeId
  minGapMs
}
```

---

### 5.1 Semantics

If node A is immediately before B on machine m:

```
start(B) ≥ end(A) + minGapMs
```

---

## 6. Machine Capacity Constraint

For each machine:

- assigned nodes must not overlap
- ordering is a decision variable

---

## 7. Variable Model (Abstract)

For each node:

```
start[node]
end[node]
```

For each (node, machine):

```
x[node, machine] ∈ {0,1}
```

---

### 7.1 Constraints

#### Duration
```
end = start + duration
```

#### Assignment
```
Σ x[node,m] = 1
```

#### Eligibility
```
x[node,m] = 0 if m not eligible
```

---

## 8. Constraint Mapping

| Domain constraint | Solver graph |
|------------------|-------------|
| precedence       | BatchTemporalEdge [0,∞) |
| max lag          | BatchTemporalEdge upper bound |
| changeover       | MachineTransitionCost |
| capacity         | no-overlap per machine |
| eligibility      | MachineEligibility |

---

## 9. Graph Construction

From domain model:

### 9.1 Nodes

Derived from:

```
batches × batchType.route
```

---

### 9.2 Batch edges

For consecutive route steps:

```
minGap = 0
maxGap = constraint if exists
```

---

### 9.3 Eligibility

For each node:

```
eligibleMachineIds = {
  m | m.processorTypeId == requiredProcessorTypeId
}
```

---

### 9.4 Machine transitions

For each machine m and pair (A,B):

```
minGap = changeover(processorType(m), batchType(A), batchType(B))
```

---

## 10. Mathematical Core

The solver graph represents:

> a temporal constraint network with disjunctions

Core layer:

```
start_j - start_i ≤ c
```

Extension:

- disjunctive ordering
- assignment variables

---

## 11. Solution Definition

A solution is:

- assignment of:
  - start times
  - machine choices
  - machine ordering

such that:

- all constraints are satisfied

---

## 12. Objective (optional)

Examples:

- minimize makespan
- minimize tardiness
- minimize total setup time
- weighted objectives

---

## 13. Separation from Domain

The solver graph:

- contains no business semantics
- contains no batch types or routes
- contains only executable constraints

It is:

> a compiled form of the domain model

---

## 14. Invariant

Projection must be:

- deterministic
- lossless (w.r.t constraints)
- stable under ordering of inputs