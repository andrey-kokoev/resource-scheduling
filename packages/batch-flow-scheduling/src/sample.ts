import { compileBatchFlowDomain, type CompileBatchFlowResult } from './compiler.js';
import { buildBatchFlowSolution } from './solution.js';
import type {
  BatchFlowSolution,
  ChangeoverRule,
  ProcessorInstance,
  ProcessorType,
  Batch,
  BatchType,
} from './types.js';
import type { BatchFlowDomainModel } from './validation.js';

export interface BatchFlowSample {
  id: string;
  label: string;
  description: string;
  model: BatchFlowDomainModel;
}

export type BatchFlowSampleTransform = (model: BatchFlowDomainModel) => BatchFlowDomainModel;

function cloneModel(model: BatchFlowDomainModel): BatchFlowDomainModel {
  return structuredClone(model);
}

export function createBaseBatchFlowModel(): BatchFlowDomainModel {
  const processorTypes: ProcessorType[] = [
    { id: 'ptMix', name: 'Mixer' },
    { id: 'ptFill', name: 'Filler' },
  ];

  const processorInstances: ProcessorInstance[] = [
    { id: 'mx-1', name: 'Mixer 1', processorTypeId: 'ptMix', lineId: 'line-a', siteId: 'plant-a' },
    { id: 'fl-1', name: 'Filler 1', processorTypeId: 'ptFill', lineId: 'line-a', siteId: 'plant-a' },
  ];

  const batchTypes: BatchType[] = [
    {
      id: 'bt-juice',
      name: 'Juice Batch',
      route: [
        { id: 'mix', sequence: 1, name: 'Mix', processorTypeId: 'ptMix', durationMs: 60_000 },
        { id: 'fill', sequence: 2, name: 'Fill', processorTypeId: 'ptFill', durationMs: 30_000, maxLagMs: 15_000 },
      ],
    },
  ];

  const batches: Batch[] = [
    { id: 'batch-1', batchTypeId: 'bt-juice', releaseTimeMs: 0, dueTimeMs: 120_000, lotId: 'LOT-001' },
  ];

  const changeoverRules: ChangeoverRule[] = [
    {
      id: 'co-juice-self',
      processorTypeId: 'ptMix',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-juice',
      minGapMs: 5_000,
    },
  ];

  return {
    processorTypes,
    processorInstances,
    batchTypes,
    batches,
    changeoverRules,
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
      notes: 'Base sample schedule',
    },
  };
}

export const addSecondMixerAndSecondBatch: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  next.processorInstances.push({
    id: 'mx-2',
    name: 'Mixer 2',
    processorTypeId: 'ptMix',
    lineId: 'line-a',
    siteId: 'plant-a',
  });
  next.batchTypes.push({
    id: 'bt-sauce',
    name: 'Sauce Batch',
    route: [
      { id: 'blend', sequence: 1, name: 'Blend', processorTypeId: 'ptMix', durationMs: 45_000 },
    ],
  });
  next.batches.push({
    id: 'batch-2',
    batchTypeId: 'bt-sauce',
    releaseTimeMs: 10_000,
    dueTimeMs: 80_000,
    lotId: 'LOT-002',
  });
  next.changeoverRules = [
    ...(next.changeoverRules ?? []),
    {
      id: 'co-juice-to-sauce',
      processorTypeId: 'ptMix',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-sauce',
      minGapMs: 9_000,
    },
  ];
  return next;
};

export const tightenFillMaxLag: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  const juice = next.batchTypes.find(batchType => batchType.id === 'bt-juice');
  const mix = juice?.route.find(step => step.id === 'mix');
  if (mix) {
    mix.maxLagMs = 5_000;
  }
  if (next.schedule) {
    const fill = next.schedule.scheduledSteps.find(step => step.routeStepTemplateId === 'fill');
    if (fill) {
      fill.startMs = 70_000;
      fill.endMs = 100_000;
    }
    next.schedule.notes = 'Tighter max-lag sample schedule';
  }
  return next;
};

export function composeBatchFlowSampleModel(
  ...transforms: readonly BatchFlowSampleTransform[]
): BatchFlowDomainModel {
  return transforms.reduce(
    (current, transform) => transform(current),
    createBaseBatchFlowModel(),
  );
}

const SAMPLE_DEFINITIONS = [
  {
    id: 'base',
    label: 'Base single-batch flow',
    description: 'One juice batch across mix and fill, with a complete example schedule.',
    build: () => composeBatchFlowSampleModel(),
  },
  {
    id: 'multi-batch',
    label: 'Multi-batch / shared mixer',
    description: 'Adds a second batch, second mixer, and changeover rule to widen machine-local projection.',
    build: () => composeBatchFlowSampleModel(addSecondMixerAndSecondBatch),
  },
  {
    id: 'tight-max-lag',
    label: 'Tight max-lag pressure',
    description: 'Keeps the same route but tightens the fill lag to pressure temporal constraints.',
    build: () => composeBatchFlowSampleModel(tightenFillMaxLag),
  },
] as const;

export function listBatchFlowSamples(): BatchFlowSample[] {
  return SAMPLE_DEFINITIONS.map(definition => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    model: definition.build(),
  }));
}

export function createSampleBatchFlowModel(sampleId = 'base'): BatchFlowDomainModel {
  const sample = listBatchFlowSamples().find(entry => entry.id === sampleId);
  if (!sample) {
    throw new Error(`Unknown batch-flow sample: ${sampleId}`);
  }
  return sample.model;
}

export function compileSampleBatchFlow(sampleId = 'base'): CompileBatchFlowResult {
  return compileBatchFlowDomain(createSampleBatchFlowModel(sampleId));
}

export function buildSampleBatchFlowSolution(sampleId = 'base'): BatchFlowSolution {
  const model = createSampleBatchFlowModel(sampleId);
  const compiled = compileBatchFlowDomain(model);
  if (!compiled.ok) {
    throw new Error(
      `Sample batch-flow model failed to compile: ${compiled.errors.map(error => error.type).join(', ')}`,
    );
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
