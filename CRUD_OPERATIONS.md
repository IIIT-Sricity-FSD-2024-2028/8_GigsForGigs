# CRUD Operations Documentation - GigsForGigs

## Overview
All CRUD (Create, Read, Update, Delete) operations work identically for both **new users (Join)** and **existing users (Login)**. Operations are applied to the in-memory mock data arrays.

---

## 1. TASKS (Gigs)

### CREATE - Post a Gig
- **Page**: `post-gig.html`
- **Role**: Client, Manager
- **User Type**: Both new joiners and existing users
- **Function**: `initPostGig()`
- **Action**:
  - Fill form: Title, Category, Duration, Description, Budget, Skills
  - Submit form
  - New task created in `tasks[]` array
  - Redirects to `my-gigs-client.html`

### READ - List Tasks
- **Pages**:
  - `my-gigs-client.html` → Client's own tasks
  - `manager-dashboard.html` → Manager sees client's tasks
  - `explore-tasks.html` → Gig professional sees open tasks
  - `active-tasks.html` → Gig professional sees assigned tasks
- **Functions**:
  - `renderMyGigsClient()`
  - `renderManagerDashboard()`
  - `renderExploreTasks()`
  - `renderActiveTasks()`
- **Display**: Tasks filtered by role and status

### UPDATE - Edit a Gig
- **Page**: `post-gig.html` with `?editId=<taskId>` parameter
- **Role**: Client only
- **Condition**: Only if task status is "open"
- **Function**: `initPostGig()`
- **Action**:
  - Click "Edit" button on task card
  - Form pre-fills with existing data
  - Modify title, budget, description, skills, category, duration
  - Submit updates existing task record
  - Redirects to `my-gigs-client.html`

### DELETE - Delete a Gig
- **Page**: `my-gigs-client.html`
- **Role**: Client only
- **Condition**: Only if task status is "open"
- **Function**: `renderMyGigsClient()`
- **Action**:
  - Click "Delete" button on task card
  - Task removed from `tasks[]` array
  - UI re-renders immediately (no page reload)

---

## 2. APPLICATIONS (Gig Professional → Client)

### CREATE - Apply to a Task
- **Page**: `explore-tasks.html`
- **Role**: Gig Professional
- **User Type**: Both new joiners and existing users
- **Function**: `renderExploreTasks()`
- **Action**:
  - Browse open tasks
  - Click "Apply" button
  - New application created in `applications[]` array
  - Button changes to "Withdraw ✕"
  - UI re-renders immediately

### READ - List Applications
- **Pages**:
  - `review-shortlist.html` → Client sees applicants
  - `pending-requests.html` → Gig sees pending requests
- **Functions**:
  - `renderReviewShortlist()`
  - `renderPendingRequests()`
- **Display**: Applications filtered by role and taskId

### UPDATE - Application Status Management
- **Shortlist Application** (Client/Manager action)
  - Click "Shortlist" button → status: pending → shortlisted
  - Function: `renderReviewShortlist()`

- **Reject Application** (Client/Manager action)
  - Click "Reject" button → status: pending → rejected
  - Function: `renderReviewShortlist()`

- **Approve & Hire** (Client only)
  - Click "Approve & Hire" → Task assigned to gig + status: in_progress
  - All other pending applications auto-rejected
  - Function: `renderReviewShortlist()`

- **Accept Request** (Gig Professional action)
  - Click "Accept" → Application accepted, task in_progress
  - Function: `renderPendingRequests()`

- **Decline Request** (Gig Professional action)
  - Click "Decline" → Application rejected
  - Function: `renderPendingRequests()`

### DELETE - Withdraw Application
- **Page**: `explore-tasks.html`
- **Role**: Gig Professional
- **Action**:
  - Click "Withdraw ✕" button (shown after applying)
  - Application removed from `applications[]` array
  - Button changes back to "Apply"
  - UI re-renders immediately (no page reload)

---

## 3. DELIVERABLES (Gig Professional submits work)

### CREATE - Submit Deliverable
- **Page**: `project-detail.html`
- **Role**: Gig Professional
- **Condition**: Only if assigned to task (task.assignedTo === user.id) and task.status === 'in_progress'
- **Function**: `initProjectDetail()`
- **Action**:
  - Click "Submit Deliverable" button
  - New deliverable created in `deliverables[]` array
  - Task status changes to "under_review"
  - Redirects to `active-tasks.html`

### READ - Review Deliverables
- **Page**: `review-deliverables.html`
- **Role**: Client, Manager
- **Function**: `initReviewDeliverables()`
- **Display**:
  - Shows submitted deliverable details
  - Displays gig professional info, submitted date, message, files
  - Shows payment amount (task budget)

### UPDATE - Deliverable Review Actions
- **Approve & Release Payment** (Client only)
  - Click "Approve" button
  - Deliverable status: submitted → approved
  - Payment released: true
  - Task status: under_review → completed
  - Redirects to `my-gigs-client.html`

- **Request Revision** (Client only)
  - Click "Request Revision" button
  - Deliverable status: submitted → revision_requested
  - Revision note added
  - Redirects to `my-gigs-client.html`

### DELETE - Delete Deliverable
- **Page**: `review-deliverables.html`
- **Role**: Client only
- **Condition**: Only if deliverable.status === 'submitted' (not approved)
- **Function**: `initReviewDeliverables()`
- **Action**:
  - Click "Delete Deliverable" button
  - Deliverable removed from `deliverables[]` array
  - Redirects to `my-gigs-client.html`

---

## 4. MANAGERS (Client sub-accounts)

### CREATE - Add Manager
- **Pages**: `add-manager.html` or `add-manager-flow.html`
- **Role**: Client only
- **User Type**: Both new joiners and existing users
- **Function**: `initAddManager()` or `initAddManagerFlow()`
- **Action**:
  - Enter manager email
  - New manager created in `users[]` array
  - Manager linked to client (clientId: client.id)
  - Redirects back to `client-profile-selection.html`

### READ - List Managers
- **Page**: `client-profile-selection.html`
- **Function**: `initClientProfileSelection()` in dashboard.js
- **Display**:
  - If `isFirstTimeUser: true` → No managers shown
  - If `isFirstTimeUser: false` → Shows actual linked managers
  - Dynamically populates from `users[]` array

---

## 5. USER PROFILE OPERATIONS

### UPDATE - Profile Completion (First Time Users)
- **Pages**: `profile-completion-client.html`, `profile-completion-gig.html`
- **Role**: Client, Gig Professional
- **User Type**: New users during join flow
- **Action**:
  - Fill profile details
  - Save to localStorage
  - Update in-memory user record
  - Mark as `isFirstTimeUser: false`
  - Redirect to appropriate dashboard

### UPDATE - Inline Profile Edit
- **Page**: `gig-profile.html`
- **Role**: Gig Professional
- **Action**:
  - Click "Edit My Profile"
  - Bio becomes editable (contentEditable)
  - Click button again to save
  - Changes persisted to localStorage and user record

---

## 6. DASHBOARD OPERATIONS

### READ - Client Dashboard
- **Page**: `client-dashboard.html`
- **Function**: `initClientDashboard()` in dashboard.js
- **Display**:
  - Tasks Posted (count)
  - Active Projects (count)
  - Total Spent (sum)
  - All stats show 0 for **first-time users**
  - All stats show actual data for **existing users**

### READ - Manager Dashboard
- **Page**: `manager-dashboard.html`
- **Function**: `renderManagerDashboard()` in tasks.js
- **Display**:
  - Active tasks table (in_progress, under_review)
  - Pending tasks table (open, completed)
  - Filtered by linked client's tasks

### READ - Gig Professional Dashboard
- **Page**: `gig-dashboard.html`
- **Function**: `initGigDashboard()` in dashboard.js
- **Display**:
  - Completed Tasks (count)
  - Total Earnings (sum)
  - Average Rating
  - All stats show 0 for **first-time users**
  - All stats show actual data for **existing users**

---

## Data Persistence

- **Primary Storage**: In-memory `mockData.js` arrays
- **Secondary Storage**: localStorage for user session and profiles
- **No Backend**: All operations affect mock data arrays only
- **UI Updates**: Immediate re-render after each operation (no page reload except for navigation)

---

## Same Operations for Both User Types

✅ **First-time users and existing users have identical CRUD capabilities**

The only difference is:
- First-time users have `isFirstTimeUser: true` and all stats are 0 initially
- After profile completion, they become `isFirstTimeUser: false`
- All operations work identically from that point forward

---

## Available Operations Summary

| Entity | CREATE | READ | UPDATE | DELETE |
|--------|--------|------|--------|--------|
| Tasks | ✅ | ✅ | ✅ | ✅ |
| Applications | ✅ | ✅ | ✅ | ✅ |
| Deliverables | ✅ | ✅ | ✅ | ✅ |
| Managers | ✅ | ✅ | ❌ | ❌ |
| User Profile | ✅ | ✅ | ✅ | ❌ |
| Dashboard | ❌ | ✅ | ❌ | ❌ |

---

## Module Files

- **tasks.js** - Task CRUD + Application apply/withdraw
- **applications.js** - Application status updates
- **deliverables.js** - Deliverable submission & review
- **managers.js** - Manager account creation
- **profile.js** - Profile completion & inline edit
- **dashboard.js** - Dashboard displays & profile selection
- **auth.js** - Login/Signup/Session management
