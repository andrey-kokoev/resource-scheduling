import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildStableRepairReport,
  buildRegroupingContext,
  compileDomain,
  repairCopiedBaseline,
  regroupToDomainExplanations,
  solve,
} from '../index.js';
import { hydrateScenario, sampleScenarios } from '../sample-scenarios.js';

describe('shared sample sweep', () => {
  for (const sample of sampleScenarios) {
    it(`evaluates sample ${sample.id}: ${sample.label}`, () => {
      const input = hydrateScenario(sample.scenario);

      if ((input as { mode?: string }).mode === 'repair') {
        const repairInput = input as {
          mode: 'repair';
          repairBaselineState: Parameters<typeof repairCopiedBaseline>[0];
        };
        const result = repairCopiedBaseline(repairInput.repairBaselineState);

        assert.strictEqual(result.outcome === 'feasible', sample.expected.feasible);

        if (sample.expected.feasible) {
          assert.strictEqual(result.solverResult.feasible, true);
          if (result.solverResult.feasible) {
            assert.strictEqual(
              result.solverResult.assignments.length,
              sample.expected.assignments ?? result.solverResult.assignments.length,
            );
          }
        } else {
          assert.strictEqual(result.solverResult.feasible, false);
          const report = buildStableRepairReport(repairInput.repairBaselineState);
          assert.ok(
            report.needs.length > 0 || report.releasedAssignments.length > 0,
            `Expected a non-empty repair report for ${sample.id}`,
          );
        }

        return;
      }

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
