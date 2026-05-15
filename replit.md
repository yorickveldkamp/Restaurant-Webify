# HACCP Beheer

A Dutch-language HACCP food safety compliance app for restaurants. Tracks fridge/freezer temperatures, cleaning checklists (daily/weekly/monthly), and generates PDF and CSV reports. Data is stored locally in the browser via localStorage.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS (artifacts/haccp)
- PDF generation: jsPDF + jspdf-autotable

## Where things live

- `artifacts/haccp/src/lib/data.ts` — all constants (OBJECTS, CLEANING_TASKS), types, and utility functions
- `artifacts/haccp/src/lib/storage.ts` — localStorage read/write helpers
- `artifacts/haccp/src/lib/pdf.ts` — PDF and CSV export logic
- `artifacts/haccp/src/pages/` — Dashboard, Temperature, Cleaning, Reports tabs
- `lib/api-spec/openapi.yaml` — OpenAPI contract (health check only, app is frontend-only)

## Architecture decisions

- App is fully frontend-only; no backend needed. Data persists in localStorage under `haccp:temp-reports` and `haccp:clean-reports`.
- Mobile-first responsive design: wide tables on desktop, card-based layout on mobile (md breakpoint).
- PDF generation done client-side with jsPDF + autotable — no server required.
- Status thresholds: Koeling OK ≤ 7.0°C / warn ≤ 10°C; Diepvries OK ≤ -18.0°C / warn ≥ -21°C.

## Product

Dutch HACCP restaurant compliance tool with four tabs: Dashboard (stats + recent log), Temperatuur (fridge/freezer measurements with 3 readings per unit), Reiniging (daily/weekly/monthly cleaning checklists), and Rapporten (view/delete/export saved reports as PDF or CSV).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `jspdf-autotable` package requires a type declaration override in `pdf.ts` (the `autoTable` method is not in the base jsPDF types).
- Do not run `pnpm dev` at workspace root.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
