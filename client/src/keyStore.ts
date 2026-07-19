// The user's CurseForge key lives only in their own browser's localStorage
// and is sent to our own proxy server per-request (see api.ts); it's never
// committed, built into the bundle, or stored anywhere server-side.
const STORAGE_KEY = "bedrockHub.curseforgeApiKey";

export function getStoredKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearStoredKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
