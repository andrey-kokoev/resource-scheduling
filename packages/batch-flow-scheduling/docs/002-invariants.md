# Batch Flow Scheduling — Invariants

## 1. Identity Invariants

### 1.1 Primary identity is canonical

The only fundamental execution identity is:

```
(batchId, routeStepTemplateId)
```

No other identifier carries independent semantic meaning.

---

### 1.2 Operation identity is derived

```
operationId = f(batchId, routeStepTemplateId)
```

- no operation exists outside this derivation
- operation IDs must be deterministic and stable

---

## 2. Derivation Invariants

### 2.1 Operations are total over route

For every batch:

```
operations(batch) = route(batchType(batch))
```

Implications:

- exactly one operation per route step
- no missing operations
- no extra operations

---

### 2.2 Sequence consistency

For every operation:

```
operation.sequence == routeStepTemplate.sequence
```

---

## 3. Structural Invariants

### 3.1 Route integrity

For every batch type:

- route steps:
  - have unique IDs
  - have strictly increasing sequence
  - reference valid processor types
  - have non-negative duration

---

### 3.2 Reference integrity

All references must resolve:

- processorInstance → processorType exists
- batch → batchType exists
- routeStep → processorType exists
- schedule → batch + routeStep exist

---

## 4. Schedule Fact Invariants

### 4.1 Uniqueness

At most one schedule fact per batch step:

```
∀ (b, s): |ScheduledBatchStep(b,s)| ≤ 1
```

---

### 4.2 Completeness (by status)

Let `N` = all batch steps.

| status    | invariant |
|----------|----------|
| draft     | no requirement |
| partial   | subset of N |
| complete  | exactly N |

---

### 4.3 Temporal validity

For every scheduled step:

```
end ≥ start
end - start == duration
```

---

### 4.4 Type correctness

Assigned processor must match required type:

```
processorInstance.processorTypeId == routeStep.processorTypeId
```

---

## 5. Batch-Local Temporal Invariants

### 5.1 Precedence

For consecutive steps A → B:

```
start(B) ≥ end(A)
```

---

### 5.2 Max lag (if defined)

```
start(B) ≤ end(A) + maxLag(A,B)
```

---

### 5.3 Release constraint

```
start(step) ≥ batch.releaseTime
```

---

### 5.4 Due constraint (complete schedules)

```
max(end(step)) ≤ batch.dueTime   (soft / warning)
```

---

## 6. Machine-Local Invariants

### 6.1 No overlap

For any two steps A, B on same machine:

```
A before B OR B before A
```

---

### 6.2 Changeover constraint

If A precedes B on machine m:

```
start(B) ≥ end(A) + changeover(A,B,m)
```

---

## 7. Constraint Separation Invariant

Constraint types are orthogonal:

| Constraint | Scope |
|----------|------|
| precedence | batch |
| max lag | batch |
| changeover | machine |
| capacity | machine |
| eligibility | resource |

No constraint mixes scopes.

---

## 8. Determinism Invariants

### 8.1 Derived structures are pure

Given:

```
(batchTypes, batches)
```

Then:

```
operations, precedenceEdges
```

are deterministic and side-effect free.

---

### 8.2 Indexing is canonical

Index maps must be:

- complete
- non-conflicting
- consistent with derived structures

---

## 9. Non-Arbitrariness (PDA Outcome)

The system eliminates:

- duplicate representations of the same concept
- implicit constraints
- identity encoded in ad hoc IDs

All semantics are:

- explicit
- typed
- derivable

---

## 10. Valid Model Definition

A model is valid iff:

```
validateStaticModel(model) == ∅
```

A schedule is valid (relative to model) iff:

```
validateSchedule(model) has no errors
```

Warnings do not invalidate the model.