# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GigsForGigs is a freelance/task marketplace with a React frontend and an Express + Prisma/PostgreSQL backend, organized as two independent apps under `apps/` (no npm workspaces — each has its own `package.json`/lockfile; the root `package.json` is not a workspace root, so always `cd` into the relevant app before running scripts).

**Current implementation state (important, updated 2026-09-02):** the frontend (`apps/frontend`) is fully built out and every role calls the real backend with no mock/local-data fallback left anywhere — an earlier pass had `marketplaceStore.ts` and in-file mock objects as fallbacks for gig/manager/client calls, but those are gone; a failed API call now surfaces a real error (`ApiError`/`err.message`) instead of silently substituting fake data. The backend (`apps/backend`) is fully implemented, not a scaffold: `app.ts`/`index.ts`/`server.ts` wire up a real Express app, and every module (`auth`, `admin`, `client`, `manager`, `gig`, `payment`) has real `*.controller.ts`/`*.service.ts`/`*.route.ts` code mounted in `app.ts`. The backend listens on the port in `apps/backend/.env` (`PORT=3000`) — **all frontend API base URLs must match this**; `httpClient.ts` and `services/api/admin/adminApi.ts` hardcoded `:5000` (a stale value from `server.ts`'s in-code default `process.env.PORT || 5000`) until 2026-09-02, silently breaking every real call — fixed, but if a role's calls mysteriously all fail, check this first. Per-role status:
  - **Login always tries the real backend, no fallback.** `AuthContext.tsx`'s `login()`/`signup()` call `authApi` against `/api/auth/*` for every role; on failure they set `authError` and return `false` — there is no mock-session fallback. Tokens are stored per-actor via `httpClient.ts`'s `setToken`/`TOKEN_KEYS` (`g4g_client_token`, `g4g_manager_token`, `g4g_gig_token`, `g4g_admin_token`) — don't assume a role's token is missing without checking that map first.
  - **CLIENT**: wired directly in `context/ClientContext/ClientContext.tsx` (not a separate `services/api/client/*Api.ts` file — that folder is still `.gitkeep`) via `apiFetch` with `actor: 'client'`, hitting `clientRouter`'s real routes (`/tasks`, `/applications`, `/contracts`, `/services`, `/requests`, `/manager-invites`) plus `managerRouter`'s client-facing `/managers` roster endpoints. Failures set `error` state; nothing falls back to local data.
  - **GIG_PROFESSIONAL**: `gigApi.ts` calls the fully-implemented `gigRouter` (`/api/gig/*`) with no fallback — its file header claim of "no mock fallback" is now accurate.
  - **MANAGER**: `managerApi.ts` calls the fully-implemented `managerRouter` (`/api/managers/me`, tasks, applications, deliverables, `gig/professionals`) with no fallback.
  - **SUPER_ADMIN**: one client, `services/api/admin/adminApi.ts`, used by every super-admin page; all of its routes exist and are guarded (`authGuard`, `roleGuard("admin")`) in `admin.route.ts`. However **six of them are backend no-ops**: `verifyClientKYC`, `updateGigProBadge`, `updateUserStatus`, `revokeAdminSession`, `moderateReview`, `updateProfilePassword`/`toggleProfile2FA` in `admin.service.ts` only write a `recordAuditLog` line and return `{success: true}` — there is no `kycStatus`/`badge`/`status` column, session table, or moderation column in `schema.prisma` to actually persist to. Treat these as a known, documented gap (see comments in `AdminProfile.tsx` and `types/super-admin/index.ts`), not a bug to silently "fix" — closing it means a Prisma migration against the live Aiven Postgres DB, which needs explicit sign-off before touching.
  - **Payment**: `PaymentContext.tsx` calls the real `payment.route.ts` (`/api/payments/initiate`, `/task/:taskId`, `/release`), which is guarded (`authGuard`, `roleGuard("client")`) and persists via `PaymentService.persistPayment`/`releasePaymentInDb` (Prisma `upsert`/`transaction`). `initiatePayment`/`approveAndReleasePayment` now throw on a failed backend call instead of updating local state as if it succeeded. Note the DB's `PaymentStatus` enum only has `pending`/`completed`/`failed` — the richer client-side escrow states (`ESCROWED`, `WORK_SUBMITTED`, `AWAITING_APPROVAL`, `DISPUTED`, etc.) in `EscrowPaymentStatus` are UI-only workflow steps between initiate and release, not persisted; that's an intentional scope gap in the schema, not a mock-data bug.

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
- **Auth tries the real backend, no fallback.** `context/AuthContext/AuthContext.tsx`'s `login()`/`signup()` call `authApi` against `/api/auth/*` for every role; on failure they surface `authError` and return `false` — a comment in `authApi.ts` explains why there's deliberately no mock fallback (it "would let the UI log in a user who was never authenticated by the server"). `loginManager`/`logoutManager` go through `managerApi`/`authApi.managerLogin`.
- **Every API client is a thin, no-fallback wrapper over `apiFetch` — a failed call throws `ApiError` and the caller sets `error` state.** `gigApi.ts`, `managerApi.ts`, `clientApi.ts`, and `ClientContext.tsx` (no separate `services/api/client/*Api.ts` file for most of client's surface; `apiFetch` is called directly with `actor: 'client'`) all follow this shape — none of them substitute local/mock data on failure. `services/api/admin/adminApi.ts` is the one client every super-admin page imports; its routes all exist and are guarded server-side, though six of them are backend no-ops that don't persist (see the state note above) — that's a real-but-documented gap, not a frontend fallback. When adding a new API client method, match this no-fallback pattern and verify the target path actually exists in the corresponding `*.route.ts` before wiring to it.
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