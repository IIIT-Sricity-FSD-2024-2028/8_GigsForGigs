# Test credentials (Live PostgreSQL Seeded Data)

All seeded users share the same password: `password123`

Verified against the current database (bcrypt check of `password123`).

| Role | Email | Name | Notes |
|---|---|---|---|
| **Super Admin** | `chaitanya.admin@gigsforgigs.internal` | Chaitanya Anand | Master Admin (`*` full access) |
| **Super Admin** | `rod.rice37@hotmail.com` | Sherry Wisozk | Seeded Admin |
| **Client** | `jenna_roberts@yahoo.com` | Brandt West | Seeded Client |
| **Client** | `percival.kuhlman@hotmail.com` | Olen Huels | Seeded Client |
| **Manager** | `lempi65@yahoo.com` | Mitchell Robel | Seeded Manager |
| **Manager** | `marco.flatley@hotmail.com` | Eleonore Kerluke | Seeded Manager |
| **Gig Professional** | `jettie_grimes64@gmail.com` | Brooks Abernathy | Seeded Gig Pro |
| **Gig Professional** | `kristian.botsford-muller@hotmail.com` | Corene Ruecker | Seeded Gig Pro |

### How to Log In:
1. Open the frontend at [http://localhost:5173](http://localhost:5173)
2. Select your role in "Log in as" (**Client**, **Manager**, **Gig Professional**, or **Super Admin**)
3. Enter the email above and password `password123`

The backend runs on port 3000. If the UI can't reach it, set `VITE_API_BASE_URL=http://localhost:3000/api` in `apps/frontend/.env.local` and restart Vite.
