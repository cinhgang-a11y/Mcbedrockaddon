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
} from "./curseforge.js";

const app = express();
const PORT = process.env.PORT || 8787;
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: CLIENT_ORIGIN }));

function handleErrors(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof CurseForgeError) {
        res.status(err.status || 500).json({ error: err.message, configured: isConfigured() });
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

app.get(
  "/api/categories",
  handleErrors(async (req, res) => {
    const categories = await resolveBedrockCategories();
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
    });
    res.json(result);
  })
);

app.get(
  "/api/mods/:modId",
  handleErrors(async (req, res) => {
    const mod = await getMod(req.params.modId);
    res.json(mod);
  })
);

app.get(
  "/api/mods/:modId/description",
  handleErrors(async (req, res) => {
    const description = await getModDescription(req.params.modId);
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
    });
    res.json(files);
  })
);

app.listen(PORT, () => {
  console.log(`Bedrock Hub API listening on http://localhost:${PORT}`);
  console.log(`CurseForge API key configured: ${isConfigured()}`);
});
