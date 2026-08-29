/*
  Warnings:

  - Added the required column `updated_at` to the `TASKS` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'revoked');

-- AlterEnum
ALTER TYPE "DeliverableStatus" ADD VALUE 'closed';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'admin';

-- AlterTable
ALTER TABLE "DELIVERABLE" ADD COLUMN     "feedback" VARCHAR(500);

-- AlterTable
CREATE SEQUENCE manager_manager_id_seq;
ALTER TABLE "MANAGER" ALTER COLUMN "manager_id" SET DEFAULT nextval('manager_manager_id_seq');
ALTER SEQUENCE manager_manager_id_seq OWNED BY "MANAGER"."manager_id";

-- AlterTable
ALTER TABLE "TASKS" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SERVICE" (
    "service_id" SERIAL NOT NULL,
    "gig_profile_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "thumbnail" VARCHAR(500),
    "status" "ServiceStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SERVICE_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "SERVICE_TAGS" (
    "service_id" INTEGER NOT NULL,
    "tag" VARCHAR(100) NOT NULL,

    CONSTRAINT "SERVICE_TAGS_pkey" PRIMARY KEY ("service_id","tag")
);

-- CreateTable
CREATE TABLE "SERVICE_REQUEST" (
    "request_id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SERVICE_REQUEST_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "MANAGER_INVITE" (
    "invite_id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "accepted_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MANAGER_INVITE_pkey" PRIMARY KEY ("invite_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_service_request" ON "SERVICE_REQUEST"("service_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_manager_invite" ON "MANAGER_INVITE"("client_id", "email");

-- AddForeignKey
ALTER TABLE "SERVICE" ADD CONSTRAINT "SERVICE_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICE_TAGS" ADD CONSTRAINT "SERVICE_TAGS_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "SERVICE"("service_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICE_REQUEST" ADD CONSTRAINT "SERVICE_REQUEST_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "SERVICE"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICE_REQUEST" ADD CONSTRAINT "SERVICE_REQUEST_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "CLIENT"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MANAGER_INVITE" ADD CONSTRAINT "MANAGER_INVITE_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "CLIENT"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
