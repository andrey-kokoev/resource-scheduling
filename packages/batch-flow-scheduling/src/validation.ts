import type {
  Batch,
  BatchSchedule,
  BatchType,
  ChangeoverRule,
  Id,
  ProcessorInstance,
  ProcessorType,
} from './types.js';

export type ValidationErrorType =
  | 'duplicate-id'
  | 'invalid-route-sequence'
  | 'invalid-duration'
  | 'unknown-reference'
  | 'duplicate-scheduled-batch-step'
  | 'invalid-scheduled-time'
  | 'processor-type-mismatch';

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  id?: Id;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface BatchFlowDomainModel {
  processorTypes: ProcessorType[];
  processorInstances: ProcessorInstance[];
  batchTypes: BatchType[];
  batches: Batch[];
  changeoverRules?: ChangeoverRule[];
  schedule?: BatchSchedule;
}

export function validateBatchFlowDomain(model: BatchFlowDomainModel): ValidationResult {
  const errors: ValidationError[] = [];

  assertUniqueIds(model.processorTypes, 'processorTypes', errors);
  assertUniqueIds(model.processorInstances, 'processorInstances', errors);
  assertUniqueIds(model.batchTypes, 'batchTypes', errors);
  assertUniqueIds(model.batches, 'batches', errors);

  const processorTypeIds = new Set(model.processorTypes.map(item => item.id));
  const batchTypeMap = new Map(model.batchTypes.map(item => [item.id, item]));
  const processorInstanceMap = new Map(model.processorInstances.map(item => [item.id, item]));
  const batchMap = new Map(model.batches.map(item => [item.id, item]));

  for (const instance of model.processorInstances) {
    if (!processorTypeIds.has(instance.processorTypeId)) {
      errors.push({
        type: 'unknown-reference',
        id: instance.id,
        message: `Processor instance ${instance.id} references unknown processor type ${instance.processorTypeId}.`,
      });
    }
  }

  for (const batch of model.batches) {
    if (!batchTypeMap.has(batch.batchTypeId)) {
      errors.push({
        type: 'unknown-reference',
        id: batch.id,
        message: `Batch ${batch.id} references unknown batch type ${batch.batchTypeId}.`,
      });
    }
  }

  for (const batchType of model.batchTypes) {
    validateRoute(batchType, processorTypeIds, errors);
  }

  if (model.schedule) {
    validateSchedule(model.schedule, batchMap, batchTypeMap, processorInstanceMap, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertUniqueIds(items: { id: Id }[], label: string, errors: ValidationError[]) {
  const seen = new Set<Id>();
  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push({
        type: 'duplicate-id',
        id: item.id,
        message: `Duplicate id ${item.id} in ${label}.`,
      });
      continue;
    }
    seen.add(item.id);
  }
}

function validateRoute(batchType: BatchType, processorTypeIds: Set<Id>, errors: ValidationError[]) {
  const routeStepIds = new Set<Id>();

  for (let i = 0; i < batchType.route.length; i += 1) {
    const step = batchType.route[i];
    if (routeStepIds.has(step.id)) {
      errors.push({
        type: 'duplicate-id',
        id: step.id,
        message: `Batch type ${batchType.id} has duplicate route step id ${step.id}.`,
      });
    } else {
      routeStepIds.add(step.id);
    }

    if (step.durationMs < 0) {
      errors.push({
        type: 'invalid-duration',
        id: step.id,
        message: `Route step ${step.id} has negative duration ${step.durationMs}.`,
      });
    }

    if (!processorTypeIds.has(step.processorTypeId)) {
      errors.push({
        type: 'unknown-reference',
        id: step.id,
        message: `Route step ${step.id} references unknown processor type ${step.processorTypeId}.`,
      });
    }

    if (i > 0) {
      const previous = batchType.route[i - 1];
      if (step.sequence <= previous.sequence) {
        errors.push({
          type: 'invalid-route-sequence',
          id: step.id,
          message: `Route step ${step.id} must have strictly increasing sequence after ${previous.id}.`,
        });
      }
    }
  }
}

function validateSchedule(
  schedule: BatchSchedule,
  batchMap: Map<Id, Batch>,
  batchTypeMap: Map<Id, BatchType>,
  processorInstanceMap: Map<Id, ProcessorInstance>,
  errors: ValidationError[],
) {
  const seenRefs = new Set<string>();

  for (const step of schedule.scheduledSteps) {
    const refKey = `${step.batchId}::${step.routeStepTemplateId}`;
    if (seenRefs.has(refKey)) {
      errors.push({
        type: 'duplicate-scheduled-batch-step',
        id: step.id,
        message: `Schedule ${schedule.id} has more than one scheduled fact for batch step ${refKey}.`,
      });
    } else {
      seenRefs.add(refKey);
    }

    if (step.endMs < step.startMs) {
      errors.push({
        type: 'invalid-scheduled-time',
        id: step.id,
        message: `Scheduled batch step ${step.id} has end before start.`,
      });
    }

    const batch = batchMap.get(step.batchId);
    if (!batch) {
      errors.push({
        type: 'unknown-reference',
        id: step.id,
        message: `Scheduled batch step ${step.id} references unknown batch ${step.batchId}.`,
      });
      continue;
    }

    const batchType = batchTypeMap.get(batch.batchTypeId);
    if (!batchType) {
      errors.push({
        type: 'unknown-reference',
        id: step.id,
        message: `Scheduled batch step ${step.id} references batch ${batch.id} whose batch type is unknown.`,
      });
      continue;
    }

    const routeStep = batchType.route.find(item => item.id === step.routeStepTemplateId);
    if (!routeStep) {
      errors.push({
        type: 'unknown-reference',
        id: step.id,
        message: `Scheduled batch step ${step.id} references unknown route step ${step.routeStepTemplateId} for batch ${batch.id}.`,
      });
      continue;
    }

    const processorInstance = processorInstanceMap.get(step.processorInstanceId);
    if (!processorInstance) {
      errors.push({
        type: 'unknown-reference',
        id: step.id,
        message: `Scheduled batch step ${step.id} references unknown processor instance ${step.processorInstanceId}.`,
      });
      continue;
    }

    if (processorInstance.processorTypeId !== routeStep.processorTypeId) {
      errors.push({
        type: 'processor-type-mismatch',
        id: step.id,
        message:
          `Scheduled batch step ${step.id} assigns processor instance ${processorInstance.id} ` +
          `of type ${processorInstance.processorTypeId} to route step ${routeStep.id} ` +
          `which requires ${routeStep.processorTypeId}.`,
      });
    }
  }
}
