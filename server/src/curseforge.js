const CF_BASE = "https://api.curseforge.com/v1";

// CurseForge lists "Minecraft Bedrock" as its own game (id 78022), separate
// from "Minecraft" (id 432, which is the Java Edition catalog). Bedrock
// add-ons/maps/skins live only under 78022.
const BEDROCK_GAME_ID = 78022;

// CurseForge doesn't publish stable, documented numeric class IDs for these
// top-level sections (Addons/Maps/Skins/...), so instead of hardcoding
// numbers we look them up once (per process) from the live /categories
// endpoint and cache the result. The category list itself is the same no
// matter whose key is used, so it's safe to share across all callers.
let categoryCache = null;
let categoryCacheAt = 0;
const CATEGORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// A key can come from the server's own environment (self-hosted/dev setup)
// or from the browser, sent per-request (the in-app "add your key" flow).
// The per-request key always wins so one deployment can serve whichever key
// a given visitor has saved in their own browser.
function resolveKey(requestKey) {
  return requestKey || process.env.CURSEFORGE_API_KEY || null;
}

export function isConfigured() {
  return Boolean(process.env.CURSEFORGE_API_KEY);
}

class CurseForgeError extends Error {
  constructor(message, status, { unconfigured = false, invalidKey = false } = {}) {
    super(message);
    this.name = "CurseForgeError";
    this.status = status;
    this.unconfigured = unconfigured;
    this.invalidKey = invalidKey;
  }
}

async function cfFetch(path, searchParams = {}, requestKey) {
  const key = resolveKey(requestKey);
  if (!key) {
    throw new CurseForgeError("No CurseForge API key was provided.", 401, { unconfigured: true });
  }

  const url = new URL(CF_BASE + path);
  for (const [k, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(k, value);
    }
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-api-key": key,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new CurseForgeError("CurseForge rejected this API key.", res.status, { invalidKey: true });
    }
    throw new CurseForgeError(
      `CurseForge API request failed (${res.status}): ${body || res.statusText}`,
      res.status
    );
  }

  return res.json();
}

// Confirms a key actually works by making the cheapest possible authenticated
// call, so the UI can tell the user immediately instead of silently saving a
// key that turns out to be wrong.
async function validateKey(requestKey) {
  await cfFetch(`/games/${BEDROCK_GAME_ID}`, {}, requestKey);
  return true;
}

// Finds the top-level classes under the Minecraft Bedrock game (Addons,
// Maps, Skins, Texture Packs, ...) so the app can filter search results to
// each section. Top-level classes are marked `isClass: true` in CurseForge's
// response, with no `classId` of their own (everything else nests under one
// via `classId`/`parentCategoryId`).
async function resolveBedrockCategories(requestKey) {
  const now = Date.now();
  if (categoryCache && now - categoryCacheAt < CATEGORY_CACHE_TTL_MS) {
    return categoryCache;
  }

  const json = await cfFetch("/categories", { gameId: BEDROCK_GAME_ID }, requestKey);
  const categories = json.data || [];
  const topLevel = categories.filter((c) => c.isClass);

  const findBy = (pattern) => topLevel.find((c) => pattern.test(c.name)) || null;

  const resolved = {
    addons: findBy(/^add-?ons?$/i),
    maps: findBy(/^maps?$/i),
    skins: findBy(/^skins?$/i),
    textures: findBy(/texture/i),
    all: topLevel,
  };

  categoryCache = resolved;
  categoryCacheAt = now;
  return resolved;
}

const SORT_FIELDS = {
  popularity: 2,
  updated: 3,
  name: 4,
  downloads: 6,
};

async function searchMods({ section, query, index = 0, pageSize = 20, sort = "popularity", requestKey }) {
  const categories = await resolveBedrockCategories(requestKey);
  const bucket = categories[section];

  if (!bucket) {
    return {
      data: [],
      pagination: { index: 0, pageSize, resultCount: 0, totalCount: 0 },
      warning: `Could not find a CurseForge "Bedrock ${section}" category. Check /api/categories for what's available.`,
    };
  }

  const json = await cfFetch(
    "/mods/search",
    {
      gameId: BEDROCK_GAME_ID,
      classId: bucket.id,
      searchFilter: query,
      index,
      pageSize,
      sortField: SORT_FIELDS[sort] || SORT_FIELDS.popularity,
      sortOrder: "desc",
    },
    requestKey
  );

  return json;
}

async function getMod(modId, requestKey) {
  const json = await cfFetch(`/mods/${modId}`, {}, requestKey);
  return json.data;
}

async function getModDescription(modId, requestKey) {
  const json = await cfFetch(`/mods/${modId}/description`, {}, requestKey);
  return json.data;
}

async function getModFiles(modId, { index = 0, pageSize = 20, requestKey } = {}) {
  const json = await cfFetch(`/mods/${modId}/files`, { index, pageSize }, requestKey);
  return json;
}

// CurseForge's CDN (edge.forgecdn.net) started requiring the x-api-key
// header on the file request itself, not just on the metadata API calls —
// something a plain <a href> download link can never send, since browsers
// don't let links attach custom headers. So instead of linking the browser
// straight at edge.forgecdn.net, the client links here: we make the
// authenticated request server-side and hand back the 302's Location, which
// points at mediafilez.forgecdn.net — a genuinely public URL the browser can
// then download directly (no further auth, no proxying gigabytes of file
// bytes through this server).
async function resolveDownloadUrl(edgeUrl, requestKey) {
  const key = resolveKey(requestKey);
  if (!key) {
    throw new CurseForgeError("No CurseForge API key was provided.", 401, { unconfigured: true });
  }

  const res = await fetch(edgeUrl, {
    headers: { "x-api-key": key },
    redirect: "manual",
  });

  if (res.status === 401 || res.status === 403) {
    throw new CurseForgeError("CurseForge rejected this API key.", res.status, { invalidKey: true });
  }
  const location = res.headers.get("location");
  if (!(res.status >= 300 && res.status < 400) || !location) {
    throw new CurseForgeError(`Unexpected response resolving download (${res.status}).`, 502);
  }
  return location;
}

export {
  CurseForgeError,
  resolveBedrockCategories,
  searchMods,
  getMod,
  getModDescription,
  getModFiles,
  validateKey,
  resolveDownloadUrl,
};
