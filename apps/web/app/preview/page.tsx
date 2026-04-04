"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "../../src/lib/api";
import { getAuthState } from "../../src/lib/auth";
import {
  clearCaptureBundle,
  dataUrlToBlob,
  getCaptureBundle,
  getLastCaptureContext,
  revokeCaptureBundle,
  updateCaptureBundleMeta,
  updateCaptureSlotAssignments,
  type CaptureBundle,
  type SlotAssignment
} from "../../src/lib/capture";
import { composeFramePreview, resolveFrameBundle, type ResolvedFrameBundle } from "../../src/lib/frame-layout";
import { buildSourceBundleFile } from "../../src/lib/source-bundle";

interface FrameItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
}

interface LocationDetail {
  id: string;
  name: string;
  frames: FrameItem[];
}

function normalizeSlotAssignments(slotAssignments: SlotAssignment[], slotCount: number): SlotAssignment[] {
  const byIndex = new Map(slotAssignments.map((assignment) => [assignment.slotIndex, assignment.shotId ?? null]));
  return Array.from({ length: slotCount }, (_, index) => ({
    slotIndex: index,
    shotId: byIndex.get(index) ?? null
  }));
}

function createOrderedAssignments(shotIds: string[], slotCount: number): SlotAssignment[] {
  return Array.from({ length: slotCount }, (_, index) => ({
    slotIndex: index,
    shotId: shotIds[index] ?? null
  }));
}

function getSlotOverlayStyle(bundle: ResolvedFrameBundle | null, slotIndex: number) {
  const slotWindow = bundle?.layout.windows[slotIndex];
  if (!bundle || !slotWindow) {
    return undefined;
  }

  return {
    left: `${(slotWindow.left / bundle.layout.frameWidth) * 100}%`,
    top: `${(slotWindow.top / bundle.layout.frameHeight) * 100}%`,
    width: `${(slotWindow.width / bundle.layout.frameWidth) * 100}%`,
    height: `${(slotWindow.height / bundle.layout.frameHeight) * 100}%`
  };
}

function PreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [captureBundle, setCaptureBundle] = useState<CaptureBundle | null>(null);
  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [frameBundles, setFrameBundles] = useState<ResolvedFrameBundle[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawSessionId = searchParams.get("sessionId");
  const rawLocationId = searchParams.get("locationId");
  const lastCaptureContext = useMemo(
    () => (!rawSessionId || !rawLocationId ? getLastCaptureContext() : null),
    [rawLocationId, rawSessionId]
  );
  const sessionId = rawSessionId ?? lastCaptureContext?.sessionId ?? null;
  const locationId = rawLocationId ?? lastCaptureContext?.locationId ?? null;

  const selectedFrame = location?.frames.find((frame) => frame.id === selectedFrameId) ?? null;
  const selectedBundle = frameBundles.find((frame) => frame.frameId === selectedFrameId) ?? null;
  const slotCount = selectedBundle?.manifest.slotCount ?? captureBundle?.slotCount ?? 1;
  const slotAssignments = useMemo(
    () => normalizeSlotAssignments(captureBundle?.slotAssignments ?? [], slotCount),
    [captureBundle?.slotAssignments, slotCount]
  );
  const orderedSelectedShotIds = slotAssignments.map((assignment) => assignment.shotId).filter((shotId): shotId is string => Boolean(shotId));
  const assignedShots = useMemo(
    () => slotAssignments.map((assignment) => captureBundle?.shots.find((shot) => shot.shotId === assignment.shotId) ?? null),
    [captureBundle?.shots, slotAssignments]
  );
  const previewStillUrls = assignedShots.map((shot) => shot?.stillObjectUrl ?? null);
  const allSlotsFilled = orderedSelectedShotIds.length === slotCount && previewStillUrls.every(Boolean);

  const selectedPhotoNumbers = useMemo(
    () =>
      orderedSelectedShotIds
        .map((shotId) => (captureBundle?.shots.findIndex((shot) => shot.shotId === shotId) ?? -1) + 1)
        .filter((photoNumber) => photoNumber > 0),
    [captureBundle?.shots, orderedSelectedShotIds]
  );

  const selectionHeadline = `Chon ${slotCount} anh ban thich nhat`;
  const selectionProgressLabel = `Da chon ${orderedSelectedShotIds.length}/${slotCount} anh`;
  const selectionFootLabel = allSlotsFilled
    ? `${slotCount} anh da san sang`
    : `Chon them ${Math.max(slotCount - orderedSelectedShotIds.length, 0)} anh de tiep tuc`;

  useEffect(() => () => revokeCaptureBundle(captureBundle), [captureBundle]);

  useEffect(() => {
    if ((!rawSessionId || !rawLocationId) && sessionId && locationId) {
      router.replace(`/preview?sessionId=${sessionId}&locationId=${locationId}`);
    }
  }, [locationId, rawLocationId, rawSessionId, router, sessionId]);

  useEffect(() => {
    if (!getAuthState()) {
      router.replace("/");
      return;
    }

    if (!sessionId || !locationId) {
      setError("No active capture session found. Start a session and capture photos first.");
      return;
    }

    let active = true;

    (async () => {
      try {
        const [loadedLocation, bundle] = await Promise.all([
          apiFetch<LocationDetail>(`/locations/${locationId}`),
          getCaptureBundle(sessionId)
        ]);

        if (!bundle || bundle.shots.length === 0) {
          setError("No captured photos were found for this session. Please capture again.");
          return;
        }

        const resolvedFrames = await Promise.all(loadedLocation.frames.map((frame) => resolveFrameBundle(frame)));
        if (!active) {
          return;
        }

        const defaultFrameId = bundle.frameId && resolvedFrames.some((frame) => frame.frameId === bundle.frameId)
          ? bundle.frameId
          : loadedLocation.frames[0]?.id ?? null;

        setLocation(loadedLocation);
        setFrameBundles(resolvedFrames);
        setCaptureBundle(bundle);
        setSelectedFrameId(defaultFrameId);
        setError(null);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load preview state.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [locationId, router, sessionId]);

  useEffect(() => {
    if (!captureBundle || !selectedBundle || !sessionId) {
      return;
    }

    if (captureBundle.frameId === selectedBundle.frameId && captureBundle.slotCount === selectedBundle.manifest.slotCount) {
      return;
    }

    let cancelled = false;

    updateCaptureBundleMeta(sessionId, {
      frameId: selectedBundle.frameId,
      slotCount: selectedBundle.manifest.slotCount
    })
      .then((nextBundle) => {
        if (cancelled) {
          revokeCaptureBundle(nextBundle);
          return;
        }

        setCaptureBundle(nextBundle);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Unable to update the selected frame.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [captureBundle, selectedBundle, sessionId]);

  useEffect(() => {
    if (!captureBundle || !selectedBundle || !sessionId) {
      return;
    }

    const currentAssignments = normalizeSlotAssignments(captureBundle.slotAssignments, selectedBundle.manifest.slotCount);
    if (selectedBundle.manifest.slotCount !== 1 || captureBundle.shots.length === 0 || currentAssignments[0]?.shotId) {
      return;
    }

    let cancelled = false;

    updateCaptureSlotAssignments(sessionId, [{ slotIndex: 0, shotId: captureBundle.shots[0].shotId }])
      .then((nextBundle) => {
        if (cancelled) {
          revokeCaptureBundle(nextBundle);
          return;
        }

        setCaptureBundle(nextBundle);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Unable to auto-select the first shot.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [captureBundle, selectedBundle, sessionId]);

  useEffect(() => {
    if (!selectedBundle) {
      setPreviewDataUrl(null);
      return;
    }

    let active = true;

    composeFramePreview(selectedBundle.imageUrl, previewStillUrls)
      .then((composed) => {
        if (active) {
          setPreviewDataUrl(composed);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to build the composed preview.");
        }
      });

    return () => {
      active = false;
    };
  }, [previewStillUrls, selectedBundle]);

  async function persistSelection(shotIds: string[]) {
    if (!selectedBundle || !sessionId) {
      return;
    }

    try {
      const nextBundle = await updateCaptureSlotAssignments(sessionId, createOrderedAssignments(shotIds, selectedBundle.manifest.slotCount));
      setCaptureBundle(nextBundle);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update selected photos.");
    }
  }

  async function toggleShotSelection(shotId: string) {
    if (!selectedBundle) {
      return;
    }

    if (orderedSelectedShotIds.includes(shotId)) {
      await persistSelection(orderedSelectedShotIds.filter((currentId) => currentId !== shotId));
      return;
    }

    if (orderedSelectedShotIds.length >= selectedBundle.manifest.slotCount) {
      return;
    }

    await persistSelection([...orderedSelectedShotIds, shotId]);
  }

  async function clearSelections() {
    await persistSelection([]);
  }

  async function handleUpload() {
    const auth = getAuthState();
    if (!auth || !previewDataUrl || !sessionId || !locationId || !selectedFrame || !allSlotsFilled || !captureBundle) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const blob = await dataUrlToBlob(previewDataUrl);
      const file = new File([blob], "capture-composed.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("file", file);

      const uploaded = await apiFetch<{ id: string }>("/photos/upload", {
        method: "POST",
        token: auth.accessToken,
        formData
      });

      const sourceBundleFile = await buildSourceBundleFile({
        photoId: uploaded.id,
        sessionId,
        locationId,
        frameTemplateId: selectedFrame.id,
        bundle: captureBundle
      });

      const sourceBundleFormData = new FormData();
      sourceBundleFormData.append("file", sourceBundleFile);

      await apiFetch(`/photos/${uploaded.id}/source-bundle`, {
        method: "POST",
        token: auth.accessToken,
        formData: sourceBundleFormData
      });

      await apiFetch("/photos/process", {
        method: "POST",
        token: auth.accessToken,
        body: {
          photoId: uploaded.id,
          frameTemplateId: selectedFrame.id
        }
      });

      await clearCaptureBundle(sessionId);
      router.push(`/result/${uploaded.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetake() {
    if (!sessionId) {
      return;
    }

    await clearCaptureBundle(sessionId);
    router.push(`/capture?sessionId=${sessionId}&locationId=${locationId}`);
  }

  if (!sessionId || !locationId) {
    return (
      <main className="page-shell page-shell-wide stack">
        <section className="card stack">
          <h1>Preview unavailable</h1>
          <p className="helper">Start a session and capture photos first, or return to the latest active capture flow.</p>
          <div className="toolbar">
            <button className="primary" onClick={() => router.push("/")} type="button">
              Back to home
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell page-shell-wide stack">
      <section className="card souvenir-workspace stack">
        <div className="souvenir-hero">
          <div className="souvenir-hero-copy">
            <h1>{selectionHeadline}</h1>
            <p>Anh se duoc ghep vao khung luu niem {location?.name ?? "Da Nang"} de tao thanh pham hoan chinh.</p>
          </div>
          <span className="souvenir-hero-status">{selectionProgressLabel}</span>
        </div>

        {location && location.frames.length > 1 ? (
          <div className="souvenir-frame-picker stack compact">
            <div className="souvenir-frame-picker-head">
              <strong>Chon khung</strong>
              <span>Doi khung neu anh muon xem thanh pham theo phong cach khac.</span>
            </div>
            <div className="frame-grid compact-grid souvenir-frame-grid">
              {location.frames.map((frame) => {
                const active = selectedFrameId === frame.id;
                return (
                  <button
                    className={active ? "frame-card active" : "frame-card"}
                    key={frame.id}
                    onClick={() => setSelectedFrameId(frame.id)}
                    type="button"
                  >
                    <img alt={frame.name} className="frame-card-image" src={frame.imageUrl} />
                    <strong>{frame.name}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="souvenir-layout">
          <div className="souvenir-preview-card">
            <div className="souvenir-preview-head">
              <div>
                <span className="souvenir-preview-eyebrow">Xem truoc thanh pham</span>
                <h2>Khung luu niem {location?.name ?? "Da Nang"}</h2>
              </div>
              <div className="souvenir-preview-meta">
                <span className="souvenir-preview-chip">{location?.name ?? "Location"}</span>
                <span className="souvenir-preview-chip">{slotCount} anh</span>
              </div>
            </div>

            <div className="souvenir-frame-wrap">
              <div className="souvenir-frame-display">
                {previewDataUrl ? (
                  <img alt="Composed preview" className="souvenir-frame-image" src={previewDataUrl} />
                ) : selectedFrame ? (
                  <img alt={selectedFrame.name} className="souvenir-frame-image" src={selectedFrame.imageUrl} />
                ) : (
                  <p className="helper">Loading frame...</p>
                )}

                {Array.from({ length: slotCount }, (_, index) => {
                  const style = getSlotOverlayStyle(selectedBundle, index);
                  if (!style) {
                    return null;
                  }

                  const isFilled = Boolean(slotAssignments[index]?.shotId);
                  return (
                    <div className={isFilled ? "souvenir-slot-overlay filled" : "souvenir-slot-overlay"} key={index} style={style}>
                      <span className="souvenir-slot-number">{index + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="souvenir-preview-foot">
              <strong>{selectionFootLabel}</strong>
              <span>Cham vao anh ben phai de thay doi bo anh trong khung.</span>
            </div>
          </div>

          <div className="souvenir-shot-card">
            <div className="souvenir-shot-head">
              <div>
                <h2>Anh da chup</h2>
                <p>Cham de chon hoac bo chon.</p>
              </div>
              <span className="souvenir-shot-count">{orderedSelectedShotIds.length} da chon</span>
            </div>

            <div className="souvenir-shot-grid">
              {captureBundle?.shots.map((shot, index) => {
                const assignedSlot = orderedSelectedShotIds.findIndex((selectedShotId) => selectedShotId === shot.shotId);
                const isAssigned = assignedSlot >= 0;
                return (
                  <button
                    className={isAssigned ? "souvenir-shot selected" : "souvenir-shot"}
                    key={shot.shotId}
                    onClick={() => toggleShotSelection(shot.shotId)}
                    type="button"
                  >
                    {isAssigned ? <span className="souvenir-shot-badge">{assignedSlot + 1}</span> : null}
                    {isAssigned ? <span className="souvenir-shot-check">OK</span> : null}
                    <img alt={`Shot ${index + 1}`} className="souvenir-shot-thumb" src={shot.stillObjectUrl} />
                    <span className="souvenir-shot-name">Anh {index + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="souvenir-footer">
          <div className="souvenir-footer-copy">
            <strong>{allSlotsFilled ? `${slotCount} anh da san sang` : selectionProgressLabel}</strong>
            <span>{selectedPhotoNumbers.length > 0 ? `Da chon: ${selectedPhotoNumbers.join(", ")}` : "Chua chon anh nao"}</span>
          </div>
          <div className="souvenir-footer-actions">
            <button className="souvenir-link-button" onClick={handleRetake} type="button">
              Chup lai tu dau
            </button>
            <button className="secondary" onClick={clearSelections} type="button">
              Chon lai
            </button>
            <button className="primary" disabled={submitting || !previewDataUrl || !allSlotsFilled} onClick={handleUpload}>
              {submitting ? "Dang chuan bi anh..." : "Tiep tuc tao anh"}
            </button>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<main className="page-shell page-shell-wide"><section className="card"><p>Loading preview...</p></section></main>}>
      <PreviewPageContent />
    </Suspense>
  );
}