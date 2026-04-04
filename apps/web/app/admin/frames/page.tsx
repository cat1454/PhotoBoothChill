"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "../../../src/lib/api";
import { getAuthState } from "../../../src/lib/auth";

interface LocationItem {
  id: string;
  name: string;
}

interface FrameItem {
  id: string;
  name: string;
  locationId: string;
  imageUrl: string;
  type: string;
  isActive: boolean;
}

export default function AdminFramesPage() {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [draft, setDraft] = useState({ name: "", locationId: "", imageUrl: "", type: "single", isActive: true });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const auth = getAuthState();
    if (!auth) {
      setError("Admin login required.");
      return;
    }

    try {
      const [frameData, locationData] = await Promise.all([
        apiFetch<FrameItem[]>("/frame-templates", { token: auth.accessToken }),
        apiFetch<Array<LocationItem & { status: string }>>("/locations", { token: auth.accessToken })
      ]);
      setFrames(frameData);
      setLocations(locationData);
      setError(null);
      if (!draft.locationId && locationData[0]?.id) {
        setDraft((current) => ({ ...current, locationId: locationData[0].id }));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load frame data.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createFrame() {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    try {
      await apiFetch("/frame-templates", {
        method: "POST",
        token: auth.accessToken,
        body: draft
      });
      setDraft((current) => ({ ...current, name: "", imageUrl: "" }));
      setError(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create frame.");
    }
  }

  async function saveFrame(item: FrameItem) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    try {
      await apiFetch(`/frame-templates/${item.id}`, {
        method: "PUT",
        token: auth.accessToken,
        body: item
      });
      setError(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save frame.");
    }
  }

  async function deactivateFrame(id: string) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    try {
      await apiFetch(`/frame-templates/${id}`, {
        method: "DELETE",
        token: auth.accessToken
      });
      setError(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to deactivate frame.");
    }
  }

  return (
    <section className="travel-admin-grid">
      <div className="card travel-admin-card stack">
        <div className="stack compact">
          <span className="travel-eyebrow">Frame editor</span>
          <h1>Point destinations to the right frame bundle</h1>
          <p className="helper travel-hero-helper">Use a clean image URL and keep the template type aligned with the real layout behavior.</p>
        </div>

        <div className="travel-admin-form">
          <input placeholder="Frame name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <select value={draft.locationId} onChange={(event) => setDraft({ ...draft, locationId: event.target.value })}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <input placeholder="Image URL" value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} />
          <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
            <option value="single">single</option>
            <option value="strip">strip</option>
            <option value="collage">collage</option>
          </select>
          <button className="primary" onClick={createFrame} type="button">
            Create frame
          </button>
        </div>
      </div>

      <div className="card travel-admin-card stack">
        <div className="travel-section-head">
          <div>
            <span className="travel-eyebrow">Current list</span>
            <h2>Frame templates</h2>
          </div>
          <span className="travel-inline-note">{frames.length} frame(s)</span>
        </div>

        <div className="travel-admin-list">
          {frames.map((item) => (
            <article className="travel-admin-list-item stack" key={item.id}>
              <div className="travel-section-head">
                <div>
                  <strong>{item.name}</strong>
                  <p className="helper">Location: {locations.find((location) => location.id === item.locationId)?.name ?? item.locationId}</p>
                </div>
                <span className="travel-chip">{item.type}</span>
              </div>

              <input
                value={item.name}
                onChange={(event) =>
                  setFrames((current) => current.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)))
                }
              />
              <input
                value={item.imageUrl}
                onChange={(event) =>
                  setFrames((current) => current.map((entry) => (entry.id === item.id ? { ...entry, imageUrl: event.target.value } : entry)))
                }
              />
              <select
                value={item.type}
                onChange={(event) =>
                  setFrames((current) => current.map((entry) => (entry.id === item.id ? { ...entry, type: event.target.value } : entry)))
                }
              >
                <option value="single">single</option>
                <option value="strip">strip</option>
                <option value="collage">collage</option>
              </select>

              <div className="travel-admin-toolbar">
                <button className="primary" onClick={() => saveFrame(item)} type="button">
                  Save changes
                </button>
                <button className="secondary" onClick={() => deactivateFrame(item.id)} type="button">
                  Deactivate
                </button>
              </div>
            </article>
          ))}
        </div>

        {frames.length === 0 ? <div className="travel-admin-empty">No frame templates found yet.</div> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
}