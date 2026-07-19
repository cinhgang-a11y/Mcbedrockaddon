import type { Section } from "../types";

interface Props {
  section: Section;
  query: string;
}

// Planet Minecraft has no public API, so we can't search or download its
// content in-app without scraping (which would violate its terms of
// service). Instead we link straight to a pre-filled search on their site.
export function PlanetMinecraftLink({ section, query }: Props) {
  const url = query
    ? `https://www.planetminecraft.com/search/?q=${encodeURIComponent(query)}&st=${section === "maps" ? "prj_worlds" : "prj_addons"}`
    : `https://www.planetminecraft.com/${section === "maps" ? "project/pmc/maps/" : "resources/bedrock-addons/"}`;

  return (
    <a className="pmc-link" href={url} target="_blank" rel="noopener noreferrer">
      Also check Planet Minecraft for more {section === "maps" ? "maps" : "add-ons"} &rarr;
      <span className="pmc-link__note">(opens their site — no in-app browsing, they don't offer a public API)</span>
    </a>
  );
}
