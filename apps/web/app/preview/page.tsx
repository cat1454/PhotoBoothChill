"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "../../src/lib/api";
import { getAuthState } from "../../src/lib/auth";
import { clearCapturedPhoto, dataUrlToBlob, getCapturedPhoto } from "../../src/lib/capture";

interface FrameItem {
  id: string;
  name: string;
  type: string;
}

interface LocationDetail {
  id: string;
  name: string;
  frames: FrameItem[];
}

function PreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("sessionId");
  const locationId = searchParams.get("locationId");

  useEffect(() => {
    const auth = getAuthState();
    const captured = getCapturedPhoto();
    if (!auth || !captured || !sessionId || !locationId) {
      router.replace("/");
      return;
    }

    setPhotoDataUrl(captured);
    apiFetch<LocationDetail>(`/locations/${locationId}`)
      .then((data) => {
        setLocation(data);
        setSelectedFrameId(data.frames[0]?.id);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [locationId, router, sessionId]);

  async function handleUpload() {
    const auth = getAuthState();
    if (!auth || !photoDataUrl || !sessionId) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const blob = await dataUrlToBlob(photoDataUrl);
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("file", file);

      const uploaded = await apiFetch<{ id: string }>("/photos/upload", {
        method: "POST",
        token: auth.accessToken,
        formData
      });

      await apiFetch("/photos/process", {
        method: "POST",
        token: auth.accessToken,
        body: {
          photoId: uploaded.id,
          frameTemplateId: selectedFrameId
        }
      });

      clearCapturedPhoto();
      router.push(`/result/${uploaded.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell stack">
      <section className="card stack">
        <h1>Preview & Frame</h1>
        <p className="helper">Ảnh chỉ được upload khi bạn xác nhận ở bước này.</p>
      </section>
      <section className="grid two">
        <div className="card stack">
          {photoDataUrl ? <img alt="Captured preview" className="image-frame" src={photoDataUrl} /> : <p>No captured photo.</p>}
        </div>
        <div className="card stack">
          <h2>{location?.name ?? "Loading location..."}</h2>
          <div className="stack">
            {location?.frames.map((frame) => (
              <label key={frame.id}>
                <input
                  checked={selectedFrameId === frame.id}
                  name="frame"
                  onChange={() => setSelectedFrameId(frame.id)}
                  type="radio"
                />{" "}
                {frame.name} ({frame.type})
              </label>
            ))}
          </div>
          <div className="toolbar">
            <button className="primary" disabled={submitting} onClick={handleUpload}>
              {submitting ? "Uploading..." : "Upload & process"}
            </button>
            <button className="secondary" onClick={() => router.back()}>
              Retake
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<main className="page-shell"><section className="card"><p>Loading preview...</p></section></main>}>
      <PreviewPageContent />
    </Suspense>
  );
}