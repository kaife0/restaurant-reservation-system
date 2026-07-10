# Restaurant Reservation Management System

A full-stack reservation system for a single restaurant with a fixed set of tables. Customers book tables for a date and time slot; administrators oversee and manage every reservation and the tables themselves.

**Stack:** React (Vite) · Node.js / Express · MongoDB (Mongoose) · JWT authentication

## Live Demo

- **Frontend:** `<add your Vercel URL here>`
- **Backend API:** `<add your Render URL here>`
- **Admin login:** `admin@restaurant.com` / `Admin@123` _(seeded — change the password after first deploy)_
- **Customer:** register any account from the Register page.

## Project Structure

```
restaurant-reservation-system/
├── server/                      # Express REST API
│   ├── server.js                # app entry: security middleware, routes, DB connect
│   ├── constants.js             # the fixed time slots
│   ├── seed.js                  # seeds 6 tables + one admin user
│   ├── config/db.js             # Mongoose connection
│   ├── models/                  # User, Table, Reservation (schemas + indexes)
│   ├── controllers/             # request handling + business logic
│   ├── routes/                  # REST endpoints, wired to auth middleware
│   ├── middleware/
│   │   ├── auth.js              # protect (JWT) + authorize(role) guards
│   │   ├── rateLimiter.js       # brute-force protection on auth routes
│   │   └── errorHandler.js      # centralized error → JSON + status codes
│   └── utils/                   # ApiError, asyncHandler, generateToken
└── client/                      # React single-page app
    └── src/
        ├── api/axios.js         # axios instance: attaches JWT, auto-logout on 401
        ├── context/AuthContext.jsx   # auth state (login/register/logout, role)
        ├── components/          # reusable UI (Button, Input, Card, Badge, …)
        └── pages/               # LoginPage, RegisterPage, CustomerDashboard, AdminDashboard
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- A MongoDB connection string. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster is recommended (and **required for deployment**, since a locally-running database isn't reachable from a hosting platform). A local `mongod` or Docker container also works for development.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then fill in the values below
npm run seed              # creates 6 tables + the admin user
npm run dev               # starts on http://localhost:5000
```

`server/.env` values:

| Key | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string — generate with the command below |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, used for CORS (e.g. `http://localhost:5173`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the seeded admin account |

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:5000/api
npm run dev               # starts on http://localhost:5173
```

## Assumptions

- **Single restaurant** with a fixed set of tables, seeded via `npm run seed` (customers cannot create tables).
- Reservations use **fixed time slots** (`12:00-13:30`, `13:30-15:00`, `19:00-20:30`, `20:30-22:00`) rather than arbitrary start/end times. This keeps overlap detection exact and simple — there are no partial-slot overlaps to reason about.
- **Self-registration always creates a `customer`.** The `admin` role is only assigned by the seed script (or manually in the DB); there is no public path to become an admin.
- A reservation's `date` is stored as a plain `YYYY-MM-DD` string (not a timezone-aware `Date`) to avoid timezone drift between browser and server.
- A cancelled reservation is kept (status flips to `cancelled`) rather than deleted, so its table/slot frees up while history is preserved for admins.

## Reservation & Availability Logic

Preventing double bookings — the core requirement — is enforced in **two layers**:

1. **Application checks** (`controllers/reservationController.js`): the table must exist, its `capacity` must be ≥ the requested `guests`, the date cannot be in the past, and the slot must be one of the fixed values.
2. **Database guarantee** (`models/Reservation.js`): a **partial unique index** on `{ table, date, slot }`, scoped to `status: 'active'`. MongoDB itself rejects a second *active* reservation for the same table/date/slot — even if two requests race at the exact same moment. This is deliberately **not** a "check-then-insert" pattern (which has a race window); the unique index makes the guarantee atomic. A conflict surfaces as **`409 Conflict`** with a clear message, translated from MongoDB's duplicate-key error in `middleware/errorHandler.js`.

`GET /api/tables/available?date=&slot=&guests=` combines both rules for the booking UI: it returns only tables that have no active reservation for that date+slot **and** whose capacity fits the party. So the customer usually never hits a conflict — the unique index is the last line of defense, not the primary UX.

## Role-Based Access (Customer vs Admin)

- The JWT payload carries the user's `id` and `role`. `middleware/auth.js` provides `protect` (must be authenticated) and `authorize('admin')` (must be an admin), composed per route.
- **Customers** can only create, view, and cancel **their own** reservations — every query is scoped to `user: req.user._id`.
- **Admin-only** routes (view all reservations, filter by date, update/cancel any reservation, table CRUD) are gated with `authorize('admin')` and return `403` for customers.
- On the frontend, `ProtectedRoute` redirects unauthenticated users to `/login` and non-admins away from `/admin`. The navbar, role badge, and dashboard are role-aware, so a customer sees the booking view and an admin sees the management panel.

## Security

- **Passwords** are hashed with bcrypt (`User` model pre-save hook) and never returned in any response.
- **JWT** auth with the secret and token lifetime supplied via environment variables — no secrets in code (`.env` is gitignored; `.env.example` ships placeholders only).
- **Role escalation is impossible via the API** — the register endpoint ignores any client-supplied role.
- **`helmet`** sets hardened HTTP security headers on every response.
- **Rate limiting** (`express-rate-limit`) throttles the `/api/auth` routes to slow brute-force / credential-stuffing.
- **CORS** is restricted to the configured `CLIENT_URL`.
- **Auto-logout**: the axios response interceptor clears the session and redirects to login if a request with a stored token returns `401` (expired/revoked token).
- **Centralized error handling** returns consistent JSON and correct HTTP status codes (`400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict).

## API Overview

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/tables` | Authenticated |
| GET | `/api/tables/available?date=&slot=&guests=` | Authenticated |
| POST / PUT / DELETE | `/api/tables[/:id]` | Admin |
| POST | `/api/reservations` | Authenticated |
| GET | `/api/reservations/me` | Authenticated |
| DELETE | `/api/reservations/:id` | Authenticated (own reservation) |
| GET | `/api/reservations?date=` | Admin |
| PUT | `/api/reservations/:id` | Admin |

## Deployment

Step-by-step instructions for deploying to Render (backend), Vercel (frontend), and MongoDB Atlas (database) are in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Known Limitations

- No email / SMS confirmation (out of scope per the brief).
- No pagination on reservation/table lists — fine at this scale, but a high-volume restaurant would need it.
- Table capacity is a hard minimum (`capacity >= guests`); there's no automatic "best-fit" suggestion — the customer picks from the available tables.
- No password-reset flow.
- Render's free tier sleeps after inactivity, so the first request after idle can take a few seconds to wake the backend.

## Areas for Improvement (with more time)

- A short "reservation hold" while the customer is choosing a table, so a just-lost race is friendlier than an error.
- Admin editing of table capacity and merging tables for large parties.
- Automated tests (Jest/Supertest for the API, React Testing Library for the UI) — the flows were verified manually end-to-end for this submission.
- Schema-level request validation (e.g. `zod` / `express-validator`) shared across all endpoints.
