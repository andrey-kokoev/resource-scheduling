/**
 * Minimum-Rest Constraint Semantics
 * 
 * This module provides the minimum-rest constraint implementation as a
 * pressure test for the primitive feasibility model.
 * 
 * The minimum-rest constraint ensures agents have sufficient recovery time
 * between sequential assignments.
 * 
 * Calendar and interval math follows the same solve-wide local timezone basis
 * as the rest of the package. This module does not introduce an independent
 * timezone interpretation.
 * 
 * @module rest
 */

import type { Id, Interval, Constraint, InfeasibilityReason, DemandUnit, Assignment } from './primitive/types.js';

// =============================================================================
// PRIMITIVE TYPES - Minimum-rest constraint additions
// =============================================================================

/**
 * Minimum-rest constraint: Requires a minimum gap between sequential assignments.
 * 
 * INVARIANT: For any two assignments of the same agent where one ends before
 * the other starts, the gap between them must be >= durationMs.
 */
export interface MinimumRestConstraint {
  readonly type: 'minimum-rest';
  /** Agents subject to this rest constraint */
  readonly agentIds: readonly Id[];
  /** Minimum required rest duration in milliseconds */
  readonly durationMs: number;
}

/**
 * Extend the Constraint union via module augmentation pattern.
 * Users should cast or use type guards to handle this constraint type.
 */
export type ConstraintWithRest = Constraint | MinimumRestConstraint;

/**
 * Rest violation infeasibility reason.
 * 
 * Triggered when two assignments of the same agent are separated by
 * less than the required minimum rest.
 */
export interface RestViolationReason {
  readonly type: 'rest-violation';
  readonly agentId: Id;
  readonly earlierDemandUnitId: Id;
  readonly laterDemandUnitId: Id;
  readonly requiredRestMs: number;
  readonly actualRestMs: number;
}

/**
 * Extend the InfeasibilityReason union via module augmentation pattern.
 */
export type InfeasibilityReasonWithRest = InfeasibilityReason | RestViolationReason;

// =============================================================================
// INTERVAL SEMANTICS - Rest calculation
// =============================================================================

/**
 * Calculate the gap between two non-overlapping intervals.
 * 
 * PRECONDITION: The intervals do NOT overlap (checked by non-overlap constraint)
 * 
 * Returns the time between end of earlier interval and start of later interval.
 * Returns negative value if intervals overlap (should not happen with precondition).
 * Returns 0 if intervals are adjacent (end === start with half-open semantics).
 * 
 * @param a - First interval
 * @param b - Second interval
 * @returns Gap in milliseconds (>= 0 for valid non-overlapping intervals)
 */
export function calculateGap(a: Interval, b: Interval): number {
  if (a.end <= b.start) {
    // a ends before b starts
    return b.start.getTime() - a.end.getTime();
  } else if (b.end <= a.start) {
    // b ends before a starts
    return a.start.getTime() - b.end.getTime();
  } else {
    // Intervals overlap - this violates precondition
    // Return negative to indicate overlap
    return -Math.min(
      a.end.getTime() - b.start.getTime(),
      b.end.getTime() - a.start.getTime()
    );
  }
}

/**
 * Check if two intervals overlap.
 * 
 * With half-open interval semantics [start, end):
 * Overlap occurs when: a.start < b.end AND a.end > b.start
 */
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start;
}

// =============================================================================
// CONSTRAINT VALIDATION - Check minimum rest
// =============================================================================

/**
 * Result of checking minimum rest for a candidate assignment.
 */
export type RestCheckResult =
  | { readonly valid: true }
  | { 
      readonly valid: false;
      readonly violation: Omit<RestViolationReason, 'type'>;
    };

/**
 * Check if assigning an agent to a new demand unit satisfies minimum rest.
 * 
 * This is prefix-checkable: it only requires the candidate assignment
 * and existing committed assignments.
 * 
 * @param agentId - The agent being assigned
 * @param newDemandUnitId - The demand unit being assigned
 * @param newInterval - Interval of the new demand unit
 * @param existingAssignments - Agent's existing assignments
 * @param demandUnits - All demand units (for interval lookup)
 * @param requiredRestMs - Minimum required rest in milliseconds
 * @returns RestCheckResult indicating valid or violation details
 */
export function checkMinimumRest(
  agentId: Id,
  newDemandUnitId: Id,
  newInterval: Interval,
  existingAssignments: readonly Assignment[],
  demandUnits: ReadonlyMap<Id, DemandUnit>,
  requiredRestMs: number,
): RestCheckResult {
  // Skip check if no rest required
  if (requiredRestMs <= 0) {
    return { valid: true };
  }

  for (const existing of existingAssignments) {
    const existingDemand = demandUnits.get(existing.demandUnitId);
    if (!existingDemand) continue;
    
    const existingInterval = existingDemand.interval;
    
    // Skip overlaps - handled by non-overlap constraint
    if (intervalsOverlap(newInterval, existingInterval)) {
      continue;
    }
    
    // Calculate gap depending on order
    let gapMs: number;
    let earlierDemandId: Id;
    let laterDemandId: Id;
    
    if (existingInterval.end <= newInterval.start) {
      // Existing ends before new starts
      gapMs = newInterval.start.getTime() - existingInterval.end.getTime();
      earlierDemandId = existing.demandUnitId;
      laterDemandId = newDemandUnitId;
    } else if (newInterval.end <= existingInterval.start) {
      // New ends before existing starts
      gapMs = existingInterval.start.getTime() - newInterval.end.getTime();
      earlierDemandId = newDemandUnitId;
      laterDemandId = existing.demandUnitId;
    } else {
      // Should not reach here if intervalsOverlap is correct
      continue;
    }
    
    // Check rest requirement
    if (gapMs < requiredRestMs) {
      return {
        valid: false,
        violation: {
          agentId,
          earlierDemandUnitId: earlierDemandId,
          laterDemandUnitId: laterDemandId,
          requiredRestMs,
          actualRestMs: gapMs,
        },
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// CONSTRAINT CLASSIFICATION - Metadata
// =============================================================================

/**
 * Constraint contract metadata for minimum-rest constraints.
 * 
 * SCOPE: Global (per agent, pairwise between assignments)
 * TIMING: Prefix-checkable (only needs candidate + existing assignments)
 * DEPENDENCIES: Requires non-overlap constraint to filter overlapping pairs
 */
export const MINIMUM_REST_CONSTRAINT_CONTRACT = {
  type: 'minimum-rest' as const,
  scope: 'global-agent-pairwise' as const,
  timing: 'prefix-checkable' as const,
  dependencies: ['non-overlap'] as const,
  description: 'Requires minimum gap between sequential assignments of the same agent',
};

// =============================================================================
// DOMAIN EXPLANATION - Regrouping support
// =============================================================================

/**
 * Domain-level insufficient rest violation explanation.
 * 
 * This is the regrouped form of RestViolationReason for domain callers.
 */
export interface InsufficientRestViolation {
  readonly type: 'insufficient-rest';
  readonly candidateId: Id;
  readonly earlierShiftId: Id;
  readonly laterShiftId: Id;
  readonly requiredRestHours: number;
  readonly actualRestHours: number;
  readonly deficitHours: number;
}

/**
 * Convert milliseconds to hours (with fractional precision).
 */
export function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

/**
 * Convert hours to milliseconds.
 */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * Regroup a primitive rest violation into domain explanation.
 * 
 * @param violation - Primitive rest violation
 * @param demandUnitToShift - Mapping from demand unit ID to shift ID
 * @returns Domain-level insufficient rest violation
 */
export function regroupRestViolation(
  violation: Omit<RestViolationReason, 'type'>,
  demandUnitToShift: ReadonlyMap<Id, Id>,
): InsufficientRestViolation {
  const earlierShiftId = demandUnitToShift.get(violation.earlierDemandUnitId) ?? violation.earlierDemandUnitId;
  const laterShiftId = demandUnitToShift.get(violation.laterDemandUnitId) ?? violation.laterDemandUnitId;
  
  const requiredRestHours = msToHours(violation.requiredRestMs);
  const actualRestHours = msToHours(violation.actualRestMs);
  const deficitHours = requiredRestHours - actualRestHours;
  
  return {
    type: 'insufficient-rest',
    candidateId: violation.agentId,
    earlierShiftId,
    laterShiftId,
    requiredRestHours,
    actualRestHours,
    deficitHours,
  };
}

// =============================================================================
// TYPE GUARDS - Runtime type checking
// =============================================================================

/**
 * Type guard for MinimumRestConstraint.
 */
export function isMinimumRestConstraint(c: Constraint): c is MinimumRestConstraint {
  return c.type === 'minimum-rest';
}

/**
 * Type guard for RestViolationReason.
 */
export function isRestViolationReason(r: InfeasibilityReason): r is RestViolationReason {
  return r.type === 'rest-violation';
}

// =============================================================================
// UTILITY FUNCTIONS - Common rest calculations
// =============================================================================

/**
 * Common rest durations in milliseconds.
 */
export const REST_DURATIONS = {
  /** 8 hours - common full-time rest requirement */
  EIGHT_HOURS: hoursToMs(8),
  /** 10 hours - DOT/FMCSA commercial driver requirement */
  TEN_HOURS: hoursToMs(10),
  /** 11 hours - EU drivers regulation */
  ELEVEN_HOURS: hoursToMs(11),
  /** 24 hours - daily reset */
  TWENTY_FOUR_HOURS: hoursToMs(24),
  /** 0 hours - no rest required (for testing/adjacent shifts) */
  NONE: 0,
} as const;

/**
 * Check if a sequence of assignments satisfies minimum rest.
 * 
 * Useful for validating complete schedules post-solve.
 * 
 * @param assignmentIntervals - Assignments with their intervals, sorted by start time
 * @param requiredRestMs - Minimum required rest
 * @returns True if all sequential pairs satisfy rest requirement
 */
export function validateRestSequence(
  assignmentIntervals: ReadonlyArray<{ readonly assignment: Assignment; readonly interval: Interval }>,
  requiredRestMs: number,
): boolean {
  if (assignmentIntervals.length < 2) return true;
  
  // Sort by interval start
  const sorted = [...assignmentIntervals].sort(
    (a, b) => a.interval.start.getTime() - b.interval.start.getTime()
  );
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i].interval;
    const next = sorted[i + 1].interval;
    
    // Skip overlaps
    if (intervalsOverlap(current, next)) continue;
    
    const gap = next.start.getTime() - current.end.getTime();
    if (gap < requiredRestMs) return false;
  }
  
  return true;
}
