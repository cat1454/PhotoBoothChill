import {
  DeviceType,
  FrameTemplateType,
  LocationStatus,
  PhotoProcessingStatus,
  PhotoSessionStatus
} from "@prisma/client";

function assertEnumValue<T>(map: Record<string, T>, value: string | undefined, fallback?: T, label = "enum"): T {
  if (!value) {
    if (fallback) {
      return fallback;
    }
    throw new Error(`Missing ${label}.`);
  }

  const normalized = value.toLowerCase();
  const found = map[normalized];
  if (!found) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return found;
}

const deviceTypeMap: Record<string, DeviceType> = {
  web: DeviceType.WEB,
  kiosk: DeviceType.KIOSK,
  raspberry_pi: DeviceType.RASPBERRY_PI
};

const locationStatusMap: Record<string, LocationStatus> = {
  draft: LocationStatus.DRAFT,
  active: LocationStatus.ACTIVE,
  inactive: LocationStatus.INACTIVE
};

const frameTemplateTypeMap: Record<string, FrameTemplateType> = {
  single: FrameTemplateType.SINGLE,
  strip: FrameTemplateType.STRIP,
  collage: FrameTemplateType.COLLAGE
};

const photoSessionStatusMap: Record<string, PhotoSessionStatus> = {
  created: PhotoSessionStatus.CREATED,
  captured: PhotoSessionStatus.CAPTURED,
  uploaded: PhotoSessionStatus.UPLOADED,
  processing: PhotoSessionStatus.PROCESSING,
  processed: PhotoSessionStatus.PROCESSED,
  delivered: PhotoSessionStatus.DELIVERED,
  failed: PhotoSessionStatus.FAILED
};

const photoProcessingStatusMap: Record<string, PhotoProcessingStatus> = {
  pending: PhotoProcessingStatus.PENDING,
  queued: PhotoProcessingStatus.QUEUED,
  processing: PhotoProcessingStatus.PROCESSING,
  processed: PhotoProcessingStatus.PROCESSED,
  failed: PhotoProcessingStatus.FAILED
};

export function parseDeviceType(value?: string): DeviceType {
  return assertEnumValue(deviceTypeMap, value, DeviceType.WEB, "deviceType");
}

export function parseLocationStatus(value?: string): LocationStatus {
  return assertEnumValue(locationStatusMap, value, LocationStatus.ACTIVE, "status");
}

export function parseOptionalLocationStatus(value?: string): LocationStatus | undefined {
  return value ? assertEnumValue(locationStatusMap, value, undefined, "status") : undefined;
}

export function parseFrameTemplateType(value?: string): FrameTemplateType {
  return assertEnumValue(frameTemplateTypeMap, value, FrameTemplateType.SINGLE, "type");
}

export function parseOptionalFrameTemplateType(value?: string): FrameTemplateType | undefined {
  return value ? assertEnumValue(frameTemplateTypeMap, value, undefined, "type") : undefined;
}

export function parsePhotoSessionStatus(value: string): PhotoSessionStatus {
  return assertEnumValue(photoSessionStatusMap, value, undefined, "status");
}

export function parsePhotoProcessingStatus(value: string): PhotoProcessingStatus {
  return assertEnumValue(photoProcessingStatusMap, value, undefined, "processingStatus");
}
