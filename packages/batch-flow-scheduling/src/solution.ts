import type {
  BatchFlowSolution,
  BatchSchedule,
  ConcreteBatchStep,
  MachineTimelineItem,
  ProcessorInstance,
  ScheduledBatchStepSolution,
} from './types.js';

function createConcreteStepKey(batchId: string, routeStepTemplateId: string): string {
  return `${batchId}::${routeStepTemplateId}`;
}

export function buildBatchFlowSolution(
  schedule: BatchSchedule,
  concreteBatchSteps: readonly ConcreteBatchStep[],
  processorInstances: readonly ProcessorInstance[],
): BatchFlowSolution {
  const concreteByKey = new Map(
    concreteBatchSteps.map(step => [createConcreteStepKey(step.batchId, step.routeStepTemplateId), step]),
  );
  const machineById = new Map(processorInstances.map(machine => [machine.id, machine]));

  const scheduledSteps: ScheduledBatchStepSolution[] = schedule.scheduledSteps.map(step => {
    const concrete = concreteByKey.get(createConcreteStepKey(step.batchId, step.routeStepTemplateId));
    if (!concrete) {
      throw new Error(
        `Cannot build solution: missing concrete batch step for ${step.batchId}/${step.routeStepTemplateId}`,
      );
    }

    const machine = machineById.get(step.processorInstanceId);
    if (!machine) {
      throw new Error(`Cannot build solution: unknown processor instance ${step.processorInstanceId}`);
    }

    return {
      id: step.id,
      batchId: step.batchId,
      batchTypeId: concrete.batchTypeId,
      routeStepTemplateId: step.routeStepTemplateId,
      routeStepName: concrete.name,
      sequence: concrete.sequence,
      processorInstanceId: step.processorInstanceId,
      processorTypeId: machine.processorTypeId,
      startMs: step.startMs,
      endMs: step.endMs,
    };
  });

  const machineTimelines: MachineTimelineItem[] = scheduledSteps
    .map(step => ({
      machineId: step.processorInstanceId,
      processorTypeId: step.processorTypeId,
      stepId: step.id,
      batchId: step.batchId,
      batchTypeId: step.batchTypeId,
      routeStepTemplateId: step.routeStepTemplateId,
      routeStepName: step.routeStepName,
      startMs: step.startMs,
      endMs: step.endMs,
    }))
    .sort((left, right) => {
      if (left.machineId !== right.machineId) {
        return left.machineId.localeCompare(right.machineId);
      }
      if (left.startMs !== right.startMs) {
        return left.startMs - right.startMs;
      }
      return left.stepId.localeCompare(right.stepId);
    });

  return {
    scheduleId: schedule.id,
    status: schedule.status,
    scheduledSteps,
    machineTimelines,
    notes: schedule.notes,
  };
}
