import type { SessionUser } from "$lib/types";
import { apiFetch, apiJson, clearToken, getToken, setToken } from "$lib/api";

let user = $state<SessionUser | null>(null);

export function getUser(): SessionUser | null {
  return user;
}

export function setUser(newUser: SessionUser | null) {
  user = newUser;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const data = await apiJson<{ token: string; user: SessionUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  user = data.user;
  return data.user;
}

export async function register(email: string, password: string, name?: string): Promise<void> {
  await apiJson("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function logout() {
  clearToken();
  user = null;
}

export function initAuth() {
  const token = getToken();
  if (token) {
    try {
      const parts = token.split(".");
      const encodedPayload = parts[1];
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
