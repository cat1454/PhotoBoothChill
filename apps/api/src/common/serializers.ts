import { enumToApi } from "./api.js";

interface PublicStorage {
  getPublicUrl(key: string): string;
}

export function serializeUser(user: { id: string; fullName: string; email: string; role: string }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: enumToApi(user.role)
  };
}

export function serializeLocation(location: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
}) {
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
    description: location.description,
    thumbnailUrl: location.thumbnailUrl,
    status: enumToApi(location.status)
  };
}

export function serializeFrameTemplate(frame: {
  id: string;
  name: string;
  locationId: string;
  imageUrl: string;
  type: string;
  isActive: boolean;
}) {
  return {
    id: frame.id,
    name: frame.name,
    locationId: frame.locationId,
    imageUrl: frame.imageUrl,
    type: enumToApi(frame.type),
    isActive: frame.isActive
  };
}

export function serializePhotoSession(session: {
  id: string;
  userId: string;
  locationId: string;
  deviceType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: session.id,
    userId: session.userId,
    locationId: session.locationId,
    deviceType: enumToApi(session.deviceType),
    status: enumToApi(session.status),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString()
  };
}

export function serializePhotoAsset(
  asset: {
    id: string;
    sessionId: string;
    selectedFrameTemplateId: string | null;
    processingStatus: string;
    originalKey: string | null;
    processedKey: string | null;
    previewKey: string | null;
    qrCodeKey: string | null;
  },
  storage: PublicStorage
) {
  return {
    id: asset.id,
    sessionId: asset.sessionId,
    selectedFrameTemplateId: asset.selectedFrameTemplateId,
    processingStatus: enumToApi(asset.processingStatus),
    originalUrl: asset.originalKey ? storage.getPublicUrl(asset.originalKey) : null,
    processedUrl: asset.processedKey ? storage.getPublicUrl(asset.processedKey) : null,
    previewUrl: asset.previewKey ? storage.getPublicUrl(asset.previewKey) : null,
    qrCodeUrl: asset.qrCodeKey ? storage.getPublicUrl(asset.qrCodeKey) : null
  };
}

export function serializePassportStamp(stamp: {
  id: string;
  userId: string;
  locationId: string;
  photoId: string;
  earnedAt: Date;
}) {
  return {
    id: stamp.id,
    userId: stamp.userId,
    locationId: stamp.locationId,
    photoId: stamp.photoId,
    earnedAt: stamp.earnedAt.toISOString()
  };
}
