# Batch Flow Scheduling Playground

This is the parallel playground for `batch-flow-scheduling`.

Current scope:

- render the package sample model
- show the compiled solver-neutral graph summary
- show the stable solution shape
- expose the package docs as generated HTML, without duplicating app-local docs
- stay thin and explanatory

Run:

```bash
pnpm --filter batch-flow-scheduling-playground build
pnpm --filter batch-flow-scheduling-playground dev
pnpm --filter batch-flow-scheduling-playground ship
```

Notes:

- package markdown docs remain the source of truth under `packages/batch-flow-scheduling/docs`
- this app syncs the generated HTML into `generated-docs/` during build/dev
- `ship` deploys the built app to Cloudflare Workers via Wrangler
