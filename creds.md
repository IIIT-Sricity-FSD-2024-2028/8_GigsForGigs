# Test credentials (Live PostgreSQL Seeded Data)

All seeded users share the same password: `password123`

| Role | Email | Name | Notes |
|---|---|---|---|
| **Super Admin** | `chaitanya.admin@gigsforgigs.internal` | Chaitanya Anand | Master Admin (`*` full access) |
| **Super Admin** | `jovan44@yahoo.com` | Jovan Miller | Master Admin |
| **Client** | `aditya@techstart.io` | Aditya Deshmukh | Seeded Client |
| **Client** | `julian_lynch7@gmail.com` | Julian Lynch | Seeded Client |
| **Manager** | `curtis45@hotmail.com` | Curtis Smith | Seeded Manager |
| **Manager** | `lempi65@yahoo.com` | Mitchell Robel | Seeded Manager |
| **Gig Professional** | `elena@gigpro.io` | Elena Rodriguez | Seeded Gig Pro |
| **Gig Professional** | `dessie8@yahoo.com` | Dessie Davis | Seeded Gig Pro |

### How to Log In:
1. Open the frontend at [http://localhost:5173](http://localhost:5173) and click **Sign in**
2. Enter your email and password (`password123`) — no role selector needed!
3. The system verifies your credentials with PostgreSQL and automatically routes you to the authoritative role dashboard (**Client**, **Manager**, **Gig Professional**, or **Super Admin**).

