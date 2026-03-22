const rawBaseUrl =
  import.meta.env.VITE_REACT_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

export const API_BASE_URL = String(rawBaseUrl || "")
  .trim()
  .replace(/\/+$/, "");

export function resolveApiUrl(pathOrUrl) {
  const value = String(pathOrUrl || "").trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (!API_BASE_URL) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

export function getAccessToken() {
  try {
    return localStorage.getItem("accessToken") || "";
  } catch {
    return "";
  }
}

export async function apiFetch(pathOrUrl, options = {}) {
  const url = resolveApiUrl(pathOrUrl);
  const headers = new Headers(options.headers || {});

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}

export async function apiJson(pathOrUrl, options = {}) {
  const res = await apiFetch(pathOrUrl, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
