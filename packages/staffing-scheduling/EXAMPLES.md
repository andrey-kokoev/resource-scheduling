# Staffing Scheduling Examples

This file shows the recommended package boundary.

For first-contact onboarding, read [README.md](./README.md) first, then come back here for concrete usage.

Preferred consumer imports are:

- `DomainInput`
- `compileDomain`
- `solve`
- `buildRegroupingContext`
- `regroupToDomainExplanations`

1. Build `DomainInput`
2. `compileDomain(input)`
3. `solve(solveInput)`
4. If infeasible, `buildRegroupingContext(input)`
5. `regroupToDomainExplanations(result, context)`

## Minimal Staffing Solve

```ts
import {
  compileDomain,
  solve,
  type DomainInput,
} from 'staffing-scheduling';

const input: DomainInput = {
  shifts: [
    { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
  ],
  positions: [{ id: 'p1', name: 'Operator' }],
  needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
  candidates: [{ id: 'c1', name: 'Alice' }],
  qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
  positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
  candidateQualifications: [
    { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: new Date('2026-01-01T00:00:00') },
  ],
  utilizationRules: [],
};

const result = solve(compileDomain(input));

if (result.feasible) {
  console.log(result.assignments);
}
```

Supported features demonstrated here:

- compile domain input
- solve feasibility
- use exact-match qualifications
- use full-interval validity

## Infeasible Solve With Regrouped Explanations

```ts
import {
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
  type DomainInput,
} from 'staffing-scheduling';

const input: DomainInput = {
  shifts: [
    { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
  ],
  positions: [{ id: 'p1', name: 'Operator' }],
  needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
  candidates: [{ id: 'c1', name: 'Alice' }],
  qualificationTypes: [],
  positionQualifications: [],
  candidateQualifications: [],
  utilizationRules: [],
  candidateAvailability: [
    {
      candidateId: 'c1',
      kind: 'unavailable',
      interval: {
        start: new Date('2026-04-01T00:00:00'),
        end: new Date('2026-04-02T00:00:00'),
      },
      reason: 'approved leave',
    },
  ],
};

const result = solve(compileDomain(input));

if (!result.feasible) {
  const context = buildRegroupingContext(input);
  const explanations = regroupToDomainExplanations(result, context);

  console.log(explanations);
}
```

Expected regrouped output includes an `availability-conflict` explanation for `c1` on `n1`/`s1`.

## Manufacturing-Oriented Scenario

```ts
import {
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
  type DomainInput,
} from 'staffing-scheduling';

const input: DomainInput = {
  shifts: [
    { id: 's1', date: '2026-04-06', startTime: '06:00', endTime: '14:00', shiftFamilyId: 'day' },
  ],
  positions: [
    { id: 'pOp', name: 'Operator' },
    { id: 'pLead', name: 'Line Lead' },
  ],
  needs: [
    { id: 'n1', shiftId: 's1', positionId: 'pOp', count: 1 },
    { id: 'n2', shiftId: 's1', positionId: 'pLead', count: 1 },
  ],
  candidates: [
    { id: 'c1', name: 'Ava' },
    { id: 'c2', name: 'Ben' },
  ],
  qualificationTypes: [
    { id: 'qOp', name: 'OperatorAuth' },
    { id: 'qLead', name: 'LeadAuth' },
  ],
  positionQualifications: [
    { positionId: 'pOp', qualificationTypeId: 'qOp', required: true },
    { positionId: 'pLead', qualificationTypeId: 'qLead', required: true },
  ],
  candidateQualifications: [
    { candidateId: 'c1', qualificationTypeId: 'qOp', validFrom: new Date('2026-01-01T00:00:00') },
    { candidateId: 'c2', qualificationTypeId: 'qLead', validFrom: new Date('2026-01-01T00:00:00') },
  ],
  utilizationRules: [],
};

const result = solve(compileDomain(input));

if (result.feasible) {
  console.log(result.assignments);
} else {
  const context = buildRegroupingContext(input);
  console.log(regroupToDomainExplanations(result, context));
}
```

This is the shape a plant caller usually wants: one shift, multiple staffed roles, exact qualifications, and a solve result that can be regrouped into domain language if infeasible.

For a thin browser evaluator using the same compile/solve/regroup flow on a sample plant, see `apps/staffing-scheduling-playground`.

## Usage Notes

- `buildRegroupingContext` is the preferred path from primitive failures back to domain explanations.
- `EXPLANATIONS.md` lists the primitive-to-domain mapping.
- `CONTRACT.md` remains the semantic authority for any ambiguous rule wording.
