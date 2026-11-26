function resolveApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  if (typeof window === "undefined") return configured;
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return configured;
  return configured.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=:|\/|$)/, `$1${host}`);
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const CSRF_STORAGE_KEY = "kamora-csrf-token";
let rememberedCsrfToken = "";

export function rememberCsrfToken(token?: string | null) {
  if (!token) return;
  rememberedCsrfToken = token;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {
    return;
  }
}

export function forgetCsrfToken() {
  rememberedCsrfToken = "";
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    return;
  }
}

export const csrfToken = () => {
  if (typeof document === "undefined") return rememberedCsrfToken;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  if (match) {
    const token = decodeURIComponent(match[1]);
    rememberCsrfToken(token);
    return token;
  }
  if (!rememberedCsrfToken && typeof window !== "undefined") {
    try {
      rememberedCsrfToken = window.localStorage.getItem(CSRF_STORAGE_KEY) ?? "";
    } catch {
      rememberedCsrfToken = "";
    }
  }
  return rememberedCsrfToken;
};

type ApiFetchOptions = RequestInit & { skipCsrf?: boolean };

function parseResponse(text: string, status: number) {
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  const message =
    typeof data === "object" && data !== null && "detail" in data
      ? String((data as { detail: unknown }).detail)
      : `Request failed with status ${status}`;
  return { data, message };
}

async function refreshCsrfToken() {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/session`, { credentials: "include" });
    if (!response.ok) return "";
    const { data } = parseResponse(await response.text(), response.status);
    if (typeof data === "object" && data !== null && "csrf_token" in data) {
      const token = (data as { csrf_token?: unknown }).csrf_token;
      if (typeof token === "string" && token) {
        rememberCsrfToken(token);
        return token;
      }
    }
  } catch {
    return "";
  }
  return "";
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipCsrf = false, headers, ...rest } = options;
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = !skipCsrf && ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const baseHeaders = new Headers(headers);

  if (!(rest.body instanceof FormData) && !baseHeaders.has("Content-Type")) {
    baseHeaders.set("Content-Type", "application/json");
  }

  const perform = (token: string) => {
    const requestHeaders = new Headers(baseHeaders);
    if (needsCsrf && token) requestHeaders.set("X-CSRF-Token", token);
    return fetch(`${API_URL}${path}`, {
      ...rest,
      method,
      headers: requestHeaders,
      credentials: "include",
    });
  };

  let response = await perform(csrfToken());
  let parsed = parseResponse(await response.text(), response.status);

  if (!response.ok && response.status === 403 && needsCsrf && parsed.message.toLowerCase().includes("csrf")) {
    const freshToken = await refreshCsrfToken();
    if (freshToken) {
      response = await perform(freshToken);
      parsed = parseResponse(await response.text(), response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, parsed.message, parsed.data);
  }

  return parsed.data as T;
}
