import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BASE}/api`;

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// bearer token fallback (in case cookie is not set / different origin)
let bearer = null;
try {
  bearer = typeof window !== "undefined" ? window.localStorage.getItem("nest_token") : null;
} catch (_) { /* ignore */ }
if (bearer) api.defaults.headers.common.Authorization = `Bearer ${bearer}`;

export function setBearer(token) {
  bearer = token;
  try { window.localStorage.setItem("nest_token", token); } catch (_) {}
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}
export function clearBearer() {
  bearer = null;
  try { window.localStorage.removeItem("nest_token"); } catch (_) {}
  delete api.defaults.headers.common.Authorization;
}

export function toApiError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((x) => x?.msg || JSON.stringify(x)).join(" ");
  return String(detail);
}

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE}${path}`;
}
