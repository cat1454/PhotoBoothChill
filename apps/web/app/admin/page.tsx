import Link from "next/link";

export default function AdminHomePage() {
  return (
    <section className="grid two">
      <div className="card stack">
        <h1>Admin Dashboard</h1>
        <p className="helper">Functional MVP routes for managing locations, frame templates and browsing recent sessions.</p>
      </div>
      <div className="card stack">
        <Link href="/admin/login">Admin login</Link>
        <Link href="/admin/locations">Manage locations</Link>
        <Link href="/admin/frames">Manage frame templates</Link>
        <Link href="/admin/sessions">View recent sessions</Link>
      </div>
    </section>
  );
}