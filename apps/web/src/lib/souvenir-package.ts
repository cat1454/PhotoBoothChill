import type { CaptureBundle, SlotAssignment } from "./capture";
import { resolveFrameBundle, type FrameReference, type FrameWindow } from "./frame-layout";

interface SouvenirPackageBaseInput {
  locationName: string;
  photoId: string;
  bundle: CaptureBundle;
  frame: FrameReference;
}

interface BuildSouvenirPackageHtmlInput extends SouvenirPackageBaseInput {
  framedImageDataUrl: string | null;
}

interface DownloadSouvenirPackageInput extends SouvenirPackageBaseInput {
  processedImageUrl: string | null;
  previewImageUrl: string | null;
}

interface OrderedShot {
  shotId: string;
  stillDataUrl: string;
  clipDataUrl: string | null;
}

function normalizeSlotAssignments(slotAssignments: SlotAssignment[], slotCount: number): SlotAssignment[] {
  const byIndex = new Map(slotAssignments.map((assignment) => [assignment.slotIndex, assignment.shotId ?? null]));
  return Array.from({ length: slotCount }, (_, index) => ({
    slotIndex: index,
    shotId: byIndex.get(index) ?? null
  }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toFileSafeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "souvenir";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read blob."));
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) {
    return null;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download asset from ${url}.`);
  }

  return blobToDataUrl(await response.blob());
}

function getSlotWindows(windows: FrameWindow[], slotCount: number, frameWidth: number, frameHeight: number): FrameWindow[] {
  if (windows.length > 0) {
    return windows.slice(0, slotCount);
  }

  return [
    {
      left: 0,
      top: 0,
      width: frameWidth,
      height: frameHeight,
      pixels: frameWidth * frameHeight
    }
  ];
}

function getOrderedShotIds(bundle: CaptureBundle, slotCount: number): Array<string | null> {
  const assignments = normalizeSlotAssignments(bundle.slotAssignments, slotCount);
  return assignments.map((assignment) => assignment.shotId ?? null);
}

function buildMotionSlotsHtml(
  orderedShots: Array<OrderedShot | null>,
  windows: FrameWindow[],
  frameWidth: number,
  frameHeight: number
): string {
  return orderedShots
    .map((shot, index) => {
      const slotWindow = windows[index];
      if (!shot?.clipDataUrl || !slotWindow) {
        return "";
      }

      const left = (slotWindow.left / frameWidth) * 100;
      const top = (slotWindow.top / frameHeight) * 100;
      const width = (slotWindow.width / frameWidth) * 100;
      const height = (slotWindow.height / frameHeight) * 100;

      return `
        <div class="motion-slot" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%">
          <video autoplay loop muted playsinline src="${shot.clipDataUrl}"></video>
          <span>${index + 1}</span>
        </div>
      `;
    })
    .join("");
}

function buildStillGalleryHtml(stills: OrderedShot[]): string {
  return stills
    .map(
      (shot, index) => `
        <article class="still-card">
          <img alt="Captured shot ${index + 1}" src="${shot.stillDataUrl}" />
          <div class="still-meta">
            <strong>Shot ${index + 1}</strong>
            <span>${shot.clipDataUrl ? "Clip recorded" : "Still photo only"}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/html;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

async function prepareSouvenirPackage(input: BuildSouvenirPackageHtmlInput) {
  const frameBundle = await resolveFrameBundle(input.frame);
  const slotCount = Math.max(1, frameBundle.manifest.slotCount, input.bundle.slotCount);
  const slotWindows = getSlotWindows(
    frameBundle.layout.windows,
    slotCount,
    frameBundle.layout.frameWidth,
    frameBundle.layout.frameHeight
  );

  const [frameDataUrl, stills] = await Promise.all([
    fetchAsDataUrl(input.frame.imageUrl),
    Promise.all(
      input.bundle.shots.map(async (shot) => ({
        shotId: shot.shotId,
        stillDataUrl: await blobToDataUrl(shot.stillBlob),
        clipDataUrl: shot.clipBlob ? await blobToDataUrl(shot.clipBlob) : null
      }))
    )
  ]);

  if (!frameDataUrl) {
    throw new Error("Frame asset is missing, so the souvenir package could not be created.");
  }

  const orderedShotIds = getOrderedShotIds(input.bundle, slotCount);
  const orderedShots = orderedShotIds.map((shotId) => stills.find((shot) => shot.shotId === shotId) ?? null);

  return {
    frameBundle,
    frameDataUrl,
    slotCount,
    slotWindows,
    stills,
    orderedShots,
    hasAnimatedFrame: orderedShots.some((shot) => Boolean(shot?.clipDataUrl))
  };
}

export async function buildSouvenirPackageHtml(input: BuildSouvenirPackageHtmlInput): Promise<string> {
  const prepared = await prepareSouvenirPackage(input);
  const title = `${input.locationName} souvenir package`;
  const safeTitle = escapeHtml(title);
  const safeLocation = escapeHtml(input.locationName);
  const safePhotoId = escapeHtml(input.photoId);
  const generatedAt = new Date().toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #eef4ff;
      --surface: #ffffff;
      --surface-soft: #f7fbff;
      --ink: #0f172a;
      --muted: #64748b;
      --line: #dbe7ff;
      --accent: #2563eb;
      --accent-soft: #dbeafe;
      --warm: #fff7eb;
      --warm-line: #f5d8ae;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Aptos", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 25%),
        radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 24%),
        linear-gradient(180deg, #fbfdff 0%, var(--bg) 100%);
    }
    .shell {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 20px 56px;
      display: grid;
      gap: 20px;
    }
    .card {
      background: rgba(255,255,255,0.96);
      border: 1px solid var(--line);
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(37,99,235,0.08);
    }
    .hero h1 {
      margin: 0;
      font-size: clamp(2rem, 3vw, 3.4rem);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }
    .hero p {
      margin: 10px 0 0;
      color: var(--muted);
      max-width: 60ch;
      line-height: 1.7;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--surface-soft);
      font-weight: 700;
      color: var(--ink);
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 0.95fr);
      gap: 20px;
    }
    .section-title {
      display: grid;
      gap: 6px;
      margin-bottom: 18px;
    }
    .section-title span {
      font-size: 0.8rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
      font-weight: 700;
    }
    .section-title h2 {
      margin: 0;
      font-size: 1.55rem;
      letter-spacing: -0.03em;
    }
    .section-title p {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
    }
    .result-figure,
    .motion-frame {
      position: relative;
      width: min(100%, 560px);
      margin: 0 auto;
      border-radius: 24px;
      overflow: hidden;
      background: #fff;
    }
    .result-figure img,
    .motion-frame img {
      display: block;
      width: 100%;
      height: auto;
    }
    .motion-stage {
      display: grid;
      gap: 16px;
    }
    .motion-stage.note {
      padding: 18px;
      border-radius: 20px;
      border: 1px solid var(--warm-line);
      background: linear-gradient(180deg, var(--warm), #fff);
    }
    .motion-slot {
      position: absolute;
      overflow: hidden;
      border-radius: 18px;
      background: #fff;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
    }
    .motion-slot video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #fff;
    }
    .motion-slot span {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: rgba(255,255,255,0.94);
      border: 1px solid var(--line);
      color: var(--accent);
      font-weight: 800;
      z-index: 2;
    }
    .frame-overlay {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
    }
    .still-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .still-card {
      display: grid;
      gap: 10px;
      padding: 12px;
      border-radius: 22px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, #fff, #f8fbff);
    }
    .still-card img {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: #eef4ff;
    }
    .still-meta {
      display: grid;
      gap: 4px;
    }
    .still-meta span,
    .footer-note {
      color: var(--muted);
    }
    @media (max-width: 960px) {
      .layout,
      .still-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="card hero">
      <h1>${safeTitle}</h1>
      <p>This package keeps your full capture set in one browser-openable file: all stills, the framed image, and the animated frame preview.</p>
      <div class="chips">
        <span class="chip">Location ${safeLocation}</span>
        <span class="chip">Photo ${safePhotoId}</span>
        <span class="chip">Generated ${escapeHtml(generatedAt)}</span>
      </div>
    </section>

    <section class="layout">
      <article class="card">
        <div class="section-title">
          <span>Framed image</span>
          <h2>Final souvenir</h2>
          <p>The still photo with the selected frame applied.</p>
        </div>
        <div class="result-figure">
          ${input.framedImageDataUrl ? `<img alt="Final framed souvenir" src="${input.framedImageDataUrl}" />` : `<p class="footer-note">Final framed image was not available at export time.</p>`}
        </div>
      </article>

      <article class="card">
        <div class="section-title">
          <span>Animated frame</span>
          <h2>Motion preview inside the frame</h2>
          <p>${prepared.hasAnimatedFrame ? "The selected shot clips are placed back into the frame windows and loop automatically." : "No local clips were available, so this export includes the stills and framed image only."}</p>
        </div>
        ${prepared.hasAnimatedFrame ? `
          <div class="motion-stage">
            <div class="motion-frame">
              ${buildMotionSlotsHtml(prepared.orderedShots, prepared.slotWindows, prepared.frameBundle.layout.frameWidth, prepared.frameBundle.layout.frameHeight)}
              <img alt="Frame overlay" class="frame-overlay" src="${prepared.frameDataUrl}" />
            </div>
          </div>
        ` : `
          <div class="motion-stage note">
            <strong>Motion preview unavailable</strong>
            <span class="footer-note">This browser session did not have MediaRecorder clips for the selected shots.</span>
          </div>
        `}
      </article>
    </section>

    <section class="card">
      <div class="section-title">
        <span>Captured stills</span>
        <h2>All photos from the session</h2>
        <p>The full still-photo set captured in this browser before frame selection.</p>
      </div>
      <div class="still-grid">
        ${buildStillGalleryHtml(prepared.stills)}
      </div>
    </section>
  </main>
</body>
</html>`;
}

export async function downloadSouvenirPackage(input: DownloadSouvenirPackageInput): Promise<void> {
  const framedImageDataUrl = await fetchAsDataUrl(input.processedImageUrl ?? input.previewImageUrl);
  const html = await buildSouvenirPackageHtml({
    locationName: input.locationName,
    photoId: input.photoId,
    bundle: input.bundle,
    frame: input.frame,
    framedImageDataUrl
  });
  const filename = `${toFileSafeSegment(input.locationName)}-${toFileSafeSegment(input.photoId)}-memory-package.html`;
  downloadTextFile(filename, html);
}