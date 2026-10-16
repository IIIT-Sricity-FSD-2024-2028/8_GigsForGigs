# GigsForGigs

## Running locally

Backend (`apps/backend/`), copy `.env.example` to `.env` first:
```
npm install
npm run build      # installs + generates the Prisma client in src/db
npm run dev
```
Listens on `PORT` (default `5000`).

Frontend (`apps/frontend/`):
```
npm install
npm run dev
```
Runs on `:5173` and talks to `http://<host>:5000/api` unless `VITE_API_BASE_URL` is set.

Checks: `npm run typecheck` and `npm test` (backend), `npm run build` (frontend).

## Seeding test data (dev databases only)

From `apps/backend/src/db/`:
```
ALLOW_DESTRUCTIVE_SEED=true npx tsx prisma/seed.ts
```
This **deletes every row** and repopulates with fake data, so it refuses to run without the flag or with `NODE_ENV=production`. Every seeded user's password is `password123`; query the `USERS` table (`npx prisma studio`) for current emails.

## Deploying

**API** (`apps/backend`): any Node ≥ 20.19 host.
1. Set env vars from `apps/backend/.env.example`: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (≥ 32 chars), `APP_URL` (public frontend URL), and optionally `CORS_ORIGINS` and `TRUST_PROXY`. The server refuses to start in production if a required one is missing.
2. Build: `npm ci && npm run build`
3. Release step, before each start: `npm run migrate:deploy`
4. Start: `npm start`. Health check: `GET /health` (returns 503 if the DB is unreachable). Handles SIGTERM gracefully.

**Frontend** (`apps/frontend`): static hosting.
1. `npm ci && npm run build`, then serve `dist/`.
2. Either serve the API on the same origin under `/api` (the default for production builds), or set `VITE_API_BASE_URL=https://api.example.com/api` at build time and add the frontend origin to the API's `CORS_ORIGINS`.
3. Invite links use query strings on `/`, so no SPA rewrite rules are required.

**Invites**: nothing is emailed yet. Creating a manager invite (client) or an admin invite (admin) returns a one-time link, which the inviter shares manually.

Changing `JWT_SECRET` signs everyone out and invalidates outstanding invite links.
