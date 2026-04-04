"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "../../src/lib/api";
import { getAuthState } from "../../src/lib/auth";
import {
  appendShotToCaptureBundle,
  clearCaptureBundle,
  ensureCaptureBundle,
  revokeCaptureBundle,
  type CaptureBundle
} from "../../src/lib/capture";
import { resolveFrameBundle, type FrameWindow } from "../../src/lib/frame-layout";

interface FrameItem {
  id: string;
  imageUrl: string;
}

interface LocationDetail {
  id: string;
  name: string;
  frames: FrameItem[];
}

interface CaptureSpec {
  shotCount: number;
  clipSeconds: number;
  slotCount: number;
  primaryFrameId: string | null;
  primaryImageUrl: string | null;
  primaryFrameWindows: FrameWindow[];
}

interface ActiveRecorder {
  stop: () => Promise<Blob | null>;
}

const RECORDER_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4"
];
const AUTO_CAPTURE_BUFFER_MS = 900;
const DEFAULT_AUTO_CAPTURE_SECONDS = 3;

function getCameraErrorMessage(reason: unknown): string {
  if (reason instanceof DOMException) {
    if (reason.name === "NotAllowedError") {
      return "Camera permission was denied. Allow camera access in the browser and try again.";
    }

    if (reason.name === "NotFoundError") {
      return "No camera device was found on this machine.";
    }

    if (reason.name === "NotReadableError") {
      return "The camera is busy or blocked by another application.";
    }
  }

  return "Cannot access camera. Open the app from http://localhost:3000 or HTTPS and check browser permissions.";
}

function getRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  if (typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function createClipRecorder(stream: MediaStream): ActiveRecorder | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  const mimeType = getRecorderMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.start();

  return {
    stop: () =>
      new Promise<Blob | null>((resolve, reject) => {
        const finalize = () => {
          const resolvedMimeType = recorder.mimeType || mimeType || "video/webm";
          resolve(chunks.length > 0 ? new Blob(chunks, { type: resolvedMimeType }) : null);
        };

        recorder.addEventListener("stop", finalize, { once: true });
        recorder.addEventListener("error", () => reject(new Error("Unable to save the local clip for this shot.")), {
          once: true
        });

        if (recorder.state === "inactive") {
          finalize();
          return;
        }

        recorder.stop();
      })
  };
}

function getGuideWindow(windows: FrameWindow[], shotIndex: number): FrameWindow | null {
  if (!windows.length) {
    return null;
  }

  return windows[shotIndex % windows.length] ?? windows[0];
}

function getCaptureCountdownSeconds(clipSeconds: number): number {
  return clipSeconds > 0 ? clipSeconds : DEFAULT_AUTO_CAPTURE_SECONDS;
}

async function captureStillBlob(video: HTMLVideoElement, guideWindow: FrameWindow | null): Promise<Blob> {
  const sourceWidth = video.videoWidth || 960;
  const sourceHeight = video.videoHeight || 720;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (guideWindow && guideWindow.width > 0 && guideWindow.height > 0) {
    const targetRatio = guideWindow.width / guideWindow.height;
    const sourceRatio = sourceWidth / sourceHeight;

    if (sourceRatio > targetRatio) {
      cropHeight = sourceHeight;
      cropWidth = sourceHeight * targetRatio;
      cropX = (sourceWidth - cropWidth) / 2;
    } else {
      cropWidth = sourceWidth;
      cropHeight = sourceWidth / targetRatio;
      cropY = (sourceHeight - cropHeight) / 2;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cropWidth);
  canvas.height = Math.round(cropHeight);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to capture a still image from the camera stream."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

function createShotId(index: number): string {
  return `shot-${index + 1}-${Date.now()}`;
}

function CapturePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const performCaptureRef = useRef<() => Promise<void>>(async () => {});

  const [bundle, setBundle] = useState<CaptureBundle | null>(null);
  const [locationName, setLocationName] = useState<string>("this location");
  const [captureSpec, setCaptureSpec] = useState<CaptureSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);

  const sessionId = searchParams.get("sessionId");
  const locationId = searchParams.get("locationId");
  const nextShotNumber = bundle ? Math.min(bundle.shots.length + 1, bundle.shotCount) : 1;
  const captureComplete = bundle ? bundle.shots.length >= bundle.shotCount : false;
  const currentGuideWindow = useMemo(
    () => getGuideWindow(captureSpec?.primaryFrameWindows ?? [], Math.max(0, nextShotNumber - 1)),
    [captureSpec?.primaryFrameWindows, nextShotNumber]
  );
  const currentGuideSlot = currentGuideWindow && captureSpec?.primaryFrameWindows.length
    ? ((Math.max(0, nextShotNumber - 1) % captureSpec.primaryFrameWindows.length) + 1)
    : 1;
  const captureCountdownSeconds = getCaptureCountdownSeconds(bundle?.clipSeconds ?? captureSpec?.clipSeconds ?? 0);

  useEffect(() => () => revokeCaptureBundle(bundle), [bundle]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!getAuthState() || !sessionId || !locationId) {
      router.replace("/");
      return;
    }

    let active = true;

    (async () => {
      try {
        const location = await apiFetch<LocationDetail>(`/locations/${locationId}`);
        if (!location.frames.length) {
          throw new Error("This location does not have any active frames yet.");
        }

        const resolvedFrames = await Promise.all(location.frames.map((frame) => resolveFrameBundle(frame)));
        const primaryBundle = [...resolvedFrames].sort((left, right) => {
          if (right.manifest.shotCount !== left.manifest.shotCount) {
            return right.manifest.shotCount - left.manifest.shotCount;
          }

          return right.manifest.slotCount - left.manifest.slotCount;
        })[0];

        const spec = resolvedFrames.reduce<CaptureSpec>(
          (current, frameBundle) => ({
            shotCount: Math.max(current.shotCount, frameBundle.manifest.shotCount),
            clipSeconds: Math.max(current.clipSeconds, frameBundle.manifest.clipSeconds),
            slotCount: Math.max(current.slotCount, frameBundle.manifest.slotCount),
            primaryFrameId: current.primaryFrameId,
            primaryImageUrl: current.primaryImageUrl,
            primaryFrameWindows: current.primaryFrameWindows
          }),
          {
            shotCount: 1,
            clipSeconds: 0,
            slotCount: 1,
            primaryFrameId: primaryBundle?.frameId ?? location.frames[0]?.id ?? null,
            primaryImageUrl: primaryBundle?.imageUrl ?? null,
            primaryFrameWindows:
              primaryBundle?.layout.windows.length
                ? primaryBundle.layout.windows
                : primaryBundle
                  ? [{ left: 0, top: 0, width: primaryBundle.layout.frameWidth, height: primaryBundle.layout.frameHeight, pixels: primaryBundle.layout.frameWidth * primaryBundle.layout.frameHeight }]
                  : []
          }
        );

        const hydratedBundle = await ensureCaptureBundle({
          sessionId,
          locationId,
          frameId: spec.primaryFrameId,
          shotCount: spec.shotCount,
          clipSeconds: spec.clipSeconds,
          slotCount: spec.slotCount
        });

        if (!active) {
          revokeCaptureBundle(hydratedBundle);
          return;
        }

        setLocationName(location.name);
        setCaptureSpec(spec);
        setBundle(hydratedBundle);
        setAutoCaptureEnabled(true);
        setWarning(
          spec.clipSeconds > 0 && typeof MediaRecorder === "undefined"
            ? "This browser can still capture photos, but local shot clips are not available because MediaRecorder is missing."
            : null
        );
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load capture requirements.");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [locationId, router, sessionId]);

  useEffect(() => {
    if (!getAuthState() || !sessionId || !locationId) {
      return;
    }

    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!mediaDevices?.getUserMedia) {
      setError("This browser context does not expose getUserMedia. Use localhost/HTTPS and a supported browser.");
      return;
    }

    mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      })
      .catch((reason) => {
        setCameraReady(false);
        setError(getCameraErrorMessage(reason));
      });

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [locationId, router, sessionId]);

  function clearTimers() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  async function waitForCountdown(seconds: number) {
    clearTimers();

    if (seconds <= 0) {
      setCountdown(null);
      return;
    }

    setCountdown(seconds);

    await new Promise<void>((resolve) => {
      let remaining = seconds;
      intervalRef.current = window.setInterval(() => {
        remaining -= 1;
        setCountdown(remaining > 0 ? remaining : 0);
      }, 1000);

      timeoutRef.current = window.setTimeout(() => {
        clearTimers();
        setCountdown(null);
        resolve();
      }, seconds * 1000);
    });
  }

  performCaptureRef.current = async () => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!bundle || !sessionId || !video || !stream || !cameraReady || capturing) {
      return;
    }

    if (bundle.shots.length >= bundle.shotCount) {
      router.push(`/preview?sessionId=${sessionId}&locationId=${locationId}`);
      return;
    }

    setCapturing(true);
    setError(null);
    let recorder: ActiveRecorder | null = null;

    try {
      recorder = bundle.clipSeconds > 0 ? createClipRecorder(stream) : null;
      await waitForCountdown(getCaptureCountdownSeconds(bundle.clipSeconds));
      const stillBlob = await captureStillBlob(video, currentGuideWindow);
      const clipBlob = recorder ? await recorder.stop() : null;
      const nextBundle = await appendShotToCaptureBundle(sessionId, {
        shotId: createShotId(bundle.shots.length),
        stillBlob,
        clipBlob,
        capturedAt: new Date().toISOString(),
        durationSeconds: bundle.clipSeconds
      });

      setBundle(nextBundle);
      if (nextBundle.shots.length >= nextBundle.shotCount) {
        router.push(`/preview?sessionId=${sessionId}&locationId=${locationId}`);
      }
    } catch (reason) {
      try {
        if (recorder) {
          await recorder.stop();
        }
      } catch {
        // Ignore recorder shutdown errors after the primary failure.
      }

      setError(reason instanceof Error ? reason.message : "Unable to capture this shot.");
    } finally {
      clearTimers();
      setCountdown(null);
      setCapturing(false);
    }
  };

  useEffect(() => {
    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (!autoCaptureEnabled || !cameraReady || !bundle || capturing || captureComplete || error) {
      return;
    }

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      void performCaptureRef.current();
    }, AUTO_CAPTURE_BUFFER_MS);

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, [autoCaptureEnabled, cameraReady, bundle, capturing, captureComplete, error]);

  async function resetShots() {
    if (!sessionId || !locationId || !captureSpec) {
      return;
    }

    setError(null);
    setCountdown(null);
    clearTimers();
    const previousBundle = bundle;

    try {
      await clearCaptureBundle(sessionId);
      const nextBundle = await ensureCaptureBundle({
        sessionId,
        locationId,
        frameId: captureSpec.primaryFrameId,
        shotCount: captureSpec.shotCount,
        clipSeconds: captureSpec.clipSeconds,
        slotCount: captureSpec.slotCount
      });

      setBundle(nextBundle);
      setAutoCaptureEnabled(true);
    } catch (reason) {
      if (previousBundle) {
        setBundle(previousBundle);
      }
      setError(reason instanceof Error ? reason.message : "Unable to reset the captured shots.");
    }
  }

  return (
    <main className="page-shell page-shell-wide stack travel-capture">
      <section className="card travel-hero-panel stack compact">
        <span className="travel-eyebrow">Capture flow</span>
        <h1>Capture the shots for your souvenir frame</h1>
        <p className="helper travel-hero-helper">
          {locationName}: auto capture keeps the rhythm moving so guests can focus on posing, not on controls.
        </p>
        <div className="travel-chip-row">
          <span className="travel-chip travel-chip-accent">Shot {nextShotNumber} / {bundle?.shotCount ?? captureSpec?.shotCount ?? 1}</span>
          <span className="travel-chip">Auto timer {captureCountdownSeconds}s</span>
          <span className="travel-chip">Saved shots {bundle?.shots.length ?? 0}</span>
          <span className="travel-chip">Guide slot {currentGuideSlot}</span>
        </div>
        <p className="helper">
          {captureComplete
            ? "All shots are ready. Continue to preview when you are happy with the set."
            : autoCaptureEnabled
              ? capturing
                ? "The current shot is being captured now."
                : "The next shot will start automatically."
              : "Auto capture is paused until you resume it."}
        </p>
        {warning ? <p className="warning">{warning}</p> : null}
      </section>

      <section className="travel-capture-grid">
        <div className="card travel-camera-card stack">
          <div className="travel-camera-stage">
            <div
              className="capture-viewport travel-camera-viewport"
              style={currentGuideWindow ? { aspectRatio: `${currentGuideWindow.width} / ${currentGuideWindow.height}` } : undefined}
            >
              <video autoPlay muted playsInline ref={videoRef} className="capture-video" />
              <div className="capture-guide-frame" />
              <div className="capture-guide-label">Slot {currentGuideSlot}</div>
              {countdown !== null ? <div className="countdown-chip">{countdown}</div> : null}
            </div>
          </div>
          <div className="travel-camera-actions">
            <button
              className="primary"
              disabled={!cameraReady || !bundle || captureComplete}
              onClick={() => setAutoCaptureEnabled((current) => !current)}
              type="button"
            >
              {captureComplete
                ? "All shots captured"
                : autoCaptureEnabled
                  ? capturing
                    ? "Pause after this shot"
                    : "Pause auto capture"
                  : "Resume auto capture"}
            </button>
            <button className="secondary" disabled={!captureComplete} onClick={() => router.push(`/preview?sessionId=${sessionId}&locationId=${locationId}`)} type="button">
              Continue to preview
            </button>
            <button className="secondary" onClick={resetShots} type="button">
              Reset shots
            </button>
            <button className="secondary" onClick={() => router.push("/")} type="button">
              Cancel
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </div>

        <div className="travel-capture-side stack">
          <div className="card travel-info-card stack">
            <h2>Frame reference</h2>
            {captureSpec?.primaryImageUrl ? (
              <img alt={`${locationName} frame reference`} className="image-frame frame-reference" src={captureSpec.primaryImageUrl} />
            ) : (
              <p className="helper">No frame preview is available for this location yet.</p>
            )}
            <p className="helper">The camera stage follows the transparent window ratio so the preview and final frame stay aligned.</p>
          </div>
          <div className="card travel-info-card stack">
            <h2>Captured shots</h2>
            {bundle?.shots.length ? (
              <div className="capture-strip travel-capture-strip">
                {bundle.shots.map((shot, index) => (
                  <div className="capture-thumb-card" key={shot.shotId}>
                    <img alt={`Captured shot ${index + 1}`} className="capture-thumb" src={shot.stillObjectUrl} />
                    <div className="capture-thumb-meta">
                      <strong>Shot {index + 1}</strong>
                      <span>{shot.clipObjectUrl ? `Clip saved (${shot.durationSeconds}s)` : "Still photo only"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="helper">No shots saved yet. Auto capture will begin as soon as the camera is ready.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<main className="page-shell page-shell-wide"><section className="card"><p>Loading camera...</p></section></main>}>
      <CapturePageContent />
    </Suspense>
  );
}