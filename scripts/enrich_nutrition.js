/**
 * Obogaćivanje recepata nutritivnim podacima iz USDA FoodData Central.
 *
 * Za svaki JEDINSTVENI sastojak radi JEDAN API poziv koji vraća:
 *  - foodNutrients: kcal/protein/fat/carbs (i vlakna, šećer, Na, holesterol) po 100g
 *  - foodMeasures:  kućne mere -> gramWeight (tačna konverzija "1 cup"=160g itd.)
 *
 * Zatim:
 *  - konvertuje sve mere sastojaka u grame (tamo gde je moguće)
 *  - računa makronutrijente po receptu
 *  - upisuje u data/recipes.json
 *
 * Kešira sve u data/nutrition_cache.json — ponovno pokretanje nastavlja
 * tamo gde je stalo (bez trošenja API limita).
 *
 * Napomena: "pinch", "handful", "diced" i sl. USDA nema -> procena iz
 * lokalne tabele. Rezultati su orijentacioni, ne medicinski.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DATA_PATH = path.resolve(__dirname, "../data/recipes.json");
const CACHE_PATH = path.resolve(__dirname, "../data/nutrition_cache.json");
const API = "https://api.nal.usda.gov/fdc/v1/foods/search";
const API_KEY = process.env.USDA_API_KEY;

// ===== Keš =====
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    cache = {};
  }
}
function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
}

// ===== Normalizacija naziva (singular, bez prideva) =====
const PLURAL_RULES = [
  [/ies$/i, "y"], // berries->berry, cherries->cherry
  [/ves$/i, "f"], // leaves->leaf, halves->half
  [/oes$/i, "o"], // potatoes->potato, tomatoes->tomato
  [/s$/i, ""],    // onions->onion, cups->cup
];
function normalizeIngredient(name) {
  let n = name.toLowerCase().trim();
  // ukloni opisne reči
  n = n.replace(/\b(fresh|raw|cooked|dried|ground|minced|finely|diced|sliced|chopped|peeled|crushed|small|medium|large|whole|boneless|skinless|halved|thin|thick|roughly|finely|extra|virgin|all purpose|plain|unsalted|salted|light|dark)\b/g, " ");
  n = n.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!n) return name.toLowerCase().trim();
  // singular — samo zadnja reč (glavna namirnica)
  const words = n.split(" ");
  words[words.length - 1] = singular(words[words.length - 1]);
  return words.join(" ").trim();
}
function singular(word) {
  for (const [re, rep] of PLURAL_RULES) {
    if (re.test(word)) return word.replace(re, rep);
  }
  return word;
}

// ===== USDA poziv =====
async function fetchIngredient(ingredient) {
  const key = ingredient.toLowerCase().trim();
  // preskoči već pronađene sa sirovim tipom; ponovo pitaj Branded i missing
  const existing = cache[key];
  if (existing && !existing.missing && existing.dataType && existing.dataType !== "Branded") return existing;
  try {
    const q = normalizeIngredient(ingredient);
    const url = `${API}?api_key=${API_KEY}&query=${encodeURIComponent(q)}&pageSize=5`;
    const res = await fetch(url);
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const foods = data.foods || [];
    if (foods.length === 0) {
      cache[key] = { missing: true };
      return cache[key];
    }
    // biraj najbolji: preferiraj sirove sastojke (Survey/FNDDS, Foundation, SR Legacy)
    // nad gotovim proizvodima (Branded) koji su često pogrešni
    const base = singular(normalizeIngredient(ingredient).split(" ").pop());
    const scored = foods
      .map((f) => {
        const d = f.description.toLowerCase();
        const nameMatch = d.includes(base) || base.includes(d.split(",")[0].trim());
        const isBranded = f.dataType === "Branded";
        const isRaw = !isBranded;
        const score = (nameMatch ? 10 : 0) + (isRaw ? 5 : 0) + (f.dataType === "Survey (FNDDS)" ? 3 : 0);
        return { f, score };
      })
      .sort((a, b) => b.score - a.score);
    const best = scored.find((s) => s.score > 0) || scored[0];
    const food = best ? best.f : foods[0];

    const toNum = (names) => {
      const n = (food.foodNutrients || []).find((x) => names.includes(x.nutrientName));
      return n ? n.value : 0;
    };

    // mere -> gramaža
    const measures = {};
    for (const m of food.foodMeasures || []) {
      const t = m.disseminationText || "";
      const mm = t.match(/^1\s+(.+)$/);
      if (mm && m.gramWeight) measures[mm[1].toLowerCase()] = m.gramWeight;
    }

    const result = {
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      per100: {
        kcal: toNum(["Energy", "Energy (Atwater General Factors)", "Energy (Atwater Specific Factors)"]),
        protein: toNum(["Protein"]),
        fat: toNum(["Total lipid (fat)"]),
        carbs: toNum(["Carbohydrate, by difference"]),
        fiber: toNum(["Fiber, total dietary"]),
        sugars: toNum(["Sugars, total including NLEA", "Sugars, total"]),
        sodium: toNum(["Sodium, Na"]),
        cholesterol: toNum(["Cholesterol"]),
        satFat: toNum(["Fatty acids, total saturated"]),
      },
      measures,
    };
    cache[key] = result;
    return result;
  } catch (e) {
    if (e.message === "RATE_LIMIT") throw e;
    console.warn(`⚠ ${ingredient}: ${e.message}`);
    cache[key] = { missing: true };
    return cache[key];
  }
}

// ===== Procene za mere koje USDA nema =====
const UNIT_GRAMS = {
  g: 1, gr: 1, gram: 1, grams: 1, kg: 1000,
  ml: 1, l: 1000,
  lb: 453.6, oz: 28.35,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  tbsp: 15, tbs: 15, tablespoon: 15, tablespoons: 15, tblsp: 15,
  cup: 240, cups: 240,
  pinch: 0.3, handful: 30, packet: 5, sachet: 5,
  can: 400, cans: 400,
  slice: 20, slices: 20, fillet: 150, fillets: 150,
  clove: 3, cloves: 3,
};
const PIECE_GRAMS = {
  egg: 50, eggs: 50,
  chicken: 120, "chicken breast": 150, "chicken thigh": 130,
  onion: 110, tomato: 120, potato: 150, carrot: 70,
  pepper: 80, "bell pepper": 120, apple: 150, banana: 120,
  garlic: 3, clove: 3, cloves: 3,
};

function parseMeasure(measure) {
  if (!measure || measure === "porcija") return null;
  const s = String(measure).toLowerCase().trim();
  // ukloni unicode frakcije pre regex-a (koristi \\u escape da izbegnemo encoding probleme)
  const norm = s.replace(/\u00BC/g, " 0.25 ").replace(/\u00BD/g, " 0.5 ").replace(/\u00BE/g, " 0.75 ").replace(/\u2153/g, " 0.33 ").replace(/\u2154/g, " 0.66 ");
  const match = norm.match(/^([\d./\s]+)\s*([a-z]+)/);
  if (!match) return null;
  return { qty: evalFrac(match[1]), unit: match[2] };
}
function evalFrac(s) {
  let total = 0;
  for (const p of s.trim().split(/\s+/)) {
    if (!p) continue;
    if (p.includes("/")) {
      const [a, b] = p.split("/").map(Number);
      total += a / (b || 1);
    } else total += parseFloat(p) || 0;
  }
  return total;
}

/** Konverzija mere u grame: prvo USDA foodMeasures, pa lokalne tabele. */
function measureToGrams(ingredient, measure, usda) {
  const parsed = parseMeasure(measure);
  if (!parsed) return null;
  const { qty, unit } = parsed;
  const name = ingredient.toLowerCase();

  // 1) USDA foodMeasures ("1 cup" -> gramWeight)
  if (usda && usda.measures) {
    const unitKey = unit.endsWith("s") ? unit.slice(0, -1) : unit;
    const gram = usda.measures[unitKey] || usda.measures[unit];
    if (gram) return qty * gram;
  }
  // 2) lokalna tabela jedinica
  if (UNIT_GRAMS[unit]) return qty * UNIT_GRAMS[unit];
  // 3) procena po komadu (za "3 diced" i sl.)
  const pieceKey = Object.keys(PIECE_GRAMS).find((k) => name.includes(k));
  if (pieceKey) return qty * PIECE_GRAMS[pieceKey];
  // 4) USDA "1 whole" fallback
  if (usda && usda.measures) {
    const whole = usda.measures["whole"] || usda.measures["Quantity not specified"];
    if (whole) return qty * whole;
  }
  return null;
}

// ===== Glavni tok =====
async function main() {
  const db = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const ingredients = new Set();
  for (const r of db.recipes) for (const i of r.ingredients) ingredients.add(i.name.trim());

  const list = Array.from(ingredients);
  console.log(`🔎 ${list.length} jedinstvenih sastojaka`);

  // Prvo proveri koliko je već u kešu (resume)
  let done = 0;
  for (const ing of list) {
    if (cache[ing.toLowerCase().trim()]) done++;
  }
  console.log(`   keš: ${done} već povučeno, ostaje ${list.length - done}`);

  for (let i = 0; i < list.length; i++) {
    const ing = list[i];
    process.stdout.write(`\r${i + 1}/${list.length} — ${ing.slice(0, 35).padEnd(35)}`);
    try {
      await fetchIngredient(ing);
    } catch (e) {
      if (e.message === "RATE_LIMIT") {
        console.log("\n⏸ RATE_LIMIT — pauza 60s pa nastavak...");
        saveCache();
        await new Promise((r) => setTimeout(r, 60000));
        i--; // ponovi isti
        continue;
      }
    }
    // blaga pauza da se ne preoptereti (realni ključ ~360/h)
    await new Promise((r) => setTimeout(r, 150));
    if ((i + 1) % 50 === 0) saveCache();
  }
  saveCache();
  console.log("\n✅ USDA podaci spremljeni u keš");

  // ===== Računanje po receptima =====
  let filled = 0;
  for (const r of db.recipes) {
    let kcal = 0, protein = 0, fat = 0, carbs = 0, fiber = 0, sugar = 0, sodium = 0, chole = 0, sat = 0;
    const newIngredients = [];
    for (const ing of r.ingredients) {
      const usda = cache[ing.name.trim().toLowerCase()];
      const grams = measureToGrams(ing.name, ing.measure, usda);
      const copy = { ...ing, grams: grams != null ? Math.round(grams) : null };
      newIngredients.push(copy);
      if (!usda || !usda.per100 || grams == null) continue;
      const p100 = usda.per100;
      kcal += (p100.kcal * grams) / 100;
      protein += (p100.protein * grams) / 100;
      fat += (p100.fat * grams) / 100;
      carbs += (p100.carbs * grams) / 100;
      fiber += (p100.fiber * grams) / 100;
      sugar += (p100.sugars * grams) / 100;
      sodium += (p100.sodium * grams) / 100;
      chole += (p100.cholesterol * grams) / 100;
      sat += (p100.satFat * grams) / 100;
    }
    r.ingredients = newIngredients;
    if (kcal > 0) {
      r.calories = Math.round(kcal);
      r.protein = Math.round(protein);
      r.fats = Math.round(fat);
      r.carbs = Math.round(carbs);
      r.fiber = Math.round(fiber);
      r.sugars = Math.round(sugar);
      r.sodium = Math.round(sodium);
      r.cholesterol = Math.round(chole);
      r.saturatedFat = Math.round(sat);
      filled++;
    }
  }
  db.meta.nutritionUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
  console.log(`✅ Popunjeno ${filled}/${db.recipes.length} recepata makronutrijentima`);
}

main().catch((e) => {
  console.error("❌ Greška:", e.message);
  saveCache();
  process.exit(1);
});
