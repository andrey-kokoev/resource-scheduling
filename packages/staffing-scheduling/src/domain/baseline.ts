/**
 * Copied-baseline workflow types.
 *
 * This module stays outside the ordinary concrete `DomainInput` shape. It is a
 * workflow-layer source object that can later be compiled into finite concrete
 * repair attempts without teaching the solver about repair orchestration.
 */

import type { Id } from '../primitive/types.js';
import type {
  CandidateAvailability,
  DomainInput,
  HardLock,
  Need,
  Shift,
} from './types.js';

/** Concrete assignment copied from a baseline schedule. */
export interface CopiedBaselineAssignment {
  readonly id: Id;
  readonly agentId: Id;
  readonly demandUnitId: Id;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/** Workflow-layer retention annotation attached to a copied assignment. */
export interface CopiedBaselineRetentionAnnotation {
  readonly assignmentId: Id;
  readonly label: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/** Baseline delta that removes a copied assignment from carryover. */
export interface CopiedBaselineRemovedAssignmentDelta {
  readonly id: Id;
  readonly kind: 'removed-assignment';
  readonly assignmentId: Id;
  readonly reason?: string;
}

/** Baseline delta that adds a new concrete need to the copied state. */
export interface CopiedBaselineAddedNeedDelta {
  readonly id: Id;
  readonly kind: 'added-need';
  readonly need: Need;
}

/** Baseline delta that removes a concrete need from the copied state. */
export interface CopiedBaselineRemovedNeedDelta {
  readonly id: Id;
  readonly kind: 'removed-need';
  readonly needId: Id;
  readonly reason?: string;
}

/** Baseline delta that replaces one concrete shift with another. */
export interface CopiedBaselineChangedShiftDelta {
  readonly id: Id;
  readonly kind: 'changed-shift';
  readonly shiftId: Id;
  readonly before: Shift;
  readonly after: Shift;
}

/** Baseline delta that replaces the availability facts for a candidate. */
export interface CopiedBaselineChangedAvailabilityDelta {
  readonly id: Id;
  readonly kind: 'changed-availability';
  readonly candidateId: Id;
  readonly before: readonly CandidateAvailability[];
  readonly after: readonly CandidateAvailability[];
}

/** First-pass copied-baseline delta union. */
export type CopiedBaselineDelta =
  | CopiedBaselineRemovedAssignmentDelta
  | CopiedBaselineAddedNeedDelta
  | CopiedBaselineRemovedNeedDelta
  | CopiedBaselineChangedShiftDelta
  | CopiedBaselineChangedAvailabilityDelta;

/**
 * Workflow-layer source object for a copied baseline schedule.
 *
 * This is not the solver input itself. It is the durable state that later
 * compiles into one or more concrete finite solve attempts.
 */
export interface CopiedBaselineState {
  readonly targetInput: DomainInput;
  readonly copiedAssignments: readonly CopiedBaselineAssignment[];
  readonly hardLocks: readonly HardLock[];
  readonly retentionAnnotations: readonly CopiedBaselineRetentionAnnotation[];
  readonly deltas: readonly CopiedBaselineDelta[];
}
