import { describe, it } from 'node:test';
import assert from 'node:assert';
import type {
  CopiedBaselineState,
  DomainInput,
} from '../index.js';

function makeTargetInput(): DomainInput {
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

describe('copied baseline workflow state', () => {
  it('keeps copied baseline state separate from ordinary DomainInput', () => {
    const state: CopiedBaselineState = {
      targetInput: makeTargetInput(),
      copiedAssignments: [
        {
          id: 'ba-1',
          agentId: 'c-1',
          demandUnitId: 'n-1#0',
        },
      ],
      hardLocks: [
        {
          id: 'hl-1',
          agentId: 'c-1',
          demandUnitId: 'n-1#0',
        },
      ],
      retentionAnnotations: [
        {
          assignmentId: 'ba-1',
          label: 'keep candidate + shift + position',
        },
      ],
      deltas: [
        {
          id: 'delta-1',
          kind: 'removed-assignment',
          assignmentId: 'ba-2',
        },
        {
          id: 'delta-2',
          kind: 'added-need',
          need: {
            id: 'n-2',
            shiftId: 's-2',
            positionId: 'p-1',
            count: 1,
          },
        },
        {
          id: 'delta-3',
          kind: 'removed-need',
          needId: 'n-3',
        },
        {
          id: 'delta-4',
          kind: 'changed-shift',
          shiftId: 's-1',
          before: {
            id: 's-1',
            date: '2026-04-01',
            startTime: '08:00',
            endTime: '16:00',
          },
          after: {
            id: 's-1',
            date: '2026-04-02',
            startTime: '08:00',
            endTime: '16:00',
          },
        },
        {
          id: 'delta-5',
          kind: 'changed-availability',
          candidateId: 'c-1',
          before: [],
          after: [],
        },
      ],
    };

    assert.strictEqual(state.targetInput.shifts.length, 0);
    assert.strictEqual(state.copiedAssignments.length, 1);
    assert.strictEqual(state.hardLocks.length, 1);
    assert.strictEqual(state.retentionAnnotations.length, 1);
    assert.strictEqual(state.deltas.length, 5);
  });
});
