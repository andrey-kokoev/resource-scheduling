# Recurring Scheduling Boundary

Recurring scheduling is not a primitive solver concept in staffing scheduling.

The current boundary keeps recurrence at the domain layer:

- recurring shift templates
- recurring need templates
- recurring availability templates
- recurrence rules
- exceptions
- finite expansion horizon

The solver still sees only concrete finite input.

Implications:

- recurrence expansion failure is separate from solver infeasibility
- recurrence should compile into ordinary `DomainInput`
- the staffing solver is not a recurrence engine

The first-pass recurrence stance remains:

- domain-side authoring and finite expansion
- no recurrence-aware primitive witness families
- no template-level semantics inside the feasibility kernel
