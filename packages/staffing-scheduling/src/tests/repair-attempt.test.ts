import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  FULL_RELEASE_REPAIR_ATTEMPT_STAGE,
  KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE,
  STRONGEST_REPAIR_ATTEMPT_STAGE,
  compileRepairAttempt,
  type CopiedBaselineState,
  type DomainInput,
  type PreassignedAssignment,
} from '../index.js';
import {
  candidate,
  candidateQualification,
  d,
  line,
  need,
  position,
  positionQualification,
  qualificationType,
  shift,
} from './fixtures.js';

function makeBaselineInput(): DomainInput {
  return {
    sites: [{ id: 'site-1', name: 'Plant 1' }],
    lines: [line('line-1', 'site-1', 'Line 1')],
    shifts: [
      shift('s1', '2026-04-01', '08:00', '16:00', { siteId: 'site-1' }),
      shift('s2', '2026-04-02', '08:00', '16:00', { siteId: 'site-1' }),
      shift('s3', '2026-04-03', '08:00', '16:00', { siteId: 'site-1' }),
      shift('s4', '2026-04-04', '08:00', '16:00', { siteId: 'site-1' }),
    ],
    positions: [position('p1', 'Operator')],
    needs: [
      need('n1', 's1', 'p1', 1, 'line-1'),
      need('n2', 's2', 'p1', 1, 'line-1'),
      need('n3', 's3', 'p1', 1, 'line-1'),
    ],
    candidates: [
      candidate('c1', 'Alice'),
      candidate('c2', 'Bob'),
      candidate('c3', 'Cara'),
    ],
    qualificationTypes: [qualificationType('q1', 'Operator Certified')],
    positionQualifications: [positionQualification('p1', 'q1', true)],
    candidateQualifications: [
      candidateQualification('c1', 'q1', d('2026-01-01')),
      candidateQualification('c2', 'q1', d('2026-01-01')),
      candidateQualification('c3', 'q1', d('2026-01-01')),
    ],
    utilizationRules: [],
  };
}

describe('repair-attempt compiler', () => {
  it('packages strongest retention hard locks, copied assignments, deltas, and open gaps into one attempt', () => {
    const baselineState: CopiedBaselineState = {
      targetInput: makeBaselineInput(),
      copiedAssignments: [
        { id: 'ba-1', agentId: 'c1', demandUnitId: 'n1#0' },
        { id: 'ba-2', agentId: 'c2', demandUnitId: 'n2#0' },
        { id: 'ba-3', agentId: 'c3', demandUnitId: 'n3#0' },
      ],
      hardLocks: [
        { id: 'hl-1', agentId: 'c1', demandUnitId: 'n1#0' },
      ],
      retentionAnnotations: [
        { assignmentId: 'ba-1', label: 'locked' },
        { assignmentId: 'ba-2', label: 'keep candidate + shift + position' },
        { assignmentId: 'ba-3', label: 'keep candidate + shift + position' },
      ],
      deltas: [
        { id: 'delta-1', kind: 'removed-assignment', assignmentId: 'ba-2' },
        {
          id: 'delta-2',
          kind: 'added-need',
          need: need('n4', 's4', 'p1', 1, 'line-1'),
        },
      ],
    };

    const result = compileRepairAttempt({
      baselineState,
      stage: STRONGEST_REPAIR_ATTEMPT_STAGE,
    });

    assert.strictEqual(result.stage, STRONGEST_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.attemptValid, true);
    assert.strictEqual(result.hardLockConflicts.length, 0);
    const preassignments: readonly PreassignedAssignment[] = result.attempt.preassignedAssignments;
    assert.deepStrictEqual(
      preassignments.map((assignment: PreassignedAssignment) => assignment.kind),
      ['hard-lock', 'retained-baseline'],
    );
    assert.deepStrictEqual(
      preassignments.map((assignment: PreassignedAssignment) => `${assignment.agentId}:${assignment.demandUnitId}`),
      ['c1:n1#0', 'c3:n3#0'],
    );
    assert.deepStrictEqual(result.releasedAssignments, [
      {
        assignmentId: 'ba-2',
        agentId: 'c2',
        demandUnitId: 'n2#0',
        reason: 'removed-by-delta',
      },
    ]);
    assert.deepStrictEqual(
      result.openGaps.map(gap => ({
        needId: gap.needId,
        demandUnitIds: gap.demandUnitIds,
        requiredCount: gap.requiredCount,
        coveredCount: gap.coveredCount,
      })),
      [
        {
          needId: 'n2',
          demandUnitIds: ['n2#0'],
          requiredCount: 1,
          coveredCount: 0,
        },
        {
          needId: 'n4',
          demandUnitIds: ['n4#0'],
          requiredCount: 1,
          coveredCount: 0,
        },
      ],
    );
    assert.strictEqual(result.solveInput.demandUnits.length, 4);
  });

  it('encodes strongest-stage retained assignments as stage-specific availability locks', () => {
    const baselineState: CopiedBaselineState = {
      targetInput: makeBaselineInput(),
      copiedAssignments: [
        { id: 'ba-1', agentId: 'c1', demandUnitId: 'n1#0' },
        { id: 'ba-2', agentId: 'c1', demandUnitId: 'n2#0' },
      ],
      hardLocks: [
        { id: 'hl-1', agentId: 'c1', demandUnitId: 'n1#0' },
      ],
      retentionAnnotations: [
        { assignmentId: 'ba-1', label: 'locked' },
        { assignmentId: 'ba-2', label: 'keep candidate + shift + position' },
      ],
      deltas: [],
    };

    const result = compileRepairAttempt({
      baselineState,
      stage: STRONGEST_REPAIR_ATTEMPT_STAGE,
    });

    const capabilityConstraint = result.solveInput.constraints.find(
      constraint => constraint.type === 'capability',
    ) as
      | {
          readonly type: 'capability';
          readonly agentCapabilities: ReadonlyMap<string, readonly { readonly id: string }[]>;
        }
      | undefined;

    assert.ok(capabilityConstraint);
    assert.deepStrictEqual(result.solveInput.demandUnits[0]?.requiredCapabilities, ['q1', 'repair-lock:c1:n1#0']);
    assert.deepStrictEqual(result.solveInput.demandUnits[1]?.requiredCapabilities, ['q1', 'repair-lock:c1:n2#0']);
    assert.deepStrictEqual(
      capabilityConstraint.agentCapabilities.get('c1')?.map(capability => capability.id),
      ['q1', 'repair-lock:c1:n1#0', 'repair-lock:c1:n2#0'],
    );
    assert.deepStrictEqual(
      capabilityConstraint.agentCapabilities.get('c2')?.map(capability => capability.id),
      ['q1'],
    );
    assert.strictEqual(result.attempt.preassignedAssignments.length, 2);
  });

  it('relaxes copied baseline preassignments at the second retention stage', () => {
    const baselineState: CopiedBaselineState = {
      targetInput: makeBaselineInput(),
      copiedAssignments: [
        { id: 'ba-1', agentId: 'c1', demandUnitId: 'n1#0' },
        { id: 'ba-2', agentId: 'c2', demandUnitId: 'n2#0' },
      ],
      hardLocks: [
        { id: 'hl-1', agentId: 'c1', demandUnitId: 'n1#0' },
      ],
      retentionAnnotations: [
        { assignmentId: 'ba-1', label: 'locked' },
        { assignmentId: 'ba-2', label: 'keep candidate + shift' },
      ],
      deltas: [],
    };

    const result = compileRepairAttempt({
      baselineState,
      stage: KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE,
    });

    assert.strictEqual(result.stage, KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.attemptValid, true);
    assert.strictEqual(result.hardLockConflicts.length, 0);
    const preassignments: readonly PreassignedAssignment[] = result.attempt.preassignedAssignments;
    assert.deepStrictEqual(
      preassignments.map((assignment: PreassignedAssignment) => assignment.kind),
      ['hard-lock'],
    );
    assert.deepStrictEqual(
      result.releasedAssignments.map(released => released.reason),
      ['relaxed-by-stage'],
    );
    assert.deepStrictEqual(
      result.openGaps.map(gap => gap.needId),
      ['n2', 'n3'],
    );
  });

  it('uses the full-release stage as a hard-lock-only solve attempt', () => {
    const baselineState: CopiedBaselineState = {
      targetInput: makeBaselineInput(),
      copiedAssignments: [
        { id: 'ba-1', agentId: 'c1', demandUnitId: 'n1#0' },
        { id: 'ba-2', agentId: 'c2', demandUnitId: 'n2#0' },
      ],
      hardLocks: [
        { id: 'hl-1', agentId: 'c1', demandUnitId: 'n1#0' },
      ],
      retentionAnnotations: [
        { assignmentId: 'ba-1', label: 'keep candidate + shift + position' },
        { assignmentId: 'ba-2', label: 'keep candidate + shift' },
      ],
      deltas: [],
    };

    const result = compileRepairAttempt({
      baselineState,
      stage: FULL_RELEASE_REPAIR_ATTEMPT_STAGE,
    });

    assert.strictEqual(result.stage, FULL_RELEASE_REPAIR_ATTEMPT_STAGE);
    assert.strictEqual(result.attemptValid, true);
    assert.deepStrictEqual(
      result.attempt.preassignedAssignments.map(assignment => assignment.kind),
      ['hard-lock'],
    );
    assert.deepStrictEqual(
      result.releasedAssignments.map(released => released.reason),
      ['relaxed-by-stage'],
    );
  });
});
