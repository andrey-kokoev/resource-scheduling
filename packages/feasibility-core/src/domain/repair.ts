/**
 * Caller-facing repair API for copied baseline workflow state.
 *
 * This is a thin public wrapper around the current three-stage repair ladder.
 * It keeps the ladder mechanics internal while returning one coherent result
 * shape to callers.
 */

import type { SolveResult } from '../primitive/types.js';
import type { CopiedBaselineState } from './baseline.js';
import type { RepairAttemptOpenGap, RepairAttemptStage, ReleasedCopiedBaselineAssignment } from './repair-attempt.js';
import type { RepairOrchestrationResult } from './repair-orchestrator.js';
import { runRepairOrchestration } from './repair-orchestrator.js';

/** Summary of one repair ladder stage. */
export interface RepairAttemptSummary {
  readonly stage: RepairAttemptStage;
  readonly outcome: 'feasible' | 'infeasible';
}

/** Summary of one baseline assignment in the public repair report. */
export interface RepairAssignmentReportItem {
  readonly assignmentId: string;
  readonly agentId: string;
  readonly demandUnitId: string;
  readonly status: 'preserved-exactly' | 'degraded' | 'released';
}

/** Summary of one open or infeasible need in the public repair report. */
export interface RepairNeedReportItem {
  readonly needId: string;
  readonly demandUnitIds: readonly string[];
  readonly requiredCount: number;
  readonly coveredCount: number;
  readonly status: 'open' | 'infeasible';
}

/** Public caller-facing result for copied-baseline repair. */
export interface RepairResult {
  readonly outcome: 'feasible' | 'infeasible';
  readonly selectedStage: RepairAttemptStage;
  readonly solverResult: SolveResult;
  readonly attempts: readonly RepairAttemptSummary[];
}

/** Public caller-facing stable repair report for copied baseline state. */
export interface StableRepairReport {
  readonly outcome: 'feasible' | 'infeasible';
  readonly selectedStage: RepairAttemptStage;
  readonly preservedAssignments: readonly RepairAssignmentReportItem[];
  readonly degradedAssignments: readonly RepairAssignmentReportItem[];
  readonly releasedAssignments: readonly RepairAssignmentReportItem[];
  readonly needs: readonly RepairNeedReportItem[];
}

/**
 * Run the current three-stage repair ladder for a copied baseline state.
 *
 * This does not change the solver or expose repair-attempt internals. It only
 * packages the workflow into one user-callable entry point.
 */
export function repairCopiedBaseline(
  baselineState: CopiedBaselineState,
): RepairResult {
  return toRepairResult(runRepairOrchestration({ baselineState }));
}

/**
 * Return the public stable repair report for a copied baseline state.
 *
 * The report summarizes the selected stage, overall feasibility, and how the
 * copied baseline assignments and needs ended up after the current ladder.
 */
export function buildStableRepairReport(
  baselineState: CopiedBaselineState,
): StableRepairReport {
  const orchestration = runRepairOrchestration({ baselineState });
  const selectedAttempt = orchestration.selectedAttempt;
  const releaseStatusByAssignmentId = buildReleaseStatusByAssignmentId(
    selectedAttempt.attempt.releasedAssignments,
  );

  const assignmentReports = baselineState.copiedAssignments
    .slice()
    .sort(compareCopiedBaselineAssignments)
    .map(assignment => ({
      assignmentId: assignment.id,
      agentId: assignment.agentId,
      demandUnitId: assignment.demandUnitId,
      status: releaseStatusByAssignmentId.get(assignment.id) ?? 'preserved-exactly',
    } satisfies RepairAssignmentReportItem));

  return {
    outcome: orchestration.solverResult.feasible ? 'feasible' : 'infeasible',
    selectedStage: selectedAttempt.stage,
    preservedAssignments: assignmentReports.filter(assignment => assignment.status === 'preserved-exactly'),
    degradedAssignments: assignmentReports.filter(assignment => assignment.status === 'degraded'),
    releasedAssignments: assignmentReports.filter(assignment => assignment.status === 'released'),
    needs: orchestration.solverResult.feasible
      ? []
      : selectedAttempt.attempt.openGaps
          .map(toNeedReportItem)
          .sort(compareNeedReportItems),
  };
}

function toRepairResult(orchestration: RepairOrchestrationResult): RepairResult {
  return {
    outcome: orchestration.solverResult.feasible ? 'feasible' : 'infeasible',
    selectedStage: orchestration.selectedAttempt.stage,
    solverResult: orchestration.solverResult,
    attempts: orchestration.attempts.map(attempt => ({
      stage: attempt.stage,
      outcome: attempt.outcome,
    })),
  };
}

function buildReleaseStatusByAssignmentId(
  releasedAssignments: readonly ReleasedCopiedBaselineAssignment[],
): Map<string, RepairAssignmentReportItem['status']> {
  const statusByAssignmentId = new Map<string, RepairAssignmentReportItem['status']>();

  for (const releasedAssignment of releasedAssignments) {
    const status =
      releasedAssignment.reason === 'relaxed-by-stage' ? 'degraded' : 'released';
    const current = statusByAssignmentId.get(releasedAssignment.assignmentId);
    if (current === 'released' || status === 'released') {
      statusByAssignmentId.set(releasedAssignment.assignmentId, 'released');
      continue;
    }

    if (!current) {
      statusByAssignmentId.set(releasedAssignment.assignmentId, status);
    }
  }

  return statusByAssignmentId;
}

function toNeedReportItem(gap: RepairAttemptOpenGap): RepairNeedReportItem {
  return {
    needId: gap.needId,
    demandUnitIds: gap.demandUnitIds,
    requiredCount: gap.requiredCount,
    coveredCount: gap.coveredCount,
    status: gap.coveredCount === 0 ? 'infeasible' : 'open',
  };
}

function compareCopiedBaselineAssignments(
  left: { readonly id: string },
  right: { readonly id: string },
): number {
  return left.id.localeCompare(right.id);
}

function compareNeedReportItems(
  left: { readonly needId: string },
  right: { readonly needId: string },
): number {
  return left.needId.localeCompare(right.needId);
}
