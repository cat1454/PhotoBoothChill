export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthState {
  accessToken: string;
  user: StoredUser;
}

const AUTH_KEY = "photobooth.auth";

export function getAuthState(): AuthState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_KEY);
  return raw ? (JSON.parse(raw) as AuthState) : null;
}

export function setAuthState(state: AuthState) {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  window.localStorage.removeItem(AUTH_KEY);
}
