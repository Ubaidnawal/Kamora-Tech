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

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipCsrf = false, headers, ...rest } = options;
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = !skipCsrf && ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const requestHeaders = new Headers(headers);

  if (!(rest.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (needsCsrf) {
    const token = csrfToken();
    if (token) requestHeaders.set("X-CSRF-Token", token);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    headers: requestHeaders,
    credentials: "include",
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}
