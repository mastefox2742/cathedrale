-- CreateEnum
CREATE TYPE "CelebrationType" AS ENUM ('mass', 'confession', 'adoration', 'office', 'other');

-- CreateTable
CREATE TABLE "MassSchedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "celebrationType" "CelebrationType" NOT NULL DEFAULT 'mass',
    "date" TIMESTAMP(3),
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "location" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "recurrence" TEXT,
    "note" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "MassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MassSchedule_status_date_idx" ON "MassSchedule"("status", "date");
