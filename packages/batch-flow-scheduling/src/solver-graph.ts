import type {
  BatchTemporalEdge,
  ChangeoverRule,
  ConcreteBatchStep,
  Id,
  MachineCapacityGroup,
  MachineNoOverlapPair,
  MachineTransitionCost,
  ProcessorInstance,
  SolverNode,
} from './types.js';

export interface SolverGraph {
  nodes: SolverNode[];
  batchTemporalEdges: BatchTemporalEdge[];
  machineCapacityGroups: MachineCapacityGroup[];
  machineTransitionCosts: MachineTransitionCost[];
  machineNoOverlapPairs: MachineNoOverlapPair[];
}

export function deriveSolverNodes(
  concreteBatchSteps: readonly ConcreteBatchStep[],
  processorInstances: readonly ProcessorInstance[],
): SolverNode[] {
  const eligibleMachineIdsByType = new Map<Id, Id[]>();

  for (const processorInstance of processorInstances) {
    const current = eligibleMachineIdsByType.get(processorInstance.processorTypeId);
    if (current) {
      current.push(processorInstance.id);
    } else {
      eligibleMachineIdsByType.set(processorInstance.processorTypeId, [processorInstance.id]);
    }
  }

  return concreteBatchSteps.map(step => ({
    id: step.id,
    batchId: step.batchId,
    batchTypeId: step.batchTypeId,
    routeStepTemplateId: step.routeStepTemplateId,
    durationMs: step.durationMs,
    requiredProcessorTypeId: step.requiredProcessorTypeId,
    eligibleMachineIds: [...(eligibleMachineIdsByType.get(step.requiredProcessorTypeId) ?? [])],
    releaseTimeMs: step.releaseTimeMs,
    dueTimeMs: step.dueTimeMs,
  }));
}

export function deriveBatchTemporalEdges(
  concreteBatchSteps: readonly ConcreteBatchStep[],
): BatchTemporalEdge[] {
  const stepsByBatch = new Map<Id, ConcreteBatchStep[]>();

  for (const step of concreteBatchSteps) {
    const current = stepsByBatch.get(step.batchId);
    if (current) {
      current.push(step);
    } else {
      stepsByBatch.set(step.batchId, [step]);
    }
  }

  const edges: BatchTemporalEdge[] = [];

  for (const steps of stepsByBatch.values()) {
    const ordered = [...steps].sort((a, b) => a.sequence - b.sequence);
    for (let i = 0; i < ordered.length - 1; i += 1) {
      const from = ordered[i];
      const to = ordered[i + 1];
      edges.push({
        fromNodeId: from.id,
        toNodeId: to.id,
        minGapMs: 0,
        maxGapMs: from.maxLagMs,
      });
    }
  }

  return edges;
}

export function deriveMachineCapacityGroups(
  nodes: readonly SolverNode[],
  processorInstances: readonly ProcessorInstance[],
): MachineCapacityGroup[] {
  return processorInstances.map(machine => ({
    machineId: machine.id,
    eligibleNodeIds: nodes
      .filter(node => node.eligibleMachineIds.includes(machine.id))
      .map(node => node.id),
  }));
}

export function deriveMachineTransitionCosts(
  nodes: readonly SolverNode[],
  processorInstances: readonly ProcessorInstance[],
  changeoverRules: readonly ChangeoverRule[] = [],
): MachineTransitionCost[] {
  const ruleMap = new Map<string, number>();

  for (const rule of changeoverRules) {
    ruleMap.set(
      `${rule.processorTypeId}::${rule.fromBatchTypeId}::${rule.toBatchTypeId}`,
      rule.minGapMs,
    );
  }

  const costs: MachineTransitionCost[] = [];

  for (const machine of processorInstances) {
    const eligibleNodes = nodes.filter(node => node.eligibleMachineIds.includes(machine.id));

    for (const fromNode of eligibleNodes) {
      for (const toNode of eligibleNodes) {
        if (fromNode.id === toNode.id) continue;

        const key = `${machine.processorTypeId}::${fromNode.batchTypeId}::${toNode.batchTypeId}`;
        const minGapMs = ruleMap.get(key) ?? 0;

        costs.push({
          machineId: machine.id,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          minGapMs,
        });
      }
    }
  }

  return costs;
}

export function deriveMachineNoOverlapPairs(
  nodes: readonly SolverNode[],
  processorInstances: readonly ProcessorInstance[],
): MachineNoOverlapPair[] {
  const pairs: MachineNoOverlapPair[] = [];

  for (const machine of processorInstances) {
    const eligibleNodeIds = nodes
      .filter(node => node.eligibleMachineIds.includes(machine.id))
      .map(node => node.id)
      .sort();

    for (let i = 0; i < eligibleNodeIds.length - 1; i += 1) {
      for (let j = i + 1; j < eligibleNodeIds.length; j += 1) {
        pairs.push({
          machineId: machine.id,
          leftNodeId: eligibleNodeIds[i],
          rightNodeId: eligibleNodeIds[j],
        });
      }
    }
  }

  return pairs;
}

export function deriveSolverGraph(
  concreteBatchSteps: readonly ConcreteBatchStep[],
  processorInstances: readonly ProcessorInstance[],
  changeoverRules: readonly ChangeoverRule[] = [],
): SolverGraph {
  const nodes = deriveSolverNodes(concreteBatchSteps, processorInstances);
  return {
    nodes,
    batchTemporalEdges: deriveBatchTemporalEdges(concreteBatchSteps),
    machineCapacityGroups: deriveMachineCapacityGroups(nodes, processorInstances),
    machineTransitionCosts: deriveMachineTransitionCosts(nodes, processorInstances, changeoverRules),
    machineNoOverlapPairs: deriveMachineNoOverlapPairs(nodes, processorInstances),
  };
}
