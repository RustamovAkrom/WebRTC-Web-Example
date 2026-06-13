// api.js — backend REST API bilan ishlovchi yengil fetch o'rovchisi.
// Hamma so'rov `/api` ostiga, cookie bilan (credentials: include) yuboriladi.

const BASE = "/api";

async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // httpOnly sessiya cookie'si yuborilsin
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 yoki bo'sh javob
  if (res.status === 204) return null;

  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `Xatolik (${res.status})`;
    const err = new Error(typeof message === "string" ? message : "Xatolik");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body }),
  patch: (p, body) => request(p, { method: "PATCH", body }),

  // Auth
  me: () => request("/auth/me"),
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  logout: () => request("/auth/logout", { method: "POST" }),
  wsTicket: () => request("/auth/ws-ticket"),

  // Rooms
  getRoom: (slug) => request(`/rooms/${encodeURIComponent(slug)}`),
  claimRoom: (body) => request("/rooms", { method: "POST", body }),
};
