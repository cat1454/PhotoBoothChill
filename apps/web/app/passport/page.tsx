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
    <main className="page-shell stack">
      <section className="card stack">
        <div className="toolbar">
          <Link href="/">Home</Link>
        </div>
        <h1>Passport Journey</h1>
        {passport ? (
          <p className="helper">
            {passport.user.fullName} · {passport.totalStamps} stamp(s)
          </p>
        ) : null}
      </section>
      <section className="card stack">
        {passport?.stamps.map((stamp) => (
          <div className="card stack" key={stamp.id}>
            <strong>Location ID: {stamp.locationId}</strong>
            <span className="helper">Photo ID: {stamp.photoId}</span>
            <span className="helper">Earned at: {new Date(stamp.earnedAt).toLocaleString()}</span>
          </div>
        ))}
        {passport && passport.stamps.length === 0 ? <p>No stamps yet.</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}