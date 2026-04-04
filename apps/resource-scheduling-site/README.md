# Resource Scheduling Site

This app is the top-level deploy surface for the repo.

It stages the two child apps into one site:

- `/staffing/`
- `/batch-flow/`

and exposes a root landing page at `/`.

Build:

```bash
pnpm --filter resource-scheduling-site build
```

Ship:

```bash
pnpm ship
```

Notes:

- the child apps still own their own build surfaces
- this app does not duplicate their logic or docs
- it just stages their built assets into one Cloudflare site
