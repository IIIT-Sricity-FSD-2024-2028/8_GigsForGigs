# GigsForGigs

## Running locally

Backend (`apps/backend/`):
```
npm run dev
```
Listens on the port in `apps/backend/.env` (`PORT=3000`).

Frontend (`apps/frontend/`):
```
npm run dev
```
Runs on `:5173`.

## Seeding test data

From `apps/backend/src/db/`:
```
npx tsx prisma/seed.ts
```
Wipes and repopulates every table with fake data via `@faker-js/faker`. Every seeded user shares the same password: `password123`.

## Test credentials

After seeding, log in as any of these (or query the `USERS` table for more — the seed creates 20 users: 2 admin, 7 client, 4 manager, 7 gig professional):

| Role | Email | Password |
|---|---|---|
| Admin (super admin) | `zachary33@hotmail.com` | `password123` |
| Client | `johnathon18@yahoo.com` | `password123` |
| Manager | `lee_mckenzie19@gmail.com` | `password123` |
| Gig Professional | `marlee45@gmail.com` | `password123` |

Note: these emails are regenerated each time you re-run the seed script, so they'll change after a fresh seed. To find current ones, query the `USERS` table (e.g. via `npx prisma studio` from `apps/backend/src/db/`) — every seeded user's password is still `password123`.
