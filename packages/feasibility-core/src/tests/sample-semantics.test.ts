import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
} from '../index.js';
import { hydrateScenario, sampleScenarios } from '../sample-scenarios.js';

function sampleById(id: string) {
  const sample = sampleScenarios.find(item => item.id === id);
  assert.ok(sample, `Missing shared sample ${id}`);
  return sample;
}

function demandUnitShiftId(input: ReturnType<typeof hydrateScenario>, demandUnitId: string) {
  const needId = demandUnitId.split('#')[0];
  return input.needs.find((need: any) => need.id === needId)?.shiftId;
}

describe('shared sample semantics', () => {
  it('preserves the intended staffing shape for the base feasible sample', () => {
    const sample = sampleById('base-feasible');
    const input = hydrateScenario(sample.scenario);
    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, true);
    if (result.feasible) {
      assert.strictEqual(result.assignments.length, 4);
      const shiftIds = new Set(
        result.assignments.map(assignment => demandUnitShiftId(input, assignment.demandUnitId)),
      );
      assert.deepStrictEqual(shiftIds, new Set(['s1', 's2', 's3']));
    }
  });

  it('keeps the qualification gap anchored on the lead need', () => {
    const sample = sampleById('qualification-gap');
    const input = hydrateScenario(sample.scenario);
    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, false);
    if (!result.feasible) {
      const context = buildRegroupingContext(input);
      const explanations = regroupToDomainExplanations(result, context);
      const explanation = explanations.find(item => item.type === 'no-eligible-candidate');

      assert.ok(explanation, 'Expected no-eligible-candidate explanation');
      if (explanation?.type === 'no-eligible-candidate') {
        assert.strictEqual(explanation.needId, 'n2');
        assert.strictEqual(explanation.positionId, 'pLead');
        assert.deepStrictEqual(explanation.requiredQualifications, ['qLead']);
      }
    }
  });

  it('surfaces a concrete rest violation on the temporal-pressure sample', () => {
    const sample = sampleById('minimum-rest-conflict');
    const input = hydrateScenario(sample.scenario);
    const result = solve(compileDomain(input));

    assert.strictEqual(result.feasible, false);
    if (!result.feasible) {
      const context = buildRegroupingContext(input);
      const explanations = regroupToDomainExplanations(result, context);
      const explanation = explanations.find(item => item.type === 'insufficient-rest');

      assert.ok(explanation, 'Expected insufficient-rest explanation');
      if (explanation?.type === 'insufficient-rest') {
        assert.strictEqual(explanation.candidateId, 'c1');
        assert.strictEqual(explanation.earlierShiftId, 's1');
        assert.strictEqual(explanation.laterShiftId, 's2');
        assert.strictEqual(explanation.requiredRestHours, 8);
        assert.strictEqual(explanation.actualRestHours, 4);
      }
    }
  });

  it('preserves site metadata in regrouped coverage explanations', () => {
    const sample = sampleById('site-scoped-coverage');
    const input = hydrateScenario(sample.scenario);
    const context = buildRegroupingContext(input);
    const result = {
      feasible: false,
      reasons: [
        {
          type: 'coverage-conflict',
          ruleId: 'cr-1',
          coverageType: 'require-supervisor-presence',
          shiftId: 's1',
          demandUnitIds: ['n2#0'],
          positionId: 'pLead',
          supervisorDemandUnitIds: ['n1#0'],
        },
      ],
    } as const;

    const explanations = regroupToDomainExplanations(result, context);
    const explanation = explanations.find(item => item.type === 'coverage-conflict');

    assert.ok(explanation, 'Expected coverage-conflict explanation');
    if (explanation?.type === 'coverage-conflict') {
      assert.strictEqual(explanation.siteId, 'site-1');
      assert.strictEqual(explanation.lineId, undefined);
      assert.deepStrictEqual(explanation.affectedNeedIds, ['n2']);
    }
  });

  it('preserves line metadata in regrouped coverage explanations', () => {
    const sample = sampleById('line-aware-coverage');
    const input = hydrateScenario(sample.scenario);
    const context = buildRegroupingContext(input);
    const result = {
      feasible: false,
      reasons: [
        {
          type: 'coverage-conflict',
          ruleId: 'cr-1',
          coverageType: 'require-supervisor-presence',
          shiftId: 's1',
          demandUnitIds: ['n2#0'],
          positionId: 'pLead',
          supervisorDemandUnitIds: ['n1#0'],
        },
      ],
    } as const;

    const explanations = regroupToDomainExplanations(result, context);
    const explanation = explanations.find(item => item.type === 'coverage-conflict');

    assert.ok(explanation, 'Expected coverage-conflict explanation');
    if (explanation?.type === 'coverage-conflict') {
      assert.strictEqual(explanation.siteId, 'site-1');
      assert.strictEqual(explanation.lineId, 'line-a');
      assert.deepStrictEqual(explanation.affectedNeedIds, ['n2']);
    }
  });
});
