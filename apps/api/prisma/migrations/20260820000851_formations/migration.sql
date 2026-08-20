-- CreateEnum
CREATE TYPE "FormationAudience" AS ENUM ('children', 'teenagers', 'young_adults', 'adults_parents', 'all');

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" "FormationAudience" NOT NULL DEFAULT 'all',
    "ageRange" TEXT,
    "moduleCount" INTEGER,
    "color" TEXT,
    "icon" TEXT,
    "prerequisites" TEXT,
    "openAccess" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Formation_status_audience_idx" ON "Formation"("status", "audience");
