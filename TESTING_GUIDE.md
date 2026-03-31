# CRUD Operations Testing Guide - GigsForGigs

## Quick Start

Open in browser: `http://localhost:5000/front-end/index.html` (or your dev server)

---

## 1. FIRST-TIME USER (New Joiner) - Emma Wilson

### Signup as Client
1. Click **"Join"** button on homepage
2. Select **"Client"** from dropdown
3. Enter details:
   - Name: `Emma Wilson`
   - Email: `emma@newstartup.com`
   - Password: `password6`
4. Click **"Create Account"**

### Profile Completion ✅
1. Fill profile form:
   - Company Name: Your Company
   - Industry: Select any
   - All other fields optional
2. Click **"Continue"**
3. **First-time Note**: Dashboard shows **0 for all stats** (Tasks Posted: 0, Active Projects: 0, Total Spent: 0)

---

## 2. EXISTING USER - Alex Johnson

### Login
1. Click **"Log In"** on homepage
2. Enter:
   - Email: `alex@acmecorp.com`
   - Password: `password1`
3. Click **"Log In"**
4. **Existing User Note**: Dashboard shows **actual mock data** (Tasks Posted: 6, Active Projects: 2, Total Spent: $4,500)

---

## 3. TASK CRUD OPERATIONS

### ➕ CREATE - Post a Gig

**Both first-time and existing users:**

1. Logged in as Client
2. Click **"Post a Gig"** in sidebar
3. Fill form:
   - Title: `Logo Design for My Brand`
   - Category: `design`
   - Duration: `1-3-months`
   - Description: `Looking for a modern logo...`
   - Pricing: `fixed` or `hourly`
   - Budget: `500`
   - Skills: `Logo Design, Branding`
4. Click **"Post Gig"**
5. **Result**: New task appears in "Active Contracts"

---

### 📖 READ - View Tasks

**Client View:**
1. Click **"Active Contracts"** in sidebar
2. See all your posted gigs with:
   - Title, status, budget
   - Assigned professional (if any)
   - Progress bar
   - Action buttons

**Manager View:**
1. Login as manager: `rivera@acmecorp.com` / `password2`
2. Click **"Active Contracts"**
3. **Result**: See same client's tasks (manager sees linked client's gigs)

**Gig Professional View:**
1. Login as gig: `john@gigpro.com` / `password3`
2. Click **"Explore Tasks"**
3. See all open tasks in card grid
4. **Result**: Can view and apply to tasks

---

### ✏️ UPDATE - Edit a Gig

1. Go to **"Active Contracts"** (as Client)
2. Find an **open** task (status shows "open")
3. Click **"Edit"** button (blue button on right)
4. **Form pre-fills** with existing data
5. Change any field:
   - Title
   - Budget
   - Description
   - Skills
   - Duration
   - Pricing
6. Click **"Post Gig"**
7. **Result**: Changes appear immediately in Active Contracts list

---

### ❌ DELETE - Delete a Gig

1. Go to **"Active Contracts"** (as Client)
2. Find an **open** task
3. Click **"Delete"** button (gray button on right)
4. **Result**:
   - Task disappears from list
   - No page reload
   - UI updates instantly

---

## 4. APPLICATION CRUD OPERATIONS

### ➕ CREATE - Apply to a Task

**Gig Professional:**
1. Login as gig: `john@gigpro.com` / `password3`
2. Click **"Explore Tasks"**
3. See task cards in grid
4. Click **"Apply"** button
5. **Result**:
   - Button changes to **"Withdraw ✕"**
   - Application added to backend
   - Can see application in client's "Approve Shortlists"

---

### 📖 READ - View Applications

**Client Side - "Approve Shortlists":**
1. Login as client: `alex@acmecorp.com` / `password1`
2. Click **"Approve Shortlists"** in sidebar
3. See all applicants:
   - Task title
   - Professional name, title, bio
   - Proposed budget
   - Application status

**Gig Professional - "Pending Requests":**
1. (Wait for client to shortlist or invite)
2. Click **"Pending Requests"**
3. See invitations/shortlists

---

### ✏️ UPDATE - Application Status Changes

**Client Actions:**
1. Go to **"Approve Shortlists"**
2. Find pending application
3. Three options:
   - **"Shortlist"** → Status: pending → shortlisted
   - **"Reject"** → Status: pending → rejected
   - If shortlisted, click **"Approve & Hire"** → Task goes in_progress, professional assigned

**Gig Professional Actions:**
1. Go to **"Pending Requests"**
2. See invitation
3. Two options:
   - **"Accept"** → Task status: in_progress
   - **"Decline"** → Application rejected

---

### ❌ DELETE - Withdraw Application

1. Go to **"Explore Tasks"** (as Gig)
2. Find task you applied to (button shows **"Withdraw ✕"**)
3. Click **"Withdraw ✕"**
4. **Result**:
   - Application removed
   - Button changes back to **"Apply"**
   - No page reload

---

## 5. DELIVERABLE CRUD OPERATIONS

### ➕ CREATE - Submit Deliverable

1. Setup: Have a task assigned to gig professional
2. Gig professional goes to **"Active Tasks"**
3. Find assigned task
4. Click **"Submit Draft"**
5. **Result**:
   - Deliverable created
   - Task status: in_progress → under_review
   - Appears in client's "Approve Shortlists" with orange border

---

### 📖 READ - Review Deliverables

1. Go to **"Approve Shortlists"** (as Client)
2. Find task with status "under review" (orange border)
3. Click **"Review Deliverables →"**
4. See deliverable info:
   - Professional name
   - Submitted date
   - Message
   - Files
   - Payment amount (budget)

---

### ✏️ UPDATE - Approve or Request Revision

1. On "Review Deliverables" page:

**Approve & Release Payment:**
- Click **"Approve"** button (green)
- Payment released
- Task status: under_review → completed
- Deliverable status: submitted → approved

**Request Revision:**
- Click **"Request Revision"** button
- Deliverable status: submitted → revision_requested
- Goes back to gig for rework

---

### ❌ DELETE - Delete Deliverable

1. On "Review Deliverables" page
2. If deliverable status is **"submitted"** (not approved):
   - Click **"Delete Deliverable"** button
   - Deliverable removed
   - Task goes back to in_progress

---

## 6. MANAGER CRUD OPERATIONS

### ➕ CREATE - Add Manager Account

1. **First-time user (Emma):**
   - Profile selection page shows NOT managers
   - Click **"Add Manager"**
   - Enter manager email: `manager1@company.com`
   - Manager created
   - Emma now has 1 manager account

2. **Existing user (Alex):**
   - Profile selection page shows Alex Rivera (existing manager)
   - Click **"Add Manager"**
   - Enter new manager email
   - Multiple managers possible

---

### 📖 READ - List Managers

1. Log in as Client
2. Go to **"Who's using this account?"** page
3. **First-time user (Emma):** Shows only:
   - Admin button
   - Add Manager button
   - **NO manager placeholders**

4. **Existing user (Alex):** Shows:
   - Admin button
   - **Alex Rivera (actual manager)**
   - Add Manager button

---

## 7. PROFILE OPERATIONS

### ✏️ UPDATE - Profile Completion (Join)

1. Just after signup
2. Fill client/gig profile form
3. Submit
4. **Result**:
   - `isFirstTimeUser: false`
   - Dashboard shows 0 stats first time
   - After profile complete, redirects to dashboard

### ✏️ UPDATE - Edit Profile (Existing)

**Gig Professional:**
1. Click **"Profile"** in sidebar
2. Click **"Edit My Profile"**
3. Bio field becomes editable
4. Edit and save
5. **Result**: Changes persisted

---

## 8. DASHBOARD OPERATIONS

### Client Dashboard - First-time vs Existing

**First-time (Emma):**
- Tasks Posted: **0**
- Active Projects: **0**
- Total Spent: **$0**

**Existing (Alex):**
- Tasks Posted: **6**
- Active Projects: **2**
- Total Spent: **$4,500**

### Manager Dashboard

1. Login as manager: `rivera@acmecorp.com` / `password2`
2. See two tables:
   - **Active Tasks** (in_progress, under_review)
   - **Pending Tasks** (open, completed)
3. All filtered by linked client's tasks

### Gig Professional Dashboard

**First-time (newuser@example.com):**
- Completed Tasks: **0**
- Total Earnings: **$0**
- Average Rating: **0**

**Existing (John):**
- Completed Tasks: **12**
- Total Earnings: **$15,840**
- Average Rating: **4.8** (24 ratings)

---

## 9. TESTING CHECKLIST FOR COLLEGE EVALUATION

### ✅ First-Time User Flow (Emma)
- [ ] Sign up as Client
- [ ] Complete profile
- [ ] Dashboard shows 0 stats
- [ ] Profile selection shows NO managers
- [ ] Add a manager account
- [ ] Profile selection now shows manager
- [ ] Post a gig (CREATE)
- [ ] See gig in Active Contracts (READ)
- [ ] Edit gig (UPDATE)
- [ ] Delete gig (DELETE)

### ✅ Existing User Flow (Alex)
- [ ] Login with existing credentials
- [ ] Dashboard shows mock data stats
- [ ] Profile selection shows existing manager
- [ ] Post a gig
- [ ] See multiple gigs
- [ ] Edit gig
- [ ] View gigs in Manager dashboard

### ✅ Application Flow (John applies to gig)
- [ ] Login as gig (john@gigpro.com)
- [ ] Click Explore Tasks
- [ ] Apply to a task
- [ ] Button changes to "Withdraw ✕"
- [ ] Withdraw application
- [ ] Button changes back to "Apply"

### ✅ Shortlist & Hire Flow (Alex hires John)
- [ ] Gig applies to task
- [ ] Login as client
- [ ] Go to "Approve Shortlists"
- [ ] Click "Shortlist"
- [ ] Click "Approve & Hire"
- [ ] Task moves to in_progress
- [ ] Gig appears as assigned

### ✅ Deliverable Flow (John submits work)
- [ ] John goes to "Active Tasks"
- [ ] Click "Submit Draft"
- [ ] Task status changes to under_review
- [ ] Alex reviews deliverable
- [ ] Alex approves and releases payment
- [ ] Task marked completed

### ✅ No Page Reloads
- [ ] Apply to task → UI updates instantly
- [ ] Withdraw application → UI updates instantly
- [ ] Delete gig → UI updates instantly
- [ ] Edit gig → Form pre-fills, then redirects

---

## Key Points for Evaluation

1. **Same Operations for Both User Types** ✅
   - First-time users can CREATE, READ, UPDATE, DELETE just like existing users
   - Only difference: stats start at 0, then build up

2. **In-Memory Data** ✅
   - All changes stored in `mockData.js` arrays
   - No backend required
   - Data persists during session

3. **Dynamic UI** ✅
   - Managers shown/hidden based on `isFirstTimeUser` flag
   - Application buttons change based on application status
   - No hardcoded placeholders

4. **Complete CRUD** ✅
   - Tasks: CREATE, READ, UPDATE, DELETE ✅
   - Applications: CREATE, READ, UPDATE, DELETE ✅
   - Deliverables: CREATE, READ, UPDATE, DELETE ✅
   - Managers: CREATE, READ ✅
   - Profiles: CREATE, READ, UPDATE ✅

---

## Troubleshooting

**Tasks don't show up after posting?**
- Make sure you're logged in as Client role
- Check Active Contracts page (not just dashboard)

**Can't edit task?**
- Only works if task status is "open"
- Once assigned, editing is disabled

**Application not showing?**
- Login as client and go to "Approve Shortlists"
- Only shows applications for YOUR tasks

**Manager not appearing?**
- Must be existing user (not first-time)
- First-time users see empty managers container

---

## Demo Script (For College Presentation)

```
Time: 10 minutes

1. Show signup page - explain first-time flag (2 min)
2. Create Emma account - show 0 stats (2 min)
3. Add manager - show dynamic rendering (1 min)
4. Post a gig - show CREATE (1 min)
5. Edit gig - show UPDATE (1 min)
6. Delete gig - show DELETE (1 min)
7. Switch to John - apply to task - show WITHDRAW (1 min)
8. Show Alex - approve and hire - show STATUS UPDATE (1 min)
```

---
