# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GigsForGigs is a freelance/task marketplace with a React frontend and an Express + Prisma/PostgreSQL backend, organized as two independent apps under `apps/` (no npm workspaces — each has its own `package.json`/lockfile; the root `package.json` is not a workspace root, so always `cd` into the relevant app before running scripts).

**Current implementation state (important):** the frontend (`apps/frontend`) is fully built out and every role attempts real backend calls first, falling back to mock/local data on failure. The backend (`apps/backend`) is fully implemented, not a scaffold: `app.ts`/`index.ts`/`server.ts` wire up a real Express app, and every module (`auth`, `admin`, `client`, `manager`, `gig`, `payment`) has real `*.controller.ts`/`*.service.ts`/`*.route.ts` code mounted in `app.ts`. The backend listens on the port in `apps/backend/.env` (`PORT=3000`) — **all frontend API base URLs must match this**; `httpClient.ts` and `services/api/admin/adminApi.ts` previously hardcoded `:5000` (a stale value from `server.ts`'s in-code default), which silently broke every real call for auth/gig/super-admin until fixed. Per-role status:
  - **Login always tries the real backend first.** `AuthContext.tsx`'s `login()`/`signup()` call `authApi` against `/api/auth/*` for every role, and only fall back to a fake `mock-dev-jwt-token` session if that request fails. Tokens are stored per-actor via `httpClient.ts`'s `setToken`/`TOKEN_KEYS` (`g4g_client_token`, `g4g_manager_token`, `g4g_gig_token`, `g4g_admin_token`) — don't assume a role's token is missing without checking that map first.
  - **CLIENT**: wired directly in `context/ClientContext/ClientContext.tsx` (not a separate `services/api/client/*Api.ts` file — that folder is still `.gitkeep`) via `apiFetch` with `actor: 'client'`, hitting `clientRouter`'s real routes (`/tasks`, `/applications`, `/contracts`, `/services`, `/requests`, `/manager-invites`) plus `managerRouter`'s client-facing `/managers` roster endpoints, falling back to `marketplaceStore`/local state per-method on failure.
  - **GIG_PROFESSIONAL**: `gigApi.ts` calls the fully-implemented `gigRouter` (`/api/gig/*`). Its file header claims "no mock fallback," but nearly every method actually does fall back to `marketplaceStore` (a local in-memory store) on failure — the comment is stale, trust the code.
  - **MANAGER**: `managerApi.ts` calls the fully-implemented `managerRouter` (`/api/managers/me`, tasks, applications, deliverables, `gig/professionals`), falling back to in-file mock data (`mockProfile`/`mockTasks`/`mockTalents`) on any failure.
  - **SUPER_ADMIN**: two clients exist, and only one is actually used. Every super-admin page imports `services/api/admin/adminApi.ts` (self-authenticates with a hardcoded admin credential; falls back to empty arrays/objects) — but **6 of its endpoints call routes the backend doesn't implement** (`/clients/:id/kyc`, `/gig-pros/:id/badge`, `/users/:id/status`, `/sessions/:id/revoke`, `/reviews/:id/moderate`, `/profile/password`, `/profile/2fa`) and will always fall through to the empty fallback. `services/api/super-admin/adminApi.ts` is dead code — unused by any page — but is actually the *correct* client: every endpoint it calls matches a real `adminRouter` route.
  - **Payment**: `PaymentContext.tsx` is pure local state and never calls `payment.route.ts` at all. That's arguably correct as-is — the backend's payment module (`/api/payments/initiate`, `/release`) has no `authGuard`/`roleGuard` (unauthenticated financial endpoint) and doesn't persist to Prisma; it just recomputes `gigAmount + ₹100 fee` server-side and returns a fabricated, non-persisted `PaymentRecord`. Needs real auth + persistence before it's worth wiring the frontend to.

## Common commands

Frontend (`apps/frontend/`):
```
npm run dev       # start Vite dev server on :5173 (host: true, listens on all interfaces)
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # preview production build
```

Backend (`apps/backend/`):
```
npm run build      # npm --prefix src/db run build (i.e. prisma generate — there is no tsc build step)
npm run dev        # tsx watch src/index.ts
npm run start      # tsx src/index.ts
```
`index.ts` sets up env/DNS ordering then imports `server.ts`, which starts the real Express `app` from `app.ts` on the port in `.env` (`PORT=3000`) — `npm run dev`/`start` run straight from TypeScript via `tsx`, no `dist/` output.

Prisma / DB (`apps/backend/src/db/`, separate `package.json` from the backend app):
```
npx prisma generate    # regenerate client into src/db/generated/prisma
npx prisma migrate dev # create/apply a migration (config: prisma.config.ts, schema: prisma/schema.prisma)
npx prisma studio
```
There is no root-level test runner configured in either app.

## Architecture

### Frontend (`apps/frontend/src/`)

- **No React Router.** Navigation is done entirely with local component state and callback props — top-level role routing lives in `App.tsx` (`unauthView`, `clientView`, `managerActiveTab`, etc.), and individual portals pass `onNavigate`/`setActiveTab` callbacks down instead of using URLs. When adding a new screen, follow this pattern (add a view id + conditional render + nav callback) rather than introducing a router.
- **Role-based portals**: the app renders one of four portals based on `user.role` from `AuthContext` — `CLIENT`, `MANAGER`, `GIG_PROFESSIONAL`, `SUPER_ADMIN`. Each portal has a parallel structure across `pages/<role>/`, `components/<role>/{cards,forms,modals,sections,tables}/`, `layouts/<Role>Layout/`, `context/<Role>Context/`, `hooks/<role>/`, `services/api/<role>/`, and `types/<role>/`. When adding a feature for one role, mirror the existing structure for that role rather than inventing a new layout.
- **Auth tries the real backend, with a mock fallback.** `context/AuthContext/AuthContext.tsx`'s `login()`/`signup()` call `authApi` against `/api/auth/*` for every role first; only on failure does it fall back to a client-only fake session (`mock-dev-jwt-token`, an in-memory `MOCK_USERS_DB`-style session object). `loginManager`/`logoutManager` go through `managerApi`/`authApi.managerLogin`.
- **API client pattern varies by role/file — check each file's actual behavior, not its header comment.** `managerApi.ts` (hardcoded `API_BASE_URL = 'http://localhost:3000/api'`) and `gigApi.ts` (via the shared `httpClient.ts`) both fetch-then-fall-back-to-local-data (in-file `mockProfile`/`mockTasks`/`mockTalents` for manager; `marketplaceStore` for gig) on any failure — despite `gigApi.ts`'s own file comment claiming no fallback exists, most of its methods have one. `ClientContext.tsx` follows the same fetch-then-local-fallback shape directly (no separate `clientApi.ts` file; `services/api/client/` is still `.gitkeep`). `authApi.ts` deliberately has **no** fallback — a comment explains why (silently faking a login "would let the UI log in a user who was never authenticated by the server"). `services/api/admin/adminApi.ts` (the client every super-admin page actually imports) self-authenticates with a hardcoded admin credential and falls back to empty arrays/objects on failure, but 6 of its endpoints call routes that don't exist on the backend (see the state note above) and will always hit that fallback. `services/api/super-admin/adminApi.ts` is a second, unused admin client — correct against the backend, but dead code. When adding a new API client method, match the existing fallback behavior of that specific file's other methods rather than assuming any one pattern applies everywhere, and verify the target path actually exists in the corresponding `*.route.ts` before wiring to it.
- Design tokens live in `theme/` (`colors.ts`, `spacing.ts`, `typography.ts`, `radius.ts`, `shadows.ts`) and global CSS in `styles/` (`variables.css`, `globals.css`, `reset.css`, `utilities.css`).

### Backend (`apps/backend/src/`)

- `modules/<domain>/` follows a `*.controller.ts` / `*.service.ts` / `*.route.ts` / `*.dto.ts` split per domain (`auth`, `admin`, `client`, `manager`, `gig`, `payment` — all fully implemented, mounted in `app.ts`). Routers are guarded with `authGuard`/`roleGuard`/`clientOwnershipGuard`/`taskAccessGuard` middleware (`middleware/`); mount order in `app.ts` matters because `clientRouter` applies `roleGuard("client")` unconditionally at its bare `/api` mount, so it's registered last to avoid shadowing the other role routers.
- `db/` is a self-contained sub-project with its own `package.json`, `tsconfig.json`, and `.env` (separate from the backend app's own `.env`). Prisma client is generated to `db/generated/prisma/` (not `node_modules/.prisma`) per `schema.prisma`'s `generator client { output = "../generated/prisma" }`.

### Data model (`apps/backend/src/db/prisma/schema.prisma`)

Core entities: `User` (role: `client` | `gig_professional` | `manager`; no separate super-admin DB role yet, unlike the frontend's `SUPER_ADMIN` user role) → one-to-one `Client`, `GigProfessionalProfile`, or `Manager`. `Client` owns `Task`s; `Manager` belongs to a `Client` and gets `GigManagerAssignment`s pairing a gig professional with a task. `Application`, `Deliverable`, `Payment`, and `Review` all key off `Task` + `GigProfessionalProfile`. Table names are explicitly mapped to upper-snake-case (`@@map`) and columns to snake_case (`@@map`/`@map`) for the actual PostgreSQL schema, while Prisma-side fields/models stay camelCase/PascalCase — keep using `@map`/`@@map` when extending the schema rather than renaming columns to match Prisma casing.

<!-- BRIEFED_START -->
## [2026-08-30T16:52:05.299Z] 57c48c5d3fbc03a9644baacfb44c260a3525636d
FILES: apps/ (admin.service.ts, App.tsx, AuthContext.tsx, ClientContext.tsx, PaymentContext.tsx, Login.tsx, MyGigs.tsx, ReviewDeliverables.tsx, PaymentsRevenue.tsx, marketplaceStore.ts)
DEPS: 159 insertions, 162 deletions

## [2026-08-30T08:21:58.830Z] 79fb44c3766f51114e91b1b1333937be56b689fa
DEPS: 3827 insertions, 3093 deletions

FILES: apps/ (package.json, app.ts, dbClient.ts, index.ts, inv.tmp.ts, package.json, prisma.config.ts, migration.sql, schema.prisma, seed.ts, admin.dto.ts, admin.service.ts, auth.controller.ts, auth.dto.ts, auth.route.ts, auth.service.ts, client.dto.ts, client.service.ts, gig.serializer.ts, manager.controller.ts, manager.dto.ts, manager.route.ts, manager.serializer.ts, manager.service.ts, payment.controller.ts, payment.dto.ts, payment.route.ts, payment.service.ts, payment.types.ts, App.tsx, api.ts, roles.ts, routes.ts, AuthContext.tsx, ClientContext.tsx, GigContext.tsx, PaymentContext.tsx, ClientLayout.tsx, GigLayout.tsx, ManagerLayout.tsx, adminMockData.ts, Login.tsx, ClientDashboard.tsx, MyGigs.tsx, PostGig.tsx, ReviewDeliverables.tsx, ReviewShortlist.tsx, SearchTalent.tsx, TotalSpent.tsx, client.css, ActiveTasks.tsx, CompletedProjects.tsx, GigDashboard.tsx, MyServices.tsx, PostService.tsx, SubmitDeliverables.tsx, TotalEarnings.tsx, ManagerDashboard.tsx, ReviewDeliverables.tsx, SearchTalent.tsx, AdminAnalytics.tsx, AdminManagement.tsx, ClientManagement.tsx, Dashboard.tsx, DisputesReports.tsx, GigProfessionalManagement.tsx, ManagersManagement.tsx, PaymentsRevenue.tsx, PlatformSettings.tsx, Projects.tsx, Reviews.tsx, gigApi.ts, httpClient.ts, marketplaceStore.ts) | ./ (creds.md)

## [2026-08-29T10:40:36.066Z] d47b101ec0fae1fa04dfaf3f276031202b5c232d
DEPS: 7202 insertions, 2190 deletions

FILES: ./ (.briefed.json) | .claude/ (settings.json) | apps/ (package.json, app.ts, index.ts, package.json, prisma.config.ts, migration.sql, schema.prisma, seed.ts, tsconfig.json, index.ts, env.ts, httpError.ts, jwt.ts, password.ts, authGuard.ts, clientOwnershipGuard.ts, errorHandler.ts, notFoundHandler.ts, roleGuard.ts, taskAccessGuard.ts, validate.ts, admin.controller.ts, admin.dto.ts, admin.route.ts, admin.service.ts, auth.controller.ts, auth.dto.ts, auth.route.ts, auth.service.ts, client.controller.ts, client.dto.ts, client.route.ts, client.service.ts, gig.controller.ts, gig.dto.ts, gig.route.ts, gig.serializer.ts, gig.service.ts, manager.controller.ts, manager.dto.ts, manager.route.ts, manager.serializer.ts, manager.service.ts, express.d.ts, tsconfig.json, AuthContext.tsx, ClientContext.tsx, ManagerLayout.tsx, Login.tsx, Signup.tsx, AddManager.tsx, AddManagerFlow.tsx, ClientDashboard.tsx, ClientProfileSelection.tsx, MyGigs.tsx, PostGig.tsx, ReviewDeliverables.tsx, ReviewShortlist.tsx, TotalSpent.tsx, ActiveTasks.tsx, CompletedProjects.tsx, ExploreTasks.tsx, GigDashboard.tsx, GigProfile.tsx, GigProfileCompletion.tsx, PendingRequests.tsx, PostService.tsx, ProjectDetail.tsx, SubmitDeliverables.tsx, TotalEarnings.tsx, AdminAnalytics.tsx, AdminManagement.tsx, AdminProfile.tsx, ClientManagement.tsx, Dashboard.tsx, DisputesReports.tsx, GigProfessionalManagement.tsx, ManagersManagement.tsx, PaymentsRevenue.tsx, PlatformSettings.tsx, Projects.tsx, Reviews.tsx, authApi.ts, gigApi.ts, httpClient.ts, managerApi.ts, adminApi.ts, index.ts, jwt.ts)
<!-- BRIEFED_END -->