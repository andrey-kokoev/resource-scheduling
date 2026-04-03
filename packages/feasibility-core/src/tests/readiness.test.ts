import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
  type DomainInput,
} from '../index.js';
import {
  available,
  candidate,
  candidateQualification,
  d,
  line,
  coverageRule,
  need,
  position,
  positionQualification,
  qualificationType,
  shift,
  site,
  unavailable,
} from './fixtures.js';

describe('readiness harness', () => {
  it('covers the minimal feasible staffing flow', () => {
    const input: DomainInput = {
      shifts: [
        shift('s1', '2026-04-01', '08:00', '16:00'),
      ],
      positions: [position('p1', 'Operator')],
      needs: [need('n1', 's1', 'p1')],
      candidates: [candidate('c1', 'Alice')],
      qualificationTypes: [qualificationType('q1', 'MachineAuth')],
      positionQualifications: [positionQualification('p1', 'q1')],
      candidateQualifications: [
        candidateQualification('c1', 'q1', d('2026-01-01')),
      ],
      utilizationRules: [],
      coverageRules: [
        coverageRule({
          id: 'cr1',
          type: 'require-supervisor-presence',
          siteId: 'site-1',
          shiftId: 's1',
          positionId: 'pLead',
        }),
      ],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 1);
      assert.strictEqual(result.assignments[0].agentId, 'c1');
    }
  });

  it('covers infeasible staffing with regrouped explanations', () => {
    const input: DomainInput = {
      shifts: [
        shift('s1', '2026-04-01', '08:00', '16:00'),
      ],
      positions: [position('p1', 'Operator')],
      needs: [need('n1', 's1', 'p1')],
      candidates: [candidate('c1', 'Alice')],
      qualificationTypes: [],
      positionQualifications: [],
      candidateQualifications: [],
      utilizationRules: [],
      candidateAvailability: [
        {
          ...unavailable('c1', d('2026-04-01', '00:00'), d('2026-04-02', '00:00'), 'approved leave'),
        },
      ],
    };

    const result = solve(compileDomain(input));

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
      }
    }
  });

  it('covers a manufacturing-oriented staffed shift', () => {
    const input: DomainInput = {
      shifts: [
        shift('s1', '2026-04-06', '06:00', '14:00', { shiftFamilyId: 'day' }),
      ],
      positions: [
        position('pOp', 'Operator'),
        position('pLead', 'Line Lead'),
      ],
      needs: [
        need('n1', 's1', 'pOp'),
        need('n2', 's1', 'pLead'),
      ],
      candidates: [
        candidate('c1', 'Ava'),
        candidate('c2', 'Ben'),
      ],
      qualificationTypes: [
        qualificationType('qOp', 'OperatorAuth'),
        qualificationType('qLead', 'LeadAuth'),
      ],
      positionQualifications: [
        positionQualification('pOp', 'qOp'),
        positionQualification('pLead', 'qLead'),
      ],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qLead', d('2026-01-01')),
      ],
      utilizationRules: [],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 2);
      assert.ok(result.assignments.some(a => a.agentId === 'c1'));
      assert.ok(result.assignments.some(a => a.agentId === 'c2'));
    }
  });

  it('covers a multi-line site staffing flow', () => {
    const input: DomainInput = {
      sites: [site('site-1', 'Plant A')],
      lines: [
        line('line-a', 'site-1', 'Assembly'),
        line('line-b', 'site-1', 'Packaging'),
      ],
      shifts: [
        shift('s1', '2026-04-06', '06:00', '14:00', { siteId: 'site-1', shiftFamilyId: 'day' }),
      ],
      positions: [
        position('pOp', 'Operator'),
        position('pLead', 'Line Lead'),
      ],
      needs: [
        need('n1', 's1', 'pOp', 1, 'line-a'),
        need('n2', 's1', 'pLead', 1, 'line-b'),
      ],
      candidates: [
        candidate('c1', 'Ava'),
        candidate('c2', 'Ben'),
      ],
      qualificationTypes: [
        qualificationType('qOp', 'OperatorAuth'),
        qualificationType('qSup', 'SupervisorAuth'),
      ],
      positionQualifications: [
        positionQualification('pOp', 'qOp'),
        positionQualification('pLead', 'qSup'),
      ],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qSup', d('2026-01-01')),
      ],
      utilizationRules: [],
      coverageRules: [
        coverageRule({
          id: 'cr1',
          type: 'require-supervisor-presence',
          siteId: 'site-1',
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

  it('covers a site-aware coverage failure on a site-local supervisor rule', () => {
    const input: DomainInput = {
      sites: [site('site-1', 'Plant A')],
      lines: [
        line('line-a', 'site-1', 'Assembly'),
        line('line-b', 'site-1', 'Packaging'),
      ],
      shifts: [
        shift('s1', '2026-04-06', '06:00', '14:00', { siteId: 'site-1' }),
      ],
      positions: [
        position('pOp', 'Operator'),
        position('pLead', 'Line Lead'),
      ],
      needs: [
        need('n1', 's1', 'pOp', 1, 'line-a'),
        need('n2', 's1', 'pOp', 1, 'line-b'),
      ],
      candidates: [
        candidate('c1', 'Ava'),
        candidate('c2', 'Ben'),
      ],
      qualificationTypes: [qualificationType('qOp', 'OperatorAuth')],
      positionQualifications: [
        positionQualification('pOp', 'qOp'),
      ],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qOp', d('2026-01-01')),
      ],
      utilizationRules: [],
      coverageRules: [
        coverageRule({
          id: 'cr1',
          type: 'require-supervisor-presence',
          siteId: 'site-1',
          shiftId: 's1',
          positionId: 'pLead',
        }),
      ],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, false);
    if (!result.feasible) {
      const context = buildRegroupingContext(input);
      const explanations = regroupToDomainExplanations(result, context);
      const conflict = explanations.find(e => e.type === 'coverage-conflict');

      assert.ok(conflict, 'Expected coverage-conflict explanation');
      if (conflict?.type === 'coverage-conflict') {
        assert.strictEqual(conflict.siteId, 'site-1');
        assert.strictEqual(conflict.lineId, undefined);
        assert.strictEqual(conflict.ruleId, 'cr1');
        assert.strictEqual(conflict.coverageType, 'require-supervisor-presence');
      }
    }
  });

  it('covers a multi-rule interaction case', () => {
    const input: DomainInput = {
      shifts: [
        shift('s1', '2026-04-01', '08:00', '16:00'),
        shift('s2', '2026-04-02', '08:00', '16:00'),
      ],
      positions: [position('p1', 'Operator')],
      needs: [
        need('n1', 's1', 'p1'),
        need('n2', 's2', 'p1'),
      ],
      candidates: [
        candidate('c1', 'Jordan'),
        candidate('c2', 'Taylor'),
      ],
      qualificationTypes: [qualificationType('q1', 'MachineAuth')],
      positionQualifications: [positionQualification('p1', 'q1')],
      candidateQualifications: [
        candidateQualification('c1', 'q1', d('2026-01-01')),
        candidateQualification('c2', 'q1', d('2026-01-01')),
      ],
      candidateAvailability: [
        {
          ...available('c1', d('2026-04-01', '00:00'), d('2026-04-02', '00:00')),
        },
        {
          ...available('c2', d('2026-04-02', '00:00'), d('2026-04-03', '00:00')),
        },
      ],
      utilizationRules: [
        { candidateId: 'c1', windowDays: 7, maxShifts: 1 },
        { candidateId: 'c2', windowDays: 7, maxShifts: 1 },
      ],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 2);
    }
  });

  it('covers one site with multiple lines without introducing cross-line coupling', () => {
    const input: DomainInput = {
      sites: [site('site-1', 'Plant A')],
      lines: [
        line('line-a', 'site-1', 'Assembly'),
        line('line-b', 'site-1', 'Packaging'),
      ],
      shifts: [
        shift('s1', '2026-04-08', '06:00', '14:00', { siteId: 'site-1' }),
      ],
      positions: [
        position('pOp', 'Operator'),
        position('pLead', 'Line Lead'),
      ],
      needs: [
        need('n1', 's1', 'pOp', 1, 'line-a'),
        need('n2', 's1', 'pOp', 1, 'line-b'),
      ],
      candidates: [
        candidate('c1', 'Ava'),
        candidate('c2', 'Ben'),
      ],
      qualificationTypes: [
        qualificationType('qOp', 'OperatorAuth'),
      ],
      positionQualifications: [
        positionQualification('pOp', 'qOp'),
      ],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qOp', d('2026-01-01')),
      ],
      utilizationRules: [],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 2);
      assert.deepStrictEqual(new Set(result.assignments.map(a => a.agentId)), new Set(['c1', 'c2']));
    }
  });

  it('covers two sites with site-scoped staffing expectations', () => {
    const input: DomainInput = {
      sites: [
        site('site-1', 'North Plant'),
        site('site-2', 'South Plant'),
      ],
      lines: [
        line('line-a', 'site-1', 'Assembly'),
        line('line-b', 'site-2', 'Packaging'),
      ],
      shifts: [
        shift('s1', '2026-04-09', '06:00', '14:00', { siteId: 'site-1' }),
        shift('s2', '2026-04-09', '14:00', '22:00', { siteId: 'site-2' }),
      ],
      positions: [position('pOp', 'Operator')],
      needs: [
        need('n1', 's1', 'pOp', 1, 'line-a'),
        need('n2', 's2', 'pOp', 1, 'line-b'),
      ],
      candidates: [
        candidate('c1', 'Morgan'),
        candidate('c2', 'Skyler'),
      ],
      qualificationTypes: [qualificationType('qOp', 'OperatorAuth')],
      positionQualifications: [positionQualification('pOp', 'qOp')],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qOp', d('2026-01-01')),
      ],
      candidateAvailability: [
        available('c1', d('2026-04-09', '06:00'), d('2026-04-09', '14:00')),
        available('c2', d('2026-04-09', '14:00'), d('2026-04-09', '22:00')),
      ],
      utilizationRules: [],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 2);
      assert.ok(result.assignments.some(a => a.agentId === 'c1'));
      assert.ok(result.assignments.some(a => a.agentId === 'c2'));
    }
  });

  it('covers a line-aware staffed shift on a single site', () => {
    const input: DomainInput = {
      sites: [site('site-2', 'South Plant')],
      lines: [
        line('line-a', 'site-2', 'Assembly'),
        line('line-b', 'site-2', 'Packaging'),
      ],
      shifts: [
        shift('s1', '2026-04-10', '06:00', '14:00', { siteId: 'site-2' }),
        shift('s2', '2026-04-10', '14:00', '22:00', { siteId: 'site-2' }),
      ],
      positions: [
        position('pOp', 'Operator'),
        position('pLead', 'Line Lead'),
      ],
      needs: [
        need('n1', 's1', 'pOp', 1, 'line-a'),
        need('n2', 's2', 'pLead', 1, 'line-b'),
      ],
      candidates: [
        candidate('c1', 'Riley'),
        candidate('c2', 'Casey'),
      ],
      qualificationTypes: [
        qualificationType('qOp', 'OperatorAuth'),
        qualificationType('qSup', 'SupervisorAuth'),
      ],
      positionQualifications: [
        positionQualification('pOp', 'qOp'),
        positionQualification('pLead', 'qSup'),
      ],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qSup', d('2026-01-01')),
      ],
      utilizationRules: [],
      coverageRules: [
        coverageRule({
          id: 'cr1',
          type: 'require-qualification-on-shift',
          shiftId: 's2',
          lineId: 'line-b',
          qualificationTypeId: 'qSup',
        }),
      ],
    };

    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 2);
    }
  });

  it('surfaces site and line ids back through regrouped coverage explanations', () => {
    const input: DomainInput = {
      sites: [site('site-2', 'South Plant')],
      lines: [
        line('line-a', 'site-2', 'Assembly'),
        line('line-b', 'site-2', 'Packaging'),
      ],
      shifts: [
        shift('s1', '2026-04-10', '06:00', '14:00', { siteId: 'site-2' }),
        shift('s2', '2026-04-10', '14:00', '22:00', { siteId: 'site-2' }),
      ],
      positions: [
        position('pOp', 'Operator'),
        position('pLead', 'Line Lead'),
      ],
      needs: [
        need('n1', 's1', 'pOp', 1, 'line-a'),
        need('n2', 's2', 'pLead', 1, 'line-b'),
      ],
      candidates: [
        candidate('c1', 'Riley'),
        candidate('c2', 'Casey'),
      ],
      qualificationTypes: [
        qualificationType('qOp', 'OperatorAuth'),
        qualificationType('qSup', 'SupervisorAuth'),
      ],
      positionQualifications: [
        positionQualification('pOp', 'qOp'),
      ],
      candidateQualifications: [
        candidateQualification('c1', 'qOp', d('2026-01-01')),
        candidateQualification('c2', 'qOp', d('2026-01-01')),
      ],
      utilizationRules: [],
      coverageRules: [
        coverageRule({
          id: 'cr1',
          type: 'require-qualification-on-shift',
          siteId: 'site-2',
          shiftId: 's2',
          qualificationTypeId: 'qSup',
        }),
      ],
    };

    const result = {
      feasible: false,
      reasons: [
        {
          type: 'coverage-conflict',
          ruleId: 'cr1',
          coverageType: 'require-qualification-on-shift',
          shiftId: 's2',
          demandUnitIds: ['n2#0'],
          positionId: 'pLead',
          qualificationTypeId: 'qSup',
        },
      ],
    } as const;

    const context = buildRegroupingContext(input);
    const explanations = regroupToDomainExplanations(result, context);
    const conflict = explanations.find(e => e.type === 'coverage-conflict');

    assert.ok(conflict, 'Expected coverage-conflict explanation');
    if (conflict?.type === 'coverage-conflict') {
      assert.strictEqual(conflict.siteId, 'site-2');
      assert.strictEqual(conflict.lineId, undefined);
      assert.deepStrictEqual(conflict.affectedNeedIds, ['n2']);
      assert.strictEqual(conflict.coverageType, 'require-qualification-on-shift');
      assert.strictEqual(conflict.qualificationTypeId, 'qSup');
    }
  });
});
