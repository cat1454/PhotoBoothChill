import { createEnvelope } from "@photobooth/shared";

export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return createEnvelope(data, meta);
}

export function enumToApi(value: string): string {
  return value.toLowerCase();
}
