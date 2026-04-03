import type { Batch, BatchType, ConcreteBatchStep, Id } from './types.js';

export interface BatchFlowDerivedModel {
  concreteBatchSteps: ConcreteBatchStep[];
}

export function deriveConcreteBatchSteps(
  batchTypes: readonly BatchType[],
  batches: readonly Batch[],
): ConcreteBatchStep[] {
  const batchTypeMap = new Map<Id, BatchType>(batchTypes.map(item => [item.id, item]));
  const result: ConcreteBatchStep[] = [];

  for (const batch of batches) {
    const batchType = batchTypeMap.get(batch.batchTypeId);
    if (!batchType) {
      continue;
    }

    for (const routeStep of batchType.route) {
      result.push({
        id: createConcreteBatchStepId(batch.id, routeStep.id),
        batchId: batch.id,
        batchTypeId: batch.batchTypeId,
        routeStepTemplateId: routeStep.id,
        sequence: routeStep.sequence,
        name: routeStep.name,
        durationMs: routeStep.durationMs,
        requiredProcessorTypeId: routeStep.processorTypeId,
        releaseTimeMs: batch.releaseTimeMs,
        dueTimeMs: batch.dueTimeMs,
        maxLagMs: routeStep.maxLagMs,
      });
    }
  }

  return result;
}

export function deriveBatchFlowModel(
  batchTypes: readonly BatchType[],
  batches: readonly Batch[],
): BatchFlowDerivedModel {
  return {
    concreteBatchSteps: deriveConcreteBatchSteps(batchTypes, batches),
  };
}

export function createConcreteBatchStepId(batchId: Id, routeStepTemplateId: Id): Id {
  return `cbs:${batchId}:${routeStepTemplateId}`;
}
