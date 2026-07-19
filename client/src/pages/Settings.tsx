import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, validateKey } from "../api";
import { clearStoredKey, getStoredKey, setStoredKey } from "../keyStore";

type Status = "idle" | "checking" | "error";

export function Settings() {
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const hasSavedKey = Boolean(getStoredKey());

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setStatus("checking");
    setError(null);
    try {
      await validateKey(key.trim());
      setStoredKey(key.trim());
      navigate("/");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiError && err.invalidKey
          ? "CurseForge rejected this key — double check you copied it correctly."
          : "Couldn't reach the server to check this key. Is the API proxy running?"
      );
    }
  }

  function handleRemove() {
    clearStoredKey();
    setKey("");
    navigate("/");
  }

  return (
    <div className="empty-state">
      <Link to="/" className="back-link">
        &larr; Back
      </Link>
      <h2>{hasSavedKey ? "Your CurseForge API key" : "Add your CurseForge API key"}</h2>

      {hasSavedKey && (
        <p>
          A key is saved in this browser. Paste a new one below to replace it, or remove it
          entirely.
        </p>
      )}

      <form onSubmit={handleSave}>
        <input
          className="search-bar"
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste your CurseForge API key"
        />
        <div className="settings__actions">
          <button className="download-btn" type="submit" disabled={status === "checking" || !key.trim()}>
            {status === "checking" ? "Checking..." : "Save"}
          </button>
          {hasSavedKey && (
            <button
              type="button"
              className="download-btn download-btn--fallback"
              onClick={handleRemove}
            >
              Remove saved key
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <p className="empty-state__note">
        Don't have a key yet? Go to{" "}
        <a href="https://console.curseforge.com/" target="_blank" rel="noopener noreferrer">
          console.curseforge.com
        </a>
        , sign up (it's free), and create one under "API Keys."
      </p>
      <p className="empty-state__note">
        This key is saved only in this browser's local storage and sent straight to this app's
        own server on each request — it's never written to any file, shared anywhere else, or
        visible to anyone else who opens this app on a different device.
      </p>
      <p className="empty-state__note">
        Why does this app need a key at all? Modrinth's public API only hosts Java Edition
        content — no Bedrock add-ons or maps exist there — and Planet Minecraft has no public
        API, so CurseForge is the only source that can power real search and one-tap downloads
        here.
      </p>
    </div>
  );
}
