# GigsForGigs Workspace AI Instructions & Project Rules

This document governs AI coding agents (Antigravity, Cursor, Claude Code) working on the **GigsForGigs** repository. It contains system constants, ownership boundaries, coding rules, and dynamically updated project context maintained by **Briefed**.

---

## 🏗️ 1. Project Architecture & Stack

GigsForGigs is a comprehensive full-stack freelance & task marketplace being migrated from legacy NestJS + in-memory DB to:

*   **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS / CSS Variables (`apps/frontend/`)
*   **Backend:** Node.js + Express.js + TypeScript (`apps/backend/`)
*   **Database:** PostgreSQL + Prisma ORM (`apps/backend/src/db/prisma/`)
*   **Authentication & RBAC:** JWT + Role-based access control middleware

---

## 👥 2. Team Work Division & Critical Ownership Boundaries

| Team Member | Module Ownership | Frontend Scope | Backend Scope | DB Ownership |
|---|---|---|---|---|
| **Chaitanya** (Current User) | **Super Admin Vertical** | `pages/super-admin/` (12 pages) | `modules/admin/` | Admin queries, analytics, moderation models |
| **Jatin** | **PostgreSQL/Prisma & Manager** | `pages/manager/` | `modules/manager/` | **Centrally owns `schema.prisma` & migrations** |
| **Arham** | **Core Infrastructure & Auth** | Common Auth & Layouts | `modules/auth/`, Express config, RBAC | Auth models, tokens, RBAC middleware |
| **Aditya** | **Client Module** | `pages/client/` | `modules/client/` | Client profiles & task postings |
| **Shekhar** | **Gig Professional Module** | `pages/gig/` | `modules/gig/` | Gig profiles, services, deliverables |

### ⚠️ Strict Operational Rules:
1. **Prisma Centralization:** Never independently modify `schema.prisma` or create competing database instances. Jatin is the single owner of the database schema. Submit entity requirements to Jatin.
2. **Auth & RBAC Middleware:** Consume Arham's centralized `authenticateUser` and `requireRole(['SUPER_ADMIN'])` middlewares for admin routes.
3. **Module Isolation:** Do not edit modules belonging to other team members without explicit task context.
4. **Git Branching Strategy:** Work exclusively on `chaitanya/admin`. PRs merge into `development`, then into `main`.

---

## 🛡️ 3. Chaitanya's Super Admin Scope & Technical Specs

### Frontend (`apps/frontend/src/pages/super-admin/`):
1. **`Dashboard`**: High-level platform KPIs, live charts (tasks by status, users by role, revenue velocity), recent activity feeds.
2. **`AdminAnalytics`**: In-depth analytics, GMV vs. rake, user cohort retention, category metrics, CSV/JSON export.
3. **`AdminManagement`**: Multi-tier admin staff list, cryptographic invitation engine (`AdminInvitation`), granular permissions (`OWNER`, `FINANCIAL_ADMIN`, `SUPPORT_ADMIN`, `MODERATOR`, `AUDITOR`), session revocation, and structured audit logs.
4. **`AdminProfile`**: Admin personal profile, 2FA, session security.
5. **`ClientManagement`**: Client directory, KYC verification, spend metrics, suspend/ban controls.
6. **`GigProfessionalManagement`**: Freelancer directory, verified/top-rated badge approvals, portfolio review, suspension.
7. **`ManagersManagement`**: Manager directory, client-manager links visualizer, seat controls.
8. **`PaymentsRevenue`**: Financial ledger, escrow held/released/refunded, commission tracking.
9. **`Projects`**: Platform-wide task/project monitor, milestone inspection, emergency status overrides.
10. **`Reviews`**: Review moderation queue, profanity/spam flags, hide/approve feedback, rating recalculation.
11. **`DisputesReports`**: Arbitration court, dispute evidence inspector, 1-click settlement engine (refund/release/split).
12. **`PlatformSettings`**: Platform commission rake %, minimum budgets, category taxonomy, maintenance toggle.

### Backend (`apps/backend/src/modules/admin/`):
*   `admin.controller.ts`: Route handlers, status codes, input sanitization, rate limiting.
*   `admin.service.ts`: Business logic, single-pass Prisma aggregate queries, transaction handlers, optimistic concurrency control (OCC).
*   `admin.route.ts`: Express Router with multi-tier RBAC guards.
*   `admin.model.ts` / `admin.dto.ts`: TypeScript types, query filter schemas, pagination models, invitation tokens.

---

## ⚡ 4. Enterprise Scalability & Coding Standards

1. **Scalable Multi-Tier Provisioning**: The platform Owner / Super Admin can invite delegate admins via cryptographically signed time-limited invitation tokens (`AdminInvitation`) with granular permission bitmasks.
2. **Performance & Query Optimization**:
   - **Keyset / Cursor Pagination**: Avoid slow $O(N)$ `OFFSET` scans on large tables; use index-backed keyset cursors.
   - **Single-Pass Aggregations**: Compute KPI metrics using SQL filter clauses/CTEs instead of multiple sequential `findMany` queries.
   - **Hybrid Token Revocation**: Use `tokenVersion` to revoke compromised admin sessions in $< 1\text{ms}$ without querying the database on every HTTP call.
   - **Optimistic Concurrency Control (OCC)**: Guard dispute settlements and financial balance releases against race conditions.
   - **Streaming Exports**: Stream large CSV/JSON report exports via chunked HTTP encoding to prevent Node.js heap exhaustion.
3. **TypeScript Strictness**: Use explicit interfaces for all DTOs and API responses. Avoid `any`.
4. **Component Structure**: Keep React components modular. Place UI widgets in `components/super-admin/` (cards, tables, modals, forms).
5. **Error Handling**: Throw typed HTTP exceptions or return standardized JSON errors `{ success: false, message: string, error?: any }`.
6. **State Management**: Use React Query / TanStack Query or standard custom hooks for asynchronous API states (loading, error, data).
7. **Preserve Context**: Always keep documentation and inline explanations clear.
8. **Mandatory Post-Execution Pedagogical Explanations**: After writing or modifying code, the agent MUST always provide a comprehensive explanation of what was implemented and break down all fundamental, atomic web development concepts involved (e.g., `async`/`await` & Promise lifecycle, Express middleware chain & `next()`, React component lifecycle & memoization, JWT verification flow, RESTful status codes, relational DB constraints, etc.).
9. **Developer-Friendly Code, TSDoc Comments & Architectural Rationales**: All written code must be clean, modular, and easy for any teammate to understand and maintain. Use comprehensive inline comments and TSDoc/JSDoc annotations on all functions, interfaces, React components, and Express route handlers to explicitly document *what* the code does, *why* this specific approach was chosen, and how edge cases are mitigated.



---

## 🔄 5. Briefed Automated Context Synchronization

Briefed synchronizes commit summaries and structural diffs inside the block below. **Do not manually edit between the markers.**

<!-- BRIEFED_START -->
## [2026-08-26T08:50:28.981Z] 41027fea8ebc3f418dbb990254c9ec7a35f9699a (feat/client-frontend)
FILES: apps/ (App.tsx, index.ts, AuthContext.tsx, ClientContext.tsx, ManagerContext.tsx, index.ts, index.css, ClientLayout.tsx, ManagerLayout.tsx, main.tsx, Login.tsx, AddManager.tsx, AddManagerFlow.tsx, ClientDashboard.tsx, ClientProfileCompletion.tsx, ClientProfileSelection.tsx, MyGigs.tsx, PostGig.tsx, ReviewDeliverables.tsx, ReviewShortlist.tsx, SearchTalent.tsx, TotalSpent.tsx, client.css, ManagerDashboard.tsx, index.ts, ManagerProfile.tsx, index.ts, ManagerTasks.tsx, index.ts, ReviewDeliverables.tsx, index.ts, SearchTalent.tsx, index.ts, LandingPage.tsx, index.ts, managerApi.ts, index.ts) | ./ (package.json)
DEPS: 8092 insertions, 132 deletions

## [2026-08-25T10:02:51.037Z] bffc740dcf73c05e38146f5142d0d898fd4e0199 (made)
DEPS: 928 insertions, 7 deletions

FILES: apps/ (Avatar.tsx, index.ts, Badge.tsx, index.ts, Breadcrumb.tsx, index.ts, Button.tsx, Card.tsx, ConfirmDialog.tsx, Dropdown.tsx, index.ts, EmptyState.tsx, ErrorState.tsx, index.ts, IconButton.tsx, index.ts, Input.tsx, Loader.tsx, Modal.tsx, ProgressBar.tsx, index.ts, SearchBar.tsx, index.ts, Select.tsx, index.ts, Table.tsx, index.ts, Tabs.tsx, index.ts, TextArea.tsx, index.ts, BaseCard.tsx, index.ts, ProjectCard.tsx, index.ts, ServiceCard.tsx, index.ts, StatCard.tsx, index.ts, TaskCard.tsx, index.ts, UserCard.tsx, index.ts, DashboardHeader.tsx, index.ts, DashboardSection.tsx, index.ts, DashboardWelcome.tsx, index.ts, QuickAction.tsx, index.ts, SummaryCard.tsx, index.ts, SummaryGrid.tsx, index.ts, FormActions.tsx, index.ts, FormContainer.tsx, index.ts, FormError.tsx, index.ts, FormField.tsx, index.ts, FormLabel.tsx, index.ts, FormSection.tsx, index.ts, index.ts, LogoutButton.tsx, index.ts, MobileNavigation.tsx, index.ts, Navbar.tsx, index.ts, Sidebar.tsx, index.ts, SidebarItem.tsx, index.ts, UserProfile.tsx, index.ts, ProgressStatus.tsx, index.ts, StatusBadge.tsx, index.ts, StatusIndicator.tsx, index.ts, AuthLayout.tsx, index.ts, DashboardLayout.tsx, index.ts, PublicLayout.tsx, index.ts, globals.css, reset.css, utilities.css, variables.css, colors.ts, index.ts, radius.ts, shadows.ts, spacing.ts, typography.ts)
<!-- BRIEFED_END -->
