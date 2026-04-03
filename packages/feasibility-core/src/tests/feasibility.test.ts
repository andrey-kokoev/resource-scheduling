/**
 * Feasibility Core Tests
 * 
 * Covers:
 * - Simple feasible case
 * - Missing qualification case
 * - Expired qualification case
 * - Overlapping shift conflict
 * - Utilization max violation case
 * - Utilization min/max rolling-window interpretation case
 * - Infeasible full-coverage case
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  compileDomain,
  solve,
  explainInfeasibility,
  buildRegroupingContext,
  regroupToDomainExplanations,
  deriveWorkedDates,
  validateConsecutiveDays,
  type DomainInput,
  type SolveResult,
} from '../index.js';
import {
  available,
  candidate,
  candidateQualification,
  d,
  need,
  position,
  positionQualification,
  qualificationType,
  shift,
  shiftPatternRule,
  unavailable,
  utilizationRule,
  coverageRule,
  site,
} from './fixtures.js';

describe('feasibility-core', () => {
  describe('simple feasible case', () => {
    it('should find a valid assignment for one need', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.strictEqual(result.assignments.length, 1);
        assert.strictEqual(result.assignments[0].agentId, 'c1');
      }
    });

    it('should handle multiple needs with multiple candidates', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 2 }],
        candidates: [
          { id: 'c1', name: 'Alice' },
          { id: 'c2', name: 'Bob' },
        ],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
          { candidateId: 'c2', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.strictEqual(result.assignments.length, 2);
        const assignedAgents = new Set(result.assignments.map(a => a.agentId));
        assert.strictEqual(assignedAgents.size, 2);
        assert.ok(assignedAgents.has('c1'));
        assert.ok(assignedAgents.has('c2'));
      }
    });
  });

  describe('missing qualification case', () => {
    it('should report infeasible when no candidate has required qualification', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [
          { id: 'q1', name: 'RN' },
          { id: 'q2', name: 'LPN' },
        ],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          // Candidate only has LPN, not RN
          { candidateId: 'c1', qualificationTypeId: 'q2', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const noEligible = result.reasons.find(r => r.type === 'no-eligible-agent');
        assert.ok(noEligible, 'Should report no-eligible-agent');
      }
    });
  });

  describe('expired qualification case', () => {
    it('should reject assignment when qualification expires before shift', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          // Qualification expired before the shift
          { 
            candidateId: 'c1', 
            qualificationTypeId: 'q1', 
            validFrom: d('2025-01-01'),
            validUntil: d('2026-03-15'),
          },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const noEligible = result.reasons.find(r => r.type === 'no-eligible-agent');
        assert.ok(noEligible, 'Should report no-eligible-agent due to expired qualification');
      }
    });

    it('should accept assignment when qualification is valid during shift', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          // Qualification is valid during the shift
          { 
            candidateId: 'c1', 
            qualificationTypeId: 'q1', 
            validFrom: d('2026-01-01'),
            validUntil: d('2026-12-31'),
          },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, true);
    });
  });

  describe('candidate availability', () => {
    it('should reject assignment when candidate is explicitly unavailable during the shift', () => {
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
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        candidateAvailability: [
          {
            candidateId: 'c1',
            kind: 'unavailable',
            interval: { start: d('2026-04-01', '00:00'), end: d('2026-04-02', '00:00') },
            reason: 'approved leave',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'no-eligible-agent'));
      }
    });

    it('should enforce explicit available windows as allow-lists when present', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-02', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        candidateAvailability: [
          {
            candidateId: 'c1',
            kind: 'available',
            interval: { start: d('2026-04-01', '00:00'), end: d('2026-04-02', '00:00') },
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const noEligible = result.reasons.filter(r => r.type === 'no-eligible-agent');
        assert.ok(noEligible.some(r => r.demandUnitId === 'n2#0'));
      }
    });

    it('should normalize primitive reasons into a stable order when multiple blockers exist', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [
          { id: 'c1', name: 'Alice' },
          { id: 'c2', name: 'Bob' },
        ],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        candidateAvailability: [
          {
            candidateId: 'c1',
            kind: 'unavailable',
            interval: { start: d('2026-04-01', '00:00'), end: d('2026-04-02', '00:00') },
            reason: 'leave',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.deepStrictEqual(
          result.reasons.map(r => r.type),
          ['capability-validity-gap', 'availability-conflict', 'no-eligible-agent'],
        );

        const uniqueReasons = new Set(result.reasons.map(r => JSON.stringify(r)));
        assert.strictEqual(uniqueReasons.size, result.reasons.length);
      }
    });
  });

  describe('time basis and calendar behavior', () => {
    it('should derive both local calendar days for an overnight shift', () => {
      const workedDates = deriveWorkedDates({
        start: d('2026-04-03', '22:00'),
        end: d('2026-04-04', '06:00'),
      });

      assert.deepStrictEqual(workedDates, ['2026-04-03', '2026-04-04']);
    });

    it('should classify overnight shifts by local start date for weekday/weekend rules', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-03', '22:00', '06:00'),
          shift('s2', '2026-04-04', '22:00', '06:00'),
        ],
        positions: [position('p1', 'Operator')],
        needs: [
          need('n1', 's1', 'p1'),
          need('n2', 's2', 'p1'),
        ],
        candidates: [
          candidate('c1', 'Weekday Worker'),
          candidate('c2', 'Weekend Worker'),
        ],
        qualificationTypes: [qualificationType('q1', 'MachineAuth')],
        positionQualifications: [
          positionQualification('p1', 'q1'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'q1', d('2026-01-01')),
          candidateQualification('c2', 'q1', d('2026-01-01')),
        ],
        utilizationRules: [],
        shiftPatternRules: [
          shiftPatternRule({ id: 'spr1', candidateId: 'c1', type: 'weekday-only' }),
          shiftPatternRule({ id: 'spr2', candidateId: 'c2', type: 'weekend-only' }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.deepStrictEqual(
          new Map(result.assignments.map(a => [a.demandUnitId, a.agentId])),
          new Map([
            ['n1#0', 'c1'],
            ['n2#0', 'c2'],
          ]),
        );
      }
    });

    it('should treat overnight shifts as one start event for rolling-window max', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-03', '22:00', '06:00'),
          shift('s2', '2026-04-04', '22:00', '06:00'),
        ],
        positions: [position('p1', 'Operator')],
        needs: [
          need('n1', 's1', 'p1'),
          need('n2', 's2', 'p1'),
        ],
        candidates: [candidate('c1', 'Overnight Worker')],
        qualificationTypes: [qualificationType('q1', 'MachineAuth')],
        positionQualifications: [
          positionQualification('p1', 'q1'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'q1', d('2026-01-01')),
        ],
        utilizationRules: [
          utilizationRule({ candidateId: 'c1', windowDays: 7, maxShifts: 1 }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'unfilled-demand'));
      }
    });

    it('should count overnight intervals in consecutive-day derivation across midnight', () => {
      const demandUnits = new Map([
        ['du1', { id: 'du1', interval: { start: d('2026-04-03', '22:00'), end: d('2026-04-04', '06:00') }, requiredCapabilities: [] }],
        ['du2', { id: 'du2', interval: { start: d('2026-04-04', '22:00'), end: d('2026-04-05', '06:00') }, requiredCapabilities: [] }],
      ]);

      const valid = validateConsecutiveDays(
        [
          { demandUnitId: 'du1' },
          { demandUnitId: 'du2' },
        ],
        demandUnits,
        2,
      );

      assert.strictEqual(valid, false);
    });
  });

  describe('shift pattern rules', () => {
    it('should reject weekend shifts for a weekday-only worker', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-04', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        shiftPatternRules: [
          { id: 'spr1', candidateId: 'c1', type: 'weekday-only' },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'no-eligible-agent'));
      }
    });

    it('should reject shifts outside a fixed-shift-family allowlist', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-06', startTime: '08:00', endTime: '16:00', shiftFamilyId: 'family-a' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        shiftPatternRules: [
          {
            id: 'spr1',
            candidateId: 'c1',
            type: 'fixed-shift-family',
            shiftFamilyIds: ['family-b'],
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'shift-pattern-conflict'));
      }
    });

    it('should reject a day shift immediately following an overnight night shift for no-night-to-day-turnaround', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '22:00', endTime: '06:00' },
          { id: 's2', date: '2026-04-02', startTime: '10:00', endTime: '18:00' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        shiftPatternRules: [
          { id: 'spr1', candidateId: 'c1', type: 'no-night-to-day-turnaround' },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'unfilled-demand'));
      }
    });

    it('should reject a different shift-family assignment for a non-rotating worker', () => {
      const input: DomainInput = {
        shifts: [
          {
            id: 's1',
            date: '2026-04-01',
            startTime: '08:00',
            endTime: '16:00',
            shiftFamilyId: 'family-a',
          },
          {
            id: 's2',
            date: '2026-04-02',
            startTime: '08:00',
            endTime: '16:00',
            shiftFamilyId: 'family-b',
          },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        shiftPatternRules: [
          { id: 'spr1', candidateId: 'c1', type: 'non-rotating' },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'shift-pattern-conflict'));
      }
    });
  });

  describe('coverage rules', () => {
    it('should backtrack to satisfy require-qualification-on-shift when multiple candidates are otherwise eligible', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [
          { id: 'c2', name: 'Bob' },
          { id: 'c1', name: 'Alice' },
        ],
        qualificationTypes: [
          { id: 'q1', name: 'BaseAuth' },
          { id: 'qLead', name: 'LeadAuth' },
        ],
        positionQualifications: [],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'qLead', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-qualification-on-shift',
            shiftId: 's1',
            qualificationTypeId: 'qLead',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.strictEqual(result.assignments.length, 1);
        assert.strictEqual(result.assignments[0].agentId, 'c1');
      }
    });

    it('should report infeasible when require-position-on-shift cannot be satisfied', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [
          { id: 'p1', name: 'Operator' },
          { id: 'p2', name: 'Lead' },
        ],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-position-on-shift',
            shiftId: 's1',
            positionId: 'p2',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'unfilled-demand'));
      }
    });

    it('should require support when a dependent position is staffed', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [
          { id: 'pDep', name: 'Dependent' },
          { id: 'pSup', name: 'Support' },
        ],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'pDep', count: 1 },
          { id: 'n2', shiftId: 's1', positionId: 'pSup', count: 1 },
        ],
        candidates: [
          { id: 'c1', name: 'Alice' },
          { id: 'c2', name: 'Bob' },
        ],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-support-when-dependent-staffed',
            shiftId: 's1',
            dependentPositionId: 'pDep',
            supportingPositionId: 'pSup',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.strictEqual(result.assignments.length, 2);
      }
    });

    it('should reject staffing a dependent position without support', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'pDep', name: 'Dependent' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'pDep', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-support-when-dependent-staffed',
            shiftId: 's1',
            dependentPositionId: 'pDep',
            supportingPositionId: 'pSup',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'coverage-conflict'));
      }
    });

    it('should require supervisor presence when the shift is staffed', () => {
      const input: DomainInput = {
        sites: [
          site('site-1', 'Plant A'),
        ],
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00', siteId: 'site-1' },
        ],
        positions: [
          { id: 'pSup', name: 'Supervisor' },
          { id: 'pOp', name: 'Operator' },
        ],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'pOp', count: 1 },
          { id: 'n2', shiftId: 's1', positionId: 'pSup', count: 1 },
        ],
        candidates: [
          { id: 'c1', name: 'Alice' },
          { id: 'c2', name: 'Bob' },
        ],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-supervisor-presence',
            siteId: 'site-1',
            shiftId: 's1',
            positionId: 'pSup',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.strictEqual(result.assignments.length, 2);
      }
    });

    it('should reject a staffed shift without a supervisor present', () => {
      const input: DomainInput = {
        sites: [
          site('site-1', 'Plant A'),
        ],
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00', siteId: 'site-1' },
        ],
        positions: [{ id: 'pOp', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'pOp', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-supervisor-presence',
            siteId: 'site-1',
            shiftId: 's1',
            positionId: 'pSup',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        assert.ok(result.reasons.some(r => r.type === 'coverage-conflict'));
      }
    });
  });

  describe('manufacturing scenario validation', () => {
    it('should staff a certified operator through approved leave', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-06', '08:00', '16:00'),
        ],
        positions: [position('pOp', 'Operator')],
        needs: [need('n1', 's1', 'pOp')],
        candidates: [
          candidate('c1', 'Priya'),
          candidate('c2', 'Marco'),
        ],
        qualificationTypes: [qualificationType('qMachine', 'MachineAuth')],
        positionQualifications: [
          positionQualification('pOp', 'qMachine'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'qMachine', d('2026-01-01')),
          candidateQualification('c2', 'qMachine', d('2026-01-01')),
        ],
        candidateAvailability: [
          unavailable('c1', d('2026-04-06', '00:00'), d('2026-04-07', '00:00'), 'approved leave'),
          available('c2', d('2026-04-06', '00:00'), d('2026-04-07', '00:00')),
        ],
        utilizationRules: [],
        coverageRules: [
          coverageRule({
            id: 'cr1',
            type: 'require-qualification-on-shift',
            shiftId: 's1',
            qualificationTypeId: 'qMachine',
          }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.deepStrictEqual(
          result.assignments.map(a => a.agentId),
          ['c2'],
        );
      }
    });

    it('should keep a weekday-only worker off a Saturday maintenance shift when availability points to the weekend crew', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-04', '08:00', '16:00'),
        ],
        positions: [position('pMaint', 'Maintenance Technician')],
        needs: [need('n1', 's1', 'pMaint')],
        candidates: [
          candidate('c1', 'Jamie'),
          candidate('c2', 'Taylor'),
        ],
        qualificationTypes: [qualificationType('qMaint', 'MaintenanceAuth')],
        positionQualifications: [
          positionQualification('pMaint', 'qMaint'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'qMaint', d('2026-01-01')),
          candidateQualification('c2', 'qMaint', d('2026-01-01')),
        ],
        candidateAvailability: [
          available('c1', d('2026-04-04', '00:00'), d('2026-04-05', '00:00')),
          available('c2', d('2026-04-04', '00:00'), d('2026-04-05', '00:00')),
        ],
        utilizationRules: [],
        shiftPatternRules: [
          shiftPatternRule({ id: 'spr1', candidateId: 'c1', type: 'weekday-only' }),
          shiftPatternRule({ id: 'spr2', candidateId: 'c2', type: 'weekend-only' }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.deepStrictEqual(
          result.assignments.map(a => a.agentId),
          ['c2'],
        );
      }
    });

    it('should require a lead when the line is staffed', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-06', '08:00', '16:00'),
        ],
        positions: [
          position('pLead', 'Lead'),
          position('pOp', 'Operator'),
        ],
        needs: [
          need('n1', 's1', 'pOp'),
          need('n2', 's1', 'pLead'),
        ],
        candidates: [
          candidate('c1', 'Avery'),
          candidate('c2', 'Noah'),
        ],
        qualificationTypes: [
          qualificationType('qLead', 'LeadAuth'),
          qualificationType('qOp', 'OperatorAuth'),
        ],
        positionQualifications: [
          positionQualification('pLead', 'qLead'),
          positionQualification('pOp', 'qOp'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'qLead', d('2026-01-01')),
          candidateQualification('c2', 'qOp', d('2026-01-01')),
        ],
        utilizationRules: [],
        coverageRules: [
          coverageRule({
            id: 'cr1',
            type: 'require-supervisor-presence',
            shiftId: 's1',
            positionId: 'pLead',
          }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        assert.strictEqual(result.assignments.length, 2);
        assert.ok(result.assignments.some(a => a.agentId === 'c1'));
        assert.ok(result.assignments.some(a => a.agentId === 'c2'));
      }
    });

    it('should report a forklift coverage failure when the certified worker is on leave', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-06', '08:00', '16:00'),
        ],
        positions: [position('pShip', 'Shipping Clerk')],
        needs: [need('n1', 's1', 'pShip')],
        candidates: [
          candidate('c1', 'Kai'),
          candidate('c2', 'Riley'),
        ],
        qualificationTypes: [
          qualificationType('qForklift', 'ForkliftAuth'),
          qualificationType('qShip', 'ShippingAuth'),
        ],
        positionQualifications: [
          positionQualification('pShip', 'qShip'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'qForklift', d('2026-01-01')),
          candidateQualification('c2', 'qShip', d('2026-01-01')),
        ],
        candidateAvailability: [
          unavailable('c1', d('2026-04-06', '00:00'), d('2026-04-07', '00:00'), 'time off'),
        ],
        utilizationRules: [],
        coverageRules: [
          coverageRule({
            id: 'cr1',
            type: 'require-qualification-on-shift',
            shiftId: 's1',
            qualificationTypeId: 'qForklift',
          }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const availabilityConflict = explanations.find(e => e.type === 'coverage-conflict');

        assert.ok(availabilityConflict, 'Expected coverage-conflict explanation');
        if (availabilityConflict?.type === 'coverage-conflict') {
          assert.strictEqual(availabilityConflict.shiftId, 's1');
          assert.strictEqual(availabilityConflict.ruleId, 'cr1');
          assert.strictEqual(availabilityConflict.coverageType, 'require-qualification-on-shift');
          assert.strictEqual(availabilityConflict.qualificationTypeId, 'qForklift');
        }
      }
    });

    it('should reject a night-to-day turnaround on adjacent manufacturing shifts', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-06', '22:00', '06:00'),
          shift('s2', '2026-04-07', '08:00', '16:00'),
        ],
        positions: [position('pOp', 'Operator')],
        needs: [
          need('n1', 's1', 'pOp'),
          need('n2', 's2', 'pOp'),
        ],
        candidates: [candidate('c1', 'Jordan')],
        qualificationTypes: [qualificationType('qOp', 'OperatorAuth')],
        positionQualifications: [
          positionQualification('pOp', 'qOp'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'qOp', d('2026-01-01')),
        ],
        utilizationRules: [],
        shiftPatternRules: [
          shiftPatternRule({ id: 'spr1', candidateId: 'c1', type: 'no-night-to-day-turnaround' }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const patternConflict = explanations.find(e => e.type === 'shift-pattern-conflict');

        assert.ok(patternConflict, 'Expected shift-pattern-conflict explanation');
        if (patternConflict?.type === 'shift-pattern-conflict') {
          assert.strictEqual(patternConflict.candidateId, 'c1');
          assert.strictEqual(patternConflict.ruleType, 'no-night-to-day-turnaround');
        }
      }
    });

    it('should cover all shipping shifts while respecting rolling max limits', () => {
      const input: DomainInput = {
        shifts: [
          shift('s1', '2026-04-06', '08:00', '16:00'),
          shift('s2', '2026-04-07', '08:00', '16:00'),
          shift('s3', '2026-04-08', '08:00', '16:00'),
        ],
        positions: [position('pShip', 'Shipping Clerk')],
        needs: [
          need('n1', 's1', 'pShip'),
          need('n2', 's2', 'pShip'),
          need('n3', 's3', 'pShip'),
        ],
        candidates: [
          candidate('c1', 'Morgan'),
          candidate('c2', 'Drew'),
        ],
        qualificationTypes: [
          qualificationType('qForklift', 'ForkliftAuth'),
          qualificationType('qShip', 'ShippingAuth'),
        ],
        positionQualifications: [
          positionQualification('pShip', 'qShip'),
        ],
        candidateQualifications: [
          candidateQualification('c1', 'qForklift', d('2026-01-01')),
          candidateQualification('c1', 'qShip', d('2026-01-01')),
          candidateQualification('c2', 'qForklift', d('2026-01-01')),
          candidateQualification('c2', 'qShip', d('2026-01-01')),
        ],
        utilizationRules: [
          utilizationRule({ candidateId: 'c1', windowDays: 7, maxShifts: 2 }),
          utilizationRule({ candidateId: 'c2', windowDays: 7, maxShifts: 1 }),
        ],
        coverageRules: [
          coverageRule({
            id: 'cr1',
            type: 'require-qualification-on-shift',
            shiftId: 's1',
            qualificationTypeId: 'qForklift',
          }),
          coverageRule({
            id: 'cr2',
            type: 'require-qualification-on-shift',
            shiftId: 's2',
            qualificationTypeId: 'qForklift',
          }),
          coverageRule({
            id: 'cr3',
            type: 'require-qualification-on-shift',
            shiftId: 's3',
            qualificationTypeId: 'qForklift',
          }),
        ],
      };

      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        const c1Assignments = result.assignments.filter(a => a.agentId === 'c1');
        const c2Assignments = result.assignments.filter(a => a.agentId === 'c2');
        assert.strictEqual(c1Assignments.length, 2);
        assert.strictEqual(c2Assignments.length, 1);
      }
    });
  });

  describe('overlapping shift conflict', () => {
    it('should prevent assigning same candidate to overlapping shifts', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-01', startTime: '12:00', endTime: '20:00' }, // Overlaps!
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        // Should report unfilled demand or overlap conflict
        const hasRelevantReason = result.reasons.some(r => 
          r.type === 'overlap-conflict' || r.type === 'unfilled-demand'
        );
        assert.ok(hasRelevantReason, 'Should report overlap or unfilled demand');
      }
    });

    it('should allow non-overlapping shifts for same candidate', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-01', startTime: '16:00', endTime: '20:00' }, // Non-overlapping
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      // Note: s2 starts at 16:00, s1 ends at 16:00 - this is non-overlapping (end <= start)
      // But our solver checks a.start < b.end && a.end > b.start
      // So [08:00-16:00) and [16:00-20:00) do NOT overlap
      assert.strictEqual(result.feasible, true);
    });
  });

  describe('utilization max violation case', () => {
    it('should enforce max shifts in rolling window', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-02', startTime: '08:00', endTime: '16:00' },
          { id: 's3', date: '2026-04-03', startTime: '08:00', endTime: '16:00' },
          { id: 's4', date: '2026-04-04', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
          { id: 'n3', shiftId: 's3', positionId: 'p1', count: 1 },
          { id: 'n4', shiftId: 's4', positionId: 'p1', count: 1 },
        ],
        candidates: [
          { id: 'c1', name: 'Alice' },
          { id: 'c2', name: 'Bob' },
        ],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
          { candidateId: 'c2', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [
          // Max 2 shifts per 7-day window for each candidate
          { candidateId: 'c1', windowDays: 7, maxShifts: 2 },
          { candidateId: 'c2', windowDays: 7, maxShifts: 2 },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      // We have 4 shifts, 2 candidates each max 2 shifts = exactly feasible
      assert.strictEqual(result.feasible, true);
      if (result.feasible) {
        // Each candidate should have exactly 2 assignments
        const c1Count = result.assignments.filter(a => a.agentId === 'c1').length;
        const c2Count = result.assignments.filter(a => a.agentId === 'c2').length;
        assert.strictEqual(c1Count, 2);
        assert.strictEqual(c2Count, 2);
      }
    });

    it('should report infeasible when max shifts exceeded', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-02', startTime: '08:00', endTime: '16:00' },
          { id: 's3', date: '2026-04-03', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
          { id: 'n3', shiftId: 's3', positionId: 'p1', count: 1 },
        ],
        candidates: [
          { id: 'c1', name: 'Alice' },
        ],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [
          // Max 2 shifts per 7-day window
          { candidateId: 'c1', windowDays: 7, maxShifts: 2 },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      // 3 shifts, only 1 candidate with max 2 = infeasible
      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const unfilled = result.reasons.find(r => r.type === 'unfilled-demand');
        assert.ok(unfilled, 'Should report unfilled demand');
      }
    });
  });

  describe('utilization min/max rolling-window interpretation', () => {
    it('should count assignments within rolling window correctly', () => {
      // Test case: shifts on days 1, 8, 15 with 14-day window
      // Each shift falls in a different rolling window relative to the others
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-08', startTime: '08:00', endTime: '16:00' },
          { id: 's3', date: '2026-04-15', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
          { id: 'n3', shiftId: 's3', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [
          // 14-day window, max 1 shift per window
          // Since shifts are 7 days apart, each is in its own window relative to the next
          { candidateId: 'c1', windowDays: 14, maxShifts: 1 },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      // Each assignment is checked at the time of assignment
      // s1 on Apr 1: window is Mar 18 - Apr 1, has 0 -> OK
      // s2 on Apr 8: window is Mar 25 - Apr 8, has s1 (Apr 1 >= Mar 25) -> 1 -> OK
      // s3 on Apr 15: window is Apr 1 - Apr 15, has s1 and s2 -> 2 -> exceeds max 1
      // Actually wait - that's wrong. Let me re-check:
      // When assigning s2, we check if there are existing assignments in [Apr 8 - 14 days, Apr 8]
      // = [Mar 25, Apr 8]. s1 (Apr 1) is in this window, so count = 1, OK.
      // When assigning s3, we check [Apr 15 - 14 days, Apr 15] = [Apr 1, Apr 15]
      // Both s1 (Apr 1) and s2 (Apr 8) are in this window, so count = 2, exceeds max 1
      // So this should be infeasible

      assert.strictEqual(result.feasible, false);
    });

    it('should carry exact window facts into utilization regrouping', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-02', startTime: '08:00', endTime: '16:00' },
          { id: 's3', date: '2026-04-03', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
          { id: 'n3', shiftId: 's3', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [
          { candidateId: 'c1', windowDays: 7, maxShifts: 2 },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const utilization = result.reasons.find(r => r.type === 'utilization-conflict');
        assert.ok(utilization, 'Should report utilization-conflict');
        if (utilization?.type === 'utilization-conflict') {
          assert.strictEqual(utilization.demandUnitId, 'n3#0');
          assert.deepStrictEqual(utilization.affectedDemandUnitIds, ['n1#0', 'n2#0', 'n3#0']);
          assert.strictEqual(utilization.windowStart.getTime(), d('2026-03-27', '08:00').getTime());
          assert.strictEqual(utilization.windowEnd.getTime(), d('2026-04-03', '16:00').getTime());
        }

        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const regrouped = explanations.find(e => e.type === 'utilization-max-violation');

        assert.ok(regrouped, 'Should regroup utilization-conflict');
        if (regrouped?.type === 'utilization-max-violation') {
          assert.strictEqual(regrouped.candidateId, 'c1');
          assert.strictEqual(regrouped.windowStart.getTime(), d('2026-03-27', '08:00').getTime());
          assert.strictEqual(regrouped.windowEnd.getTime(), d('2026-04-03', '16:00').getTime());
          assert.deepStrictEqual(regrouped.affectedShiftIds, ['s1', 's2', 's3']);
        }
      }
    });
  });

  describe('infeasible full-coverage case', () => {
    it('should report infeasible when not enough candidates for coverage', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
          { id: 's2', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      // c1 can't work both shifts simultaneously (overlap)
      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        const unfilled = result.reasons.find(r => r.type === 'unfilled-demand');
        assert.ok(unfilled, 'Should report unfilled demand');
      }
    });

    it('should report infeasibility with multiple reasons', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [
          { id: 'p1', name: 'RN' },
          { id: 'p2', name: 'LPN' },
        ],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's1', positionId: 'p2', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [
          { id: 'q1', name: 'RN' },
          { id: 'q2', name: 'LPN' },
        ],
        positionQualifications: [
          { positionId: 'p1', qualificationTypeId: 'q1', required: true },
          { positionId: 'p2', qualificationTypeId: 'q2', required: true },
        ],
        candidateQualifications: [
          // c1 only has RN, not LPN
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);

      assert.strictEqual(result.feasible, false);
      if (!result.feasible) {
        // Should have at least one no-eligible-agent reason for n2
        const noEligibleReasons = result.reasons.filter(r => r.type === 'no-eligible-agent');
        assert.ok(noEligibleReasons.length > 0, 'Should have no-eligible-agent reason(s)');
      }
    });
  });

  describe('explainInfeasibility helper', () => {
    it('should identify missing qualifications without full solve', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Nurse' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [], // No candidates!
        qualificationTypes: [{ id: 'q1', name: 'RN' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [],
        utilizationRules: [],
      };

      const solveInput = compileDomain(input);
      const reasons = explainInfeasibility(solveInput);

      assert.ok(reasons.length > 0);
      assert.strictEqual(reasons[0].type, 'no-eligible-agent');
    });
  });

  describe('domain explanation regrouping', () => {
    it('should regroup availability conflicts into domain explanations', () => {
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
            interval: { start: d('2026-04-01', '00:00'), end: d('2026-04-02', '00:00') },
            reason: 'vacation',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'availability-conflict');

        assert.ok(conflict, 'Expected availability-conflict explanation');
        if (conflict?.type === 'availability-conflict') {
          assert.strictEqual(conflict.candidateId, 'c1');
          assert.strictEqual(conflict.needId, 'n1');
          assert.strictEqual(conflict.shiftId, 's1');
          assert.strictEqual(conflict.conflictKind, 'unavailable-overlap');
          assert.strictEqual(conflict.reason, 'vacation');
        }
      }
    });

    it('should regroup shift-pattern conflicts into domain explanations', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-04', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        shiftPatternRules: [
          { id: 'spr1', candidateId: 'c1', type: 'weekday-only' },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'shift-pattern-conflict');

        assert.ok(conflict, 'Expected shift-pattern-conflict explanation');
        if (conflict?.type === 'shift-pattern-conflict') {
          assert.strictEqual(conflict.candidateId, 'c1');
          assert.strictEqual(conflict.needId, 'n1');
          assert.strictEqual(conflict.shiftId, 's1');
          assert.strictEqual(conflict.ruleType, 'weekday-only');
        }
      }
    });

    it('should regroup fixed-shift-family conflicts into domain explanations', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-06', startTime: '08:00', endTime: '16:00', shiftFamilyId: 'family-a' },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        shiftPatternRules: [
          {
            id: 'spr1',
            candidateId: 'c1',
            type: 'fixed-shift-family',
            shiftFamilyIds: ['family-b'],
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'shift-pattern-conflict');

        assert.ok(conflict, 'Expected shift-pattern-conflict explanation');
        if (conflict?.type === 'shift-pattern-conflict') {
          assert.strictEqual(conflict.candidateId, 'c1');
          assert.strictEqual(conflict.needId, 'n1');
          assert.strictEqual(conflict.shiftId, 's1');
          assert.strictEqual(conflict.ruleType, 'fixed-shift-family');
          assert.deepStrictEqual(conflict.allowedShiftFamilyIds, ['family-b']);
          assert.strictEqual(conflict.shiftFamilyId, 'family-a');
        }
      }
    });

    it('should regroup non-rotating conflicts into domain explanations', () => {
      const input: DomainInput = {
        shifts: [
          {
            id: 's1',
            date: '2026-04-01',
            startTime: '08:00',
            endTime: '16:00',
            shiftFamilyId: 'family-a',
          },
          {
            id: 's2',
            date: '2026-04-02',
            startTime: '08:00',
            endTime: '16:00',
            shiftFamilyId: 'family-b',
          },
        ],
        positions: [{ id: 'p1', name: 'Operator' }],
        needs: [
          { id: 'n1', shiftId: 's1', positionId: 'p1', count: 1 },
          { id: 'n2', shiftId: 's2', positionId: 'p1', count: 1 },
        ],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [{ id: 'q1', name: 'MachineAuth' }],
        positionQualifications: [{ positionId: 'p1', qualificationTypeId: 'q1', required: true }],
        candidateQualifications: [
          { candidateId: 'c1', qualificationTypeId: 'q1', validFrom: d('2026-01-01') },
        ],
        utilizationRules: [],
        shiftPatternRules: [
          { id: 'spr1', candidateId: 'c1', type: 'non-rotating' },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'shift-pattern-conflict');

        assert.ok(conflict, 'Expected shift-pattern-conflict explanation');
        if (conflict?.type === 'shift-pattern-conflict') {
          assert.strictEqual(conflict.candidateId, 'c1');
          assert.strictEqual(conflict.ruleType, 'non-rotating');
          assert.strictEqual(conflict.shiftId, 's2');
          assert.strictEqual(conflict.relatedShiftId, 's1');
        }
      }
    });

    it('should regroup coverage conflicts into domain explanations', () => {
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
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-position-on-shift',
            shiftId: 's1',
            positionId: 'p2',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'coverage-conflict');

        assert.ok(conflict, 'Expected coverage-conflict explanation');
        if (conflict?.type === 'coverage-conflict') {
          assert.strictEqual(conflict.shiftId, 's1');
          assert.strictEqual(conflict.ruleId, 'cr1');
          assert.strictEqual(conflict.coverageType, 'require-position-on-shift');
          assert.strictEqual(conflict.positionId, 'p2');
        }
      }
    });

    it('should regroup support coverage conflicts into domain explanations', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'pDep', name: 'Dependent' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'pDep', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-support-when-dependent-staffed',
            shiftId: 's1',
            dependentPositionId: 'pDep',
            supportingPositionId: 'pSup',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'coverage-conflict');

        assert.ok(conflict, 'Expected coverage-conflict explanation');
        if (conflict?.type === 'coverage-conflict') {
          assert.strictEqual(conflict.shiftId, 's1');
          assert.strictEqual(conflict.ruleId, 'cr1');
          assert.strictEqual(conflict.coverageType, 'require-support-when-dependent-staffed');
          assert.strictEqual(conflict.dependentPositionId, 'pDep');
          assert.strictEqual(conflict.supportingPositionId, 'pSup');
        }
      }
    });

    it('should regroup supervisor coverage conflicts into domain explanations', () => {
      const input: DomainInput = {
        shifts: [
          { id: 's1', date: '2026-04-01', startTime: '08:00', endTime: '16:00' },
        ],
        positions: [{ id: 'pOp', name: 'Operator' }],
        needs: [{ id: 'n1', shiftId: 's1', positionId: 'pOp', count: 1 }],
        candidates: [{ id: 'c1', name: 'Alice' }],
        qualificationTypes: [],
        positionQualifications: [],
        candidateQualifications: [],
        utilizationRules: [],
        coverageRules: [
          {
            id: 'cr1',
            type: 'require-supervisor-presence',
            shiftId: 's1',
            positionId: 'pSup',
          },
        ],
      };

      const solveInput = compileDomain(input);
      const result = solve(solveInput);
      assert.strictEqual(result.feasible, false);

      if (!result.feasible) {
        const context = buildRegroupingContext(input);
        const explanations = regroupToDomainExplanations(result, context);
        const conflict = explanations.find(e => e.type === 'coverage-conflict');

        assert.ok(conflict, 'Expected coverage-conflict explanation');
        if (conflict?.type === 'coverage-conflict') {
          assert.strictEqual(conflict.shiftId, 's1');
          assert.strictEqual(conflict.ruleId, 'cr1');
          assert.strictEqual(conflict.coverageType, 'require-supervisor-presence');
          assert.strictEqual(conflict.positionId, 'pSup');
        }
      }
    });
  });
});
