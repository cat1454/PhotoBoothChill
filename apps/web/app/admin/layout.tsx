import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-shell stack">
      <section className="card stack">
        <div className="toolbar">
          <strong>Admin</strong>
          <div className="nav-links">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/locations">Locations</Link>
            <Link href="/admin/frames">Frames</Link>
            <Link href="/admin/sessions">Sessions</Link>
            <Link href="/">Home</Link>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}