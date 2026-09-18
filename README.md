# Shipment Status Tracker

A robust, full-stack application built for tracking shipments through their lifecycle.

## Links
- **GitHub Repository**: [Insert Link Here]
- **Frontend Deployment (Vercel)**: [Insert Link Here]
- **Backend Deployment (Render/Railway)**: [Insert Link Here]

## 1. Tech Choices and Why

- **Frontend**: **React (via Vite)** and **TypeScript**. React provides a predictable, component-driven UI that is highly performant for complex dashboards. Vite was chosen over Create React App or Next.js to provide an extremely fast, lightweight development environment while still strictly satisfying the recommendation for React. I utilized pure CSS (glassmorphism UI) over UI libraries to demonstrate raw styling capability and reduce bundle size.
- **Backend**: **Express (Node.js)** with **TypeScript**. Express is the industry standard for lightweight, unopinionated Node servers. TypeScript ensures the `Shipment` interfaces are completely synchronized between the client and server.
- **Database**: **PostgreSQL** via **Prisma ORM**. PostgreSQL is a robust relational database (matching the preferred stack). Prisma provides a completely type-safe query builder that prevents SQL injection and makes database migrations effortless.
- **Analytics**: **Recharts**. Used to build the "Executive Dashboard" which provides real-time business intelligence (Donut charts, Bar charts, Area charts) natively mapped to our React state.

## 2. Running Locally

**Prerequisites:**
- Node.js (v18+)
- A PostgreSQL Database (Local or Neon/Supabase)

**Backend Setup:**
1. Navigate to the backend: `cd backend`
2. Install dependencies: `npm install`
3. Add your database URL: Create a `.env` file based on `.env.example` and set `DATABASE_URL`.
4. Push the schema: `npx prisma db push`
5. Start the server: `npm run dev` (Runs on port 4000)

**Frontend Setup:**
1. Navigate to the frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite server: `npm run dev` (Runs on port 5173)

## 3. Assumptions Made

- **Status Flow**: I assumed shipments generally move linearly (`BOOKED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`), but can jump to `CUSTOMS_HOLD` or `EXCEPTION` at any point. The tracking timeline UI accounts for this by dynamically rendering current/past states while "projecting" unreached future states.
- **History Auditing**: I assumed that business operations require an immutable audit trail. Thus, `StatusHistory` is a separate relational table that logs every state change and every manual edit (via the UI) rather than just storing a single "current status" string.
- **Reference Numbers**: I assumed human-readable tracking numbers are better for UX than UUIDs, so the system auto-generates smart references like `NGK-2026-8291` while still allowing users to input their own.

## 4. Scaling to 10,000+ Shipments and Concurrent Users

If this needed to support 10,000 shipments and multiple concurrent users, I would implement cursor-based pagination on the `GET /api/shipments` endpoint to prevent massive payloads from degrading the frontend dashboard. I would wrap state-changing database operations (like moving a shipment to `DELIVERED`) in strict Prisma transactions to prevent race conditions from concurrent updates. To maintain sub-millisecond search speeds in the UI, I would add a PostgreSQL full-text index on the `referenceNumber` and `origin`/`destination` columns. Finally, for a true real-time dashboard, I would introduce WebSocket connections (or Server-Sent Events) so the analytics UI updates instantly across all active users when a shipment changes state, rather than relying on manual page reloads.
