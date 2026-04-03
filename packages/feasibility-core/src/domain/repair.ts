/**
 * Caller-facing repair API for copied baseline workflow state.
 *
 * This is a thin public wrapper around the current three-stage repair ladder.
 * It keeps the ladder mechanics internal while returning one coherent result
 * shape to callers.
 */

import type { SolveResult } from '../primitive/types.js';
import type { CopiedBaselineState } from './baseline.js';
import { runRepairOrchestration } from './repair-orchestrator.js';
import type { RepairAttemptStage } from './repair-attempt.js';

/** Summary of one repair ladder stage. */
export interface RepairAttemptSummary {
  readonly stage: RepairAttemptStage;
  readonly outcome: 'feasible' | 'infeasible';
}

/** Public caller-facing result for copied-baseline repair. */
export interface RepairResult {
  readonly outcome: 'feasible' | 'infeasible';
  readonly selectedStage: RepairAttemptStage;
  readonly solverResult: SolveResult;
  readonly attempts: readonly RepairAttemptSummary[];
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
  const result = runRepairOrchestration({ baselineState });

  return {
    outcome: result.solverResult.feasible ? 'feasible' : 'infeasible',
    selectedStage: result.selectedAttempt.stage,
    solverResult: result.solverResult,
    attempts: result.attempts.map(attempt => ({
      stage: attempt.stage,
      outcome: attempt.outcome,
    })),
  };
}
