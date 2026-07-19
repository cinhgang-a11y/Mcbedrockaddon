const CF_BASE = "https://api.curseforge.com/v1";

// CurseForge lists "Minecraft Bedrock" as its own game (id 78022), separate
// from "Minecraft" (id 432, which is the Java Edition catalog). Bedrock
// add-ons/maps/skins live only under 78022.
const BEDROCK_GAME_ID = 78022;

// CurseForge doesn't publish stable, documented numeric class IDs for these
// top-level sections (Addons/Maps/Skins/...), so instead of hardcoding
// numbers we look them up once (per process) from the live /categories
// endpoint and cache the result.
let categoryCache = null;
let categoryCacheAt = 0;
const CATEGORY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isConfigured() {
  return Boolean(process.env.CURSEFORGE_API_KEY);
}

class CurseForgeError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CurseForgeError";
    this.status = status;
  }
}

async function cfFetch(path, searchParams = {}) {
  if (!isConfigured()) {
    throw new CurseForgeError("CurseForge API key is not configured on the server.", 503);
  }

  const url = new URL(CF_BASE + path);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.CURSEFORGE_API_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CurseForgeError(
      `CurseForge API request failed (${res.status}): ${body || res.statusText}`,
      res.status
    );
  }

  return res.json();
}

// Finds the top-level classes under the Minecraft Bedrock game (Addons,
// Maps, Skins, Texture Packs, ...) so the app can filter search results to
// each section. Top-level classes are marked `isClass: true` in CurseForge's
// response, with no `classId` of their own (everything else nests under one
// via `classId`/`parentCategoryId`).
async function resolveBedrockCategories() {
  const now = Date.now();
  if (categoryCache && now - categoryCacheAt < CATEGORY_CACHE_TTL_MS) {
    return categoryCache;
  }

  const json = await cfFetch("/categories", { gameId: BEDROCK_GAME_ID });
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

async function searchMods({ section, query, index = 0, pageSize = 20, sort = "popularity" }) {
  const categories = await resolveBedrockCategories();
  const bucket = categories[section];

  if (!bucket) {
    return {
      data: [],
      pagination: { index: 0, pageSize, resultCount: 0, totalCount: 0 },
      warning: `Could not find a CurseForge "Bedrock ${section}" category. Check /api/categories for what's available.`,
    };
  }

  const json = await cfFetch("/mods/search", {
    gameId: BEDROCK_GAME_ID,
    classId: bucket.id,
    searchFilter: query,
    index,
    pageSize,
    sortField: SORT_FIELDS[sort] || SORT_FIELDS.popularity,
    sortOrder: "desc",
  });

  return json;
}

async function getMod(modId) {
  const json = await cfFetch(`/mods/${modId}`);
  return json.data;
}

async function getModDescription(modId) {
  const json = await cfFetch(`/mods/${modId}/description`);
  return json.data;
}

async function getModFiles(modId, { index = 0, pageSize = 20 } = {}) {
  const json = await cfFetch(`/mods/${modId}/files`, { index, pageSize });
  return json;
}

export { CurseForgeError, resolveBedrockCategories, searchMods, getMod, getModDescription, getModFiles };
