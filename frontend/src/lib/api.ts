"use client";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const ACCESS_TOKEN_KEY = "barstock_access_token";
const REFRESH_TOKEN_KEY = "barstock_refresh_token";
let refreshInFlight: Promise<string | null> | null = null;

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  return (base ?? "").replace(/\/$/, "");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: { access: string; refresh: string }): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function apiFetchRaw(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  return fetch(url, init);
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("failed: 401");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await apiFetchRaw("/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const payload = (await res.json().catch(() => null)) as { access?: string; refresh?: string } | null;
      const nextAccess = payload?.access;
      if (!nextAccess) {
        clearTokens();
        return null;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, nextAccess);
        if (payload?.refresh) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh);
        }
      }

      return nextAccess;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    token?: string | null;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await apiFetchRaw(path, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function apiFetchAuth<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    return await apiFetch<T>(path, { ...options, token });
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    const nextAccessToken = await refreshAccessToken();
    if (!nextAccessToken) {
      throw error;
    }

    return apiFetch<T>(path, { ...options, token: nextAccessToken });
  }
}
