"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getAuthState } from "../../src/lib/auth";
import { setCapturedPhoto } from "../../src/lib/capture";

function CapturePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("sessionId");
  const locationId = searchParams.get("locationId");

  useEffect(() => {
    if (!getAuthState() || !sessionId || !locationId) {
      router.replace("/");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError("Cannot access camera. Check browser permissions.");
      });

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [locationId, router, sessionId]);

  function capture() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Canvas is unavailable in this browser.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(dataUrl);
    router.push(`/preview?sessionId=${sessionId}&locationId=${locationId}`);
  }

  return (
    <main className="page-shell stack">
      <section className="card stack">
        <h1>Capture Photo</h1>
        <p className="helper">Mở camera thật từ browser rồi chụp ảnh để chuyển sang bước preview.</p>
      </section>
      <section className="card stack">
        <video autoPlay muted playsInline ref={videoRef} className="image-frame" />
        <div className="toolbar">
          <button className="primary" onClick={capture}>
            Capture now
          </button>
          <button className="secondary" onClick={() => router.push("/")}>
            Cancel
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<main className="page-shell"><section className="card"><p>Loading camera...</p></section></main>}>
      <CapturePageContent />
    </Suspense>
  );
}