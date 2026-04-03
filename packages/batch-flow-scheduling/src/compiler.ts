import { deriveConstraintModel } from './constraint-model.js';
import { deriveBatchFlowModel } from './derived.js';
import { deriveSolverGraph, type SolverGraph } from './solver-graph.js';
import {
  validateBatchFlowDomain,
  type BatchFlowDomainModel,
  type ValidationError,
} from './validation.js';
import type { ConcreteBatchStep, ConstraintModel } from './types.js';

export interface CompiledBatchFlowDomain {
  concreteBatchSteps: ConcreteBatchStep[];
  solverGraph: SolverGraph;
  constraintModel: ConstraintModel;
}

export type CompileBatchFlowResult =
  | {
      ok: true;
      compiled: CompiledBatchFlowDomain;
    }
  | {
      ok: false;
      errors: ValidationError[];
    };

export function compileBatchFlowDomain(
  model: BatchFlowDomainModel,
): CompileBatchFlowResult {
  const validation = validateBatchFlowDomain(model);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors,
    };
  }

  const derived = deriveBatchFlowModel(model.batchTypes, model.batches);
  const solverGraph = deriveSolverGraph(
    derived.concreteBatchSteps,
    model.processorInstances,
    model.changeoverRules ?? [],
  );
  const constraintModel = deriveConstraintModel(solverGraph);

  return {
    ok: true,
    compiled: {
      concreteBatchSteps: derived.concreteBatchSteps,
      solverGraph,
      constraintModel,
    },
  };
}
