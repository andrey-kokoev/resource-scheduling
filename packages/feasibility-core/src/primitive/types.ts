/**
 * Primitive layer types - domain-agnostic feasibility solver building blocks.
 * These types intentionally avoid domain names like Shift, Position, Candidate.
 */

/** Time interval with start and end timestamps */
export interface Interval {
  readonly start: Date;
  readonly end: Date;
}

/** Unique identifier type */
export type Id = string;

/** An agent that can be assigned to demand units (e.g., a candidate) */
export interface Agent {
  readonly id: Id;
}

/** A capability that an agent may possess (e.g., a qualification) */
export interface Capability {
  readonly id: Id;
  readonly validFrom?: Date;
  readonly validUntil?: Date;
}

/** Single atomic unit of demand that must be filled */
export interface DemandUnit {
  readonly id: Id;
  readonly interval: Interval;
  readonly requiredCapabilities: readonly Id[];
  readonly siteId?: Id;
  readonly lineId?: Id;
  readonly shiftFamilyId?: Id;
}

/** Assignment of an agent to a demand unit */
export interface Assignment {
  readonly agentId: Id;
  readonly demandUnitId: Id;
}

/** Constraint types for the feasibility solver */
export type Constraint =
  | NonOverlapConstraint
  | CapabilityConstraint
  | AvailabilityConstraint
  | ShiftPatternConstraint
  | CoverageConstraint
  | UtilizationConstraint
  | MinimumRestConstraint
  | MaxConsecutiveDaysConstraint;

/** Agents cannot be assigned to overlapping demand units */
export interface NonOverlapConstraint {
  readonly type: 'non-overlap';
  readonly agentIds: readonly Id[];
}

/** Agents must have valid capabilities for assigned demand units */
export interface CapabilityConstraint {
  readonly type: 'capability';
  readonly agentCapabilities: ReadonlyMap<Id, readonly Capability[]>;
}

/** Availability windows restricting when agents may be assigned */
export interface AvailabilityConstraint {
  readonly type: 'availability';
  readonly agentAvailability: ReadonlyMap<Id, readonly AvailabilityWindow[]>;
}

/** Time-bounded availability policy fact for one agent */
export interface AvailabilityWindow {
  readonly interval: Interval;
  readonly kind: 'available' | 'unavailable';
  readonly reason?: string;
}

/** Pattern rules restricting which assignments can be combined or accepted */
export interface ShiftPatternConstraint {
  readonly type: 'shift-pattern';
  readonly agentPatternRules: ReadonlyMap<Id, readonly AgentShiftPatternRule[]>;
}

/** First-pass compiled agent pattern rule */
export type AgentShiftPatternRule =
  | { readonly type: 'weekday-only'; readonly ruleId: Id }
  | { readonly type: 'weekend-only'; readonly ruleId: Id }
  | { readonly type: 'no-night-to-day-turnaround'; readonly ruleId: Id }
  | { readonly type: 'fixed-shift-family'; readonly ruleId: Id; readonly allowedShiftFamilyIds: readonly Id[] }
  | { readonly type: 'non-rotating'; readonly ruleId: Id };

/** Global coupled coverage requirements over an assignment set */
export interface CoverageConstraint {
  readonly type: 'coverage';
  readonly rules: readonly CoverageRequirement[];
}

/** First-pass compiled global coverage rules */
export type CoverageRequirement =
  | {
      readonly type: 'require-qualification-on-shift';
      readonly ruleId: Id;
      readonly shiftId: Id;
      readonly demandUnitIds: readonly Id[];
      readonly qualificationTypeId: Id;
    }
  | {
      readonly type: 'require-position-on-shift';
      readonly ruleId: Id;
      readonly shiftId: Id;
      readonly demandUnitIds: readonly Id[];
      readonly positionId: Id;
    }
  | {
      readonly type: 'require-support-when-dependent-staffed';
      readonly ruleId: Id;
      readonly shiftId: Id;
      readonly dependentPositionId: Id;
      readonly supportingPositionId: Id;
      readonly dependentDemandUnitIds: readonly Id[];
      readonly supportingDemandUnitIds: readonly Id[];
    }
  | {
      readonly type: 'require-supervisor-presence';
      readonly ruleId: Id;
      readonly shiftId: Id;
      readonly positionId: Id;
      readonly demandUnitIds: readonly Id[];
      readonly supervisorDemandUnitIds: readonly Id[];
    };

/** Rolling-window utilization rules */
export interface UtilizationConstraint {
  readonly type: 'utilization';
  readonly rules: readonly UtilizationRule[];
}

/** A utilization rule limiting assignments in a rolling window */
export interface UtilizationRule {
  readonly agentId: Id;
  readonly windowDays: number;
  readonly minAssignments?: number;
  readonly maxAssignments?: number;
}

/** Minimum rest required between sequential assignments of the same agent */
export interface MinimumRestConstraint {
  readonly type: 'minimum-rest';
  readonly agentIds: readonly Id[];
  readonly durationMs: number;
}

/** Maximum consecutive worked days constraint */
export interface MaxConsecutiveDaysConstraint {
  readonly type: 'max-consecutive-days';
  readonly agentIds: readonly Id[];
  readonly maxDays: number;
}

/** Input to the feasibility solver */
export interface SolveInput {
  readonly agents: readonly Agent[];
  readonly demandUnits: readonly DemandUnit[];
  readonly constraints: readonly Constraint[];
}

/** Result when feasibility is proven */
export interface FeasibleResult {
  readonly feasible: true;
  readonly assignments: readonly Assignment[];
}

/** Reason for infeasibility */
export type InfeasibilityReason =
  | NoEligibleAgentReason
  | OverlapConflictReason
  | CapabilityValidityGapReason
  | AvailabilityConflictReason
  | ShiftPatternConflictReason
  | CoverageConflictReason
  | UtilizationConflictReason
  | UnfilledDemandReason
  | RestViolationReason
  | ConsecutiveDaysViolationReason;

/** No agent has the required capabilities for a demand unit */
export interface NoEligibleAgentReason {
  readonly type: 'no-eligible-agent';
  readonly demandUnitId: Id;
  readonly reason: string;
}

/** Agent assigned to overlapping intervals */
export interface OverlapConflictReason {
  readonly type: 'overlap-conflict';
  readonly agentId: Id;
  readonly demandUnitIds: readonly Id[];
}

/** Agent capability not valid during assigned interval */
export interface CapabilityValidityGapReason {
  readonly type: 'capability-validity-gap';
  readonly agentId: Id;
  readonly capabilityId: Id;
  readonly demandUnitId: Id;
  readonly interval: Interval;
}

/** Agent is blocked by explicit availability policy */
export interface AvailabilityConflictReason {
  readonly type: 'availability-conflict';
  readonly agentId: Id;
  readonly demandUnitId: Id;
  readonly conflictKind: 'outside-available-window' | 'unavailable-overlap';
  readonly reason?: string;
}

/** Agent is blocked by an explicit shift-pattern rule */
export interface ShiftPatternConflictReason {
  readonly type: 'shift-pattern-conflict';
  readonly agentId: Id;
  readonly demandUnitId: Id;
  readonly ruleType: AgentShiftPatternRule['type'];
  readonly ruleId: Id;
  readonly relatedDemandUnitId?: Id;
  readonly shiftFamilyId?: Id;
  readonly allowedShiftFamilyIds?: readonly Id[];
}

/** Utilization rule would be violated */
export interface UtilizationConflictReason {
  readonly type: 'utilization-conflict';
  readonly agentId: Id;
  readonly rule: UtilizationRule;
  readonly wouldHaveAssignments: number;
  readonly demandUnitId: Id;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly affectedDemandUnitIds: readonly Id[];
}

/** Global coupled coverage rule would be violated */
export interface CoverageConflictReason {
  readonly type: 'coverage-conflict';
  readonly ruleId: Id;
  readonly coverageType: CoverageRequirement['type'];
  readonly shiftId: Id;
  readonly demandUnitIds: readonly Id[];
  readonly qualificationTypeId?: Id;
  readonly positionId?: Id;
  readonly dependentPositionId?: Id;
  readonly supportingPositionId?: Id;
  readonly supervisorDemandUnitIds?: readonly Id[];
}

/** Some demand units could not be filled */
export interface UnfilledDemandReason {
  readonly type: 'unfilled-demand';
  readonly demandUnitIds: readonly Id[];
}

/** Insufficient rest between sequential assignments */
export interface RestViolationReason {
  readonly type: 'rest-violation';
  readonly agentId: Id;
  readonly earlierDemandUnitId: Id;
  readonly laterDemandUnitId: Id;
  readonly requiredRestMs: number;
  readonly actualRestMs: number;
}

/** Consecutive worked days limit exceeded */
export interface ConsecutiveDaysViolationReason {
  readonly type: 'consecutive-days-violation';
  readonly agentId: Id;
  readonly candidateDemandUnitId: Id;
  readonly runDates: readonly string[];
  readonly allowedMax: number;
  readonly actualRunLength: number;
}

/** Result when infeasibility is proven */
export interface InfeasibleResult {
  readonly feasible: false;
  readonly reasons: readonly InfeasibilityReason[];
}

/** Solver result - either feasible with assignments or infeasible with reasons */
export type SolveResult = FeasibleResult | InfeasibleResult;

/** Eligibility edge connecting an agent to a demand unit they could fill */
export interface EligibilityEdge {
  readonly agentId: Id;
  readonly demandUnitId: Id;
}
