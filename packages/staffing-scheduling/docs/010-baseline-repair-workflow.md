# Baseline Repair Workflow

Baseline repair is the workflow layer wrapped around the staffing-feasibility solver.

The key boundary is:

- the workflow manages copied baseline state, hard locks, retention, and staged repair
- the inner solver still receives only concrete finite solve attempts

The current intended split is:

1. hard locks
2. retention hierarchy
3. repair orchestration
4. concrete solve attempts

Recommended first-pass retention ladder:

1. keep `candidate + shift + position`
2. then keep `candidate + shift`
3. then full release under hard locks only

This workflow is intentionally outside the primitive solver boundary.
