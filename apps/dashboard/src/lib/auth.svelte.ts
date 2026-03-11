import type { SessionUser } from "$lib/types";
import { clearToken, getToken, setToken } from "$lib/api";

let user = $state<SessionUser | null>(null);

export function getUser(): SessionUser | null {
  return user;
}

export function setUser(newUser: SessionUser | null) {
  user = newUser;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:10000";
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message ?? "Invalid email or password");
  }

  const data = await res.json();
  setToken(data.token);
  user = data.user;
  return data.user;
}

export async function register(email: string, password: string, name?: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:10000";
  const res = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message ?? "Registration failed");
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:10000";
  await fetch(`${apiUrl}/auth/forgot-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function logout() {
  clearToken();
  user = null;
}

export function initAuth() {
  // Try to restore user from stored token
  const token = getToken();
  if (token) {
    // Decode the JWT payload (it's a base64url-encoded JSON in the first segment)
    try {
      const [encodedPayload] = token.split(".");
      if (encodedPayload) {
        const pad = encodedPayload.length % 4 === 0 ? "" : "=".repeat(4 - (encodedPayload.length % 4));
        const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + pad;
        const payload = JSON.parse(atob(base64)) as SessionUser & { exp: number };

        if (payload.exp && Date.now() < payload.exp) {
          user = payload;
        } else {
          clearToken();
        }
      }
    } catch {
      clearToken();
    }
  }
}
