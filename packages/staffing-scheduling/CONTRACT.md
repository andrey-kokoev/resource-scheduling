# Staffing Scheduling Contract

## Purpose

`staffing-scheduling` is a hard-constraint feasibility kernel.

Its job is to determine whether a complete non-violating assignment exists between agents and atomic demand units over time.

This package does not optimize, rank, or partially fill schedules.

## Package Boundary

The package is responsible for:

- representing primitive feasibility concepts
- evaluating hard constraints over assignments
- returning either:
  - a feasible complete assignment set
  - or structured infeasibility output

The package is not responsible for:

- optimization
- fairness
- preferences
- partial-fill success
- UI or transport concerns
- staffing-domain naming

## Public API Surface

The package exports a broad surface from `src/index.ts`, but normal callers should prefer this subset:

- `DomainInput`
- `compileDomain`
- `solve`
- `buildRegroupingContext`
- `regroupToDomainExplanations`

The rest of the export surface is available for advanced callers and package-internal composition, but it is not required for the recommended usage flow below.

Recommended consumer imports:

- `DomainInput`
- `compileDomain`
- `solve`
- `buildRegroupingContext`
- `regroupToDomainExplanations`

Recommended flow:

1. Build `DomainInput`
2. Compile it with `compileDomain`
3. Solve with `solve`
4. If infeasible, build regrouping context with `buildRegroupingContext`
5. Convert primitive failures with `regroupToDomainExplanations`

The semantic contract below remains the authority for what the package means.

## Primitive Ontology

### Interval

Represents a real time interval.

Intrinsic data:

- `start`
- `end`

Invariants:

- `start < end`
- time values use one consistent solve-wide local calendar basis within one solve
- package `001` is host-local: it relies on the runtime's local timezone rather than an explicit per-solve timezone parameter
- intervals use **half-open semantics**: `[start, end)`

### Agent

Represents an assignable supply entity.

Intrinsic data:

- `id`

Compiled in from domain:

- effective capability set
- effective rule scope if needed by constraints

### DemandUnit

Represents one atomic unit of required coverage.

Intrinsic data:

- `id`
- `interval`

Compiled in from domain:

- required capabilities
- source demand metadata needed for regrouping

Invariant:

- one successful assignment fills exactly one `DemandUnit`

### Assignment

Represents one committed relation between one `Agent` and one `DemandUnit`.

Intrinsic data:

- `agentId`
- `demandUnitId`

Invariant:

- an assignment is valid only if referenced entities exist in the same `SolveInput`

### Constraint

Represents a hard validity rule over assignments.

Intrinsic data:

- `id`
- `timing`
- evaluation function

`timing` is one of:

- `prefix-checkable`
- `completion-only`

Constraint semantics:

- `prefix-checkable` constraints may reject a candidate addition during search
- `completion-only` constraints validate whole-state properties that are not soundly decidable on partial states

### SolveInput

Contains:

- primitive entities
- primitive constraints

### SolveResult

Exactly one of:

- feasible complete assignment set
- infeasibility result

## Domain Compilation Boundary

The primitive kernel does not know these domain concepts directly:

- `Site`
- `Line`
- `Date`
- `Shift`
- `Position`
- `Need`
- `Candidate`
- `CandidateAvailability`
- `ShiftPatternRule`
- `CoverageRule`
- `QualificationType`
- `PositionQualification`
- `CandidateQualification`
- `UtilizationRule`

These must compile into primitive input before solving.

### Need Compilation

A domain `Need` may have `count = N`.

Compilation rule:

- one `Need` with count `N` becomes `N` atomic `DemandUnit`s
- each compiled `DemandUnit` inherits:
  - the source interval
  - the required capability set
  - source metadata for explanation regrouping

Consequence:

- full coverage means every `DemandUnit` is assigned

### Site / Line Compilation

Site and line structure stay in the domain layer and compile only as source metadata for regrouping and line-scoped rule filtering.

Examples of domain concepts:

- one site containing multiple lines
- a shift that belongs to a site
- a need that belongs to a line
- a line-aware coverage rule scoped to a specific line within a shift

Compilation rule:

- the solver does not reason about sites or lines directly
- the compiler may attach site and line metadata to demand units for regrouping
- coverage rules may filter by site when the domain rule is site-scoped
- coverage rules may filter by line when the domain rule is line-scoped

Consequence:

- multi-site and multi-line structure remains a domain concern, not a primitive one
- regrouped coverage explanations may carry `siteId` when the rule is site-scoped and `lineId` when the rule is line-scoped
- no primitive witness family is added just to represent site or line

Implemented site-aware coverage scoping:

- a coverage rule may attach to a site-level staffing expectation without widening the primitive kernel
- site-scoped coverage explanations may carry `siteId` without introducing a new primitive witness family

### Candidate Availability Compilation

Domain availability concepts compile into hard admissibility constraints on assignment.

Examples of domain concepts:

- available interval
- unavailable interval
- approved time off
- fixed non-working days
- shift-specific availability restrictions

Compilation rule:

- a candidate may be assigned to a demand unit only if the full demand interval is permitted by the candidate's effective availability policy

Consequence:

- availability is an eligibility gate, not a preference, in package `001`

Standalone durable doc:

- `AVAILABILITY.md`

### Shift-Pattern Rule Compilation

Domain shift-pattern compatibility concepts compile into hard constraints over assignments for one agent.

Examples of domain concepts:

- no night-to-day turnaround
- weekend-only worker
- weekday-only worker
- fixed crew rotation pattern
- cannot work rotating shift types

Compilation rule:

- each rule must compile into an explicit hard constraint with defined timing and witness semantics
- standalone rules may be checked during assignment validation when the explicit conflict surface needs to remain flat
- shift family data is carried on shifts and demand units only when needed by the rule

Consequence:

- pattern compatibility is policy expressed through constraints, not through extra primitive ontology

Current implemented slice:

- `weekday-only`
- `weekend-only`
- `no-night-to-day-turnaround`
- `fixed-shift-family`
- `non-rotating`

Standalone durable doc:

- `PATTERN-COMPATIBILITY.md`

### Coverage Rule Compilation

Domain line-level or shift-level coverage concepts compile into hard global constraints over assignment sets.

Examples of domain concepts:

- at least one line lead per active line shift
- at least one forklift-certified worker somewhere on the shift
- role A and role B must both be staffed if line L is active
- supervisor presence required whenever a given position is staffed

Compilation rule:

- coverage rules must compile into explicit global constraints over assigned demand units and agent qualifications

Consequence:

- package `001` is not limited to independent slot filling, provided the extra coupling is expressed as explicit hard constraints

Current implemented slice:

- `require-qualification-on-shift`
- `require-position-on-shift`
- `require-support-when-dependent-staffed`
- `require-supervisor-presence`
- line-scoped coverage rules use the domain line metadata carried through regrouping

Standalone durable doc:

- `COVERAGE-RULES.md`

## Qualification Semantics

Qualification semantics are exact-match only.

There is no hierarchy, substitution, or capability lattice in package `001`.

Eligibility rule:

- an agent is eligible for a demand unit iff the agent has every required qualification
- each required qualification must be valid for the full demand interval

Qualification validity semantics:

- validity must cover the full interval
- start-point-only validity is not sufficient

## Solver Semantics

Success means:

- every `DemandUnit` is assigned
- no hard constraint is violated

Failure means:

- no complete non-violating assignment exists under the provided primitive input and hard constraints

Package `001` does not expose partial-fill success.

Coverage is solver semantics, not just another optional constraint.

## Time Basis

All timestamps and date derivations in one solve must use one explicit timezone basis supplied by the caller or compiler.

Package `001` does not infer timezone semantics implicitly.

## Constraint Timing

### Prefix-Checkable

Rules that can soundly reject a candidate assignment during search.

Examples:

- qualification mismatch
- overlap / double-booking
- rolling-window max
- minimum rest when violated by adding one assignment

### Completion-Only

Rules that require a completed state or derived whole-state interpretation.

Examples:

- full coverage success check
- completion-only pattern rules if partial states cannot soundly violate them

## Hard Rule Slices

### Qualification Validity

Meaning:

- an assignment is invalid if the assigned agent lacks any required qualification for the full interval

Timing:

- `prefix-checkable`

Primitive witness:

- missing qualification
- expired or insufficient validity interval

### Availability / Time-Off Eligibility

Meaning:

- an assignment is invalid if the assigned agent is not permitted to work the full demand interval

Examples:

- unavailable interval overlaps demand interval
- approved leave covers part of the interval
- worker is restricted from this shift type or day

Timing:

- `prefix-checkable`

Primitive witness:

- agent
- demand unit
- blocking availability interval or policy reference

Current implemented slice:

- `unavailable` intervals block overlapping demand intervals
- explicit `available` intervals act as allow-lists when present for a candidate
- no availability windows means the candidate is unconstrained by availability

### Overlap / Double-Booking

Meaning:

- one agent may not hold two assignments whose intervals overlap

Timing:

- `prefix-checkable`

Primitive witness:

- agent
- conflicting assignments or assignment plus candidate assignment
- overlapping intervals

### Rolling-Window Max

Meaning:

- no more than `N` counted events for one agent in a rolling window `W`

For package `001`, rolling-window max uses **assignment-start count semantics** unless a future rule family explicitly introduces another counted event type.

Window math follows the same solve-wide local calendar basis as the rest of the package.

Counted event definition:

- each assignment contributes exactly one counted event
- the event timestamp is the assignment interval `start`
- multiple assignments on the same day count multiple times
- overnight assignments still count once, at assignment start

Timing:

- typically `prefix-checkable`

Primitive witness:

- agent
- counted events in window
- window definition
- allowed maximum
- actual count

### Minimum Rest

Meaning:

- assignments for the same agent must have at least the configured minimum end-to-start gap

Required interval semantics:

- gap is measured from the earlier interval `end` to the later interval `start`
- because intervals are half-open, exact boundary contact implies zero gap
- minimum rest is satisfied iff `later.start - earlier.end >= requiredRest`

Timing:

- `prefix-checkable`

Primitive witness:

- agent
- conflicting assignments or assignment plus candidate assignment
- required minimum rest
- actual gap

### Consecutive-Work Pattern Limits

Meaning:

- no more than `N` consecutive worked days for one agent

This rule depends on a derived worked-day interpretation.

Worked-day derivation for package `001`:

- a worked day is a local calendar date in the solve-wide host-local basis
- an assignment contributes a worked day for every local calendar date whose date interval intersects the assignment interval
- multiple assignments on the same local calendar date count as one worked day for consecutive-work evaluation
- overnight assignments may therefore contribute more than one worked day

Timing:

- `prefix-checkable` when adding an assignment can only increase or extend the current worked-day run
- otherwise `completion-only`

Primitive witness:

- agent
- worked-day run
- allowed maximum
- actual run length

### Shift-Pattern Compatibility

Meaning:

- an assignment is invalid if it would place the same agent into a forbidden shift pattern under an explicit compiled rule

Examples:

- night shift followed by day shift without allowed break
- weekend-only worker assigned to weekday shift
- non-rotating worker assigned into alternating shift family

Timing:

- `prefix-checkable` when the pattern violation is decidable from the candidate assignment plus current committed state
- otherwise `completion-only`

Calendar classification for weekday/weekend rules uses the same solve-wide local basis and the shift start date, not UTC conversion.

Primitive witness:

- agent
- triggering assignment or candidate assignment
- related assignment set or pattern facts
- violated rule identity

Current implemented slice:

- standalone day restrictions are enforced during eligibility
- night-to-day turnaround is enforced during assignment validation against existing assignments

### Global Coverage Coupling Rules

Meaning:

- a complete assignment set is invalid if it fails a required cross-position or line-level staffing condition

Examples:

- no active line shift without at least one line lead
- no staffed shift without at least one forklift-certified worker
- support role required whenever a dependent role is staffed

Timing:

- typically `completion-only`
- may be `prefix-checkable` only when violation is soundly decidable from partial state

Primitive witness:

- affected demand units or grouped source needs
- missing required supporting capability or role
- violated rule identity

Current implemented slice:

- global coverage is validated on complete assignment sets
- invalid complete assignments cause solver backtracking
- dedicated `coverage-conflict` primitive reasons are emitted on failed complete states

## Deferred Policy

The following are explicitly outside package `001`:

- minimum-utilization obligations
- optimization
- ranking among feasible solutions
- fairness
- preferences
- partial-fill success semantics
- qualification substitution semantics
- overtime cost optimization

## Infeasibility Output

The kernel may produce primitive infeasibility witnesses at the level of:

- `DemandUnit`
- `Assignment`
- `Constraint`
- derived counted or worked-day events when explicitly defined by a rule

The domain layer is responsible for regrouping primitive failures back into:

- `Need`
- `Shift`
- `Position`
- `Candidate`
- availability or pattern rule sources where relevant

Regrouping is defined interface behavior, not ad hoc presentation logic.

### Primitive Witness Payload Shape

Primitive witnesses currently include:

- a discriminating `type`
- referenced primitive ids where applicable
- rule-local facts needed for deterministic explanation
- normalized, deterministic ordering at the solver boundary

Allowed referenced primitive ids:

- `agentId`
- `demandUnitId`
- related demand unit ids when committed assignments are involved

Rule-local facts may include:

- overlapping intervals
- actual vs allowed count
- actual vs required rest
- worked-day run boundaries
- availability conflict kind
- shift-pattern rule type
- coverage rule identity
- utilization window bounds and affected demand ids
- dependent/supporting position ids
- supervisor demand unit ids

## Implementation Readiness

This contract is ready to drive first implementation planning for package `001` provided the implementation keeps these boundaries explicit:

- primitive ontology stays domain-agnostic
- domain compilation occurs before solving
- deferred policy remains out of scope
- each hard rule defines its counted or derived event semantics explicitly where needed

## Residual Boundaries

The remaining local details are limited to representation choices, not semantic ones:

- concrete API signatures for constraint evaluation
- concrete domain metadata carried for regrouping
- remaining unimplemented domain slices for shift-pattern and coverage rules

These are implementation details within the locked contract, not unresolved package-boundary questions.
