"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../../../src/lib/api";
import { getAuthState } from "../../../src/lib/auth";

interface PhotoResponse {
  id: string;
  processingStatus: string;
  originalUrl: string | null;
  processedUrl: string | null;
  previewUrl: string | null;
  qrCodeUrl: string | null;
  session: {
    id: string;
    locationId: string;
    status: string;
  };
}

export default function ResultPage() {
  const params = useParams<{ photoId: string }>();
  const photoId = useMemo(() => String(params.photoId ?? ""), [params.photoId]);
  const [photo, setPhoto] = useState<PhotoResponse | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (!auth || !photoId) {
      return;
    }

    const token = auth.accessToken;
    let active = true;

    async function load() {
      try {
        const data = await apiFetch<PhotoResponse>(`/photos/${photoId}`, {
          token
        });
        if (active) {
          setPhoto(data);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load photo status.");
        }
      }
    }

    load();
    const timer = window.setInterval(() => {
      load();
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [photoId]);

  async function handleCheckIn() {
    const auth = getAuthState();
    if (!auth || !photo) {
      return;
    }

    try {
      await apiFetch("/passport/check-in", {
        method: "POST",
        token: auth.accessToken,
        body: {
          locationId: photo.session.locationId,
          photoId: photo.id
        }
      });
      setCheckInMessage("Passport stamp updated.");
    } catch (reason) {
      setCheckInMessage(reason instanceof Error ? reason.message : "Check-in failed.");
    }
  }

  return (
    <main className="page-shell stack">
      <section className="card stack">
        <h1>Processing Result</h1>
        <p className="helper">Trang này poll trạng thái cho tới khi worker xử lý xong.</p>
      </section>
      <section className="grid two">
        <div className="card stack">
          <strong>Status: {photo?.processingStatus ?? "loading"}</strong>
          {photo?.previewUrl ? <img alt="Preview" className="image-frame" src={photo.previewUrl} /> : <p>Preview will appear after processing.</p>}
          {photo?.processedUrl ? (
            <a className="primary" href={photo.processedUrl} rel="noreferrer" target="_blank">
              Open processed image
            </a>
          ) : null}
        </div>
        <div className="card stack">
          <h2>Delivery</h2>
          {photo?.qrCodeUrl ? <img alt="QR code" className="image-frame" src={photo.qrCodeUrl} /> : <p>QR code is not ready yet.</p>}
          <button className="primary" disabled={photo?.processingStatus !== "processed"} onClick={handleCheckIn}>
            Add to passport
          </button>
          {checkInMessage ? <p>{checkInMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}