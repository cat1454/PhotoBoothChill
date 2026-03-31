import { buildAssetKey, PhotoProcessJobPayload } from "@photobooth/shared";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import sharp from "sharp";

import { WorkerEnv } from "../config/env.js";
import { LocalStorage } from "../storage/local-storage.js";

export async function handlePhotoProcessJob(
  prisma: PrismaClient,
  storage: LocalStorage,
  env: WorkerEnv,
  payload: PhotoProcessJobPayload
): Promise<void> {
  console.log(`[worker] start photo.process photoId=${payload.photoId} sessionId=${payload.sessionId}`);

  const asset = await prisma.photoAsset.findUniqueOrThrow({
    where: { id: payload.photoId },
    include: { session: true }
  });

  if (!asset.originalKey) {
    await prisma.photoAsset.update({
      where: { id: asset.id },
      data: { processingStatus: "FAILED" }
    });
    await prisma.photoSession.update({
      where: { id: asset.sessionId },
      data: { status: "FAILED" }
    });
    throw new Error("Photo asset does not have an original key.");
  }

  try {
    await prisma.photoAsset.update({
      where: { id: asset.id },
      data: { processingStatus: "PROCESSING" }
    });

    const originalBuffer = await storage.readObject(asset.originalKey);
    const processedBuffer = await sharp(originalBuffer).rotate().jpeg({ quality: 90 }).toBuffer();
    const previewBuffer = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 720, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const qrBuffer = await QRCode.toBuffer(`${env.webPublicUrl}/result/${asset.id}`, {
      type: "png",
      width: 512
    });

    const processedKey = buildAssetKey("processed", `${asset.id}.jpg`);
    const previewKey = buildAssetKey("preview", `${asset.id}.jpg`);
    const qrKey = buildAssetKey("qr", `${asset.id}.png`);

    await storage.putObject(processedKey, processedBuffer);
    await storage.putObject(previewKey, previewBuffer);
    await storage.putObject(qrKey, qrBuffer);

    await prisma.photoAsset.update({
      where: { id: asset.id },
      data: {
        processingStatus: "PROCESSED",
        processedKey,
        previewKey,
        qrCodeKey: qrKey
      }
    });

    await prisma.photoSession.update({
      where: { id: asset.sessionId },
      data: {
        status: "PROCESSED"
      }
    });

    console.log(`[worker] completed photo.process photoId=${payload.photoId} sessionId=${payload.sessionId}`);
  } catch (error) {
    await prisma.photoAsset.update({
      where: { id: asset.id },
      data: { processingStatus: "FAILED" }
    });
    await prisma.photoSession.update({
      where: { id: asset.sessionId },
      data: { status: "FAILED" }
    });
    console.error(`[worker] failed photo.process photoId=${payload.photoId} sessionId=${payload.sessionId}`);
    throw error;
  }
}