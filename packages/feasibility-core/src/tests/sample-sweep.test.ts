import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildRegroupingContext,
  compileDomain,
  regroupToDomainExplanations,
  solve,
} from '../index.js';
import { hydrateScenario, sampleScenarios } from '../sample-scenarios.js';

describe('shared sample sweep', () => {
  for (const sample of sampleScenarios) {
    it(`evaluates sample ${sample.id}: ${sample.label}`, () => {
      const input = hydrateScenario(sample.scenario);
      const result = solve(compileDomain(input));

      assert.strictEqual(result.feasible, sample.expected.feasible);

      if (sample.expected.feasible) {
        assert.ok(result.feasible);
        assert.strictEqual(result.assignments.length, sample.expected.assignments ?? input.needs.length);
        return;
      }

      assert.ok(!result.feasible);
      const context = buildRegroupingContext(input);
      const explanations = regroupToDomainExplanations(result, context);
      assert.ok(
        explanations.some(explanation => explanation.type === sample.expected.cue),
        `Expected ${sample.expected.cue} explanation for ${sample.id}`,
      );
    });
  }
});
