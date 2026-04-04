"use client";

import Link from "next/link";
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
  originalsArchiveUrl: string | null;
  animatedFrameUrl: string | null;
  downloadPageUrl: string | null;
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
          setError(null);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load photo status.");
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
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

  const statusLabel = photo?.processingStatus ?? "loading";
  const ready = photo?.processingStatus === "processed";

  return (
    <main className="page-shell page-shell-wide stack travel-result">
      <section className="card travel-hero-panel stack compact">
        <div className="travel-topbar">
          <div>
            <span className="travel-eyebrow">Souvenir delivery</span>
            <h1>Your travel photo is almost ready</h1>
            <p className="helper travel-hero-helper">
              We keep checking the worker status until the framed image, preview, QR handoff, and public download page are ready.
            </p>
          </div>
          <div className="travel-nav-links">
            <Link href="/">Home</Link>
            <Link href="/passport">Passport</Link>
          </div>
        </div>
        <div className="travel-chip-row">
          <span className="travel-chip travel-chip-accent">Status {statusLabel}</span>
          <span className="travel-chip">Photo {photoId}</span>
          <span className="travel-chip">Session {photo?.session.status ?? "pending"}</span>
          <span className="travel-chip">Download page {photo?.downloadPageUrl ? "ready" : "pending"}</span>
        </div>
      </section>

      <section className="travel-result-grid">
        <article className="card travel-result-card stack">
          <div className="travel-section-head">
            <div>
              <span className="travel-eyebrow">Framed result</span>
              <h2>Preview the souvenir</h2>
            </div>
            <span className="travel-inline-note">Auto-refresh every 3s</span>
          </div>

          <div className="travel-result-media">
            {photo?.previewUrl ? (
              <img alt="Preview" className="image-frame" src={photo.previewUrl} />
            ) : (
              <p className="helper">The framed preview will appear here after processing finishes.</p>
            )}
          </div>

          <div className="travel-result-note">
            <strong>{ready ? "Your keepsake is ready." : "The worker is still finishing the frame."}</strong>
            <span>
              {ready
                ? "You can open the final image, add it to the passport, or open the public download page that guests reach from QR."
                : "Stay on this page for a moment while the preview and delivery assets finish processing."}
            </span>
          </div>

          <div className="travel-result-links">
            {photo?.processedUrl ? (
              <a className="button-link primary" href={photo.processedUrl} rel="noreferrer" target="_blank">
                Open final image
              </a>
            ) : (
              <span className="button-link primary disabled">Final image pending</span>
            )}
            {photo?.originalUrl ? (
              <a className="button-link secondary" href={photo.originalUrl} rel="noreferrer" target="_blank">
                View uploaded original
              </a>
            ) : null}
          </div>
        </article>

        <article className="card travel-delivery-card stack">
          <div className="travel-section-head">
            <div>
              <span className="travel-eyebrow">Delivery</span>
              <h2>Share, stamp, or open the mobile download page</h2>
            </div>
          </div>

          <div className="travel-delivery-media">
            {photo?.qrCodeUrl ? (
              <img alt="QR code" className="image-frame" src={photo.qrCodeUrl} />
            ) : (
              <p className="helper">The QR code will appear here once the worker finishes.</p>
            )}
          </div>

          <div className="travel-result-actions">
            <button className="primary" disabled={!ready} onClick={handleCheckIn} type="button">
              Add to passport
            </button>
            {photo?.downloadPageUrl ? (
              <a className="button-link secondary" href={photo.downloadPageUrl} rel="noreferrer" target="_blank">
                Open download page
              </a>
            ) : (
              <span className="button-link secondary disabled">Download page pending</span>
            )}
            <Link className="button-link secondary" href="/passport">
              View passport
            </Link>
          </div>

          <p className="helper">
            Guests will land on a public page with three separate download buttons: all captured photos, framed photo, and animated frame.
          </p>
          {checkInMessage ? <p className="helper">{checkInMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}