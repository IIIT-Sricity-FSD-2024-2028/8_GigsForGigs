-- Admin governance: reconciles schema drift and adds the columns that make the
-- Super Admin vertical real (persistent audit trail, RBAC, session revocation,
-- TOTP, persistent settings).
--
-- Every statement is idempotent. Commit 1ca41cc changed schema.prisma without a
-- migration, so databases exist in two states: ones updated with `db push`
-- (columns present) and ones updated with `migrate deploy` (columns absent).
-- IF NOT EXISTS lets this single file bring both, and a fresh install, to the
-- same place.

-- 1. Drift from 1ca41cc -------------------------------------------------------
ALTER TABLE "USERS" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "USERS" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CLIENT" ADD COLUMN IF NOT EXISTS "kyc_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING';
ALTER TABLE "GIG_PROFESSIONAL_PROFILE" ADD COLUMN IF NOT EXISTS "badge" VARCHAR(50);
ALTER TABLE "REVIEWS" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "REVIEWS" ADD COLUMN IF NOT EXISTS "moderator_notes" VARCHAR(500);

CREATE TABLE IF NOT EXISTS "DISPUTES" (
  "dispute_id" SERIAL NOT NULL,
  "task_id" INTEGER NOT NULL,
  "filed_by_user_id" INTEGER NOT NULL,
  "against_user_id" INTEGER NOT NULL,
  "dispute_amount" DECIMAL(10,2) NOT NULL,
  "reason" VARCHAR(255) NOT NULL,
  "description" VARCHAR(1000) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sla_hours_left" INTEGER NOT NULL DEFAULT 48,
  "resolution_notes" VARCHAR(1000),
  "settlement_type" VARCHAR(50),
  "split_percent" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DISPUTES_pkey" PRIMARY KEY ("dispute_id"),
  CONSTRAINT "DISPUTES_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TASKS"("task_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DISPUTES_filed_by_user_id_fkey" FOREIGN KEY ("filed_by_user_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DISPUTES_against_user_id_fkey" FOREIGN KEY ("against_user_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- New clients must be reviewed; the old VERIFIED default made KYC meaningless.
ALTER TABLE "CLIENT" ALTER COLUMN "kyc_status" SET DEFAULT 'PENDING';

-- 2. Sessions, 2FA, RBAC ------------------------------------------------------
ALTER TABLE "USERS" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "USERS" ADD COLUMN IF NOT EXISTS "totp_secret" VARCHAR(255);
ALTER TABLE "USERS" ADD COLUMN IF NOT EXISTS "admin_tier" VARCHAR(50);
ALTER TABLE "USERS" ADD COLUMN IF NOT EXISTS "admin_permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Tier used to live in a process-memory Map with an email-substring fallback.
-- Persist what admins effectively had, once, so nobody changes rank on deploy.
UPDATE "USERS" SET "admin_tier" = CASE
    WHEN lower("email") LIKE '%auditor%' THEN 'AUDITOR'
    WHEN lower("email") LIKE '%finance%' THEN 'FINANCIAL_ADMIN'
    WHEN lower("email") LIKE '%support%' THEN 'SUPPORT_ADMIN'
    WHEN lower("email") LIKE '%moderator%' THEN 'CONTENT_MODERATOR'
    ELSE 'SUPER_ADMIN' END
  WHERE "role" = 'admin' AND "admin_tier" IS NULL;
UPDATE "USERS" SET "admin_tier" = 'OWNER'
  WHERE "user_id" = (SELECT min("user_id") FROM "USERS" WHERE "role" = 'admin');

UPDATE "USERS" SET "admin_permissions" = CASE "admin_tier"
    WHEN 'OWNER' THEN ARRAY['*']
    WHEN 'FINANCIAL_ADMIN' THEN ARRAY['users:read','payments:read','payments:refund','payments:release']
    WHEN 'SUPPORT_ADMIN' THEN ARRAY['users:read','disputes:resolve','reviews:moderate']
    WHEN 'CONTENT_MODERATOR' THEN ARRAY['users:read','reviews:moderate']
    WHEN 'AUDITOR' THEN ARRAY['users:read','payments:read']
    ELSE ARRAY['users:read','users:ban','payments:read','payments:refund','payments:release','disputes:resolve','reviews:moderate','settings:manage','admins:invite'] END
  WHERE "role" = 'admin' AND cardinality("admin_permissions") = 0;

-- The old toggle set this flag with no secret behind it and login ignored it.
UPDATE "USERS" SET "two_factor_enabled" = false WHERE "totp_secret" IS NULL;

-- 3. Payments: when money actually moved --------------------------------------
-- PAYMENT.created_at is contract start, so velocity charts bucketed by it put
-- a release in the month the job was hired, not the month it paid out.
ALTER TABLE "PAYMENT" ADD COLUMN IF NOT EXISTS "settled_at" TIMESTAMP(3);
UPDATE "PAYMENT" SET "settled_at" = "created_at"
  WHERE "status" IN ('completed', 'refunded') AND "settled_at" IS NULL;

-- 4. Reviews: one vocabulary --------------------------------------------------
UPDATE "REVIEWS" SET "status" = 'PUBLISHED' WHERE "status" = 'APPROVED';

-- 5. Platform settings (singleton row, was process memory) --------------------
CREATE TABLE IF NOT EXISTS "PLATFORM_SETTINGS" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "value" JSONB NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PLATFORM_SETTINGS_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PLATFORM_SETTINGS_singleton" CHECK ("id" = 1)
);

-- 6. Append-only audit trail (was a 200-entry in-memory array) ----------------
-- No FK to USERS on purpose: an audit row must outlive the account it names.
CREATE TABLE IF NOT EXISTS "AUDIT_LOG" (
  "audit_id" SERIAL NOT NULL,
  "actor_user_id" INTEGER,
  "actor_email" VARCHAR(100) NOT NULL,
  "action" VARCHAR(60) NOT NULL,
  "target" VARCHAR(255) NOT NULL,
  "details" VARCHAR(1000),
  "ip_address" VARCHAR(64),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AUDIT_LOG_pkey" PRIMARY KEY ("audit_id")
);
CREATE INDEX IF NOT EXISTS "AUDIT_LOG_created_at_idx" ON "AUDIT_LOG"("created_at");

-- Enforced by the database so no code path, including a bug in this app, can
-- rewrite history. Only a role able to drop the trigger can get around it.
CREATE OR REPLACE FUNCTION audit_log_is_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_LOG is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update_delete ON "AUDIT_LOG";
CREATE TRIGGER audit_log_no_update_delete BEFORE UPDATE OR DELETE ON "AUDIT_LOG"
  FOR EACH ROW EXECUTE FUNCTION audit_log_is_append_only();
DROP TRIGGER IF EXISTS audit_log_no_truncate ON "AUDIT_LOG";
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON "AUDIT_LOG"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_is_append_only();

-- 7. Drift: schema says removing a manager nulls the assignment (the client then
-- supervises); older migration-built databases still had a restrictive FK.
ALTER TABLE "GIG_MANAGER_ASSIGNMENT" DROP CONSTRAINT IF EXISTS "GIG_MANAGER_ASSIGNMENT_manager_id_fkey";
ALTER TABLE "GIG_MANAGER_ASSIGNMENT" ADD CONSTRAINT "GIG_MANAGER_ASSIGNMENT_manager_id_fkey"
  FOREIGN KEY ("manager_id") REFERENCES "MANAGER"("manager_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Drift: databases built with `db push` skipped the escrow backfill, leaving
-- unfunded contracts with no fee. Settled rows are left alone: they are history.
UPDATE "PAYMENT" SET "platform_fee" = ROUND("amount" * 0.10, 2)
  WHERE "platform_fee" = 0 AND "status" IN ('pending', 'held');
