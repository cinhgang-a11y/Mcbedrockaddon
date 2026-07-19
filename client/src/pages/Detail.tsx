import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { getMod, getModDescription, getModFiles } from "../api";
import { DownloadButton } from "../components/DownloadButton";
import type { CfFile, CfMod, Section } from "../types";

export function Detail() {
  const { section, id } = useParams<{ section: Section; id: string }>();
  const [mod, setMod] = useState<CfMod | null>(null);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<CfFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setMod(null);
    setError(null);
    Promise.all([getMod(id), getModDescription(id), getModFiles(id)])
      .then(([modData, descData, filesData]) => {
        setMod(modData);
        setDescription(descData.description);
        setFiles(filesData.data);
      })
      .catch((err) => setError(err.message || "Failed to load."));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!mod) return <p className="loading">Loading...</p>;

  const sortedFiles = [...files].sort(
    (a, b) => new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime()
  );

  return (
    <div className="detail">
      <Link to={`/${section}`} className="back-link">
        &larr; Back
      </Link>

      <div className="detail__header">
        {mod.logo?.url && <img className="detail__logo" src={mod.logo.url} alt="" />}
        <div>
          <h1>{mod.name}</h1>
          <p className="detail__summary">{mod.summary}</p>
          <div className="detail__meta">
            <span>{mod.authors?.[0]?.name}</span>
            <span>{mod.downloadCount.toLocaleString()} downloads</span>
            {mod.links?.websiteUrl && (
              <a href={mod.links.websiteUrl} target="_blank" rel="noopener noreferrer">
                View on CurseForge
              </a>
            )}
          </div>
        </div>
      </div>

      {mod.screenshots && mod.screenshots.length > 0 && (
        <div className="gallery">
          {mod.screenshots.map((shot, i) => (
            <img key={i} src={shot.thumbnailUrl || shot.url} alt={shot.title || ""} loading="lazy" />
          ))}
        </div>
      )}

      <section>
        <h2>Files</h2>
        {sortedFiles.length === 0 && <p>No downloadable files found for this project.</p>}
        <div className="files">
          {sortedFiles.map((file) => (
            <DownloadButton key={file.id} file={file} mod={mod} />
          ))}
        </div>
      </section>

      <section>
        <h2>Description</h2>
        <div
          className="detail__description"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        />
      </section>
    </div>
  );
}
