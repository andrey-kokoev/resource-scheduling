/**
 * Feasibility Core - Pure feasibility engine for resource scheduling.
 * 
 * This package provides a domain-agnostic feasibility solver and a domain
 * compilation layer for staffing-specific entities.
 * 
 * @example
 * ```ts
 * import {
 *   compileDomain,
 *   solve,
 *   buildRegroupingContext,
 *   regroupToDomainExplanations,
 * } from 'feasibility-core';
 * 
 * const input = { shifts, positions, needs, candidates, ... };
 * const solveInput = compileDomain(input);
 * const result = solve(solveInput);
 * 
 * if (result.feasible) {
 *   console.log('Assignments:', result.assignments);
 * } else {
 *   const context = buildRegroupingContext(input);
 *   console.log(regroupToDomainExplanations(result, context));
 * }
 * ```
 * 
 * Preferred caller flow:
 * 1. Build `DomainInput`
 * 2. `compileDomain(input)`
 * 3. `solve(solveInput)`
 * 4. For failures, `buildRegroupingContext(input)`
 * 5. `regroupToDomainExplanations(result, context)`
 */

// Preferred consumer surface
// Keep this first so external callers can treat it as the default entry path.
export type {
  DateString,
  Weekday,
  RecurrenceFrequency,
  RecurrenceExceptionKind,
  RecurrenceExceptionTargetKind,
  RecurrenceRule,
  ExpansionHorizon,
  Site,
  Line,
  Shift,
  Position,
  QualificationType,
  Need,
  Candidate,
  PositionQualification,
  CandidateQualification,
  CandidateAvailability,
  RecurringShiftTemplate,
  RecurringNeedTemplate,
  RecurringAvailabilityTemplate,
  RecurringExceptionRecord,
  RecurrenceExpansionResult,
  RecurrenceExpansionError,
  RecurrenceExpansionErrorType,
  RecurringExpansionSummary,
  HardLock,
  HardLockPreassignment,
  PreassignedAssignment,
  RetainedBaselinePreassignment,
  ConcreteSolveAttempt,
  CopiedBaselineAssignment,
  CopiedBaselineRetentionAnnotation,
  CopiedBaselineRemovedAssignmentDelta,
  CopiedBaselineAddedNeedDelta,
  CopiedBaselineRemovedNeedDelta,
  CopiedBaselineChangedShiftDelta,
  CopiedBaselineChangedAvailabilityDelta,
  CopiedBaselineDelta,
  CopiedBaselineState,
  RepairAttemptStage,
  RepairAttemptCompilationInput,
  RetainedCopiedBaselineAssignment,
  ReleasedCopiedBaselineAssignment,
  RepairAttemptOpenGap,
  RepairAttemptHardLockConflict,
  RepairAttemptCompilationResult,
  RepairOrchestrationInput,
  RepairOrchestrationAttemptResult,
  RepairOrchestrationResult,
  RepairAttemptSummary,
  RepairResult,
  StableRepairReport,
  RepairAssignmentReportItem,
  RepairAssignmentDiffItem,
  RepairNeedReportItem,
  ShiftPatternRule,
  MinimumRestRule,
  ConsecutiveWorkRule,
  CoverageRule,
  UtilizationRule as DomainUtilizationRule,
  DomainInput,
} from './domain/index.js';
export { compileDomain, buildEligibility } from './domain/compiler.js';
export { expandRecurringDomain } from './domain/recurrence.js';
export { buildConcreteSolveAttempt } from './domain/hard-locks.js';
export {
  STRONGEST_REPAIR_ATTEMPT_STAGE,
  KEEP_CANDIDATE_SHIFT_REPAIR_ATTEMPT_STAGE,
  FULL_RELEASE_REPAIR_ATTEMPT_STAGE,
  compileRepairAttempt,
} from './domain/repair-attempt.js';
export {
  runRepairOrchestration,
} from './domain/repair-orchestrator.js';
export {
  repairCopiedBaseline,
  buildStableRepairReport,
} from './domain/repair.js';
export { solve, explainInfeasibility } from './solver/index.js';
export { buildRegroupingContext, regroupToDomainExplanations } from './explanations.js';
export type * from './explanations.js';
export * from './sample-scenarios.js';

// Advanced / internal composition helpers
export * from './primitive/index.js';
// Policy lock - materialized policy choices for Package 001
export * from './policy.js';
// Constraint contract - semantic contract for primitive layer
export * from './contracts.js';
// Rest constraint - minimum rest between assignments
export {
  calculateGap,
  intervalsOverlap,
  checkMinimumRest,
  msToHours,
  hoursToMs,
  regroupRestViolation,
  validateRestSequence,
  REST_DURATIONS,
  MINIMUM_REST_CONSTRAINT_CONTRACT,
  isMinimumRestConstraint,
  isRestViolationReason,
} from './rest.js';
export type {
  ConstraintWithRest,
  InfeasibilityReasonWithRest,
  InsufficientRestViolation,
  RestCheckResult,
} from './rest.js';
// Pattern constraints - consecutive work limits
export {
  formatISODate,
  parseISODate,
  deriveWorkedDates,
  isConsecutive,
  calculateConsecutiveRunLength,
  findConsecutiveRuns,
  checkMaxConsecutiveDays,
  createInitialConsecutiveDaysState,
  updateConsecutiveDaysState,
  regroupConsecutiveDaysViolation,
  validateConsecutiveDays,
  CONSECUTIVE_DAYS_LIMITS,
  MAX_CONSECUTIVE_DAYS_CONTRACT,
  isMaxConsecutiveDaysConstraint,
  isConsecutiveDaysViolationReason,
} from './patterns.js';
export type {
  ConstraintWithPatterns,
  InfeasibilityReasonWithPatterns,
  ConsecutiveDaysCheckResult,
  AgentConsecutiveDaysState,
} from './patterns.js';
