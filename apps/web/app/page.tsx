"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch } from "../src/lib/api";
import { clearAuthState, getAuthState, setAuthState, type AuthState } from "../src/lib/auth";
import { clearCapturedPhoto } from "../src/lib/capture";

interface LocationItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
}

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuth(getAuthState());
  }, []);

  useEffect(() => {
    if (!auth) {
      setLocations([]);
      return;
    }

    setLoadingLocations(true);
    apiFetch<LocationItem[]>("/locations?status=active")
      .then(setLocations)
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoadingLocations(false));
  }, [auth]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      ...(mode === "register" ? { fullName: String(formData.get("fullName") ?? "") } : {})
    };

    try {
      const result = await apiFetch<AuthState>(mode === "login" ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: payload
      });
      setAuthState(result);
      setAuth(result);
      event.currentTarget.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startSession(locationId: string) {
    if (!auth) {
      return;
    }

    setError(null);
    try {
      const session = await apiFetch<{ id: string; locationId: string }>("/photo-sessions", {
        method: "POST",
        token: auth.accessToken,
        body: {
          locationId,
          deviceType: "web"
        }
      });

      await clearCapturedPhoto();
      router.push(`/capture?sessionId=${session.id}&locationId=${locationId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create a new session.");
    }
  }

  return (
    <main className="page-shell page-shell-wide travel-home stack">
      <section className="card travel-hero-panel stack">
        <div className="travel-topbar">
          <div>
            <strong className="travel-brand">PHOTobooth Native</strong>
            <p className="travel-topbar-copy">Blue-and-white travel photobooth experience for web capture and souvenir delivery.</p>
          </div>
          <div className="travel-nav-links">
            <Link href="/passport">Passport</Link>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
        <div className="travel-hero-copy stack compact">
          <span className="travel-eyebrow">Travel memory flow</span>
          <h1>Create a polished souvenir photo in a few taps</h1>
          <p className="helper travel-hero-helper">
            Sign in, choose a location, capture guided shots, then receive a framed photo by link or QR.
          </p>
        </div>
      </section>

      {!auth ? (
        <section className="travel-home-grid">
          <div className="card travel-auth-panel stack">
            <div className="travel-segmented-control">
              <button className={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")} type="button">
                Login
              </button>
              <button className={mode === "register" ? "primary" : "secondary"} onClick={() => setMode("register")} type="button">
                Register
              </button>
            </div>
            <div className="stack compact">
              <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p className="helper">Keep the form short so users get to locations quickly.</p>
            </div>
            <form className="stack" onSubmit={handleSubmit}>
              {mode === "register" ? <input name="fullName" placeholder="Full name" required /> : null}
              <input name="email" type="email" placeholder="Email" required />
              <input name="password" type="password" placeholder="Password" minLength={6} required />
              <button className="primary" disabled={submitting} type="submit">
                {submitting ? "Submitting..." : mode === "login" ? "Continue" : "Create account"}
              </button>
            </form>
            <div className="travel-seed-card">
              <strong>Admin seed</strong>
              <span>admin@photobooth.local / Admin123!</span>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </div>

          <div className="card travel-scope-panel stack">
            <div className="stack compact">
              <span className="travel-eyebrow">What is ready</span>
              <h2>Current demo scope</h2>
            </div>
            <div className="travel-scope-list">
              <div className="travel-scope-item">
                <strong>Guided capture</strong>
                <span>Real browser camera with multi-shot flow for Da Nang.</span>
              </div>
              <div className="travel-scope-item">
                <strong>Frame preview</strong>
                <span>Pick your best shots, preview the final souvenir, then continue.</span>
              </div>
              <div className="travel-scope-item">
                <strong>Delivery</strong>
                <span>Worker processing, QR handoff, and passport check-in after completion.</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="travel-home-grid">
          <div className="card travel-profile-panel stack">
            <div className="travel-profile-top">
              <div className="stack compact">
                <span className="travel-eyebrow">Signed in</span>
                <h2>{auth.user.fullName}</h2>
                <p className="helper">{auth.user.email} | role: {auth.user.role}</p>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  clearAuthState();
                  setAuth(null);
                }}
                type="button"
              >
                Logout
              </button>
            </div>
            <div className="travel-seed-card travel-soft-card">
              <strong>Next step</strong>
              <span>Pick a location to start a new souvenir session.</span>
            </div>
          </div>

          <div className="card travel-locations-panel stack">
            <div className="travel-section-head">
              <div>
                <span className="travel-eyebrow">Choose location</span>
                <h2>Available locations</h2>
              </div>
              {loadingLocations ? <span className="travel-inline-note">Loading...</span> : null}
            </div>
            <div className="travel-location-list">
              {locations.map((location) => (
                <article className="travel-location-card" key={location.id}>
                  <div className="travel-location-card-body">
                    <strong>{location.name}</strong>
                    <p className="helper">{location.description ?? "No description yet."}</p>
                  </div>
                  <button className="primary" onClick={() => startSession(location.id)} type="button">
                    Start session
                  </button>
                </article>
              ))}
            </div>
            {!loadingLocations && locations.length === 0 ? <p>No active locations.</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </div>
        </section>
      )}
    </main>
  );
}