---
name: Auth middleware location
description: Where requireAuth and getUser live in the API server
---

## Rule
`requireAuth` and `getUser` are exported from `artifacts/api-server/src/lib/auth.ts`.
Import in any new route file as: `import { requireAuth, getUser } from "../lib/auth.js";`

**Why:** The routes/auth.ts file only exports the default router — it does NOT re-export middleware. Importing from the wrong path causes esbuild to fail with "No matching export" errors.

**How to apply:** Every new route file that needs auth protection must use this import path.
