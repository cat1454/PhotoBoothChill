export interface FrameWindow {
  left: number;
  top: number;
  width: number;
  height: number;
  pixels: number;
}

export interface FrameLayout {
  frameWidth: number;
  frameHeight: number;
  windows: FrameWindow[];
}

export interface FrameBundleManifest {
  shotCount: number;
  clipSeconds: number;
  slotCount: number;
  stillCaptureMoment: "timer_end";
  selectionMode: "pick_and_order";
}

export interface FrameReference {
  id: string;
  imageUrl: string;
}

export interface ResolvedFrameBundle {
  frameId: string;
  imageUrl: string;
  manifest: FrameBundleManifest;
  layout: FrameLayout;
  manifestUrl: string | null;
}

const TRANSPARENCY_THRESHOLD = 5;
const MIN_SIGNIFICANT_WINDOW_PIXELS = 50000;
const layoutCache = new Map<string, Promise<FrameLayout>>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();
const bundleCache = new Map<string, Promise<ResolvedFrameBundle>>();

function getFlatIndex(x: number, y: number, width: number) {
  return y * width + x;
}

function sortWindows(a: FrameWindow, b: FrameWindow) {
  if (a.top !== b.top) {
    return a.top - b.top;
  }

  return a.left - b.left;
}

function deriveManifestUrl(imageUrl: string): string | null {
  const clean = imageUrl.split("?")[0];
  const parts = clean.split("/").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }

  const folder = clean.slice(0, clean.lastIndexOf("/"));
  return `${folder}/manifest.json`;
}

async function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(imageUrl);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load frame image: ${imageUrl}`));
    image.src = imageUrl;
  });

  imageCache.set(imageUrl, promise);
  return promise;
}

async function fetchManifest(imageUrl: string): Promise<Partial<FrameBundleManifest> | null> {
  const manifestUrl = deriveManifestUrl(imageUrl);
  if (!manifestUrl) {
    return null;
  }

  try {
    const response = await fetch(manifestUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Partial<FrameBundleManifest>;
    return payload;
  } catch {
    return null;
  }
}

function drawPhotoContain(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  target: Pick<FrameWindow, "left" | "top" | "width" | "height">
) {
  const sourceWidth = "naturalWidth" in image ? image.naturalWidth : (image as HTMLCanvasElement).width;
  const sourceHeight = "naturalHeight" in image ? image.naturalHeight : (image as HTMLCanvasElement).height;
  const scale = Math.min(target.width / sourceWidth, target.height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = target.left + (target.width - drawWidth) / 2;
  const drawY = target.top + (target.height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export async function detectFrameLayout(imageUrl: string): Promise<FrameLayout> {
  const cached = layoutCache.get(imageUrl);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Canvas is unavailable in this browser.");
    }

    context.drawImage(image, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const visited = new Uint8Array(width * height);
    const regions: FrameWindow[] = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const flatIndex = getFlatIndex(x, y, width);
        if (visited[flatIndex]) {
          continue;
        }

        visited[flatIndex] = 1;
        const alpha = data[flatIndex * 4 + 3];
        if (alpha > TRANSPARENCY_THRESHOLD) {
          continue;
        }

        const queue: Array<[number, number]> = [[x, y]];
        let queueIndex = 0;
        let minX = x;
        let minY = y;
        let maxX = x;
        let maxY = y;
        let pixels = 0;

        while (queueIndex < queue.length) {
          const [currentX, currentY] = queue[queueIndex];
          queueIndex += 1;
          pixels += 1;

          if (currentX < minX) minX = currentX;
          if (currentY < minY) minY = currentY;
          if (currentX > maxX) maxX = currentX;
          if (currentY > maxY) maxY = currentY;

          const neighbors: Array<[number, number]> = [
            [currentX + 1, currentY],
            [currentX - 1, currentY],
            [currentX, currentY + 1],
            [currentX, currentY - 1]
          ];

          for (const [nextX, nextY] of neighbors) {
            if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
              continue;
            }

            const nextIndex = getFlatIndex(nextX, nextY, width);
            if (visited[nextIndex]) {
              continue;
            }

            visited[nextIndex] = 1;
            const nextAlpha = data[nextIndex * 4 + 3];
            if (nextAlpha <= TRANSPARENCY_THRESHOLD) {
              queue.push([nextX, nextY]);
            }
          }
        }

        if (pixels >= MIN_SIGNIFICANT_WINDOW_PIXELS) {
          regions.push({
            left: minX,
            top: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            pixels
          });
        }
      }
    }

    return {
      frameWidth: width,
      frameHeight: height,
      windows: regions.sort(sortWindows)
    };
  })();

  layoutCache.set(imageUrl, promise);
  return promise;
}

export async function resolveFrameBundle(frame: FrameReference): Promise<ResolvedFrameBundle> {
  const cached = bundleCache.get(frame.id);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const [layout, partialManifest] = await Promise.all([detectFrameLayout(frame.imageUrl), fetchManifest(frame.imageUrl)]);
    const slotCount = Math.max(1, partialManifest?.slotCount ?? layout.windows.length, 1);

    return {
      frameId: frame.id,
      imageUrl: frame.imageUrl,
      manifestUrl: deriveManifestUrl(frame.imageUrl),
      layout,
      manifest: {
        shotCount: Math.max(slotCount, partialManifest?.shotCount ?? slotCount),
        clipSeconds: Math.max(0, partialManifest?.clipSeconds ?? 0),
        slotCount,
        stillCaptureMoment: "timer_end" as const,
        selectionMode: "pick_and_order" as const
      }
    };
  })();

  bundleCache.set(frame.id, promise);
  return promise;
}

export async function composeFramePreview(imageUrl: string, orderedPhotoUrls: Array<string | null | undefined>): Promise<string> {
  const frame = await loadImage(imageUrl);
  const layout = await detectFrameLayout(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = layout.frameWidth;
  canvas.height = layout.frameHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < layout.windows.length; index += 1) {
    const photoUrl = orderedPhotoUrls[index];
    if (!photoUrl) {
      continue;
    }

    const photo = await loadImage(photoUrl);
    drawPhotoContain(context, photo, layout.windows[index]);
  }

  context.drawImage(frame, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}