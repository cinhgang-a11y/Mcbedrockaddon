import type { FilesResponse, HealthResponse, Section, SearchResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";

class ApiError extends Error {
  status: number;
  configured: boolean;
  constructor(message: string, status: number, configured: boolean) {
    super(message);
    this.status = status;
    this.configured = configured;
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || res.statusText, res.status, Boolean(body.configured));
  }
  return body as T;
}

export function getHealth() {
  return request<HealthResponse>("/api/health");
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
