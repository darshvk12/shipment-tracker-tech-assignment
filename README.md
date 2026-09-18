# Nagarkot Forwarders Pvt Ltd - Shipment Tracker

A robust, production-ready full-stack application built for tracking shipments through their lifecycle. Engineered for the Nagarkot technical assessment.

## Project Structure
- `backend/` — Express + TypeScript API, Prisma ORM, SQLite
- `frontend/` — React + TypeScript (Vite)

## Architectural Choices & Rationale

- **TypeScript across the stack** — Ensures type safety and consistent `Shipment` interfaces between the backend API and frontend UI.
- **SQLite + Prisma** — Selected SQLite to eliminate external dependencies (like Docker/Postgres) making this instantly executable on any machine for easy review. Prisma provides type-safe queries, simple migrations, and clearly models the one-to-many relationship between Shipments and their Status History.
- **Dedicated `StatusHistory` Table** — Status history is modeled relationally rather than as a JSON column. This ensures complete auditability, precise ordering, and future-proofs the system for pagination or granular queries.
- **Status Enums** — By restricting statuses to a strict list (`BOOKED`, `IN_TRANSIT`, `CUSTOMS_HOLD`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`), we prevent data corruption and allow both DB and UI layers to validate inputs safely.
- **Frontend Architecture (React + Vite)** — Utilized Vite for rapid local development. Implemented `react-router-dom` to cleanly separate the public-facing tracking portal from the internal management dashboard.
- **DRY Component Design** — The dynamic visual tracking pipeline is extracted into a modular `TrackingTimeline` component, reused seamlessly across both the public portal and the internal admin modal to reduce code duplication and enforce UI consistency.

## Running the Application Locally

The application requires Node 18+ to run. No Docker or external database setup is required due to the embedded SQLite database.

### 1. Backend API

```bash
cd backend
npm install
npm run dev
```
*The backend API will start on http://localhost:4000. (The SQLite database is pre-configured).*

### 2. Frontend Application

```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on http://localhost:5173.*

## Core Features

1. **Public Tracking Portal (`/`)**: A dedicated customer-facing view. Customers can enter their sequential reference number (e.g., `NGK-2026-0001`) to view a professional visual timeline of their shipment's journey.
2. **Admin Dashboard (`/admin`)**: A comprehensive management interface to create, update, and delete shipments. Includes real-time filtering, glassmorphic toast notifications, and automated sequential reference generation based on the current year.

## API Specification

| Method | Route                               | Purpose                                   |
|--------|-------------------------------------|-------------------------------------------|
| GET    | `/api/shipments?status=&search=`    | List shipments with optional filtering    |
| POST   | `/api/shipments`                    | Create a shipment                         |
| GET    | `/api/shipments/:id`                | Get one shipment with full history logs   |
| GET    | `/api/shipments/track/:reference`   | Public endpoint to fetch tracking details |
| PATCH  | `/api/shipments/:id/status`         | Update status and append to history log   |
| PUT    | `/api/shipments/:id`                | Update shipment core details              |
| DELETE | `/api/shipments/:id`                | Delete a shipment completely              |

## Scaling Considerations (10,000+ Shipments)

While this application currently uses SQLite for ease of review, it is built with Prisma, meaning it can be effortlessly migrated to a managed PostgreSQL cluster (e.g., AWS RDS or Supabase) simply by changing the provider string.

At 10,000+ concurrent users, the following optimizations would be deployed:
1. **Pagination**: Switch the `GET /api/shipments` endpoint to cursor-based pagination to prevent loading large datasets into memory.
2. **Concurrency Control**: Implement database transaction-scoped locks when updating shipment statuses to prevent race conditions during high-volume API calls.
3. **Indexing**: Add composite indexes on `(currentStatus, updatedAt)` and full-text indexing for reference numbers to keep search queries in the sub-millisecond range.
4. **Authentication Strategy**: Wrap the `/admin` routes in JWT-based authentication to secure internal endpoints.
