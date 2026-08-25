# IBOCA · Bogotá Air Quality

Live view of Bogotá’s **Air Quality and Health Risk Index (IBOCA)** built with Next.js, React Aria Components, and Tailwind CSS. The homepage is a city snapshot (hero map of localities) plus a station explorer with on-demand 7-day history.

User-facing UI copy is in Spanish; source code, comments, and this README are in English.

## Data

Reads the public IBOCA map backend:

- Stations: `http://iboca.ambientebogota.gov.co/iboca/service/allstations/true` (server, `/api/stations`)
- History: `http://iboca.ambientebogota.gov.co/iboca/service/stationHistoricalHours/{id}` (on demand, `/api/stations/[id]/history`)

Fetching avoids CORS and revalidates every 5 minutes. Band cutoffs and official hex live in `IBOCA_BANDS` (`src/lib/iboca.ts`).

## Development

Node is pinned in `.tool-versions` (asdf). pnpm comes from Corepack via the `packageManager` field in `package.json`.

```bash
asdf install
corepack enable
asdf reshim nodejs
pnpm install
pnpm dev
```

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Start the Next.js app    |
| `pnpm build` | Production build         |
| `pnpm start` | Serve the production app |
| `pnpm lint`  | Run ESLint               |

## Stack

- Next.js App Router
- React Aria Components
- Tailwind CSS v4
- pnpm (Corepack)
- Typography: Fraunces + Manrope
