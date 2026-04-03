import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildStableRepairReport,
  type CopiedBaselineState,
  type DomainInput,
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

function makeRepairableInput(): DomainInput {
  return {
    sites: [{ id: 'site-1', name: 'Plant 1' }],
    lines: [line('line-1', 'site-1', 'Line 1')],
    shifts: [shift('s1', '2026-04-01', '08:00', '16:00', { siteId: 'site-1' })],
    positions: [position('p1', 'Operator')],
    needs: [
      need('n1', 's1', 'p1', 1, 'line-1'),
      need('n2', 's1', 'p1', 1, 'line-1'),
    ],
    candidates: [
      candidate('c1', 'Alice'),
      candidate('c2', 'Bob'),
    ],
    qualificationTypes: [qualificationType('q1', 'Operator Certified')],
    positionQualifications: [positionQualification('p1', 'q1', true)],
    candidateQualifications: [
      candidateQualification('c1', 'q1', d('2026-01-01')),
      candidateQualification('c2', 'q1', d('2026-01-01')),
    ],
    utilizationRules: [],
  };
}

describe('stable repair report', () => {
  it('does not report remaining needs after a feasible repaired result', () => {
    const baselineState: CopiedBaselineState = {
      targetInput: makeRepairableInput(),
      copiedAssignments: [
        { id: 'ba-1', agentId: 'c1', demandUnitId: 'n1#0' },
        { id: 'ba-2', agentId: 'c1', demandUnitId: 'n2#0' },
      ],
      hardLocks: [
        { id: 'hl-1', agentId: 'c1', demandUnitId: 'n1#0' },
      ],
      retentionAnnotations: [
        { assignmentId: 'ba-1', label: 'hard lock' },
        { assignmentId: 'ba-2', label: 'keep candidate + shift + position' },
      ],
      deltas: [],
    };

    const report = buildStableRepairReport(baselineState);

    assert.strictEqual(report.outcome, 'feasible');
    assert.strictEqual(report.selectedStage, 'keep-candidate-shift');
    assert.strictEqual(report.preservedAssignments.length, 1);
    assert.strictEqual(report.degradedAssignments.length, 1);
    assert.strictEqual(report.releasedAssignments.length, 0);
    assert.deepStrictEqual(report.needs, []);
  });
});
