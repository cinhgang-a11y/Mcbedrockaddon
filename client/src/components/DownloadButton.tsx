import { API_BASE } from "../api";
import { getStoredKey } from "../keyStore";
import type { CfFile, CfMod } from "../types";

interface Props {
  file: CfFile;
  mod: CfMod;
}

const RELEASE_LABEL: Record<number, string> = { 1: "Release", 2: "Beta", 3: "Alpha" };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// CurseForge's CDN requires an x-api-key on the file request itself, which a
// plain <a href> can never send (browsers don't attach custom headers to
// link clicks). So the link points at our own /api/download instead, which
// makes that authenticated request server-side and 302s the browser to the
// real public file URL it resolves to. Bedrock registers itself as the
// handler for .mcaddon/.mcpack/.mcworld/.mctemplate files on both Android
// and iOS, so once the browser lands on that final URL it downloads and the
// OS offers (or automatically opens) "Open in Minecraft" — the redirect hop
// is transparent to that flow. We deliberately do NOT set the `download`
// attribute, since that can suppress the OS open-with handoff on some
// mobile browsers.
function buildDownloadHref(downloadUrl: string): string {
  const params = new URLSearchParams({ url: downloadUrl });
  const key = getStoredKey();
  if (key) params.set("key", key);
  return `${API_BASE}/api/download?${params.toString()}`;
}

export function DownloadButton({ file, mod }: Props) {
  if (!file.downloadUrl) {
    const fallbackUrl = `${mod.links?.websiteUrl || ""}/files/${file.id}`;
    return (
      <a className="download-btn download-btn--fallback" href={fallbackUrl} target="_blank" rel="noopener noreferrer">
        Download on CurseForge
        <span className="download-btn__file">{file.displayName}</span>
      </a>
    );
  }

  return (
    <a className="download-btn" href={buildDownloadHref(file.downloadUrl)} target="_blank" rel="noopener noreferrer">
      <span className="download-btn__label">Download &amp; open in Minecraft</span>
      <span className="download-btn__file">
        {file.displayName} · {formatBytes(file.fileLength)} · {RELEASE_LABEL[file.releaseType]}
      </span>
    </a>
  );
}
