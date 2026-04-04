"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "../../src/lib/api";
import { getAuthState } from "../../src/lib/auth";

interface PassportResponse {
  user: {
    fullName: string;
    email: string;
  };
  totalStamps: number;
  stamps: Array<{
    id: string;
    locationId: string;
    photoId: string;
    earnedAt: string;
  }>;
}

export default function PassportPage() {
  const [passport, setPassport] = useState<PassportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (!auth) {
      setError("Login first to view passport.");
      return;
    }

    apiFetch<PassportResponse>("/passport/me", {
      token: auth.accessToken
    })
      .then(setPassport)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <main className="page-shell page-shell-wide stack travel-passport">
      <section className="card travel-hero-panel stack compact">
        <div className="travel-topbar">
          <div>
            <span className="travel-eyebrow">Passport journey</span>
            <h1>Keep your travel stamps in one place</h1>
            <p className="helper travel-hero-helper">Every completed souvenir can add one more stop to the journey.</p>
          </div>
          <div className="travel-nav-links">
            <Link href="/">Home</Link>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
        {passport ? (
          <div className="travel-chip-row">
            <span className="travel-chip travel-chip-accent">{passport.user.fullName}</span>
            <span className="travel-chip">{passport.totalStamps} stamp(s)</span>
          </div>
        ) : null}
      </section>

      <section className="travel-passport-grid">
        {passport?.stamps.map((stamp, index) => (
          <article className="card travel-stamp-card stack" key={stamp.id}>
            <span className="travel-eyebrow">Stamp {index + 1}</span>
            <h2>{stamp.locationId}</h2>
            <p className="helper">Photo: {stamp.photoId}</p>
            <div className="travel-stamp-meta">
              <span>Earned</span>
              <strong>{new Date(stamp.earnedAt).toLocaleString()}</strong>
            </div>
          </article>
        ))}
        {passport && passport.stamps.length === 0 ? <section className="card stack"><p>No stamps yet.</p></section> : null}
        {error ? <section className="card stack"><p className="error">{error}</p></section> : null}
      </section>
    </main>
  );
}