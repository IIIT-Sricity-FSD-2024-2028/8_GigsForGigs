-- Services get a real category (same keys as task categories) so clients can filter by it.
ALTER TABLE "SERVICE" ADD COLUMN "category" VARCHAR(50);
