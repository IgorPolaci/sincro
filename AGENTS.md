# Project Rules

Read `/docs/IMPLEMENTATION_PLAN.md` before implementing features.

## Stack

- TypeScript strict, Next.js 16.3.8, Node.js 24 LTS
- Supabase PostgreSQL, Auth and Storage
- Tailwind CSS, shadcn/ui, Zod

## Critical rules

- Never bypass RLS or expose service-role keys.
- Never physically delete operational data.
- Always scope data by organization; never trust an organization id from the browser.
- Never update inventory without an inventory movement.
- Sales must be transactional; cancellation must reverse inventory correctly.
- Financial operations and exports must be auditable.
- Database changes require versioned migrations.
- Validate all external input with Zod.
- Run lint, typecheck, tests and build before completing tasks.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
