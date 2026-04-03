# Batch Flow Scheduling

This package is the sibling scheduling track for line, batch, and flow-oriented scheduling.

It is intentionally only a scaffold right now. The old `packages/line-scheduling.ts` placeholder has been replaced by a package boundary with room for:

- line and station domain types
- batch and flow entities
- scheduling policy and constraint families
- a future playground that parallels the staffing scheduling evaluator

Current status:

- package folder established
- TypeScript build surface established
- source split out into files instead of a single placeholder

No functional batch-flow scheduling behavior is implemented yet.
