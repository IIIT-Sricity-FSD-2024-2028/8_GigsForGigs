# Redux Toolkit Migration Plan

## Goal

Move server-backed application data and CRUD actions into Redux Toolkit slices, using `createAsyncThunk` for every API operation. Pages read server-backed data with selectors and send changes with `dispatch`; a slice is updated with server results only after the request succeeds.

## Current project state

- Frontend: React 19, TypeScript, Vite, React Router 7.
- Redux Toolkit is not currently installed and there is no Redux store.
- `App.tsx` currently mounts `AuthProvider`; protected role routes mount `ClientProvider`, `ManagerProvider`, or `GigProvider`.
- Role data and async actions live in `AuthContext`, `ClientContext`, `ManagerContext`, and `GigContext`.
- API modules are under `apps/frontend/src/services/api/`: `authApi`, `clientApi`, `gigApi`, `managerApi`, and `adminApi`. They all use the shared `httpClient.ts`.
- Client payment/release calls currently use `apiFetch` inside `ClientContext`; they do not yet have a dedicated payment repository.
- Role pages call contexts, and some components make direct API calls. These must be migrated so components do not own server data or invoke repositories directly.
- `httpClient.ts` currently keeps tokens and the active user in `sessionStorage` and removes legacy `localStorage` values. The requested in-memory-only session requires removing browser storage reads/writes too.

## Assignment

| Teammate | Ownership | Main work |
|---|---|---|
| **Aditya** | Redux groundwork and authentication | Install/configure Redux Toolkit; create the store, typed hooks, provider integration, shared thunk conventions, in-memory token bridge, and `authSlice`; migrate login, signup, manager login/invite acceptance, logout, and session/role handling. Publish the interfaces other slices will use before parallel work begins. |
| **Shekhar** | Client repository and client portal | Create `clientSlice` mapped to `clientApi`; migrate client profile, tasks, applications, contracts, task deliverable definitions/submissions, service requests, manager roster/invites, and reviews. Replace `ClientContext` data/actions and migrate client pages to selectors and dispatch. |
| **Jatin** | Gig repository and gig portal | Create `gigSlice` mapped to `gigApi`; migrate marketplace/active/completed tasks, applications, deliverable submission and definitions, profile, services, service requests, earnings, and reviews. Replace `GigContext` data/actions and migrate gig pages. |
| **Arham** | Manager repository and manager portal | Create `managerSlice` mapped to `managerApi`; migrate manager profile, assigned/completed tasks, applications/shortlisting, deliverable definitions, submitted deliverables/reviews, and talent search. Replace `ManagerContext` data/actions and migrate manager pages. |
| **Chaitanya** | Admin and payment repositories | Create `adminSlice` mapped to `adminApi` for analytics, users/KYC, talent, managers, projects, admin staff/security, audit logs, reviews, disputes, settings, and admin payment oversight. Extract client funding/release calls into a `paymentApi` and create a `paymentSlice`; migrate admin pages and client payment controls with the relevant owner. |

### Repository-to-slice mapping

| API repository | Redux slice | Owner |
|---|---|---|
| `authApi` | `authSlice` | Aditya |
| `clientApi` | `clientSlice` | Shekhar |
| `gigApi` | `gigSlice` | Jatin |
| `managerApi` | `managerSlice` | Arham |
| `adminApi` | `adminSlice` | Chaitanya |
| New `paymentApi` (extracted from current inline/client and admin payment calls) | `paymentSlice` | Chaitanya |

Shared `httpClient.ts` is transport infrastructure, not a feature repository or slice. Keep API request/response types in the repository/type modules and import them into the matching slice.

## Pulled changes to preserve

The latest pulled commits update the working baseline but do not add Redux. Start from the current branch tip and keep these behaviors intact during migration:

- **Manager deliverables workflow:** managers can manage deliverables/subtasks from their task flow. The manager task list separates active and completed tasks; retain both sections and the current review/close behavior.
- **Client task assignment:** the current client action identifies the exact hired gig profile as well as the manager: `assignTaskManager(taskId, gigProfileId, managerId)`. Preserve this three-part association in the thunk/API request so assigning a manager does not affect another gig on the same task.
- **Admin analytics:** the latest change replaced the rake velocity graph with a simpler chart. Keep that chart and migrate its data loading to selectors; don?t restore the old graph during the Redux conversion.
- **Client profile editing:** a recent fix addressed repeated rerenders while typing. Keep form drafts local until save and avoid writing every keystroke into server-backed Redux state.
- **Gig deliverable submission:** `SubmitDeliverables` loads active tasks, then the definitions for the selected task. Preserve task-specific loading and checkbox submission behavior; do not show one task?s definitions for another task.
- **New profile views:** clients can open an applicant profile from shortlist review, and gig professionals can open a task poster's client profile from task/application views. These are server-backed, permission-scoped views; load them through Redux thunks and selectors, retaining the backend?s contact-visibility rules. Do not leave the new `ApplicantProfileModal` or `ClientProfileView` fetching through `useApiResource` after migration.
- **End-hire and withdrawal workflows:** clients can end an individual hire (`taskId` + `gigProfileId`) and gig professionals can withdraw from a task. Keep these as explicit thunks, preserve the server's history/cancellation behavior, and only update task/application state after server success.
- **Manager workload detail:** the client's manager profile view now shows workload/assigned-task information. Include those assigned-task details in the manager/client repository state as appropriate, and ensure the profile view is selector-driven rather than adding another page-local fetch.
- **Admin dashboard/table polish:** CSV export was added to shared admin tables and recent activity to the dashboard. Preserve both while moving the underlying rows/activity into the appropriate admin selectors; CSV formatting itself can remain a pure UI utility.

## Detailed work for each teammate

The lists below name concrete flows to migrate. File names are starting points; search for every consumer before deleting a context or changing a shared component. API repositories remain the only layer that performs HTTP requests. Each owner should convert any context-only endpoint into a typed repository method before writing its thunk.

### Aditya ? foundation and authentication

1. Install `@reduxjs/toolkit` and `react-redux` in `apps/frontend`; create `src/store/store.ts` and typed hooks in `src/store/hooks.ts`.
2. Register `auth`, `client`, `gig`, `manager`, `admin`, and `payment` reducers from the start (placeholder reducers are fine until their owners merge). Mount one Redux `<Provider>` above the router in `src/App.tsx`.
3. Define a shared slice convention: each slice has a typed state, request status/error, `createAsyncThunk` actions, and `extraReducers` for pending/fulfilled/rejected. Use `rejectWithValue` with the existing `ApiError` message. Keep server entities unchanged until fulfilled.
4. Implement `authSlice` against `authApi`: signup, client/gig login, manager login, manager invite details/acceptance, and logout. Preserve role-specific route guards and error messages. Authentication and invitation acceptance must set the in-memory actor/token consistently.
5. Refactor `src/services/api/httpClient.ts` so the active role token is supplied through an injected in-memory token getter (or an equivalent non-circular bridge). Remove all `sessionStorage` and `localStorage` session persistence. Wire unauthorized responses to a store-safe callback that clears auth and role slices without importing the store into the HTTP module.
6. Migrate `AuthContext` consumers and auth pages to selectors and dispatch. Remove `AuthProvider` only after the last consumer is migrated.
7. Publish the actual store types, slice key names, error shape, token bridge contract, and branch/rebase point to the team before feature slices begin.

**Deliverable:** store/provider/hooks, auth slice, HTTP token bridge, and a short shared contract that all four feature owners can compile against.

### Shekhar ? client portal and `clientSlice`

1. Map `clientApi` methods into thunks for client profile read/update; task read/create/update/delete; applications read/review; applicant profile lookup keyed by application ID; contracts; task deliverables and definition CRUD/review; services and service requests; manager list/update/delete, workload/assigned-task detail, and invite list/create/revoke; end-hire by task and gig-profile ID; and reviews.
2. Move the remaining client-only requests now embedded in `ClientContext` into `clientApi` before using them in thunks: task list/mutations, manager invites and roster operations, deliverable reads/review, application decisions, service requests, and manager assignment. Keep request/response types in the repository/type modules.
3. Preserve manager assignment as a thunk with `{ taskId, gigProfileId, managerId }`. On success, update the matching task/gig assignment from the backend response or refetch the affected task; don?t update all assignments for that task optimistically.
4. Migrate client dashboard, task posting/editing, applications/shortlist and applicant profile modal, active/completed projects and end-hire flow, deliverable review, manager selection/profile/workload/assigned tasks/invites, service requests, profile, spending, and reviews to `useAppSelector` and `dispatch`. Server-backed displayed lists and counts must come from selectors.
5. Keep client profile and task form drafts in component state while editing. Dispatch the save thunk on submit; use the fulfilled server response to refresh Redux data. This preserves the pulled profile typing/rerender fix.
6. Coordinate `TaskDeliverablesManager` with Arham: provide a presentation-only component API (definitions, deliverables, busy/error state, and callbacks as props), while each role page gets data and dispatches its own slice thunks.
7. Leave pay/release operations to Chaitanya?s `paymentSlice`; replace the client UI handlers with dispatches to those thunks and coordinate the selector shape.

**Starting points:** `src/context/ClientContext/ClientContext.tsx`, `src/services/api/client/clientApi.ts`, `src/components/client/sections/TaskDeliverablesManager/TaskDeliverablesManager.tsx`, and all `src/pages/client/**` pages.

### Jatin ? gig portal and `gigSlice`

1. Create thunks for active tasks, task deliverable definitions, pending service/task requests, completed projects, earnings, marketplace tasks, apply, my applications/withdraw (including task-level withdrawal), request response, task poster client-profile lookup, profile read/update, own services/list/create/delete, service requests, deliverable submission, and reviews.
2. Compare `gigApi` with direct calls in gig pages and the current context. Add missing repository methods rather than leaving HTTP calls in components. Keep each response typed and role-specific.
3. Migrate Gig dashboard, active/completed task sections, marketplace/explore, project details and client profile view, applied tasks, submit deliverables, service requests, own services/post service, earnings, and profile pages. Remove direct page-level API calls and use selectors/thunks for all backend data.
4. In `SubmitDeliverables`, select the task by route/selection ID from Redux, dispatch the definitions thunk for that exact task, and track request status by task ID so a slow previous request cannot replace current details. Preserve checkbox selection as unsaved form state; after submit, use the server response to update submitted deliverables.
5. Ensure create/update/delete lists change only when the thunk is fulfilled. Handle withdraw/delete and client end-hire by applying server-confirmed state (including cancelled task status where returned); handle apply/post by inserting the returned entity or refetching the relevant list. Retain ended-hire history rather than treating the operation as a hard delete.
6. Remove `GigProvider` and `GigContext` only after all gig pages/components are migrated.

**Starting points:** `src/context/GigContext/GigContext.tsx`, `src/services/api/gig/gigApi.ts`, and all `src/pages/gig/**` pages, especially `SubmitDeliverables` and service posting.

### Arham ? manager portal and `managerSlice`

1. Create thunks for manager profile read/update; assigned task list and task detail; task deliverables and applications; shortlist; task deliverable definition read/create/update/delete; individual deliverable read/review/close; and talent search.
2. Migrate manager dashboard, active/completed task list, task detail, application/shortlist, deliverable management/review, talent search, and manager profile to selectors and dispatch. Use route task IDs for detail thunks and clear only the selected detail when leaving a task, not the full manager task cache.
3. Preserve the pulled manager workflow: active and completed tasks remain distinct, subtask/deliverable creation stays available for active tasks, review/close uses the current manager endpoints, and managers receive no payment actions.
4. Coordinate the shared deliverables component with Shekhar. Make it presentational and role-agnostic; manager page containers use `managerSlice` selectors/thunks, client containers use `clientSlice` selectors/thunks.
5. Track loading/errors by task or deliverable where requests can overlap. A late response for task A must not overwrite the selected details for task B.
6. Remove `ManagerProvider`/`ManagerContext` after no manager route imports them.

**Starting points:** `src/context/ManagerContext/ManagerContext.tsx`, `src/services/api/manager/managerApi.ts`, `src/pages/manager/ManagerTasks/ManagerTasks.tsx`, manager review pages, and the shared `TaskDeliverablesManager`.

### Chaitanya ? admin portal and payment flow

1. Build `adminSlice` thunks for KPIs/analytics; users, clients/KYC, gig pros/badges, managers, projects/status override, payment ledger/escrow override, reviews/moderation, disputes/settlement, admin staff/invitations/session revoke, audit logs, platform settings, and admin profile/password/2FA.
2. Migrate every super-admin page to selectors and dispatch, including the simplified current analytics chart, dashboard recent activity, and table data used by CSV export. Keep CSV generation as a pure utility over selected rows. Keep sensitive actions (KYC, badge, status override, escrow, dispute settlement, moderation, staff/security changes) as explicit thunks with their existing payloads and audit reason fields where required.
3. Extract client `/payments/pay` and `/payments/release` calls currently inside `ClientContext` into a typed `paymentApi`, then create `paymentSlice` thunks. Preserve actor `client` for client funding/release requests and `admin` for ledger/escrow override operations; do not merge authorization semantics just because both concern payments.
4. Coordinate with Shekhar to migrate the client payment controls to `paymentSlice`; Chaitanya owns the repository/slice and Shekhar owns the client page integration unless the team agrees otherwise. Payment state should update from the successful backend response, then update/refetch affected client task/payment and admin ledger data as appropriate.
5. Coordinate admin invitation acceptance with Aditya because accepting an invite creates an authenticated admin session; the admin invitation management list/actions remain in `adminSlice`, while session establishment belongs in `authSlice`.
6. Remove direct `apiFetch` and `adminApi` calls from admin page components. Keep repository calls inside thunks only.

**Starting points:** `src/services/api/admin/adminApi.ts`, `src/pages/super-admin/**`, client payment handlers in `src/context/ClientContext/ClientContext.tsx`, and the shared `httpClient.ts` actor handling.

### Additional endpoints and state introduced by the pull

Before estimating slice work, account for the newly pulled data and workflows:

- Client APIs now include applicant profile lookup and client hire termination; gig APIs include the task poster's client profile and task withdrawal. Keep IDs in thunk arguments (`applicationId`, `taskId`, `gigProfileId`) and key detail state by ID to prevent profile/task cross-contamination.
- Profile visibility is enforced by backend services. Redux should cache only the response returned for the current authorized view; do not infer or expose private contact fields on the client.
- Ending a hire is not a normal delete. Preserve the backend?s transactional behavior and cancelled/history state, and refresh the task/contracts after success if the endpoint does not return the updated entities.
- The pulled `useApiResource` hook is a transitional fetch helper for profile pages. Redux migration should replace those calls with slice thunks; do not build new Redux-backed pages on top of page-local remote data hooks.
- Manager workload/assigned-task counts and task assignment detail should remain associated with the specific manager and gig/task IDs. CSV export may consume selected admin data but should not create a separate server-state copy.

## Shared integration contract

- **Sequence:** Aditya lands the store, Provider, hooks, and auth/token contract first. Feature owners branch/rebase from that commit and merge slices incrementally.
- **Repository boundary:** repository modules perform HTTP and define DTO/response types; thunks call repositories; components dispatch thunks and select state. No component/context calls `apiFetch` or a repository directly after migration.
- **Cross-slice workflows:** client task assignment belongs to `clientSlice`; funding/release belongs to `paymentSlice`; admin escrow ledger/override belongs to `adminSlice` (or a clearly defined admin operation in `paymentSlice` only if agreed before implementation). Avoid duplicate ownership of the same thunk.
- **Shared deliverables UI:** Shekhar and Arham jointly agree props and callbacks before editing the shared component. Keep role-specific authorization and API logic in the respective slices.
- **Remove contexts last:** contexts may temporarily adapt selector/thunk behavior while pages migrate, but each context should be deleted only after `rg` finds no remaining imports.
- **CRUD count:** implement create/read/update/delete for each repository resource where supported by existing endpoints. A repository may have multiple resources, so ?repository ? 4? means CRUD coverage for each resource that exposes those operations, not exactly four actions total. Workflow operations such as approve, shortlist, submit, invite acceptance, pay, release, and revoke stay as named thunks.

## Order of work

### 1. Aditya sets the groundwork first

Do this before feature branches start slice work:

1. Install `@reduxjs/toolkit` and `react-redux` in `apps/frontend`.
2. Add `apps/frontend/src/store/store.ts` with `configureStore` and placeholder reducers for the agreed slices.
3. Add typed `RootState`, `AppDispatch`, `useAppDispatch`, and `useAppSelector`.
4. Mount `<Provider store={store}>` in `App.tsx` so all role routes share the same store.
5. Define shared conventions: slice naming, normalized entity IDs where useful, `status`/`error` state, `createAsyncThunk` naming, reject-value error handling, and reset-on-logout behavior.
6. Refactor `httpClient.ts` to read the current role token from the in-memory Redux auth state through an injected token selector/provider. Avoid importing the store into `httpClient.ts`, which would create a circular dependency.
7. Implement `authSlice` and migrate `AuthContext`/auth pages. Keep the user session and tokens in Redux memory only; remove `sessionStorage` and `localStorage` persistence.
8. Publish the store interface and thunk/API conventions. Other owners branch from or rebase onto this foundation before implementing slices.

### 2. Feature owners migrate one repository at a time

For each owner:

1. Create the slice matching the repository in the table above.
2. Create async thunks for the repository’s supported reads and writes.
3. Use `extraReducers` to handle `pending`, `fulfilled`, and `rejected` states.
4. In `fulfilled`, use the response returned by the backend as the source of truth. Do not optimistically add/update/delete server data before success.
5. Replace role-context reads in owned pages with `useAppSelector`; replace context/API actions with `dispatch(thunk(...))`.
6. Remove duplicated server state and API calls from the role context/components once their consumers are migrated.
7. Coordinate any shared component touched by more than one role with its current owner before changing it.

### 3. Integrate and remove old providers

After all slice owners merge:

1. Remove `ClientProvider`, `ManagerProvider`, and `GigProvider` from `ProtectedRole` after no page depends on their contexts.
2. Remove `AuthProvider` after auth/session consumers use `authSlice`.
3. Confirm every screen that displays backend data selects that data from Redux.
4. Ensure every write waits for the thunk/API success before the displayed data changes.

## CRUD and thunk rules

- The target is **four CRUD operation categories per repository**: Create, Read, Update, Delete, when the backend exposes that operation.
- Do not invent endpoints or pretend action-specific endpoints are generic CRUD. For example, shortlist, approve/reject, release/refund, submit, and invite acceptance remain explicit thunks that call their existing API methods.
- A read thunk stores the server response on `fulfilled`.
- Create/update thunks insert or replace entities from the server response on `fulfilled`.
- Delete thunks remove an entity from Redux only on `fulfilled`.
- A rejected request keeps the last known good data and records an actionable error in the relevant slice.
- Components dispatch thunks and render selected Redux data. Components must not call `clientApi`, `gigApi`, `managerApi`, `adminApi`, `paymentApi`, or `apiFetch` directly.
- Form input drafts may remain local to a form while unsaved. Persisted/domain data, request status/errors, selected server entities, and CRUD side effects belong in Redux. Avoid moving purely visual toggles into Redux unless they are shared across routes.

## State lifetime and navigation

Do **not** clear the whole Redux store whenever a component or route changes. The store is shared across the role portal, so clearing on navigation would cause refetches and make state disappear when switching between related pages.

- Keep role data available while the same authenticated role session is active.
- Clear auth and role-owned data on logout, 401/session invalidation, or account/role switch.
- Reset a page-specific selection/detail state when leaving that feature if retaining it would reopen stale detail (for example, selected task ID), without clearing the slice’s general task cache.
- Loading and error flags should be request-scoped where concurrent requests are possible; one request must not clear another request’s loading state.
- Redux state is in-memory only. Refreshing or closing the tab ends the session and requires login again; there is no browser storage rehydration under the no-storage requirement.

## Suggested folder shape

```text
apps/frontend/src/
  store/
    store.ts
    hooks.ts
    auth/authSlice.ts
    client/clientSlice.ts
    gig/gigSlice.ts
    manager/managerSlice.ts
    admin/adminSlice.ts
    payment/paymentSlice.ts
  services/api/
    auth/authApi.ts
    client/clientApi.ts
    gig/gigApi.ts
    manager/managerApi.ts
    admin/adminApi.ts
    payment/paymentApi.ts
```

Slice folders may add `types.ts` or `selectors.ts` when the slice grows. Keep API transport and Redux state logic separate.

## Acceptance checklist

- [ ] A configured Redux store and typed hooks are mounted above the route tree.
- [ ] Each API repository has exactly one corresponding slice; payment calls have been extracted into `paymentApi` before `paymentSlice` is added.
- [ ] Async requests use `createAsyncThunk` and existing API modules; components do not call APIs directly.
- [ ] All server-backed displays read from selectors.
- [ ] Create/update/delete UI state changes only after fulfilled server responses.
- [ ] Loading/error states are represented in slices and visible to the owning screens.
- [ ] No auth token or session is read from or written to `localStorage` or `sessionStorage`.
- [ ] Logout, unauthorized responses, and role changes clear auth and role data.
- [ ] Route navigation does not clear unrelated role data.
- [ ] No page still depends on the role contexts before those providers are removed.
- [ ] Frontend build and lint complete after integration.
