CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "LocationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
CREATE TYPE "FrameTemplateType" AS ENUM ('SINGLE', 'STRIP', 'COLLAGE');
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'KIOSK', 'RASPBERRY_PI');
CREATE TYPE "PhotoSessionStatus" AS ENUM ('CREATED', 'CAPTURED', 'UPLOADED', 'PROCESSING', 'PROCESSED', 'DELIVERED', 'FAILED');
CREATE TYPE "PhotoProcessingStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "thumbnailUrl" TEXT,
  "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FrameTemplate" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "type" "FrameTemplateType" NOT NULL DEFAULT 'SINGLE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FrameTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhotoSession" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "deviceType" "DeviceType" NOT NULL DEFAULT 'WEB',
  "status" "PhotoSessionStatus" NOT NULL DEFAULT 'CREATED',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhotoSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhotoAsset" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionId" TEXT NOT NULL,
  "selectedFrameTemplateId" TEXT,
  "processingStatus" "PhotoProcessingStatus" NOT NULL DEFAULT 'PENDING',
  "originalKey" TEXT,
  "processedKey" TEXT,
  "previewKey" TEXT,
  "qrCodeKey" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhotoAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PassportStamp" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "photoId" TEXT NOT NULL,
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PassportStamp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");
CREATE INDEX "FrameTemplate_locationId_isActive_idx" ON "FrameTemplate"("locationId", "isActive");
CREATE INDEX "PhotoSession_userId_idx" ON "PhotoSession"("userId");
CREATE INDEX "PhotoSession_locationId_idx" ON "PhotoSession"("locationId");
CREATE INDEX "PhotoSession_status_idx" ON "PhotoSession"("status");
CREATE INDEX "PhotoAsset_sessionId_idx" ON "PhotoAsset"("sessionId");
CREATE INDEX "PhotoAsset_processingStatus_idx" ON "PhotoAsset"("processingStatus");
CREATE INDEX "PassportStamp_userId_idx" ON "PassportStamp"("userId");
CREATE INDEX "PassportStamp_locationId_idx" ON "PassportStamp"("locationId");
CREATE UNIQUE INDEX "PassportStamp_userId_locationId_key" ON "PassportStamp"("userId", "locationId");

ALTER TABLE "FrameTemplate"
  ADD CONSTRAINT "FrameTemplate_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhotoSession"
  ADD CONSTRAINT "PhotoSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhotoSession"
  ADD CONSTRAINT "PhotoSession_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PhotoAsset"
  ADD CONSTRAINT "PhotoAsset_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "PhotoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhotoAsset"
  ADD CONSTRAINT "PhotoAsset_selectedFrameTemplateId_fkey"
  FOREIGN KEY ("selectedFrameTemplateId") REFERENCES "FrameTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PassportStamp"
  ADD CONSTRAINT "PassportStamp_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PassportStamp"
  ADD CONSTRAINT "PassportStamp_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PassportStamp"
  ADD CONSTRAINT "PassportStamp_photoId_fkey"
  FOREIGN KEY ("photoId") REFERENCES "PhotoAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
