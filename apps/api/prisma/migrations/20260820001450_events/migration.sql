-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('liturgy', 'formation', 'youth', 'catechism', 'family', 'social', 'meeting', 'live', 'solidarity_campaign');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'meeting',
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "responsible" TEXT,
    "imageUrl" TEXT,
    "documentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxParticipants" INTEGER,
    "liveUrl" TEXT,
    "replayUrl" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_status_date_idx" ON "Event"("status", "date");

-- CreateIndex
CREATE INDEX "Event_status_type_idx" ON "Event"("status", "type");
