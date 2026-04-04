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
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<LocationItem[]>("/locations", { token: auth.accessToken });
      setItems(data);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load locations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createLocation() {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    try {
      await apiFetch("/locations", {
        method: "POST",
        token: auth.accessToken,
        body: draft
      });
      setDraft({ name: "", description: "", thumbnailUrl: "", status: "active" });
      setError(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create location.");
    }
  }

  async function saveLocation(item: LocationItem) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    try {
      await apiFetch(`/locations/${item.id}`, {
        method: "PUT",
        token: auth.accessToken,
        body: item
      });
      setError(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save location.");
    }
  }

  async function deactivateLocation(id: string) {
    const auth = getAuthState();
    if (!auth) {
      return;
    }

    try {
      await apiFetch(`/locations/${id}`, {
        method: "DELETE",
        token: auth.accessToken
      });
      setError(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to deactivate location.");
    }
  }

  return (
    <section className="travel-admin-grid">
      <div className="card travel-admin-card stack">
        <div className="stack compact">
          <span className="travel-eyebrow">Location editor</span>
          <h1>Create or update destinations</h1>
          <p className="helper travel-hero-helper">Locations feed the guest home screen and define the souvenir frames available for each journey.</p>
        </div>

        <div className="travel-admin-form">
          <input placeholder="Location name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <textarea
            placeholder="Description"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
          <input
            placeholder="Thumbnail URL"
            value={draft.thumbnailUrl}
            onChange={(event) => setDraft({ ...draft, thumbnailUrl: event.target.value })}
          />
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="inactive">inactive</option>
          </select>
          <button className="primary" onClick={createLocation} type="button">
            Create location
          </button>
        </div>
      </div>

      <div className="card travel-admin-card stack">
        <div className="travel-section-head">
          <div>
            <span className="travel-eyebrow">Current list</span>
            <h2>Available locations</h2>
          </div>
          {loading ? <span className="travel-inline-note">Loading...</span> : <span className="travel-inline-note">{items.length} location(s)</span>}
        </div>

        <div className="travel-admin-list">
          {items.map((item) => (
            <article className="travel-admin-list-item stack" key={item.id}>
              <div className="travel-section-head">
                <div>
                  <strong>{item.name}</strong>
                  <p className="helper">Slug: {item.slug}</p>
                </div>
                <span className="travel-chip">{item.status}</span>
              </div>

              <input
                value={item.name}
                onChange={(event) =>
                  setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)))
                }
              />
              <textarea
                value={item.description ?? ""}
                onChange={(event) =>
                  setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, description: event.target.value } : entry)))
                }
              />
              <input
                value={item.thumbnailUrl ?? ""}
                onChange={(event) =>
                  setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, thumbnailUrl: event.target.value } : entry)))
                }
              />
              <select
                value={item.status}
                onChange={(event) =>
                  setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: event.target.value } : entry)))
                }
              >
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="inactive">inactive</option>
              </select>

              <div className="travel-admin-toolbar">
                <button className="primary" onClick={() => saveLocation(item)} type="button">
                  Save changes
                </button>
                <button className="secondary" onClick={() => deactivateLocation(item.id)} type="button">
                  Deactivate
                </button>
              </div>
            </article>
          ))}
        </div>

        {!loading && items.length === 0 ? <div className="travel-admin-empty">No locations found yet.</div> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
}