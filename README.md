# Shipment Status Tracker - Nagarkot Forwarders

A full-stack application built for Nagarkot Forwarders Pvt. Ltd. to track shipments as they move through their lifecycle. 

## 🚀 Tech Choices & Why

**Frontend:** React (TypeScript) + Vite
- *Why:* React provides a robust component-based architecture perfect for dynamic dashboards. Vite was chosen over Create React App for its incredibly fast HMR and optimized build process. TypeScript ensures type safety across props and state.

**Backend:** Node.js + Express (TypeScript)
- *Why:* Express is lightweight, unopinionated, and industry-standard. Pairing it with TypeScript ensures our API contracts (like the shipment status strings) are strictly enforced before runtime.

**Database:** PostgreSQL + Prisma ORM
- *Why:* Postgres is the gold standard for relational data. Prisma was chosen for its unparalleled developer experience and end-to-end type safety, which pairs perfectly with our TypeScript stack. It makes schema migrations and relational queries (like fetching a shipment's history) trivial and safe.

**Styling:** Pure CSS (Custom Design System)
- *Why:* To demonstrate a strong grasp of CSS fundamentals (Flexbox, CSS Variables, responsive media queries) without relying on heavyweight libraries like Tailwind or Bootstrap. The UI is custom-tailored to be professional, sleek, and responsive.

## 🛠️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or you can use the provided Neon DB string)

### 1. Setup Backend
```bash
cd backend
npm install

# Set up your environment variables
# Create a .env file and add your DATABASE_URL (or use the one provided)
# DATABASE_URL="postgresql://..."

# Run database migrations and seed mock data
npx prisma db push
npm run seed

# Start the development server
npm run dev
```
*The backend will run on http://localhost:4000*

### 2. Setup Frontend
Open a new terminal window:
```bash
cd frontend
npm install

# Start the frontend development server
npm run dev
```
*The frontend will run on http://localhost:5173*

## 🧠 Assumptions & Design Decisions

1. **Status State Machine:** I assumed shipments must follow a strictly linear progression (`BOOKED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED`), with the exception of `RETURN_DUE_TO_CUSTOMER` which cycles back to `OUT_FOR_DELIVERY`. The backend enforces this state machine and prevents invalid leaps (e.g., jumping from `BOOKED` directly to `DELIVERED`).
2. **History Tracking:** Rather than mutating a single status field, I assumed an audit trail was critical for logistics. I implemented a `StatusHistory` table in Postgres that logs every state change with timestamps and optional notes, which powers the visual tracking timeline.
3. **Mock Authentication:** The prompt explicitly marked authentication as out-of-scope. I built a functional UI "facade" for the Admin Portal to separate public tracking from admin management, but it purposely does not implement complex backend JWTs/sessions to respect the time box.

## 📈 Scaling to 10,000 Shipments & Multiple Users

If this needed to support 10,000 active shipments and concurrent users, I would introduce database indexing on frequently queried fields like `referenceNumber` and `currentStatus` to maintain fast read speeds. I would replace the client-side sorting/filtering on the frontend with server-side pagination and offset-based SQL queries to prevent overloading the browser's memory. For high concurrency, I'd implement optimistic UI updates backed by Redis caching on the server to reduce direct Postgres hits, and wrap status updates in strict database transactions with row-level locking to prevent race conditions when two dispatchers try to update the same shipment simultaneously.
