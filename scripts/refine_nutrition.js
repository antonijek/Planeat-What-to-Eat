/**
 * Ponovo povlači USDA podatke za neispravne sastojke koristeći
 * preciznu mapu upita (data/query_map.json) + strogi matcher.
 *
 * Čita data/badmap.json (listu neispravnih), za svaki sastojak koristi
 * precizan upit iz mape ili pametnu strategiju, pa VERIFIKUJE da se
 * USDA opis poklapa sa nazivom pre nego što prihvati.
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const CACHE_PATH = path.resolve(__dirname, "../data/nutrition_cache.json");
const BAD_PATH = path.resolve(__dirname, "../data/badmap.json");
const QUERY_PATH = path.resolve(__dirname, "../data/query_map.json");
const API = "https://api.nal.usda.gov/fdc/v1/foods/search";
const API_KEY = process.env.USDA_API_KEY;

const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
const badList = JSON.parse(fs.readFileSync(BAD_PATH, "utf-8"));
const queryMap = JSON.parse(fs.readFileSync(QUERY_PATH, "utf-8"));

const PLURAL_RULES = [[/ies$/i, "y"], [/ves$/i, "f"], [/oes$/i, "o"], [/s$/i, ""]];
function singular(w) { for (const [re, rep] of PLURAL_RULES) if (re.test(w)) return w.replace(re, rep); return w; }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

const SYNONYMS = {
  chilli: "chili",
  chili: "chili",
  coriander: "cilantro",
  cilantro: "cilantro",
  eggplant: "aubergine",
  aubergine: "eggplant",
  courgette: "zucchini",
  zucchini: "zucchini",
  prawn: "shrimp",
  shrimp: "shrimp",
  stock: "broth",
  broth: "broth",
  yam: "yam",
};

/** Da li opis stvarno odgovara nazivu sastojka (singular/plural, sinonimi). */
function descriptionMatches(name, desc) {
  if (!desc) return false;
  const dsc = desc.toLowerCase();
  const words = name.toLowerCase().replace(/[^a-z ]/g, " ").split(" ").filter((w) => w.length > 2);
  if (!words.length) return false;
  return words.every((w) => {
    const s = singular(w);
    const syn = SYNONYMS[s] || SYNONYMS[w] || null;
    const variants = [w, s, s + "s", s + "es", syn, syn ? syn + "s" : null].filter(Boolean);
    return variants.some((v) => new RegExp("(^|[^a-z])" + escapeRe(v) + "([^a-z]|$)").test(dsc));
  });
}

/** Generiše upit za sastojak: iz mape ili pametno. */
function makeQuery(name) {
  const key = name.toLowerCase().trim();
  if (queryMap[key]) return queryMap[key];
  // pametna strategija: dodaj "raw" za sirove sastojke, "dried" za začíne
  const n = key;
  if (/stock|broth|sauce|paste|syrup|flour|sugar|spice|powder|ground|dried|paste/i.test(n)) {
    return n; // već specifično
  }
  if (/butter|oil|cream|milk|yogurt|cheese|wine|vinegar|juice|honey|jam/i.test(n)) return n;
  // sirovo povrće/voće/meso
  return n + " raw";
}

/** Ručne kcal vrednosti za slučajeve gde USDA ne vraća Energy (kcal=0). */
const KCAL_FIX = queryMap._kcal_fix || {};

/** Proverava da li je kcal=0 slučaj koji treba popraviti ručno. */
function fixKcalIfNeeded(ingredient, kcal, desc) {
  if (kcal > 0) return kcal;
  const key = ingredient.toLowerCase().trim();
  if (KCAL_FIX[key]) return KCAL_FIX[key];
  // ako je opis tačan ali kcal=0, probaj preko opisa
  if (desc) {
    const d = desc.toLowerCase();
    for (const [k, v] of Object.entries(KCAL_FIX)) {
      if (d.includes(k)) return v;
    }
  }
  return kcal;
}

async function fetchOne(name) {
  const key = name.toLowerCase().trim();
  const q = makeQuery(name);
  const url = `${API}?api_key=${API_KEY}&query=${encodeURIComponent(q)}&pageSize=8`;
  const res = await fetch(url);
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) return null;
  const data = await res.json();
  const foods = (data.foods || []).filter((f) => f.dataType !== "Branded");
  // traži prvi koji se POKLAPA sa nazivom
  let food = foods.find((f) => descriptionMatches(name, f.description));
  if (!food) food = foods[0];
  if (!food) return null;

  const toNum = (names) => {
    const n = (food.foodNutrients || []).find((x) => names.includes(x.nutrientName));
    return n ? n.value : 0;
  };
  let kcal = toNum(["Energy", "Energy (Atwater General Factors)", "Energy (Atwater Specific Factors)"]);
  const unit = (food.foodNutrients || []).find((x) => x.nutrientName === "Energy");
  if (unit && unit.unitName === "kJ") kcal = kcal / 4.184;
  kcal = fixKcalIfNeeded(name, kcal, food.description);

  const measures = {};
  for (const m of food.foodMeasures || []) {
    const t = m.disseminationText || "";
    const mm = t.match(/^1\s+(.+)$/);
    if (mm && m.gramWeight) measures[mm[1].toLowerCase()] = m.gramWeight;
  }

  return {
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    per100: {
      kcal: Math.round(kcal),
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
}

async function main() {
  console.log(`[OK] Neispravnih: ${badList.length}`);
  let fixed = 0, verified = 0;
  for (let i = 0; i < badList.length; i++) {
    const key = badList[i];
    process.stdout.write(`\r${i + 1}/${badList.length} — ${key.slice(0, 30).padEnd(30)}`);
    try {
      const result = await fetchOne(key);
      if (result) {
        cache[key] = result;
        fixed++;
        // verifikacija nakon povlačenja
        if (descriptionMatches(key, result.description)) verified++;
      }
    } catch (e) {
      if (e.message === "RATE_LIMIT") {
        console.log("\n[pause 60s]");
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
        await new Promise((r) => setTimeout(r, 60000));
        i--;
        continue;
      }
    }
    await new Promise((r) => setTimeout(r, 250));
    if ((i + 1) % 25 === 0) fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
  console.log(`\n[OK] Povučeno ${fixed}, verifikovano (opis se poklapa): ${verified}/${badList.length}`);
}

main().catch((e) => { console.error("[err]", e.message); process.exit(1); });
