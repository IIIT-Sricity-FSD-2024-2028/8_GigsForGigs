# Gig Professional — End-to-End Workflow

> Complete lifecycle of a Gig Professional on the **GigsForGigs** platform, from registration to earnings.

---

## Table of Contents

1. [Actor Overview](#1-actor-overview)
2. [Registration & Onboarding](#2-registration--onboarding)
3. [Profile Completion](#3-profile-completion)
4. [Dashboard](#4-dashboard)
5. [Exploring & Applying to Tasks](#5-exploring--applying-to-tasks)
6. [Pending Requests (Accept / Decline)](#6-pending-requests-accept--decline)
7. [Active Tasks & Project Execution](#7-active-tasks--project-execution)
8. [Submitting Deliverables](#8-submitting-deliverables)
9. [Revision Cycle](#9-revision-cycle)
10. [Task Completion & Payment](#10-task-completion--payment)
11. [Posting a Service](#11-posting-a-service)
12. [Profile Management](#12-profile-management)
13. [Reviews & Reputation](#13-reviews--reputation)
14. [Completed Projects & Earnings](#14-completed-projects--earnings)
15. [CRUD Summary](#15-crud-summary)
16. [Database Tables Involved](#16-database-tables-involved)
17. [Backend API Endpoints](#17-backend-api-endpoints)
18. [Frontend Pages & Modules](#18-frontend-pages--modules)
19. [Visual Workflow Diagram](#19-visual-workflow-diagram)

---

## 1. Actor Overview

A **Gig Professional** is a skilled individual (student or working professional) who offers specialized services and completes outcome-driven micro-gigs posted by clients.

### Responsibilities

| # | Responsibility |
|---|----------------|
| 1 | Create a professional profile with bio, skills, tools, and portfolio |
| 2 | Browse and apply to open task opportunities |
| 3 | Accept or decline service/hire requests from clients |
| 4 | Execute assigned tasks within deadline |
| 5 | Submit deliverables for client review |
| 6 | Handle revision requests if deliverables need rework |
| 7 | Post services they offer (e.g., "I will build a landing page") |
| 8 | Build a portfolio through completed tasks |
| 9 | Review clients after task completion |
| 10 | Earn payments upon deliverable approval |

---

## 2. Registration & Onboarding

### Trigger
New user visits the platform landing page and clicks **"Join"**.

### Steps

1. Navigate to **Signup Page** (`signup.html`)
2. Select role: **Gig Professional** from the dropdown
3. Enter details:
   - Full Name
   - Email Address
   - Password
4. Click **"Create Account"**
5. System creates a new user record with:
   - `role: 'gig_professional'`
   - `isFirstTimeUser: true`
6. User is redirected to **Profile Completion** page

### Data Flow

```
User Input → POST /auth/register → USERS table (role = 'gig_professional')
                                  → GIG_PROFESSIONAL_PROFILE table (bio = null)
```

### Test Credentials (Existing Mock User)

| Field    | Value              |
|----------|--------------------|
| Email    | `john@gigpro.com`  |
| Password | `password3`        |

---

## 3. Profile Completion

### Trigger
First-time user redirected after signup; or returning user with incomplete profile.

### Page
`profile-completion-gig.html`

### Steps

1. Fill in profile details:
   - **Bio** — Short professional summary
   - **Skills** — List of skills (e.g., UI/UX Design, React, Figma)
   - **Tools** — Software/tools proficiency
   - **Portfolio URLs** — Links to past work samples
2. Click **"Continue"**
3. System updates:
   - `isFirstTimeUser` → `false`
   - Profile data saved to localStorage and user record
4. Redirect to **Gig Dashboard**

### Database Tables

| Table | Data Stored |
|-------|-------------|
| `GIG_PROFESSIONAL_PROFILE` | `gig_profile_id`, `user_id`, `bio` |
| `PROFILE_SKILLS` | `(gig_profile_id, skill)` — one row per skill |
| `PROFILE_TOOLS` | `(gig_profile_id, tool)` — one row per tool |
| `PROFILE_PORTFOLIO` | `(gig_profile_id, url)` — one row per portfolio link |

---

## 4. Dashboard

### Page
`gig-dashboard.html`

### Key Metrics Displayed

| Metric | First-Time User | Existing User (John) |
|--------|-----------------|----------------------|
| Completed Tasks | 0 | 12 |
| Total Earnings | $0 | $15,840 |
| Average Rating | 0 | 4.8 (24 ratings) |

### Sidebar Navigation

| Menu Item | Page | Purpose |
|-----------|------|---------|
| Dashboard | `gig-dashboard.html` | Overview metrics |
| Explore Tasks | `explore-tasks.html` | Browse open gigs |
| Active Tasks | `active-tasks.html` | Track assigned work |
| Pending Requests | `pending-requests.html` | Accept/decline invitations |
| Post a Service | `post-service.html` | Offer services |
| Profile | `gig-profile.html` | View/edit profile |
| Completed Projects | `completed-projects.html` | Past work history |
| Total Earnings | `total-earnings.html` | Earnings breakdown |

### Logic
- Function: `initGigDashboard()` in `dashboard.js`
- Data: `getGigDashboardSummary(gigId)` from `gigState.js`
- Computes active tasks, completed tasks, pending requests, and total earnings from the gig workflow state

---

## 5. Exploring & Applying to Tasks

### Page
`explore-tasks.html`

### Trigger
Gig professional clicks **"Explore Tasks"** in sidebar.

### Steps

1. System renders all tasks with `status: 'open'` as cards
2. Each card shows: Title, Category, Budget, Duration, Skills Required, Client Info
3. Gig professional can:
   - **Search** tasks by keyword
   - **Filter** by category, budget range, duration
   - **Paginate** through results

#### Applying to a Task (CREATE Application)

4. Click **"Apply"** button on a task card
5. System creates a new application:
   ```
   applications[] ← {
     id: generated,
     taskId: task.id,
     gigId: currentUser.id,
     status: 'pending',
     createdAt: now
   }
   ```
6. Button changes to **"Withdraw ✕"**
7. UI re-renders instantly (no page reload)

#### Withdrawing an Application (DELETE Application)

8. Click **"Withdraw ✕"** on a previously applied task
9. Application removed from `applications[]` array
10. Button changes back to **"Apply"**
11. UI re-renders instantly

### Data Flow

```
Apply:    Gig clicks "Apply" → applications[] += new record → Button → "Withdraw ✕"
Withdraw: Gig clicks "Withdraw ✕" → applications[] -= record → Button → "Apply"
```

---

## 6. Pending Requests (Accept / Decline)

### Page
`pending-requests.html`

### Trigger
Client shortlists or hires the gig professional for a task; or client sends a hire request from a posted service.

### What the Gig Professional Sees

- Task/Service title and description
- Client name
- Budget offered
- Deadline
- Request status (pending)

### Actions

#### Accept Request
1. Click **"Accept"** button
2. System updates:
   - Request status → `accepted`
   - Task status → `in_progress`
   - Task assigned to gig professional (`task.assignedTo = gigId`)
   - All other pending applications for the same task → `rejected`
3. Task appears in **Active Tasks**
4. Function: `acceptGigRequest(gigId, requestId)` in `gigState.js`

#### Decline Request
1. Click **"Decline"** button
2. System updates:
   - Request status → `declined`
   - Matching application status → `rejected`
3. Function: `declineGigRequest(gigId, requestId)` in `gigState.js`

### Data Flow

```
Client shortlists → Pending Request created for Gig
  ├── Gig clicks "Accept" → task.status = 'in_progress', task.assignedTo = gigId
  └── Gig clicks "Decline" → application.status = 'rejected'
```

---

## 7. Active Tasks & Project Execution

### Page
`active-tasks.html`

### Trigger
Gig professional has accepted a request or been hired by a client.

### What is Displayed

- Task title, description, client name
- Budget and deadline
- Progress bar (auto-inferred from time elapsed)
- Status: `active` or `completed`
- Action button: **"Submit Draft"** (to submit deliverables)

### Task Status Lifecycle (from Gig's perspective)

```
pending (request) → accepted → active (task) → under_review → completed
```

### Project Detail Page
`project-detail.html`

Shows full context of a specific task:
- Task description, budget, deadline
- Client information
- Current status and progress
- **"Submit Deliverable"** button (if `task.status === 'in_progress'` and `task.assignedTo === gigId`)

---

## 8. Submitting Deliverables

### Page
`project-detail.html` or `submit-deliverables.html`

### Trigger
Gig professional completes work and is ready to submit.

### Preconditions
- Task is assigned to this gig professional
- Task status is `in_progress`

### Steps

1. Navigate to the active task
2. Click **"Submit Deliverable"** / **"Submit Draft"**
3. System creates a deliverable record:
   ```
   deliverables[] ← {
     id: generated,
     taskId: task.id,
     gigId: currentUser.id,
     description: "Deliverable description",
     files: [...],
     status: 'submitted',
     createdAt: now
   }
   ```
4. Task status changes: `in_progress` → `under_review`
5. Redirect to **Active Tasks** or **Submission Success** page (`submission-success.html`)
6. Deliverable now appears in client's **Review Deliverables** page

### Database Table

| Column | Value |
|--------|-------|
| `task_id` | FK to TASKS |
| `deliverable_no` | Auto-incremented within the task |
| `gig_profile_id` | FK to GIG_PROFESSIONAL_PROFILE |
| `description` | Deliverable description |
| `submission_path` | File/link path |
| `status` | `submitted` |

---

## 9. Revision Cycle

### Trigger
Client reviews the deliverable and clicks **"Request Revision"**.

### What Happens

1. Deliverable status: `submitted` → `revision_requested`
2. Revision note/feedback is attached
3. Task status reverts to `in_progress`
4. Gig professional sees the task back in **Active Tasks**
5. Gig professional reworks and **re-submits** a new deliverable
6. Cycle repeats until client approves

### Flow

```
Submit → Client Reviews → Approved? 
  ├── YES → Payment Released, Task Completed
  └── NO  → Revision Requested → Gig Reworks → Re-Submit → Client Reviews again
```

---

## 10. Task Completion & Payment

### Trigger
Client clicks **"Approve & Release Payment"** on the deliverable.

### What Happens

1. Deliverable status: `submitted` → `approved`
2. Payment released: `true`
3. Task status: `under_review` → `completed`
4. Gig professional's stats update:
   - Completed Tasks count +1
   - Total Earnings += task budget
5. Task moves to **Completed Projects** page
6. Both parties prompted to leave reviews

### Payment Database Record

| Column | Value |
|--------|-------|
| `task_id` | FK to TASKS |
| `gig_profile_id` | FK to GIG_PROFESSIONAL_PROFILE |
| `amount` | Task budget |
| `status` | `completed` |

---

## 11. Posting a Service

### Page
`post-service.html`

### Trigger
Gig professional wants to advertise their skills proactively.

### Steps

1. Click **"Post a Service"** in sidebar
2. Fill service details:
   - Service title (e.g., "I will design a modern logo")
   - Category
   - Description
   - Starting price
   - Delivery time
   - Skills/tools used
3. Submit the form
4. Service goes live on the platform
5. Redirect to **Service Published** page (`service-published.html`)
6. Clients can discover this service via **Search Talent** and send hire requests

### Data Flow

```
Gig posts service → Service visible to clients → Client sends hire request → Pending Request for Gig
```

---

## 12. Profile Management

### Page
`gig-profile.html`

### View Mode
Displays:
- Name, title, bio
- Skills (as pills/tags)
- Tools
- Portfolio links
- Ratings and reviews
- Completed task history

### Edit Mode (Inline Edit)

1. Click **"Edit My Profile"**
2. Bio field becomes editable (`contentEditable`)
3. Modify bio text
4. Click the button again to save
5. Changes persisted to localStorage and user record

### Function
`profile.js` → handles both profile completion and inline editing

---

## 13. Reviews & Reputation

### Trigger
Task is marked as `completed`.

### Steps

1. After task completion, gig professional can **review the client**
2. Review includes:
   - Rating (1–5 stars)
   - Written comment/testimonial
3. Client also reviews the gig professional (mutual review system)
4. Reviews are displayed on the gig professional's public profile

### Database Table: `REVIEWS`

| Column | Description |
|--------|-------------|
| `reviewer_id` | Gig professional's `user_id` |
| `reviewee_id` | Client's `user_id` |
| `task_id` | The completed task |
| `rating` | 1–5 |
| `comment` | Written feedback |

### Constraints
- Self-reviews blocked via `CHECK (reviewer_id != reviewee_id)`
- One review per `(reviewer, reviewee, task)` combination (UNIQUE constraint)

---

## 14. Completed Projects & Earnings

### Completed Projects Page
`completed-projects.html`

- Lists all tasks with `status: 'completed'`
- Shows task title, client name, completion date, rating received
- Acts as the gig professional's **portfolio of real work**

### Total Earnings Page
`total-earnings.html`

- Breakdown of all earnings from completed tasks
- Sum of all approved payment amounts
- Computed via: `completedTasks.reduce((sum, task) => sum + task.budget, 0)`

---

## 15. CRUD Summary

| Entity | CREATE | READ | UPDATE | DELETE |
|--------|--------|------|--------|--------|
| **Profile** | ✅ Registration + Profile Completion | ✅ View Profile | ✅ Inline Edit Bio | ❌ |
| **Applications** | ✅ Apply to Task | ✅ View in Explore Tasks | ✅ Status changes (via client) | ✅ Withdraw Application |
| **Pending Requests** | ✅ Auto-created when client shortlists | ✅ View Pending Requests | ✅ Accept / Decline | ❌ |
| **Active Tasks** | ✅ Created on request acceptance | ✅ View Active Tasks | ✅ Progress updates | ❌ |
| **Deliverables** | ✅ Submit Deliverable | ✅ View in Project Detail | ✅ Re-submit after revision | ❌ |
| **Services** | ✅ Post a Service | ✅ View Published Services | ❌ | ❌ |
| **Reviews** | ✅ Review Client | ✅ View on Profile | ❌ | ❌ |

---

## 16. Database Tables Involved

| Table | Relationship to Gig Professional |
|-------|----------------------------------|
| `USERS` | Stores account credentials (`role = 'gig_professional'`) |
| `GIG_PROFESSIONAL_PROFILE` | 1:1 with USERS — stores bio |
| `PROFILE_SKILLS` | M:1 — multiple skills per profile |
| `PROFILE_TOOLS` | M:1 — multiple tools per profile |
| `PROFILE_PORTFOLIO` | M:1 — multiple portfolio URLs per profile |
| `APPLICATION` | M:M bridge between gig profile and tasks |
| `TASKS` | Assigned tasks (`assignedTo = gig_profile_id`) |
| `DELIVERABLE` | Weak entity of TASKS — submitted work |
| `GIG_MANAGER_ASSIGNMENT` | Links gig ↔ task ↔ manager |
| `PAYMENT` | One payment per (task, gig_profile) pair |
| `REVIEWS` | Mutual reviews (gig ↔ client per task) |

---

## 17. Backend API Endpoints (NestJS Stubs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register as gig professional |
| `POST` | `/auth/login` | Login |
| `GET` | `/gig/profile` | Get own profile |
| `PUT` | `/gig/profile` | Update profile |
| `GET` | `/tasks/marketplace` | Browse open tasks |
| `POST` | `/applications` | Apply to a task |
| `DELETE` | `/applications/:id` | Withdraw application |
| `POST` | `/applications/:id/accept` | Accept a hire request |
| `POST` | `/applications/:id/decline` | Decline a hire request |
| `POST` | `/deliverables` | Submit a deliverable |
| `GET` | `/tasks/active` | Get active/assigned tasks |
| `POST` | `/services` | Post a service |
| `GET` | `/services/mine` | Get own posted services |
| `POST` | `/reviews` | Submit a review for client |

> **Note:** Backend endpoints are currently stubs. Frontend uses localStorage-driven mock data.

---

## 18. Frontend Pages & Modules

### Pages (`front-end/pages/gig/`)

| Page | Purpose |
|------|---------|
| `gig-dashboard.html` | Dashboard with metrics |
| `explore-tasks.html` | Browse & apply to open tasks |
| `active-tasks.html` | View assigned tasks |
| `pending-requests.html` | Accept/decline hire requests |
| `project-detail.html` | Full task details + submit deliverable |
| `submit-deliverables.html` | Deliverable submission form |
| `submission-success.html` | Confirmation after submission |
| `post-service.html` | Post a service offering |
| `service-published.html` | Confirmation after posting service |
| `gig-profile.html` | View/edit profile |
| `profile-completion-gig.html` | First-time profile setup |
| `completed-projects.html` | Past completed work |
| `total-earnings.html` | Earnings breakdown |

### JS Modules (`front-end/js/modules/`)

| Module | Gig Professional Functions |
|--------|---------------------------|
| `auth.js` | Signup, login, logout, role selection, session management |
| `gigState.js` | Core gig workflow state — requests, tasks, accept/decline/complete |
| `tasks.js` | Explore tasks, search, filters, pagination, apply/withdraw |
| `applications.js` | Pending requests — accept/decline service requests |
| `deliverables.js` | Submit deliverables, project detail page |
| `services.js` | Post service, view published services |
| `profile.js` | Profile completion form, inline edit |
| `dashboard.js` | Dashboard metrics computation |

---

## 19. Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GIG PROFESSIONAL JOURNEY                        │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌───────────────────┐     ┌──────────────┐
  │  SIGNUP  │────▶│ PROFILE COMPLETION │────▶│  DASHBOARD   │
  │ (Join)   │     │ Bio, Skills, Tools │     │  (Home Base) │
  └──────────┘     │ Portfolio          │     └──────┬───────┘
                   └───────────────────┘            │
                                                    │
                 ┌──────────────────────────────────┼──────────────────┐
                 │                                  │                  │
                 ▼                                  ▼                  ▼
        ┌────────────────┐              ┌───────────────────┐  ┌──────────────┐
        │ EXPLORE TASKS  │              │ PENDING REQUESTS  │  │ POST SERVICE │
        │ Browse & Apply │              │ From Client Hires │  │ Offer Skills │
        └───────┬────────┘              └────────┬──────────┘  └──────────────┘
                │                                │
                │ Apply                          │ Accept / Decline
                ▼                                ▼
        ┌────────────────────────────────────────────────┐
        │              ACTIVE TASKS                      │
        │  Assigned work — Track progress & execute      │
        └───────────────────────┬────────────────────────┘
                                │
                                │ Submit Deliverable
                                ▼
        ┌────────────────────────────────────────────────┐
        │           UNDER REVIEW (Client Side)           │
        │  Client reviews submitted work                 │
        └──────────┬─────────────────────┬───────────────┘
                   │                     │
            Approved ✅           Revision Requested 🔄
                   │                     │
                   │                     └──── Rework ──── Re-Submit ──┐
                   │                                                   │
                   ▼                                                   │
        ┌──────────────────┐                                          │
        │  TASK COMPLETED  │◀─────────────────────────────────────────┘
        │  Payment Released│
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐     ┌──────────────────┐
        │  MUTUAL REVIEWS  │     │ COMPLETED PROJECTS│
        │  Rate the Client │     │ Portfolio + Earning│
        └──────────────────┘     └──────────────────┘
```

### Status Transitions

```
APPLICATION:   pending ──▶ shortlisted ──▶ approved (hired)
                  │                            │
                  └── withdrawn (by gig)       └── rejected (by client)

REQUEST:       pending ──▶ accepted ──▶ (task created)
                  │
                  └── declined (by gig)

TASK:          open ──▶ in_progress ──▶ under_review ──▶ completed
                                            │
                                            └── revision_requested ──▶ re-submitted ──▶ under_review

DELIVERABLE:   submitted ──▶ approved
                  │
                  └── revision_requested ──▶ re-submitted

PAYMENT:       pending ──▶ completed
                  │
                  └── failed
```

---

## Quick Reference — Complete Flow in One Glance

| Step | Action | Page | Role |
|------|--------|------|------|
| 1 | Sign up | `signup.html` | New User |
| 2 | Complete profile | `profile-completion-gig.html` | New User |
| 3 | View dashboard | `gig-dashboard.html` | Gig Pro |
| 4 | Browse open tasks | `explore-tasks.html` | Gig Pro |
| 5 | Apply to a task | `explore-tasks.html` | Gig Pro |
| 6 | (Wait) Client shortlists/hires | — | Client |
| 7 | Accept/decline request | `pending-requests.html` | Gig Pro |
| 8 | Work on assigned task | `active-tasks.html` | Gig Pro |
| 9 | View project details | `project-detail.html` | Gig Pro |
| 10 | Submit deliverable | `submit-deliverables.html` | Gig Pro |
| 11 | (Wait) Client reviews | — | Client |
| 12a | If approved → Payment | — | System |
| 12b | If revision → Rework & re-submit | `submit-deliverables.html` | Gig Pro |
| 13 | Review the client | — | Gig Pro |
| 14 | View completed projects | `completed-projects.html` | Gig Pro |
| 15 | View total earnings | `total-earnings.html` | Gig Pro |

---

*Document generated for GigsForGigs — Team 8 | Domain: Gig Economy / Creator Economy*
