-- CreateEnum
CREATE TYPE "HomilyContentType" AS ENUM ('text', 'audio', 'video');

-- CreateTable
CREATE TABLE "Homily" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" "HomilyContentType" NOT NULL DEFAULT 'text',
    "text" TEXT,
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "celebrant" TEXT NOT NULL,
    "celebration" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER,
    "summary" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transcript" TEXT,
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "usageRights" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Homily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homily_status_date_idx" ON "Homily"("status", "date");

-- CreateIndex
CREATE INDEX "Homily_status_publishedAt_idx" ON "Homily"("status", "publishedAt");
