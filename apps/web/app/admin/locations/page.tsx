"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "../../../src/lib/api";
import { getAuthState } from "../../../src/lib/auth";

interface LocationItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
}

export default function AdminLocationsPage() {
  const [items, setItems] = useState<LocationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: "", description: "", thumbnailUrl: "", status: "active" });

  async function load() {
    const auth = getAuthState();
    if (!auth) {
      setError("Admin login required.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<LocationItem[]>("/locations", { token: auth.accessToken });
      setItems(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load locations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createLocation() {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    await apiFetch("/locations", {
      method: "POST",
      token: auth.accessToken,
      body: draft
    });
    setDraft({ name: "", description: "", thumbnailUrl: "", status: "active" });
    await load();
  }

  async function saveLocation(item: LocationItem) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    await apiFetch(`/locations/${item.id}`, {
      method: "PUT",
      token: auth.accessToken,
      body: item
    });
    await load();
  }

  async function deactivateLocation(id: string) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    await apiFetch(`/locations/${id}`, {
      method: "DELETE",
      token: auth.accessToken
    });
    await load();
  }

  return (
    <section className="grid two">
      <div className="card stack">
        <h1>Locations</h1>
        <input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <textarea
          placeholder="Description"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <input
          placeholder="Thumbnail URL"
          value={draft.thumbnailUrl}
          onChange={(e) => setDraft({ ...draft, thumbnailUrl: e.target.value })}
        />
        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="inactive">inactive</option>
        </select>
        <button className="primary" onClick={createLocation}>
          Create location
        </button>
      </div>
      <div className="card stack">
        {loading ? <p>Loading locations...</p> : null}
        {items.map((item) => (
          <div className="card stack" key={item.id}>
            <input
              value={item.name}
              onChange={(e) =>
                setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, name: e.target.value } : entry)))
              }
            />
            <textarea
              value={item.description ?? ""}
              onChange={(e) =>
                setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, description: e.target.value } : entry)))
              }
            />
            <select
              value={item.status}
              onChange={(e) =>
                setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: e.target.value } : entry)))
              }
            >
              <option value="active">active</option>
              <option value="draft">draft</option>
              <option value="inactive">inactive</option>
            </select>
            <div className="toolbar">
              <button className="primary" onClick={() => saveLocation(item)}>
                Save
              </button>
              <button className="secondary" onClick={() => deactivateLocation(item.id)}>
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