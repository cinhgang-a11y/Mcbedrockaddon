import type { Section } from "../types";

interface Props {
  section: Section;
  query: string;
}

interface Source {
  name: string;
  buildUrl(section: Section, query: string): string;
}

// None of these sites offer a public API we can use in-app: Planet
// Minecraft has no API at all, and both MCPEDL's and ModBay's own Terms of
// Use explicitly forbid pulling their content into another app or site
// (MCPEDL bans "sidestep[ping] the regular interfaces" to its data; ModBay
// bans using the site "to build a similar or competitive website"). So
// instead of in-app browsing, these just link to a pre-filled search on
// each site directly.
const SOURCES: Source[] = [
  {
    name: "Planet Minecraft",
    buildUrl: (section, query) =>
      query
        ? `https://www.planetminecraft.com/search/?q=${encodeURIComponent(query)}&st=${section === "maps" ? "prj_worlds" : "prj_addons"}`
        : `https://www.planetminecraft.com/${section === "maps" ? "project/pmc/maps/" : "resources/bedrock-addons/"}`,
  },
  {
    name: "MCPEDL",
    buildUrl: (_section, query) => (query ? `https://mcpedl.com/?s=${encodeURIComponent(query)}` : "https://mcpedl.com/"),
  },
  {
    name: "ModBay",
    buildUrl: (_section, query) =>
      query
        ? `https://modbay.org/index.php?do=search&subaction=search&story=${encodeURIComponent(query)}`
        : "https://modbay.org/",
  },
];

export function ExternalSourceLinks({ section, query }: Props) {
  return (
    <div className="external-links">
      <p className="external-links__heading">
        More places to look (opens their site — no in-app browsing, none of them offer a public API):
      </p>
      {SOURCES.map((source) => (
        <a
          key={source.name}
          className="external-link"
          href={source.buildUrl(section, query)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Search {source.name} for more {section === "maps" ? "maps" : "add-ons"} &rarr;
        </a>
      ))}
    </div>
  );
}
