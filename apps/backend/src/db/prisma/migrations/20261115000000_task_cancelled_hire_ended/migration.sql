-- A posting nobody is working on any more is "cancelled" (history is kept, unlike a hard delete).
-- A hire ended by the professional / the client is recorded as such instead of reusing "declined",
-- so that professional can apply again while a genuine rejection stays final.
ALTER TYPE "TaskStatus" ADD VALUE 'cancelled';
ALTER TYPE "ApplicationStatus" ADD VALUE 'withdrawn';
ALTER TYPE "ApplicationStatus" ADD VALUE 'removed';
