<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack) app named `iboca-bogota`; there is no database or test suite. Package manager is pnpm (pinned via `packageManager`). Standard commands live in `README.md`/`package.json` (`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`).

User-facing UI copy is Spanish; source, comments, and docs are English.

Non-obvious notes:
- The app server-fetches live data from the public IBOCA API (needs outbound HTTP):
  - stations: `http://iboca.ambientebogota.gov.co/iboca/service/allstations/true`
  - 7-day hourly history (on demand): `http://iboca.ambientebogota.gov.co/iboca/service/stationHistoricalHours/{id}`
- If stations are unreachable, the homepage renders "No se pudo cargar IBOCA". `/api/stations` and `/api/stations/[id]/history` return 502 with `{ success: false, error }` — the app itself is not broken.
- The homepage and `/api/stations` are statically prerendered at build time (revalidate 5m), so `pnpm build` hits the stations endpoint. History is fetched from the client via `/api/stations/[id]/history` and is not required for a successful build.
- Station and history payloads are slimmed in `src/lib/iboca.ts`. Band cutoffs, labels, and official hex live in `IBOCA_BANDS` — do not inline those comparisons or hex values. Cache keys: `iboca-stations-v3`, `iboca-history-v2` (bump when the slim shape changes).
- `pnpm install` reports an ignored build script for `unrs-resolver`. This is expected and does not need approval; lint/build/dev all work without it. Do not run the interactive `pnpm approve-builds`.
- The `nextjs-agent-rules` block above is auto-written/re-added by `next dev`. If it reappears as an uncommitted change, commit it rather than fighting it.
