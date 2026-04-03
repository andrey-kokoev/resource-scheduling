/**
 * Hard-constraint feasibility solver.
 * Answers: "does a non-violating full assignment exist?"
 * 
 * This is a constraint satisfaction problem (CSP) solver using backtracking
 * with constraint checking. It prioritizes finding any valid solution over
 * optimization.
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
  Id,
  InfeasibilityReason,
  Interval,
  MaxConsecutiveDaysConstraint,
  MinimumRestConstraint,
  SolveInput,
  SolveResult,
  UtilizationRule,
} from '../primitive/types.js';
import { checkMaxConsecutiveDays, deriveWorkedDates } from '../patterns.js';

/**
 * Solve the feasibility problem.
 * Returns either a complete feasible assignment or infeasibility reasons.
 */
export function solve(input: SolveInput): SolveResult {
  const reasons: InfeasibilityReason[] = [];
  
  // Pre-check: ensure every demand unit has at least one eligible agent
  const eligibility = computeEligibility(input);
  for (const demand of input.demandUnits) {
    const eligibleAgents = eligibility.get(demand.id) ?? new Set<Id>();
    if (eligibleAgents.size === 0) {
      reasons.push(...diagnoseNoEligibleAgentReasons(input, demand));
      reasons.push({
        type: 'no-eligible-agent',
        demandUnitId: demand.id,
        reason: `No agent has required capabilities: [${demand.requiredCapabilities.join(', ')}]`,
      });
    }
  }
  
  if (reasons.length > 0) {
    return { feasible: false, reasons: normalizeInfeasibilityReasons(reasons) };
  }

  // Sort demand units by constraint tightness (most constrained first)
  const sortedDemands = sortByConstraintTightness([...input.demandUnits], eligibility);
  
  // Extract constraint handlers
  const nonOverlapAgents = getNonOverlapAgents(input.constraints);
  const agentCapabilities = getAgentCapabilities(input.constraints);
  const agentAvailability = getAgentAvailability(input.constraints);
  const agentPatternRules = getAgentPatternRules(input.constraints);
  const minimumRestRules = getMinimumRestRules(input.constraints);
  const consecutiveDayRules = getConsecutiveDayRules(input.constraints);
  const coverageRules = getCoverageRules(input.constraints);
  const utilizationRules = getUtilizationRulesFromConstraints(input.constraints);
  const rejectedReasonsByDemand = new Map<Id, InfeasibilityReason[]>();
  const coverageFailureReasons: InfeasibilityReason[] = [];
  
  // Backtracking search
  const assignments: Assignment[] = [];
  const demandAgentMap = new Map<Id, Id>(); // demandUnitId -> agentId
  
  const success = backtrack(
    0,
    sortedDemands,
    input.agents,
    eligibility,
    nonOverlapAgents,
    agentCapabilities,
    agentAvailability,
    agentPatternRules,
    minimumRestRules,
    consecutiveDayRules,
    coverageRules,
    utilizationRules,
    rejectedReasonsByDemand,
    coverageFailureReasons,
    assignments,
    demandAgentMap,
    new Map(), // agent -> their demand units
  );
  
  if (success) {
    return { feasible: true, assignments };
  }
  
  // Could not find a complete assignment - explain why
  const explanation = explainInfeasibilityInternal(
    sortedDemands,
    eligibility,
    demandAgentMap,
    rejectedReasonsByDemand,
    coverageFailureReasons,
  );
  
  return { feasible: false, reasons: normalizeInfeasibilityReasons(explanation) };
}

/**
 * Backtracking search for a feasible assignment.
 */
function backtrack(
  depth: number,
  demands: readonly DemandUnit[],
  agents: readonly Agent[],
  eligibility: ReadonlyMap<Id, Set<Id>>,
  nonOverlapAgents: ReadonlySet<Id>,
  agentCapabilities: ReadonlyMap<Id, readonly Capability[]>,
  agentAvailability: ReadonlyMap<Id, readonly AvailabilityWindow[]>,
  agentPatternRules: ReadonlyMap<Id, readonly AgentShiftPatternRule[]>,
  minimumRestRules: readonly MinimumRestConstraint[],
  consecutiveDayRules: readonly MaxConsecutiveDaysConstraint[],
  coverageRules: readonly CoverageRequirement[],
  utilizationRules: readonly UtilizationRule[],
  rejectedReasonsByDemand: Map<Id, InfeasibilityReason[]>,
  coverageFailureReasons: InfeasibilityReason[],
  assignments: Assignment[],
  demandAgentMap: Map<Id, Id>,
  agentDemands: Map<Id, DemandUnit[]>,
): boolean {
  if (depth === demands.length) {
    const conflicts = explainCoverageConflicts(assignments, coverageRules, agentCapabilities, demands);
    if (conflicts.length === 0) {
      return true;
    }

    coverageFailureReasons.splice(0, coverageFailureReasons.length, ...conflicts);
    return false;
  }
  
  const demand = demands[depth];
  const eligibleAgents = eligibility.get(demand.id) ?? new Set<Id>();
  
  // Sort agents by heuristic (fewest existing assignments first)
  const sortedAgents = Array.from(eligibleAgents).sort(
    (a, b) => (agentDemands.get(a)?.length ?? 0) - (agentDemands.get(b)?.length ?? 0)
  );
  
  for (const agentId of sortedAgents) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) continue;
    
    // Check all constraints
    const validationFailure = validateAssignment(
      agent,
      demand,
      agentDemands.get(agentId) ?? [],
      nonOverlapAgents.has(agentId),
      agentCapabilities.get(agentId) ?? [],
      agentAvailability.get(agentId) ?? [],
      agentPatternRules.get(agentId) ?? [],
      minimumRestRules,
      consecutiveDayRules,
      utilizationRules.filter(r => r.agentId === agentId),
      assignments,
    );
    if (validationFailure) {
      const existing = rejectedReasonsByDemand.get(demand.id) ?? [];
      existing.push(validationFailure);
      rejectedReasonsByDemand.set(demand.id, existing);
      continue;
    }
    
    // Make assignment
    assignments.push({ agentId, demandUnitId: demand.id });
    demandAgentMap.set(demand.id, agentId);
    const agentDemandList = agentDemands.get(agentId) ?? [];
    agentDemandList.push(demand);
    agentDemands.set(agentId, agentDemandList);
    
    // Recurse
    if (backtrack(
      depth + 1,
      demands,
      agents,
      eligibility,
      nonOverlapAgents,
      agentCapabilities,
      agentAvailability,
      agentPatternRules,
      minimumRestRules,
      consecutiveDayRules,
      coverageRules,
      utilizationRules,
      rejectedReasonsByDemand,
      coverageFailureReasons,
      assignments,
      demandAgentMap,
      agentDemands,
    )) {
      return true;
    }
    
    // Backtrack
    assignments.pop();
    demandAgentMap.delete(demand.id);
    agentDemandList.pop();
    if (agentDemandList.length === 0) {
      agentDemands.delete(agentId);
    }
  }
  
  return false;
}

/**
 * Check if assigning agent to demand violates any hard constraint.
 */
function validateAssignment(
  agent: Agent,
  demand: DemandUnit,
  existingDemands: readonly DemandUnit[],
  hasNonOverlap: boolean,
  capabilities: readonly Capability[],
  availabilityWindows: readonly AvailabilityWindow[],
  patternRules: readonly AgentShiftPatternRule[],
  minimumRestRules: readonly MinimumRestConstraint[],
  consecutiveDayRules: readonly MaxConsecutiveDaysConstraint[],
  agentRules: readonly UtilizationRule[],
  _allAssignments: readonly Assignment[],
): InfeasibilityReason | null {
  // Check capability validity
  for (const reqCap of demand.requiredCapabilities) {
    const cap = capabilities.find(c => c.id === reqCap);
    if (!cap) {
      return {
        type: 'capability-validity-gap',
        agentId: agent.id,
        capabilityId: reqCap,
        demandUnitId: demand.id,
        interval: demand.interval,
      };
    }
    if (cap.validFrom && demand.interval.start < cap.validFrom) {
      return {
        type: 'capability-validity-gap',
        agentId: agent.id,
        capabilityId: reqCap,
        demandUnitId: demand.id,
        interval: demand.interval,
      };
    }
    if (cap.validUntil && demand.interval.end > cap.validUntil) {
      return {
        type: 'capability-validity-gap',
        agentId: agent.id,
        capabilityId: reqCap,
        demandUnitId: demand.id,
        interval: demand.interval,
      };
    }
  }

  const availabilityFailure = explainAvailabilityConflict(agent.id, demand, availabilityWindows);
  if (availabilityFailure) {
    return availabilityFailure;
  }

  const standalonePatternFailure = explainStandalonePatternConflict(agent.id, demand, patternRules);
  if (standalonePatternFailure) {
    return standalonePatternFailure;
  }
  
  // Check non-overlap
  if (hasNonOverlap) {
    for (const existing of existingDemands) {
      if (intervalsOverlap(demand.interval, existing.interval)) {
        return {
          type: 'overlap-conflict',
          agentId: agent.id,
          demandUnitIds: [existing.id, demand.id],
        };
      }
    }
  }
  
  const relativePatternFailure = explainRelativePatternConflict(agent.id, demand, patternRules, existingDemands);
  if (relativePatternFailure) {
    return relativePatternFailure;
  }

  // Check minimum rest rules
  for (const rule of minimumRestRules) {
    if (!rule.agentIds.includes(agent.id)) {
      continue;
    }

    for (const existing of existingDemands) {
      let earlier = existing.interval;
      let later = demand.interval;
      let earlierDemandId = existing.id;
      let laterDemandId = demand.id;

      if (demand.interval.end <= existing.interval.start) {
        earlier = demand.interval;
        later = existing.interval;
        earlierDemandId = demand.id;
        laterDemandId = existing.id;
      } else if (existing.interval.end <= demand.interval.start) {
        // keep current ordering
      } else {
        continue;
      }

      const gapMs = later.start.getTime() - earlier.end.getTime();
      if (gapMs < rule.durationMs) {
        return {
          type: 'rest-violation',
          agentId: agent.id,
          earlierDemandUnitId: earlierDemandId,
          laterDemandUnitId: laterDemandId,
          requiredRestMs: rule.durationMs,
          actualRestMs: gapMs,
        };
      }
    }
  }

  // Check max consecutive-days rules
  for (const rule of consecutiveDayRules) {
    if (!rule.agentIds.includes(agent.id)) {
      continue;
    }

    const workedDates = new Set<string>();
    for (const existing of existingDemands) {
      for (const workedDate of deriveWorkedDates(existing.interval)) {
        workedDates.add(workedDate);
      }
    }

    const consecutive = checkMaxConsecutiveDays(
      agent.id,
      demand.id,
      demand.interval,
      workedDates,
      rule.maxDays,
    );

    if (!consecutive.valid) {
      return {
        type: 'consecutive-days-violation',
        agentId: agent.id,
        candidateDemandUnitId: demand.id,
        runDates: consecutive.violation.runDates,
        allowedMax: consecutive.violation.allowedMax,
        actualRunLength: consecutive.violation.actualRunLength,
      };
    }
  }
  
  // Check utilization rules
  for (const rule of agentRules) {
    if (rule.maxAssignments === undefined) continue; // Only check max for feasibility
    // Count existing assignments in window
    const windowStart = new Date(demand.interval.start);
    windowStart.setDate(windowStart.getDate() - rule.windowDays);
    const windowEnd = demand.interval.end;
    
    const assignmentsInWindow = existingDemands.filter(d => 
      d.interval.start >= windowStart && d.interval.end <= windowEnd
    ).length + 1; // +1 for current assignment
    
    if (assignmentsInWindow > rule.maxAssignments) {
      const affectedDemandUnitIds = [...existingDemands.map(d => d.id), demand.id].sort();
      return {
        type: 'utilization-conflict',
        agentId: agent.id,
        rule,
        wouldHaveAssignments: assignmentsInWindow,
        demandUnitId: demand.id,
        windowStart,
        windowEnd,
        affectedDemandUnitIds,
      };
    }
    // Note: minAssignments is a global constraint checked post-solve
  }
  
  return null;
}

/**
 * Check if two intervals overlap.
 */
function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Compute eligibility: which agents can fill which demand units based on capabilities.
 * Also checks temporal validity - capabilities must be valid during the demand interval.
 */
function computeEligibility(input: SolveInput): Map<Id, Set<Id>> {
  const result = new Map<Id, Set<Id>>();
  const capabilityConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'capability' }> => c.type === 'capability'
  );
  const availabilityConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'availability' }> => c.type === 'availability'
  );
  const shiftPatternConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'shift-pattern' }> => c.type === 'shift-pattern'
  );
  
  if (!capabilityConstraint) {
    // All agents eligible for all demands
    for (const demand of input.demandUnits) {
      result.set(demand.id, new Set(input.agents.map(a => a.id)));
    }
    return result;
  }
  
  for (const demand of input.demandUnits) {
    const eligible = new Set<Id>();
    for (const agent of input.agents) {
      const caps = capabilityConstraint.agentCapabilities.get(agent.id) ?? [];
      const availabilityWindows = availabilityConstraint?.agentAvailability.get(agent.id) ?? [];
      const patternRules = shiftPatternConstraint?.agentPatternRules.get(agent.id) ?? [];
      if (canAgentFillDemand(caps, availabilityWindows, patternRules, demand)) {
        eligible.add(agent.id);
      }
    }
    result.set(demand.id, eligible);
  }
  
  return result;
}

/**
 * Diagnose why a demand unit has no eligible agents.
 * This preserves the specific blocker reasons that explain an empty eligibility set.
 */
function diagnoseNoEligibleAgentReasons(
  input: SolveInput,
  demand: DemandUnit,
): InfeasibilityReason[] {
  const capabilityConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'capability' }> => c.type === 'capability'
  );
  const availabilityConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'availability' }> => c.type === 'availability'
  );
  const shiftPatternConstraint = input.constraints.find(
    (c): c is Extract<Constraint, { type: 'shift-pattern' }> => c.type === 'shift-pattern'
  );

  const reasons: InfeasibilityReason[] = [];

  for (const agent of input.agents) {
    const caps = capabilityConstraint?.agentCapabilities.get(agent.id) ?? [];
    const availabilityWindows = availabilityConstraint?.agentAvailability.get(agent.id) ?? [];
    const patternRules = shiftPatternConstraint?.agentPatternRules.get(agent.id) ?? [];

    const capabilityFailure = explainCapabilityFailure(agent.id, demand, caps);
    if (capabilityFailure) {
      reasons.push(capabilityFailure);
      continue;
    }

    const availabilityFailure = explainAvailabilityConflict(agent.id, demand, availabilityWindows);
    if (availabilityFailure) {
      reasons.push(availabilityFailure);
      continue;
    }

    const patternFailure = explainStandalonePatternConflict(agent.id, demand, patternRules);
    if (patternFailure) {
      reasons.push(patternFailure);
    }
  }

  return dedupeReasons(reasons);
}

/**
 * Check if an agent with given capabilities can fill a demand unit.
 * Checks both capability possession AND temporal validity.
 */
function canAgentFillDemand(
  capabilities: readonly Capability[],
  availabilityWindows: readonly AvailabilityWindow[],
  patternRules: readonly AgentShiftPatternRule[],
  demand: DemandUnit,
): boolean {
  for (const reqCap of demand.requiredCapabilities) {
    const cap = capabilities.find(c => c.id === reqCap);
    if (!cap) return false;
    // Check temporal validity: capability must cover the entire demand interval
    if (cap.validFrom && demand.interval.start < cap.validFrom) return false;
    if (cap.validUntil && demand.interval.end > cap.validUntil) return false;
  }
  return isDemandIntervalAllowed(availabilityWindows, demand.interval)
    && isDemandAllowedByStandalonePatternRules(patternRules, demand);
}

function explainCapabilityFailure(
  agentId: Id,
  demand: DemandUnit,
  capabilities: readonly Capability[],
): InfeasibilityReason | null {
  for (const reqCap of demand.requiredCapabilities) {
    const cap = capabilities.find(c => c.id === reqCap);
    if (!cap || (cap.validFrom && demand.interval.start < cap.validFrom) || (cap.validUntil && demand.interval.end > cap.validUntil)) {
      return {
        type: 'capability-validity-gap',
        agentId,
        capabilityId: reqCap,
        demandUnitId: demand.id,
        interval: demand.interval,
      };
    }
  }

  return null;
}

/**
 * Sort demand units by constraint tightness (most constrained first).
 */
function sortByConstraintTightness(
  demands: DemandUnit[],
  eligibility: ReadonlyMap<Id, Set<Id>>,
): DemandUnit[] {
  return demands.sort((a, b) => {
    const aEligible = eligibility.get(a.id)?.size ?? 0;
    const bEligible = eligibility.get(b.id)?.size ?? 0;
    return aEligible - bEligible; // Fewer options first
  });
}

/**
 * Extract set of agent IDs with non-overlap constraint.
 */
function getNonOverlapAgents(constraints: readonly Constraint[]): Set<Id> {
  const result = new Set<Id>();
  for (const c of constraints) {
    if (c.type === 'non-overlap') {
      for (const id of c.agentIds) {
        result.add(id);
      }
    }
  }
  return result;
}

/**
 * Extract agent capabilities map from constraints.
 */
function getAgentCapabilities(constraints: readonly Constraint[]): ReadonlyMap<Id, readonly Capability[]> {
  for (const c of constraints) {
    if (c.type === 'capability') {
      return c.agentCapabilities;
    }
  }
  return new Map();
}

/**
 * Extract agent availability map from constraints.
 */
function getAgentAvailability(constraints: readonly Constraint[]): ReadonlyMap<Id, readonly AvailabilityWindow[]> {
  for (const c of constraints) {
    if (c.type === 'availability') {
      return c.agentAvailability;
    }
  }
  return new Map();
}

/**
 * Extract agent shift-pattern rules from constraints.
 */
function getAgentPatternRules(constraints: readonly Constraint[]): ReadonlyMap<Id, readonly AgentShiftPatternRule[]> {
  for (const c of constraints) {
    if (c.type === 'shift-pattern') {
      return c.agentPatternRules;
    }
  }
  return new Map();
}

/**
 * Extract global coverage rules from constraints.
 */
function getCoverageRules(constraints: readonly Constraint[]): readonly CoverageRequirement[] {
  for (const c of constraints) {
    if (c.type === 'coverage') {
      return c.rules;
    }
  }
  return [];
}

/**
 * Extract utilization rules from constraints.
 */
function getUtilizationRulesFromConstraints(constraints: readonly Constraint[]): readonly UtilizationRule[] {
  for (const c of constraints) {
    if (c.type === 'utilization') {
      return c.rules;
    }
  }
  return [];
}

/**
 * Extract minimum-rest constraints from the constraint list.
 */
function getMinimumRestRules(constraints: readonly Constraint[]): readonly MinimumRestConstraint[] {
  const rules: MinimumRestConstraint[] = [];
  for (const c of constraints) {
    if (c.type === 'minimum-rest') {
      rules.push(c);
    }
  }
  return rules;
}

/**
 * Extract max-consecutive-days constraints from the constraint list.
 */
function getConsecutiveDayRules(constraints: readonly Constraint[]): readonly MaxConsecutiveDaysConstraint[] {
  const rules: MaxConsecutiveDaysConstraint[] = [];
  for (const c of constraints) {
    if (c.type === 'max-consecutive-days') {
      rules.push(c);
    }
  }
  return rules;
}

/**
 * Internal: explain why no feasible solution exists.
 */
function explainInfeasibilityInternal(
  demands: readonly DemandUnit[],
  eligibility: ReadonlyMap<Id, Set<Id>>,
  partialAssignments: ReadonlyMap<Id, Id>,
  rejectedReasonsByDemand: ReadonlyMap<Id, readonly InfeasibilityReason[]>,
  coverageFailureReasons: readonly InfeasibilityReason[],
): InfeasibilityReason[] {
  const reasons: InfeasibilityReason[] = [];
  const assignedDemands = new Set(partialAssignments.keys());
  
  // Find unfilled demands
  const unfilled = demands
    .map(d => d.id)
    .filter(id => !assignedDemands.has(id));
  
  if (unfilled.length > 0) {
    reasons.push({
      type: 'unfilled-demand',
      demandUnitIds: unfilled,
    });
  }

  reasons.push(...coverageFailureReasons);
  
  // Add specific reasons for each unfilled demand
  for (const demandId of unfilled) {
    const demand = demands.find(d => d.id === demandId);
    if (!demand) continue;
    
    const eligible = eligibility.get(demandId) ?? new Set<Id>();
    if (eligible.size === 0) {
      reasons.push({
        type: 'no-eligible-agent',
        demandUnitId: demandId,
        reason: `No agent has required capabilities`,
      });
    }

    const rejectedReasons = rejectedReasonsByDemand.get(demandId) ?? [];
    for (const rejectedReason of dedupeReasons(rejectedReasons)) {
      reasons.push(rejectedReason);
    }
  }
  
  // Check for overlap conflicts in partial assignments
  const agentDemands = new Map<Id, DemandUnit[]>();
  for (const [demandId, agentId] of partialAssignments) {
    const demand = demands.find(d => d.id === demandId);
    if (demand) {
      const list = agentDemands.get(agentId) ?? [];
      list.push(demand);
      agentDemands.set(agentId, list);
    }
  }
  
  for (const [agentId, agentDemandList] of agentDemands) {
    for (let i = 0; i < agentDemandList.length; i++) {
      for (let j = i + 1; j < agentDemandList.length; j++) {
        if (intervalsOverlap(agentDemandList[i].interval, agentDemandList[j].interval)) {
          reasons.push({
            type: 'overlap-conflict',
            agentId,
            demandUnitIds: [agentDemandList[i].id, agentDemandList[j].id],
          });
        }
      }
    }
  }
  
  return reasons;
}

/**
 * Public API: explain infeasibility without solving.
 */
export function explainInfeasibility(input: SolveInput): InfeasibilityReason[] {
  const eligibility = computeEligibility(input);
  const reasons: InfeasibilityReason[] = [];
  
  for (const demand of input.demandUnits) {
    const eligible = eligibility.get(demand.id) ?? new Set<Id>();
    if (eligible.size === 0) {
      reasons.push({
        type: 'no-eligible-agent',
        demandUnitId: demand.id,
        reason: `No agent has required capabilities`,
      });
    }
  }
  
  return normalizeInfeasibilityReasons(reasons);
}

function validateGlobalCoverage(
  assignments: readonly Assignment[],
  coverageRules: readonly CoverageRequirement[],
  agentCapabilities: ReadonlyMap<Id, readonly Capability[]>,
  demandUnits: readonly DemandUnit[],
): boolean {
  return explainCoverageConflicts(assignments, coverageRules, agentCapabilities, demandUnits).length === 0;
}

function explainCoverageConflicts(
  assignments: readonly Assignment[],
  coverageRules: readonly CoverageRequirement[],
  agentCapabilities: ReadonlyMap<Id, readonly Capability[]>,
  demandUnits: readonly DemandUnit[],
): InfeasibilityReason[] {
  const reasons: InfeasibilityReason[] = [];
  const assignedDemandIds = new Set(assignments.map(a => a.demandUnitId));
  const assignmentByDemandId = new Map(assignments.map(a => [a.demandUnitId, a] as const));
  const demandUnitMap = new Map(demandUnits.map(d => [d.id, d] as const));

  for (const rule of coverageRules) {
    if (rule.type === 'require-position-on-shift') {
      const satisfied = rule.demandUnitIds.some(demandUnitId => assignedDemandIds.has(demandUnitId));
      if (!satisfied) {
        reasons.push({
          type: 'coverage-conflict',
          ruleId: rule.ruleId,
          coverageType: rule.type,
          shiftId: rule.shiftId,
          demandUnitIds: rule.demandUnitIds,
          positionId: rule.positionId,
        });
      }
      continue;
    }

    if (rule.type === 'require-qualification-on-shift') {
      const satisfied = rule.demandUnitIds.some(demandUnitId => {
        const assignment = assignmentByDemandId.get(demandUnitId);
        if (!assignment) {
          return false;
        }

        const capabilities = agentCapabilities.get(assignment.agentId) ?? [];
        const demandUnit = demandUnitMap.get(demandUnitId);
        const interval = demandUnit?.interval;

        return capabilities.some(capability =>
          capability.id === rule.qualificationTypeId
            && (!interval || capabilityCoversInterval(capability, interval))
        );
      });

      if (!satisfied) {
        reasons.push({
          type: 'coverage-conflict',
          ruleId: rule.ruleId,
          coverageType: rule.type,
          shiftId: rule.shiftId,
          demandUnitIds: rule.demandUnitIds,
          qualificationTypeId: rule.qualificationTypeId,
        });
      }
      continue;
    }

    if (rule.type === 'require-support-when-dependent-staffed') {
      const dependentStaffed = rule.dependentDemandUnitIds.some(demandUnitId => assignedDemandIds.has(demandUnitId));
      const supported = rule.supportingDemandUnitIds.some(demandUnitId => assignedDemandIds.has(demandUnitId));

      if (dependentStaffed && !supported) {
        reasons.push({
          type: 'coverage-conflict',
          ruleId: rule.ruleId,
          coverageType: rule.type,
          shiftId: rule.shiftId,
          demandUnitIds: rule.dependentDemandUnitIds,
          dependentPositionId: rule.dependentPositionId,
          supportingPositionId: rule.supportingPositionId,
        });
      }
      continue;
    }

    if (rule.type === 'require-supervisor-presence') {
      const staffedOnShift = rule.demandUnitIds.some(demandUnitId => assignedDemandIds.has(demandUnitId));
      const supervisorPresent = rule.supervisorDemandUnitIds.some(demandUnitId => assignedDemandIds.has(demandUnitId));

      if (staffedOnShift && !supervisorPresent) {
        reasons.push({
          type: 'coverage-conflict',
          ruleId: rule.ruleId,
          coverageType: rule.type,
          shiftId: rule.shiftId,
          demandUnitIds: rule.demandUnitIds,
          positionId: rule.positionId,
          supervisorDemandUnitIds: rule.supervisorDemandUnitIds,
        });
      }
    }
  }

  return reasons;
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

function capabilityCoversInterval(capability: Capability, interval: Interval): boolean {
  if (capability.validFrom && interval.start < capability.validFrom) {
    return false;
  }
  if (capability.validUntil && interval.end > capability.validUntil) {
    return false;
  }
  return true;
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

function isDemandAllowedByRelativePatternRules(
  patternRules: readonly AgentShiftPatternRule[],
  demandInterval: Interval,
  existingDemands: readonly DemandUnit[],
): boolean {
  for (const rule of patternRules) {
    if (rule.type !== 'no-night-to-day-turnaround') {
      continue;
    }

    for (const existing of existingDemands) {
      if (createsNightToDayTurnaround(existing.interval, demandInterval)) {
        return false;
      }
      if (createsNightToDayTurnaround(demandInterval, existing.interval)) {
        return false;
      }
    }
  }

  return true;
}

function createsNightToDayTurnaround(earlier: Interval, later: Interval): boolean {
  if (!(earlier.end <= later.start)) {
    return false;
  }

  if (!isNightShift(earlier) || !isDayShift(later)) {
    return false;
  }

  return sameLocalDate(earlier.end, later.start);
}

function isNightShift(interval: Interval): boolean {
  const startHour = interval.start.getHours();
  return startHour >= 18 || startHour < 6;
}

function isDayShift(interval: Interval): boolean {
  const startHour = interval.start.getHours();
  return startHour >= 6 && startHour < 18;
}

function sameLocalDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function explainAvailabilityConflict(
  agentId: Id,
  demand: DemandUnit,
  availabilityWindows: readonly AvailabilityWindow[],
): InfeasibilityReason | null {
  if (availabilityWindows.length === 0) {
    return null;
  }

  const availableWindows = availabilityWindows.filter(w => w.kind === 'available');
  const unavailableWindows = availabilityWindows.filter(w => w.kind === 'unavailable');

  const blockingUnavailable = unavailableWindows.find(window => intervalsOverlap(window.interval, demand.interval));
  if (blockingUnavailable) {
    return {
      type: 'availability-conflict',
      agentId,
      demandUnitId: demand.id,
      conflictKind: 'unavailable-overlap',
      reason: blockingUnavailable.reason,
    };
  }

  if (availableWindows.length > 0 && !availableWindows.some(window => containsInterval(window.interval, demand.interval))) {
    return {
      type: 'availability-conflict',
      agentId,
      demandUnitId: demand.id,
      conflictKind: 'outside-available-window',
    };
  }

  return null;
}

function explainStandalonePatternConflict(
  agentId: Id,
  demand: DemandUnit,
  patternRules: readonly AgentShiftPatternRule[],
): InfeasibilityReason | null {
  for (const rule of patternRules) {
    if (rule.type === 'weekday-only' && isWeekendDate(demand.interval.start)) {
      return {
        type: 'shift-pattern-conflict',
        agentId,
        demandUnitId: demand.id,
        ruleType: rule.type,
        ruleId: rule.ruleId,
      };
    }
    if (rule.type === 'weekend-only' && !isWeekendDate(demand.interval.start)) {
      return {
        type: 'shift-pattern-conflict',
        agentId,
        demandUnitId: demand.id,
        ruleType: rule.type,
        ruleId: rule.ruleId,
      };
    }
    if (
      rule.type === 'fixed-shift-family' &&
      demand.shiftFamilyId !== undefined &&
      !rule.allowedShiftFamilyIds.includes(demand.shiftFamilyId)
    ) {
      return {
        type: 'shift-pattern-conflict',
        agentId,
        demandUnitId: demand.id,
        ruleType: rule.type,
        ruleId: rule.ruleId,
        shiftFamilyId: demand.shiftFamilyId,
        allowedShiftFamilyIds: rule.allowedShiftFamilyIds,
      };
    }
  }
  return null;
}

function explainRelativePatternConflict(
  agentId: Id,
  demand: DemandUnit,
  patternRules: readonly AgentShiftPatternRule[],
  existingDemands: readonly DemandUnit[],
): InfeasibilityReason | null {
  for (const rule of patternRules) {
    if (rule.type === 'non-rotating') {
      const existingFamilies = new Set(
        existingDemands.map(d => d.shiftFamilyId).filter((id): id is Id => id !== undefined),
      );
      if (existingFamilies.size > 0) {
        const [familyId] = Array.from(existingFamilies);
        if (demand.shiftFamilyId === undefined || demand.shiftFamilyId !== familyId) {
          const related = existingDemands.find(d => d.shiftFamilyId === familyId);
          return {
            type: 'shift-pattern-conflict',
            agentId,
            demandUnitId: demand.id,
            ruleType: rule.type,
            ruleId: rule.ruleId,
            relatedDemandUnitId: related?.id,
            shiftFamilyId: demand.shiftFamilyId,
          };
        }
      }
      continue;
    }

    if (rule.type === 'fixed-shift-family') {
      if (
        demand.shiftFamilyId !== undefined &&
        !rule.allowedShiftFamilyIds.includes(demand.shiftFamilyId)
      ) {
        return {
          type: 'shift-pattern-conflict',
          agentId,
          demandUnitId: demand.id,
          ruleType: rule.type,
          ruleId: rule.ruleId,
          shiftFamilyId: demand.shiftFamilyId,
          allowedShiftFamilyIds: rule.allowedShiftFamilyIds,
        };
      }
      continue;
    }

    if (rule.type !== 'no-night-to-day-turnaround') {
      continue;
    }

    for (const existing of existingDemands) {
      if (createsNightToDayTurnaround(existing.interval, demand.interval)) {
        return {
          type: 'shift-pattern-conflict',
          agentId,
          demandUnitId: demand.id,
          ruleType: rule.type,
          ruleId: rule.ruleId,
          relatedDemandUnitId: existing.id,
        };
      }
      if (createsNightToDayTurnaround(demand.interval, existing.interval)) {
        return {
          type: 'shift-pattern-conflict',
          agentId,
          demandUnitId: demand.id,
          ruleType: rule.type,
          ruleId: rule.ruleId,
          relatedDemandUnitId: existing.id,
        };
      }
    }
  }

  return null;
}

function dedupeReasons(reasons: readonly InfeasibilityReason[]): InfeasibilityReason[] {
  const seen = new Set<string>();
  const deduped: InfeasibilityReason[] = [];

  for (const reason of reasons) {
    const key = JSON.stringify(reason);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(reason);
  }

  return deduped;
}

function normalizeInfeasibilityReasons(reasons: readonly InfeasibilityReason[]): InfeasibilityReason[] {
  return dedupeReasons([...reasons]).sort(compareInfeasibilityReasons);
}

function compareInfeasibilityReasons(a: InfeasibilityReason, b: InfeasibilityReason): number {
  const typeOrder = getReasonTypeOrder(a.type) - getReasonTypeOrder(b.type);
  if (typeOrder !== 0) {
    return typeOrder;
  }

  return reasonSortKey(a).localeCompare(reasonSortKey(b));
}

function getReasonTypeOrder(type: InfeasibilityReason['type']): number {
  switch (type) {
    case 'capability-validity-gap':
      return 0;
    case 'availability-conflict':
      return 1;
    case 'shift-pattern-conflict':
      return 2;
    case 'overlap-conflict':
      return 3;
    case 'utilization-conflict':
      return 4;
    case 'coverage-conflict':
      return 5;
    case 'rest-violation':
      return 6;
    case 'consecutive-days-violation':
      return 7;
    case 'unfilled-demand':
      return 8;
    case 'no-eligible-agent':
      return 9;
  }
}

function reasonSortKey(reason: InfeasibilityReason): string {
  switch (reason.type) {
    case 'capability-validity-gap':
      return `${reason.agentId}:${reason.demandUnitId}:${reason.capabilityId}:${reason.interval.start.toISOString()}:${reason.interval.end.toISOString()}`;
    case 'availability-conflict':
      return `${reason.agentId}:${reason.demandUnitId}:${reason.conflictKind}:${reason.reason ?? ''}`;
    case 'shift-pattern-conflict':
      return `${reason.agentId}:${reason.demandUnitId}:${reason.ruleType}:${reason.ruleId}:${reason.relatedDemandUnitId ?? ''}:${reason.shiftFamilyId ?? ''}:${(reason.allowedShiftFamilyIds ?? []).join(',')}`;
    case 'overlap-conflict':
      return `${reason.agentId}:${reason.demandUnitIds.join(',')}`;
    case 'utilization-conflict':
      return `${reason.agentId}:${reason.demandUnitId}:${reason.rule.agentId}:${reason.rule.windowDays}:${reason.rule.maxAssignments ?? ''}:${reason.rule.minAssignments ?? ''}:${reason.wouldHaveAssignments}:${reason.windowStart.toISOString()}:${reason.windowEnd.toISOString()}:${reason.affectedDemandUnitIds.join(',')}`;
    case 'coverage-conflict':
      return `${reason.ruleId}:${reason.coverageType}:${reason.shiftId}:${reason.demandUnitIds.join(',')}:${reason.qualificationTypeId ?? ''}:${reason.positionId ?? ''}:${reason.dependentPositionId ?? ''}:${reason.supportingPositionId ?? ''}:${reason.supervisorDemandUnitIds?.join(',') ?? ''}`;
    case 'rest-violation':
      return `${reason.agentId}:${reason.earlierDemandUnitId}:${reason.laterDemandUnitId}:${reason.requiredRestMs}:${reason.actualRestMs}`;
    case 'consecutive-days-violation':
      return `${reason.agentId}:${reason.candidateDemandUnitId}:${reason.allowedMax}:${reason.actualRunLength}:${reason.runDates.join(',')}`;
    case 'unfilled-demand':
      return reason.demandUnitIds.join(',');
    case 'no-eligible-agent':
      return `${reason.demandUnitId}:${reason.reason}`;
  }
}
