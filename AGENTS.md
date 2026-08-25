<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack) app named `iboca-bogota`; there is no backend, database, or test suite. Package manager is pnpm (pinned via `packageManager`). Standard commands live in `README.md`/`package.json` (`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`).

Non-obvious notes:
- The app server-fetches live data from the external IBOCA API (`http://iboca.ambientebogota.gov.co/...`). This requires outbound network access. If it is unreachable, the homepage renders a "No se pudo cargar IBOCA" fallback and `/api/stations` still returns but with no data — the app itself is not broken.
- The homepage and `/api/stations` are statically prerendered at build time (revalidate 5m), so `pnpm build` will also hit the external IBOCA API.
- `pnpm install` reports an ignored build script for `unrs-resolver`. This is expected and does not need approval; lint/build/dev all work without it. Do not run the interactive `pnpm approve-builds`.
- The `nextjs-agent-rules` block above is auto-written/re-added by `next dev`. If it reappears as an uncommitted change, commit it rather than fighting it.
