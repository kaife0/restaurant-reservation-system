# Restaurant Reservation Management System

A full-stack reservation system for a single restaurant with fixed tables. Customers book tables for a date/time slot; admins oversee and manage all bookings.

**Stack:** React (Vite) · Node.js/Express · MongoDB (Mongoose) · JWT auth

## Live Demo

- Frontend: `<add your Vercel/Netlify URL here>`
- Backend API: `<add your Render/Railway URL here>`
- Admin login: `admin@restaurant.com` / `Admin@123` (seeded — change after first deploy)

## Project Structure

```
restaurant-reservation-system/
  server/   Express API (MongoDB via Mongoose, JWT auth, role-based routes)
  client/   React app (Vite, React Router, Axios)
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- A MongoDB connection string — for local development, either:
  - a local `mongod` / Docker container (see below), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (**required for deployment** — a locally-running database isn't reachable from Render/Railway)

Quickest local option, using Docker:
```bash
docker run -d --name restaurant-mongo -p 27017:27017 -v restaurant_mongo_data:/data/db mongo:7
# then in server/.env: MONGO_URI=mongodb://127.0.0.1:27017/restaurant
```
The named volume (`restaurant_mongo_data`) persists data across container restarts.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env    # fill in MONGO_URI and JWT_SECRET
npm run seed             # creates 6 tables + one admin user
npm run dev               # http://localhost:5000
```

`.env` values:

| Key | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Any long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, for CORS |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the seeded admin account |

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env    # set VITE_API_URL to your backend's /api URL
npm run dev               # http://localhost:5173
```

## Deployment

- **Backend** → Render/Railway as a Node web service. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your deployed frontend origin) as environment variables. Run `npm run seed` once (e.g. via a one-off shell/job) against the production database to create tables and the admin account.
- **Frontend** → Vercel/Netlify. Set `VITE_API_URL` to the deployed backend's `/api` URL.
- **Database** → MongoDB Atlas free tier.

## Assumptions

- Single restaurant, fixed set of tables seeded via `npm run seed` (not created by customers).
- Reservations use **fixed time slots** (`12:00-13:30`, `13:30-15:00`, `19:00-20:30`, `20:30-22:00`) rather than arbitrary start/end times — this keeps overlap detection exact and simple, matching the assignment's scope (no partial-slot overlaps to reason about).
- Self-registration always creates a `customer` account; the `admin` role is only assigned via the seed script (or manually in the DB) — there's no public "become an admin" path.
- A reservation's `date` is a plain `YYYY-MM-DD` string, not a timezone-aware `Date`, to avoid timezone drift between browser and server.

## Reservation & Availability Logic

The key requirement — **prevent double bookings** — is enforced in two layers:

1. **Application-level checks** (`server/controllers/reservationController.js`): the requested table must exist, its `capacity` must be ≥ the requested `guests`, the date must not be in the past, and the slot must be one of the fixed values.
2. **Database-level guarantee** (`server/models/Reservation.js`): a **partial unique index** on `{ table, date, slot }`, scoped to `status: 'active'`, means MongoDB itself rejects a second active reservation for the same table/date/slot — even if two requests race each other at the exact same moment. This is deliberately *not* a "check for conflicts, then insert" pattern, because that has a race window under concurrent requests; the unique index makes the guarantee atomic. A conflicting request gets a `409 Conflict` with a clear message (translated from MongoDB's duplicate-key error in `middleware/errorHandler.js`).

Cancelling a reservation sets `status: 'cancelled'` rather than deleting it (so the same table/date/slot becomes bookable again, and history is preserved for admins).

`GET /api/tables/available?date=&slot=&guests=` combines both rules for the customer-facing UI: it excludes tables with an active reservation for that date+slot, and filters by capacity, before the user ever picks a table — so in practice conflicts are rare, and the unique index is the last line of defense rather than the primary UX.

## Role-Based Access (Customer vs Admin)

- JWT payload carries the user's `role`. `middleware/auth.js` exposes `protect` (must be logged in) and `authorize('admin')` (must be an admin), composed per-route.
- Customers can only ever see/cancel **their own** reservations (`GET/DELETE /api/reservations/me`, `.../:id` scoped by `user: req.user._id`).
- Admin-only routes (`GET /api/reservations` [all, optional `?date=`], `PUT /api/reservations/:id`, table CRUD) are gated with `authorize('admin')` and return `403` for customers.
- On the frontend, `ProtectedRoute` redirects unauthenticated users to `/login` and non-admins away from `/admin`; the navbar and dashboard shown are role-aware (`AuthContext`).

## API Overview

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/tables` | Authenticated |
| GET | `/api/tables/available?date=&slot=&guests=` | Authenticated |
| POST/PUT/DELETE | `/api/tables[/:id]` | Admin |
| POST | `/api/reservations` | Authenticated |
| GET | `/api/reservations/me` | Authenticated |
| DELETE | `/api/reservations/:id` | Authenticated (own reservation) |
| GET | `/api/reservations?date=` | Admin |
| PUT | `/api/reservations/:id` | Admin |

## Known Limitations

- No email/SMS confirmation (explicitly out of scope per the brief).
- No pagination on reservation/table lists — fine at this scale, would need it for a real multi-table, high-volume restaurant.
- Table capacity is treated as a hard minimum (`capacity >= guests`); there's no "best-fit" table suggestion — the customer picks manually from whatever is available.
- No password-reset flow.

## Areas for Improvement (with more time)

- Optimistic UI locking / a short "reservation hold" while the customer is picking a table, so the UX for a just-lost race is friendlier than a plain error.
- Admin ability to edit table capacity/merge tables for large parties (currently a manual table pick).
- Automated tests (Jest/Supertest for the API, React Testing Library for the UI) — logic was verified manually end-to-end for this submission.
- Rate limiting and stricter input validation (e.g. via `zod`/`express-validator`) on all endpoints.
