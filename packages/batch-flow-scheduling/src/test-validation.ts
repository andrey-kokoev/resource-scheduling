import test from 'node:test';
import assert from 'node:assert/strict';

import {
  composeBatchFlowSampleModel,
  buildSampleBatchFlowSolution,
  compileSampleBatchFlow,
  createBaseBatchFlowModel,
  createSampleBatchFlowModel,
  listBatchFlowSamples,
  addSecondMixerAndSecondBatch,
  tightenFillMaxLag,
} from './sample.js';
import { buildBatchFlowSolution } from './solution.js';
import { compileBatchFlowDomain } from './compiler.js';
import { deriveConstraintModel } from './constraint-model.js';
import type { BatchFlowDomainModel } from './validation.js';
import { deriveConcreteBatchSteps } from './derived.js';
import {
  deriveBatchTemporalEdges,
  deriveMachineNoOverlapPairs,
  deriveSolverGraph,
  deriveSolverNodes,
} from './solver-graph.js';
import { validateBatchFlowDomain } from './validation.js';

function createValidModel(): BatchFlowDomainModel {
  return {
    processorTypes: [
      { id: 'ptMix', name: 'Mixer' },
      { id: 'ptFill', name: 'Filler' },
    ],
    processorInstances: [
      { id: 'm1', name: 'Mixer 1', processorTypeId: 'ptMix' },
      { id: 'f1', name: 'Filler 1', processorTypeId: 'ptFill' },
    ],
    batchTypes: [
      {
        id: 'bt1',
        name: 'Juice Batch',
        route: [
          { id: 'rs1', sequence: 1, name: 'Mix', processorTypeId: 'ptMix', durationMs: 60_000 },
          { id: 'rs2', sequence: 2, name: 'Fill', processorTypeId: 'ptFill', durationMs: 30_000 },
        ],
      },
    ],
    batches: [
      { id: 'b1', batchTypeId: 'bt1' },
    ],
    changeoverRules: [
      {
        id: 'co1',
        processorTypeId: 'ptMix',
        fromBatchTypeId: 'bt1',
        toBatchTypeId: 'bt1',
        minGapMs: 5_000,
      },
    ],
    schedule: {
      id: 'sch1',
      status: 'partial',
      scheduledSteps: [
        {
          id: 'sbs1',
          batchId: 'b1',
          routeStepTemplateId: 'rs1',
          processorInstanceId: 'm1',
          startMs: 0,
          endMs: 60_000,
        },
      ],
    },
  };
}

test('validateBatchFlowDomain accepts a valid first-pass model', () => {
  const result = validateBatchFlowDomain(createValidModel());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateBatchFlowDomain rejects invalid route sequence and processor mismatch', () => {
  const model = createValidModel();
  model.batchTypes[0].route[1].sequence = 1;
  model.schedule!.scheduledSteps[0].processorInstanceId = 'f1';

  const result = validateBatchFlowDomain(model);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.type === 'invalid-route-sequence'));
  assert.ok(result.errors.some(error => error.type === 'processor-type-mismatch'));
});

test('deriveConcreteBatchSteps deterministically expands Batch × route', () => {
  const model = createValidModel();

  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);

  assert.deepEqual(
    concrete.map(step => ({
      id: step.id,
      batchId: step.batchId,
      routeStepTemplateId: step.routeStepTemplateId,
      sequence: step.sequence,
      requiredProcessorTypeId: step.requiredProcessorTypeId,
    })),
    [
      {
        id: 'cbs:b1:rs1',
        batchId: 'b1',
        routeStepTemplateId: 'rs1',
        sequence: 1,
        requiredProcessorTypeId: 'ptMix',
      },
      {
        id: 'cbs:b1:rs2',
        batchId: 'b1',
        routeStepTemplateId: 'rs2',
        sequence: 2,
        requiredProcessorTypeId: 'ptFill',
      },
    ],
  );
});

test('deriveSolverNodes attaches eligible machines by processor type', () => {
  const model = createValidModel();
  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);

  const nodes = deriveSolverNodes(concrete, model.processorInstances);

  assert.deepEqual(
    nodes.map(node => ({
      id: node.id,
      requiredProcessorTypeId: node.requiredProcessorTypeId,
      eligibleMachineIds: node.eligibleMachineIds,
    })),
    [
      {
        id: 'cbs:b1:rs1',
        requiredProcessorTypeId: 'ptMix',
        eligibleMachineIds: ['m1'],
      },
      {
        id: 'cbs:b1:rs2',
        requiredProcessorTypeId: 'ptFill',
        eligibleMachineIds: ['f1'],
      },
    ],
  );
});

test('deriveBatchTemporalEdges creates adjacency edges with min gap zero and route max lag', () => {
  const model = createValidModel();
  model.batchTypes[0].route[0].maxLagMs = 15_000;
  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);

  const edges = deriveBatchTemporalEdges(concrete);

  assert.deepEqual(edges, [
    {
      fromNodeId: 'cbs:b1:rs1',
      toNodeId: 'cbs:b1:rs2',
      minGapMs: 0,
      maxGapMs: 15_000,
    },
  ]);
});

test('deriveSolverGraph combines nodes and batch-local temporal edges', () => {
  const model = createValidModel();
  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);

  const graph = deriveSolverGraph(concrete, model.processorInstances, model.changeoverRules);

  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.batchTemporalEdges.length, 1);
  assert.equal(graph.machineCapacityGroups.length, 2);
  assert.ok(graph.machineTransitionCosts.length >= 0);
  assert.equal(graph.machineNoOverlapPairs.length, 0);
});

test('deriveMachineCapacityGroups groups eligible nodes by machine', () => {
  const model = createValidModel();
  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);
  const graph = deriveSolverGraph(concrete, model.processorInstances, model.changeoverRules);

  assert.deepEqual(graph.machineCapacityGroups, [
    { machineId: 'm1', eligibleNodeIds: ['cbs:b1:rs1'] },
    { machineId: 'f1', eligibleNodeIds: ['cbs:b1:rs2'] },
  ]);
});

test('deriveMachineTransitionCosts applies changeover rules on eligible machine/node pairs', () => {
  const model = createValidModel();
  model.processorInstances.push({ id: 'm2', name: 'Mixer 2', processorTypeId: 'ptMix' });
  model.batchTypes.push({
    id: 'bt2',
    name: 'Sauce Batch',
    route: [
      { id: 'rsA', sequence: 1, name: 'Blend', processorTypeId: 'ptMix', durationMs: 45_000 },
    ],
  });
  model.batches.push({ id: 'b2', batchTypeId: 'bt2' });
  model.changeoverRules!.push({
    id: 'co2',
    processorTypeId: 'ptMix',
    fromBatchTypeId: 'bt1',
    toBatchTypeId: 'bt2',
    minGapMs: 9_000,
  });

  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);
  const graph = deriveSolverGraph(concrete, model.processorInstances, model.changeoverRules);

  const cost = graph.machineTransitionCosts.find(item =>
    item.machineId === 'm1' &&
    item.fromNodeId === 'cbs:b1:rs1' &&
    item.toNodeId === 'cbs:b2:rsA',
  );

  assert.deepEqual(cost, {
    machineId: 'm1',
    fromNodeId: 'cbs:b1:rs1',
    toNodeId: 'cbs:b2:rsA',
    minGapMs: 9_000,
  });
});

test('deriveMachineNoOverlapPairs projects pairwise machine no-overlap choices', () => {
  const model = createValidModel();
  model.processorInstances.push({ id: 'm2', name: 'Mixer 2', processorTypeId: 'ptMix' });
  model.batchTypes.push({
    id: 'bt2',
    name: 'Sauce Batch',
    route: [
      { id: 'rsA', sequence: 1, name: 'Blend', processorTypeId: 'ptMix', durationMs: 45_000 },
    ],
  });
  model.batches.push({ id: 'b2', batchTypeId: 'bt2' });

  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);
  const nodes = deriveSolverNodes(concrete, model.processorInstances);
  const pairs = deriveMachineNoOverlapPairs(nodes, model.processorInstances);

  assert.deepEqual(
    pairs.filter(pair => pair.machineId === 'm1'),
    [
      {
        machineId: 'm1',
        leftNodeId: 'cbs:b1:rs1',
        rightNodeId: 'cbs:b2:rsA',
      },
    ],
  );
  assert.deepEqual(
    pairs.filter(pair => pair.machineId === 'm2'),
    [
      {
        machineId: 'm2',
        leftNodeId: 'cbs:b1:rs1',
        rightNodeId: 'cbs:b2:rsA',
      },
    ],
  );
});

test('deriveConstraintModel exports neutral variables and constraints from the solver graph', () => {
  const model = createValidModel();
  model.processorInstances.push({ id: 'm2', name: 'Mixer 2', processorTypeId: 'ptMix' });
  model.batchTypes.push({
    id: 'bt2',
    name: 'Sauce Batch',
    route: [
      { id: 'rsA', sequence: 1, name: 'Blend', processorTypeId: 'ptMix', durationMs: 45_000 },
    ],
  });
  model.batches.push({ id: 'b2', batchTypeId: 'bt2' });
  model.batchTypes[0].route[0].maxLagMs = 15_000;

  const concrete = deriveConcreteBatchSteps(model.batchTypes, model.batches);
  const graph = deriveSolverGraph(concrete, model.processorInstances, model.changeoverRules);
  const constraintModel = deriveConstraintModel(graph);

  assert.ok(
    constraintModel.variables.some(
      variable => variable.kind === 'node-start' && variable.nodeId === 'cbs:b1:rs1',
    ),
  );
  assert.ok(
    constraintModel.variables.some(
      variable =>
        variable.kind === 'machine-assignment' &&
        variable.nodeId === 'cbs:b1:rs1' &&
        variable.machineId === 'm1',
    ),
  );
  assert.ok(
    constraintModel.variables.some(
      variable =>
        variable.kind === 'machine-ordering' &&
        variable.machineId === 'm1' &&
        variable.leftNodeId === 'cbs:b1:rs1' &&
        variable.rightNodeId === 'cbs:b2:rsA',
    ),
  );

  assert.ok(
    constraintModel.constraints.some(
      constraint =>
        constraint.kind === 'duration' &&
        constraint.nodeId === 'cbs:b1:rs1' &&
        constraint.durationMs === 60_000,
    ),
  );
  assert.ok(
    constraintModel.constraints.some(
      constraint =>
        constraint.kind === 'exactly-one-machine' &&
        constraint.nodeId === 'cbs:b1:rs1',
    ),
  );
  assert.ok(
    constraintModel.constraints.some(
      constraint =>
        constraint.kind === 'batch-temporal-max-gap' &&
        constraint.fromNodeId === 'cbs:b1:rs1' &&
        constraint.toNodeId === 'cbs:b1:rs2' &&
        constraint.maxGapMs === 15_000,
    ),
  );
  assert.ok(
    constraintModel.constraints.some(
      constraint =>
        constraint.kind === 'machine-no-overlap-choice' &&
        constraint.machineId === 'm1' &&
        constraint.leftNodeId === 'cbs:b1:rs1' &&
        constraint.rightNodeId === 'cbs:b2:rsA',
    ),
  );
});

test('compileBatchFlowDomain returns one public compiled result on valid input', () => {
  const model = createValidModel();

  const result = compileBatchFlowDomain(model);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.compiled.concreteBatchSteps.length, 2);
  assert.equal(result.compiled.solverGraph.nodes.length, 2);
  assert.equal(result.compiled.solverGraph.batchTemporalEdges.length, 1);
  assert.equal(result.compiled.solverGraph.machineNoOverlapPairs.length, 0);
  assert.ok(result.compiled.constraintModel.variables.length > 0);
  assert.ok(result.compiled.constraintModel.constraints.length > 0);
});

test('buildBatchFlowSolution derives a stable output shape from a concrete schedule', () => {
  const model = createValidModel();
  model.schedule!.scheduledSteps.push({
    id: 'sbs2',
    batchId: 'b1',
    routeStepTemplateId: 'rs2',
    processorInstanceId: 'f1',
    startMs: 61_000,
    endMs: 91_000,
  });

  const compiled = compileBatchFlowDomain(model);
  assert.equal(compiled.ok, true);
  if (!compiled.ok) return;

  const solution = buildBatchFlowSolution(
    model.schedule!,
    compiled.compiled.concreteBatchSteps,
    model.processorInstances,
  );

  assert.equal(solution.scheduleId, 'sch1');
  assert.equal(solution.status, 'partial');
  assert.deepEqual(
    solution.scheduledSteps.map(step => ({
      id: step.id,
      batchTypeId: step.batchTypeId,
      routeStepName: step.routeStepName,
      sequence: step.sequence,
      processorTypeId: step.processorTypeId,
    })),
    [
      {
        id: 'sbs1',
        batchTypeId: 'bt1',
        routeStepName: 'Mix',
        sequence: 1,
        processorTypeId: 'ptMix',
      },
      {
        id: 'sbs2',
        batchTypeId: 'bt1',
        routeStepName: 'Fill',
        sequence: 2,
        processorTypeId: 'ptFill',
      },
    ],
  );
  assert.deepEqual(
    solution.machineTimelines.map(item => ({
      machineId: item.machineId,
      stepId: item.stepId,
      routeStepName: item.routeStepName,
      startMs: item.startMs,
      endMs: item.endMs,
    })),
    [
      {
        machineId: 'f1',
        stepId: 'sbs2',
        routeStepName: 'Fill',
        startMs: 61_000,
        endMs: 91_000,
      },
      {
        machineId: 'm1',
        stepId: 'sbs1',
        routeStepName: 'Mix',
        startMs: 0,
        endMs: 60_000,
      },
    ],
  );
});

test('compileBatchFlowDomain returns validation errors on invalid input', () => {
  const model = createValidModel();
  model.batchTypes[0].route[1].sequence = 1;

  const result = compileBatchFlowDomain(model);

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.ok(result.errors.some(error => error.type === 'invalid-route-sequence'));
});

test('sample flow compiles and yields a stable solution shape', () => {
  const compiled = compileSampleBatchFlow();

  assert.equal(compiled.ok, true);
  if (!compiled.ok) return;

  const model = createSampleBatchFlowModel();
  const solution = buildSampleBatchFlowSolution();

  assert.equal(compiled.compiled.concreteBatchSteps.length, 2);
  assert.equal(compiled.compiled.solverGraph.nodes.length, 2);
  assert.equal(solution.scheduleId, model.schedule!.id);
  assert.deepEqual(
    solution.machineTimelines.map(item => ({
      machineId: item.machineId,
      routeStepName: item.routeStepName,
      startMs: item.startMs,
      endMs: item.endMs,
    })),
    [
      {
        machineId: 'fl-1',
        routeStepName: 'Fill',
        startMs: 65_000,
        endMs: 95_000,
      },
      {
        machineId: 'mx-1',
        routeStepName: 'Mix',
        startMs: 0,
        endMs: 60_000,
      },
    ],
  );
});

test('batch-flow samples are composed from base plus pure transforms', () => {
  const multiBatch = composeBatchFlowSampleModel(addSecondMixerAndSecondBatch);
  const tightLag = composeBatchFlowSampleModel(tightenFillMaxLag);

  assert.equal(multiBatch.batches.length, 2);
  assert.equal(multiBatch.processorInstances.length, 3);
  assert.equal(tightLag.batchTypes[0].route[0].maxLagMs, 5_000);
  assert.equal(createBaseBatchFlowModel().batches.length, 1);
});

test('batch-flow sample catalog exposes multiple named scenarios', () => {
  const samples = listBatchFlowSamples();

  assert.deepEqual(
    samples.map(sample => sample.id),
    ['base', 'multi-batch', 'tight-max-lag'],
  );
  assert.ok(compileSampleBatchFlow('multi-batch').ok);
  assert.ok(compileSampleBatchFlow('tight-max-lag').ok);
});
