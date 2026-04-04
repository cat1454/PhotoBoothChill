import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface PublicDownloadsResponse {
  locationName: string;
  frameName: string | null;
  previewUrl: string | null;
  framedPhotoUrl: string | null;
  originalsArchiveUrl: string | null;
  animatedFrameUrl: string | null;
  downloadPageUrl: string;
  status: string;
}

async function getDownloadData(token: string): Promise<PublicDownloadsResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/photos/${token}/downloads`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: PublicDownloadsResponse };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getDownloadData(token);

  if (!data) {
    return (
      <main className="page-shell page-shell-wide stack travel-download">
        <section className="card travel-download-hero stack compact">
          <span className="travel-eyebrow">Download unavailable</span>
          <h1>This souvenir link is not available right now</h1>
          <p className="helper travel-hero-helper">
            The shared download page could not be found. Ask the booth operator to regenerate the QR or finish processing first.
          </p>
          <div className="travel-nav-links">
            <Link href="/">Back to home</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell page-shell-wide stack travel-download">
      <section className="card travel-download-hero stack compact">
        <span className="travel-eyebrow">Download your souvenir</span>
        <h1>Your photo memories are ready to save</h1>
        <p className="helper travel-hero-helper">
          Download the full photo set, the framed souvenir, or the animated frame directly to your phone.
        </p>
        <div className="travel-chip-row">
          <span className="travel-chip travel-chip-accent">Status {data.status}</span>
          <span className="travel-chip">{data.locationName}</span>
          {data.frameName ? <span className="travel-chip">{data.frameName}</span> : null}
        </div>
      </section>

      <section className="travel-download-grid">
        <article className="card travel-download-preview-card stack">
          <div className="travel-section-head">
            <div>
              <span className="travel-eyebrow">Preview</span>
              <h2>Check the framed souvenir</h2>
            </div>
          </div>

          <div className="travel-download-preview-shell">
            {data.previewUrl ? (
              <img alt="Souvenir preview" className="image-frame" src={data.previewUrl} />
            ) : (
              <p className="helper">Preview is still being generated.</p>
            )}
          </div>
        </article>

        <article className="card travel-download-actions-card stack">
          <div className="travel-section-head">
            <div>
              <span className="travel-eyebrow">Downloads</span>
              <h2>Save files to your phone</h2>
            </div>
          </div>

          <div className="travel-download-actions-list">
            {data.originalsArchiveUrl ? (
              <a className="button-link primary" href={data.originalsArchiveUrl}>
                Download all captured photos
              </a>
            ) : (
              <span className="button-link primary disabled">All captured photos pending</span>
            )}
            {data.framedPhotoUrl ? (
              <a className="button-link secondary" href={data.framedPhotoUrl}>
                Download framed photo
              </a>
            ) : (
              <span className="button-link secondary disabled">Framed photo pending</span>
            )}
            {data.animatedFrameUrl ? (
              <a className="button-link secondary" href={data.animatedFrameUrl}>
                Download animated frame
              </a>
            ) : (
              <span className="button-link secondary disabled">Animated frame pending</span>
            )}
          </div>

          <div className="travel-download-note">
            <strong>What you get</strong>
            <span>ZIP for all captured photos, JPG for the framed image, and MP4 for the animated frame.</span>
          </div>
        </article>
      </section>
    </main>
  );
}