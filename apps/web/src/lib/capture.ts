const CAPTURE_KEY = "photobooth.capture";

export function setCapturedPhoto(dataUrl: string) {
  window.sessionStorage.setItem(CAPTURE_KEY, dataUrl);
}

export function getCapturedPhoto(): string | null {
  return window.sessionStorage.getItem(CAPTURE_KEY);
}

export function clearCapturedPhoto() {
  window.sessionStorage.removeItem(CAPTURE_KEY);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
