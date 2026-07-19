import { Link } from "react-router-dom";
import type { CfMod, Section } from "../types";

interface Props {
  mod: CfMod;
  section: Section;
}

const downloadFormatter = new Intl.NumberFormat(undefined, { notation: "compact" });

export function AddonCard({ mod, section }: Props) {
  return (
    <Link to={`/${section}/${mod.id}`} className="card">
      <div className="card__thumb">
        {mod.logo?.thumbnailUrl ? (
          <img src={mod.logo.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="card__thumb card__thumb--placeholder" />
        )}
      </div>
      <div className="card__body">
        <h3 className="card__title">{mod.name}</h3>
        <p className="card__summary">{mod.summary}</p>
        <div className="card__meta">
          <span>{mod.authors?.[0]?.name}</span>
          <span>{downloadFormatter.format(mod.downloadCount)} downloads</span>
        </div>
      </div>
    </Link>
  );
}
