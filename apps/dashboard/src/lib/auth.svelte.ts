import type { SessionUser } from "@atma/backend";
import { api } from "$lib/api";
import { ls } from "$lib/storage";

let user = $state<SessionUser | null>(null);

export function getUser(): SessionUser | null {
  return user;
}

export function setUser(newUser: SessionUser | null) {
  user = newUser;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  let token: string;
  try {
    token = await api.auth.login.$post({ email, password });
  } catch {
    throw new Error("Invalid email or password");
  }
  ls.authToken = token;
  const parts = token.split(".");
  const encodedPayload = parts[0];
  const pad = encodedPayload.length % 4 === 0 ? "" : "=".repeat(4 - (encodedPayload.length % 4));
  const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + pad;
  user = JSON.parse(atob(base64)) as SessionUser;
  return user;
}

export async function register(email: string, password: string, name?: string): Promise<void> {
  try {
    await api.auth.register.$post({ email, password, name });
  } catch (e) {
    throw new Error((e as Error).message || "Registration failed");
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.auth.forgotPassword.$post({ email });
}

export function logout() {
  ls.authToken = undefined;
  user = null;
}

export function initAuth() {
  const token = ls.authToken;
  if (token) {
    try {
      const parts = token.split(".");
      const encodedPayload = parts[0];
      if (encodedPayload) {
        const pad = encodedPayload.length % 4 === 0 ? "" : "=".repeat(4 - (encodedPayload.length % 4));
        const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/") + pad;
        const payload = JSON.parse(atob(base64)) as SessionUser & { exp: number };

        if (payload.exp && Date.now() < payload.exp) {
          user = payload;
        } else {
          ls.authToken = undefined;
        }
      }
    } catch {
      ls.authToken = undefined;
    }
  }
}
