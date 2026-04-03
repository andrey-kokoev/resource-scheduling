/**
 * First-pass repair-attempt compiler.
 *
 * This stays on the workflow side of the boundary: it takes copied baseline
 * state and deterministically packages one strongest-retention attempt plus a
 * compiled concrete solve input. It does not orchestrate retries or relax
 * retention beyond the explicit stage choices.
 */

import type { SolveInput } from '../primitive/types.js';
import { buildEligibility, compileDomain } from './compiler.js';
import { buildConcreteSolveAttempt } from './hard-locks.js';
import type {
  CopiedBaselineAssignment,
  CopiedBaselineAddedNeedDelta,
  CopiedBaselineChangedAvailabilityDelta,
  CopiedBaselineChangedShiftDelta,
  CopiedBaselineDelta,
  CopiedBaselineRemovedAssignmentDelta,
  CopiedBaselineRemovedNeedDelta,
  CopiedBaselineState,
} from './baseline.js';
import type {
  ConcreteSolveAttempt,
  DomainInput,
  HardLock,
  HardLockPreassignment,
  PreassignedAssignment,
  RetainedBaselinePreassignment,
} from './types.js';
import type { Id } from '../primitive/types.js';

/** Strongest first-pass retention stage. */
export const STRONGEST_REPAIR_ATTEMPT_STAGE = 'keep-candidate-shift-position' as const;
/** Second first-pass retention stage. */
export const KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE = 'keep-candidate-shift' as const;
/** Full-release first-pass retention stage. */
export const FULL_RELEASE_REPAIR_ATTEMPT_STAGE = 'full-release' as const;

export type RepairAttemptStage =
  | typeof STRONGEST_REPAIR_ATTEMPT_STAGE
  | typeof KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE
  | typeof FULL_RELEASE_REPAIR_ATTEMPT_STAGE;

/** Workflow-layer compiler input for one repair attempt. */
export interface RepairAttemptCompilationInput {
  readonly baselineState: CopiedBaselineState;
  readonly stage?: RepairAttemptStage;
}

/** Retained copied-baseline assignment surviving this compilation stage. */
export interface RetainedCopiedBaselineAssignment {
  readonly assignmentId: Id;
  readonly agentId: Id;
  readonly demandUnitId: Id;
  readonly retentionLabel?: string;
}

/** Copied-baseline assignment released from this compilation stage. */
export interface ReleasedCopiedBaselineAssignment {
  readonly assignmentId: Id;
  readonly agentId: Id;
  readonly demandUnitId: Id;
  readonly reason:
    | 'removed-by-delta'
    | 'invalidated-by-concrete-facts'
    | 'conflicts-with-hard-lock'
    | 'relaxed-by-stage';
}

/** Open coverage gap left after the strongest retention stage is applied. */
export interface RepairAttemptOpenGap {
  readonly needId: Id;
  readonly demandUnitIds: readonly Id[];
  readonly requiredCount: number;
  readonly coveredCount: number;
}

/** Hard-lock conflict encountered while building the attempt. */
export interface RepairAttemptHardLockConflict {
  readonly hardLockId: Id;
  readonly agentId: Id;
  readonly demandUnitId: Id;
  readonly reason:
    | 'missing-demand-unit'
    | 'ineligible-for-demand-unit'
    | 'conflicts-with-copied-baseline-assignment';
}

/** Concrete result of compiling one repair attempt. */
export interface RepairAttemptCompilationResult {
  readonly stage: RepairAttemptStage;
  readonly solveInput: SolveInput;
  readonly attempt: ConcreteSolveAttempt;
  readonly hardLockConflicts: readonly RepairAttemptHardLockConflict[];
  readonly retainedAssignments: readonly RetainedCopiedBaselineAssignment[];
  readonly releasedAssignments: readonly ReleasedCopiedBaselineAssignment[];
  readonly openGaps: readonly RepairAttemptOpenGap[];
  readonly attemptValid: boolean;
}

/**
 * Compile a copied-baseline workflow state into one concrete solve attempt.
 *
 * This slice supports the strongest stage, the first relaxed stage, and the
 * full-release fallback stage.
 */
export function compileRepairAttempt(
  input: RepairAttemptCompilationInput,
): RepairAttemptCompilationResult {
  const stage = input.stage ?? STRONGEST_REPAIR_ATTEMPT_STAGE;
  const effectiveInput = applyCopiedBaselineDeltas(
    input.baselineState.targetInput,
    input.baselineState.deltas,
  );
  const baseSolveInput = compileDomain(effectiveInput);
  const eligibilityByDemandUnit = buildEligibilityByDemandUnit(baseSolveInput);

  const demandUnitIdsByNeed = groupDemandUnitsByNeed(baseSolveInput);
  const demandUnitIds = new Set(baseSolveInput.demandUnits.map(demandUnit => demandUnit.id));

  const retentionLabelByAssignmentId = new Map<Id, string>();
  for (const retention of input.baselineState.retentionAnnotations) {
    retentionLabelByAssignmentId.set(retention.assignmentId, retention.label);
  }

  const removedAssignmentIds = new Set<Id>(
    input.baselineState.deltas
      .filter((delta): delta is CopiedBaselineRemovedAssignmentDelta => delta.kind === 'removed-assignment')
      .map(delta => delta.assignmentId),
  );

  const hardLockConflicts: RepairAttemptHardLockConflict[] = [];
  const validHardLocks: HardLock[] = [];
  const copiedAssignmentsByDemandUnit = groupCopiedAssignmentsByDemandUnit(
    input.baselineState.copiedAssignments,
  );

  for (const hardLock of input.baselineState.hardLocks) {
    if (!demandUnitIds.has(hardLock.demandUnitId)) {
      hardLockConflicts.push({
        hardLockId: hardLock.id,
        agentId: hardLock.agentId,
        demandUnitId: hardLock.demandUnitId,
        reason: 'missing-demand-unit',
      });
      continue;
    }

    const eligibleAgents = eligibilityByDemandUnit.get(hardLock.demandUnitId) ?? new Set<Id>();
    if (!eligibleAgents.has(hardLock.agentId)) {
      hardLockConflicts.push({
        hardLockId: hardLock.id,
        agentId: hardLock.agentId,
        demandUnitId: hardLock.demandUnitId,
        reason: 'ineligible-for-demand-unit',
      });
      continue;
    }

    const copiedAssignment = copiedAssignmentsByDemandUnit.get(hardLock.demandUnitId);
    if (
      copiedAssignment &&
      !removedAssignmentIds.has(copiedAssignment.id) &&
      copiedAssignment.agentId !== hardLock.agentId
    ) {
      hardLockConflicts.push({
        hardLockId: hardLock.id,
        agentId: hardLock.agentId,
        demandUnitId: hardLock.demandUnitId,
        reason: 'conflicts-with-copied-baseline-assignment',
      });
      continue;
    }

    validHardLocks.push(hardLock);
  }

  const retainedAssignments: RetainedCopiedBaselineAssignment[] = [];
  const releasedAssignments: ReleasedCopiedBaselineAssignment[] = [];

  for (const assignment of input.baselineState.copiedAssignments) {
    if (removedAssignmentIds.has(assignment.id)) {
      releasedAssignments.push({
        assignmentId: assignment.id,
        agentId: assignment.agentId,
        demandUnitId: assignment.demandUnitId,
        reason: 'removed-by-delta',
      });
      continue;
    }

    if (!demandUnitIds.has(assignment.demandUnitId)) {
      releasedAssignments.push({
        assignmentId: assignment.id,
        agentId: assignment.agentId,
        demandUnitId: assignment.demandUnitId,
        reason: 'invalidated-by-concrete-facts',
      });
      continue;
    }

    const eligibleAgents = eligibilityByDemandUnit.get(assignment.demandUnitId) ?? new Set<Id>();
    if (!eligibleAgents.has(assignment.agentId)) {
      releasedAssignments.push({
        assignmentId: assignment.id,
        agentId: assignment.agentId,
        demandUnitId: assignment.demandUnitId,
        reason: 'invalidated-by-concrete-facts',
      });
      continue;
    }

    const hardLock = validHardLocks.find(
      lock => lock.agentId === assignment.agentId && lock.demandUnitId === assignment.demandUnitId,
    );
    if (!hardLock) {
      retainedAssignments.push({
        assignmentId: assignment.id,
        agentId: assignment.agentId,
        demandUnitId: assignment.demandUnitId,
        retentionLabel: retentionLabelByAssignmentId.get(assignment.id),
      });
    }
  }

  for (const assignment of input.baselineState.copiedAssignments) {
    const hardLock = validHardLocks.find(
      lock => lock.demandUnitId === assignment.demandUnitId && lock.agentId !== assignment.agentId,
    );
    if (hardLock && !removedAssignmentIds.has(assignment.id)) {
      releasedAssignments.push({
        assignmentId: assignment.id,
        agentId: assignment.agentId,
        demandUnitId: assignment.demandUnitId,
        reason: 'conflicts-with-hard-lock',
      });
    }
  }

  const hardLockAttempt = buildConcreteSolveAttempt(effectiveInput, validHardLocks);
  const retainedPreassignments: RetainedBaselinePreassignment[] =
    stage === STRONGEST_REPAIR_ATTEMPT_STAGE
      ? retainedAssignments.map(assignment => ({
          kind: 'retained-baseline',
          assignmentId: assignment.assignmentId,
          agentId: assignment.agentId,
          demandUnitId: assignment.demandUnitId,
        }))
      : [];

  if (
    stage === KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE ||
    stage === FULL_RELEASE_REPAIR_ATTEMPT_STAGE
  ) {
    for (const assignment of retainedAssignments) {
      releasedAssignments.push({
        assignmentId: assignment.assignmentId,
        agentId: assignment.agentId,
        demandUnitId: assignment.demandUnitId,
        reason: 'relaxed-by-stage',
      });
    }
  }

  const stagePreassignedAssignments = dedupePreassignments([
    ...hardLockAttempt.preassignedAssignments,
    ...retainedPreassignments,
  ]);
  const solveInput = applyStageSpecificLocks(baseSolveInput, stagePreassignedAssignments);
  const attempt = {
    ...hardLockAttempt,
    preassignedAssignments: stagePreassignedAssignments,
  } satisfies ConcreteSolveAttempt;

  const openGaps = buildOpenGaps(demandUnitIdsByNeed, attempt.preassignedAssignments);

  return {
    stage,
    solveInput,
    attempt,
    hardLockConflicts,
    retainedAssignments,
    releasedAssignments,
    openGaps,
    attemptValid: hardLockConflicts.length === 0,
  };
}

function applyStageSpecificLocks(
  solveInput: SolveInput,
  preassignedAssignments: readonly PreassignedAssignment[],
): SolveInput {
  const lockCapabilityIdsByDemandUnit = new Map<Id, Id[]>();
  for (const preassignment of preassignedAssignments) {
    const lockCapabilityIds = lockCapabilityIdsByDemandUnit.get(preassignment.demandUnitId) ?? [];
    lockCapabilityIds.push(buildStageLockCapabilityId(preassignment));
    lockCapabilityIdsByDemandUnit.set(preassignment.demandUnitId, lockCapabilityIds);
  }

  const demandUnits = solveInput.demandUnits.map(demandUnit => {
    const lockCapabilityIds = lockCapabilityIdsByDemandUnit.get(demandUnit.id) ?? [];
    if (lockCapabilityIds.length === 0) {
      return demandUnit;
    }

    return {
      ...demandUnit,
      requiredCapabilities: dedupeIds([
        ...demandUnit.requiredCapabilities,
        ...lockCapabilityIds,
      ]),
    };
  });

  const constraints = solveInput.constraints.map(constraint => {
    if (constraint.type !== 'capability') {
      return constraint;
    }

    const agentCapabilities = new Map(constraint.agentCapabilities);
    for (const preassignment of preassignedAssignments) {
      const lockCapabilityId = buildStageLockCapabilityId(preassignment);
      const existingCapabilities = agentCapabilities.get(preassignment.agentId) ?? [];
      if (existingCapabilities.some(capability => capability.id === lockCapabilityId)) {
        continue;
      }

      agentCapabilities.set(preassignment.agentId, [
        ...existingCapabilities,
        {
          id: lockCapabilityId,
        },
      ]);
    }

    return {
      ...constraint,
      agentCapabilities,
    };
  });

  return {
    ...solveInput,
    demandUnits,
    constraints,
  };
}

function buildStageLockCapabilityId(preassignment: PreassignedAssignment): Id {
  return `repair-lock:${preassignment.agentId}:${preassignment.demandUnitId}`;
}

function dedupeIds(ids: readonly Id[]): Id[] {
  return [...new Set(ids)];
}

function applyCopiedBaselineDeltas(
  input: DomainInput,
  deltas: readonly CopiedBaselineDelta[],
): DomainInput {
  const changedNeeds = new Map<Id, DomainInput['needs'][number]>();
  for (const need of input.needs) {
    changedNeeds.set(need.id, need);
  }

  const changedShifts = new Map<Id, DomainInput['shifts'][number]>();
  for (const shift of input.shifts) {
    changedShifts.set(shift.id, shift);
  }

  let candidateAvailability = [...(input.candidateAvailability ?? [])];

  for (const delta of deltas) {
    if (delta.kind === 'removed-need') {
      changedNeeds.delete(delta.needId);
      continue;
    }

    if (delta.kind === 'added-need') {
      changedNeeds.set(delta.need.id, delta.need);
      continue;
    }

    if (delta.kind === 'changed-shift') {
      changedShifts.delete(delta.shiftId);
      changedShifts.set(delta.shiftId, { ...delta.after, id: delta.shiftId });
      continue;
    }

    if (delta.kind === 'changed-availability') {
      candidateAvailability = [
        ...candidateAvailability.filter(entry => entry.candidateId !== delta.candidateId),
        ...delta.after,
      ];
    }
  }

  return {
    ...input,
    needs: [...changedNeeds.values()],
    shifts: [...changedShifts.values()],
    candidateAvailability,
  };
}

function buildEligibilityByDemandUnit(solveInput: SolveInput): ReadonlyMap<Id, Set<Id>> {
  const byDemandUnit = new Map<Id, Set<Id>>();
  for (const edge of buildEligibility(solveInput)) {
    const set = byDemandUnit.get(edge.demandUnitId) ?? new Set<Id>();
    set.add(edge.agentId);
    byDemandUnit.set(edge.demandUnitId, set);
  }
  return byDemandUnit;
}

function groupCopiedAssignmentsByDemandUnit(
  assignments: readonly CopiedBaselineAssignment[],
): Map<Id, CopiedBaselineAssignment> {
  const grouped = new Map<Id, CopiedBaselineAssignment>();
  for (const assignment of assignments) {
    grouped.set(assignment.demandUnitId, assignment);
  }
  return grouped;
}

function groupDemandUnitsByNeed(solveInput: SolveInput): Map<Id, readonly Id[]> {
  const grouped = new Map<Id, Id[]>();
  for (const demandUnit of solveInput.demandUnits) {
    const needId = demandUnitNeedId(demandUnit.id);
    const list = grouped.get(needId) ?? [];
    list.push(demandUnit.id);
    grouped.set(needId, list);
  }
  return grouped;
}

function buildOpenGaps(
  demandUnitIdsByNeed: ReadonlyMap<Id, readonly Id[]>,
  preassignedAssignments: readonly PreassignedAssignment[],
): RepairAttemptOpenGap[] {
  const preassignedDemandUnits = new Set(preassignedAssignments.map(assignment => assignment.demandUnitId));
  const gaps: RepairAttemptOpenGap[] = [];

  for (const [needId, demandUnitIds] of demandUnitIdsByNeed) {
    const coveredCount = demandUnitIds.filter(id => preassignedDemandUnits.has(id)).length;
    if (coveredCount < demandUnitIds.length) {
      gaps.push({
        needId,
        demandUnitIds: demandUnitIds.filter(id => !preassignedDemandUnits.has(id)),
        requiredCount: demandUnitIds.length,
        coveredCount,
      });
    }
  }

  return gaps;
}

function dedupePreassignments(
  preassignments: readonly PreassignedAssignment[],
): PreassignedAssignment[] {
  const byKey = new Map<string, PreassignedAssignment>();

  for (const preassignment of preassignments) {
    const key = `${preassignment.agentId}:${preassignment.demandUnitId}`;
    const current = byKey.get(key);
    if (!current || preassignment.kind === 'hard-lock') {
      byKey.set(key, preassignment);
    }
  }

  return [...byKey.values()];
}

function demandUnitNeedId(demandUnitId: Id): Id {
  const hashIndex = demandUnitId.lastIndexOf('#');
  return hashIndex === -1 ? demandUnitId : demandUnitId.slice(0, hashIndex);
}
