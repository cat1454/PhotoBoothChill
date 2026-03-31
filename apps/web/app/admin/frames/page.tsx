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
      if (!draft.locationId && locationData[0]?.id) {
        setDraft((current) => ({ ...current, locationId: locationData[0].id }));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load frame data.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createFrame() {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    await apiFetch("/frame-templates", {
      method: "POST",
      token: auth.accessToken,
      body: draft
    });
    setDraft((current) => ({ ...current, name: "", imageUrl: "" }));
    await load();
  }

  async function saveFrame(item: FrameItem) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    await apiFetch(`/frame-templates/${item.id}`, {
      method: "PUT",
      token: auth.accessToken,
      body: item
    });
    await load();
  }

  async function deactivateFrame(id: string) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    await apiFetch(`/frame-templates/${id}`, {
      method: "DELETE",
      token: auth.accessToken
    });
    await load();
  }

  return (
    <section className="grid two">
      <div className="card stack">
        <h1>Frame Templates</h1>
        <input placeholder="Frame name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <select value={draft.locationId} onChange={(e) => setDraft({ ...draft, locationId: e.target.value })}>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <input placeholder="Image URL" value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
          <option value="single">single</option>
          <option value="strip">strip</option>
          <option value="collage">collage</option>
        </select>
        <button className="primary" onClick={createFrame}>
          Create frame
        </button>
      </div>
      <div className="card stack">
        {frames.map((item) => (
          <div className="card stack" key={item.id}>
            <input
              value={item.name}
              onChange={(e) =>
                setFrames((current) => current.map((entry) => (entry.id === item.id ? { ...entry, name: e.target.value } : entry)))
              }
            />
            <input
              value={item.imageUrl}
              onChange={(e) =>
                setFrames((current) => current.map((entry) => (entry.id === item.id ? { ...entry, imageUrl: e.target.value } : entry)))
              }
            />
            <select
              value={item.type}
              onChange={(e) =>
                setFrames((current) => current.map((entry) => (entry.id === item.id ? { ...entry, type: e.target.value } : entry)))
              }
            >
              <option value="single">single</option>
              <option value="strip">strip</option>
              <option value="collage">collage</option>
            </select>
            <div className="toolbar">
              <button className="primary" onClick={() => saveFrame(item)}>
                Save
              </button>
              <button className="secondary" onClick={() => deactivateFrame(item.id)}>
                Deactivate
              </button>
            </div>
          </div>
        ))}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
}