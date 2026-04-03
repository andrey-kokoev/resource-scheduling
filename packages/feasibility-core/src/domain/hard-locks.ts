/**
 * Hard-lock and preassignment boundary for baseline repair workflows.
 *
 * This module stays strictly domain-side. It does not change solver behavior;
 * it only gives the workflow a concrete place to package immutable assignments
 * into a finite solve attempt.
 */

import type {
  ConcreteSolveAttempt,
  DomainInput,
  HardLock,
  PreassignedAssignment,
} from './types.js';

/**
 * Build a concrete solve-attempt boundary from a domain input and a list of
 * hard locks.
 *
 * This is a pure packaging step. It does not validate, repair, or reorder
 * anything; it only converts workflow hard locks into concrete preassignments
 * that a later solver attempt can consume.
 */
export function buildConcreteSolveAttempt(
  input: DomainInput,
  hardLocks: readonly HardLock[],
): ConcreteSolveAttempt {
  return {
    input,
    hardLocks,
    preassignedAssignments: hardLocks.map(lock => ({
      kind: 'hard-lock' as const,
      agentId: lock.agentId,
      demandUnitId: lock.demandUnitId,
      hardLockId: lock.id,
    })),
  };
}
