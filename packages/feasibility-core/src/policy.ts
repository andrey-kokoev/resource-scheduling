/**
 * Policy Lock Constants for Package 001
 * 
 * These constants materialize the policy decisions locked in POLICY.md.
 * They exist to make policy choices explicit in code and prevent drift.
 * 
 * @module policy
 */

/**
 * Minimum utilization checking is DEFERRED.
 * 
 * This constant exists to make the deferral explicit. Code checking
 * min-utilization in Package 001 is a policy violation.
 */
export const MIN_UTILIZATION_DEFERRED = true as const;

/**
 * Maximum utilization is a HARD CONSTRAINT.
 * 
 * Violations during feasibility search reject the assignment.
 */
export const MAX_UTILIZATION_HARD_CONSTRAINT = true as const;

/**
 * Qualification validity requires FULL INTERVAL COVERAGE.
 * 
 * true  = capability must cover entire demand interval
 * false = capability need only intersect interval (NOT IMPLEMENTED)
 */
export const QUALIFICATION_FULL_INTERVAL_COVERAGE = true as const;

/**
 * Solver success requires FULL COVERAGE of all demand units.
 * 
 * true  = every demand unit must be assigned (feasible: true only if complete)
 * false = partial assignments can succeed (NOT IMPLEMENTED)
 */
export const COVERAGE_REQUIRES_FULL_ASSIGNMENT = true as const;

/**
 * Partial fill is OUT OF SCOPE.
 * 
 * true  = no partial-fill success mode exists
 * false = partial fill is a valid result type (NOT IMPLEMENTED)
 */
export const PARTIAL_FILL_OUT_OF_SCOPE = true as const;

/**
 * Compile-time assertion helpers to enforce policy in type system.
 */

/**
 * Assert that min utilization is not being checked.
 * Use this in any code that might accidentally implement min checking.
 */
export type AssertMinUtilizationDeferred = 
  typeof MIN_UTILIZATION_DEFERRED extends true ? true : never;

/**
 * Assert that max utilization is enforced as hard constraint.
 */
export type AssertMaxUtilizationHard = 
  typeof MAX_UTILIZATION_HARD_CONSTRAINT extends true ? true : never;

/**
 * Assert that full interval coverage is required.
 */
export type AssertFullIntervalCoverage = 
  typeof QUALIFICATION_FULL_INTERVAL_COVERAGE extends true ? true : never;

/**
 * Assert that full coverage is required for solver success.
 */
export type AssertFullCoverageRequired = 
  typeof COVERAGE_REQUIRES_FULL_ASSIGNMENT extends true ? true : never;

/**
 * Deferred policy markers.
 * 
 * These types document what is NOT in Package 001. They help catch
 * attempts to implement deferred features early.
 */

/** Minimum utilization obligations - deferred to Package 002+ */
export type MinUtilizationDeferred = {
  readonly _tag: 'MinUtilization';
  readonly status: 'DEFERRED';
  readonly note: 'Post-feasibility policy check, not a feasibility constraint';
};

/** Partial fill semantics - deferred to Package 002+ */
export type PartialFillDeferred = {
  readonly _tag: 'PartialFill';
  readonly status: 'DEFERRED';
  readonly note: 'Requires optimization framework';
};

/** Optimization objective - deferred to Package 002+ */
export type OptimizationDeferred = {
  readonly _tag: 'Optimization';
  readonly status: 'DEFERRED';
  readonly note: 'Requires objective function and ranking';
};

/** Preference handling - deferred to Package 002+ */
export type PreferenceHandlingDeferred = {
  readonly _tag: 'PreferenceHandling';
  readonly status: 'DEFERRED';
  readonly note: 'Requires soft constraint framework';
};

/** Fairness/balancing - deferred to Package 003+ */
export type FairnessDeferred = {
  readonly _tag: 'Fairness';
  readonly status: 'DEFERRED';
  readonly note: 'Requires historical tracking and equity metrics';
};

/** Schedule repair - deferred to Package 003+ */
export type ScheduleRepairDeferred = {
  readonly _tag: 'ScheduleRepair';
  readonly status: 'DEFERRED';
  readonly note: 'Requires delta computation and stability constraints';
};

/**
 * Package 001 scope boundary.
 * 
 * This type enumerates all deferred concerns for explicit exclusion.
 */
export type DeferredToFuturePackages = 
  | MinUtilizationDeferred
  | PartialFillDeferred
  | OptimizationDeferred
  | PreferenceHandlingDeferred
  | FairnessDeferred
  | ScheduleRepairDeferred;
