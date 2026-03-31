export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface FetchOptions {
  method?: string;
  token?: string | null;
  body?: unknown;
  formData?: FormData;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      cache: "no-store"
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(
      `Cannot reach API at ${API_BASE_URL}. Check that dev:api is running and open the web app from an allowed origin. (${details})`
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error?.message ?? `Request failed: ${response.status}`);
  }

  return payload.data as T;
}
