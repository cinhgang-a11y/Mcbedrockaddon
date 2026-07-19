import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  CurseForgeError,
  isConfigured,
  resolveBedrockCategories,
  searchMods,
  getMod,
  getModDescription,
  getModFiles,
  validateKey,
} from "./curseforge.js";

const app = express();
const PORT = process.env.PORT || 8787;
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// A visitor's own CurseForge key, saved in their browser, is sent per-request
// via this header. It always takes priority over the server's own env key
// (see curseforge.js `resolveKey`), so one deployment works for anyone who's
// added their own key in the app, with or without a server-side key set.
function requestKey(req) {
  const header = req.header("x-curseforge-key");
  return header ? header.trim() : undefined;
}

function handleErrors(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof CurseForgeError) {
        res.status(err.status || 500).json({
          error: err.message,
          unconfigured: Boolean(err.unconfigured),
          invalidKey: Boolean(err.invalidKey),
        });
      } else {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, curseforgeConfigured: isConfigured() });
});

app.post(
  "/api/validate-key",
  handleErrors(async (req, res) => {
    const key = req.body?.key;
    if (!key) {
      return res.status(400).json({ error: "No key provided" });
    }
    await validateKey(key);
    res.json({ ok: true });
  })
);

app.get(
  "/api/categories",
  handleErrors(async (req, res) => {
    const categories = await resolveBedrockCategories(requestKey(req));
    res.json(categories);
  })
);

app.get(
  "/api/search",
  handleErrors(async (req, res) => {
    const { section = "addons", query = "", index = "0", pageSize = "20", sort = "popularity" } = req.query;
    if (!["addons", "maps", "skins", "textures"].includes(section)) {
      return res.status(400).json({ error: "Invalid section" });
    }
    const result = await searchMods({
      section,
      query,
      index: Number(index),
      pageSize: Number(pageSize),
      sort,
      requestKey: requestKey(req),
    });
    res.json(result);
  })
);

app.get(
  "/api/mods/:modId",
  handleErrors(async (req, res) => {
    const mod = await getMod(req.params.modId, requestKey(req));
    res.json(mod);
  })
);

app.get(
  "/api/mods/:modId/description",
  handleErrors(async (req, res) => {
    const description = await getModDescription(req.params.modId, requestKey(req));
    res.json({ description });
  })
);

app.get(
  "/api/mods/:modId/files",
  handleErrors(async (req, res) => {
    const { index = "0", pageSize = "20" } = req.query;
    const files = await getModFiles(req.params.modId, {
      index: Number(index),
      pageSize: Number(pageSize),
      requestKey: requestKey(req),
    });
    res.json(files);
  })
);

app.listen(PORT, () => {
  console.log(`Bedrock Hub API listening on http://localhost:${PORT}`);
  console.log(`CurseForge API key configured (server env): ${isConfigured()}`);
});
