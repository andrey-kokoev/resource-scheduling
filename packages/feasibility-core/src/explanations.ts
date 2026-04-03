/**
 * Infeasibility Explanations
 * 
 * This module provides primitive-to-domain explanation regrouping.
 * It transforms solver-level infeasibility witnesses into domain-understandable
 * explanations in terms of Need, Shift, Position, and Candidate.
 * 
 * @module explanations
 */

import type {
  Id,
  SolveResult,
  InfeasibilityReason,
  Interval,
  Assignment,
} from './primitive/types.js';
import type { DomainInput, Need, Shift, Position, Candidate } from './domain/types.js';
import { regroupRestViolation } from './rest.js';
import type { InsufficientRestViolation } from './rest.js';

// =============================================================================
// PRIMITIVE WITNESS TYPES - Documentation of solver output
// =============================================================================

/**
 * Primitive witness: Demand unit cannot be filled by any agent
 * 
 * INVARIANT: Every agent violates at least one hard constraint for this demand
 */
export type UnfillableDemandUnitWitness = {
  readonly _tag: 'UnfillableDemandUnit';
  readonly demandUnitId: Id;
};

/**
 * Primitive witness: Agent lacks required capability or it's invalid
 * 
 * INVARIANT: Agent's capability set doesn't cover the full interval
 */
export type MissingCapabilityWitness = {
  readonly _tag: 'MissingCapability';
  readonly demandUnitId: Id;
  readonly agentId: Id;
  readonly capabilityId: Id;
  readonly interval: Interval;
};

/**
 * Primitive witness: Agent assigned to overlapping intervals
 * 
 * INVARIANT: Two or more assigned demand units have overlapping intervals
 */
export type OverlapConflictWitness = {
  readonly _tag: 'OverlapConflict';
  readonly agentId: Id;
  readonly demandUnitIds: readonly Id[];
};

/**
 * Primitive witness: Assignment would exceed rolling-window max
 * 
 * INVARIANT: wouldHave > maxAllowed for the window
 */
export type UtilizationViolationWitness = {
  readonly _tag: 'UtilizationViolation';
  readonly agentId: Id;
  readonly windowDays: number;
  readonly maxAllowed: number;
  readonly wouldHave: number;
  readonly affectedDemands: readonly Id[];
};

/**
 * Primitive witness: Solver exhausted all possibilities, demands remain
 * 
 * INVARIANT: Backtracking search failed to find complete assignment
 */
export type ResidualUnassignedWitness = {
  readonly _tag: 'ResidualUnassigned';
  readonly demandUnitIds: readonly Id[];
};

/**
 * Primitive witness: Insufficient rest between sequential assignments
 * 
 * INVARIANT: actualRestMs < requiredRestMs for sequential assignments
 */
export type RestViolationWitness = {
  readonly _tag: 'RestViolation';
  readonly agentId: Id;
  readonly earlierDemandUnitId: Id;
  readonly laterDemandUnitId: Id;
  readonly requiredRestMs: number;
  readonly actualRestMs: number;
};

/**
 * Primitive witness: Consecutive worked days limit exceeded
 * 
 * INVARIANT: actualRunLength > allowedMax
 */
export type ConsecutiveDaysViolationWitness = {
  readonly _tag: 'ConsecutiveDaysViolation';
  readonly agentId: Id;
  readonly candidateDemandUnitId: Id;
  readonly runDates: readonly string[];
  readonly allowedMax: number;
  readonly actualRunLength: number;
};

/** Union of all primitive witness types */
export type PrimitiveWitness =
  | UnfillableDemandUnitWitness
  | MissingCapabilityWitness
  | OverlapConflictWitness
  | UtilizationViolationWitness
  | ResidualUnassignedWitness
  | RestViolationWitness
  | ConsecutiveDaysViolationWitness;

// =============================================================================
// DOMAIN EXPLANATION TYPES - Regrouped for domain callers
// =============================================================================

/**
 * No candidate can fill the need due to capability or availability issues
 */
export interface NoEligibleCandidateForNeed {
  readonly type: 'no-eligible-candidate';
  readonly needId: Id;
  readonly shiftId: Id;
  readonly positionId: Id;
  readonly requiredQualifications: readonly Id[];
  readonly reason: 'missing-capability' | 'expired-capability' | 'no-candidates';
  readonly candidatesChecked: number;
}

/**
 * Candidate is blocked by explicit availability policy for a shift.
 */
export interface CandidateAvailabilityConflict {
  readonly type: 'availability-conflict';
  readonly candidateId: Id;
  readonly needId: Id;
  readonly shiftId: Id;
  readonly positionId: Id;
  readonly conflictKind: 'outside-available-window' | 'unavailable-overlap';
  readonly reason?: string;
}

/**
 * Candidate is blocked by explicit shift-pattern policy.
 */
export interface CandidateShiftPatternConflict {
  readonly type: 'shift-pattern-conflict';
  readonly candidateId: Id;
  readonly needId: Id;
  readonly shiftId: Id;
  readonly positionId: Id;
  readonly ruleType:
    | 'weekday-only'
    | 'weekend-only'
    | 'no-night-to-day-turnaround'
    | 'fixed-shift-family'
    | 'non-rotating';
  readonly relatedShiftId?: Id;
  readonly shiftFamilyId?: Id;
  readonly allowedShiftFamilyIds?: readonly Id[];
}

/**
 * Candidate would be assigned to overlapping shifts
 */
export interface CandidateOverlapConflict {
  readonly type: 'overlap-conflict';
  readonly candidateId: Id;
  readonly shiftIds: readonly Id[];
  readonly intervals: ReadonlyArray<{ readonly start: Date; readonly end: Date }>;
}

/**
 * Candidate would exceed rolling-window max assignments
 */
export interface UtilizationMaxViolation {
  readonly type: 'utilization-max-violation';
  readonly candidateId: Id;
  readonly windowDays: number;
  readonly maxAllowed: number;
  readonly wouldHave: number;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly affectedShiftIds: readonly Id[];
}

/**
 * Need cannot be fully filled (for needs with count > 1)
 */
export interface UnfilledNeed {
  readonly type: 'unfilled-need';
  readonly needId: Id;
  readonly shiftId: Id;
  readonly positionId: Id;
  readonly unfilledCount: number;
  readonly totalRequired: number;
}

/**
 * Consecutive worked days limit exceeded for a candidate
 */
export interface ConsecutiveDaysViolation {
  readonly type: 'consecutive-days-violation';
  readonly candidateId: Id;
  /** ISO date strings forming the consecutive run */
  readonly dates: readonly string[];
  readonly allowedMax: number;
  readonly actualDays: number;
  readonly attemptedShiftId: Id;
  readonly attemptedDate: string;
}

/**
 * Global coverage rule unsatisfied on a shift.
 *
 * Site and line metadata stay domain-level. They may be copied onto the
 * regrouped explanation when the domain input carries them, but they are not
 * separate primitive witness families.
 */
export interface CoverageRuleViolation {
  readonly type: 'coverage-conflict';
  readonly shiftId: Id;
  readonly ruleId: Id;
  readonly siteId?: Id;
  readonly lineId?: Id;
  readonly coverageType:
    | 'require-qualification-on-shift'
    | 'require-position-on-shift'
    | 'require-support-when-dependent-staffed'
    | 'require-supervisor-presence';
  readonly affectedNeedIds: readonly Id[];
  readonly qualificationTypeId?: Id;
  readonly positionId?: Id;
  readonly dependentPositionId?: Id;
  readonly supportingPositionId?: Id;
  readonly supervisorDemandUnitIds?: readonly Id[];
}

/** Union of all domain explanation types */
export type DomainExplanation =
  | NoEligibleCandidateForNeed
  | CandidateAvailabilityConflict
  | CandidateShiftPatternConflict
  | CandidateOverlapConflict
  | CoverageRuleViolation
  | UtilizationMaxViolation
  | UnfilledNeed
  | InsufficientRestViolation
  | ConsecutiveDaysViolation;

// =============================================================================
// REGROUPING CONTEXT - Required for reverse mapping
// =============================================================================

/**
 * Context needed to regroup primitive witnesses to domain explanations.
 * Captures the compilation state from DomainInput to SolveInput.
 */
export interface RegroupingContext {
  /** Original domain input used for compilation */
  readonly domainInput: DomainInput;
  
  /** Mapping from demand unit ID to compilation info */
  readonly demandUnitInfo: ReadonlyMap<Id, DemandUnitCompilationInfo>;
}

/**
 * Information about how a demand unit was compiled from domain entities
 */
export interface DemandUnitCompilationInfo {
  /** Source need ID */
  readonly needId: Id;
  /** Index within the need's expansion (0 to need.count-1) */
  readonly needIndex: number;
  /** Source shift ID */
  readonly shiftId: Id;
  /** Source site ID */
  readonly siteId?: Id;
  /** Source line ID */
  readonly lineId?: Id;
  /** Source position ID */
  readonly positionId: Id;
  /** Required capabilities (from position qualifications) */
  readonly requiredCapabilities: readonly Id[];
}

// =============================================================================
// DEMAND UNIT EXPANSION - Reverse mapping utilities
// =============================================================================

/**
 * Extract need ID from demand unit ID.
 * Demand unit IDs follow pattern: `{needId}#{index}`
 */
export function extractNeedId(demandUnitId: Id): Id {
  const hashIndex = demandUnitId.lastIndexOf('#');
  return hashIndex >= 0 ? demandUnitId.slice(0, hashIndex) : demandUnitId;
}

/**
 * Extract index from demand unit ID.
 * Returns 0 if no index found.
 */
export function extractNeedIndex(demandUnitId: Id): number {
  const hashIndex = demandUnitId.lastIndexOf('#');
  return hashIndex >= 0 ? parseInt(demandUnitId.slice(hashIndex + 1), 10) : 0;
}

/**
 * Build regrouping context from domain input.
 * This captures the compilation mapping for reverse lookup.
 */
export function buildRegroupingContext(domainInput: DomainInput): RegroupingContext {
  const demandUnitInfo = new Map<Id, DemandUnitCompilationInfo>();
  
  const shiftMap = new Map(domainInput.shifts.map(s => [s.id, s]));
  const posQualsByPosition = groupBy(
    domainInput.positionQualifications, 
    pq => pq.positionId
  );
  
  for (const need of domainInput.needs) {
    const shift = shiftMap.get(need.shiftId);
    if (!shift) continue;
    
    const requiredCapabilities = (posQualsByPosition.get(need.positionId) ?? [])
      .filter(pq => pq.required)
      .map(pq => pq.qualificationTypeId);
    
    // Expand need into demand units (mirrors compiler logic)
    for (let i = 0; i < need.count; i++) {
      const demandUnitId = `${need.id}#${i}`;
    demandUnitInfo.set(demandUnitId, {
      needId: need.id,
      needIndex: i,
      shiftId: need.shiftId,
      siteId: shift.siteId,
      lineId: need.lineId,
      positionId: need.positionId,
      requiredCapabilities,
    });
  }
  }
  
  return { domainInput, demandUnitInfo };
}

// =============================================================================
// TYPE GUARDS - For filtering infeasibility reasons
// =============================================================================

function isNoEligibleAgentReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'no-eligible-agent' }> {
  return r.type === 'no-eligible-agent';
}

function isOverlapConflictReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'overlap-conflict' }> {
  return r.type === 'overlap-conflict';
}

function isAvailabilityConflictReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'availability-conflict' }> {
  return r.type === 'availability-conflict';
}

function isShiftPatternConflictReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'shift-pattern-conflict' }> {
  return r.type === 'shift-pattern-conflict';
}

function isCoverageConflictReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'coverage-conflict' }> {
  return r.type === 'coverage-conflict';
}

function isUtilizationConflictReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'utilization-conflict' }> {
  return r.type === 'utilization-conflict';
}

function isUnfilledDemandReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'unfilled-demand' }> {
  return r.type === 'unfilled-demand';
}

function isRestViolationReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'rest-violation' }> {
  return r.type === 'rest-violation';
}

function isConsecutiveDaysViolationReason(r: InfeasibilityReason): r is Extract<InfeasibilityReason, { type: 'consecutive-days-violation' }> {
  return r.type === 'consecutive-days-violation';
}

// =============================================================================
// REGROUPING FUNCTIONS - Transform primitive to domain
// =============================================================================

/**
 * Regroup a complete infeasibility result into domain explanations.
 * 
 * This is the main entry point for converting solver output to
 * domain-understandable explanations.
 */
export function regroupToDomainExplanations(
  result: Extract<SolveResult, { feasible: false }>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  const explanations: DomainExplanation[] = [];
  
  // Filter and process each reason type
  const noEligible = result.reasons.filter(isNoEligibleAgentReason);
  explanations.push(...regroupNoEligibleAgents(noEligible, context));
  
  const overlaps = result.reasons.filter(isOverlapConflictReason);
  explanations.push(...regroupOverlapConflicts(overlaps, context));

  const availabilityConflicts = result.reasons.filter(isAvailabilityConflictReason);
  explanations.push(...regroupAvailabilityConflicts(availabilityConflicts, context));

  const shiftPatternConflicts = result.reasons.filter(isShiftPatternConflictReason);
  explanations.push(...regroupShiftPatternConflicts(shiftPatternConflicts, context));

  const coverageConflicts = result.reasons.filter(isCoverageConflictReason);
  explanations.push(...regroupCoverageConflicts(coverageConflicts, context));
  
  const utilizations = result.reasons.filter(isUtilizationConflictReason);
  explanations.push(...regroupUtilizationConflicts(utilizations, context));
  
  const unfilled = result.reasons.filter(isUnfilledDemandReason);
  explanations.push(...regroupUnfilledDemands(unfilled, context));
  
  const restViolations = result.reasons.filter(isRestViolationReason);
  explanations.push(...regroupRestViolations(restViolations, context));
  
  const consecutiveViolations = result.reasons.filter(isConsecutiveDaysViolationReason);
  explanations.push(...regroupConsecutiveDaysViolations(consecutiveViolations, context));
  
  return normalizeDomainExplanations(explanations);
}

/**
 * Regroup 'availability-conflict' reasons into domain explanations.
 */
function regroupAvailabilityConflicts(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'availability-conflict' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  return reasons.flatMap(reason => {
    const info = context.demandUnitInfo.get(reason.demandUnitId);
    if (!info) {
      return [];
    }

    return [{
      type: 'availability-conflict',
      candidateId: reason.agentId,
      needId: info.needId,
      shiftId: info.shiftId,
      positionId: info.positionId,
      conflictKind: reason.conflictKind,
      reason: reason.reason,
    } satisfies CandidateAvailabilityConflict];
  });
}

/**
 * Regroup 'shift-pattern-conflict' reasons into domain explanations.
 */
function regroupShiftPatternConflicts(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'shift-pattern-conflict' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  return reasons.flatMap(reason => {
    const info = context.demandUnitInfo.get(reason.demandUnitId);
    if (!info) {
      return [];
    }

    const shift = context.domainInput.shifts.find(s => s.id === info.shiftId);

    return [{
      type: 'shift-pattern-conflict',
      candidateId: reason.agentId,
      needId: info.needId,
      shiftId: info.shiftId,
      positionId: info.positionId,
      ruleType: reason.ruleType,
      relatedShiftId: reason.relatedDemandUnitId
        ? context.demandUnitInfo.get(reason.relatedDemandUnitId)?.shiftId
        : undefined,
      shiftFamilyId: reason.shiftFamilyId ?? shift?.shiftFamilyId,
      allowedShiftFamilyIds: reason.allowedShiftFamilyIds,
    } satisfies CandidateShiftPatternConflict];
  });
}

/**
 * Regroup 'no-eligible-agent' reasons into domain explanations.
 */
function regroupNoEligibleAgents(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'no-eligible-agent' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  // Group by need ID
  const byNeed = groupBy(reasons, r => {
    const info = context.demandUnitInfo.get(r.demandUnitId);
    return info?.needId ?? extractNeedId(r.demandUnitId);
  });
  
  const explanations: DomainExplanation[] = [];
  
  for (const [needId, needReasons] of byNeed) {
    const firstInfo = context.demandUnitInfo.get(needReasons[0].demandUnitId);
    if (!firstInfo) continue;
    
    const need = context.domainInput.needs.find(n => n.id === needId);
    if (!need) continue;
    
    // Count candidates checked (total unique agents)
    const candidatesChecked = new Set(
      context.domainInput.candidates.map(c => c.id)
    ).size;
    
    if (need.count > 1 && needReasons.length > 1) {
      // Multiple units from same need - group as unfilled-need
      explanations.push({
        type: 'unfilled-need',
        needId,
        shiftId: firstInfo.shiftId,
        positionId: firstInfo.positionId,
        unfilledCount: needReasons.length,
        totalRequired: need.count,
      });
    } else {
      // Single unit - detailed explanation
      explanations.push({
        type: 'no-eligible-candidate',
        needId,
        shiftId: firstInfo.shiftId,
        positionId: firstInfo.positionId,
        requiredQualifications: firstInfo.requiredCapabilities,
        reason: 'no-candidates',
        candidatesChecked,
      });
    }
  }
  
  return explanations;
}

/**
 * Regroup 'overlap-conflict' reasons into domain explanations.
 */
function regroupOverlapConflicts(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'overlap-conflict' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  // Group by agent
  const byAgent = groupBy(reasons, r => r.agentId);
  const explanations: DomainExplanation[] = [];
  
  for (const [agentId, agentReasons] of byAgent) {
    // Collect all demand units and their shifts
    const demandUnitIds = new Set<Id>();
    for (const r of agentReasons) {
      for (const duid of r.demandUnitIds) {
        demandUnitIds.add(duid);
      }
    }
    
    const shiftIds = new Set<Id>();
    const intervals: Array<{ start: Date; end: Date }> = [];
    
    for (const duid of demandUnitIds) {
      const info = context.demandUnitInfo.get(duid);
      if (info) {
        shiftIds.add(info.shiftId);
        const shift = context.domainInput.shifts.find(s => s.id === info.shiftId);
        if (shift) {
          intervals.push(shiftToInterval(shift));
        }
      }
    }
    
    if (shiftIds.size >= 2) {
      explanations.push({
        type: 'overlap-conflict',
        candidateId: agentId,
        shiftIds: Array.from(shiftIds).sort(),
        intervals,
      });
    }
  }
  
  return explanations;
}

/**
 * Regroup 'coverage-conflict' reasons into domain explanations.
 */
function regroupCoverageConflicts(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'coverage-conflict' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  return reasons.map(reason => {
    const affectedNeedIds = Array.from(new Set(
      reason.demandUnitIds
        .map(demandUnitId => context.demandUnitInfo.get(demandUnitId)?.needId)
        .filter((needId): needId is Id => Boolean(needId)),
    )).sort();
    const firstInfo = reason.demandUnitIds
      .map(demandUnitId => context.demandUnitInfo.get(demandUnitId))
      .find((info): info is DemandUnitCompilationInfo => Boolean(info));
    const coverageRule = context.domainInput.coverageRules?.find(r => r.id === reason.ruleId);
    const shift = context.domainInput.shifts.find(s => s.id === reason.shiftId);

    return {
      type: 'coverage-conflict',
      shiftId: reason.shiftId,
      ruleId: reason.ruleId,
      siteId: firstInfo?.siteId ?? shift?.siteId ?? coverageRule?.siteId,
      lineId: coverageRule?.lineId,
      coverageType: reason.coverageType,
      affectedNeedIds,
      qualificationTypeId: reason.qualificationTypeId,
      positionId: reason.positionId,
      dependentPositionId: reason.dependentPositionId,
      supportingPositionId: reason.supportingPositionId,
      supervisorDemandUnitIds: reason.supervisorDemandUnitIds,
    } satisfies CoverageRuleViolation;
  });
}

/**
 * Regroup 'utilization-conflict' reasons into domain explanations.
 */
function regroupUtilizationConflicts(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'utilization-conflict' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  const explanations: DomainExplanation[] = [];
  
  for (const reason of reasons) {
    const affectedShiftIds = Array.from(new Set(
      reason.affectedDemandUnitIds
        .map(demandUnitId => context.demandUnitInfo.get(demandUnitId)?.shiftId)
        .filter((shiftId): shiftId is Id => Boolean(shiftId)),
    )).sort();
    
    explanations.push({
      type: 'utilization-max-violation',
      candidateId: reason.agentId,
      windowDays: reason.rule.windowDays,
      maxAllowed: reason.rule.maxAssignments ?? 0,
      wouldHave: reason.wouldHaveAssignments,
      windowStart: reason.windowStart,
      windowEnd: reason.windowEnd,
      affectedShiftIds,
    });
  }
  
  return explanations;
}

/**
 * Regroup 'unfilled-demand' reasons into domain explanations.
 */
function regroupUnfilledDemands(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'unfilled-demand' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  // Group demand unit IDs by need
  const byNeed = new Map<Id, Id[]>();
  
  for (const reason of reasons) {
    for (const duid of reason.demandUnitIds) {
      const info = context.demandUnitInfo.get(duid);
      if (info) {
        const existing = byNeed.get(info.needId) ?? [];
        existing.push(duid);
        byNeed.set(info.needId, existing);
      }
    }
  }
  
  const explanations: DomainExplanation[] = [];
  
  for (const [needId, demandUnitIds] of byNeed) {
    const info = context.demandUnitInfo.get(demandUnitIds[0]);
    const need = context.domainInput.needs.find(n => n.id === needId);
    
    if (info && need) {
      explanations.push({
        type: 'unfilled-need',
        needId,
        shiftId: info.shiftId,
        positionId: info.positionId,
        unfilledCount: demandUnitIds.length,
        totalRequired: need.count,
      });
    }
  }
  
  return explanations;
}

/**
 * Regroup 'rest-violation' reasons into domain explanations.
 */
function regroupRestViolations(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'rest-violation' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  const demandUnitToShift = new Map<Id, Id>();

  for (const [demandUnitId, info] of context.demandUnitInfo) {
    demandUnitToShift.set(demandUnitId, info.shiftId);
  }

  return reasons.map(reason =>
    regroupRestViolation(
      {
        agentId: reason.agentId,
        earlierDemandUnitId: reason.earlierDemandUnitId,
        laterDemandUnitId: reason.laterDemandUnitId,
        requiredRestMs: reason.requiredRestMs,
        actualRestMs: reason.actualRestMs,
      },
      demandUnitToShift,
    ),
  );
}

/**
 * Regroup 'consecutive-days-violation' reasons into domain explanations.
 */
function regroupConsecutiveDaysViolations(
  reasons: ReadonlyArray<Extract<InfeasibilityReason, { type: 'consecutive-days-violation' }>>,
  context: RegroupingContext,
): readonly DomainExplanation[] {
  const explanations: DomainExplanation[] = [];
  
  for (const reason of reasons) {
    // Map demand unit to shift info
    const info = context.demandUnitInfo.get(reason.candidateDemandUnitId);
    
    const attemptedShiftId = info?.shiftId ?? reason.candidateDemandUnitId;
    const attemptedDate = info?.shiftId 
      ? (context.domainInput.shifts.find(s => s.id === info.shiftId)?.date ?? reason.runDates[reason.runDates.length - 1])
      : reason.runDates[reason.runDates.length - 1];
    
    explanations.push({
      type: 'consecutive-days-violation',
      candidateId: reason.agentId,
      dates: reason.runDates,
      allowedMax: reason.allowedMax,
      actualDays: reason.actualRunLength,
      attemptedShiftId,
      attemptedDate,
    });
  }
  
  return explanations;
}

function normalizeDomainExplanations(explanations: readonly DomainExplanation[]): readonly DomainExplanation[] {
  return [...explanations].sort(compareDomainExplanations);
}

function compareDomainExplanations(a: DomainExplanation, b: DomainExplanation): number {
  const typeOrder = getDomainExplanationTypeOrder(a.type) - getDomainExplanationTypeOrder(b.type);
  if (typeOrder !== 0) {
    return typeOrder;
  }

  return getDomainExplanationSortKey(a).localeCompare(getDomainExplanationSortKey(b));
}

function getDomainExplanationTypeOrder(type: DomainExplanation['type']): number {
  switch (type) {
    case 'no-eligible-candidate':
      return 0;
    case 'overlap-conflict':
      return 1;
    case 'availability-conflict':
      return 2;
    case 'shift-pattern-conflict':
      return 3;
    case 'coverage-conflict':
      return 4;
    case 'utilization-max-violation':
      return 5;
    case 'insufficient-rest':
      return 6;
    case 'unfilled-need':
      return 7;
    case 'consecutive-days-violation':
      return 8;
  }

  throw new Error(`Unhandled domain explanation type: ${String(type)}`);
}

function getDomainExplanationSortKey(explanation: DomainExplanation): string {
  switch (explanation.type) {
    case 'no-eligible-candidate':
      return `${explanation.needId}:${explanation.shiftId}:${explanation.positionId}:${explanation.reason}:${explanation.candidatesChecked}`;
    case 'overlap-conflict':
      return `${explanation.candidateId}:${explanation.shiftIds.join(',')}:${explanation.intervals.map(interval => `${interval.start.toISOString()}-${interval.end.toISOString()}`).join('|')}`;
    case 'availability-conflict':
      return `${explanation.candidateId}:${explanation.needId}:${explanation.shiftId}:${explanation.positionId}:${explanation.conflictKind}:${explanation.reason ?? ''}`;
    case 'shift-pattern-conflict':
      return `${explanation.candidateId}:${explanation.needId}:${explanation.shiftId}:${explanation.positionId}:${explanation.ruleType}:${explanation.relatedShiftId ?? ''}:${explanation.shiftFamilyId ?? ''}:${(explanation.allowedShiftFamilyIds ?? []).join(',')}`;
    case 'coverage-conflict':
      return `${explanation.shiftId}:${explanation.ruleId}:${explanation.coverageType}:${explanation.affectedNeedIds.join(',')}:${explanation.qualificationTypeId ?? ''}:${explanation.positionId ?? ''}:${explanation.dependentPositionId ?? ''}:${explanation.supportingPositionId ?? ''}:${explanation.supervisorDemandUnitIds?.join(',') ?? ''}`;
    case 'utilization-max-violation':
      return `${explanation.candidateId}:${explanation.windowDays}:${explanation.maxAllowed}:${explanation.wouldHave}:${explanation.windowStart.toISOString()}:${explanation.windowEnd.toISOString()}:${explanation.affectedShiftIds.join(',')}`;
    case 'insufficient-rest':
      return `${explanation.candidateId}:${explanation.earlierShiftId}:${explanation.laterShiftId}:${explanation.requiredRestHours}:${explanation.actualRestHours}:${explanation.deficitHours}`;
    case 'unfilled-need':
      return `${explanation.needId}:${explanation.shiftId}:${explanation.positionId}:${explanation.unfilledCount}:${explanation.totalRequired}`;
    case 'consecutive-days-violation':
      return `${explanation.candidateId}:${explanation.attemptedShiftId}:${explanation.attemptedDate}:${explanation.allowedMax}:${explanation.actualDays}:${explanation.dates.join(',')}`;
  }

  throw new Error('Unhandled domain explanation type');
}

// =============================================================================
// EXPLANATION OUTPUT - Full result with domain explanations
// =============================================================================

/**
 * Full solver result with domain-level explanations.
 */
export type DomainSolveResult =
  | { readonly feasible: true; readonly assignments: readonly Assignment[] }
  | { 
      readonly feasible: false; 
      readonly explanations: readonly DomainExplanation[];
      readonly primitiveReasons?: readonly InfeasibilityReason[];
    };

/**
 * Solve and return domain-level explanations for infeasibility.
 * 
 * This is a convenience wrapper that combines solving with regrouping.
 * Note: In a real implementation, this would import and call the actual solve function.
 */
export function solveWithDomainExplanations(
  _solveResult: SolveResult,
  context: RegroupingContext,
): DomainSolveResult {
  // This would actually call solve() and then regroup
  // For now, just demonstrating the return type
  
  // Placeholder - actual implementation would be:
  // const result = solve(input);
  // if (result.feasible) return result;
  // return {
  //   feasible: false,
  //   explanations: regroupToDomainExplanations(result, context),
  //   primitiveReasons: result.reasons
  // };
  
  throw new Error('Not implemented - use solve() then regroupToDomainExplanations()');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Group array items by key function.
 */
function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const result = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = result.get(key) ?? [];
    existing.push(item);
    result.set(key, existing);
  }
  return result;
}

/**
 * Convert shift to interval for comparison.
 */
function shiftToInterval(shift: Shift): { start: Date; end: Date } {
  const [year, month, day] = shift.date.split('-').map(Number);
  const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
  const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
  
  const start = new Date(year, month - 1, day, startHours, startMinutes);
  const end = new Date(year, month - 1, day, endHours, endMinutes);
  
  // Handle shifts crossing midnight
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  return { start, end };
}
