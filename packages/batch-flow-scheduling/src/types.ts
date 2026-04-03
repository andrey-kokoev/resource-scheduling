/**
 * First-pass domain type surface for batch / flow scheduling.
 *
 * This layer stays domain-side only. It defines the primary entities and
 * schedule facts described in the package docs without introducing solver
 * projection or scheduling behavior yet.
 */

export type Id = string;

export type ScheduleStatus = 'draft' | 'partial' | 'complete';

/**
 * A processor family or equipment class.
 * Examples: mixer, reactor, filler, oven.
 */
export interface ProcessorType {
  id: Id;
  name: string;
  description?: string;
}

/**
 * A concrete processor or equipment instance that can execute route steps.
 */
export interface ProcessorInstance {
  id: Id;
  name: string;
  processorTypeId: Id;
  lineId?: Id;
  siteId?: Id;
  metadata?: Record<string, string>;
}

/**
 * One step in a batch route definition.
 */
export interface RouteStepTemplate {
  id: Id;
  sequence: number;
  name: string;
  processorTypeId: Id;
  durationMs: number;
  maxLagMs?: number;
  description?: string;
}

/**
 * A route-bearing batch type or process definition.
 */
export interface BatchType {
  id: Id;
  name: string;
  route: RouteStepTemplate[];
  description?: string;
}

/**
 * One runtime batch / production order.
 */
export interface Batch {
  id: Id;
  batchTypeId: Id;
  releaseTimeMs?: number;
  dueTimeMs?: number;
  lotId?: string;
  metadata?: Record<string, string>;
}

export interface ChangeoverRule {
  id: Id;
  processorTypeId: Id;
  fromBatchTypeId: Id;
  toBatchTypeId: Id;
  minGapMs: number;
}

/**
 * Canonical concrete batch-step identity.
 *
 * This is the primary execution identity in the domain:
 *   (batchId, routeStepTemplateId)
 */
export interface BatchStepRef {
  batchId: Id;
  routeStepTemplateId: Id;
}

/**
 * Deterministically derived concrete batch step.
 *
 * This is the runtime expansion of:
 *   Batch × BatchType.route
 */
export interface ConcreteBatchStep extends BatchStepRef {
  id: Id;
  batchTypeId: Id;
  sequence: number;
  name: string;
  durationMs: number;
  requiredProcessorTypeId: Id;
  releaseTimeMs?: number;
  dueTimeMs?: number;
  maxLagMs?: number;
}

export interface SolverNode {
  id: Id;
  batchId: Id;
  batchTypeId: Id;
  routeStepTemplateId: Id;
  durationMs: number;
  requiredProcessorTypeId: Id;
  eligibleMachineIds: Id[];
  releaseTimeMs?: number;
  dueTimeMs?: number;
}

export interface BatchTemporalEdge {
  fromNodeId: Id;
  toNodeId: Id;
  minGapMs: number;
  maxGapMs?: number;
}

export interface MachineCapacityGroup {
  machineId: Id;
  eligibleNodeIds: Id[];
}

export interface MachineTransitionCost {
  machineId: Id;
  fromNodeId: Id;
  toNodeId: Id;
  minGapMs: number;
}

export interface MachineNoOverlapPair {
  machineId: Id;
  leftNodeId: Id;
  rightNodeId: Id;
}

export type ConstraintVariableKind =
  | 'node-start'
  | 'node-end'
  | 'machine-assignment'
  | 'machine-ordering';

export interface ConstraintVariable {
  id: Id;
  kind: ConstraintVariableKind;
  nodeId?: Id;
  machineId?: Id;
  leftNodeId?: Id;
  rightNodeId?: Id;
}

export type ConstraintKind =
  | 'duration'
  | 'exactly-one-machine'
  | 'batch-temporal-min-gap'
  | 'batch-temporal-max-gap'
  | 'machine-no-overlap-choice'
  | 'machine-transition-min-gap'
  | 'node-release-time'
  | 'node-due-time';

export interface ConstraintSpec {
  id: Id;
  kind: ConstraintKind;
  nodeId?: Id;
  machineId?: Id;
  fromNodeId?: Id;
  toNodeId?: Id;
  leftNodeId?: Id;
  rightNodeId?: Id;
  variableIds: Id[];
  minGapMs?: number;
  maxGapMs?: number;
  releaseTimeMs?: number;
  dueTimeMs?: number;
  durationMs?: number;
}

export interface ConstraintModel {
  variables: ConstraintVariable[];
  constraints: ConstraintSpec[];
}

export interface ScheduledBatchStepSolution extends BatchStepRef {
  id: Id;
  batchTypeId: Id;
  routeStepName: string;
  sequence: number;
  processorInstanceId: Id;
  processorTypeId: Id;
  startMs: number;
  endMs: number;
}

export interface MachineTimelineItem {
  machineId: Id;
  processorTypeId: Id;
  stepId: Id;
  batchId: Id;
  batchTypeId: Id;
  routeStepTemplateId: Id;
  routeStepName: string;
  startMs: number;
  endMs: number;
}

export interface BatchFlowSolution {
  scheduleId: Id;
  status: ScheduleStatus;
  scheduledSteps: ScheduledBatchStepSolution[];
  machineTimelines: MachineTimelineItem[];
  notes?: string;
}

/**
 * A concrete scheduled fact for one batch step.
 */
export interface ScheduledBatchStep extends BatchStepRef {
  id: Id;
  processorInstanceId: Id;
  startMs: number;
  endMs: number;
}

/**
 * One full schedule state over a set of batches.
 */
export interface BatchSchedule {
  id: Id;
  status: ScheduleStatus;
  scheduledSteps: ScheduledBatchStep[];
  notes?: string;
}
