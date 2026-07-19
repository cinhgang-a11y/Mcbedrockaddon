import { useEffect, useState } from "react";
import { ApiError, getHealth, searchMods } from "../api";
import { CategoryTabs } from "../components/CategoryTabs";
import { SearchBar } from "../components/SearchBar";
import { AddonCard } from "../components/AddonCard";
import { EmptyState } from "../components/EmptyState";
import { PlanetMinecraftLink } from "../components/PlanetMinecraftLink";
import type { CfMod, Section } from "../types";

export function Home() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("addons");
  const [query, setQuery] = useState("");
  const [mods, setMods] = useState<CfMod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then((h) => setConfigured(h.curseforgeConfigured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      searchMods(section, query)
        .then((res) => setMods(res.data))
        .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [configured, section, query]);

  if (configured === null) {
    return <div className="loading">Loading...</div>;
  }

  if (!configured) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="toolbar">
        <CategoryTabs value={section} onChange={setSection} />
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={section === "maps" ? "Search Bedrock maps..." : "Search Bedrock add-ons..."}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="loading">Loading...</p>}

      {!loading && !error && mods.length === 0 && <p className="loading">No results found.</p>}

      <div className="grid">
        {mods.map((mod) => (
          <AddonCard key={mod.id} mod={mod} section={section} />
        ))}
      </div>

      <PlanetMinecraftLink section={section} query={query} />
    </div>
  );
}
