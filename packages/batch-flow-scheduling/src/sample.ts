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
  expectedCompileOk: boolean;
  model: BatchFlowDomainModel;
}

export type BatchFlowSampleTransform = (model: BatchFlowDomainModel) => BatchFlowDomainModel;

function cloneModel(model: BatchFlowDomainModel): BatchFlowDomainModel {
  return structuredClone(model);
}

const MIN = 60_000;

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
        { id: 'mix', sequence: 1, name: 'Mix', processorTypeId: 'ptMix', durationMs: 10 * MIN },
        { id: 'fill', sequence: 2, name: 'Fill', processorTypeId: 'ptFill', durationMs: 5 * MIN, maxLagMs: 3 * MIN },
      ],
    },
  ];

  const batches: Batch[] = [
    { id: 'batch-1', batchTypeId: 'bt-juice', releaseTimeMs: 0, dueTimeMs: 30 * MIN, lotId: 'LOT-001' },
  ];

  const changeoverRules: ChangeoverRule[] = [
    {
      id: 'co-juice-self',
      processorTypeId: 'ptMix',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-juice',
      minGapMs: 1 * MIN,
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
          endMs: 10 * MIN,
        },
        {
          id: 'sched-b1-fill',
          batchId: 'batch-1',
          routeStepTemplateId: 'fill',
          processorInstanceId: 'fl-1',
          startMs: 11 * MIN,
          endMs: 16 * MIN,
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
      { id: 'blend', sequence: 1, name: 'Blend', processorTypeId: 'ptMix', durationMs: 8 * MIN },
    ],
  });
  next.batches.push({
    id: 'batch-2',
    batchTypeId: 'bt-sauce',
    releaseTimeMs: 2 * MIN,
    dueTimeMs: 24 * MIN,
    lotId: 'LOT-002',
  });
  next.changeoverRules = [
    ...(next.changeoverRules ?? []),
    {
      id: 'co-juice-to-sauce',
      processorTypeId: 'ptMix',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-sauce',
      minGapMs: 2 * MIN,
    },
  ];
  return next;
};

export const tightenFillMaxLag: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  const juice = next.batchTypes.find(batchType => batchType.id === 'bt-juice');
  const mix = juice?.route.find(step => step.id === 'mix');
  if (mix) {
    mix.maxLagMs = 1 * MIN;
  }
  if (next.schedule) {
    const fill = next.schedule.scheduledSteps.find(step => step.routeStepTemplateId === 'fill');
    if (fill) {
      fill.startMs = 12 * MIN;
      fill.endMs = 17 * MIN;
    }
    next.schedule.notes = 'Tighter max-lag sample schedule';
  }
  return next;
};

export const addSecondJuiceBatchSharingFiller: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  next.batches.push({
    id: 'batch-2',
    batchTypeId: 'bt-juice',
    releaseTimeMs: 4 * MIN,
    dueTimeMs: 40 * MIN,
    lotId: 'LOT-002',
  });

  if (next.schedule) {
    next.schedule.scheduledSteps.push(
      {
        id: 'sched-b2-mix',
        batchId: 'batch-2',
        routeStepTemplateId: 'mix',
        processorInstanceId: 'mx-1',
        startMs: 4 * MIN,
        endMs: 14 * MIN,
      },
      {
        id: 'sched-b2-fill',
        batchId: 'batch-2',
        routeStepTemplateId: 'fill',
        processorInstanceId: 'fl-1',
        startMs: 18 * MIN,
        endMs: 23 * MIN,
      },
    );
    next.schedule.notes = 'Two juice batches sharing one filler';
  }

  return next;
};

export const addSecondLineAndFiller: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  next.processorInstances.push({
    id: 'fl-2',
    name: 'Filler 2',
    processorTypeId: 'ptFill',
    lineId: 'line-b',
    siteId: 'plant-a',
  });
  next.batchTypes.push({
    id: 'bt-tonic',
    name: 'Tonic Batch',
    route: [
      { id: 'premix', sequence: 1, name: 'Premix', processorTypeId: 'ptMix', durationMs: 7 * MIN },
      { id: 'bottle', sequence: 2, name: 'Bottle', processorTypeId: 'ptFill', durationMs: 4 * MIN, maxLagMs: 2 * MIN },
    ],
  });
  next.batches.push({
    id: 'batch-3',
    batchTypeId: 'bt-tonic',
    releaseTimeMs: 1 * MIN,
    dueTimeMs: 28 * MIN,
    lotId: 'LOT-003',
  });

  if (next.schedule) {
    next.schedule.scheduledSteps.push(
      {
        id: 'sched-b3-premix',
        batchId: 'batch-3',
        routeStepTemplateId: 'premix',
        processorInstanceId: 'mx-1',
        startMs: 1 * MIN,
        endMs: 8 * MIN,
      },
      {
        id: 'sched-b3-bottle',
        batchId: 'batch-3',
        routeStepTemplateId: 'bottle',
        processorInstanceId: 'fl-2',
        startMs: 9 * MIN,
        endMs: 13 * MIN,
      },
    );
    next.schedule.notes = 'Second line filler and alternate product route';
  }

  return next;
};

export const addChangeoverPressureOnSingleMixer: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  next.batchTypes.push({
    id: 'bt-syrup',
    name: 'Syrup Batch',
    route: [
      { id: 'cook', sequence: 1, name: 'Cook', processorTypeId: 'ptMix', durationMs: 9 * MIN },
    ],
  });
  next.batches.push({
    id: 'batch-4',
    batchTypeId: 'bt-syrup',
    releaseTimeMs: 3 * MIN,
    dueTimeMs: 34 * MIN,
    lotId: 'LOT-004',
  });
  next.changeoverRules = [
    ...(next.changeoverRules ?? []),
    {
      id: 'co-juice-to-syrup',
      processorTypeId: 'ptMix',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-syrup',
      minGapMs: 3 * MIN,
    },
    {
      id: 'co-syrup-to-juice',
      processorTypeId: 'ptMix',
      fromBatchTypeId: 'bt-syrup',
      toBatchTypeId: 'bt-juice',
      minGapMs: 2 * MIN,
    },
  ];

  if (next.schedule) {
    next.schedule.scheduledSteps.push({
      id: 'sched-b4-cook',
      batchId: 'batch-4',
      routeStepTemplateId: 'cook',
      processorInstanceId: 'mx-1',
      startMs: 13 * MIN,
      endMs: 22 * MIN,
    });
    next.schedule.notes = 'Single mixer with asymmetric changeover pressure';
  }

  return next;
};

export const addInterleavingPlantScenario: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);

  next.processorTypes.push(
    { id: 'ptReact', name: 'Reactor' },
    { id: 'ptCool', name: 'Cooler' },
  );

  next.processorInstances.push(
    { id: 'rx-1', name: 'Reactor 1', processorTypeId: 'ptReact', lineId: 'line-a', siteId: 'plant-a' },
    { id: 'cl-1', name: 'Cooler 1', processorTypeId: 'ptCool', lineId: 'line-a', siteId: 'plant-a' },
    { id: 'mx-2', name: 'Mixer 2', processorTypeId: 'ptMix', lineId: 'line-b', siteId: 'plant-a' },
    { id: 'fl-2', name: 'Filler 2', processorTypeId: 'ptFill', lineId: 'line-b', siteId: 'plant-a' },
  );

  next.batchTypes.push(
    {
      id: 'bt-syrup',
      name: 'Syrup Batch',
      route: [
        { id: 'cook', sequence: 1, name: 'Cook', processorTypeId: 'ptReact', durationMs: 9 * MIN },
        { id: 'cool', sequence: 2, name: 'Cool', processorTypeId: 'ptCool', durationMs: 4 * MIN, maxLagMs: 3 * MIN },
        { id: 'bottle-syrup', sequence: 3, name: 'Bottle', processorTypeId: 'ptFill', durationMs: 4 * MIN, maxLagMs: 2 * MIN },
      ],
    },
    {
      id: 'bt-tonic',
      name: 'Tonic Batch',
      route: [
        { id: 'premix', sequence: 1, name: 'Premix', processorTypeId: 'ptMix', durationMs: 6 * MIN },
        { id: 'rest', sequence: 2, name: 'Rest', processorTypeId: 'ptCool', durationMs: 4 * MIN, maxLagMs: 2 * MIN },
        { id: 'bottle-tonic', sequence: 3, name: 'Bottle', processorTypeId: 'ptFill', durationMs: 4 * MIN, maxLagMs: 2 * MIN },
      ],
    },
  );

  next.batches.push(
    { id: 'batch-5', batchTypeId: 'bt-syrup', releaseTimeMs: 1 * MIN, dueTimeMs: 45 * MIN, lotId: 'LOT-005' },
    { id: 'batch-6', batchTypeId: 'bt-tonic', releaseTimeMs: 2 * MIN, dueTimeMs: 42 * MIN, lotId: 'LOT-006' },
  );

  next.changeoverRules = [
    ...(next.changeoverRules ?? []),
    {
      id: 'co-react-juice-syrup',
      processorTypeId: 'ptReact',
      fromBatchTypeId: 'bt-syrup',
      toBatchTypeId: 'bt-syrup',
      minGapMs: 1 * MIN,
    },
    {
      id: 'co-fill-juice-tonic',
      processorTypeId: 'ptFill',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-tonic',
      minGapMs: 1 * MIN,
    },
    {
      id: 'co-fill-tonic-syrup',
      processorTypeId: 'ptFill',
      fromBatchTypeId: 'bt-tonic',
      toBatchTypeId: 'bt-syrup',
      minGapMs: 2 * MIN,
    },
  ];

  if (next.schedule) {
    next.schedule.scheduledSteps.push(
      {
        id: 'sched-b5-cook',
        batchId: 'batch-5',
        routeStepTemplateId: 'cook',
        processorInstanceId: 'rx-1',
        startMs: 1 * MIN,
        endMs: 10 * MIN,
      },
      {
        id: 'sched-b5-cool',
        batchId: 'batch-5',
        routeStepTemplateId: 'cool',
        processorInstanceId: 'cl-1',
        startMs: 11 * MIN,
        endMs: 15 * MIN,
      },
      {
        id: 'sched-b5-bottle',
        batchId: 'batch-5',
        routeStepTemplateId: 'bottle-syrup',
        processorInstanceId: 'fl-2',
        startMs: 16 * MIN,
        endMs: 20 * MIN,
      },
      {
        id: 'sched-b6-premix',
        batchId: 'batch-6',
        routeStepTemplateId: 'premix',
        processorInstanceId: 'mx-2',
        startMs: 2 * MIN,
        endMs: 8 * MIN,
      },
      {
        id: 'sched-b6-rest',
        batchId: 'batch-6',
        routeStepTemplateId: 'rest',
        processorInstanceId: 'cl-1',
        startMs: 9 * MIN,
        endMs: 13 * MIN,
      },
      {
        id: 'sched-b6-bottle',
        batchId: 'batch-6',
        routeStepTemplateId: 'bottle-tonic',
        processorInstanceId: 'fl-1',
        startMs: 14 * MIN,
        endMs: 18 * MIN,
      },
    );
    next.schedule.notes = 'Interleaving plant example with multiple processor families and overlapping batch routes';
  }

  return next;
};

export const addExpandedMultiProductPlant: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);

  next.processorTypes.push(
    { id: 'ptReact', name: 'Reactor' },
    { id: 'ptCool', name: 'Cooler' },
    { id: 'ptPack', name: 'Packager' },
  );

  next.processorInstances.push(
    { id: 'rx-1', name: 'Reactor 1', processorTypeId: 'ptReact', lineId: 'line-a', siteId: 'plant-a' },
    { id: 'rx-2', name: 'Reactor 2', processorTypeId: 'ptReact', lineId: 'line-b', siteId: 'plant-a' },
    { id: 'cl-1', name: 'Cooler 1', processorTypeId: 'ptCool', lineId: 'line-a', siteId: 'plant-a' },
    { id: 'pk-1', name: 'Packager 1', processorTypeId: 'ptPack', lineId: 'line-a', siteId: 'plant-a' },
    { id: 'pk-2', name: 'Packager 2', processorTypeId: 'ptPack', lineId: 'line-b', siteId: 'plant-a' },
    { id: 'mx-2', name: 'Mixer 2', processorTypeId: 'ptMix', lineId: 'line-b', siteId: 'plant-a' },
    { id: 'fl-2', name: 'Filler 2', processorTypeId: 'ptFill', lineId: 'line-b', siteId: 'plant-a' },
  );

  next.batchTypes.push(
    {
      id: 'bt-syrup',
      name: 'Syrup Batch',
      route: [
        { id: 'cook', sequence: 1, name: 'Cook', processorTypeId: 'ptReact', durationMs: 9 * MIN },
        { id: 'cool', sequence: 2, name: 'Cool', processorTypeId: 'ptCool', durationMs: 4 * MIN, maxLagMs: 3 * MIN },
        { id: 'pack-syrup', sequence: 3, name: 'Pack', processorTypeId: 'ptPack', durationMs: 3 * MIN, maxLagMs: 2 * MIN },
      ],
    },
    {
      id: 'bt-tonic',
      name: 'Tonic Batch',
      route: [
        { id: 'premix', sequence: 1, name: 'Premix', processorTypeId: 'ptMix', durationMs: 6 * MIN },
        { id: 'rest', sequence: 2, name: 'Rest', processorTypeId: 'ptCool', durationMs: 3 * MIN, maxLagMs: 2 * MIN },
        { id: 'fill-tonic', sequence: 3, name: 'Fill', processorTypeId: 'ptFill', durationMs: 4 * MIN, maxLagMs: 2 * MIN },
      ],
    },
    {
      id: 'bt-concentrate',
      name: 'Concentrate Batch',
      route: [
        { id: 'react', sequence: 1, name: 'React', processorTypeId: 'ptReact', durationMs: 10 * MIN },
        { id: 'pack-concentrate', sequence: 2, name: 'Pack', processorTypeId: 'ptPack', durationMs: 4 * MIN, maxLagMs: 1 * MIN },
      ],
    },
  );

  next.batches.push(
    { id: 'batch-7', batchTypeId: 'bt-syrup', releaseTimeMs: 1 * MIN, dueTimeMs: 52 * MIN, lotId: 'LOT-007' },
    { id: 'batch-8', batchTypeId: 'bt-tonic', releaseTimeMs: 3 * MIN, dueTimeMs: 46 * MIN, lotId: 'LOT-008' },
    { id: 'batch-9', batchTypeId: 'bt-concentrate', releaseTimeMs: 4 * MIN, dueTimeMs: 55 * MIN, lotId: 'LOT-009' },
  );

  next.changeoverRules = [
    ...(next.changeoverRules ?? []),
    {
      id: 'co-react-syrup-concentrate',
      processorTypeId: 'ptReact',
      fromBatchTypeId: 'bt-syrup',
      toBatchTypeId: 'bt-concentrate',
      minGapMs: 2 * MIN,
    },
    {
      id: 'co-pack-syrup-concentrate',
      processorTypeId: 'ptPack',
      fromBatchTypeId: 'bt-syrup',
      toBatchTypeId: 'bt-concentrate',
      minGapMs: 1 * MIN,
    },
    {
      id: 'co-fill-juice-tonic-2',
      processorTypeId: 'ptFill',
      fromBatchTypeId: 'bt-juice',
      toBatchTypeId: 'bt-tonic',
      minGapMs: 1 * MIN,
    },
  ];

  if (next.schedule) {
    next.schedule.scheduledSteps.push(
      {
        id: 'sched-b7-cook',
        batchId: 'batch-7',
        routeStepTemplateId: 'cook',
        processorInstanceId: 'rx-1',
        startMs: 1 * MIN,
        endMs: 10 * MIN,
      },
      {
        id: 'sched-b7-cool',
        batchId: 'batch-7',
        routeStepTemplateId: 'cool',
        processorInstanceId: 'cl-1',
        startMs: 11 * MIN,
        endMs: 15 * MIN,
      },
      {
        id: 'sched-b7-pack',
        batchId: 'batch-7',
        routeStepTemplateId: 'pack-syrup',
        processorInstanceId: 'pk-1',
        startMs: 16 * MIN,
        endMs: 19 * MIN,
      },
      {
        id: 'sched-b8-premix',
        batchId: 'batch-8',
        routeStepTemplateId: 'premix',
        processorInstanceId: 'mx-2',
        startMs: 3 * MIN,
        endMs: 9 * MIN,
      },
      {
        id: 'sched-b8-rest',
        batchId: 'batch-8',
        routeStepTemplateId: 'rest',
        processorInstanceId: 'cl-1',
        startMs: 10 * MIN,
        endMs: 13 * MIN,
      },
      {
        id: 'sched-b8-fill',
        batchId: 'batch-8',
        routeStepTemplateId: 'fill-tonic',
        processorInstanceId: 'fl-2',
        startMs: 14 * MIN,
        endMs: 18 * MIN,
      },
      {
        id: 'sched-b9-react',
        batchId: 'batch-9',
        routeStepTemplateId: 'react',
        processorInstanceId: 'rx-2',
        startMs: 4 * MIN,
        endMs: 14 * MIN,
      },
      {
        id: 'sched-b9-pack',
        batchId: 'batch-9',
        routeStepTemplateId: 'pack-concentrate',
        processorInstanceId: 'pk-2',
        startMs: 16 * MIN,
        endMs: 20 * MIN,
      },
    );
    next.schedule.notes = 'Expanded multiproduct plant with reactor, cooler, filler, and packager interleaving';
  }

  return next;
};

export const breakProcessorAssignment: BatchFlowSampleTransform = model => {
  const next = cloneModel(model);
  if (next.schedule) {
    const mix = next.schedule.scheduledSteps.find(step => step.routeStepTemplateId === 'mix');
    if (mix) {
      mix.processorInstanceId = 'fl-1';
    }
    next.schedule.notes = 'Invalid sample with processor-type mismatch';
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
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(),
  },
  {
    id: 'multi-batch',
    label: 'Multi-batch / shared mixer',
    description: 'Adds a second batch, second mixer, and changeover rule to widen machine-local projection.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(addSecondMixerAndSecondBatch),
  },
  {
    id: 'tight-max-lag',
    label: 'Tight max-lag pressure',
    description: 'Keeps the same route but tightens the fill lag to pressure temporal constraints.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(tightenFillMaxLag),
  },
  {
    id: 'shared-filler',
    label: 'Shared filler bottleneck',
    description: 'Adds a second juice batch that must share the same filler, increasing machine no-overlap pressure.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(addSecondJuiceBatchSharingFiller),
  },
  {
    id: 'second-line',
    label: 'Second line / alternate product',
    description: 'Adds a second filler line and a second batch type to widen machine eligibility and route diversity.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(addSecondLineAndFiller),
  },
  {
    id: 'changeover-pressure',
    label: 'Single-mixer changeover pressure',
    description: 'Adds a second product on the same mixer with asymmetric changeover rules, so transition costs and no-overlap pressure become visibly nontrivial together.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(addChangeoverPressureOnSingleMixer),
  },
  {
    id: 'interleaving-plant',
    label: 'Interleaving plant flow',
    description: 'Multiple batch types, processor families, and overlapping batch routes interleave across mixers, coolers, reactors, and fillers.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(addInterleavingPlantScenario),
  },
  {
    id: 'expanded-multiproduct-plant',
    label: 'Expanded multiproduct plant',
    description: 'A larger plant example with reactors, coolers, packagers, fillers, multiple lines, and several interleaving product routes.',
    expectedCompileOk: true,
    build: () => composeBatchFlowSampleModel(addExpandedMultiProductPlant),
  },
  {
    id: 'invalid-machine-assignment',
    label: 'Invalid machine assignment',
    description: 'Intentionally assigns a mix step to a filler machine so the validation boundary is visible.',
    expectedCompileOk: false,
    build: () => composeBatchFlowSampleModel(breakProcessorAssignment),
  },
] as const;

export function listBatchFlowSamples(): BatchFlowSample[] {
  return SAMPLE_DEFINITIONS.map(definition => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    expectedCompileOk: definition.expectedCompileOk,
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
