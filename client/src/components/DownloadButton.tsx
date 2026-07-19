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

// Bedrock registers itself as the handler for .mcaddon/.mcpack/.mcworld/
// .mctemplate files on both Android and iOS, so a plain navigation link to
// the file's direct URL is all that's needed: the browser downloads it and
// the OS then offers (or automatically opens) "Open in Minecraft" — exactly
// how CurseForge's and MCPEDL's own download buttons behave. We deliberately
// do NOT set the `download` attribute, since that can suppress the OS
// open-with handoff on some mobile browsers.
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
    <a className="download-btn" href={file.downloadUrl} target="_blank" rel="noopener noreferrer">
      <span className="download-btn__label">Download &amp; open in Minecraft</span>
      <span className="download-btn__file">
        {file.displayName} · {formatBytes(file.fileLength)} · {RELEASE_LABEL[file.releaseType]}
      </span>
    </a>
  );
}
