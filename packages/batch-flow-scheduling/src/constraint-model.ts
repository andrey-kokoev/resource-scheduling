import type {
  ConstraintModel,
  ConstraintSpec,
  ConstraintVariable,
  Id,
} from './types.js';
import type { SolverGraph } from './solver-graph.js';

function createNodeStartVariableId(nodeId: Id): Id {
  return `var:start:${nodeId}`;
}

function createNodeEndVariableId(nodeId: Id): Id {
  return `var:end:${nodeId}`;
}

function createMachineAssignmentVariableId(nodeId: Id, machineId: Id): Id {
  return `var:assign:${nodeId}:${machineId}`;
}

function createMachineOrderingVariableId(machineId: Id, leftNodeId: Id, rightNodeId: Id): Id {
  return `var:order:${machineId}:${leftNodeId}:${rightNodeId}`;
}

export function deriveConstraintVariables(solverGraph: SolverGraph): ConstraintVariable[] {
  const variables: ConstraintVariable[] = [];

  for (const node of solverGraph.nodes) {
    variables.push({
      id: createNodeStartVariableId(node.id),
      kind: 'node-start',
      nodeId: node.id,
    });
    variables.push({
      id: createNodeEndVariableId(node.id),
      kind: 'node-end',
      nodeId: node.id,
    });

    for (const machineId of node.eligibleMachineIds) {
      variables.push({
        id: createMachineAssignmentVariableId(node.id, machineId),
        kind: 'machine-assignment',
        nodeId: node.id,
        machineId,
      });
    }
  }

  for (const pair of solverGraph.machineNoOverlapPairs) {
    variables.push({
      id: createMachineOrderingVariableId(pair.machineId, pair.leftNodeId, pair.rightNodeId),
      kind: 'machine-ordering',
      machineId: pair.machineId,
      leftNodeId: pair.leftNodeId,
      rightNodeId: pair.rightNodeId,
    });
  }

  return variables;
}

export function deriveConstraintSpecs(solverGraph: SolverGraph): ConstraintSpec[] {
  const constraints: ConstraintSpec[] = [];

  for (const node of solverGraph.nodes) {
    const startVar = createNodeStartVariableId(node.id);
    const endVar = createNodeEndVariableId(node.id);
    const assignmentVars = node.eligibleMachineIds.map((machineId: Id) =>
      createMachineAssignmentVariableId(node.id, machineId),
    );

    constraints.push({
      id: `constraint:duration:${node.id}`,
      kind: 'duration',
      nodeId: node.id,
      variableIds: [startVar, endVar],
      durationMs: node.durationMs,
    });

    constraints.push({
      id: `constraint:assignment:${node.id}`,
      kind: 'exactly-one-machine',
      nodeId: node.id,
      variableIds: assignmentVars,
    });

    if (node.releaseTimeMs !== undefined) {
      constraints.push({
        id: `constraint:release:${node.id}`,
        kind: 'node-release-time',
        nodeId: node.id,
        variableIds: [startVar],
        releaseTimeMs: node.releaseTimeMs,
      });
    }

    if (node.dueTimeMs !== undefined) {
      constraints.push({
        id: `constraint:due:${node.id}`,
        kind: 'node-due-time',
        nodeId: node.id,
        variableIds: [endVar],
        dueTimeMs: node.dueTimeMs,
      });
    }
  }

  for (const edge of solverGraph.batchTemporalEdges) {
    constraints.push({
      id: `constraint:batch-min-gap:${edge.fromNodeId}:${edge.toNodeId}`,
      kind: 'batch-temporal-min-gap',
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      variableIds: [
        createNodeEndVariableId(edge.fromNodeId),
        createNodeStartVariableId(edge.toNodeId),
      ],
      minGapMs: edge.minGapMs,
    });

    if (edge.maxGapMs !== undefined) {
      constraints.push({
        id: `constraint:batch-max-gap:${edge.fromNodeId}:${edge.toNodeId}`,
        kind: 'batch-temporal-max-gap',
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        variableIds: [
          createNodeEndVariableId(edge.fromNodeId),
          createNodeStartVariableId(edge.toNodeId),
        ],
        maxGapMs: edge.maxGapMs,
      });
    }
  }

  for (const pair of solverGraph.machineNoOverlapPairs) {
    constraints.push({
      id: `constraint:no-overlap:${pair.machineId}:${pair.leftNodeId}:${pair.rightNodeId}`,
      kind: 'machine-no-overlap-choice',
      machineId: pair.machineId,
      leftNodeId: pair.leftNodeId,
      rightNodeId: pair.rightNodeId,
      variableIds: [
        createMachineOrderingVariableId(pair.machineId, pair.leftNodeId, pair.rightNodeId),
        createMachineAssignmentVariableId(pair.leftNodeId, pair.machineId),
        createMachineAssignmentVariableId(pair.rightNodeId, pair.machineId),
      ],
    });
  }

  for (const cost of solverGraph.machineTransitionCosts) {
    constraints.push({
      id: `constraint:transition:${cost.machineId}:${cost.fromNodeId}:${cost.toNodeId}`,
      kind: 'machine-transition-min-gap',
      machineId: cost.machineId,
      fromNodeId: cost.fromNodeId,
      toNodeId: cost.toNodeId,
      variableIds: [
        createMachineAssignmentVariableId(cost.fromNodeId, cost.machineId),
        createMachineAssignmentVariableId(cost.toNodeId, cost.machineId),
        createNodeEndVariableId(cost.fromNodeId),
        createNodeStartVariableId(cost.toNodeId),
      ],
      minGapMs: cost.minGapMs,
    });
  }

  return constraints;
}

export function deriveConstraintModel(solverGraph: SolverGraph): ConstraintModel {
  return {
    variables: deriveConstraintVariables(solverGraph),
    constraints: deriveConstraintSpecs(solverGraph),
  };
}
