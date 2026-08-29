# Test credentials (seeded data)

All seeded users share the same password: `password123`

| Role | Email | Name |
|---|---|---|
| Client | lyda17@gmail.com | Burley Witting |
| Manager | elaina83@yahoo.com | Sam Ullrich |
| Gig Professional | elvera.fadel@yahoo.com | Gilbert Lesch |
| Admin | gustave_rempel-ondricka87@yahoo.com | Foster Franecki |

Notes:
- These come from `apps/backend/src/db/prisma/seed.ts` — re-running `npx prisma db seed` wipes and regenerates all rows, so these exact emails will change after a reseed (query the DB again for fresh ones).
- Log in at the frontend's Login page, selecting the matching role in "Log in as" (Client / Manager / Gig Professional / Super Admin — note Super Admin here maps to the `admin` DB role).
