"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "../../../src/lib/api";
import { setAuthState, type AuthState } from "../../../src/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    try {
      const auth = await apiFetch<AuthState>("/auth/login", {
        method: "POST",
        body: {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? "")
        }
      });

      if (auth.user.role !== "admin") {
        throw new Error("This account is not an admin.");
      }

      setAuthState(auth);
      router.push("/admin/locations");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card travel-admin-card stack">
      <div className="stack compact">
        <span className="travel-eyebrow">Admin access</span>
        <h1>Sign in to manage locations and frames</h1>
        <p className="helper travel-hero-helper">
          This route stays lightweight so you can get into the operational tools quickly during demos and local testing.
        </p>
      </div>

      <form className="travel-admin-form" onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="admin@photobooth.local" required />
        <input name="password" type="password" placeholder="Password" minLength={6} required />
        <button className="primary" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Continue to admin"}
        </button>
      </form>

      <div className="travel-seed-card">
        <strong>Seed credentials</strong>
        <span>admin@photobooth.local / Admin123!</span>
      </div>

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}