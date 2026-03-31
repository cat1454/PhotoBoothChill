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
    <section className="card stack">
      <h1>Admin Login</h1>
      <form className="stack" onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="admin@photobooth.local" required />
        <input name="password" type="password" placeholder="Password" minLength={6} required />
        <button className="primary" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}