import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  FULL_RELEASE_REPAIR_ATTEMPT_STAGE,
  KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE,
  STRONGEST_REPAIR_ATTEMPT_STAGE,
  runRepairOrchestration,
  type CopiedBaselineState,
  type DomainInput,
} from '../index.js';
import {
  candidate,
  candidateQualification,
  d,
  need,
  position,
  positionQualification,
  qualificationType,
  shift,
} from './fixtures.js';

function makeInput(): DomainInput {
  return {
    shifts: [shift('s1', '2026-04-01', '08:00', '16:00')],
    positions: [position('p1', 'Operator')],
    needs: [
      need('n1', 's1', 'p1', 1),
      need('n2', 's1', 'p1', 1),
    ],
    candidates: [
      candidate('c1', 'Alice'),
    ],
    qualificationTypes: [qualificationType('q1', 'Operator Certified')],
    positionQualifications: [positionQualification('p1', 'q1', true)],
    candidateQualifications: [
      candidateQualification('c1', 'q1', d('2026-01-01')),
    ],
    utilizationRules: [],
  };
}

describe('repair orchestrator skeleton', () => {
  it('falls back from the strongest stage to the second stage and then full release when needed', () => {
    const baselineState: CopiedBaselineState = {
      targetInput: makeInput(),
      copiedAssignments: [
        {
          id: 'ba-1',
          agentId: 'c1',
          demandUnitId: 'n1#0',
        },
        {
          id: 'ba-2',
          agentId: 'c1',
          demandUnitId: 'n2#0',
        },
      ],
      hardLocks: [
        {
          id: 'hl-1',
          agentId: 'c1',
          demandUnitId: 'n1#0',
        },
      ],
      retentionAnnotations: [
        {
          assignmentId: 'ba-1',
          label: 'keep candidate + shift + position',
        },
      ],
      deltas: [],
    };

    const result = runRepairOrchestration({ baselineState });

    assert.strictEqual(result.attempts.length, 3);
    assert.strictEqual(result.attempts[0].stage, STRONGEST_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.attempts[0].outcome, 'infeasible');
    assert.strictEqual(result.attempts[1].stage, KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.attempts[1].outcome, 'infeasible');
    assert.strictEqual(result.attempts[2].stage, FULL_RELEASE_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.attempts[2].outcome, 'infeasible');
    assert.strictEqual(result.selectedAttempt.stage, FULL_RELEASE_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.selectedAttempt.attempt.attemptValid, true);
    assert.strictEqual(result.solverResult.feasible, false);
  });
});
