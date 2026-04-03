import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildConcreteSolveAttempt,
  type ConcreteSolveAttempt,
  type DomainInput,
  type HardLock,
} from '../index.js';

function makeInput(): DomainInput {
  return {
    shifts: [],
    positions: [],
    needs: [],
    candidates: [],
    qualificationTypes: [],
    positionQualifications: [],
    candidateQualifications: [],
    utilizationRules: [],
  };
}

describe('hard-lock boundary', () => {
  it('packages hard locks into concrete preassignments', () => {
    const hardLocks: readonly HardLock[] = [
      {
        id: 'hl-1',
        agentId: 'c-1',
        demandUnitId: 'n-1#0',
        reason: 'baseline copy',
      },
    ];

    const attempt: ConcreteSolveAttempt = buildConcreteSolveAttempt(makeInput(), hardLocks);

    assert.deepStrictEqual(attempt.hardLocks, hardLocks);
    assert.deepStrictEqual(attempt.preassignedAssignments, [
      {
        kind: 'hard-lock',
        agentId: 'c-1',
        demandUnitId: 'n-1#0',
        hardLockId: 'hl-1',
      },
    ]);
  });

  it('preserves a finite attempt boundary when no hard locks are present', () => {
    const attempt = buildConcreteSolveAttempt(makeInput(), []);

    assert.strictEqual(attempt.preassignedAssignments.length, 0);
    assert.strictEqual(attempt.hardLocks.length, 0);
    assert.strictEqual(attempt.input.shifts.length, 0);
  });
});
