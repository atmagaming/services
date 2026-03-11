import { goto } from "$app/navigation";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:10000";

let token: string | null = null;

export function setToken(newToken: string | null) {
  token = newToken;
  if (newToken) localStorage.setItem("auth_token", newToken);
  else localStorage.removeItem("auth_token");
}

export function getToken(): string | null {
  if (token) return token;
  if (typeof localStorage !== "undefined") {
    token = localStorage.getItem("auth_token");
  }
  return token;
}

export function clearToken() {
  token = null;
  if (typeof localStorage !== "undefined") localStorage.removeItem("auth_token");
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const currentToken = getToken();
  const headers = new Headers(options.headers);

  if (currentToken) headers.set("Authorization", `Bearer ${currentToken}`);
  if (!headers.has("content-type") && options.body && typeof options.body === "string")
    headers.set("content-type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    await goto("/login");
  }

  return response;
}

export async function apiJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API error (${response.status})${body ? `: ${body}` : ""}`);
  }
  return response.json() as Promise<T>;
}
