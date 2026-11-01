# GigsForGigs Super Admin: Defense Dossier and Demo Script

Prepared 1 November 2026. Every claim below was checked against the code and a running system. Where the system does not do something, this document says so, because an evaluator reading the code will find it anyway.

## 1. Before you present

### Run this first

The code now needs new database columns. **Until the migration runs on the database your backend uses, login returns a 500.**

Your demo stack uses local Postgres (`gigsforge` on port 5432). It was built with `db push`, so it has no migration history and needs a one-time baseline. In PowerShell, from `apps/backend`, and with a backup taken first:

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/gigsforge"
pg_dump -h 127.0.0.1 -U postgres gigsforge > before-migration.sql

"20260824101313_init","20260826163152_phase1_backend",
"20260828063915_task_category_duration_skills_application_shortlist_manager_created_at",
"20261014000000_task_deliverable_definitions","20261017000000_payment_escrow",
"20261017000001_payment_escrow_backfill","20261018000000_assignment_optional_manager" |
  ForEach-Object { npx prisma migrate resolve --applied $_ }

npx prisma migrate deploy
npx prisma generate

# Puts money in escrow and opens disputes, so there is something to demonstrate.
$env:ALLOW_DEMO_PREP = "true"; npm run demo:prep
```

Then restart the backend. This exact sequence was run on a copy of your database, with zero schema drift afterwards.

The Aiven database in `apps/backend/.env` already has a migration history, so it needs only `npx prisma migrate deploy`. Your code was already broken against it before this work (see finding 1). The same migration path was tested on a database built from migrations, but not on Aiven itself.

### What was verified

| Check | Result |
| --- | --- |
| `tsc --noEmit` (backend) | 0 errors |
| `tsc -b && vite build` (frontend) | 0 errors, 0 warnings |
| Migration on a fresh DB and on a copy of your DB | Applies, 0 drift against `schema.prisma` |
| Governance tests on a real DB | 18 of 18 pass |
| Full backend suite on a copy of your DB | 34 of 36 (see below) |
| Same suite, with your one suspended client reactivated | 36 of 36 |
| Real-browser run of the 13 screens on a copy of your data | 47 of 47 |

The two failures are `apiReviewIntegration` tests hardcoded to task 94, whose owner (`user_id` 3) is suspended in your data. The new status check correctly rejects that account. They will fail on your database until that client is reactivated.

All of this ran on a throwaway Postgres cluster. Your local `gigsforge` and Aiven data were not changed, and nothing is committed.

## 2. What the audit found

The brief described several things as existing that did not. These were the most serious.

| # | Finding | Why it mattered | Now |
| --- | --- | --- | --- |
| 1 | Commit `1ca41cc` changed the schema with no migration | On a database built from migrations, every `User` query failed, including login. This is what the configured Aiven DB does today | Idempotent migration repairs all database states |
| 2 | RBAC was never enforced | Any admin, including an Auditor, could release escrow by calling the API. Permissions only hid buttons | `can()` checks every write against the DB |
| 3 | Tier was stored in process memory, with an email-substring fallback | Restarting the server changed ranks, and an unknown address containing no keyword became `SUPER_ADMIN` | Stored columns |
| 4 | Disputes "settled" without moving money | The ruling set a status field and escrow was untouched. API errors were swallowed and the UI still said "settled". Notes were discarded | Money and verdict commit in one transaction |
| 5 | Audit log was an in-memory array capped at 200 | Lost on restart, trivially editable, and the UI's columns did not match it, so most rendered blank | Database table with an append-only trigger |
| 6 | Suspension only blocked new logins | A suspended user's token kept working for up to 7 days | `authGuard` checks status on each request |
| 7 | `tokenVersion` did not exist | "Revoke sessions" wrote a log line and did nothing, while the UI said tokens were invalidated | Implemented and tested |
| 8 | 2FA was a boolean flip | No secret, no code, and login ignored it. Any admin could flip another's by sending their email | Real RFC 6238 TOTP, self-service only |
| 9 | The "ed25519 key ID" was a 32-bit FNV-1a hash labelled `ed25519-rsa-0x…` | ed25519 and RSA are different algorithms and no key existed. A reviewer would catch this in seconds | Removed |
| 10 | Settings lived in memory and the rake had no effect | A hardcoded 10% applied whatever the screen said. Maintenance mode did nothing | Persisted and enforced |
| 11 | Fabricated values | `rating: 4.9`, `hourlyRate: 65 + id*5`, `"68.4%"`, `"Great collaboration!"`, `Pending Approval = fees + escrow/2`, up-arrow "trend" pills, `kycStatus` defaulting to VERIFIED | Removed. Missing data shows as a dash |
| 12 | Invite tokens were reusable, and "Token Verified" was `length > 6` in the browser | The inviter also knew the final password if the invitee skipped changing it | One-time, and a new password is mandatory |

Also fixed: the ledger had raw `DELETE` and `PATCH` routes, a prefixed id with no match could suspend an unrelated user (`cli-999` fell through to user 999), `Login` unmounted during every attempt and lost the typed credentials and error, velocity charts bucketed by hire date instead of payment date, category "GMV" summed unfunded budgets, and a literal `$\rightarrow$` appeared in a column header.

## 3. The 13 workflows

Status key: **Real** works end to end. **Partial** works, with the stated limit.

| # | Workflow | Status | Exact behaviour, and the limit to know |
| --- | --- | --- | --- |
| 1 | Dashboard and KPIs | Real | GMV is held plus released. Revenue is fees on released payments only. KYC rate and open dockets are live. There are no trend deltas, because no prior-period comparison exists |
| 2 | Velocity and categories | Real | 7D daily, 30D 5-day, 90D 15-day, YTD calendar two-month, bucketed on `settledAt`. Peak is computed server-side. Category shares sum to 100% of the same payments. Migrated rows use `createdAt` as an estimate of `settledAt`, since the true time was never recorded |
| 3 | Client KYC | Partial | `PENDING` to `VERIFIED` or `REJECTED`, status toggle, and manager roster all work. **It is one level, not tiered, with no document upload, and it gates nothing** |
| 4 | Gig pro badges | Partial | Badge, suspension, skills and portfolio links work. Rating averages non-hidden reviews. "Verification" means an admin inspects the links. **Badges appear only in the admin console** |
| 5 | Manager oversight | Real | Suspending leaves assignments intact, so nothing is orphaned, and the client can reassign. Suspended managers can't receive new work. **Reassignment is the client's action, not automatic** |
| 6 | Projects pipeline | Partial | Escrow state, fee, assignee, supervisor and deliverable counts are shown. **Deliverables are counted here, and reviewed in the client and manager portals** |
| 7 | Payments and escrow | Partial | Read-only ledger, separate release and refund grants, reasons audited, blocked during an open dispute. **Escrow is per contract, not per milestone, and is simulated: no gateway moves real money** |
| 8 | Reviews | Partial | `PUBLISHED`, `FLAGGED`, `HIDDEN`. Hidden reviews leave rating averages. **Profanity flagging is a short word list that routes to a human** |
| 9 | Disputes | Partial | SLA derived live and goes negative when breached. Null-safe evidence list. Three rulings execute atomically and only once. **There is no screen for users to file a dispute; `demo:prep` creates them. Nothing moves a case to `UNDER_REVIEW`, and an SLA breach is shown but triggers nothing** |
| 10 | Staff RBAC | Real | Five tiers plus OWNER. Changing tier resets the 9 checkboxes. Nobody can grant what they don't hold. **Permissions are set at invitation; there is no edit screen afterwards** |
| 11 | Profile, 2FA, sessions | Partial | Real `createdAt`, real TOTP, real revocation. **Optional, no recovery codes (a lost phone needs a manual DB reset), and no hardware keys** |
| 12 | Settings | Partial | Rake, minimum budget, escrow ceiling and maintenance mode persist and are enforced. **`allowedCategories` is stored but not enforced** |
| 13 | Staff invitation | Real | Signed 48h JWT plus a one-time password, mandatory new password, single use even under concurrency, audited. Nothing is emailed: the inviter shares both |

Removed because they did nothing: the escrow hold period, auto-dispute threshold and upload ceiling settings; manager "department" and "permission tier"; `lastLogin`; the fake device list.

## 4. Language to use and to avoid

The brief's wording would not survive a code review. Say what is true.

| Avoid | Say instead | Why |
| --- | --- | --- |
| "9-part bitmask" | "Permission set of 9 named grants" | It is a `TEXT[]`, deliberately. No bit is ever shifted |
| "ed25519 key IDs" | Nothing. It was removed | No key pair exists |
| "Hardware 2FA" or "FIDO2" | "TOTP 2FA, with WebAuthn as the next step" | Only TOTP is built |
| "Forced 2FA" | "Available to every admin, not yet mandatory" | It is optional, so a lost phone can't lock out the platform in a demo |
| "SOC-2 compliant" | "Append-only audit trail, a building block for SOC 2" | SOC 2 is an external attestation that hasn't happened |
| "Milestone escrow" | "Per-contract escrow released on approved deliverables" | One `PAYMENT` row per contract |
| "Binding arbitration" as a legal claim | "A platform dispute ruling" | Its legal force depends on terms users agreed to |
| "Eliminates multiplier cancellation" | See section 5 | The charts never had that problem |

## 5. Architecture defense

### Financial architecture

**Why escrow with a rake, rather than direct peer-to-peer payment?**
A two-sided marketplace has a trust gap: the client won't pay before the work and the professional won't work before payment. Holding the money solves it for both. It also gives the platform something a direct payment can't: a moment to collect its fee reliably, and funds still in its control when a dispute needs resolving. Direct payment makes the fee collectible only by invoicing afterwards, and invites taking the relationship off-platform.

*Trade-off:* holding client money is regulated. In India this generally means working through a licensed payment aggregator and a bank escrow arrangement under RBI rules, so a real launch would move funds through a provider and keep this state machine as the ledger of record. Confirm specifics with counsel. Today it is simulated, and you should say so before being asked.

**Why store the fee on each payment?**
So a rake change can't reprice a contract already agreed. Change the rake live and existing rows don't move: only new hires use the new rate. This is one of the strongest things to demonstrate.

**What does bucketing actually give you?**
Be careful with "multiplier cancellation artifacts". The only multiplier found was `amount * 1.07` in client spend, now removed, and the charts summed raw values. The defensible points are these:

- Fixed, non-overlapping intervals mean each payment lands in exactly one bucket at its true amount, so bars sum to the total shown and to the category table.
- Bucketing on `settledAt` rather than `createdAt` is the real correctness fix. A job hired in March and paid in May now counts in May.
- UTC boundaries stop a bucket's contents depending on the server's timezone.

**Why does a split take no fee on the refunded share?**
The fee is earned on work paid for. On a 50% split of ₹1,000 plus a ₹100 fee, the client gets ₹550, the professional ₹500, and the platform ₹50. Amounts are calculated in whole paise with the payout as the remainder, so they always sum exactly. A test checks this.

### Security and authorization

**Why tiers and granular permissions together?**
Tiers are how people think ("she's our finance admin"). Permissions are what code checks. Tiers provide sensible defaults, and the stored set can be narrowed for one person, such as finance staff who can release but not refund. The API checks only the permission, so adding a tier needs no enforcement change.

**Why strings rather than a real bitmask?**
A bitmask saves bytes on a table with tens of rows and costs readability everywhere: `payments:release` in a log means something, and `0b000010000` doesn't. It also limits how many permissions can be added, and makes an order change a migration. Bitmasks earn their place when millions of checks need packed storage, which isn't the case here.

**Why re-check permissions in the database on every request, instead of in the JWT?**
Permissions in a token stay valid until it expires, up to 7 days after a revocation. Reading them fresh makes revocation immediate. See the next question for the cost.

**How does tokenVersion work in a stateless JWT system?**
Each token carries the account's version when it was issued (`tv`). `authGuard` compares it to the database on every request. Incrementing the column makes every outstanding token for that user fail at once, with no blocklist to store or expire. Tokens predating the claim read as 0, the column default, so deploying signed nobody out.

*The honest trade-off:* this isn't fully stateless. It costs one primary-key lookup per request, about a millisecond. In exchange you get instant revocation with no extra infrastructure. If it became a hot path, a short-lived cache trades a few seconds of revocation delay for load. The guard already did this lookup for role checks, so the marginal cost was almost nothing.

**Why should root owners be forced to use strong 2FA?**
Owner compromise is the worst case: that account can move money and create admins. A password alone falls to phishing or reuse. TOTP raises the bar, but it can itself be phished in real time, which is why hardware keys (WebAuthn) are the right eventual requirement, since they bind to the site's origin. Current state: TOTP is real and optional. Mandating it needs recovery codes first, or one lost phone locks out the platform.

### Trust, safety and arbitration

**Why a formal docket with an SLA and an evidence list?**
A consistent record gives every case the same structure, makes rulings reviewable, and gives an appeal or complaint something to examine. The SLA exists because stuck money is the fastest way to lose both sides of a marketplace. Making it a derived countdown rather than a stored number means it can't go stale. Evidence is a list because real cases rarely have one document, and the code handles an empty list.

**Why freeze other payment paths during a dispute?**
Otherwise a client could release, or an admin could refund, while a case is open, making the ruling meaningless. Release and override both return 409, and only the ruling can move that money.

**What are the implications of split settlements?**
- *Liquidity:* all-or-nothing outcomes make every dispute high stakes, and the losing side often leaves. Splits resolve the most common real case, which is partly done work, and tend to keep both parties on the platform.
- *Legal:* this is a contractual dispute process, and its force comes from the terms users accept. It isn't statutory arbitration unless structured to be, and it doesn't remove a user's other legal rights. Have counsel review before calling it binding.
- *Tax and accounting:* a split creates a partial refund and a reduced fee, which affects invoices and indirect tax. The ledger records the final amounts, and the original total is in the audit trail.
- *Abuse:* predictable splits can invite opportunistic disputes, so dispute rates per user are worth tracking. That isn't built.

**Why rewrite the amounts on a split, in an "immutable" ledger?**
A fair challenge. The row is rewritten to what was actually paid so that every aggregate stays correct with no special cases, and the original total and the ruling are in the audit log. A stricter design has an append-only ledger of entries. That's the right next step before handling real money, and the current ledger is better described as "no raw edits, only audited transitions".

### Operations and auditing

**Why an append-only audit trail, and how is it enforced?**
It answers "who did this, when, and why" after the fact, which is needed for fraud investigation, disputes and compliance, and it deters misuse by insiders. A database trigger rejects `UPDATE`, `DELETE` and `TRUNCATE`, so a bug in the application can't rewrite history. Rows have no foreign key to users, so they outlive deleted accounts. Sensitive request fields are filtered out.

*Limits to volunteer:*
- A database superuser can drop the trigger. Tamper evidence needs hash-chaining or shipping rows to separate storage.
- Rows are written just after the response, outside the transaction, so a crash in that gap loses a row. Money paths should write inside the transaction before going live.
- Failed attempts and read access aren't recorded.

**Where would this break at scale?**
- List endpoints return all rows with no pagination, and some load large relations. This is the first thing to fix, and it matters well before anything else here.
- Analytics aggregates in application code. Use `date_trunc` in SQL, then rollup tables.
- The rate limiter is per process, so it needs a shared store with multiple instances.
- Audit rows grow forever, and need partitioning and archiving.

## 6. Demo script

**Setup:** run section 1. Sign in with the admin account in `creds.md`. Keep a second browser or a terminal ready to show the API refusing requests.

### Opening (30 seconds)
"This console governs a three-sided marketplace. Three things to watch: the numbers come from the database, the API enforces permissions rather than the UI, and money only moves through audited transitions."

### 1. Dashboard
1. Point to GMV and revenue. "GMV is committed money, held plus released. Revenue only counts released fees, because a fee in escrow can still be refunded."
2. Point to the dispute count and KYC rate.
3. **Anticipate:** "Why no trend arrows?" We removed them. They were static decoration, and we don't yet compute a prior-period comparison.

### 2. Analytics
1. Click 7D, 30D, 90D, YTD. "Daily, 5-day, 15-day, and calendar two-month."
2. Show the peak label, then the category table. "Shares come from the same payments as the chart, so they reconcile."
3. Click Export CSV. It is a real CSV.
4. **Point out:** buckets use the settlement date, so revenue lands when money moved.

### 3. Clients
1. Open the client showing Pending KYC. Show the manager roster.
2. Reject, then approve. Reload to prove it persisted.
3. Suspend a client. "If they're signed in, their next request fails, because the guard checks status every time, rather than waiting for the token to expire."
4. **Be ready:** KYC is a single level and doesn't yet gate anything.

### 4. Gig professionals
1. Open a profile: skills, portfolio links, real rating and review count.
2. Award Top Rated, then reload.
3. **Point out:** a professional with no reviews shows a dash. That used to be a hardcoded 4.9.

### 5. Managers
1. Show the in-progress task count.
2. Suspend a seat. "Assignments stay, so nothing is orphaned, and the client can reassign. A suspended manager can't be given new work."
3. Reactivate.

### 6. Projects
1. Open a task: escrow state, fee, supervisor, deliverables.
2. **Try this:** override a task with funds in escrow to Completed. It refuses. "Otherwise the money would be stranded."

### 7. Payments
1. Filter to Held in Escrow. "The ledger is read-only. There are no raw edit routes."
2. Try releasing on a task with an open dispute. It refuses with 409.
3. Refund the contract without a dispute, giving a reason.
4. **Be ready:** say early that escrow is simulated and per contract.

### 8. Reviews
1. Open the Flagged Queue. Hide a review. "It stays as evidence, but leaves the rating average immediately."
2. **Be ready:** flagging is a word list that routes to a person, not a classifier.

### 9. Disputes (the centrepiece)
1. Show the SLA column. "This is derived live, and goes negative when breached."
2. Open a docket: evidence links, and the amount held. Open the one with no evidence to show it handles that.
3. Choose SPLIT at 50%, add notes, and execute. Read the toast: client, professional and platform amounts.
4. Go to Payments and show the row changed, then to the audit trail and show the ruling.
5. "The money and verdict commit in one transaction. Running it twice returns 409, and if there's nothing in escrow it rolls back and stays open."
6. **Be ready:** there's no screen for users to file disputes yet.

### 10. Admin staff
1. Open Invite and change the tier. Watch the checkboxes change from 9 to 2.
2. Choose Financial Admin, generate, and copy the link and password.
3. Show the row with status INVITED.
4. Open the audit tab: real actor, IP, action, target and reason.
5. **Try this in a terminal** to prove enforcement. Invite and activate an Auditor, then copy their token from `g4g_admin_token` in the browser's session storage:

```bash
curl -X PUT localhost:5000/api/admin/settings \
  -H "Authorization: Bearer $AUDITOR_TOKEN" -H "Content-Type: application/json" \
  -d '{"maintenanceMode":true}'
# 403 {"message":"Requires permission: settings:manage"}
```

### 13. Invite activation
1. In a private window, open the link. Enter the one-time password and a new one.
2. It lands in a reduced console for that tier.
3. Open the same link again and try to activate. It's refused. "One use, even if two requests race."

### 11. Profile
1. Show the real provisioning date.
2. Enroll 2FA with a phone. Enter a wrong code, and it refuses. Enter the right one.
3. Sign out and back in: it asks for the code.
4. Open a second browser signed in as the same admin. Click Sign Out All Other Devices. The other browser is logged out on its next click, and this one stays in.
5. **Be ready:** no recovery codes or hardware keys yet.

### 12. Settings
1. Change the rake to 12% and save. Reload. "It's persisted, not held in memory."
2. "Existing contracts keep their fee. Only new hires use this."
3. Turn on maintenance mode. In a client session, try to post a task: 503. Admins keep working, so they can turn it off. **Turn it off.**
4. **Reset the rake to 10% before moving on.**

### Closing
"The theme throughout is that the UI is a convenience and the server is the authority. Here's what I'd build next, in order: pagination, a dispute filing screen, a real payment provider with a double-entry ledger, then mandatory WebAuthn for owners."

## 7. Hard questions

| Question | Answer |
| --- | --- |
| Is this production ready? | No. The workflows are real, but escrow is simulated and lists aren't paginated. It's a sound core, not a launch candidate |
| What happens if the audit write fails? | The action has already succeeded. The failure goes to stderr, and the row is lost. Acceptable here; money paths should write it in the transaction |
| Can an Auditor do anything harmful? | Not through mutation routes: they need a grant the Auditor doesn't have. They can read the ledger and user data, which is the role's purpose. Reads aren't logged |
| Can an admin escalate themselves? | Not through invitations, since you can't grant what you don't hold. Admin accounts can't be edited through the user routes. OWNER can't be removed or suspended |
| What if two admins rule on one dispute at once? | The status update is conditional. One gets 200, the other gets 409, and the transaction ensures money moves once |
| Why 7-day tokens? | Convenience, made tolerable by instant revocation. For admins, shorter sessions with refresh would be better |
| Why is the TOTP secret encrypted but the key derived from `JWT_SECRET`? | It stops a database-only leak yielding working seeds. The downside is that rotating the secret forces re-enrollment. A dedicated key in a KMS is the next step |
| Can a TOTP code be reused? | Within its 90-second window, yes. It's a known limit, marked in the code. The fix is to store the last used step |
| Where's the test evidence? | `apps/backend/src/modules/admin/admin.governance.test.ts`: `npm run test:admin` with `ALLOW_DB_TESTS=true` and a local throwaway `DATABASE_URL` |

## 8. Remaining work, in priority order

1. Paginate admin list endpoints.
2. Add a dispute filing flow for clients and professionals.
3. Integrate a licensed payment provider and move to a double-entry ledger.
4. Add recovery codes, then make 2FA mandatory for owners, then add WebAuthn.
5. Write audit rows inside money transactions, and add hash-chaining.
6. Replace the remaining `any` types in the admin frontend (about 60), mostly untyped API responses. The build passes, but these aren't checked.
7. Enforce `allowedCategories`, add a cancelled task status (a refunded task currently closes as `completed`), and add an edit screen for staff permissions.
8. Remove `creds.md` from version control, and point `apps/backend/.env` at the database you actually use.
