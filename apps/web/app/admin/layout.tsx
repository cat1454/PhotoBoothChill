import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/frames", label: "Frames" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/", label: "Back to home" }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page-shell page-shell-wide travel-admin-shell">
      <div className="travel-admin-layout">
        <aside className="travel-admin-sidebar">
          <div className="travel-admin-brand">
            <div className="travel-admin-brand-badge">PB</div>
            <div>
              <strong>Admin console</strong>
              <span>Blue-and-white operations shell for the web-first photobooth MVP.</span>
            </div>
          </div>

          <nav className="travel-admin-nav">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="travel-admin-sidebar-foot">
            <strong>Seed account</strong>
            <span>admin@photobooth.local / Admin123!</span>
          </div>
        </aside>

        <div className="travel-admin-main">{children}</div>
      </div>
    </main>
  );
}