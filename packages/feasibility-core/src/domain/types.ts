/**
 * Domain layer types - staffing-specific entities.
 * These compile into the primitive layer for solving.
 */

import type { Id, Interval } from '../primitive/types.js';

/** Calendar date (YYYY-MM-DD) */
export type DateString = string;

/** A physical site or plant location */
export interface Site {
  readonly id: Id;
  readonly name: string;
}

/** A line or area within a site */
export interface Line {
  readonly id: Id;
  readonly siteId: Id;
  readonly name: string;
}

/** A work shift as a labeled time interval on a specific date */
export interface Shift {
  readonly id: Id;
  readonly date: DateString;
  readonly startTime: string; // HH:MM format
  readonly endTime: string;   // HH:MM format
  readonly siteId?: Id;
  readonly shiftFamilyId?: Id;
}

/** A position requiring specific capabilities */
export interface Position {
  readonly id: Id;
  readonly name: string;
}

/** Qualification type (e.g., "RN", "LPN", "CNA") */
export interface QualificationType {
  readonly id: Id;
  readonly name: string;
}

/** A requirement for staff at a position during a shift, optionally scoped to a line */
export interface Need {
  readonly id: Id;
  readonly shiftId: Id;
  readonly lineId?: Id;
  readonly positionId: Id;
  readonly count: number; // Number of agents needed
}

/** A candidate who can be assigned to needs */
export interface Candidate {
  readonly id: Id;
  readonly name: string;
}

/** Candidate-specific working availability for a time interval */
export interface CandidateAvailability {
  readonly candidateId: Id;
  readonly interval: Interval;
  readonly kind: 'available' | 'unavailable';
  readonly reason?: string;
}

/** Candidate-specific shift-pattern compatibility rule */
export interface ShiftPatternRule {
  readonly id: Id;
  readonly candidateId: Id;
  readonly type:
    | 'no-night-to-day-turnaround'
    | 'weekday-only'
    | 'weekend-only'
    | 'fixed-shift-family'
    | 'non-rotating';
  readonly shiftFamilyIds?: readonly Id[];
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/** Candidate-specific minimum rest rule */
export interface MinimumRestRule {
  readonly id: Id;
  readonly candidateId: Id;
  readonly requiredRestHours: number;
}

/** Candidate-specific consecutive-work limit rule */
export interface ConsecutiveWorkRule {
  readonly id: Id;
  readonly candidateId: Id;
  readonly maxDays: number;
}

/** Cross-position, site-level, or line-level coverage rule */
export interface CoverageRule {
  readonly id: Id;
  readonly type:
    | 'require-position-on-shift'
    | 'require-qualification-on-shift'
    | 'require-support-when-dependent-staffed'
    | 'require-supervisor-presence';
  readonly siteId?: Id;
  readonly shiftId?: Id;
  readonly lineId?: Id;
  readonly positionId?: Id;
  readonly dependentPositionId?: Id;
  readonly supportingPositionId?: Id;
  readonly qualificationTypeId?: Id;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/** Qualification required for a position */
export interface PositionQualification {
  readonly positionId: Id;
  readonly qualificationTypeId: Id;
  readonly required: boolean;
}

/** Qualification held by a candidate with validity period */
export interface CandidateQualification {
  readonly candidateId: Id;
  readonly qualificationTypeId: Id;
  readonly validFrom: Date;
  readonly validUntil?: Date;
}

/** Utilization rule for a candidate in a rolling window */
export interface UtilizationRule {
  readonly candidateId: Id;
  readonly windowDays: number;
  readonly minShifts?: number;
  readonly maxShifts?: number;
}

/** Complete domain input */
export interface DomainInput {
  readonly sites?: readonly Site[];
  readonly lines?: readonly Line[];
  readonly shifts: readonly Shift[];
  readonly positions: readonly Position[];
  readonly needs: readonly Need[];
  readonly candidates: readonly Candidate[];
  readonly qualificationTypes: readonly QualificationType[];
  readonly positionQualifications: readonly PositionQualification[];
  readonly candidateQualifications: readonly CandidateQualification[];
  readonly utilizationRules: readonly UtilizationRule[];
  readonly candidateAvailability?: readonly CandidateAvailability[];
  readonly shiftPatternRules?: readonly ShiftPatternRule[];
  readonly minimumRestRules?: readonly MinimumRestRule[];
  readonly consecutiveWorkRules?: readonly ConsecutiveWorkRule[];
  readonly coverageRules?: readonly CoverageRule[];
}
