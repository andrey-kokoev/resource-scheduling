/**
 * Explanation golden tests.
 *
 * These tests guard the regrouped domain explanation surface without depending
 * on solver search behavior. They exercise primitive-to-domain regrouping
 * directly using synthetic infeasibility results.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildRegroupingContext,
  regroupToDomainExplanations,
  type DomainInput,
  type SolveResult,
} from '../index.js';

const d = (dateStr: string, timeStr: string = '00:00'): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

function makeInput(): DomainInput {
  return {
    sites: [ { id: 'site-1', name: 'Plant A' } ],
    lines: [
      { id: 'line-a', siteId: 'site-1', name: 'Assembly' },
      { id: 'line-b', siteId: 'site-1', name: 'Packaging' },
    ],
    shifts: [
      { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00', siteId: 'site-1', shiftFamilyId: 'day' },
      { id: 's2', date: '2026-04-02', startTime: '08:00', endTime: '16:00', siteId: 'site-1', shiftFamilyId: 'night' },
      { id: 's3', date: '2026-04-03', startTime: '08:00', endTime: '16:00', siteId: 'site-1', shiftFamilyId: 'day' },
    ],
    positions: [
      { id: 'p1', name: 'Operator' },
      { id: 'p2', name: 'Supervisor' },
    ],
    needs: [
      { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1, lineId: 'line-a' },
      { id: 'n2', shiftId: 's2', positionId: 'p2', count: 1, lineId: 'line-b' },
      { id: 'n3', shiftId: 's3', positionId: 'p1', count: 1, lineId: 'line-a' },
    ],
    candidates: [
      { id: 'c1', name: 'Alice' },
      { id: 'c2', name: 'Bob' },
    ],
    qualificationTypes: [
      { id: 'q1', name: 'MachineAuth' },
      { id: 'q2', name: 'SupervisorAuth' },
    ],
    positionQualifications: [
      { positionId: 'p1', qualificationTypeId: 'q1', required: true },
      { positionId: 'p2', qualificationTypeId: 'q2', required: true },
    ],
    candidateQualifications: [
      { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
      { candidateId: 'c1', qualificationTypeId: 'q2', validFrom: d('2026-01-01') },
      { candidateId: 'c2', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
    ],
    coverageRules: [
      {
        id: 'cr-1',
        type: 'require-supervisor-presence',
        shiftId: 's2',
        lineId: 'line-b',
        positionId: 'p2',
      },
    ],
    utilizationRules: [
      { candidateId: 'c1', windowDays: 7, maxShifts: 2 },
    ],
  };
}

describe('explanation golden tests', () => {
  it('regroups availability conflicts with stable candidate and need ids', () => {
    const input = makeInput();
    const context = buildRegroupingContext(input);
    const result: Extract<SolveResult, { feasible: false }> = {
      feasible: false,
      reasons: [
        {
          type: 'availability-conflict',
          agentId: 'c1',
          demandUnitId: 'n1#0',
          conflictKind: 'unavailable-overlap',
          reason: 'approved leave',
        },
      ],
    };

    const explanations = regroupToDomainExplanations(result, context);
    assert.strictEqual(explanations.length, 1);
    assert.deepStrictEqual(explanations[0], {
      type: 'availability-conflict',
      candidateId: 'c1',
      needId: 'n1',
      shiftId: 's1',
      positionId: 'p1',
      conflictKind: 'unavailable-overlap',
      reason: 'approved leave',
    });
  });

  it('regroups shift-pattern conflicts with stable rule facts', () => {
    const input = makeInput();
    const context = buildRegroupingContext(input);
    const result: Extract<SolveResult, { feasible: false }> = {
      feasible: false,
      reasons: [
        {
          type: 'shift-pattern-conflict',
          agentId: 'c1',
          demandUnitId: 'n2#0',
          ruleType: 'fixed-shift-family',
          ruleId: 'spr-1',
          shiftFamilyId: 'night',
          allowedShiftFamilyIds: ['day'],
        },
      ],
    };

    const explanations = regroupToDomainExplanations(result, context);
    assert.strictEqual(explanations.length, 1);
    assert.deepStrictEqual(explanations[0], {
      type: 'shift-pattern-conflict',
      candidateId: 'c1',
      needId: 'n2',
      shiftId: 's2',
      positionId: 'p2',
      ruleType: 'fixed-shift-family',
      relatedShiftId: undefined,
      shiftFamilyId: 'night',
      allowedShiftFamilyIds: ['day'],
    });
  });

  it('regroups coverage conflicts with affected need ids and preserved rule context', () => {
    const input = makeInput();
    const context = buildRegroupingContext(input);
    const result: Extract<SolveResult, { feasible: false }> = {
      feasible: false,
      reasons: [
        {
          type: 'coverage-conflict',
          ruleId: 'cr-1',
          coverageType: 'require-supervisor-presence',
          shiftId: 's2',
          demandUnitIds: ['n2#0'],
          positionId: 'p2',
          supervisorDemandUnitIds: ['n1#0'],
        },
      ],
    };

    const explanations = regroupToDomainExplanations(result, context);
    assert.strictEqual(explanations.length, 1);
    assert.deepStrictEqual(explanations[0], {
      type: 'coverage-conflict',
      shiftId: 's2',
      ruleId: 'cr-1',
      siteId: 'site-1',
      coverageType: 'require-supervisor-presence',
      affectedNeedIds: ['n2'],
      qualificationTypeId: undefined,
      positionId: 'p2',
      dependentPositionId: undefined,
      supportingPositionId: undefined,
      lineId: 'line-b',
      supervisorDemandUnitIds: ['n1#0'],
    });
  });

  it('regroups site-scoped coverage conflicts with site ids and no line metadata', () => {
    const input = makeInput();
    const context = buildRegroupingContext(input);
    const result: Extract<SolveResult, { feasible: false }> = {
      feasible: false,
      reasons: [
        {
          type: 'coverage-conflict',
          ruleId: 'cr-site',
          coverageType: 'require-supervisor-presence',
          shiftId: 's1',
          demandUnitIds: ['n1#0', 'n3#0'],
          positionId: 'p2',
          supervisorDemandUnitIds: ['n2#0'],
        },
      ],
    };

    const explanations = regroupToDomainExplanations(result, context);
    assert.strictEqual(explanations.length, 1);
    assert.deepStrictEqual(explanations[0], {
      type: 'coverage-conflict',
      shiftId: 's1',
      ruleId: 'cr-site',
      siteId: 'site-1',
      coverageType: 'require-supervisor-presence',
      affectedNeedIds: ['n1', 'n3'],
      qualificationTypeId: undefined,
      positionId: 'p2',
      dependentPositionId: undefined,
      supportingPositionId: undefined,
      lineId: undefined,
      supervisorDemandUnitIds: ['n2#0'],
    });
  });

  it('regroups utilization conflicts with exact window facts', () => {
    const input = makeInput();
    const context = buildRegroupingContext(input);
    const result: Extract<SolveResult, { feasible: false }> = {
      feasible: false,
      reasons: [
        {
          type: 'utilization-conflict',
          agentId: 'c1',
          rule: { agentId: 'c1', windowDays: 7, maxAssignments: 2 },
          wouldHaveAssignments: 3,
          demandUnitId: 'n3#0',
          windowStart: d('2026-03-27', '08:00'),
          windowEnd: d('2026-04-03', '16:00'),
          affectedDemandUnitIds: ['n1#0', 'n2#0', 'n3#0'],
        },
      ],
    };

    const explanations = regroupToDomainExplanations(result, context);
    assert.strictEqual(explanations.length, 1);
    assert.strictEqual(explanations[0].type, 'utilization-max-violation');
    if (explanations[0].type === 'utilization-max-violation') {
      assert.deepStrictEqual(explanations[0], {
        type: 'utilization-max-violation',
        candidateId: 'c1',
        windowDays: 7,
        maxAllowed: 2,
        wouldHave: 3,
        windowStart: d('2026-03-27', '08:00'),
        windowEnd: d('2026-04-03', '16:00'),
        affectedShiftIds: ['s1', 's2', 's3'],
      });
    }
  });

  it('regroups consecutive-days conflicts with stable shift and date facts', () => {
    const input = makeInput();
    const context = buildRegroupingContext(input);
    const result: Extract<SolveResult, { feasible: false }> = {
      feasible: false,
      reasons: [
        {
          type: 'consecutive-days-violation',
          agentId: 'c1',
          candidateDemandUnitId: 'n3#0',
          runDates: ['2026-04-01', '2026-04-02', '2026-04-03'],
          allowedMax: 2,
          actualRunLength: 3,
        },
      ],
    };

    const explanations = regroupToDomainExplanations(result, context);
    assert.strictEqual(explanations.length, 1);
    assert.deepStrictEqual(explanations[0], {
      type: 'consecutive-days-violation',
      candidateId: 'c1',
      dates: ['2026-04-01', '2026-04-02', '2026-04-03'],
      allowedMax: 2,
      actualDays: 3,
      attemptedShiftId: 's3',
      attemptedDate: '2026-04-03',
    });
  });
});
