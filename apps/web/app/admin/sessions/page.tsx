"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "../../../src/lib/api";
import { getAuthState } from "../../../src/lib/auth";

interface SessionItem {
  id: string;
  status: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
  location: {
    name: string;
  };
  assets: Array<{
    id: string;
    processingStatus: string;
    previewUrl: string | null;
  }>;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (!auth) {
      setError("Admin login required.");
      return;
    }

    apiFetch<SessionItem[]>("/admin/sessions", {
      token: auth.accessToken
    })
      .then((data) => {
        setSessions(data);
        setError(null);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <section className="card travel-admin-card stack">
      <div className="travel-section-head">
        <div>
          <span className="travel-eyebrow">Recent capture activity</span>
          <h1>Sessions and previews</h1>
        </div>
        <span className="travel-inline-note">{sessions.length} session(s)</span>
      </div>

      <div className="travel-admin-sessions">
        {sessions.map((session) => (
          <article className="travel-admin-session" key={session.id}>
            <div className="stack compact">
              <div className="travel-section-head">
                <div>
                  <strong>{session.location.name}</strong>
                  <p className="helper">{session.user.fullName} | {session.user.email}</p>
                </div>
                <span className="travel-chip">{session.status}</span>
              </div>
              <p className="helper">Created {new Date(session.createdAt).toLocaleString()}</p>
              <div className="travel-chip-row">
                {session.assets.map((asset, index) => (
                  <span className="travel-chip" key={asset.id}>
                    Asset {index + 1}: {asset.processingStatus}
                  </span>
                ))}
              </div>
            </div>

            <div className="travel-admin-preview-shell">
              {session.assets[0]?.previewUrl ? (
                <img alt="Session preview" className="travel-admin-preview" src={session.assets[0].previewUrl} />
              ) : (
                <div className="travel-admin-empty">Preview pending</div>
              )}
            </div>
          </article>
        ))}
      </div>

      {sessions.length === 0 ? <div className="travel-admin-empty">No recent sessions found.</div> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}