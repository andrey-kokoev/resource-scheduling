/**
 * Primitive Constraint Contract
 * 
 * This module materializes the semantic contract defined in CONTRACT.md.
 * It provides type-level documentation and runtime assertions for constraint semantics.
 * 
 * @module contracts
 */

import type { 
  Interval, 
  Agent, 
  DemandUnit, 
  Assignment, 
  Capability,
  Constraint,
  InfeasibilityReason 
} from './primitive/types.js';

// =============================================================================
// PRIMITIVE SEMANTICS - Type-level documentation
// =============================================================================

/**
 * Interval: Half-open time range [start, end)
 * 
 * INVARIANT: start < end
 * COMPILED FROM: Domain Shift + date + startTime + endTime
 */
export type IntervalSemantics = {
  readonly _tag: 'Interval';
  readonly invariant: 'start < end';
  readonly representation: 'Half-open [start, end)';
};

/**
 * Agent: Abstract assignable resource
 * 
 * INVARIANT: id is unique within SolveInput
 * COMPILED FROM: Domain Candidate.id
 */
export type AgentSemantics = {
  readonly _tag: 'Agent';
  readonly invariant: 'unique id within SolveInput';
  readonly note: 'Not a candidate, employee, or person';
};

/**
 * DemandUnit: Atomic indivisible demand
 * 
 * INVARIANT: requires exactly one agent
 * COMPILED FROM: Domain Need expanded by count
 */
export type DemandUnitSemantics = {
  readonly _tag: 'DemandUnit';
  readonly invariant: 'atomic - requires exactly one agent';
  readonly expansion: 'Need.count > 1 creates multiple DemandUnits';
};

/**
 * Assignment: Binding of agent to demand unit
 * 
 * INVARIANT: valid only if all constraints satisfied
 */
export type AssignmentSemantics = {
  readonly _tag: 'Assignment';
  readonly invariant: 'valid iff all constraints satisfied';
  readonly validation: 'performed by constraint evaluation';
};

/**
 * Capability: Time-bounded credential
 * 
 * INVARIANT: validity is [validFrom, validUntil)
 * COMPILED FROM: Domain CandidateQualification
 */
export type CapabilitySemantics = {
  readonly _tag: 'Capability';
  readonly invariant: 'validFrom <= validity < validUntil';
  readonly coverage: 'FULL INTERVAL COVERAGE required';
};

// =============================================================================
// CONSTRAINT CONTRACT - Evaluation semantics
// =============================================================================

/**
 * Evaluation scope classification for constraints
 */
export type ConstraintScope = 'local' | 'global-agent' | 'global-solver';

/**
 * Evaluation timing classification
 */
export type EvaluationTiming = 'prefix-checkable' | 'completion-only';

/**
 * Constraint metadata - documents contract semantics
 */
export interface ConstraintContract {
  readonly type: Constraint['type'];
  readonly scope: ConstraintScope;
  readonly timing: EvaluationTiming;
  readonly description: string;
}

/** Contract definitions for each constraint type */
export const CONSTRAINT_CONTRACTS: Record<Constraint['type'], ConstraintContract> = {
  'non-overlap': {
    type: 'non-overlap',
    scope: 'global-agent',
    timing: 'prefix-checkable',
    description: 'Agent cannot be assigned to overlapping intervals',
  },
  'capability': {
    type: 'capability',
    scope: 'local',
    timing: 'prefix-checkable',
    description: 'Agent must have required capabilities valid for full interval',
  },
  'availability': {
    type: 'availability',
    scope: 'local',
    timing: 'prefix-checkable',
    description: 'Agent must be permitted to work the full demand interval under explicit availability windows',
  },
  'shift-pattern': {
    type: 'shift-pattern',
    scope: 'global-agent',
    timing: 'prefix-checkable',
    description: 'Agent must not violate explicit shift-pattern compatibility rules',
  },
  'coverage': {
    type: 'coverage',
    scope: 'global-solver',
    timing: 'completion-only',
    description: 'Assignment set must satisfy explicit cross-position or shift-level coverage rules',
  },
  'utilization': {
    type: 'utilization',
    scope: 'global-agent',
    timing: 'prefix-checkable',
    description: 'Agent must not exceed rolling-window max assignments',
  },
  'minimum-rest': {
    type: 'minimum-rest',
    scope: 'global-agent',
    timing: 'prefix-checkable',
    description: 'Agent must have the required end-to-start rest gap between assignments',
  },
  'max-consecutive-days': {
    type: 'max-consecutive-days',
    scope: 'global-agent',
    timing: 'prefix-checkable',
    description: 'Agent must not exceed maximum consecutive worked calendar days',
  },
} as const;

// =============================================================================
// SOLVER SEMANTICS - Success/failure contract
// =============================================================================

/**
 * Solver success semantics
 * 
 * feasible === true means:
 * 1. Every demand unit has exactly one assignment
 * 2. All hard constraints satisfied
 * 3. No overlapping assignments
 * 4. No utilization max violations
 * 5. Full capability validity coverage
 */
export type SolverSuccess = {
  readonly feasible: true;
  readonly assignments: readonly Assignment[];
  readonly guarantee: 'complete non-violating assignment';
};

/**
 * Solver failure semantics
 * 
 * feasible === false means:
 * No complete assignment exists satisfying all constraints
 */
export type SolverFailure = {
  readonly feasible: false;
  readonly reasons: readonly InfeasibilityReason[];
  readonly guarantee: 'infeasibility witnessed with structured reasons';
};

// =============================================================================
// RESPONSIBILITY MATRIX - Solver vs Constraints
// =============================================================================

/**
 * Who is responsible for what?
 * 
 * SOLVER: Full coverage (all demands must be filled)
 * CONSTRAINT non-overlap: Uniqueness, temporal overlap
 * CONSTRAINT capability: Capability validity
 * CONSTRAINT utilization: Max utilization (rolling window)
 * DEFERRED: Min utilization (not a feasibility concern)
 */
export type Responsibility = {
  readonly concern: string;
  readonly responsible: 'solver' | 'constraint' | 'deferred';
  readonly constraintType?: Constraint['type'];
};

export const RESPONSIBILITY_MATRIX: readonly Responsibility[] = [
  { concern: 'Full coverage', responsible: 'solver' },
  { concern: 'Uniqueness', responsible: 'constraint', constraintType: 'non-overlap' },
  { concern: 'Temporal overlap', responsible: 'constraint', constraintType: 'non-overlap' },
  { concern: 'Capability validity', responsible: 'constraint', constraintType: 'capability' },
  { concern: 'Availability eligibility', responsible: 'constraint', constraintType: 'availability' },
  { concern: 'Shift-pattern compatibility', responsible: 'constraint', constraintType: 'shift-pattern' },
  { concern: 'Global coverage coupling', responsible: 'constraint', constraintType: 'coverage' },
  { concern: 'Max utilization', responsible: 'constraint', constraintType: 'utilization' },
  { concern: 'Minimum rest', responsible: 'constraint', constraintType: 'minimum-rest' },
  { concern: 'Max consecutive days', responsible: 'constraint', constraintType: 'max-consecutive-days' },
  { concern: 'Min utilization', responsible: 'deferred' },
] as const;

// =============================================================================
// INFEASIBILITY CONTRACT - Reason types
// =============================================================================

/**
 * Maps each infeasibility reason type to its contract
 */
export type InfeasibilityContract = {
  [K in InfeasibilityReason as K['type']]: {
    readonly triggeredBy: string;
    readonly responsibleConstraint: Constraint['type'] | 'solver' | 'eligibility';
    readonly severity: 'hard';
  }
};

export const INFEASIBILITY_CONTRACT: InfeasibilityContract = {
  'no-eligible-agent': {
    triggeredBy: 'No agent has required capabilities for demand unit',
    responsibleConstraint: 'eligibility',
    severity: 'hard',
  },
  'overlap-conflict': {
    triggeredBy: 'Agent assigned to overlapping intervals',
    responsibleConstraint: 'non-overlap',
    severity: 'hard',
  },
  'capability-validity-gap': {
    triggeredBy: 'Capability not valid for full demand interval',
    responsibleConstraint: 'capability',
    severity: 'hard',
  },
  'availability-conflict': {
    triggeredBy: 'Assignment is blocked by explicit availability policy',
    responsibleConstraint: 'availability',
    severity: 'hard',
  },
  'shift-pattern-conflict': {
    triggeredBy: 'Assignment is blocked by an explicit shift-pattern rule',
    responsibleConstraint: 'shift-pattern',
    severity: 'hard',
  },
  'coverage-conflict': {
    triggeredBy: 'Complete assignment set does not satisfy a global coverage coupling rule',
    responsibleConstraint: 'coverage',
    severity: 'hard',
  },
  'utilization-conflict': {
    triggeredBy: 'Assignment would exceed rolling-window max',
    responsibleConstraint: 'utilization',
    severity: 'hard',
  },
  'rest-violation': {
    triggeredBy: 'Assignment would violate minimum rest between sequential assignments',
    responsibleConstraint: 'minimum-rest',
    severity: 'hard',
  },
  'consecutive-days-violation': {
    triggeredBy: 'Assignment would exceed maximum consecutive worked days',
    responsibleConstraint: 'max-consecutive-days',
    severity: 'hard',
  },
  'unfilled-demand': {
    triggeredBy: 'No valid assignment found for demand unit(s)',
    responsibleConstraint: 'solver',
    severity: 'hard',
  },
};

// =============================================================================
// VALIDATION HELPERS - Runtime contract checking
// =============================================================================

/**
 * Validate interval invariant: start < end
 */
export function validateInterval(interval: Interval): void {
  if (!(interval.start < interval.end)) {
    throw new Error(
      `Interval invariant violated: start (${interval.start.toISOString()}) ` +
      `must be < end (${interval.end.toISOString()})`
    );
  }
}

/**
 * Validate that an assignment satisfies the constraint contract
 * (types only - actual validation done by solver)
 */
export type ValidAssignment<A extends Assignment> = A & {
  readonly _validated: true;
};

/**
 * Compile-time assertion that constraints follow contract
 */
export type AssertConstraintContract<C extends Constraint> = 
  C['type'] extends keyof typeof CONSTRAINT_CONTRACTS 
    ? C 
    : never;
