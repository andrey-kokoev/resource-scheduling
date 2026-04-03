import assert from 'node:assert/strict';
import { evaluateScenario } from './evaluator.mjs';
import { hydrateScenario, sampleScenarios } from './scenario.mjs';

async function main() {
  for (const sample of sampleScenarios) {
    const evaluation = await evaluateScenario(hydrateScenario(sample.scenario));

    assert.equal(evaluation.result.feasible, sample.expected.feasible, sample.id);

    if (sample.expected.feasible) {
      if (evaluation.output.kind === 'feasible') {
        assert.equal(evaluation.output.assignments.length, sample.expected.assignments ?? sample.scenario.needs.length, sample.id);
      }
      continue;
    }

    if (evaluation.output.kind === 'infeasible') {
      assert.ok(
        evaluation.output.explanations.some(exp => exp.type === sample.expected.cue),
        `Expected ${sample.expected.cue} explanation for ${sample.id}`,
      );
    }
  }

  console.log(`Playground scenario validation passed for ${sampleScenarios.length} samples.`);
}

await main();
