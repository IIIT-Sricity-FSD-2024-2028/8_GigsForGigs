# GigsForGigs – Complete Project Context

## Overview
GigsForGigs is a full-stack freelancing and gig marketplace platform designed to connect clients, gig professionals, and managers.
- **Clients**: Post tasks, review applications, assign work, manage budgets, invite managers, and approve completed deliverables.
- **Gig Professionals**: Build profiles, browse open marketplace tasks, submit applications, manage active assignments, and submit deliverables.
- **Managers**: Act as intermediaries invited by clients. They oversee assigned tasks, review deliverables for quality assurance, and provide updates.
- **Super Admins**: Monitor system-wide statistics, view all users, profiles, transactions, and reviews.

---

## Architecture & Infrastructure

### 1. The Frontend (`/front-end`)
- **Technology Stack**: Pure HTML, CSS (no frameworks like React or Vue), and Vanilla JavaScript (ES6 Modules).
- **Structure**: Pages are strictly organized by role (`/pages/client/`, `/pages/gig/`, `/pages/manager/`, `/pages/super-admin/`).
- **Data Persistence**: **Zero.** All mock data and `localStorage` caching has been completely removed. The frontend acts exclusively as a stateless UI presentation layer.
- **Serving**: Runs via a static file server (e.g., `npx http-server front-end -p 8080 -c-1`).

### 2. The Backend (`/back-end`)
- **Technology Stack**: NestJS (TypeScript), running on `http://localhost:3000`.
- **Database**: An **In-Memory Database** powered by the `DatabaseService` singleton. It utilizes native JavaScript `Map<string, T>` collections to store data temporarily.
- **Seeding**: Because the database lives in RAM, data resets on every server restart. The `SeedService` (`src/modules/super-admin/seed.service.ts`) runs on startup (`OnModuleInit`) to populate the system with a rich set of predefined users, tasks, applications, and payments so the UI is immediately functional.

---

## Authentication & RBAC (Role-Based Access Control)

The platform enforces strict RBAC across both the frontend routing and backend API endpoints.

### 1. The Frontend Token Store (`localStorage`)
The frontend uses `localStorage` **only** for session management. Upon successful login/signup, `auth.js` stores:
- `userId` (e.g., "u1")
- `role` (e.g., "CLIENT", "GIG_PROFESSIONAL", "MANAGER")
- `userName` (e.g., "Aditya Deshmukh")

*(Note: If you see legacy keys like `gfg_tasks` or `gfg_client_profile` in your browser, these are remnants of older sessions and should be cleared manually).*

### 2. The `api.js` Service Layer
Every single frontend network request is routed through `apiRequest()` inside `js/api.js`. This function acts as an interceptor, automatically attaching two crucial headers to every `fetch` request:
```http
x-role: <localStorage.getItem('role')>
x-user-id: <localStorage.getItem('userId')>
```

### 3. Backend Validation & Guards
- **The `RolesGuard`**: (`src/common/guards/roles.guard.ts`) Intercepts every incoming request, reads the `x-role` header, and compares it against the `@Roles(...)` decorator defined on the controller endpoint. If the role is missing or unauthorized, it throws a `403 Forbidden`.
- **The `ValidationPipe`**: NestJS enforces strict DTO (Data Transfer Object) validation. `whitelist: true` and `forbidNonWhitelisted: true` are enabled globally. This means any payload properties sent by the frontend *must* have explicit `class-validator` decorators (e.g., `@IsString()`) in the corresponding backend DTO file, otherwise the request is rejected with a `400 Bad Request`.

---

## Seeded Users (For Testing)

You can log in to the application at `http://localhost:8080/pages/login.html` using any of the following pre-seeded accounts:

| Role | Name | Email | Password | Internal ID |
|------|------|-------|----------|-------------|
| CLIENT | Aditya Deshmukh | aditya@techstart.io | password1 | u1 |
| CLIENT | Priya Sharma | priya@designco.in | password2 | u6 |
| GIG | Arham Kansal | arham@dev.com | password3 | u3 |
| GIG | Elena Torres | elena@code.dev | password4 | u4 |
| MANAGER | Leo Hudson | leo@techstart.io | password5 | u2 |
| SUPER_ADMIN | Alex Rivera | admin@gigsforge.com | admin123 | auto |

**Super Admin Backdoor:**
To view the admin dashboard, enter `admin123@gmail.com` with password `admin123` on the login page. This triggers an inline bypass script in `login.html` and redirects directly to `/pages/super-admin/admin-dashboard.html`.

---

## API Routes Dictionary

### 🔐 Auth (`/api/auth/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Authenticates Clients and Gig Professionals |
| POST | `/api/auth/signup` | Registers new users dynamically based on payload `role` |
| POST | `/api/auth/manager/login` | Dedicated authentication for Managers |

### 🏢 Client (`/api/`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks?clientId=...` | Retrieve all tasks owned by the client |
| PUT | `/api/tasks/:taskId` | Update an existing task |
| PATCH | `/api/tasks/:taskId` | Assign a task directly to a specific user |
| DELETE | `/api/tasks/:taskId` | Delete a task |
| GET | `/api/applications?taskId=...`| View all gig applications for a specific task |
| PATCH | `/api/applications/:id` | Accept or reject an application |
| GET | `/api/contracts?clientId=...` | View all active/past agreements |
| GET | `/api/tasks/:taskId/deliverables`| View submitted work for a task |
| PATCH | `/api/deliverables/:id` | Approve or reject a deliverable |
| GET | `/api/services` | View the gig professional service directory |
| POST | `/api/manager-invites` | Send an invite to a new manager |
| GET | `/api/manager-invites?clientId=...`| List invited managers |

### 🛠️ Gig Professional (`/gig/`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/gig/profile` | Retrieve own profile |
| PUT | `/gig/profile` | Update own profile |
| GET | `/gig/tasks/marketplace` | Browse open, unassigned tasks |
| POST | `/gig/applications` | Apply to a marketplace task |
| DELETE | `/gig/applications/:id` | Withdraw an application |
| GET | `/gig/requests/pending` | View private shortlist requests from clients |
| POST | `/gig/requests/:id/respond` | Accept or decline a shortlist request |
| GET | `/gig/tasks/active` | View currently assigned active tasks |
| POST | `/gig/deliverables` | Submit work deliverables for an active task |
| POST | `/gig/services` | Post a new service listing |
| GET | `/gig/services/mine` | View owned service listings |
| GET | `/gig/projects/completed` | View past completed projects |
| GET | `/gig/earnings` | View aggregate earning metrics |

### 📊 Manager (`/api/managers/`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/managers/me` | Retrieve own profile |
| PATCH | `/api/managers/me` | Update own profile |
| GET | `/api/managers/me/tasks` | View tasks assigned by clients for oversight |
| GET | `/api/managers/me/tasks/:taskId` | View deep details of an overseen task |
| GET | `/api/managers/me/tasks/:taskId/deliverables`| View deliverables submitted for an overseen task |
| POST | `/api/managers/me/tasks/:taskId/deliverables`| Submit deliverables on behalf of gig professionals |
| PATCH | `/api/managers/me/tasks/:taskId/deliverables/:no/review`| Review and add notes to a deliverable |
| PATCH | `/api/managers/me/tasks/:taskId/deliverables/:no/close` | Mark a deliverable cycle as closed |

---

## File Structure Map

```text
front-end/
├── css/                  # Styling (global, layout, component specific)
├── js/
│   ├── api.js            # Core HTTP client, Interceptor, formatting helpers
│   ├── auth.js           # Login & Signup logic (handles dropdown Role mapping)
│   ├── client.js         # Logic & DOM manipulation for all /client/ pages
│   ├── gig.js            # Logic & DOM manipulation for all /gig/ pages
│   └── manager.js        # Logic & DOM manipulation for all /manager/ pages
├── pages/
│   ├── client/           # Client Dashboards & Workflows (11 pages)
│   ├── gig/              # Gig Dashboards & Workflows (13 pages)
│   ├── manager/          # Manager Dashboards (2 pages)
│   ├── super-admin/      # Admin Dashboards (12 pages)
│   ├── login.html        # Main Login Gateway
│   └── signup.html       # Main Signup Gateway
├── index.html            # Landing page
└── context.md            # This document

back-end/
├── src/
│   ├── common/
│   │   ├── database/     # DatabaseService singleton + Schema Types + Generators
│   │   ├── decorators/   # Custom NestJS @Roles() decorator
│   │   ├── guards/       # RolesGuard (Validates x-role header)
│   │   └── rbac/         # Role enums
│   ├── modules/
│   │   ├── auth/         # (Legacy structure, actual auth logic lives in client/manager modules)
│   │   ├── client/       # Client controllers, services, and DTOs (includes main Auth logic)
│   │   ├── gig/          # Gig Professional controllers, services, and DTOs
│   │   ├── manager/      # Manager controllers, services, and DTOs
│   │   └── super-admin/  # SeedService (In-memory DB population) + Admin Stats Controller
│   ├── app.module.ts     # Application Root Module
│   └── main.ts           # Bootstrap, ValidationPipe configuration, CORS setup
```

---

## Running the Project Locally

**1. Start the Backend API**
Open your first terminal window:
```bash
cd back-end
npm install
npm run build
npm run start
```
*The API will be available at `http://localhost:3000`. Note: Every time you run `npm run build`, you must restart the server for changes to take effect.*

**2. Start the Frontend Server**
Open your second terminal window:
```bash
cd front-end
npx http-server -p 8080 -c-1
```
*The UI will be available at `http://localhost:8080`. The `-c-1` flag completely disables browser caching to ensure your HTML/JS changes appear immediately on refresh.*
