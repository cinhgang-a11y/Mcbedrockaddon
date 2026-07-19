import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, getHealth, searchMods } from "../api";
import { CategoryTabs } from "../components/CategoryTabs";
import { SearchBar } from "../components/SearchBar";
import { AddonCard } from "../components/AddonCard";
import { ExternalSourceLinks } from "../components/ExternalSourceLinks";
import { getStoredKey } from "../keyStore";
import type { CfMod, Section } from "../types";

export function Home() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("addons");
  const [query, setQuery] = useState("");
  const [mods, setMods] = useState<CfMod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidKey, setInvalidKey] = useState(false);

  useEffect(() => {
    if (getStoredKey()) {
      setConfigured(true);
      return;
    }
    getHealth()
      .then((h) => setConfigured(h.curseforgeConfigured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    setInvalidKey(false);
    const handle = setTimeout(() => {
      searchMods(section, query)
        .then((res) => setMods(res.data))
        .catch((err) => {
          if (err instanceof ApiError && err.invalidKey) {
            setInvalidKey(true);
          } else {
            setError(err instanceof ApiError ? err.message : "Something went wrong.");
          }
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [configured, section, query]);

  if (configured === null) {
    return <div className="loading">Loading...</div>;
  }

  if (!configured) {
    return (
      <div className="empty-state">
        <h2>Add your CurseForge API key to get started</h2>
        <p>
          This app browses real Minecraft Bedrock add-ons and maps through CurseForge's
          official API, which needs a free key of your own.
        </p>
        <Link to="/settings" className="download-btn">
          Add your key
        </Link>
      </div>
    );
  }

  if (invalidKey) {
    return (
      <div className="empty-state">
        <h2>This CurseForge key isn't working</h2>
        <p>CurseForge rejected the saved key. Update it and try again.</p>
        <Link to="/settings" className="download-btn">
          Update key
        </Link>
      </div>
    );
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

      <ExternalSourceLinks section={section} query={query} />
    </div>
  );
}
