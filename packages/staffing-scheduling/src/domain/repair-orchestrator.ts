/**
 * First-pass repair orchestrator skeleton.
 *
 * This outer loop intentionally does only one thing:
 * copy baseline workflow state -> compile strongest-stage attempt -> solve;
 * if that fails, compile the first relaxed attempt, and if needed a final
 * full-release attempt.
 *
 * It does not relax retention, retry, or perform any broader orchestration.
 */

import type { SolveResult } from '../primitive/types.js';
import { solve } from '../solver/index.js';
import type { CopiedBaselineState } from './baseline.js';
import {
  FULL_RELEASE_REPAIR_ATTEMPT_STAGE,
  KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE,
  STRONGEST_REPAIR_ATTEMPT_STAGE,
  compileRepairAttempt,
  type RepairAttemptCompilationResult,
  type RepairAttemptStage,
} from './repair-attempt.js';

/** Input to the first repair-orchestrator skeleton. */
export interface RepairOrchestrationInput {
  readonly baselineState: CopiedBaselineState;
}

/** One attempt in the repair-orchestration ladder. */
export interface RepairOrchestrationAttemptResult {
  readonly stage: RepairAttemptStage;
  readonly attempt: RepairAttemptCompilationResult;
  readonly solverResult: SolveResult;
  readonly outcome: 'feasible' | 'infeasible';
}

/** Workflow-level result from one-ladder repair orchestration. */
export interface RepairOrchestrationResult {
  readonly attempts: readonly RepairOrchestrationAttemptResult[];
  readonly selectedAttempt: RepairOrchestrationAttemptResult;
  readonly solverResult: SolveResult;
}

/**
 * Run one first-ladder repair orchestration pass.
 *
 * The returned solver result is the ordinary feasibility solver output for the
 * compiled attempt input.
 */
export function runRepairOrchestration(
  input: RepairOrchestrationInput,
): RepairOrchestrationResult {
  const strongestAttempt = runOrchestrationAttempt(
    input.baselineState,
    STRONGEST_REPAIR_ATTEMPT_STAGE,
  );
  if (strongestAttempt.outcome === 'feasible') {
    return {
      attempts: [strongestAttempt],
      selectedAttempt: strongestAttempt,
      solverResult: strongestAttempt.solverResult,
    };
  }

  const relaxedAttempt = runOrchestrationAttempt(
    input.baselineState,
    KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE,
  );
  if (relaxedAttempt.outcome === 'feasible') {
    return {
      attempts: [strongestAttempt, relaxedAttempt],
      selectedAttempt: relaxedAttempt,
      solverResult: relaxedAttempt.solverResult,
    };
  }

  const fullReleaseAttempt = runOrchestrationAttempt(
    input.baselineState,
    FULL_RELEASE_REPAIR_ATTEMPT_STAGE,
  );
  return {
    attempts: [strongestAttempt, relaxedAttempt, fullReleaseAttempt],
    selectedAttempt: fullReleaseAttempt,
    solverResult: fullReleaseAttempt.solverResult,
  };
}

function runOrchestrationAttempt(
  baselineState: CopiedBaselineState,
  stage: RepairAttemptStage,
): RepairOrchestrationAttemptResult {
  const attempt = compileRepairAttempt({
    baselineState,
    stage,
  });
  const solverResult = solve(attempt.solveInput);

  return {
    stage,
    attempt,
    solverResult,
    outcome: solverResult.feasible ? 'feasible' : 'infeasible',
  };
}
