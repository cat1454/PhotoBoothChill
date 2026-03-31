export const PHOTO_PROCESS_JOB_NAME = "photo.process";
export const USER_ROLES = ["user", "admin"];
export const LOCATION_STATUSES = ["draft", "active", "inactive"];
export const FRAME_TEMPLATE_TYPES = ["single", "strip", "collage"];
export const DEVICE_TYPES = ["web", "kiosk", "raspberry_pi"];
export const PHOTO_SESSION_STATUSES = [
    "created",
    "captured",
    "uploaded",
    "processing",
    "processed",
    "delivered",
    "failed"
];
export const PHOTO_PROCESSING_STATUSES = [
    "pending",
    "queued",
    "processing",
    "processed",
    "failed"
];
export function createEnvelope(data, meta = {}) {
    return {
        data,
        meta,
        error: null
    };
}
export function slugify(input) {
    return input
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}
export function buildAssetKey(type, filename) {
    return `${type}/${filename}`;
}
//# sourceMappingURL=index.js.map