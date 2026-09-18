# Shipment Status Tracker

A small full-stack app for tracking shipments through status stages, built for the Nagarkot
technical assessment.

- `backend/` — Express + TypeScript API, Prisma ORM, PostgreSQL
- `frontend/` — React + TypeScript (Vite)

## Tech choices, and why

- **TypeScript everywhere** — per the assignment's preference, and it keeps the shape of a
  `Shipment` consistent between the API and the UI.
- **Express** over Fastify/NestJS — the API surface here is five small routes; Express keeps the
  boilerplate minimal without hiding anything. NestJS would be my pick if this were expected to
  grow into a larger service with modules/DI.
- **PostgreSQL + Prisma** — Postgres because it's called out as reflecting the team's stack.
  Prisma because it gives type-safe queries, painless migrations, and models the status-history
  relationship (one shipment → many history rows) cleanly.
- **A separate `StatusHistory` table, not a JSON column or string log** — status history needs to
  be queried and ordered (and eventually paginated/audited), so it's modeled as its own table with
  a foreign key to `Shipment`, rather than jammed into a text field. Creating a shipment writes an
  initial `BOOKED` (or chosen) history row, so the timeline always represents the *complete*
  lifecycle, not just changes made after creation.
- **Status as a Prisma/Postgres enum** (`BOOKED`, `IN_TRANSIT`, `CUSTOMS_HOLD`,
  `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`) rather than a free-text string — it keeps the
  status flow well-defined and lets both the DB and the UI validate against a fixed list. It's not
  enforced as a strict state machine (see assumptions below).
- **React + Vite**, no Next.js — the app is a single view (list + create + detail), so Vite's
  faster dev loop won over Next's SSR/routing machinery, which isn't needed here.
- **Zod** for request validation on the backend, so bad input is rejected with a clear 400 rather
  than surfacing as a Prisma error or a 500.
- **No auth/state library** — out of scope per the brief; local component state was enough for one
  view.

## Running it locally

Requires Node 18+ and either a local Postgres instance or Docker (for the bundled
`docker-compose.yml`, which starts *just* Postgres — no app containers).

### 1. Start Postgres

```bash
docker compose up -d
```

(Or point `DATABASE_URL` at any Postgres instance you already have running.)

### 2. Backend

```bash
cd backend
cp .env.example .env        # adjust DATABASE_URL if not using the default docker-compose values
npm install
npm run prisma:migrate      # creates the schema (prompts for a migration name, e.g. "init")
npm run dev                 # starts the API on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL defaults to http://localhost:4000
npm install
npm run dev                 # starts the UI on http://localhost:5173
```

Open http://localhost:5173. Create a shipment, update its status a couple of times, and open it to
see the history timeline.

### API summary

| Method | Route                         | Purpose                                   |
|--------|--------------------------------|--------------------------------------------|
| GET    | `/api/shipments?status=&search=` | List shipments, optional status/text filter |
| POST   | `/api/shipments`               | Create a shipment (seeds first history row) |
| GET    | `/api/shipments/:id`           | Get one shipment with full history          |
| PATCH  | `/api/shipments/:id/status`    | Append a status change, update current state |

## Assumptions

- **Status flow is not strictly enforced as a state machine.** Any status can be set from any
  other (e.g. `DELIVERED` → `EXCEPTION` is allowed) to keep scope manageable, on the assumption
  that real-world logistics has enough edge cases (returns, redeliveries, corrections) that a
  rigid transition graph would need product input I don't have. The six stages themselves
  (`Booked → In Transit → Customs Hold → Out for Delivery → Delivered`, plus `Exception` as a
  catch-all) are my own reasonable default for a freight/forwarding flow.
- **`referenceNumber` is unique** and used as the human-facing identifier; the numeric `id` is
  purely internal/routing.
- **Search matches reference number, origin, or destination**, case-insensitive, substring match —
  the brief mentions filtering by "status or reference number," and origin/destination felt like a
  natural, low-cost extension.
- **Every status update requires a full history entry**, including the initial one at creation —
  there's no "silent" status change, so the timeline is always complete.
- **Single-user, no auth** — explicitly out of scope per the brief.
- **Dates are stored as timestamps** (`expectedDeliveryDate` as a date, `changedAt` as a precise
  timestamp) since history ordering needs real time-of-day precision even though delivery dates
  are day-level.

## Deployment

Deploy frontend and backend on separate platforms, e.g.:

- **Backend** → Railway / Render / Fly.io. Set `DATABASE_URL` (use the platform's managed
  Postgres, or Railway/Render's own Postgres add-on) and `CORS_ORIGIN` to the deployed frontend
  URL. Run `npm run build && npm run prisma:deploy && npm start`.
- **Frontend** → Vercel. Set `VITE_API_URL` to the deployed backend URL. Build command
  `npm run build`, output directory `dist`.

## At 10,000 shipments and multiple concurrent users

At that scale the main risks aren't raw row count (Postgres handles 10k rows trivially) — they're
concurrency and query shape. I'd add optimistic locking or a transaction-scoped row lock on status
updates so two concurrent status changes to the same shipment can't race and leave the
`currentStatus` and `statusHistory` out of sync (currently mitigated but not fully guarded by
wrapping the update in a Prisma `$transaction`). I'd paginate and index the shipment list properly
— add a composite index on `(currentStatus, updatedAt)` and switch the list endpoint from
"return everything" to cursor-based pagination, since the current implementation loads the full
filtered result set. I'd move search from `LIKE`/`ILIKE` scans to Postgres full-text search (or
an external index like Meilisearch/Elasticsearch) once reference-number/origin/destination lookups
stop being trivially fast. I'd also add basic auth and per-user/team scoping (explicitly out of
scope here, but a real prerequisite for "multiple concurrent users" to mean anything beyond
"multiple people hitting the same unguarded API"), plus rate limiting and connection pooling
(PgBouncer) in front of Postgres so concurrent request bursts don't exhaust the connection limit.

## Note on this submission

This project was scaffolded and written with AI assistance (Claude). Frontend type-checking and a
production build were verified locally. Prisma's engine binaries couldn't be fetched in the
sandbox this was built in (no network egress to `binaries.prisma.sh`), so run `npm run
prisma:migrate` yourself on first setup to confirm the schema applies cleanly — the schema and
query code follow standard, well-documented Prisma patterns but haven't been executed against a
live Postgres instance yet.
