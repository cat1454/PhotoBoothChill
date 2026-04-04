export const PHOTO_PROCESS_JOB_NAME = "photo.process";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LOCATION_STATUSES = ["draft", "active", "inactive"] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export const FRAME_TEMPLATE_TYPES = ["single", "strip", "collage"] as const;
export type FrameTemplateType = (typeof FRAME_TEMPLATE_TYPES)[number];

export const DEVICE_TYPES = ["web", "kiosk", "raspberry_pi"] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const PHOTO_SESSION_STATUSES = [
  "created",
  "captured",
  "uploaded",
  "processing",
  "processed",
  "delivered",
  "failed"
] as const;
export type PhotoSessionStatus = (typeof PHOTO_SESSION_STATUSES)[number];

export const PHOTO_PROCESSING_STATUSES = [
  "pending",
  "queued",
  "processing",
  "processed",
  "failed"
] as const;
export type PhotoProcessingStatus = (typeof PHOTO_PROCESSING_STATUSES)[number];

export interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown>;
  error: null | {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface JwtUser {
  sub: string;
  email: string;
  role: UserRole;
}

export interface PhotoProcessJobPayload {
  photoId: string;
  sessionId: string;
  frameTemplateId?: string;
  requestedBy: string;
}

export interface ApiLocation {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: LocationStatus;
}

export interface ApiFrameTemplate {
  id: string;
  name: string;
  locationId: string;
  imageUrl: string;
  type: FrameTemplateType;
  isActive: boolean;
}

export interface ApiPhotoAsset {
  id: string;
  sessionId: string;
  processingStatus: PhotoProcessingStatus;
  selectedFrameTemplateId: string | null;
  originalUrl: string | null;
  processedUrl: string | null;
  previewUrl: string | null;
  qrCodeUrl: string | null;
  originalsArchiveUrl: string | null;
  animatedFrameUrl: string | null;
}

export interface ApiPhotoSession {
  id: string;
  userId: string;
  locationId: string;
  deviceType: DeviceType;
  status: PhotoSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPassportStamp {
  id: string;
  userId: string;
  locationId: string;
  photoId: string;
  earnedAt: string;
}

export interface SourceBundleShotEntry {
  shotId: string;
  stillPath: string;
  stillMimeType: string;
  capturedAt: string;
  durationSeconds: number;
}

export interface SourceBundleSlotEntry {
  slotIndex: number;
  shotId: string;
  stillPath: string;
  clipPath: string | null;
  clipMimeType: string | null;
  durationSeconds: number;
}

export interface PhotoSourceBundleMetadata {
  version: 1;
  photoId: string;
  sessionId: string;
  locationId: string;
  frameTemplateId: string | null;
  shotCount: number;
  slotCount: number;
  createdAt: string;
  shots: SourceBundleShotEntry[];
  slots: SourceBundleSlotEntry[];
}

export function createEnvelope<T>(data: T, meta: Record<string, unknown> = {}): ApiEnvelope<T> {
  return {
    data,
    meta,
    error: null
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildAssetKey(
  type: "original" | "processed" | "preview" | "qr" | "source" | "archive" | "animated",
  filename: string
): string {
  return `${type}/${filename}`;
}