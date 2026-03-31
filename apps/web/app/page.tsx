"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch } from "../src/lib/api";
import { clearAuthState, getAuthState, setAuthState, type AuthState } from "../src/lib/auth";

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
    const stored = getAuthState();
    setAuth(stored);
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
      router.push(`/capture?sessionId=${session.id}&locationId=${locationId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create session.");
    }
  }

  return (
    <main className="page-shell hero">
      <section className="card stack">
        <div className="toolbar">
          <strong>PHOTobooth Native</strong>
          <div className="nav-links">
            <Link href="/passport">Passport</Link>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
        <h1>Web-first photobooth MVP</h1>
        <p className="helper">
          Login hoặc đăng ký để tạo photo session, chụp ảnh bằng camera thật và nhận ảnh qua QR/link.
        </p>
      </section>

      {!auth ? (
        <section className="grid two">
          <div className="card stack">
            <div className="toolbar">
              <button className={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
                Login
              </button>
              <button className={mode === "register" ? "primary" : "secondary"} onClick={() => setMode("register")}>
                Register
              </button>
            </div>
            <form className="stack" onSubmit={handleSubmit}>
              {mode === "register" ? <input name="fullName" placeholder="Full name" required /> : null}
              <input name="email" type="email" placeholder="Email" required />
              <input name="password" type="password" placeholder="Password" minLength={6} required />
              <button className="primary" disabled={submitting} type="submit">
                {submitting ? "Submitting..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </form>
            {error ? <p className="error">{error}</p> : null}
            <p className="helper">Admin seed: admin@photobooth.local / Admin123!</p>
          </div>
          <div className="card stack">
            <h2>What you get now</h2>
            <ul>
              <li>Location selection from backend API</li>
              <li>Real browser camera capture</li>
              <li>Upload and async photo processing</li>
              <li>Passport check-in after processing</li>
              <li>Admin CRUD and session list</li>
            </ul>
          </div>
        </section>
      ) : (
        <section className="grid two">
          <div className="card stack">
            <div className="toolbar">
              <div>
                <strong>{auth.user.fullName}</strong>
                <div className="helper">
                  {auth.user.email} · role: {auth.user.role}
                </div>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  clearAuthState();
                  setAuth(null);
                }}
              >
                Logout
              </button>
            </div>
            <p className="helper">Chọn một location để tạo session mới và chuyển sang trang capture.</p>
          </div>
          <div className="card stack">
            <h2>Available locations</h2>
            {loadingLocations ? <p>Loading locations...</p> : null}
            {locations.map((location) => (
              <div className="card stack" key={location.id}>
                <div>
                  <strong>{location.name}</strong>
                  <div className="helper">{location.description ?? "No description yet."}</div>
                </div>
                <button className="primary" onClick={() => startSession(location.id)}>
                  Start session
                </button>
              </div>
            ))}
            {!loadingLocations && locations.length === 0 ? <p>No active locations.</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </div>
        </section>
      )}
    </main>
  );
}