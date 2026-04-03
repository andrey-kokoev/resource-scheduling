/**
 * Consecutive-Work Pattern Limits
 * 
 * This module provides consecutive-work pattern constraint implementation as a
 * pressure test for sequence-based constraints in the primitive feasibility model.
 * 
 * @module patterns
 */

import type { Id, Interval, Constraint, InfeasibilityReason, DemandUnit } from './primitive/types.js';

// =============================================================================
// PRIMITIVE TYPES - Consecutive-work constraint additions
// =============================================================================

/**
 * Maximum consecutive worked days constraint.
 * 
 * INVARIANT: For any agent, no sequence of consecutive worked calendar days
 * may exceed maxDays in length.
 * 
 * "Worked day" is derived from assignment intervals - any day touched by
 * an assignment interval counts as a worked day.
 */
export interface MaxConsecutiveDaysConstraint {
  readonly type: 'max-consecutive-days';
  /** Agents subject to this constraint */
  readonly agentIds: readonly Id[];
  /** Maximum allowed consecutive worked days */
  readonly maxDays: number;
}

/**
 * Extend the Constraint union via module augmentation pattern.
 */
export type ConstraintWithPatterns = Constraint | MaxConsecutiveDaysConstraint;

/**
 * Consecutive days violation infeasibility reason.
 * 
 * Triggered when an assignment would cause an agent to exceed their
 * maximum consecutive worked days limit.
 */
export interface ConsecutiveDaysViolationReason {
  readonly type: 'consecutive-days-violation';
  readonly agentId: Id;
  /** The demand unit whose assignment would create the violation */
  readonly candidateDemandUnitId: Id;
  /** ISO date strings (YYYY-MM-DD) forming the violating consecutive run */
  readonly runDates: readonly string[];
  readonly allowedMax: number;
  readonly actualRunLength: number;
}

/**
 * Extend the InfeasibilityReason union via module augmentation pattern.
 */
export type InfeasibilityReasonWithPatterns = InfeasibilityReason | ConsecutiveDaysViolationReason;

// =============================================================================
// WORKED DAY DERIVATION - From intervals to calendar days
// =============================================================================

/**
 * Format a Date as an ISO date string (YYYY-MM-DD) using the solve-wide
 * local calendar basis.
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO date string to a Date (at local midnight in the solve basis).
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Derive which calendar days an interval touches.
 * 
 * An interval touches all calendar days from its start (inclusive) to its
 * end (exclusive). Overnight shifts touching multiple days return multiple dates.
 * 
 * Calendar derivation uses the solve-wide local timezone basis. The current
 * package intentionally does not normalize to UTC here.
 * 
 * @param interval - The time interval
 * @returns Array of ISO date strings (YYYY-MM-DD) for each touched day
 * 
 * @example
 * deriveWorkedDates({ start: 2026-04-01T20:00, end: 2026-04-02T08:00 })
 * // Returns ['2026-04-01', '2026-04-02']
 */
export function deriveWorkedDates(interval: Interval): readonly string[] {
  const dates = new Set<string>();
  
  const current = new Date(interval.start);
  current.setHours(0, 0, 0, 0);
  dates.add(formatISODate(current));
  
  // Include any additional days the interval reaches into
  current.setDate(current.getDate() + 1);
  while (current < interval.end) {
    dates.add(formatISODate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return Array.from(dates).sort();
}

// =============================================================================
// CONSECUTIVE DAY CALCULATIONS
// =============================================================================

/**
 * Check if two dates are consecutive (exactly 1 day apart).
 * 
 * @param earlier - Earlier ISO date string
 * @param later - Later ISO date string
 * @returns True if later is exactly 1 day after earlier
 */
export function isConsecutive(earlier: string, later: string): boolean {
  const e = parseISODate(earlier);
  const l = parseISODate(later);
  const diffMs = l.getTime() - e.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

/**
 * Calculate the length of the consecutive run containing a specific date.
 * 
 * @param workedDates - Set of worked ISO date strings
 * @param targetDate - The date to find the run for
 * @returns Length of consecutive run containing targetDate
 */
export function calculateConsecutiveRunLength(
  workedDates: ReadonlySet<string>,
  targetDate: string,
): number {
  if (!workedDates.has(targetDate) && workedDates.size > 0) {
    // Target not in set, calculate as if it were added
    const allDates = new Set(workedDates);
    allDates.add(targetDate);
    return calculateConsecutiveRunLength(allDates, targetDate);
  }
  
  const sorted = Array.from(workedDates).sort();
  const targetIndex = sorted.indexOf(targetDate);
  
  if (targetIndex < 0) {
    return 1; // Target is the only date
  }
  
  // Find the start of the run containing targetDate
  let runStart = targetIndex;
  for (let i = targetIndex - 1; i >= 0; i--) {
    if (isConsecutive(sorted[i], sorted[i + 1])) {
      runStart = i;
    } else {
      break;
    }
  }
  
  // Find the end of the run containing targetDate
  let runEnd = targetIndex;
  for (let i = targetIndex + 1; i < sorted.length; i++) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      runEnd = i;
    } else {
      break;
    }
  }
  
  return runEnd - runStart + 1;
}

/**
 * Find all consecutive runs in a set of worked dates.
 * 
 * @param workedDates - Set of worked ISO date strings
 * @returns Array of runs, where each run is a sorted array of consecutive dates
 */
export function findConsecutiveRuns(
  workedDates: ReadonlySet<string>,
): readonly (readonly string[])[] {
  if (workedDates.size === 0) return [];
  
  const sorted = Array.from(workedDates).sort();
  const runs: string[][] = [];
  let currentRun: string[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      currentRun.push(sorted[i]);
    } else {
      runs.push(currentRun);
      currentRun = [sorted[i]];
    }
  }
  
  runs.push(currentRun);
  return runs;
}

// =============================================================================
// CONSTRAINT VALIDATION
// =============================================================================

/**
 * Result of checking max consecutive days for a candidate assignment.
 */
export type ConsecutiveDaysCheckResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      readonly violation: Omit<ConsecutiveDaysViolationReason, 'type'>;
    };

/**
 * Check if assigning an agent to a demand unit would violate max consecutive days.
 * 
 * This is prefix-checkable: it only requires the candidate assignment's interval
 * and the agent's existing worked days history.
 * 
 * @param agentId - The agent being assigned
 * @param candidateDemandUnitId - The demand unit being assigned
 * @param candidateInterval - Interval of the new demand unit
 * @param existingWorkedDates - Agent's existing worked ISO dates
 * @param maxDays - Maximum allowed consecutive worked days
 * @returns ConsecutiveDaysCheckResult indicating valid or violation details
 */
export function checkMaxConsecutiveDays(
  agentId: Id,
  candidateDemandUnitId: Id,
  candidateInterval: Interval,
  existingWorkedDates: ReadonlySet<string>,
  maxDays: number,
): ConsecutiveDaysCheckResult {
  // Skip check if limit is 0 or negative (no limit or disabled)
  if (maxDays <= 0) {
    return { valid: true };
  }
  
  const candidateDates = deriveWorkedDates(candidateInterval);
  
  for (const date of candidateDates) {
    const runLength = calculateConsecutiveRunLength(existingWorkedDates, date);
    
    if (runLength > maxDays) {
      // Build the violating run dates
      const violatingRun = buildViolatingRun(existingWorkedDates, date, runLength);
      
      return {
        valid: false,
        violation: {
          agentId,
          candidateDemandUnitId,
          runDates: violatingRun,
          allowedMax: maxDays,
          actualRunLength: runLength,
        },
      };
    }
  }
  
  return { valid: true };
}

/**
 * Build the array of dates forming a violating consecutive run.
 */
function buildViolatingRun(
  workedDates: ReadonlySet<string>,
  targetDate: string,
  runLength: number,
): readonly string[] {
  const allDates = new Set(workedDates);
  allDates.add(targetDate);
  
  const sorted = Array.from(allDates).sort();
  const targetIndex = sorted.indexOf(targetDate);
  
  // Find run boundaries
  let runStart = targetIndex;
  for (let i = targetIndex - 1; i >= 0 && runStart > targetIndex - runLength; i--) {
    if (isConsecutive(sorted[i], sorted[i + 1])) {
      runStart = i;
    } else {
      break;
    }
  }
  
  return sorted.slice(runStart, runStart + runLength);
}

// =============================================================================
// AGENT STATE - For solver integration
// =============================================================================

/**
 * Per-agent state for tracking consecutive worked days.
 * 
 * The solver maintains this state during search to enable prefix-checking
 * of the max-consecutive-days constraint.
 */
export interface AgentConsecutiveDaysState {
  readonly agentId: Id;
  /** Set of worked ISO date strings */
  readonly workedDates: ReadonlySet<string>;
}

/**
 * Create initial state for an agent with no assignments.
 */
export function createInitialConsecutiveDaysState(agentId: Id): AgentConsecutiveDaysState {
  return {
    agentId,
    workedDates: new Set(),
  };
}

/**
 * Update agent state with a new assignment.
 * 
 * @param state - Current agent state
 * @param demandUnit - The demand unit being assigned
 * @returns Updated state
 */
export function updateConsecutiveDaysState(
  state: AgentConsecutiveDaysState,
  demandUnit: DemandUnit,
): AgentConsecutiveDaysState {
  const newDates = deriveWorkedDates(demandUnit.interval);
  const workedDates = new Set(state.workedDates);
  
  for (const date of newDates) {
    workedDates.add(date);
  }
  
  return {
    agentId: state.agentId,
    workedDates,
  };
}

// =============================================================================
// CONSTRAINT CONTRACT - Metadata
// =============================================================================

/**
 * Constraint contract metadata for max-consecutive-days constraints.
 * 
 * SCOPE: Global (per agent, sequence-based)
 * TIMING: Prefix-checkable (requires per-agent worked-day state)
 * DERIVATION: Worked days derived from assignment intervals
 */
export const MAX_CONSECUTIVE_DAYS_CONTRACT = {
  type: 'max-consecutive-days' as const,
  scope: 'global-agent-sequence' as const,
  timing: 'prefix-checkable' as const,
  stateRequired: 'worked-dates-per-agent' as const,
  derivation: 'interval-to-calendar-days' as const,
  description: 'Limits the length of consecutive worked calendar day sequences',
};

// =============================================================================
// DOMAIN EXPLANATION - Regrouping support
// =============================================================================

/**
 * Domain-level consecutive days violation explanation.
 * 
 * This is the regrouped form of ConsecutiveDaysViolationReason for domain callers.
 */
export interface ConsecutiveDaysViolation {
  readonly type: 'consecutive-days-violation';
  readonly candidateId: Id;
  /** ISO date strings forming the consecutive run */
  readonly dates: readonly string[];
  readonly allowedMax: number;
  readonly actualDays: number;
  /** The shift that would have been assigned */
  readonly attemptedShiftId: Id;
  /** The date of the attempted shift */
  readonly attemptedDate: string;
}

/**
 * Regroup a primitive consecutive days violation into domain explanation.
 * 
 * @param violation - Primitive consecutive days violation
 * @param demandUnitToShift - Mapping from demand unit ID to shift ID
 * @returns Domain-level consecutive days violation
 */
export function regroupConsecutiveDaysViolation(
  violation: Omit<ConsecutiveDaysViolationReason, 'type'>,
  demandUnitToShift: ReadonlyMap<Id, Id>,
  demandUnitToDate: ReadonlyMap<Id, string>,
): ConsecutiveDaysViolation {
  const attemptedShiftId = demandUnitToShift.get(violation.candidateDemandUnitId) 
    ?? violation.candidateDemandUnitId;
  const attemptedDate = demandUnitToDate.get(violation.candidateDemandUnitId)
    ?? violation.runDates[violation.runDates.length - 1];
  
  return {
    type: 'consecutive-days-violation',
    candidateId: violation.agentId,
    dates: violation.runDates,
    allowedMax: violation.allowedMax,
    actualDays: violation.actualRunLength,
    attemptedShiftId,
    attemptedDate,
  };
}

// =============================================================================
// TYPE GUARDS - Runtime type checking
// =============================================================================

/**
 * Type guard for MaxConsecutiveDaysConstraint.
 */
export function isMaxConsecutiveDaysConstraint(c: Constraint): c is MaxConsecutiveDaysConstraint {
  return c.type === 'max-consecutive-days';
}

/**
 * Type guard for ConsecutiveDaysViolationReason.
 */
export function isConsecutiveDaysViolationReason(
  r: InfeasibilityReason,
): r is ConsecutiveDaysViolationReason {
  return r.type === 'consecutive-days-violation';
}

// =============================================================================
// COMMON LIMITS
// =============================================================================

/**
 * Common consecutive day limits.
 */
export const CONSECUTIVE_DAYS_LIMITS = {
  /** 5 days - standard work week */
  FIVE_DAYS: 5,
  /** 6 days - common maximum before required day off */
  SIX_DAYS: 6,
  /** 7 days - one full week */
  SEVEN_DAYS: 7,
  /** No limit (constraint disabled) */
  UNLIMITED: 0,
} as const;

// =============================================================================
// VALIDATION - Post-solve verification
// =============================================================================

/**
 * Validate that an agent's assignments satisfy max consecutive days.
 * 
 * Useful for verifying solver output or validating external schedules.
 * 
 * @param assignments - Agent's demand unit assignments
 * @param demandUnits - All demand units (for interval lookup)
 * @param maxDays - Maximum allowed consecutive worked days
 * @returns True if constraint satisfied, false otherwise
 */
export function validateConsecutiveDays(
  assignments: ReadonlyArray<{ readonly demandUnitId: Id }>,
  demandUnits: ReadonlyMap<Id, DemandUnit>,
  maxDays: number,
): boolean {
  if (maxDays <= 0) return true;
  
  const workedDates = new Set<string>();
  
  for (const assignment of assignments) {
    const demandUnit = demandUnits.get(assignment.demandUnitId);
    if (!demandUnit) continue;
    
    const dates = deriveWorkedDates(demandUnit.interval);
    for (const date of dates) {
      workedDates.add(date);
    }
  }
  
  const runs = findConsecutiveRuns(workedDates);
  return runs.every(run => run.length <= maxDays);
}
