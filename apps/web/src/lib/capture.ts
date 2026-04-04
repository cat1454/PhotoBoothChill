export interface SlotAssignment {
  slotIndex: number;
  shotId: string | null;
}

interface PersistedCapturedShot {
  shotId: string;
  stillBlob: Blob;
  clipBlob: Blob | null;
  capturedAt: string;
  durationSeconds: number;
}

export interface CapturedShot extends PersistedCapturedShot {
  stillObjectUrl: string;
  clipObjectUrl: string | null;
}

interface PersistedCaptureBundle {
  sessionId: string;
  locationId: string;
  frameId: string | null;
  shotCount: number;
  clipSeconds: number;
  slotCount: number;
  shots: PersistedCapturedShot[];
  slotAssignments: SlotAssignment[];
  updatedAt: string;
}

export interface CaptureBundle extends Omit<PersistedCaptureBundle, "shots"> {
  shots: CapturedShot[];
}

const DB_NAME = "photobooth-capture-db";
const STORE_NAME = "capture-bundles";
const DB_VERSION = 1;
const LAST_CAPTURE_KEY = 'photobooth.capture.last';

function getIndexedDb(): IDBFactory {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is unavailable in this browser.");
  }

  return indexedDB;
}

function createDefaultSlotAssignments(slotCount: number): SlotAssignment[] {
  return Array.from({ length: slotCount }, (_, index) => ({
    slotIndex: index,
    shotId: null
  }));
}

function normalizeSlotAssignments(slotAssignments: SlotAssignment[], slotCount: number): SlotAssignment[] {
  const byIndex = new Map(slotAssignments.map((assignment) => [assignment.slotIndex, assignment.shotId ?? null]));
  return createDefaultSlotAssignments(slotCount).map((assignment) => ({
    slotIndex: assignment.slotIndex,
    shotId: byIndex.get(assignment.slotIndex) ?? null
  }));
}


function setLastCaptureContext(sessionId: string, locationId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LAST_CAPTURE_KEY,
    JSON.stringify({
      sessionId,
      locationId,
      updatedAt: new Date().toISOString()
    })
  );
}

export function getLastCaptureContext(): { sessionId: string; locationId: string } | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LAST_CAPTURE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { sessionId?: string; locationId?: string };
    if (!parsed.sessionId || !parsed.locationId) {
      return null;
    }

    return {
      sessionId: parsed.sessionId,
      locationId: parsed.locationId
    };
  } catch {
    return null;
  }
}

function clearLastCaptureContext(sessionId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!sessionId) {
    window.localStorage.removeItem(LAST_CAPTURE_KEY);
    return;
  }

  const current = getLastCaptureContext();
  if (current?.sessionId === sessionId) {
    window.localStorage.removeItem(LAST_CAPTURE_KEY);
  }
}
function hydrateCaptureBundle(bundle: PersistedCaptureBundle): CaptureBundle {
  return {
    ...bundle,
    shots: bundle.shots.map((shot) => ({
      ...shot,
      stillObjectUrl: URL.createObjectURL(shot.stillBlob),
      clipObjectUrl: shot.clipBlob ? URL.createObjectURL(shot.clipBlob) : null
    }))
  };
}

async function openCaptureDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Unable to open capture database."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "sessionId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPersistedBundle(sessionId: string): Promise<PersistedCaptureBundle | null> {
  const database = await openCaptureDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(sessionId);
    request.onerror = () => reject(request.error ?? new Error("Unable to read capture bundle."));
    request.onsuccess = () => resolve((request.result as PersistedCaptureBundle | undefined) ?? null);
    transaction.oncomplete = () => database.close();
  });
}

async function putPersistedBundle(bundle: PersistedCaptureBundle): Promise<void> {
  const database = await openCaptureDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(bundle);
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to save capture bundle."));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}

async function deletePersistedBundle(sessionId: string): Promise<void> {
  const database = await openCaptureDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(sessionId);
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to delete capture bundle."));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}

async function clearPersistedBundles(): Promise<void> {
  const database = await openCaptureDb();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to clear capture bundles."));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}

export function revokeCaptureBundle(bundle: CaptureBundle | null | undefined) {
  if (!bundle) {
    return;
  }

  for (const shot of bundle.shots) {
    URL.revokeObjectURL(shot.stillObjectUrl);
    if (shot.clipObjectUrl) {
      URL.revokeObjectURL(shot.clipObjectUrl);
    }
  }
}

export async function ensureCaptureBundle(input: {
  sessionId: string;
  locationId: string;
  frameId: string | null;
  shotCount: number;
  clipSeconds: number;
  slotCount: number;
}): Promise<CaptureBundle> {
  const current = await getPersistedBundle(input.sessionId);
  const next: PersistedCaptureBundle = {
    sessionId: input.sessionId,
    locationId: input.locationId,
    frameId: input.frameId ?? current?.frameId ?? null,
    shotCount: input.shotCount,
    clipSeconds: input.clipSeconds,
    slotCount: input.slotCount,
    shots: current?.shots ?? [],
    slotAssignments: normalizeSlotAssignments(current?.slotAssignments ?? [], input.slotCount),
    updatedAt: new Date().toISOString()
  };

  await putPersistedBundle(next);
  setLastCaptureContext(next.sessionId, next.locationId);
  return hydrateCaptureBundle(next);
}

export async function getCaptureBundle(sessionId: string): Promise<CaptureBundle | null> {
  const bundle = await getPersistedBundle(sessionId);
  return bundle ? hydrateCaptureBundle(bundle) : null;
}

export async function appendShotToCaptureBundle(
  sessionId: string,
  shot: PersistedCapturedShot
): Promise<CaptureBundle> {
  const current = await getPersistedBundle(sessionId);
  if (!current) {
    throw new Error("Capture bundle not found for this session.");
  }

  const next: PersistedCaptureBundle = {
    ...current,
    shots: [...current.shots, shot],
    updatedAt: new Date().toISOString()
  };

  await putPersistedBundle(next);
  setLastCaptureContext(next.sessionId, next.locationId);
  return hydrateCaptureBundle(next);
}

export async function updateCaptureSlotAssignments(
  sessionId: string,
  slotAssignments: SlotAssignment[]
): Promise<CaptureBundle> {
  const current = await getPersistedBundle(sessionId);
  if (!current) {
    throw new Error("Capture bundle not found for this session.");
  }

  const normalized = normalizeSlotAssignments(slotAssignments, current.slotCount);
  const next: PersistedCaptureBundle = {
    ...current,
    slotAssignments: normalized,
    updatedAt: new Date().toISOString()
  };

  await putPersistedBundle(next);
  setLastCaptureContext(next.sessionId, next.locationId);
  return hydrateCaptureBundle(next);
}

export async function updateCaptureBundleMeta(
  sessionId: string,
  updates: Partial<Pick<PersistedCaptureBundle, "frameId" | "shotCount" | "clipSeconds" | "slotCount">>
): Promise<CaptureBundle> {
  const current = await getPersistedBundle(sessionId);
  if (!current) {
    throw new Error("Capture bundle not found for this session.");
  }

  const next: PersistedCaptureBundle = {
    ...current,
    ...updates,
    slotCount: updates.slotCount ?? current.slotCount,
    slotAssignments: normalizeSlotAssignments(current.slotAssignments, updates.slotCount ?? current.slotCount),
    updatedAt: new Date().toISOString()
  };

  await putPersistedBundle(next);
  setLastCaptureContext(next.sessionId, next.locationId);
  return hydrateCaptureBundle(next);
}

export async function clearCaptureBundle(sessionId?: string): Promise<void> {
  if (sessionId) {
    await deletePersistedBundle(sessionId);
    clearLastCaptureContext(sessionId);
    return;
  }

  await clearPersistedBundles();
  clearLastCaptureContext();
}

export async function clearCapturedPhoto(): Promise<void> {
  await clearCaptureBundle();
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}