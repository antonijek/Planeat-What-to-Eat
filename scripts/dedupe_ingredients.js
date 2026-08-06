/**
 * Spaja DUPLIKATE sastojaka u jednom receptu.
 * Ako se isti sastojak pojavi 2+ puta (npr. "Butter 60g" + "Butter 30g"),
 * spaja u jedan red sa ZBIRNOM gramažom.
 */
const fs = require("fs");
const path = require("path");
const DATA_PATH = path.resolve(__dirname, "../data/recipes.json");

const db = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

let fixed = 0;
for (const r of db.recipes) {
  const map = new Map(); // name-lower -> merged ingredient
  for (const ing of r.ingredients) {
    const key = ing.name.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      // saberi gramažu ako oba imaju
      if (existing.grams != null && ing.grams != null) existing.grams += ing.grams;
      else if (existing.grams == null) existing.grams = ing.grams;
      // spoji mere tekstualno
      if (ing.measure && ing.measure !== "porcija") {
        existing.measure = existing.measure
          ? `${existing.measure} + ${ing.measure}`
          : ing.measure;
      }
      fixed++;
    } else {
      map.set(key, { ...ing });
    }
  }
  r.ingredients = Array.from(map.values());
}

db.meta.dedupedAt = new Date().toISOString();
fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
console.log(`[OK] Spojeno ${fixed} duplikata u ${db.recipes.length} recepata`);
