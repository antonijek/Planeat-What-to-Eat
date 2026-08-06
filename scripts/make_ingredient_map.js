/**
 * Generiše KANONSKU MAPU (ingredient_map.json):
 * svaki sastojak -> tačan fdcId + opis + per100 (zaključano, bez pretrage).
 * Ovo je deterministički izvor — recompute koristi MAPU, ne USDA pretragu.
 */
const fs = require("fs");
const path = require("path");
const CACHE_PATH = path.resolve(__dirname, "../data/nutrition_cache.json");
const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));

const map = {};
for (const [k, c] of Object.entries(cache)) {
  if (!c || c.missing) continue;
  if (!c.per100) continue;
  map[k] = {
    fdcId: c.fdcId || null,
    description: c.description || null,
    per100: c.per100,
    measures: c.measures || {},
  };
}

fs.writeFileSync(path.resolve(__dirname, "../data/ingredient_map.json"), JSON.stringify(map, null, 1));
console.log(`[OK] Kanonska mapa: ${Object.keys(map).length} sastojaka`);
