# Batch Flow Scheduling — What This Is

## 1. Core Definition

Batch Flow Scheduling is a **typed temporal constraint system** for assigning
time and resources to batch-structured processes.

It consists of:

- a **template world** (batch types, routes, processor types)
- a **runtime world** (batches)
- a **schedule** (assignments of time + processor instances to batch steps)

All executable structure (operations) is **derived**, not stored.

---

## 2. Primary Identity

The fundamental unit is:

```
(batchId, routeStepTemplateId)
```

This is a **concrete batch step**.

All scheduling facts reference this identity directly.

There is no independent “operation” entity in the domain model.

---

## 3. Derived Structure

Operations are derived:

```
operations = batches × batchType.route
```

This eliminates representational duplication and drift.

---

## 4. Constraint System

The system is defined as constraints over:

```
start(n), end(n)
```

for each batch step `n`.

### 4.1 Batch-local constraints

For adjacent steps A → B in a batch:

```
start(B) - end(A) ∈ [0, maxLag]
```

Where:
- default: `[0, +∞)`
- optional: bounded by max lag

---

### 4.2 Machine-local constraints

For steps assigned to the same processor instance:

```
start(B) ≥ end(A) + changeover(A, B, m)
```

and no overlap is allowed.

---

### 4.3 Assignment constraint

Each batch step must be assigned to exactly one eligible processor instance.

---

## 5. Mathematical Core

### 5.1 Core layer

Ignoring machine assignment:

This is a **difference constraints system**:

```
start_j - start_i ≤ c
```

Equivalent to a **Simple Temporal Network (STN)**.

Properties:

- compositional
- closed under path addition
- feasibility via negative cycle detection

---

### 5.2 Full problem

With machine assignment and sequencing:

This becomes a **disjunctive constraint system**:

- flexible job shop scheduling
- with time lags
- with sequence-dependent setups

This is NP-hard.

---

## 6. Separation of Concerns

The model enforces:

### A. Domain layer
- batch types
- routes
- processor types
- constraints

### B. Derived layer
- operations
- precedence edges

### C. Schedule layer
- time + machine assignments

### D. Solver projection
- optional mapping to operation IDs and solver structures

---

## 7. Constraint Taxonomy

Constraints are explicitly typed and scoped:

| Constraint   | Scope    |
|--------------|----------|
| precedence   | batch    |
| max lag      | batch    |
| changeover   | machine  |
| capacity     | machine  |
| eligibility  | resource |

This separation is intentional and invariant.

---

## 8. What This Is Not

- not a workflow engine
- not a generic task scheduler
- not a machine-centric job shop model

It is:

> a batch-centric, route-defined, constraint-driven scheduling system

---

## 9. ISA-95 Position

This system corresponds to **ISA-95 Level 3 (MOM)**:

- BatchType → process definition
- ProcessorInstance → equipment
- Batch → production order
- ScheduledBatchStep → dispatchable work

---

## 10. Design Invariants (PDA Outcomes)

- no duplicated operational representation
- schedule references primary identity only
- all constraints are explicit and typed
- derived structures are deterministic
- no hidden semantics in IDs

---

## 11. Mental Model

The system can be viewed as:

> a temporal constraint graph over batch steps, with batch-local transition bounds and machine-local sequencing constraints.

A schedule is a **solution** to this constraint system.