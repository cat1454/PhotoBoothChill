ALTER TABLE "PhotoAsset"
  ADD COLUMN "publicShareToken" TEXT,
  ADD COLUMN "sourceBundleKey" TEXT,
  ADD COLUMN "originalsArchiveKey" TEXT,
  ADD COLUMN "animatedFrameKey" TEXT;

CREATE UNIQUE INDEX "PhotoAsset_publicShareToken_key" ON "PhotoAsset"("publicShareToken");