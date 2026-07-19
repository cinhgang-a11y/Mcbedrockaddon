import type { FilesResponse, HealthResponse, Section, SearchResponse } from "./types";
import { getStoredKey } from "./keyStore";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";
export { API_BASE };

class ApiError extends Error {
  status: number;
  unconfigured: boolean;
  invalidKey: boolean;
  constructor(message: string, status: number, unconfigured: boolean, invalidKey: boolean) {
    super(message);
    this.status = status;
    this.unconfigured = unconfigured;
    this.invalidKey = invalidKey;
  }
}

async function request<T>(path: string): Promise<T> {
  const storedKey = getStoredKey();
  const headers: HeadersInit = storedKey ? { "x-curseforge-key": storedKey } : {};
  const res = await fetch(`${API_BASE}${path}`, { headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      body.error || res.statusText,
      res.status,
      Boolean(body.unconfigured),
      Boolean(body.invalidKey)
    );
  }
  return body as T;
}

export function getHealth() {
  return request<HealthResponse>("/api/health");
}

// Confirms a key actually works against CurseForge before we save it, so the
// Settings screen can give an immediate yes/no instead of silently storing a
// key that later fails.
export async function validateKey(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/validate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || res.statusText, res.status, false, true);
  }
}

export function searchMods(section: Section, query: string, index = 0, pageSize = 20) {
  const params = new URLSearchParams({
    section,
    query,
    index: String(index),
    pageSize: String(pageSize),
  });
  return request<SearchResponse>(`/api/search?${params.toString()}`);
}

export function getMod(modId: number | string) {
  return request<import("./types").CfMod>(`/api/mods/${modId}`);
}

export function getModDescription(modId: number | string) {
  return request<{ description: string }>(`/api/mods/${modId}/description`);
}

export function getModFiles(modId: number | string) {
  return request<FilesResponse>(`/api/mods/${modId}/files`);
}

export { ApiError };
