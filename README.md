Shipment Status Tracker - Nagarkot Forwarders

A full-stack application built for Nagarkot Forwarders Pvt. Ltd. to track shipments as they move through their lifecycle — from booking to delivery, with a full status history and a public tracking view.

Tech Choices & Why

Frontend: React (TypeScript) + Vite

Why: React's component model fits a dashboard with several distinct views (public tracker, admin list, shipment detail) well. Vite over Create React App for faster HMR and a simpler build pipeline. TypeScript keeps props, API responses, and status values consistent across components.
Routing: react-router-dom — used to separate the public tracking page (/) from the admin area (/admin) as distinct routes rather than conditionally rendered state, so each has its own URL and the admin area can be gated behind a route guard.
Charts: recharts — used for a small analytics view (shipments by status, volume over time) in the admin dashboard. This is beyond the core requirements; I added it because a status tracker without any at-a-glance view of how many shipments are in each state felt incomplete, not because it was asked for.
PDF export: jspdf / jspdf-autotable — lets an admin export the current shipment list as a PDF, a common real-world ask for logistics ops. Also beyond the core requirements, included as a small extra rather than a required feature.

Backend: Node.js + Express (TypeScript)

Why: Express is lightweight and unopinionated, appropriate for the size of this API (a handful of REST routes). I considered NestJS for its structure, but for five-ish endpoints the extra layering (modules, DI, decorators) would add more ceremony than value here — I'd reach for it if this were expected to grow into a larger service.

Database: PostgreSQL + Prisma ORM

Why: Postgres because the brief calls it out as reflecting the team's stack. I considered SQLite for zero-setup local development, but went with Postgres directly so local dev matches production and I'm not deferring a migration risk to later. Prisma gives type-safe queries and straightforward migrations, and models the status-history relationship (one shipment → many history rows) cleanly as a proper foreign-key relation rather than a JSON blob or string log.

Styling: Pure CSS (Custom Design System)

Why: To demonstrate CSS fundamentals (Flexbox, CSS variables, responsive layout) directly, without a utility framework. Kept deliberately simple and consistent rather than heavily themed.
How to Run Locally
Prerequisites
Node.js v18+
A PostgreSQL database — either install Postgres locally, or use the bundled docker-compose.yml, which starts just a Postgres container (no app containers):
bash
  docker compose up -d
1. Backend
bash
cd backend
npm install

cp .env.example .env
# Edit .env and set DATABASE_URL, e.g.:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shipment_tracker?schema=public"

# Apply the schema
npx prisma db push

# Seed sample shipments (optional, but recommended to see the app populated)
npx tsx prisma/seed.ts

# Start the dev server
npm run dev

The backend runs on http://localhost:4000.

2. Frontend

Open a new terminal:

bash
cd frontend
npm install

cp .env.example .env
# VITE_API_URL defaults to http://localhost:4000 — update it if your backend runs elsewhere,
# and again when pointing at a deployed backend.

npm run dev

The frontend runs on http://localhost:5173.

Demo admin login

The backend seeds a default admin user on first run (admin / password123) so the admin area is reachable without any extra setup. See the note on authentication below — this is a UI facade, not real auth.

Assumptions & Design Decisions
Status state machine. I assumed shipments follow a defined, mostly-linear progression (BOOKED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED), with one cyclical exception — RETURN_DUE_TO_CUSTOMER, which loops back to OUT_FOR_DELIVERY for a redelivery attempt. The backend enforces this and rejects invalid jumps (e.g. BOOKED straight to DELIVERED). I made this assumption because unconstrained status changes felt like it would under-model how shipments actually move in practice; a real implementation would confirm this flow with ops before enforcing it this strictly.
History as its own table, not a status log or JSON field. Every status change — including the initial one at creation — writes a StatusHistory row with a timestamp and optional note, so the timeline always reflects the complete lifecycle and can be queried/ordered directly.
Public tracker + admin area, not a single unified view. I assumed two audiences: someone tracking one shipment by reference number (no login), and staff managing the full list, creating shipments, and updating statuses (admin area). This is a design choice beyond the brief's minimum, made to keep "view a shipment's status" and "manage shipments" as clearly separate concerns.
Mock authentication. The brief explicitly marks auth as out of scope. I still built a UI "facade" — a login screen and a route guard — to separate the public tracker from admin management conceptually, but it's intentionally shallow: no hashing, no JWTs/sessions, no real security boundary. Anyone can inspect the API directly and call the admin endpoints without logging in. It exists to make the demo feel coherent, not as a security feature, and I would not consider it acceptable in anything beyond this exercise.
referenceNumber is the human-facing identifier and is unique; the internal id is used only for routing.
Search matches reference number, origin, or destination, case-insensitive substring match — the brief calls out status and reference number specifically; I extended it to origin/destination since it was a low-cost, natural addition on the same query.
Scaling to 10,000 Shipments & Multiple Concurrent Users

At that scale, the risk isn't raw row count — Postgres handles 10,000 rows trivially — it's query shape and concurrent writes. I'd add indexes on the columns actually filtered and sorted on (referenceNumber, currentStatus, updatedAt), and replace the current "load everything, filter in memory" approach with server-side, cursor- or offset-based pagination so the list endpoint and the browser aren't holding the full dataset. For concurrent status updates, the real risk is two dispatchers updating the same shipment at once and one silently overwriting the other — I'd guard against that with optimistic concurrency control (a version number or updatedAt check on write, rejecting a stale update rather than my current transaction alone fully preventing it) rather than relying on database transactions by themselves. Separately, I'd introduce a read-through cache (Redis) in front of the list/search endpoints to absorb read load, since that's a distinct problem from the write-concurrency one above and shouldn't be conflated with it. Finally, since Prisma against a hosted Postgres instance opens a connection per client, I'd add connection pooling (PgBouncer, or Prisma Accelerate) once multiple backend instances are running concurrently, or the app will hit Postgres's connection limit well before it hits any real data-volume limit.

Deployment
Frontend: [live URL]
Backend: [live URL]
