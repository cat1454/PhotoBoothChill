import { zipSync, strToU8 } from "fflate";

import type { PhotoSourceBundleMetadata } from "@photobooth/shared";

import type { CaptureBundle, SlotAssignment } from "./capture";

function normalizeSlotAssignments(slotAssignments: SlotAssignment[], slotCount: number): SlotAssignment[] {
  const byIndex = new Map(slotAssignments.map((assignment) => [assignment.slotIndex, assignment.shotId ?? null]));
  return Array.from({ length: slotCount }, (_, index) => ({
    slotIndex: index,
    shotId: byIndex.get(index) ?? null
  }));
}

function extensionFromMimeType(mimeType: string | null | undefined, fallback: string): string {
  if (!mimeType) {
    return fallback;
  }

  if (mimeType.includes("png")) {
    return "png";
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "jpg";
  }

  if (mimeType.includes("mp4")) {
    return "mp4";
  }

  if (mimeType.includes("webm")) {
    return "webm";
  }

  return fallback;
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

export async function buildSourceBundleFile(input: {
  photoId: string;
  sessionId: string;
  locationId: string;
  frameTemplateId: string | null;
  bundle: CaptureBundle;
}): Promise<File> {
  const files: Record<string, Uint8Array> = {};

  const shots = await Promise.all(
    input.bundle.shots.map(async (shot, index) => {
      const stillExtension = extensionFromMimeType(shot.stillBlob.type, "jpg");
      const stillPath = `shots/shot-${index + 1}.${stillExtension}`;
      files[stillPath] = await blobToBytes(shot.stillBlob);

      return {
        shotId: shot.shotId,
        stillPath,
        stillMimeType: shot.stillBlob.type || `image/${stillExtension}`,
        capturedAt: shot.capturedAt,
        durationSeconds: shot.durationSeconds
      };
    })
  );

  const normalizedSlots = normalizeSlotAssignments(input.bundle.slotAssignments, input.bundle.slotCount);
  const slots = await Promise.all(
    normalizedSlots
      .filter((slot) => Boolean(slot.shotId))
      .map(async (slot) => {
        const shot = input.bundle.shots.find((item) => item.shotId === slot.shotId)!;
        const stillEntry = shots.find((item) => item.shotId === slot.shotId)!;
        let clipPath: string | null = null;
        let clipMimeType: string | null = null;

        if (shot.clipBlob) {
          const clipExtension = extensionFromMimeType(shot.clipBlob.type, "webm");
          clipPath = `clips/slot-${slot.slotIndex + 1}.${clipExtension}`;
          clipMimeType = shot.clipBlob.type || `video/${clipExtension}`;
          files[clipPath] = await blobToBytes(shot.clipBlob);
        }

        return {
          slotIndex: slot.slotIndex,
          shotId: shot.shotId,
          stillPath: stillEntry.stillPath,
          clipPath,
          clipMimeType,
          durationSeconds: shot.durationSeconds
        };
      })
  );

  const metadata: PhotoSourceBundleMetadata = {
    version: 1,
    photoId: input.photoId,
    sessionId: input.sessionId,
    locationId: input.locationId,
    frameTemplateId: input.frameTemplateId,
    shotCount: input.bundle.shotCount,
    slotCount: input.bundle.slotCount,
    createdAt: new Date().toISOString(),
    shots,
    slots
  };

  files["metadata.json"] = strToU8(JSON.stringify(metadata, null, 2));
  const zipped = zipSync(files, { level: 0 });
  const zipBuffer = zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
  return new File([zipBuffer], `${input.photoId}-source-bundle.zip`, { type: "application/zip" });
}