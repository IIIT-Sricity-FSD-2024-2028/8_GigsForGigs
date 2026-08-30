# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GigsForGigs is a freelance/task marketplace with a React frontend and an Express + Prisma/PostgreSQL backend, organized as two independent apps under `apps/` (no npm workspaces — each has its own `package.json`/lockfile; the root `package.json` is not a workspace root, so always `cd` into the relevant app before running scripts).

**Current implementation state (important):** the frontend (`apps/frontend`) is fully built out with mock-backed data. The backend (`apps/backend`) is largely a scaffold — `app.ts` and `server.ts` are empty, and every module file (`modules/client/*`, `modules/gig/*`) is an empty stub. The only real backend work so far is the Prisma layer under `apps/backend/src/db/` (schema, one migration, generated client). Don't assume backend routes exist just because a frontend API client calls them.

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
npm run build      # tsc -b
npm run dev        # tsc -b && node dist/index.js
npm run start      # node dist/index.js
```
Note: `dev`/`start` reference `dist/index.js`, but the source has no `index.ts` yet — only empty `app.ts`/`server.ts`. Building/running will not produce a working server until those are implemented.

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
- **Auth is mocked.** `context/AuthContext/AuthContext.tsx` holds an in-memory `MOCK_USERS_DB` and fakes login/signup/session state client-side; there is no real JWT verification yet on the frontend side. `loginManager`/`logoutManager` do attempt a real call through `managerApi` first.
- **API client pattern (fetch-with-mock-fallback).** Files under `services/api/<role>/*Api.ts` (see `managerApi.ts`, `gigApi.ts`) each: attempt a real `fetch` against `API_BASE_URL = 'http://localhost:3000/api'` with a bearer token from `localStorage`, and on any failure/non-OK response silently fall back to an in-file mutable mock dataset (`mockProfile`, `mockTasks`, etc.), so the UI works standalone without a backend. New API client methods should follow this same try-fetch-then-fallback shape for consistency. `client` and `auth` and `super-admin` API folders currently only contain `.gitkeep` — no real client yet.
- Design tokens live in `theme/` (`colors.ts`, `spacing.ts`, `typography.ts`, `radius.ts`, `shadows.ts`) and global CSS in `styles/` (`variables.css`, `globals.css`, `reset.css`, `utilities.css`).

### Backend (`apps/backend/src/`)

- `modules/<domain>/` follows a `*.controller.ts` / `*.service.ts` / `*.route.ts` / `*.model.ts` split per domain (currently `client/` and `gig/`, both empty stubs to be filled in).
- `db/` is a self-contained sub-project with its own `package.json`, `tsconfig.json`, and `.env` (separate from the backend app's own `.env`). Prisma client is generated to `db/generated/prisma/` (not `node_modules/.prisma`) per `schema.prisma`'s `generator client { output = "../generated/prisma" }`.

### Data model (`apps/backend/src/db/prisma/schema.prisma`)

Core entities: `User` (role: `client` | `gig_professional` | `manager`; no separate super-admin DB role yet, unlike the frontend's `SUPER_ADMIN` user role) → one-to-one `Client`, `GigProfessionalProfile`, or `Manager`. `Client` owns `Task`s; `Manager` belongs to a `Client` and gets `GigManagerAssignment`s pairing a gig professional with a task. `Application`, `Deliverable`, `Payment`, and `Review` all key off `Task` + `GigProfessionalProfile`. Table names are explicitly mapped to upper-snake-case (`@@map`) and columns to snake_case (`@@map`/`@map`) for the actual PostgreSQL schema, while Prisma-side fields/models stay camelCase/PascalCase — keep using `@map`/`@@map` when extending the schema rather than renaming columns to match Prisma casing.

<!-- BRIEFED_START -->
## [2026-08-30T08:21:58.830Z] 79fb44c3766f51114e91b1b1333937be56b689fa
FILES: apps/ (package.json, app.ts, dbClient.ts, index.ts, inv.tmp.ts, package.json, prisma.config.ts, migration.sql, schema.prisma, seed.ts, admin.dto.ts, admin.service.ts, auth.controller.ts, auth.dto.ts, auth.route.ts, auth.service.ts, client.dto.ts, client.service.ts, gig.serializer.ts, manager.controller.ts, manager.dto.ts, manager.route.ts, manager.serializer.ts, manager.service.ts, payment.controller.ts, payment.dto.ts, payment.route.ts, payment.service.ts, payment.types.ts, App.tsx, api.ts, roles.ts, routes.ts, AuthContext.tsx, ClientContext.tsx, GigContext.tsx, PaymentContext.tsx, ClientLayout.tsx, GigLayout.tsx, ManagerLayout.tsx, adminMockData.ts, Login.tsx, ClientDashboard.tsx, MyGigs.tsx, PostGig.tsx, ReviewDeliverables.tsx, ReviewShortlist.tsx, SearchTalent.tsx, TotalSpent.tsx, client.css, ActiveTasks.tsx, CompletedProjects.tsx, GigDashboard.tsx, MyServices.tsx, PostService.tsx, SubmitDeliverables.tsx, TotalEarnings.tsx, ManagerDashboard.tsx, ReviewDeliverables.tsx, SearchTalent.tsx, AdminAnalytics.tsx, AdminManagement.tsx, ClientManagement.tsx, Dashboard.tsx, DisputesReports.tsx, GigProfessionalManagement.tsx, ManagersManagement.tsx, PaymentsRevenue.tsx, PlatformSettings.tsx, Projects.tsx, Reviews.tsx, gigApi.ts, httpClient.ts, marketplaceStore.ts) | ./ (creds.md)
DEPS: 3827 insertions, 3093 deletions

## [2026-08-29T10:40:36.066Z] d47b101ec0fae1fa04dfaf3f276031202b5c232d
DEPS: 7202 insertions, 2190 deletions

FILES: ./ (.briefed.json) | .claude/ (settings.json) | apps/ (package.json, app.ts, index.ts, package.json, prisma.config.ts, migration.sql, schema.prisma, seed.ts, tsconfig.json, index.ts, env.ts, httpError.ts, jwt.ts, password.ts, authGuard.ts, clientOwnershipGuard.ts, errorHandler.ts, notFoundHandler.ts, roleGuard.ts, taskAccessGuard.ts, validate.ts, admin.controller.ts, admin.dto.ts, admin.route.ts, admin.service.ts, auth.controller.ts, auth.dto.ts, auth.route.ts, auth.service.ts, client.controller.ts, client.dto.ts, client.route.ts, client.service.ts, gig.controller.ts, gig.dto.ts, gig.route.ts, gig.serializer.ts, gig.service.ts, manager.controller.ts, manager.dto.ts, manager.route.ts, manager.serializer.ts, manager.service.ts, express.d.ts, tsconfig.json, AuthContext.tsx, ClientContext.tsx, ManagerLayout.tsx, Login.tsx, Signup.tsx, AddManager.tsx, AddManagerFlow.tsx, ClientDashboard.tsx, ClientProfileSelection.tsx, MyGigs.tsx, PostGig.tsx, ReviewDeliverables.tsx, ReviewShortlist.tsx, TotalSpent.tsx, ActiveTasks.tsx, CompletedProjects.tsx, ExploreTasks.tsx, GigDashboard.tsx, GigProfile.tsx, GigProfileCompletion.tsx, PendingRequests.tsx, PostService.tsx, ProjectDetail.tsx, SubmitDeliverables.tsx, TotalEarnings.tsx, AdminAnalytics.tsx, AdminManagement.tsx, AdminProfile.tsx, ClientManagement.tsx, Dashboard.tsx, DisputesReports.tsx, GigProfessionalManagement.tsx, ManagersManagement.tsx, PaymentsRevenue.tsx, PlatformSettings.tsx, Projects.tsx, Reviews.tsx, authApi.ts, gigApi.ts, httpClient.ts, managerApi.ts, adminApi.ts, index.ts, jwt.ts)
<!-- BRIEFED_END -->