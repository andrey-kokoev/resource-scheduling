import { compileBatchFlowDomain, type CompileBatchFlowResult } from './compiler.js';
import { buildBatchFlowSolution } from './solution.js';
import type {
  BatchFlowSolution,
  BatchSchedule,
  ChangeoverRule,
  ProcessorInstance,
  ProcessorType,
  Batch,
  BatchType,
} from './types.js';
import type { BatchFlowDomainModel } from './validation.js';

export interface BatchFlowSample {
  processorTypes: ProcessorType[];
  processorInstances: ProcessorInstance[];
  batchTypes: BatchType[];
  batches: Batch[];
  changeoverRules: ChangeoverRule[];
  schedule: BatchSchedule;
}

export function createSampleBatchFlowModel(): BatchFlowDomainModel {
  return {
    processorTypes: [
      { id: 'ptMix', name: 'Mixer' },
      { id: 'ptFill', name: 'Filler' },
    ],
    processorInstances: [
      { id: 'mx-1', name: 'Mixer 1', processorTypeId: 'ptMix', lineId: 'line-a', siteId: 'plant-a' },
      { id: 'fl-1', name: 'Filler 1', processorTypeId: 'ptFill', lineId: 'line-a', siteId: 'plant-a' },
    ],
    batchTypes: [
      {
        id: 'bt-juice',
        name: 'Juice Batch',
        route: [
          { id: 'mix', sequence: 1, name: 'Mix', processorTypeId: 'ptMix', durationMs: 60_000 },
          { id: 'fill', sequence: 2, name: 'Fill', processorTypeId: 'ptFill', durationMs: 30_000, maxLagMs: 15_000 },
        ],
      },
    ],
    batches: [
      { id: 'batch-1', batchTypeId: 'bt-juice', releaseTimeMs: 0, dueTimeMs: 120_000, lotId: 'LOT-001' },
    ],
    changeoverRules: [
      {
        id: 'co-juice-self',
        processorTypeId: 'ptMix',
        fromBatchTypeId: 'bt-juice',
        toBatchTypeId: 'bt-juice',
        minGapMs: 5_000,
      },
    ],
    schedule: {
      id: 'schedule-sample',
      status: 'complete',
      scheduledSteps: [
        {
          id: 'sched-b1-mix',
          batchId: 'batch-1',
          routeStepTemplateId: 'mix',
          processorInstanceId: 'mx-1',
          startMs: 0,
          endMs: 60_000,
        },
        {
          id: 'sched-b1-fill',
          batchId: 'batch-1',
          routeStepTemplateId: 'fill',
          processorInstanceId: 'fl-1',
          startMs: 65_000,
          endMs: 95_000,
        },
      ],
      notes: 'First-pass sample schedule',
    },
  };
}

export function createSampleBatchFlow(): BatchFlowSample {
  const model = createSampleBatchFlowModel();
  return {
    processorTypes: model.processorTypes,
    processorInstances: model.processorInstances,
    batchTypes: model.batchTypes,
    batches: model.batches,
    changeoverRules: model.changeoverRules ?? [],
    schedule: model.schedule!,
  };
}

export function compileSampleBatchFlow(): CompileBatchFlowResult {
  return compileBatchFlowDomain(createSampleBatchFlowModel());
}

export function buildSampleBatchFlowSolution(): BatchFlowSolution {
  const model = createSampleBatchFlowModel();
  const compiled = compileBatchFlowDomain(model);
  if (!compiled.ok) {
    throw new Error(`Sample batch-flow model failed to compile: ${compiled.errors.map(error => error.type).join(', ')}`);
  }

  if (!model.schedule) {
    throw new Error('Sample batch-flow model is missing schedule data');
  }

  return buildBatchFlowSolution(
    model.schedule,
    compiled.compiled.concreteBatchSteps,
    model.processorInstances,
  );
}
