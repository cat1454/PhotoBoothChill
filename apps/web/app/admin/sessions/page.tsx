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
      .then(setSessions)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <section className="card stack">
      <h1>Recent Sessions</h1>
      {sessions.map((session) => (
        <div className="card stack" key={session.id}>
          <strong>{session.location.name}</strong>
          <span className="helper">
            {session.user.fullName} · {session.user.email}
          </span>
          <span className="helper">
            {session.status} · {new Date(session.createdAt).toLocaleString()}
          </span>
          {session.assets[0]?.previewUrl ? <img alt="Session preview" className="image-frame" src={session.assets[0].previewUrl} /> : null}
          <span className="helper">Assets: {session.assets.length}</span>
        </div>
      ))}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}