-- A hired task may be supervised by the client alone (no manager); the client
-- picks or changes the manager after funding the task.
ALTER TABLE "GIG_MANAGER_ASSIGNMENT" ALTER COLUMN "manager_id" DROP NOT NULL;
