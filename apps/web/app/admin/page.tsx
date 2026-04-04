import Link from "next/link";

const quickLinks = [
  {
    href: "/admin/login",
    title: "Admin login",
    description: "Use the seeded admin account before editing locations and frames."
  },
  {
    href: "/admin/locations",
    title: "Manage locations",
    description: "Add or refine travel destinations that appear in the guest flow."
  },
  {
    href: "/admin/frames",
    title: "Manage frames",
    description: "Point each destination to the right souvenir frame bundle and layout."
  },
  {
    href: "/admin/sessions",
    title: "Recent sessions",
    description: "Review the most recent capture activity and processed previews."
  }
];

export default function AdminHomePage() {
  return (
    <>
      <section className="card travel-admin-hero stack compact">
        <span className="travel-eyebrow">Admin dashboard</span>
        <h1>Keep the photobooth flow tidy behind the scenes</h1>
        <p className="helper travel-hero-helper">
          The guest-facing experience stays simple because this console keeps locations, frames, and recent sessions in one place.
        </p>
      </section>

      <section className="travel-admin-metrics">
        <article className="card travel-admin-metric stack compact">
          <span>Flow</span>
          <strong>Web-first</strong>
          <small>Guest capture, preview, result, and passport journey.</small>
        </article>
        <article className="card travel-admin-metric stack compact">
          <span>Processing</span>
          <strong>Async worker</strong>
          <small>Uploads queue into the photo worker before QR delivery.</small>
        </article>
        <article className="card travel-admin-metric stack compact">
          <span>Data</span>
          <strong>PostgreSQL</strong>
          <small>Locations, frames, sessions, and passport records all live in one DB.</small>
        </article>
        <article className="card travel-admin-metric stack compact">
          <span>Current focus</span>
          <strong>Souvenir polish</strong>
          <small>Aligning the guest UI and admin shell under one design language.</small>
        </article>
      </section>

      <section className="card travel-admin-card stack">
        <div className="travel-section-head">
          <div>
            <span className="travel-eyebrow">Quick actions</span>
            <h2>Jump straight to the area you need</h2>
          </div>
        </div>
        <div className="travel-admin-links">
          {quickLinks.map((item) => (
            <Link className="travel-admin-link-card" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}