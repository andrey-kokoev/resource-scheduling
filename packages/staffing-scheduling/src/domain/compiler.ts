/**
 * Domain-to-Primitive compiler.
 * Transforms staffing-specific domain entities into primitive feasibility solver inputs.
 */

import type {
  Agent,
  AgentShiftPatternRule,
  Assignment,
  AvailabilityWindow,
  Capability,
  Constraint,
  CoverageRequirement,
  DemandUnit,
  EligibilityEdge,
  Id,
  Interval,
  MaxConsecutiveDaysConstraint,
  MinimumRestConstraint,
  SolveInput,
  UtilizationRule,
} from '../primitive/types.js';
import type {
  Candidate,
  CandidateAvailability,
  CandidateQualification,
  DateString,
  DomainInput,
  ConsecutiveWorkRule,
  Need,
  MinimumRestRule,
  PositionQualification,
  Shift,
  ShiftPatternRule,
  CoverageRule,
  UtilizationRule as DomainUtilizationRule,
} from './types.js';

/**
 * Compile domain input into primitive solver input.
 * Expands Needs into atomic DemandUnits based on count.
 */
export function compileDomain(input: DomainInput): SolveInput {
  const agents: Agent[] = input.candidates.map(c => ({ id: c.id }));
  
  const demandUnits = expandNeedsToDemandUnits(
    input.needs,
    input.shifts,
    input.positions,
    input.positionQualifications,
  );

  const agentCapabilities = buildAgentCapabilities(
    input.candidates,
    input.candidateQualifications,
  );

  const agentAvailability = buildAgentAvailability(
    input.candidates,
    input.candidateAvailability ?? [],
  );

  const agentPatternRules = buildAgentPatternRules(
    input.candidates,
    input.shiftPatternRules ?? [],
  );

  const minimumRestRules = buildMinimumRestRules(
    input.candidates,
    input.minimumRestRules ?? [],
  );

  const consecutiveWorkRules = buildConsecutiveWorkRules(
    input.candidates,
    input.consecutiveWorkRules ?? [],
  );

  const coverageRules = buildCoverageRules(
    input.needs,
    input.shifts,
    input.coverageRules ?? [],
  );

  const constraints: Constraint[] = [
    // All agents have non-overlap constraint
    { type: 'non-overlap', agentIds: agents.map(a => a.id) },
    // Capability constraints
    { type: 'capability', agentCapabilities },
    // Availability constraints
    { type: 'availability', agentAvailability },
    // Shift pattern constraints
    { type: 'shift-pattern', agentPatternRules },
    // Minimum rest constraints
    ...minimumRestRules,
    // Consecutive work constraints
    ...consecutiveWorkRules,
    // Global coverage coupling constraints
    { type: 'coverage', rules: coverageRules },
    // Utilization constraints
    { 
      type: 'utilization', 
      rules: compileUtilizationRules(input.utilizationRules),
    },
  ];

  return {
    agents,
    demandUnits,
    constraints,
  };
}

/**
 * Expand Need records into atomic DemandUnit records.
 * A Need with count=3 creates 3 DemandUnits with the same requirements.
 */
function expandNeedsToDemandUnits(
  needs: readonly Need[],
  shifts: readonly Shift[],
  positions: readonly { id: Id; name: string }[],
  positionQualifications: readonly PositionQualification[],
): DemandUnit[] {
  const shiftMap = new Map(shifts.map(s => [s.id, s]));
  const posQualsByPosition = groupBy(positionQualifications, pq => pq.positionId);

  const demandUnits: DemandUnit[] = [];

  for (const need of needs) {
    const shift = shiftMap.get(need.shiftId);
    if (!shift) continue;

    const interval = shiftToInterval(shift);
    const requiredCapabilities = (posQualsByPosition.get(need.positionId) ?? [])
      .filter(pq => pq.required)
      .map(pq => pq.qualificationTypeId);

    // Create count demand units
    for (let i = 0; i < need.count; i++) {
      demandUnits.push({
        id: `${need.id}#${i}`,
        interval,
        requiredCapabilities,
        siteId: shift.siteId,
        lineId: need.lineId,
        shiftFamilyId: shift.shiftFamilyId,
      });
    }
  }

  return demandUnits;
}

/**
 * Convert a shift to a time interval.
 */
function shiftToInterval(shift: Shift): Interval {
  const start = parseDateTime(shift.date, shift.startTime);
  const end = parseDateTime(shift.date, shift.endTime);
  
  // Handle shifts that cross midnight
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  return { start, end };
}

/**
 * Parse YYYY-MM-DD and HH:MM into a Date.
 */
function parseDateTime(dateStr: DateString, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Build map of agent ID to their capabilities with validity periods.
 */
function buildAgentCapabilities(
  candidates: readonly Candidate[],
  qualifications: readonly CandidateQualification[],
): Map<Id, Capability[]> {
  const result = new Map<Id, Capability[]>();
  
  const qualsByCandidate = groupBy(qualifications, q => q.candidateId);
  
  for (const candidate of candidates) {
    const caps: Capability[] = (qualsByCandidate.get(candidate.id) ?? [])
      .map(q => ({
        id: q.qualificationTypeId,
        validFrom: q.validFrom,
        validUntil: q.validUntil,
      }));
    result.set(candidate.id, caps);
  }
  
  return result;
}

/**
 * Build map of agent ID to their availability windows.
 */
function buildAgentAvailability(
  candidates: readonly Candidate[],
  availability: readonly CandidateAvailability[],
): Map<Id, AvailabilityWindow[]> {
  const result = new Map<Id, AvailabilityWindow[]>();
  const availabilityByCandidate = groupBy(availability, a => a.candidateId);

  for (const candidate of candidates) {
    const windows: AvailabilityWindow[] = (availabilityByCandidate.get(candidate.id) ?? [])
      .map(entry => ({
        interval: entry.interval,
        kind: entry.kind,
        reason: entry.reason,
      }));
    result.set(candidate.id, windows);
  }

  return result;
}

/**
 * Build map of agent ID to compiled first-pass shift pattern rules.
 */
function buildAgentPatternRules(
  candidates: readonly Candidate[],
  rules: readonly ShiftPatternRule[],
): Map<Id, AgentShiftPatternRule[]> {
  const result = new Map<Id, AgentShiftPatternRule[]>();
  const rulesByCandidate = groupBy(rules, r => r.candidateId);

  for (const candidate of candidates) {
    const compiled: AgentShiftPatternRule[] = [];
    for (const rule of rulesByCandidate.get(candidate.id) ?? []) {
      if (
        rule.type === 'weekday-only' ||
        rule.type === 'weekend-only' ||
        rule.type === 'no-night-to-day-turnaround' ||
        rule.type === 'non-rotating'
      ) {
        compiled.push({
          type: rule.type,
          ruleId: rule.id,
        });
        continue;
      }

      if (rule.type === 'fixed-shift-family') {
        compiled.push({
          type: rule.type,
          ruleId: rule.id,
          allowedShiftFamilyIds: rule.shiftFamilyIds ?? [],
        });
      }
    }
    result.set(candidate.id, compiled);
  }

  return result;
}

/**
 * Build minimum-rest constraints for each candidate rule.
 */
function buildMinimumRestRules(
  candidates: readonly Candidate[],
  rules: readonly MinimumRestRule[],
): MinimumRestConstraint[] {
  const knownCandidateIds = new Set(candidates.map(candidate => candidate.id));
  const compiled: MinimumRestConstraint[] = [];

  for (const rule of rules) {
    if (!knownCandidateIds.has(rule.candidateId) || rule.requiredRestHours <= 0) {
      continue;
    }

    compiled.push({
      type: 'minimum-rest',
      agentIds: [rule.candidateId],
      durationMs: rule.requiredRestHours * 60 * 60 * 1000,
    });
  }

  return compiled;
}

/**
 * Build max-consecutive-days constraints for each candidate rule.
 */
function buildConsecutiveWorkRules(
  candidates: readonly Candidate[],
  rules: readonly ConsecutiveWorkRule[],
): MaxConsecutiveDaysConstraint[] {
  const knownCandidateIds = new Set(candidates.map(candidate => candidate.id));
  const compiled: MaxConsecutiveDaysConstraint[] = [];

  for (const rule of rules) {
    if (!knownCandidateIds.has(rule.candidateId) || rule.maxDays <= 0) {
      continue;
    }

    compiled.push({
      type: 'max-consecutive-days',
      agentIds: [rule.candidateId],
      maxDays: rule.maxDays,
    });
  }

  return compiled;
}

/**
 * Compile domain coverage rules into primitive global coverage requirements.
 */
function buildCoverageRules(
  needs: readonly Need[],
  shifts: readonly Shift[],
  rules: readonly CoverageRule[],
): CoverageRequirement[] {
  const compiled: CoverageRequirement[] = [];
  const shiftMap = new Map(shifts.map(shift => [shift.id, shift]));

  for (const rule of rules) {
    const matchingNeeds = needs.filter(need => {
      if (need.shiftId !== rule.shiftId) return false;
      if (rule.siteId !== undefined) {
        const shift = shiftMap.get(need.shiftId);
        if (!shift || shift.siteId !== rule.siteId) return false;
      }
      if (rule.lineId !== undefined && need.lineId !== rule.lineId) return false;
      return true;
    });

    if (rule.type === 'require-qualification-on-shift' && rule.shiftId && rule.qualificationTypeId) {
      compiled.push({
        type: 'require-qualification-on-shift',
        ruleId: rule.id,
        shiftId: rule.shiftId,
        qualificationTypeId: rule.qualificationTypeId,
        demandUnitIds: expandDemandUnitIds(matchingNeeds),
      });
      continue;
    }

    if (rule.type === 'require-position-on-shift' && rule.shiftId && rule.positionId) {
      compiled.push({
        type: 'require-position-on-shift',
        ruleId: rule.id,
        shiftId: rule.shiftId,
        positionId: rule.positionId,
        demandUnitIds: expandDemandUnitIds(
          matchingNeeds.filter(need => need.positionId === rule.positionId),
        ),
      });
      continue;
    }

    if (
      rule.type === 'require-support-when-dependent-staffed' &&
      rule.shiftId &&
      rule.dependentPositionId &&
      rule.supportingPositionId
    ) {
      compiled.push({
        type: 'require-support-when-dependent-staffed',
        ruleId: rule.id,
        shiftId: rule.shiftId,
        dependentPositionId: rule.dependentPositionId,
        supportingPositionId: rule.supportingPositionId,
        dependentDemandUnitIds: expandDemandUnitIds(
          matchingNeeds.filter(need => need.positionId === rule.dependentPositionId),
        ),
        supportingDemandUnitIds: expandDemandUnitIds(
          matchingNeeds.filter(need => need.positionId === rule.supportingPositionId),
        ),
      });
      continue;
    }

    if (rule.type === 'require-supervisor-presence' && rule.shiftId && rule.positionId) {
      compiled.push({
        type: 'require-supervisor-presence',
        ruleId: rule.id,
        shiftId: rule.shiftId,
        positionId: rule.positionId,
        demandUnitIds: expandDemandUnitIds(matchingNeeds),
        supervisorDemandUnitIds: expandDemandUnitIds(
          matchingNeeds.filter(need => need.positionId === rule.positionId),
        ),
      });
    }
  }

  return compiled;
}

/**
 * Compile domain utilization rules to primitive rules.
 */
function compileUtilizationRules(
  rules: readonly DomainUtilizationRule[],
): UtilizationRule[] {
  return rules.map(r => ({
    agentId: r.candidateId,
    windowDays: r.windowDays,
    minAssignments: r.minShifts,
    maxAssignments: r.maxShifts,
  }));
}

/**
 * Build eligibility edges showing which agents can fill which demand units.
 * This is a helper for debugging and explanation.
 */
export function buildEligibility(input: SolveInput): EligibilityEdge[] {
  const edges: EligibilityEdge[] = [];
  const capabilityConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'capability' }> => c.type === 'capability'
  );
  const availabilityConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'availability' }> => c.type === 'availability'
  );
  const shiftPatternConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'shift-pattern' }> => c.type === 'shift-pattern'
  );
  
  if (!capabilityConstraint) return edges;

  for (const agent of input.agents) {
    const caps = capabilityConstraint.agentCapabilities.get(agent.id) ?? [];
    const windows = availabilityConstraint?.agentAvailability.get(agent.id) ?? [];
    const patternRules = shiftPatternConstraint?.agentPatternRules.get(agent.id) ?? [];
    
    for (const demand of input.demandUnits) {
      if (canAgentFillDemand(caps, windows, patternRules, demand)) {
        edges.push({ agentId: agent.id, demandUnitId: demand.id });
      }
    }
  }
  
  return edges;
}

/**
 * Check if an agent with given capabilities can fill a demand unit.
 */
function canAgentFillDemand(
  capabilities: readonly Capability[],
  availabilityWindows: readonly AvailabilityWindow[],
  patternRules: readonly AgentShiftPatternRule[],
  demand: DemandUnit,
): boolean {
  const capIds = new Set(capabilities.map(c => c.id));
  return demand.requiredCapabilities.every(req => capIds.has(req))
    && isDemandIntervalAllowed(availabilityWindows, demand.interval)
    && isDemandAllowedByStandalonePatternRules(patternRules, demand);
}

function isDemandIntervalAllowed(
  availabilityWindows: readonly AvailabilityWindow[],
  demandInterval: Interval,
): boolean {
  if (availabilityWindows.length === 0) {
    return true;
  }

  const availableWindows = availabilityWindows.filter(w => w.kind === 'available');
  const unavailableWindows = availabilityWindows.filter(w => w.kind === 'unavailable');

  for (const window of unavailableWindows) {
    if (intervalsOverlap(window.interval, demandInterval)) {
      return false;
    }
  }

  if (availableWindows.length === 0) {
    return true;
  }

  return availableWindows.some(window => containsInterval(window.interval, demandInterval));
}

function containsInterval(container: Interval, target: Interval): boolean {
  return container.start <= target.start && container.end >= target.end;
}

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start;
}

function expandDemandUnitIds(needs: readonly Need[]): Id[] {
  const demandUnitIds: Id[] = [];

  for (const need of needs) {
    for (let i = 0; i < need.count; i++) {
      demandUnitIds.push(`${need.id}#${i}`);
    }
  }

  return demandUnitIds;
}

function isDemandAllowedByStandalonePatternRules(
  patternRules: readonly AgentShiftPatternRule[],
  demand: DemandUnit,
): boolean {
  for (const rule of patternRules) {
    if (rule.type === 'weekday-only' && isWeekendDate(demand.interval.start)) {
      return false;
    }
    if (rule.type === 'weekend-only' && !isWeekendDate(demand.interval.start)) {
      return false;
    }
  }
  return true;
}

function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Utility: group array items by key function.
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
