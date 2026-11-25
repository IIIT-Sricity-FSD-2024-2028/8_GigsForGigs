# GigsForGigs

## 1. Why this platform exists

Hiring independent professionals often means juggling separate places for finding talent, agreeing on scope, tracking progress, and reviewing completed work. Small teams may also need someone to coordinate a project without giving that person control over hiring or payments.

**GigsForGigs brings those steps into one role-based platform.** Clients can publish work or find a professional's listed service. Gig professionals can discover opportunities and manage their work. A client can bring in a manager to coordinate assigned work, while the client retains control over hiring and payment decisions.

## 2. What is distinctive about GigsForGigs

- **Two ways to start work:** clients can post an open task for professionals to apply to, or request a service that a professional has listed.
- **One task can involve multiple professionals:** each hire has its own assignment and progress, so the client can divide work across specialists while keeping it under one task.
- **Deliverables are agreed and reviewed in the platform:** clients define expected deliverables; managers can add subtasks for the work they supervise; professionals submit completed work for review and possible revision.
- **Managers coordinate without payment authority:** a client can assign a manager to a particular professional's hire. The manager can oversee the assigned tasks and deliverables, while payment controls remain with the client or authorized administrators.
- **Work history is preserved:** ending a hire or withdrawing from eligible work records the outcome, rather than simply erasing the relationship and its task history.
- **Profiles support informed decisions:** clients can review applicant profiles, and professionals can view task posters' public profiles. Contact details are shown according to the backend's access rules.
- **Platform governance is built in:** administrators have tools for user and project oversight, review moderation, disputes, payment records, staff permissions, and audit history.

Payments are represented through an escrow-style workflow in the application, including funding, approval, release, refund, and dispute actions. This README does not claim integration with an external payment processor.

## 3. Who uses the platform

### Client

A client creates an account, completes a profile, and either publishes a task or requests a listed service. For posted tasks, the client reviews applications, views applicant profiles, shortlists or hires professionals, and can hire multiple professionals against the same task. The client can define deliverables, assign a manager to an individual hire, review submissions, request revisions, and manage funding or release actions.

### Gig professional

A gig professional creates a profile with skills and portfolio details, browses open tasks, and applies to suitable work. They can also publish services and respond to service requests. After being hired, they view their active work, submit deliverables, respond to review feedback, and track completed projects and earnings.

### Manager

A manager joins through a client invitation. They see only work assigned to them, can coordinate active tasks, add subtasks or deliverables, and review submitted work. Managers do not receive payment controls.

### Super administrator

Super administrators oversee platform operations. Depending on their assigned tier and permissions, they can review users and projects, manage staff access, moderate reviews, handle disputes, inspect payment records, and manage platform settings. Backend authorization enforces permissions for protected actions.

## 4. A typical project journey

1. A client publishes an open task with its description, budget, expected timing, and relevant skills.
2. Professionals discover the task and apply. The client reviews applications and chooses one or more professionals.
3. The client defines the expected deliverables and may assign a manager to supervise each professional's work.
4. The client funds the hire through the platform's escrow-style workflow. The professional submits work against the agreed deliverables.
5. The client or assigned manager reviews submissions. Work can be approved or sent back for revision; managers coordinate but cannot release funds.
6. When work is approved, the client can complete the payment workflow. Dispute and administrative review flows are available for cases that need intervention.

A service request follows a related path: the client requests a professional's listed service, the professional responds, and an accepted request becomes tracked work in the same task and deliverable workflow.

## 5. Technical overview

### Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Redux Toolkit, and React Redux.
- **Backend:** Node.js, Express 5, TypeScript, and Prisma 7.
- **Database:** PostgreSQL.
- **Authentication:** role-aware JWT sessions. Frontend auth tokens are held in Redux memory, not browser storage; refreshing the page requires signing in again.

### Repository layout

```text
apps/
  frontend/
    src/
      pages/          # Route-level screens for client, gig, manager, and admin portals
      components/     # Shared and role-specific UI
      services/api/   # Typed API repositories and shared HTTP client
      store/          # Redux store, hooks, and feature slices
  backend/
    src/
      modules/        # Auth, client, gig, manager, payment, admin, and profile APIs
      middleware/     # Authentication, role checks, validation, and error handling
      db/             # Prisma schema, migrations, and seed data
```

The frontend separates API transport from state: components dispatch async thunks, thunks call API repositories, and slices store successful server responses and request status. The backend applies role checks and resource-level authorization before performing database operations.

## 6. Run locally

You need Node.js 20.19 or newer and a PostgreSQL database.

### Backend

1. Copy `apps/backend/.env.example` to `apps/backend/.env` and set at least `DATABASE_URL` and `JWT_SECRET` for local development.
2. From `apps/backend/`, install dependencies and generate the Prisma client:

   ```sh
   npm install
   npm run build
   ```

3. Apply database migrations and start the API:

   ```sh
   npm run migrate:deploy
   npm run dev
   ```

The API defaults to port `5000`. `GET /health` reports API and database readiness.

### Frontend

From `apps/frontend/`:

```sh
npm install
npm run dev
```

Vite serves the frontend on port `5173`. In development, API requests default to `http://<host>:5000/api`; set `VITE_API_BASE_URL` to override it.

### Checks

- Backend type check: `npm run typecheck` from `apps/backend/`.
- Backend tests: `npm test` from `apps/backend/`.
- Frontend production build (includes TypeScript compilation): `npm run build` from `apps/frontend/`.

## 7. Development data and invitations

For a development database only, seed fake data from `apps/backend/src/db/`:

```sh
ALLOW_DESTRUCTIVE_SEED=true npx tsx prisma/seed.ts
```

**Seeding deletes existing rows before adding sample data.** It refuses to run without the flag and refuses to run in production. Seeded accounts use the password `password123`; check the `USERS` table for their current email addresses.

Manager and administrator invitations currently return one-time links; the inviter shares those links manually. Email delivery is not implemented.

## 8. Deployment notes

Deploy the API and frontend separately. For the API, configure production `DATABASE_URL`, a `JWT_SECRET` of at least 32 characters, `APP_URL`, and as needed `CORS_ORIGINS` and `TRUST_PROXY`. Run `npm ci && npm run build`, apply migrations with `npm run migrate:deploy`, then start with `npm start`.

Build the frontend with `npm ci && npm run build` and serve the generated `dist/` directory. The API can be reverse-proxied under `/api`, or `VITE_API_BASE_URL` can point to the deployed API. Add the frontend origin to the API's CORS configuration when they use different origins.

Changing `JWT_SECRET` invalidates existing sessions and outstanding invite links.
