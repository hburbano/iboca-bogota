# IBOCA · Bogotá Air Quality

Live view of Bogotá’s **Air Quality and Health Risk Index (IBOCA)** built with Next.js, React Aria Components, and Tailwind CSS.

## Data

Reads the public IBOCA map backend:

`http://iboca.ambientebogota.gov.co/iboca/service/allstations/true`

Fetching runs on the server (or via `/api/stations`) to avoid CORS and revalidates every 5 minutes.

## Development

```bash
pnpm install
pnpm dev
```

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `pnpm dev`    | Start the Next.js app    |
| `pnpm build`  | Production build         |
| `pnpm start`  | Serve the production app |
| `pnpm lint`   | Run ESLint               |

## Stack

- Next.js App Router
- React Aria Components
- Tailwind CSS v4
- pnpm
- Typography: Fraunces + Manrope
