-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'gig_professional', 'manager');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('open', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('submitted', 'approved', 'revision_requested');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "USERS" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "hash_password" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USERS_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "CLIENT" (
    "client_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_name" VARCHAR(100) NOT NULL,
    "number_of_manager" INTEGER NOT NULL DEFAULT 0,
    "domain" VARCHAR(100),

    CONSTRAINT "CLIENT_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "MANAGER" (
    "client_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "MANAGER_pkey" PRIMARY KEY ("client_id","manager_id")
);

-- CreateTable
CREATE TABLE "GIG_PROFESSIONAL_PROFILE" (
    "gig_profile_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bio" TEXT,

    CONSTRAINT "GIG_PROFESSIONAL_PROFILE_pkey" PRIMARY KEY ("gig_profile_id")
);

-- CreateTable
CREATE TABLE "PROFILE_SKILLS" (
    "gig_profile_id" INTEGER NOT NULL,
    "skill" VARCHAR(100) NOT NULL,

    CONSTRAINT "PROFILE_SKILLS_pkey" PRIMARY KEY ("gig_profile_id","skill")
);

-- CreateTable
CREATE TABLE "PROFILE_TOOLS" (
    "gig_profile_id" INTEGER NOT NULL,
    "tool" VARCHAR(100) NOT NULL,

    CONSTRAINT "PROFILE_TOOLS_pkey" PRIMARY KEY ("gig_profile_id","tool")
);

-- CreateTable
CREATE TABLE "PROFILE_PORTFOLIO" (
    "gig_profile_id" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,

    CONSTRAINT "PROFILE_PORTFOLIO_pkey" PRIMARY KEY ("gig_profile_id","url")
);

-- CreateTable
CREATE TABLE "TASKS" (
    "task_id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(10,2) NOT NULL,
    "due_date" DATE,
    "status" "TaskStatus" NOT NULL DEFAULT 'open',

    CONSTRAINT "TASKS_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "APPLICATION" (
    "application_id" SERIAL NOT NULL,
    "gig_profile_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APPLICATION_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "GIG_MANAGER_ASSIGNMENT" (
    "gig_profile_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GIG_MANAGER_ASSIGNMENT_pkey" PRIMARY KEY ("gig_profile_id","task_id")
);

-- CreateTable
CREATE TABLE "DELIVERABLE" (
    "task_id" INTEGER NOT NULL,
    "deliverable_no" INTEGER NOT NULL,
    "gig_profile_id" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "submission_path" VARCHAR(500) NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'submitted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DELIVERABLE_pkey" PRIMARY KEY ("task_id","deliverable_no")
);

-- CreateTable
CREATE TABLE "PAYMENT" (
    "payment_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "gig_profile_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PAYMENT_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "REVIEWS" (
    "review_id" SERIAL NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewee_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "REVIEWS_pkey" PRIMARY KEY ("review_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USERS_email_key" ON "USERS"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CLIENT_user_id_key" ON "CLIENT"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MANAGER_user_id_key" ON "MANAGER"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MANAGER_manager_id_key" ON "MANAGER"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "GIG_PROFESSIONAL_PROFILE_user_id_key" ON "GIG_PROFESSIONAL_PROFILE"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_application" ON "APPLICATION"("gig_profile_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payment" ON "PAYMENT"("task_id", "gig_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_review" ON "REVIEWS"("reviewer_id", "reviewee_id", "task_id");

-- AddForeignKey
ALTER TABLE "CLIENT" ADD CONSTRAINT "CLIENT_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MANAGER" ADD CONSTRAINT "MANAGER_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "CLIENT"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MANAGER" ADD CONSTRAINT "MANAGER_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GIG_PROFESSIONAL_PROFILE" ADD CONSTRAINT "GIG_PROFESSIONAL_PROFILE_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROFILE_SKILLS" ADD CONSTRAINT "PROFILE_SKILLS_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROFILE_TOOLS" ADD CONSTRAINT "PROFILE_TOOLS_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROFILE_PORTFOLIO" ADD CONSTRAINT "PROFILE_PORTFOLIO_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TASKS" ADD CONSTRAINT "TASKS_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "CLIENT"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APPLICATION" ADD CONSTRAINT "APPLICATION_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APPLICATION" ADD CONSTRAINT "APPLICATION_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TASKS"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GIG_MANAGER_ASSIGNMENT" ADD CONSTRAINT "GIG_MANAGER_ASSIGNMENT_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GIG_MANAGER_ASSIGNMENT" ADD CONSTRAINT "GIG_MANAGER_ASSIGNMENT_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TASKS"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GIG_MANAGER_ASSIGNMENT" ADD CONSTRAINT "GIG_MANAGER_ASSIGNMENT_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "MANAGER"("manager_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DELIVERABLE" ADD CONSTRAINT "DELIVERABLE_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TASKS"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DELIVERABLE" ADD CONSTRAINT "DELIVERABLE_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DELIVERABLE" ADD CONSTRAINT "DELIVERABLE_gig_profile_id_task_id_fkey" FOREIGN KEY ("gig_profile_id", "task_id") REFERENCES "GIG_MANAGER_ASSIGNMENT"("gig_profile_id", "task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PAYMENT" ADD CONSTRAINT "PAYMENT_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TASKS"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PAYMENT" ADD CONSTRAINT "PAYMENT_gig_profile_id_fkey" FOREIGN KEY ("gig_profile_id") REFERENCES "GIG_PROFESSIONAL_PROFILE"("gig_profile_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REVIEWS" ADD CONSTRAINT "REVIEWS_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REVIEWS" ADD CONSTRAINT "REVIEWS_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "USERS"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REVIEWS" ADD CONSTRAINT "REVIEWS_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "TASKS"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;
