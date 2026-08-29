-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'shortlisted';

-- AlterTable
ALTER TABLE "APPLICATION" ADD COLUMN     "hourly_rate" DECIMAL(8,2),
ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "MANAGER" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TASKS" ADD COLUMN     "category" VARCHAR(50),
ADD COLUMN     "duration" VARCHAR(50),
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
